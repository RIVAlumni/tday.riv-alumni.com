import { dev } from '$app/environment';

import { auth } from '$lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

/**
 * Signs in the user using the Google provider.
 * @returns   A promise that resolves with the user credential.
 * @throws    If an unknown error occurs during the sign-in process.
 */
export async function signInGoogleProvider() {
  const provider = new GoogleAuthProvider();

  try {
    const signInUser = await signInWithPopup(auth, provider);
    const { user } = signInUser;
    return { user };
  } catch (error) {
    if (dev) console.error(error);
  }
}

/**
 * Signs out the current user.
 * @returns A Promise that resolves when the sign out operation is complete.
 */
export async function signOut() {
  return auth.signOut();
}
