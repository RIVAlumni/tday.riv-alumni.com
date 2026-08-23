import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { Registration2026 } from '$lib/models/registration';

import {
  CLAIM_STALE_AFTER_MS,
  isClaimStale,
  normalizeTeacherKey,
  rankTeachersByStudentCount,
  type TeacherClaim,
} from './teacher-claims';

function registration(visiting_teachers: string[]): Registration2026 {
  return {
    event_id: '2026',
    registration_id: 'AB12CD',
    email: 'student@example.com',
    photo_url: '',
    full_name: 'SOME STUDENT',
    status: 'REGISTERED',
    comments: '',
    contact_number: '91234567',
    graduating_year: '2020',
    visiting_teachers,
    written_messages: [],
    search_ngrams: [],
    updates: [],
    arrived_at: null,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  };
}

function claim(claimedAtMillis: number): TeacherClaim {
  const claimed_at = { toMillis: () => claimedAtMillis } as Timestamp;
  return {
    teacher: 'MR LIM',
    status: 'CLAIMED',
    claimed_by: { email: 'mediator@example.com', name: 'Mediator' },
    claimed_at,
    completed_by: null,
    completed_at: null,
    updated_at: claimed_at,
  };
}

describe('rankTeachersByStudentCount', () => {
  it('orders by student count descending', () => {
    const registrations = [
      registration(['Mr Tan']),
      registration(['Mr Lim', 'Mr Lim', 'Mr Tan']), // Lim 1, Tan 1 per registration
    ];
    // Mr Lim 1, Mr Tan 2 -> Tan first.
    expect(rankTeachersByStudentCount(registrations)).toEqual(['Mr Tan', 'Mr Lim']);
  });

  it('breaks count ties alphabetically', () => {
    const registrations = [
      registration(['Mr Tan', 'Mr Ng']),
      registration(['Mr Lim', 'Mr Ng']),
      registration(['Mr Lim', 'Mr Lim', 'Mr Tan', 'Mr Tan']), // Lim & Tan counted once each
    ];
    // All three appear in 2 registrations; alphabetical tiebreak.
    expect(rankTeachersByStudentCount(registrations)).toEqual(['Mr Lim', 'Mr Ng', 'Mr Tan']);
  });

  it('groups name variants under one canonical name with summed count', () => {
    const registrations = [
      registration(['Mr Lim']),
      registration(['MR LIM']),
      registration(['mr lim']),
    ];
    expect(rankTeachersByStudentCount(registrations)).toEqual(['Mr Lim']);
  });

  it('counts one student once per teacher per registration', () => {
    const registrations = [registration(['Mr Lim', 'Mr Lim', 'MR LIM'])];
    expect(rankTeachersByStudentCount(registrations)).toEqual(['Mr Lim']);
  });

  it('returns an empty array for empty registrations', () => {
    expect(rankTeachersByStudentCount([])).toEqual([]);
  });
});

describe('isClaimStale', () => {
  it('returns false exactly at the 30 minute boundary', () => {
    const now = 10_000_000;
    expect(isClaimStale(claim(now - CLAIM_STALE_AFTER_MS), now)).toBe(false);
  });

  it('returns true just past the 30 minute boundary', () => {
    const now = 10_000_000;
    expect(isClaimStale(claim(now - CLAIM_STALE_AFTER_MS - 1), now)).toBe(true);
  });
});

describe('normalizeTeacherKey', () => {
  it('trims surrounding whitespace and uppercases', () => {
    expect(normalizeTeacherKey('  Mr Lim  ')).toBe('MR LIM');
    expect(normalizeTeacherKey('mr lim')).toBe('MR LIM');
    expect(normalizeTeacherKey(' MADAM TAN ')).toBe('MADAM TAN');
  });
});
