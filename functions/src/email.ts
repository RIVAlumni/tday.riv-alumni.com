import * as logger from 'firebase-functions/logger';

const SENDER_API_URL = 'https://api.sender.net/v2/message';
const SENDER_API_TEMPLATE = 'ejn7xv';

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
 * @param {RegistrationEmailData} data Visitor and registration details.
 * @param {string} senderApiToken Sender.net API bearer token.
 * @param {string} senderMessageId Sender.net transactional message template ID.
 */
export async function sendRegistrationEmail(
  data: RegistrationEmailData,
  senderApiToken: string,
): Promise<void> {
  if (!senderApiToken) {
    logger.warn('SENDER_API_TOKEN is empty; skipping registration email.', {
      registration_id: data.registration_id,
    });
    return;
  }

  const url = `${SENDER_API_URL}/${SENDER_API_TEMPLATE}/send`;
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
        'Authorization': `Bearer ${senderApiToken}`,
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
