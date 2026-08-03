import type { Firestore } from 'firebase/firestore';

import { getFirestore } from 'firebase/firestore';

import { getFirebaseApp } from './app';

export function getInternalFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}
