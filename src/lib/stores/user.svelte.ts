import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '$lib/models/user';

import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { getInternalApp } from '$lib/firebase/app';
import { getInternalFirestore } from '$lib/firebase/firestore';

class UserStore {
  state = $state.raw<User | null | undefined>(undefined);
  authUser = $state.raw<FirebaseUser | null | undefined>(undefined);
  isSignedIn = $state(false);

  private authUnsubscribe: (() => void) | null = null;
  private userUnsubscribe: (() => void) | null = null;

  init(): void {
    if (this.authUnsubscribe) return;

    this.state = undefined;
    const auth = getAuth(getInternalApp());
    this.authUnsubscribe = onAuthStateChanged(
      auth,
      (authUser) => this.handleAuthChange(authUser),
      () => this.destroy(),
    );
  }

  destroy(): void {
    this.unsubscribe();
    this.authUser = null;
    this.isSignedIn = false;
    this.state = null;
  }

  async signInWithGoogle(): Promise<FirebaseUser> {
    this.init();
    const auth = getAuth(getInternalApp());
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    return result.user;
  }

  async signOut(): Promise<void> {
    this.unsubscribe();
    try {
      await firebaseSignOut(getAuth(getInternalApp()));
    } catch (error) {
      this.init();
      throw error;
    }
    this.authUser = null;
    this.isSignedIn = false;
    this.state = null;
  }

  private unsubscribe(): void {
    this.userUnsubscribe?.();
    this.userUnsubscribe = null;
    this.authUnsubscribe?.();
    this.authUnsubscribe = null;
  }

  private handleAuthChange(authUser: FirebaseUser | null): void {
    this.userUnsubscribe?.();
    this.userUnsubscribe = null;
    this.authUser = authUser;
    this.isSignedIn = authUser !== null;

    if (!authUser) {
      this.state = null;
      return;
    }

    this.state = undefined;
    this.userUnsubscribe = onSnapshot(
      doc(getInternalFirestore(), 'users', authUser.uid),
      (snapshot) => {
        this.state = snapshot.exists() ? (snapshot.data() as User) : null;
      },
      () => {
        this.userUnsubscribe = null;
        this.state = null;
      },
    );
  }
}

export const userStore = new UserStore();
