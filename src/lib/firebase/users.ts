import type { QueryDocumentSnapshot } from 'firebase/firestore';
import type { User } from '$lib/models/user';

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { AccessLevel } from '$lib/models/user';

import { getInternalFirestore } from './firestore';

function userFromSnapshot(snapshot: QueryDocumentSnapshot): User {
  const data = snapshot.data();
  if (
    typeof data.email !== 'string' ||
    typeof data.display_name !== 'string' ||
    typeof data.access_level !== 'number' ||
    !Object.values(AccessLevel).includes(data.access_level) ||
    !(data.access_expires instanceof Timestamp) ||
    !(data.updated_at instanceof Timestamp) ||
    !(data.created_at instanceof Timestamp)
  ) {
    throw new Error(`User ${snapshot.id} has invalid data.`);
  }

  return {
    uid: snapshot.id,
    email: data.email,
    display_name: data.display_name,
    access_level: data.access_level as AccessLevel,
    access_expires: data.access_expires,
    updated_at: data.updated_at,
    created_at: data.created_at,
  };
}

export async function fetchUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(getInternalFirestore(), 'users'));
  return snapshot.docs
    .map(userFromSnapshot)
    .sort((left, right) =>
      left.display_name.localeCompare(right.display_name, 'en-SG', { sensitivity: 'base' }),
    );
}

export async function updateUserAccessLevel(uid: string, accessLevel: AccessLevel): Promise<void> {
  if (!Object.values(AccessLevel).includes(accessLevel)) {
    throw new Error('Invalid access level.');
  }

  await updateDoc(doc(getInternalFirestore(), 'users', uid), {
    access_level: accessLevel,
    updated_at: serverTimestamp(),
  });
}

export async function updateUserAccessExpiry(uid: string, accessExpires: Timestamp): Promise<void> {
  if (!(accessExpires instanceof Timestamp)) {
    throw new Error('Invalid access expiry.');
  }

  await updateDoc(doc(getInternalFirestore(), 'users', uid), {
    access_expires: accessExpires,
    updated_at: serverTimestamp(),
  });
}
