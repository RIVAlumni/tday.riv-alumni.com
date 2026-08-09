// $lib/firebase/config.ts
import { dev } from '$app/env';

export const USE_EMULATORS = dev;

export interface FirebaseProjectConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * RIVAlumni Teachers' Day Firebase project.
 * Firebase API keys identify the project and are safe to include in the client.
 */
export const FIREBASE_CONFIG: FirebaseProjectConfig = {
  apiKey: 'AIzaSyA7q4XCbmTZ3FK1JvKpinYRU9zRchvOHP4',
  authDomain: 'auth.tday.riv-alumni.com',
  projectId: 'rivalumniops-tday',
  storageBucket: 'rivalumniops-tday.firebasestorage.app',
  messagingSenderId: '188108228168',
  appId: '1:188108228168:web:600ff2a0627d415c363a7d',
};
