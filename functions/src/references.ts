import { firestore } from './firebase';

const { doc } = firestore;

export const docUserRef = (uid: string) => doc(`users/${uid}`);
