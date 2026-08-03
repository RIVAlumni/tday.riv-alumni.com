import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { beforeUserCreated, HttpsError } from 'firebase-functions/v2/identity';
import { z } from 'zod';

const ACCESS_LEVEL_NONE = 0;

const authUserSchema = z
  .object({
    uid: z.string().min(1),
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    displayName: z.string().trim().nullable().optional(),
  })
  .passthrough();

export const userDocumentSchema = z
  .object({
    uid: z.string().min(1),
    email: z.email().max(254),
    display_name: z.string().min(1),
    access_level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    access_expires: z.instanceof(Timestamp),
    updated_at: z.instanceof(Timestamp),
    created_at: z.instanceof(Timestamp),
  })
  .strict();

export type UserDocument = z.infer<typeof userDocumentSchema>;

/**
 * Builds the default Firestore document for a new Auth user.
 * @param {unknown} user Firebase Auth user data.
 * @param {Timestamp} createdAt Account creation timestamp.
 * @return {UserDocument} Validated user document.
 */
export function buildUserDocument(user: unknown, createdAt = Timestamp.now()): UserDocument {
  const parsedUser = authUserSchema.parse(user);

  return userDocumentSchema.parse({
    uid: parsedUser.uid,
    email: parsedUser.email,
    display_name: parsedUser.displayName || parsedUser.email,
    access_level: ACCESS_LEVEL_NONE,
    access_expires: createdAt,
    updated_at: createdAt,
    created_at: createdAt,
  });
}

/**
 * Checks whether Firestore reported an existing document.
 * @param {unknown} error Firestore write error.
 * @return {boolean} Whether the document already exists.
 */
function isAlreadyExists(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  const code = (error as { code?: number | string }).code;
  return code === 6 || code === 'already-exists';
}

/**
 * Creates a user document without overwriting existing access settings.
 * @param {unknown} user Firebase Auth user data.
 * @return {Promise<void>} Resolves after the document is handled.
 */
async function createUserDocument(user: unknown): Promise<void> {
  let data: UserDocument;
  try {
    data = buildUserDocument(user);
  } catch (error: unknown) {
    logger.warn('Auth user does not match the user schema', { error });
    throw new HttpsError('failed-precondition', 'A valid email is required.');
  }

  const app = getApps()[0] ?? initializeApp();
  const reference = getFirestore(app).doc(`users/${data.uid}`);

  try {
    await reference.create(data);
  } catch (error: unknown) {
    if (isAlreadyExists(error)) {
      logger.info('User document already exists', { uid: data.uid });
      return;
    }

    logger.error('User document creation failed', { uid: data.uid, error });
    throw new HttpsError('internal', 'The user account could not be initialized.');
  }
}

export const authBeforeUserCreated = beforeUserCreated(
  { region: 'asia-southeast1', maxInstances: 10 },
  async (event) => {
    await createUserDocument(event.data);
    return {};
  },
);
