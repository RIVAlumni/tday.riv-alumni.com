import { dev } from '$app/environment';
import { getApp, getApps, initializeApp } from 'firebase/app';

import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

/**
 * Firebase configuration object
 */
const firebaseConfig = Object.freeze({
	apiKey: 'AIzaSyAC4vxJzKGJhX8qKlMPOmkGsyu9hc0lFWA',
	authDomain: 'rivalumniops-tday.firebaseapp.com',
	projectId: 'rivalumniops-tday',
	storageBucket: 'rivalumniops-tday.appspot.com',
	messagingSenderId: '188108228168',
	appId: '1:188108228168:web:cf5351c488506ec6363a7d'
});

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Firebase services
 */
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app, 'asia-southeast1');

/**
 * Connect to Firebase Emulators if in development mode
 */
if (dev) {
	console.warn(`
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    ! DEVELOPMENT MODE DETECTED.          !
    ! IF YOU'RE BUILDING FOR PRODUCTION,  !
    ! THIS SHOULD BE A WARNING!           !
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  `);

	// connectAuthEmulator(auth, 'http://127.0.0.1:9099');
	// connectStorageEmulator(storage, '127.0.0.1', 9199);
	// connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
	// connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
