import type { Registration } from '$lib/models/registration';
import type { EventStats } from '$lib/util/registration';
import type { RegistrationFormInput } from '$lib/util/registration.schema';

import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { createRegistration } from '$lib/util/registration';

import { getInternalFirestore } from './firestore';

const MAX_COLLISION_RETRIES = 3;
const REGISTRATION_PAGE_SIZE = 20;

export class RegistrationWriteError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RegistrationWriteError';
  }
}

function registrationsCollection(eventId: string) {
  return collection(getInternalFirestore(), 'events', eventId, 'registrations');
}

function registrationRef(eventId: string, registrationId: string) {
  return doc(getInternalFirestore(), 'events', eventId, 'registrations', registrationId);
}

type DocLike = { data(): unknown };

function docToRegistration(snapshot: DocLike): Registration | null {
  const data = snapshot.data();
  if (!data || typeof data !== 'object') return null;

  const registration: Record<string, unknown> = { ...data };
  const eventId = registration.event_id as string;

  if (eventId === '2026') {
    registration.visiting_teachers = Array.isArray(registration.visiting_teachers)
      ? registration.visiting_teachers
      : registration.visiting_teachers != null
        ? [String(registration.visiting_teachers)]
        : [];
    registration.written_messages = Array.isArray(registration.written_messages)
      ? registration.written_messages
      : [];
    registration.arrived_at = registration.arrived_at ?? null;
  } else if (eventId === '2024') {
    registration.arrived_at = registration.arrived_at ?? null;
  } else if (eventId === '2025') {
    registration.registration_id = Number(registration.registration_id);
    registration.contact_number = Number(registration.contact_number);
    registration.contact_number_short = Number(registration.contact_number_short);
    registration.graduating_year = Number(registration.graduating_year);
    if (registration.is_ex_riverlite !== 'Yes' && registration.is_ex_riverlite !== 'No') {
      registration.is_ex_riverlite = registration.is_ex_riverlite ? 'Yes' : 'No';
    }
  }

  return registration as unknown as Registration;
}

function registrationsFromSnapshot(snapshot: Awaited<ReturnType<typeof getDocs>>): Registration[] {
  return snapshot.docs
    .map((document) => docToRegistration(document))
    .filter((registration): registration is Registration => registration !== null);
}

export async function fetchRegistrationPage(eventId: string): Promise<Registration[]> {
  const snapshot = await getDocs(
    query(registrationsCollection(eventId), orderBy(documentId()), limit(REGISTRATION_PAGE_SIZE)),
  );
  return registrationsFromSnapshot(snapshot);
}

export async function searchRegistrationsById(
  eventId: string,
  registrationId: string,
): Promise<Registration[]> {
  const snapshot = await getDocs(
    query(registrationsCollection(eventId), where(documentId(), '==', registrationId), limit(1)),
  );
  return registrationsFromSnapshot(snapshot);
}

export async function fetchConflictRegistrations(eventId: string): Promise<Registration[]> {
  const snapshot = await getDocs(
    query(
      registrationsCollection(eventId),
      where('status', '==', 'CONFLICT'),
      orderBy(documentId()),
      limit(REGISTRATION_PAGE_SIZE),
    ),
  );
  return registrationsFromSnapshot(snapshot);
}

export async function fetchRegistration(
  eventId: string,
  registrationId: string,
): Promise<Registration | null> {
  const snapshot = await getDoc(registrationRef(eventId, registrationId));
  return docToRegistration(snapshot);
}

export async function fetchEventStats(eventId: string): Promise<EventStats> {
  const registrations = registrationsCollection(eventId);
  const [totalResult, checkedInResult, refusedResult, conflictResult] = await Promise.all([
    getCountFromServer(registrations),
    getCountFromServer(query(registrations, where('status', '==', 'CHECKED_IN'))),
    getCountFromServer(query(registrations, where('status', '==', 'REJECTED'))),
    getCountFromServer(query(registrations, where('status', '==', 'CONFLICT'))),
  ]);

  const total = totalResult.data().count;
  const checkedIn = checkedInResult.data().count;
  const refused = refusedResult.data().count;
  const conflict = conflictResult.data().count;

  return {
    total,
    checkedIn,
    refused,
    conflict,
    awaiting: total - checkedIn,
    progress: total === 0 ? 0 : checkedIn / total,
  };
}

export async function checkInRegistration(eventId: string, registrationId: string): Promise<void> {
  const patch: Record<string, unknown> = {
    status: 'CHECKED_IN',
    updated_at: serverTimestamp(),
  };
  if (eventId !== '2025') patch.arrived_at = serverTimestamp();

  await updateDoc(registrationRef(eventId, registrationId), patch);
}

export async function refuseRegistration(eventId: string, registrationId: string): Promise<void> {
  await updateDoc(registrationRef(eventId, registrationId), {
    status: 'REJECTED',
    updated_at: serverTimestamp(),
  });
}

export async function flagConflict(
  eventId: string,
  registrationId: string,
  reason: string,
): Promise<void> {
  const firestore = getInternalFirestore();
  const reference = registrationRef(eventId, registrationId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('Registration not found');

    const previousComments = (snapshot.data().comments as string | undefined) ?? '';
    const timestamp = new Date().toLocaleString('en-SG');
    const comment = `[FLAGGED ${timestamp}] ${reason.trim()}`;
    const comments = previousComments ? `${previousComments}\n\n${comment}` : comment;

    transaction.update(reference, {
      status: 'CONFLICT',
      comments,
      updated_at: serverTimestamp(),
    });
  });
}

export async function updateRegistrationFields(
  eventId: string,
  registrationId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await updateDoc(registrationRef(eventId, registrationId), {
    ...patch,
    updated_at: serverTimestamp(),
  });
}

export async function createRegistrationRecord(
  eventId: string,
  input: RegistrationFormInput,
): Promise<string> {
  const firestore = getInternalFirestore();

  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const registration = createRegistration(input, eventId);
    const reference = doc(
      firestore,
      'events',
      eventId,
      'registrations',
      String(registration.registration_id),
    );

    try {
      const fields = { ...registration } as unknown as Record<string, unknown>;
      delete fields.created_at;
      delete fields.updated_at;
      await setDoc(reference, {
        ...fields,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return String(registration.registration_id);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const code = firebaseError.code ?? 'unknown';

      if (code === 'unavailable' || code === 'deadline-exceeded') continue;

      throw new RegistrationWriteError(
        code === 'permission-denied'
          ? `This registration could not be accepted. The data may not meet the requirements, or a registration for this event already exists.\n\nDetails: ${firebaseError.message ?? code}`
          : ((error as Error).message ?? 'Unexpected Firestore error'),
        code,
      );
    }
  }

  throw new RegistrationWriteError(
    'Registration failed after multiple network attempts.',
    'network-exhausted',
  );
}
