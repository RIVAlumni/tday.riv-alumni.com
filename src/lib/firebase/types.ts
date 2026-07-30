// $lib/firebase/types.ts
import type { User } from 'firebase/auth';

export type FirebaseAppName = 'visitor' | 'internal';

export interface AuthStore {
	readonly user: User | null;
	readonly loading: boolean;
	readonly error: Error | null;
	init(): void;
	destroy(): void;
	signInWithGoogle(): Promise<User>;
	signOut(): Promise<void>;
}
