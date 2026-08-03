export { VISITOR_CONFIG, INTERNAL_CONFIG, USE_EMULATORS } from './config';
export type { FirebaseProjectConfig } from './config';
export { getVisitorApp, getInternalApp, getApp } from './app';
export { visitorAuth } from './auth.svelte';
export { getFirestoreForApp, getVisitorFirestore, getInternalFirestore } from './firestore';
export {
  createRegistrationRecord,
  RegistrationWriteError,
  fetchConflictRegistrations,
  fetchEventStats,
  fetchRegistration,
  fetchRegistrationPage,
  searchRegistrationsById,
  checkInRegistration,
  refuseRegistration,
  flagConflict,
  updateRegistrationFields,
} from './registrations';
export type { FirebaseAppName, AuthStore } from './types';
