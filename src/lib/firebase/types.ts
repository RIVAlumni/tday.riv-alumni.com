// $lib/firebase/types.ts
import type { User } from 'firebase/auth';

export interface AuthStore {
  readonly user: User | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly emailLinkPending: boolean;
  init(): void;
  destroy(): void;
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  signInAsGuest(): Promise<User>;
  sendStudentEmailLink(email: string): Promise<void>;
  completeStudentEmailSignIn(email: string): Promise<User>;
  isSignInWithEmailLink(url: string): boolean;
}
