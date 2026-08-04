import type {
  DocumentData,
  QueryDocumentSnapshot,
  QueryFilterConstraint,
  Timestamp,
} from 'firebase/firestore';

import type {
  Registration,
  Registration2026Submission,
  RegistrationStatus,
} from '$lib/models/registration';
import type { EventStats } from '$lib/util/registration';

import {
  and,
  collection,
  doc,
  documentId,
  endBefore,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  limitToLast,
  or,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import {
  buildRegistrationSearchNgrams,
  legacyContactNumberRange,
  legacyRegistrationMatchesPrefixSearch,
  registrationMatchesSearch,
  registrationVisitsAllTeachers,
  searchNgramForTerm,
  splitRegistrationSearchTerms,
} from '$lib/util/registration-search';

import { getInternalFirestore } from './firestore';
import { getCallableFunctions } from './functions';
const REGISTRATION_PAGE_SIZE = 20;

export interface RegistrationQueryFilters {
  search: string;
  status?: RegistrationStatus;
  graduatingYear?: string;
  createdFrom?: Timestamp;
  createdBefore?: Timestamp;
  visitingTeachers?: string[];
}

export type RegistrationPageDirection = 'first' | 'next' | 'previous' | 'last';

export interface RegistrationPageCursor {
  first: QueryDocumentSnapshot<DocumentData, DocumentData> | null;
  last: QueryDocumentSnapshot<DocumentData, DocumentData> | null;
}

export interface RegistrationPageResult {
  registrations: Registration[];
  totalCount: number;
  cursor: RegistrationPageCursor;
}

export interface RegistrationPageOptions {
  pageSize: number;
  direction?: RegistrationPageDirection;
  cursor?: RegistrationPageCursor | null;
  filters?: RegistrationQueryFilters;
}

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
type RegistrationDocument = QueryDocumentSnapshot<DocumentData, DocumentData>;

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

export async function fetchRegistrationPage(
  eventId: string,
  options: RegistrationPageOptions,
): Promise<RegistrationPageResult> {
  const registrations = registrationsCollection(eventId);
  const filters = options.filters ?? { search: '' };
  const constraints = registrationQueryConstraints(eventId, filters);
  const filteredQuery =
    constraints.length > 0 ? query(registrations, and(...constraints)) : query(registrations);
  const totalCount = (await getCountFromServer(filteredQuery)).data().count;
  const direction = options.direction ?? 'first';
  const orderConstraints =
    filters.createdFrom || filters.createdBefore
      ? [orderBy('created_at'), orderBy(documentId())]
      : [orderBy(documentId())];
  const lastPageSize = totalCount % options.pageSize || options.pageSize;
  const pageConstraint =
    direction === 'last'
      ? limitToLast(lastPageSize)
      : direction === 'previous' && options.cursor?.first
        ? [endBefore(options.cursor.first), limitToLast(options.pageSize)]
        : direction === 'next' && options.cursor?.last
          ? [startAfter(options.cursor.last), limit(options.pageSize)]
          : limit(options.pageSize);
  const pageConstraints = Array.isArray(pageConstraint) ? pageConstraint : [pageConstraint];
  const snapshot = await getDocs(
    constraints.length > 0
      ? query(registrations, and(...constraints), ...orderConstraints, ...pageConstraints)
      : query(registrations, ...orderConstraints, ...pageConstraints),
  );

  return {
    registrations: registrationsFromSnapshot(snapshot, eventId),
    totalCount,
    cursor: {
      first: snapshot.docs[0] ?? null,
      last: snapshot.docs.at(-1) ?? null,
    },
  };
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

function registrationQueryConstraints(
  eventId: string,
  filters: RegistrationQueryFilters,
): QueryFilterConstraint[] {
  const constraints: QueryFilterConstraint[] = [];

  if (filters.status) {
    constraints.push(
      eventId === '2025' && filters.status === 'REGISTERED'
        ? or(where('status', '==', 'REGISTERED'), where('status', '==', ''))
        : where('status', '==', filters.status),
    );
  }
  if (filters.graduatingYear) {
    constraints.push(
      where(
        'graduating_year',
        '==',
        eventId === '2025' ? Number(filters.graduatingYear) : filters.graduatingYear,
      ),
    );
  }
  if (filters.createdFrom) constraints.push(where('created_at', '>=', filters.createdFrom));
  if (filters.createdBefore) constraints.push(where('created_at', '<', filters.createdBefore));

  return constraints;
}

async function legacyRegistrationDocumentsForTerm(
  registrations: ReturnType<typeof registrationsCollection>,
  eventId: string,
  term: string,
): Promise<Map<string, RegistrationDocument>> {
  const upperCaseTerm = term.toLocaleUpperCase('en-SG');
  const snapshots = [
    getDocs(
      query(
        registrations,
        and(
          where('full_name', '>=', upperCaseTerm),
          where('full_name', '<=', `${upperCaseTerm}\uf8ff`),
        ),
      ),
    ),
    getDocs(
      query(
        registrations,
        and(
          where(documentId(), '>=', upperCaseTerm),
          where(documentId(), '<=', `${upperCaseTerm}\uf8ff`),
        ),
      ),
    ),
  ];

  if (eventId === '2025') {
    const range = legacyContactNumberRange(term);
    if (range) {
      snapshots.push(
        getDocs(
          query(
            registrations,
            and(where('contact_number', '>=', range[0]), where('contact_number', '<=', range[1])),
          ),
        ),
      );
    }
  } else if (/^\d+$/.test(term)) {
    snapshots.push(
      getDocs(
        query(
          registrations,
          and(where('contact_number', '>=', term), where('contact_number', '<=', `${term}\uf8ff`)),
        ),
      ),
    );
  }

  const documents = new Map<string, RegistrationDocument>();
  for (const snapshot of await Promise.all(snapshots)) {
    for (const document of snapshot.docs) documents.set(document.id, document);
  }
  return documents;
}

async function searchLegacyRegistrations(
  eventId: string,
  filters: RegistrationQueryFilters,
  terms: string[],
  constraints: QueryFilterConstraint[],
): Promise<Registration[]> {
  const registrations = registrationsCollection(eventId);
  const [termDocuments, filterSnapshot] = await Promise.all([
    Promise.all(
      terms.map((term) => legacyRegistrationDocumentsForTerm(registrations, eventId, term)),
    ),
    constraints.length > 0
      ? getDocs(query(registrations, and(...constraints)))
      : Promise.resolve(null),
  ]);
  const documents = new Map(termDocuments[0]);

  for (const matches of termDocuments.slice(1)) {
    for (const id of documents.keys()) {
      if (!matches.has(id)) documents.delete(id);
    }
  }

  if (filterSnapshot) {
    const filteredIds = new Set(filterSnapshot.docs.map((document) => document.id));
    for (const id of documents.keys()) {
      if (!filteredIds.has(id)) documents.delete(id);
    }
  }

  return [...documents.values()]
    .map((document) => docToRegistration(document, eventId))
    .filter((registration): registration is Registration => registration !== null)
    .filter((registration) => legacyRegistrationMatchesPrefixSearch(registration, filters.search));
}

export async function searchRegistrations(
  eventId: string,
  filters: RegistrationQueryFilters,
): Promise<Registration[]> {
  const registrations = registrationsCollection(eventId);
  const constraints = registrationQueryConstraints(eventId, filters);
  const terms = splitRegistrationSearchTerms(filters.search);
  const visitingTeachers =
    eventId === '2026' ? [...new Set(filters.visitingTeachers?.filter(Boolean) ?? [])] : [];

  if (terms.length === 0 && visitingTeachers.length === 0) {
    const snapshot = await getDocs(
      constraints.length > 0 ? query(registrations, and(...constraints)) : query(registrations),
    );
    return registrationsFromSnapshot(snapshot, eventId);
  }

  if (eventId !== '2026') {
    return searchLegacyRegistrations(eventId, filters, terms, constraints);
  }

  const [termSnapshots, teacherSnapshots, filterSnapshot] = await Promise.all([
    Promise.all(
      terms.map((term) =>
        getDocs(
          query(
            registrations,
            and(where('search_ngrams', 'array-contains', searchNgramForTerm(term)), ...constraints),
          ),
        ),
      ),
    ),
    Promise.all(
      visitingTeachers.map((teacher) =>
        getDocs(query(registrations, where('visiting_teachers', 'array-contains', teacher))),
      ),
    ),
    terms.length === 0 && constraints.length > 0
      ? getDocs(query(registrations, and(...constraints)))
      : Promise.resolve(null),
  ]);
  const snapshots = [
    ...termSnapshots,
    ...(filterSnapshot ? [filterSnapshot] : []),
    ...teacherSnapshots,
  ];
  const documents = new Map(snapshots[0].docs.map((document) => [document.id, document] as const));

  for (const snapshot of snapshots.slice(1)) {
    const snapshotIds = new Set(snapshot.docs.map((document) => document.id));
    for (const id of documents.keys()) {
      if (!snapshotIds.has(id)) documents.delete(id);
    }
  }

  const exactId = filters.search.trim().toUpperCase();
  if (terms.length === 1 && /^[A-Z0-9]{1,32}$/.test(exactId)) {
    const exactSnapshot = await getDocs(
      query(registrations, and(where(documentId(), '==', exactId), ...constraints)),
    );
    const teacherIds = teacherSnapshots.map(
      (snapshot) => new Set(snapshot.docs.map((document) => document.id)),
    );
    for (const document of exactSnapshot.docs) {
      if (teacherIds.every((ids) => ids.has(document.id))) documents.set(document.id, document);
    }
  }

  return [...documents.values()]
    .map((document) => docToRegistration(document, eventId))
    .filter((registration): registration is Registration => registration !== null)
    .filter(
      (registration) =>
        registrationMatchesSearch(registration, filters.search) &&
        registrationVisitsAllTeachers(registration, visitingTeachers),
    );
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
  const reference = registrationRef(eventId, registrationId);

  if (
    eventId === '2026' &&
    ('full_name' in patch || 'contact_number' in patch || 'email' in patch)
  ) {
    await runTransaction(getInternalFirestore(), async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error('Registration not found');

      const registration = { ...snapshot.data(), ...patch };
      transaction.update(reference, {
        ...patch,
        search_ngrams: buildRegistrationSearchNgrams([
          registration.registration_id ?? registrationId,
          registration.email,
          registration.full_name,
          registration.contact_number,
        ]),
        updated_at: serverTimestamp(),
      });
    });
    return;
  }

  await updateDoc(reference, {
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
