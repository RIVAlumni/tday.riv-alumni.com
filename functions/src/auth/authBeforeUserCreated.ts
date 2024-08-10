import type { FSUser } from '../models';

import { FieldValue } from 'firebase-admin/firestore';

import { logger } from 'firebase-functions/v2';
import { beforeUserCreated, HttpsError } from 'firebase-functions/v2/identity';

import { firestore } from '../firebase';
import { FSUserAccessLevel } from '../models';

export const authBeforeUserCreated = beforeUserCreated(async (event) => {
  logger.log(event);

  const {
    data: { uid, email = null, emailVerified = false, displayName = null },
  } = event;

  if (!email) throw new HttpsError('failed-precondition', 'Email is required');
  if (!emailVerified)
    throw new HttpsError('failed-precondition', 'Email must be verified');

  if (!email.endsWith('@riv-alumni.com'))
    throw new HttpsError(
      'failed-precondition',
      'Email must be an internal email from the organisation',
    );

  const docRef = firestore.doc(`users/${uid}`);
  const fsUser: FSUser = {
    uid,
    email,
    display_name: displayName,
    access_level: FSUserAccessLevel.None,
    access_expires: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
    created_at: FieldValue.serverTimestamp(),
  };

  try {
    logger.log(fsUser);
    await docRef.set(fsUser, { merge: true });
  } catch (error) {
    logger.error(error);
  }

  return {};
});
