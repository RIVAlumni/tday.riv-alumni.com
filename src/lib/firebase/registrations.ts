import type { Registration, Registration2026Submission } from '$lib/models/registration';
import type { EventStats } from '$lib/util/registration';

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
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getInternalFirestore } from './firestore';
import { getCallableFunctions } from './functions';
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

function docToRegistration(snapshot: DocLike, eventId: string): Registration | null {
  const data = snapshot.data();
  if (!data || typeof data !== 'object') return null;

  const registration: Record<string, unknown> = { ...data };

  if (eventId === '2026') {
    registration.photo_url = registration.photo_url ?? '';
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
    if (registration.status === '') registration.status = 'REGISTERED';
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

function registrationsFromSnapshot(
  snapshot: Awaited<ReturnType<typeof getDocs>>,
  eventId: string,
): Registration[] {
  return snapshot.docs
    .map((document) => docToRegistration(document, eventId))
    .filter((registration): registration is Registration => registration !== null);
}

export async function fetchRegistrationPage(eventId: string): Promise<Registration[]> {
  const snapshot = await getDocs(
    query(registrationsCollection(eventId), orderBy(documentId()), limit(REGISTRATION_PAGE_SIZE)),
  );
  return registrationsFromSnapshot(snapshot, eventId);
}

export async function searchRegistrationsById(
  eventId: string,
  registrationId: string,
): Promise<Registration[]> {
  const snapshot = await getDocs(
    query(registrationsCollection(eventId), where(documentId(), '==', registrationId), limit(1)),
  );
  return registrationsFromSnapshot(snapshot, eventId);
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
  return registrationsFromSnapshot(snapshot, eventId);
}

export async function fetchRegistration(
  eventId: string,
  registrationId: string,
): Promise<Registration | null> {
  const snapshot = await getDoc(registrationRef(eventId, registrationId));
  return docToRegistration(snapshot, eventId);
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

interface CreateRegistrationResponse {
  registrationId: string;
}

export async function createRegistrationRecord(
  registration: Registration2026Submission,
): Promise<string> {
  const createRegistration = httpsCallable<Registration2026Submission, CreateRegistrationResponse>(
    getCallableFunctions(),
    'createRegistration2026',
  );

  try {
    const result = await createRegistration(registration);
    return result.data.registrationId;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    const code = firebaseError.code ?? 'functions/unknown';

    throw new RegistrationWriteError(
      firebaseError.message ?? 'This registration could not be accepted. Please try again.',
      code,
    );
  }
}
