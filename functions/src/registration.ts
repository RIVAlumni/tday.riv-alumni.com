import { randomInt } from 'node:crypto';
import { z } from 'zod';

import * as logger from 'firebase-functions/logger';

import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/https';

const REGISTRATION_ID_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const REGISTRATION_ID_LENGTH = 6;
const MAX_ID_ATTEMPTS = 3;
const MAX_MESSAGE_CHARACTERS = 10_000;
const MAX_MESSAGE_WORDS = 150;

const writtenMessageSchema = z
  .object({
    teacher_name: z.string().trim().min(1).max(120),
    message: z
      .string()
      .trim()
      .min(1)
      .max(MAX_MESSAGE_CHARACTERS)
      .refine((message) => message.split(/\s+/).filter(Boolean).length <= MAX_MESSAGE_WORDS),
  })
  .strict();

export const registrationSubmissionSchema = z
  .object({
    full_name: z.string().trim().min(1).max(120).toUpperCase(),
    contact_number: z
      .string()
      .trim()
      .regex(/^[89][0-9]{7}$/),
    graduating_year: z
      .string()
      .trim()
      .regex(/^(1999|20(0[0-9]|1[0-9]|2[0-6]))$/),
    visiting_teachers: z
      .array(z.string().trim().min(1).max(120))
      .min(1)
      .refine((teachers) => new Set(teachers).size === teachers.length),
    written_messages: z.array(writtenMessageSchema).max(2),
  })
  .strict();

const callableAuthSchema = z
  .object({
    token: z
      .object({
        email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
        email_verified: z.literal(true),
        firebase: z
          .object({
            sign_in_provider: z.literal('google.com'),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export type RegistrationSubmission = z.infer<typeof registrationSubmissionSchema>;

/**
 * Generates a six-letter public registration ID.
 * @return {string} The generated ID.
 */
export function generateRegistrationId(): string {
  let id = '';
  for (let index = 0; index < REGISTRATION_ID_LENGTH; index++) {
    id += REGISTRATION_ID_CHARACTERS[randomInt(REGISTRATION_ID_CHARACTERS.length)];
  }
  return id;
}

/**
 * Extracts the verified Google email from callable authentication data.
 * @param {unknown} auth Callable authentication data.
 * @return {string} The normalized verified email.
 */
export function getVerifiedEmail(auth: unknown): string {
  const result = callableAuthSchema.safeParse(auth);
  if (!result.success) {
    throw new HttpsError(
      'unauthenticated',
      'Sign in with a verified Google account before registering.',
    );
  }
  return result.data.token.email.trim().toLowerCase();
}

/**
 * Checks whether a Firestore write failed because the document exists.
 * @param {unknown} error The Firestore error.
 * @return {boolean} Whether the document already exists.
 */
function isAlreadyExists(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  const code = (error as { code?: number | string }).code;
  return code === 6 || code === 'already-exists';
}

/**
 * Writes a validated registration with server-controlled fields.
 * @param {RegistrationSubmission} submission Validated visitor fields.
 * @param {string} email Verified account email.
 * @return {Promise<string>} The allocated registration ID.
 */
async function writeRegistration(
  submission: RegistrationSubmission,
  email: string,
): Promise<string> {
  const app = getApps()[0] ?? initializeApp();
  const firestore = getFirestore(app);

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const registrationId = generateRegistrationId();
    const reference = firestore.doc(`events/2026/registrations/${registrationId}`);

    try {
      await reference.create({
        event_id: '2026',
        registration_id: registrationId,
        email,
        full_name: submission.full_name,
        status: 'REGISTERED',
        comments: '',
        contact_number: submission.contact_number,
        graduating_year: submission.graduating_year,
        visiting_teachers: submission.visiting_teachers,
        written_messages: submission.written_messages,
        arrived_at: null,
        updated_at: FieldValue.serverTimestamp(),
        created_at: FieldValue.serverTimestamp(),
      });
      return registrationId;
    } catch (error: unknown) {
      if (isAlreadyExists(error)) continue;
      logger.error('Registration write failed', { error });
      throw new HttpsError('internal', 'The registration could not be recorded. Please try again.');
    }
  }

  throw new HttpsError(
    'already-exists',
    'A registration ID could not be allocated. Please try again.',
  );
}

export const createRegistration2026 = onCall(async (request) => {
  const email = getVerifiedEmail(request.auth);
  const result = registrationSubmissionSchema.safeParse(request.data);
  if (!result.success) {
    throw new HttpsError(
      'invalid-argument',
      'The registration data does not meet the requirements.',
    );
  }

  const registrationId = await writeRegistration(result.data, email);
  return { registrationId };
});
