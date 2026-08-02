export { VISITOR_CONFIG, INTERNAL_CONFIG, USE_EMULATORS } from './config';
export type { FirebaseProjectConfig } from './config';
export { getVisitorApp, getInternalApp, getApp } from './app';
export { visitorAuth, internalAuth } from './auth.svelte';
export { getFirestoreForApp, getVisitorFirestore, getInternalFirestore } from './firestore';
export { createRegistrationRecord, RegistrationWriteError } from './registrations';
export type { FirebaseAppName, AuthStore } from './types';
