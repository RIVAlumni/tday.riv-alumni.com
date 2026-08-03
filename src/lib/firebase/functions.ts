import type { Functions } from 'firebase/functions';

import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

import { getFirebaseApp } from './app';
import { USE_EMULATORS } from './config';

const FUNCTIONS_REGION = 'asia-southeast1';
let emulatorConnected = false;

export function getCallableFunctions(): Functions {
  const functions = getFunctions(getFirebaseApp(), FUNCTIONS_REGION);
  if (USE_EMULATORS && !emulatorConnected) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    emulatorConnected = true;
  }
  return functions;
}
