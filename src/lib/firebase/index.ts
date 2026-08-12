export { FIREBASE_CONFIG, USE_EMULATORS } from './config';
export type { FirebaseProjectConfig } from './config';
export { getFirebaseApp } from './app';
export { visitorAuth } from './auth.svelte';
export { getInternalFirestore } from './firestore';
export { getCallableFunctions } from './functions';
export {
  createRegistrationRecord,
  RegistrationWriteError,
  resendRegistrationEmail,
  fetchConflictRegistrations,
  fetchEventStats,
  fetchRegistration,
  fetchRegistrationPage,
  searchRegistrations,
  searchRegistrationsById,
  checkInRegistration,
  refuseRegistration,
  flagConflict,
  updateRegistrationFields,
} from './registrations';
export type {
  RegistrationPageCursor,
  RegistrationPageDirection,
  RegistrationPageOptions,
  RegistrationPageResult,
  RegistrationQueryFilters,
} from './registrations';
export type { AuthStore } from './types';
