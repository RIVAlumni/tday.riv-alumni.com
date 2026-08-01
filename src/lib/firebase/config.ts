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
 * RIVAlumni Ops — visitor-facing Firebase project.
 * Used for public registration Google Sign-In (verified email).
 * Firebase API keys are public by design (they identify the project, not authenticate).
 */
export const VISITOR_CONFIG: FirebaseProjectConfig = {
  apiKey: 'AIzaSyD6GNLuCF6BmvLlJgcRFjpFmc35fL03SAo',
  authDomain: 'auth.ops.riv-alumni.com',
  projectId: 'rivalumniops',
  storageBucket: 'rivalumniops.appspot.com',
  messagingSenderId: '438307082557',
  appId: '1:438307082557:web:f849e564faf563a547b554',
};

/**
 * RIVAlumni Teachers' Day — internal receptionist Firebase project.
 * Used for staff login to the internal dashboard.
 */
export const INTERNAL_CONFIG: FirebaseProjectConfig = {
  apiKey: 'AIzaSyA7q4XCbmTZ3FK1JvKpinYRU9zRchvOHP4',
  authDomain: 'rivalumniops-tday.firebaseapp.com',
  projectId: 'rivalumniops-tday',
  storageBucket: 'rivalumniops-tday.firebasestorage.app',
  messagingSenderId: '188108228168',
  appId: '1:188108228168:web:600ff2a0627d415c363a7d',
};
