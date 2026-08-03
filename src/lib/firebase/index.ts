export { FIREBASE_CONFIG, USE_EMULATORS } from './config';
export type { FirebaseProjectConfig } from './config';
export { getFirebaseApp } from './app';
export { visitorAuth } from './auth.svelte';
export { getInternalFirestore } from './firestore';
export { getCallableFunctions } from './functions';
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
export type { AuthStore } from './types';
