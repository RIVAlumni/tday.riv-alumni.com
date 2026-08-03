// $lib/firebase/auth.svelte.ts
import type { User } from 'firebase/auth';

import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { getFirebaseApp } from './app';
import type { AuthStore } from './types';

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

  /** Start the auth state observer. Idempotent - safe to call multiple times. */
  init(): void {
    if (this._unsubscribe) return;

    const auth = getAuth(getFirebaseApp());

    this._unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        this.user = user;
        this.loading = false;
      },
      (error) => {
        this.error = error;
        this.loading = false;
      },
    );
  }

  /** Clean up the observer. */
  destroy(): void {
    this._unsubscribe?.();
    this._unsubscribe = null;
  }

  /** Trigger Google Sign-In popup. */
  async signInWithGoogle(): Promise<User> {
    const auth = getAuth(getFirebaseApp());
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }

  /** Sign out the current user. */
  async signOut(): Promise<void> {
    const auth = getAuth(getFirebaseApp());
    await firebaseSignOut(auth);
  }
}

// Call `init()` from onMount() before this is usable.
export const visitorAuth = new FirebaseAuthStore();
