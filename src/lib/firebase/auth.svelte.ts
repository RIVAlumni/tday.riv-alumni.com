// $lib/firebase/auth.svelte.ts
import {
	getAuth,
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	signOut as firebaseSignOut,
	type User
} from 'firebase/auth';
import { getApp } from './app';
import type { FirebaseAppName, AuthStore } from './types';

/**
 * Svelte 5 rune-based auth store for a Firebase app.
 *
 * Call `store.init()` from `onMount()` in a layout or page component
 * to start the auth observer. The store's `$state` fields react
 * automatically to auth state changes.
 */
class FirebaseAuthStore implements AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	error = $state<Error | null>(null);

	private _unsubscribe: (() => void) | null = null;
	private _appName: FirebaseAppName;

	constructor(appName: FirebaseAppName) {
		this._appName = appName;
	}

	/** Start the auth state observer. Idempotent - safe to call multiple times. */
	init(): void {
		if (this._unsubscribe) return;

		const app = getApp(this._appName);
		const auth = getAuth(app);

		this._unsubscribe = onAuthStateChanged(
			auth,
			(user) => {
				this.user = user;
				this.loading = false;
			},
			(error) => {
				this.error = error;
				this.loading = false;
			}
		);
	}

	/** Clean up the observer. */
	destroy(): void {
		this._unsubscribe?.();
		this._unsubscribe = null;
	}

	/** Trigger Google Sign-In popup. */
	async signInWithGoogle(): Promise<User> {
		const app = getApp(this._appName);
		const auth = getAuth(app);
		const provider = new GoogleAuthProvider();
		const result = await signInWithPopup(auth, provider);
		return result.user;
	}

	/** Sign out the current user. */
	async signOut(): Promise<void> {
		const app = getApp(this._appName);
		const auth = getAuth(app);
		await firebaseSignOut(auth);
	}
}

// Module-level singletons.
// Call `init()` from onMount() before these are usable.
export const internalAuth = new FirebaseAuthStore('internal');
export const visitorAuth = new FirebaseAuthStore('visitor');
