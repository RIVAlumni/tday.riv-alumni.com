import { browser } from '$app/environment';
import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { VISITOR_CONFIG, INTERNAL_CONFIG, USE_EMULATORS } from './config';
import type { FirebaseAppName } from './types';

let _emulatorsConnected = false;

function ensureBrowser(): void {
	if (!browser) {
		throw new Error(
			'Firebase client SDK can only be used in the browser. ' +
				'Check `browser` from $app/environment before calling Firebase functions.'
		);
	}
}

function getOrInitApp(config: FirebaseOptions, name: FirebaseAppName): FirebaseApp {
	ensureBrowser();
	const existing = getApps().find((a) => a.name === name);
	if (existing) return existing;
	return initializeApp(config, name);
}

function connectEmulators(): void {
	if (_emulatorsConnected || !USE_EMULATORS) return;

	for (const appName of ['visitor', 'internal'] as const) {
		const app = getOrInitApp(
			appName === 'visitor' ? VISITOR_CONFIG : INTERNAL_CONFIG,
			appName
		);
		connectAuthEmulator(getAuth(app), 'http://localhost:9099', { disableWarnings: true });
		connectFirestoreEmulator(getFirestore(app), 'localhost', 8080);
	}

	_emulatorsConnected = true;
}

export function getVisitorApp(): FirebaseApp {
	const app = getOrInitApp(VISITOR_CONFIG, 'visitor');
	connectEmulators();
	return app;
}

export function getInternalApp(): FirebaseApp {
	const app = getOrInitApp(INTERNAL_CONFIG, 'internal');
	connectEmulators();
	return app;
}

export function getApp(name: FirebaseAppName): FirebaseApp {
	return name === 'visitor' ? getVisitorApp() : getInternalApp();
}
