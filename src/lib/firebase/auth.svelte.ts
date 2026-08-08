// $lib/firebase/auth.svelte.ts
import type { User } from 'firebase/auth';

import {
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink as firebaseIsSignInWithEmailLink,
  linkWithCredential,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { getFirebaseApp } from './app';
import type { AuthStore } from './types';

const STUDENT_EMAIL_DOMAIN = '@students.edu.sg';
const EMAIL_LINK_STORAGE_KEY = 'tday-student-email';

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
  emailLinkPending = $state(false);

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
        this.emailLinkPending = false;
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

  /** Sign in anonymously as a guest. */
  async signInAsGuest(): Promise<User> {
    const auth = getAuth(getFirebaseApp());
    const result = await signInAnonymously(auth);
    return result.user;
  }

  /**
   * Send a sign-in link to a @students.edu.sg email address.
   * Stores the email in sessionStorage so we can complete sign-in
   * when the user returns via the link.
   */
  async sendStudentEmailLink(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith(STUDENT_EMAIL_DOMAIN)) {
      throw new Error(`Only ${STUDENT_EMAIL_DOMAIN} email addresses are accepted.`);
    }

    const auth = getAuth(getFirebaseApp());
    const actionCodeSettings = {
      url: `${window.location.origin}/register`,
      handleCodeInApp: false,
    };

    await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
    window.sessionStorage.setItem(EMAIL_LINK_STORAGE_KEY, normalizedEmail);
    this.emailLinkPending = true;
  }

  /**
   * Complete email link sign-in for a @students.edu.sg email.
   * If the current user is anonymous, links the email credential to
   * the existing account so the user keeps their session.
   */
  async completeStudentEmailSignIn(email: string): Promise<User> {
    const auth = getAuth(getFirebaseApp());
    const normalizedEmail = email.trim().toLowerCase();
    const emailLink = window.location.href;

    if (!firebaseIsSignInWithEmailLink(auth, emailLink)) {
      throw new Error('The current page URL is not a valid sign-in link.');
    }

    const credential = EmailAuthProvider.credentialWithLink(normalizedEmail, emailLink);

    // If we already have an anonymous user, link the credential so the
    // session is preserved and onAuthStateChanged fires with the updated user.
    if (this.user?.isAnonymous) {
      const result = await linkWithCredential(this.user, credential);
      window.sessionStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      return result.user;
    }

    // Otherwise sign in fresh (e.g. user opened link on a different device).
    const { signInWithEmailLink } = await import('firebase/auth');
    const result = await signInWithEmailLink(auth, normalizedEmail, emailLink);
    window.sessionStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
    return result.user;
  }

  /** Check whether a URL is a Firebase email sign-in link. */
  isSignInWithEmailLink(url: string): boolean {
    const auth = getAuth(getFirebaseApp());
    return firebaseIsSignInWithEmailLink(auth, url);
  }
}

// Call `init()` from onMount() before this is usable.
export const visitorAuth = new FirebaseAuthStore();
