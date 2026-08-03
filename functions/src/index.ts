import { setGlobalOptions } from 'firebase-functions/options';

setGlobalOptions({ maxInstances: 10, region: 'asia-southeast1' });

export { createRegistration2026 } from './registration.js';
export { createUserOnAuthCreate } from './user.js';
