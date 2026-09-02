import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';

import { readFile } from 'node:fs/promises';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
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
      setDoc(doc(firestore, 'users', 'administrator'), {
        uid: 'administrator',
        email: 'administrator@example.com',
        display_name: 'Test Administrator',
        access_level: 3,
        access_expires: future,
        created_at: now,
        updated_at: now,
      }),
      setDoc(doc(firestore, 'users', 'managed-user'), {
        uid: 'managed-user',
        email: 'managed-user@example.com',
        display_name: 'Managed User',
        access_level: 1,
        access_expires: future,
        created_at: now,
        updated_at: now,
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
        search_ngrams: ['e', 'ex', 'v', 'vi'],
        updates: [],
        created_at: now,
        updated_at: now,
      }),
      setDoc(doc(firestore, 'events', '2025', 'registrations', '1001'), {
        event_id: '2025',
        registration_id: 1001,
        full_name: 'LEGACY VISITOR',
        status: 'REGISTERED',
        contact_number: 91234567,
        graduating_year: 2020,
        visiting_teachers: 'Mr Lim',
        comments: '',
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

function claimDocument(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    teacher: 'Mr Lim',
    status: 'CLAIMED',
    claimed_by: { email: 'mediator@example.com', name: 'Test Mediator' },
    claimed_at: serverTimestamp(),
    completed_by: null,
    completed_at: null,
    updated_at: serverTimestamp(),
    ...overrides,
  };
}

describe.skipIf(!RUN_RULES_TESTS)('Firestore rules', () => {
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

  it('allows only administrators to list users', async () => {
    const administratorFirestore = authenticatedFirestore('administrator');
    const mediatorFirestore = authenticatedFirestore('mediator');

    const snapshot = await assertSucceeds(getDocs(collection(administratorFirestore, 'users')));
    await assertFails(getDocs(collection(mediatorFirestore, 'users')));

    expect(snapshot.size).toBe(5);
  });

  it('allows administrators to update only user management fields with a server timestamp', async () => {
    const firestore = authenticatedFirestore('administrator');
    const reference = doc(firestore, 'users', 'managed-user');
    const nextExpiry = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);

    await assertSucceeds(
      updateDoc(reference, {
        access_level: 2,
        updated_at: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(reference, {
        access_expires: nextExpiry,
        updated_at: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(reference, {
        display_name: 'Updated User',
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        display_name: '',
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        display_name: '   ',
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        display_name: 'x'.repeat(121),
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        display_name: 123,
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        access_level: 4,
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        access_level: 1,
        updated_at: Timestamp.now(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        access_expires: 'tomorrow',
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        email: 'changed@example.com',
        updated_at: serverTimestamp(),
      }),
    );

    const snapshot = await assertSucceeds(getDoc(reference));
    expect(snapshot.data()?.access_level).toBe(2);
    expect(snapshot.data()?.access_expires.toMillis()).toBe(nextExpiry.toMillis());
    expect(snapshot.data()?.display_name).toBe('Updated User');
    expect(snapshot.data()?.email).toBe('managed-user@example.com');
  });

  it('allows administrators to revoke user access in a batch', async () => {
    const firestore = authenticatedFirestore('administrator');
    const batch = writeBatch(firestore);
    const accessExpires = Timestamp.fromMillis(Date.now() - 60 * 1000);

    for (const uid of ['managed-user', 'administrator']) {
      batch.update(doc(firestore, 'users', uid), {
        access_level: 0,
        access_expires: accessExpires,
        updated_at: serverTimestamp(),
      });
    }

    await assertSucceeds(batch.commit());

    const snapshot = await assertSucceeds(getDoc(doc(firestore, 'users', 'administrator')));
    expect(snapshot.data()?.access_level).toBe(0);
    expect(snapshot.data()?.access_expires.toMillis()).toBe(accessExpires.toMillis());
  });

  it('denies mediator updates to user management fields', async () => {
    const firestore = authenticatedFirestore('mediator');
    const reference = doc(firestore, 'users', 'managed-user');

    await assertFails(
      updateDoc(reference, {
        access_level: 2,
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        access_expires: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        display_name: 'Unauthorized Name',
        updated_at: serverTimestamp(),
      }),
    );

    expect(true).toBe(true);
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
        updates: [
          {
            action: 'CHECKED_IN',
            by: {
              name: 'Test Operator',
              email: 'operator@example.com',
            },
            at: Timestamp.now(),
            details: '',
          },
        ],
      }),
    );

    const snapshot = await assertSucceeds(getDoc(reference));
    expect(snapshot.data()?.status).toBe('CHECKED_IN');
  });

  it('denies an audit entry carrying a forged operator email', async () => {
    const firestore = authenticatedFirestore('operator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    await assertFails(
      updateDoc(reference, {
        status: 'CHECKED_IN',
        arrived_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'CHECKED_IN',
            by: {
              name: 'Forged Operator',
              email: 'other@example.com',
            },
            at: Timestamp.now(),
            details: '',
          },
        ],
      }),
    );

    expect(true).toBe(true);
  });

  it('allows an operator to reject or flag conflicts with audit entries', async () => {
    const firestore = authenticatedFirestore('operator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    await assertSucceeds(
      updateDoc(reference, {
        status: 'REJECTED',
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'REJECTED',
            by: {
              name: 'Test Operator',
              email: 'operator@example.com',
            },
            at: Timestamp.now(),
            details: '',
          },
        ],
      }),
    );
    await assertSucceeds(
      updateDoc(reference, {
        status: 'CONFLICT',
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'REJECTED',
            by: {
              name: 'Test Operator',
              email: 'operator@example.com',
            },
            at: Timestamp.now(),
            details: '',
          },
          {
            action: 'CONFLICT',
            by: {
              name: 'Test Operator',
              email: 'operator@example.com',
            },
            at: Timestamp.now(),
            details: 'Flagged field(s): Full name',
          },
        ],
      }),
    );

    expect(true).toBe(true);
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
    await assertFails(
      updateDoc(reference, {
        search_ngrams: ['p', 'po', 'poi'],
        updated_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(reference, {
        full_name: 'UNINDEXED VISITOR',
        updated_at: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(reference, {
        full_name: 'UPDATED VISITOR',
        search_ngrams: ['u', 'up', 'upd'],
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'UPDATED',
            by: {
              name: 'Test Mediator',
              email: 'mediator@example.com',
            },
            at: Timestamp.now(),
            details: "full_name: 'EXAMPLE VISITOR' -> 'UPDATED VISITOR'",
          },
        ],
      }),
    );

    expect(snapshot.size).toBe(1);
  });

  it('allows a mediator to record field edits in the audit trail', async () => {
    const firestore = authenticatedFirestore('mediator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    await assertSucceeds(
      updateDoc(reference, {
        full_name: 'UPDATED VISITOR',
        search_ngrams: ['u', 'up', 'upd'],
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'UPDATED',
            by: {
              name: 'Test Mediator',
              email: 'mediator@example.com',
            },
            at: Timestamp.now(),
            details: "full_name: 'EXAMPLE VISITOR' -> 'UPDATED VISITOR'",
          },
        ],
      }),
    );

    const snapshot = await assertSucceeds(getDoc(reference));
    expect(snapshot.data()?.full_name).toBe('UPDATED VISITOR');
  });

  it('allows a mediator to toggle a registration status with a matching audit entry', async () => {
    const firestore = authenticatedFirestore('mediator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    // Flag the registration for manual review
    await assertSucceeds(
      updateDoc(reference, {
        status: 'CONFLICT',
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'CONFLICT',
            by: { name: 'Test Mediator', email: 'mediator@example.com' },
            at: Timestamp.now(),
            details: '',
          },
        ],
      }),
    );

    // Re-register the visitor (status returns to REGISTERED)
    await assertSucceeds(
      updateDoc(reference, {
        status: 'REGISTERED',
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'CONFLICT',
            by: { name: 'Test Mediator', email: 'mediator@example.com' },
            at: Timestamp.now(),
            details: '',
          },
          {
            action: 'REGISTERED',
            by: { name: 'Test Mediator', email: 'mediator@example.com' },
            at: Timestamp.now(),
            details: '',
          },
        ],
      }),
    );

    const snapshot = await assertSucceeds(getDoc(reference));
    expect(snapshot.data()?.status).toBe('REGISTERED');
  });

  it('allows a mediator edit whose rebuilt n-grams equal the stored ones', async () => {
    const firestore = authenticatedFirestore('mediator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    // A name edit can introduce no new 1-3 character grams, leaving the
    // rebuilt index identical and therefore absent from diff().affectedKeys().
    await assertSucceeds(
      updateDoc(reference, {
        full_name: 'EDITED VISITOR',
        search_ngrams: ['e', 'ex', 'v', 'vi'],
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'UPDATED',
            by: {
              name: 'Test Mediator',
              email: 'mediator@example.com',
            },
            at: Timestamp.now(),
            details: "full_name: 'EXAMPLE VISITOR' -> 'EDITED VISITOR'",
          },
        ],
      }),
    );

    const snapshot = await assertSucceeds(getDoc(reference));
    expect(snapshot.data()?.full_name).toBe('EDITED VISITOR');
  });

  it('denies mediator edits that empty the search index', async () => {
    const firestore = authenticatedFirestore('mediator');
    const reference = doc(firestore, 'events', '2026', 'registrations', REGISTRATION_ID);

    await assertFails(
      updateDoc(reference, {
        full_name: 'EDITED VISITOR',
        search_ngrams: [],
        updated_at: serverTimestamp(),
        updates: [
          {
            action: 'UPDATED',
            by: {
              name: 'Test Mediator',
              email: 'mediator@example.com',
            },
            at: Timestamp.now(),
            details: "full_name: 'EXAMPLE VISITOR' -> 'EDITED VISITOR'",
          },
        ],
      }),
    );

    expect(true).toBe(true);
  });

  it('denies writes to legacy events but allows reads', async () => {
    const firestore = authenticatedFirestore('mediator');
    const reference = doc(firestore, 'events', '2025', 'registrations', '1001');

    await assertFails(
      updateDoc(reference, {
        full_name: 'UPDATED LEGACY VISITOR',
        updated_at: serverTimestamp(),
      }),
    );

    const snapshot = await assertSucceeds(getDoc(reference));
    expect(snapshot.data()?.full_name).toBe('LEGACY VISITOR');
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

  it('allows mediators to create and read claims, denies operators', async () => {
    const mediatorFirestore = authenticatedFirestore('mediator');
    const operatorFirestore = authenticatedFirestore('operator');
    const claimReference = doc(mediatorFirestore, 'claims', 'MR LIM');

    await assertSucceeds(setDoc(claimReference, claimDocument()));
    await assertSucceeds(getDoc(claimReference));
    await assertSucceeds(getDocs(collection(mediatorFirestore, 'claims')));

    await assertFails(
      setDoc(
        doc(operatorFirestore, 'claims', 'MR TAN'),
        claimDocument({
          teacher: 'Mr Tan',
          claimed_by: { email: 'operator@example.com', name: 'Test Operator' },
        }),
      ),
    );
    await assertFails(getDocs(collection(operatorFirestore, 'claims')));

    expect(true).toBe(true);
  });

  it('denies another mediator overwriting a fresh claim', async () => {
    const mediatorFirestore = authenticatedFirestore('mediator');
    const administratorFirestore = authenticatedFirestore('administrator');
    const claimReference = doc(mediatorFirestore, 'claims', 'MR LIM');

    await assertSucceeds(setDoc(claimReference, claimDocument()));

    await assertFails(
      setDoc(
        doc(administratorFirestore, 'claims', 'MR LIM'),
        claimDocument({
          status: 'COMPLETED',
          claimed_by: { email: 'administrator@example.com', name: 'Test Administrator' },
          completed_by: { email: 'administrator@example.com', name: 'Test Administrator' },
          completed_at: serverTimestamp(),
        }),
      ),
    );

    const snapshot = await assertSucceeds(getDoc(claimReference));
    expect(snapshot.data()?.claimed_by.email).toBe('mediator@example.com');
  });

  it('allows taking over an expired claim', async () => {
    const mediatorFirestore = authenticatedFirestore('mediator');
    const claimReference = doc(mediatorFirestore, 'claims', 'MR TAN');

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore();
      const stale = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
      await setDoc(doc(firestore, 'claims', 'MR TAN'), {
        teacher: 'Mr Tan',
        status: 'CLAIMED',
        claimed_by: { email: 'old@example.com', name: 'Old Claimer' },
        claimed_at: stale,
        completed_by: null,
        completed_at: null,
        updated_at: stale,
      });
    });

    await assertSucceeds(
      setDoc(
        claimReference,
        claimDocument({
          teacher: 'Mr Tan',
          claimed_by: { email: 'mediator@example.com', name: 'Test Mediator' },
        }),
      ),
    );

    const snapshot = await assertSucceeds(getDoc(claimReference));
    expect(snapshot.data()?.claimed_by.email).toBe('mediator@example.com');
  });

  it('allows the claimer to complete, and anyone to un-complete', async () => {
    const mediatorFirestore = authenticatedFirestore('mediator');
    const administratorFirestore = authenticatedFirestore('administrator');
    const claimReference = doc(mediatorFirestore, 'claims', 'MR LIM');

    await assertSucceeds(setDoc(claimReference, claimDocument()));

    await assertSucceeds(
      setDoc(
        claimReference,
        claimDocument({
          status: 'COMPLETED',
          completed_by: { email: 'mediator@example.com', name: 'Test Mediator' },
          completed_at: serverTimestamp(),
        }),
      ),
    );

    await assertSucceeds(
      setDoc(
        doc(administratorFirestore, 'claims', 'MR LIM'),
        claimDocument({
          claimed_by: { email: 'administrator@example.com', name: 'Test Administrator' },
        }),
      ),
    );

    const snapshot = await assertSucceeds(getDoc(claimReference));
    expect(snapshot.data()?.status).toBe('CLAIMED');
    expect(snapshot.data()?.claimed_by.email).toBe('administrator@example.com');
  });

  it('allows only the owner to release a claim', async () => {
    const mediatorFirestore = authenticatedFirestore('mediator');
    const administratorFirestore = authenticatedFirestore('administrator');
    const ownedReference = doc(mediatorFirestore, 'claims', 'MR LIM');

    await assertSucceeds(setDoc(ownedReference, claimDocument()));
    await assertSucceeds(deleteDoc(ownedReference));

    const foreignReference = doc(mediatorFirestore, 'claims', 'MR TAN');
    await assertSucceeds(setDoc(foreignReference, claimDocument({ teacher: 'Mr Tan' })));
    await assertFails(deleteDoc(doc(administratorFirestore, 'claims', 'MR TAN')));

    const snapshot = await assertSucceeds(getDoc(foreignReference));
    expect(snapshot.exists()).toBe(true);
  });
});
