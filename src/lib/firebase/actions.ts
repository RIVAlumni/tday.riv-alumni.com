import type { FSUser, FSRegistration } from '$lib/models';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { firestore } from '$lib/firebase';
import { colRegistrationsRef } from './firestore';

const currentYear = new Date().getFullYear().toString();

export async function actionCheckIn(
  currentUser: FSUser,
  currentRecord: FSRegistration,
) {
  const { registration_id, status, comments, arrived_at } = currentRecord;

  if (status === 'CHECKED_IN' || arrived_at !== null)
    throw new Error(
      'Already checked in. Please approach the Conflict Resolution Team for assistance.',
    );

  if (status === 'REJECTED' || arrived_at !== null)
    throw new Error(
      'Rejected or already checked in. Please approach the Conflict Resolution Team for assistance.',
    );

  if (status === 'REFUSED' || arrived_at !== null) {
    throw new Error(
      'Refused entry or already checked in. Please approach the Conflict Resolution Team for assistance.',
    );
  }

  const newRecord = {
    ...currentRecord,
    status: 'CHECKED_IN',
    comments:
      `${comments}\n\n(Check-in completed by ${currentUser.display_name?.toUpperCase()} on ${new Date().toUTCString()})`.trim(),
    arrived_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  const fsRecordRef = doc(
    firestore,
    colRegistrationsRef(currentYear).path,
    registration_id,
  );

  await setDoc(fsRecordRef, newRecord, { merge: true });
  return;
}

export async function actionRefuseEntry(
  currentUser: FSUser,
  currentRecord: FSRegistration,
) {
  const { registration_id, comments } = currentRecord;

  const newRecord = {
    ...currentRecord,
    status: 'REFUSED',
    comments:
      `${comments}\n\n(Entry refused by ${currentUser.display_name?.toUpperCase()} on ${new Date().toUTCString()})`.trim(),
    updated_at: serverTimestamp(),
  };

  const fsRecordRef = doc(
    firestore,
    colRegistrationsRef(currentYear).path,
    registration_id,
  );

  await setDoc(fsRecordRef, newRecord, { merge: true });
  return;
}

export async function actionSetConflict(
  currentUser: FSUser,
  currentRecord: FSRegistration,
) {
  const { registration_id, comments } = currentRecord;

  const newRecord = {
    ...currentRecord,
    status: 'CONFLICT',
    comments:
      `${comments}\n\n(Handover initiated by ${currentUser.display_name?.toUpperCase()} on ${new Date().toUTCString()})`.trim(),
    updated_at: serverTimestamp(),
  };

  const fsRecordRef = doc(
    firestore,
    colRegistrationsRef(currentYear).path,
    registration_id,
  );

  await setDoc(fsRecordRef, newRecord, { merge: true });
  return;
}
