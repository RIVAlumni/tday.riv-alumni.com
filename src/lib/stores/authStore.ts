import type { FSUser } from '$lib/models';
import type { User as FBUser } from 'firebase/auth';

import { derived, readable } from 'svelte/store';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '$lib/firebase';
import { docStore, docUserRef } from '$lib/firebase/firestore';

/**
 * Global (session) persistent state of the authenticated user.
 *
 * On initial load, it will be `undefined` until the auth state is resolved.
 * If the user is not authenticated, it will be `null`.
 * If the user is authenticated, it will be the Firebase `AuthUser` object.
 */
export const authState = readable<FBUser | null>(undefined, (set) => {
  // Prevents running on the server
  if (typeof window === 'undefined') return;

  const unsubscribe = onAuthStateChanged(auth, set);
  return unsubscribe;
});

/**
 * Global (session) persistent state of the authenticated user document.
 *
 * On initial load, it will be `undefined` until the auth state is resolved.
 * If the user is not authenticated, it will be `null`.
 * If the user is authenticated, it will be the `FSUser` object.
 */
export const authStore = derived<typeof authState, FSUser | null>(
  authState,
  ($user, set) => {
    // Prevents running on the server
    if (typeof window === 'undefined') return;

    if ($user === undefined) return;
    if ($user === null) return set(null);

    const ref = docUserRef($user.uid);
    return docStore<FSUser>(ref).subscribe(set);
  },
);
