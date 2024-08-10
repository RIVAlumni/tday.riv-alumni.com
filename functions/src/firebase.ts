import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Singleton Firebase app instance
 *
 * @remarks
 * This is to prevent hot Cloud Functions from crashing
 */
const app = getApps().length ? getApp() : initializeApp();

export const auth = getAuth(app);
export const firestore = getFirestore(app);
