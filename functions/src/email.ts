import * as logger from 'firebase-functions/logger';

const SENDER_API_TOKEN = process.env.SENDER_API_TOKEN ?? '';
const SENDER_API_URL = 'https://api.sender.net/v2/message';
const SENDER_MESSAGE_ID = process.env.SENDER_MESSAGE_ID ?? 'ejn7xv';

export interface RegistrationEmailData {
  full_name: string;
  recipient_email: string;
  contact_number: string;
  registration_id: string;
}

/**
 * Sends a registration confirmation email via the Sender.net transactional API.
 * Failures are logged silently -- the email is a side effect and must not
 * influence the registration response.
 */
export async function sendRegistrationEmail(data: RegistrationEmailData): Promise<void> {
  if (!SENDER_API_TOKEN) {
    logger.warn('SENDER_API_TOKEN environment variable is empty; skipping registration email.', {
      registration_id: data.registration_id,
    });
    return;
  }

  const url = `${SENDER_API_URL}/${SENDER_MESSAGE_ID}/send`;
  const body = JSON.stringify({
    recipient_email: data.recipient_email,
    variables: {
      full_name: data.full_name,
      email: data.recipient_email,
      contact_number: data.contact_number,
      registration_id: data.registration_id,
    },
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDER_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      logger.error('Sender.net API request failed', {
        status: response.status,
        body: errorBody,
        registration_id: data.registration_id,
      });
      return;
    }

    logger.info('Registration email sent', {
      registration_id: data.registration_id,
      recipient: data.recipient_email,
    });
  } catch (error: unknown) {
    logger.error('Sender.net API request failed', {
      error,
      registration_id: data.registration_id,
    });
  }
}
