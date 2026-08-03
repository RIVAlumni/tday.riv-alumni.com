import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';

import { readFile } from 'node:fs/promises';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const RUN_RULES_TESTS = process.env.FIRESTORE_RULES_TESTS === '1';
const PROJECT_ID = 'tday-rules-test';
const REGISTRATION_ID = 'ABCDEF';

let testEnvironment: RulesTestEnvironment;

function emulatorAddress(): { host: string; port: number } {
  const [host, port = '8180'] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8180').split(
    ':',
  );
  return { host, port: Number(port) };
}

async function seedData(): Promise<void> {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    const future = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);
    const expired = Timestamp.fromMillis(Date.now() - 60 * 1000);
    const now = Timestamp.now();

    await Promise.all([
      setDoc(doc(firestore, 'users', 'operator'), {
        access_level: 1,
        access_expires: future,
      }),
      setDoc(doc(firestore, 'users', 'mediator'), {
        access_level: 2,
        access_expires: future,
      }),
      setDoc(doc(firestore, 'users', 'expired'), {
        access_level: 2,
        access_expires: expired,
      }),
      setDoc(doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID), {
        event_id: '2026',
        registration_id: REGISTRATION_ID,
        email: 'visitor@example.com',
        full_name: 'EXAMPLE VISITOR',
        status: 'REGISTERED',
        contact_number: '91234567',
        graduating_year: '2020',
        visiting_teachers: ['Mdm Chan'],
        written_messages: [],
        comments: '',
        arrived_at: null,
        created_at: now,
        updated_at: now,
      }),
    ]);
  });
}

function authenticatedFirestore(uid: string) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@example.com`,
      email_verified: true,
    })
    .firestore();
}

function publicRegistration(
  registrationId = 'BCDEFG',
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    event_id: '2026',
    registration_id: registrationId,
    email: 'new@example.com',
    full_name: 'NEW VISITOR',
    status: 'REGISTERED',
    comments: '',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    contact_number: '92345678',
    graduating_year: '2021',
    visiting_teachers: ['Mr Lim'],
    written_messages: [],
    arrived_at: null,
    ...overrides,
  };
}

describe.skipIf(!RUN_RULES_TESTS)('Firestore registration rules', () => {
  beforeAll(async () => {
    const rules = await readFile(new URL('../../../firestore.rules', import.meta.url), 'utf8');
    const { host, port } = emulatorAddress();
    testEnvironment = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules, host, port },
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await seedData();
  });

  afterAll(async () => {
    await testEnvironment?.cleanup();
  });

  it('allows an operator to get a known registration but denies collection lists', async () => {
    const firestore = authenticatedFirestore('operator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    const snapshot = await assertSucceeds(getDoc(reference));
    await assertFails(getDocs(collection(firestore, 'events', '2026', 'registrations')));

    expect(snapshot.exists()).toBe(true);
  });

  it('allows an operator to perform a reception check-in', async () => {
    const firestore = authenticatedFirestore('operator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    await assertSucceeds(
      updateDoc(reference, {
        status: 'CHECKED_IN',
        arrived_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }),
    );

    const snapshot = await assertSucceeds(getDoc(reference));
    expect(snapshot.data()?.status).toBe('CHECKED_IN');
  });

  it('denies operator edits to identity fields', async () => {
    const firestore = authenticatedFirestore('operator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    await assertFails(
      updateDoc(reference, {
        full_name: 'CHANGED NAME',
        updated_at: serverTimestamp(),
      }),
    );

    expect(true).toBe(true);
  });

  it('allows a mediator to list and edit registrations', async () => {
    const firestore = authenticatedFirestore('mediator');
    const registrations = collection(firestore, 'events', '2026', 'registrations');
    const reference = doc(registrations, REGISTRATION_ID);

    const snapshot = await assertSucceeds(getDocs(registrations));
    await assertSucceeds(
      updateDoc(reference, {
        full_name: 'UPDATED VISITOR',
        updated_at: serverTimestamp(),
      }),
    );

    expect(snapshot.size).toBe(1);
  });

  it('denies reads after access expires', async () => {
    const firestore = authenticatedFirestore('expired');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    await assertFails(getDoc(reference));

    expect(true).toBe(true);
  });

  it('denies direct registration creates', async () => {
    const unauthenticatedFirestore = testEnvironment.unauthenticatedContext().firestore();
    const authenticatedRegistrationFirestore = authenticatedFirestore('visitor');
    const unauthenticatedReference = doc(
      unauthenticatedFirestore,
      'events',
      '2026',
      'registrations',
      'BCDEFG',
    );
    const authenticatedReference = doc(
      authenticatedRegistrationFirestore,
      'events',
      '2026',
      'registrations',
      'CDEFGH',
    );

    await assertFails(setDoc(unauthenticatedReference, publicRegistration('BCDEFG')));
    await assertFails(setDoc(authenticatedReference, publicRegistration('CDEFGH')));

    expect(true).toBe(true);
  });
});
