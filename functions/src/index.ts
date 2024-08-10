import './firebase';
import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({
  maxInstances: 1,
  concurrency: 500,
  timeoutSeconds: 60,
  region: 'asia-southeast1',
});

export * from './auth/authBeforeUserCreated';
