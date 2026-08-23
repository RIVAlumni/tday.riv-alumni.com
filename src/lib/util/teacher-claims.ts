import type { Timestamp } from 'firebase/firestore';

import type { Registration2026 } from '$lib/models/registration';

export const CLAIM_STALE_AFTER_MS = 30 * 60 * 1000;

export interface ClaimIdentity {
  email: string;
  name: string;
}

export interface TeacherClaim {
  teacher: string;
  status: 'CLAIMED' | 'COMPLETED';
  claimed_by: ClaimIdentity;
  claimed_at: Timestamp;
  completed_by: ClaimIdentity | null;
  completed_at: Timestamp | null;
  updated_at: Timestamp;
}

export function normalizeTeacherKey(teacher: string): string {
  return teacher.trim().toUpperCase();
}

export function isClaimStale(claim: TeacherClaim, now: number): boolean {
  return now - claim.claimed_at.toMillis() > CLAIM_STALE_AFTER_MS;
}

// All distinct teachers from registrations, most students first,
// ties alphabetical. Canonical display name is the lexicographically
// smallest variant within a normalized group.
export function rankTeachersByStudentCount(registrations: Registration2026[]): string[] {
  const names = new Map<string, string>(); // key -> canonical display name
  const counts = new Map<string, number>(); // key -> student count
  for (const registration of registrations) {
    const seen = new Set<string>();
    for (const teacher of registration.visiting_teachers) {
      if (!teacher) continue;
      const key = normalizeTeacherKey(teacher);
      if (seen.has(key)) continue; // one student counts once per teacher
      seen.add(key);
      const current = names.get(key);
      if (
        current === undefined ||
        teacher.localeCompare(current, 'en-SG', { sensitivity: 'base' }) < 0
      ) {
        names.set(key, teacher);
      }
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...names.entries()]
    .map(([key, teacher]) => ({ teacher, count: counts.get(key) ?? 0 }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.teacher.localeCompare(right.teacher, 'en-SG', { sensitivity: 'base' }),
    )
    .map((entry) => entry.teacher);
}
