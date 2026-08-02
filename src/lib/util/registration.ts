/**
 * Registration utility functions - NRIC validation, ID generation, search,
 * stats, and the registration factory.
 *
 * Import from `$lib/util/registration`.
 */

import {
  is2024,
  is2026,
  type Registration,
  type Registration2026,
} from '$lib/models/registration';
import type { WrittenMessage } from '$lib/models/registration';
import { serverTimestamp, type Timestamp } from 'firebase/firestore';

// ── Form input type ──────────────────────────────────────────────────────

/** Shape of the public /register form. Co-located here because it's the
 *  parameter type for {@link createRegistration}. */
export interface RegistrationInput {
  email: string;
  full_name: string;
  contact_number: string;
  graduating_year: string;
  visiting_teachers: string[];
  written_messages: WrittenMessage[];
}

// ── Event stats ──────────────────────────────────────────────────────────

export interface EventStats {
  total: number;
  checkedIn: number;
  refused: number;
  conflict: number;
  awaiting: number;
  progress: number;
}

// ── NRIC helpers ─────────────────────────────────────────────────────────

const NRIC_PATTERN = /^[STFGM]\d{7}[A-Z]$/;

/** Upper-case and validate an NRIC-like string; returns "" if invalid. */
export function normaliseNric(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, '');
  return NRIC_PATTERN.test(cleaned) ? cleaned : '';
}

export function isNricLike(value: string): boolean {
  return normaliseNric(value) !== '';
}

/** Safe NRIC access - only 2024 registrations carry it. Returns "" otherwise. */
export function nricFor(r: Registration | null | undefined): string {
  return r && is2024(r) ? r.nric : '';
}

/** Visiting teachers as a single string - 2024/2025 store a string, 2026 an array. */
export function visitingTeachersFor(r: Registration | null | undefined): string {
  if (!r) return '';
  const vt = r.visiting_teachers;
  return Array.isArray(vt) ? vt.join(', ') : vt;
}

/** Arrival timestamp - 2024 and 2026 registrations carry it, 2025 does not. */
export function arrivedAtFor(r: Registration | null | undefined): Timestamp | null {
  if (!r) return null;
  return is2024(r) || is2026(r) ? r.arrived_at : null;
}

// ── ID generation ────────────────────────────────────────────────────────

const REG_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I, O - avoid confusion with 1, 0
const REG_ID_LENGTH = 6;

/**
 * Generate a random 6-letter registration ID.
 *
 * With 24^6 ≈ 191M combinations and ~300 records per event the birthday
 * collision probability is negligible. When wired to Firestore the caller
 * should attempt the write and retry with a fresh ID if the document
 * already exists.
 */
export function generateRegistrationId(): string {
  let id = '';
  for (let i = 0; i < REG_ID_LENGTH; i++) {
    id += REG_ID_CHARS.charAt(Math.floor(Math.random() * REG_ID_CHARS.length));
  }
  return id;
}

// ── Factory ──────────────────────────────────────────────────────────────

/**
 * Create a new registration from the public form input. Generates a random
 * registration ID (caller should retry on Firestore collision).
 */
export function createRegistration(input: RegistrationInput, eventId: string): Registration {
  const now = serverTimestamp() as unknown as Timestamp;

  if (eventId === '2026') {
    return {
      event_id: '2026',
      registration_id: generateRegistrationId(),
      email: input.email.trim().toLowerCase(),
      full_name: input.full_name.toUpperCase().trim(),
      status: 'REGISTERED',
      contact_number: input.contact_number.trim(),
      graduating_year: input.graduating_year,
      visiting_teachers: input.visiting_teachers.map((t) => t.trim()).filter(Boolean),
      comments: '',
      arrived_at: null,
      created_at: now,
      updated_at: now,
      written_messages: input.written_messages.slice(0, 2),
    } satisfies Registration2026;
  }

  // Only the 2026 public form creates records here; archived events are
  // imported directly into Firestore.
  throw new Error(`createRegistration: unsupported event ${eventId}`);
}

// ── Query helpers ────────────────────────────────────────────────────────

export function searchRegistrations(
  eventId: string,
  needle: string,
  pool: Registration[],
): Registration[] {
  const q = needle.trim().toUpperCase();
  if (!q) return [];
  return pool
    .filter(
      (r) =>
        r.event_id === eventId &&
        [r.registration_id, nricFor(r), r.full_name, r.contact_number, r.graduating_year]
          .join('\n')
          .toUpperCase()
          .includes(q),
    )
    .sort((a, b) => {
      const aNric = nricFor(a) === q ? -1 : 0;
      const bNric = nricFor(b) === q ? -1 : 0;
      if (aNric !== bNric) return aNric - bNric;
      return Number(b.graduating_year) - Number(a.graduating_year);
    })
    .slice(0, 6);
}

export function getRegistration(
  eventId: string,
  id: string,
  pool: Registration[],
): Registration | undefined {
  return pool.find((r) => r.event_id === eventId && String(r.registration_id) === id);
}

export function statsFor(eventId: string, pool: Registration[]): EventStats {
  const scoped = pool.filter((r) => r.event_id === eventId);
  const total = scoped.length;
  const checkedIn = scoped.filter((r) => r.status === 'CHECKED_IN').length;
  const refused = scoped.filter((r) => r.status === 'REJECTED').length;
  const conflict = scoped.filter((r) => r.status === 'CONFLICT').length;
  const awaiting = total - checkedIn;
  return {
    total,
    checkedIn,
    refused,
    conflict,
    awaiting,
    progress: total === 0 ? 0 : checkedIn / total,
  };
}
