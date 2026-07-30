// $lib/firebase/firestore.ts
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getApp } from './app';
import type { FirebaseAppName } from './types';

/**
 * Returns a Firestore instance for the given Firebase app.
 * The returned instance is backed by the currently signed-in user's
 * credentials (Firebase client SDK handles this automatically).
 */
export function getFirestoreForApp(name: FirebaseAppName): Firestore {
	const app = getApp(name);
	return getFirestore(app);
}

/** Firestore instance for the visitor (public registration) project. */
export function getVisitorFirestore(): Firestore {
	return getFirestoreForApp('visitor');
}

/** Firestore instance for the internal (operator) project. */
export function getInternalFirestore(): Firestore {
	return getFirestoreForApp('internal');
}
