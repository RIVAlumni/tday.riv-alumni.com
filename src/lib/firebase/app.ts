import type { FirebaseApp } from 'firebase/app';

import { browser } from '$app/env';
import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

import { FIREBASE_CONFIG, USE_EMULATORS } from './config';

const APP_NAME = 'tday';
let emulatorsConnected = false;

function ensureBrowser(): void {
  if (!browser) {
    throw new Error(
      'Firebase client SDK can only be used in the browser. ' +
        'Check `browser` from $app/environment before calling Firebase functions.',
    );
  }
}

function connectEmulators(app: FirebaseApp): void {
  if (emulatorsConnected || !USE_EMULATORS) return;

  connectAuthEmulator(getAuth(app), 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), 'localhost', 8080);
  emulatorsConnected = true;
}

export function getFirebaseApp(): FirebaseApp {
  ensureBrowser();
  const app =
    getApps().find((candidate) => candidate.name === APP_NAME) ??
    initializeApp(FIREBASE_CONFIG, APP_NAME);
  connectEmulators(app);
  return app;
}
