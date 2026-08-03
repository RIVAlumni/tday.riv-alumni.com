/**
 * Registration utility functions - NRIC validation, ID generation, and formatting.
 *
 * Import from `$lib/util/registration`.
 */

import type { Timestamp } from 'firebase/firestore';
import type { Registration } from '$lib/models/registration';

import { is2024, is2026 } from '$lib/models/registration';

// Event stats

export interface EventStats {
  total: number;
  checkedIn: number;
  refused: number;
  conflict: number;
  awaiting: number;
  progress: number;
}

// NRIC helpers

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
