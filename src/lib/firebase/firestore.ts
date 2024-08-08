import type { DocumentReference } from 'firebase/firestore';

import { readable } from 'svelte/store';

import { firestore } from '$lib/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';

export const docUserRef = (uid: string) => doc(firestore, 'users', uid);
export const docEventsRef = (year: string) => doc(firestore, 'events', year);
export const colRegistrationsRef = (year: string) =>
  collection(firestore, 'events', year, 'registrations');

export function docStore<T>(ref: DocumentReference) {
  let unsubscribe: () => void;

  const { subscribe } = readable<T | null>(undefined, (set) => {
    unsubscribe = onSnapshot(ref, (snap) => set((snap.data() as T) ?? null));
    return () => unsubscribe();
  });

  return {
    subscribe,
    _id: ref.id,
    _path: ref.path,
  };
}
