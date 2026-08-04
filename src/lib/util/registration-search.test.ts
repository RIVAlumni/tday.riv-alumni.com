import type { Registration2025, Registration2026 } from '$lib/models/registration';

import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  buildRegistrationSearchNgrams,
  legacyContactNumberRange,
  legacyRegistrationMatchesPrefixSearch,
  registrationMatchesSearch,
  registrationVisitsAllTeachers,
  searchNgramForTerm,
  splitRegistrationSearchTerms,
} from './registration-search';

const LEGACY_REGISTRATION: Registration2025 = {
  event_id: '2025',
  registration_id: 1001,
  is_ex_riverlite: 'Yes',
  full_name: 'MD HAIKAL BIN ABDUL',
  status: 'REGISTERED',
  comments: '',
  created_at: Timestamp.now(),
  updated_at: Timestamp.now(),
  contact_number: 91234567,
  contact_number_short: 1234,
  graduating_year: 2020,
  visiting_teachers: 'Mr Lim',
};

const REGISTRATION: Registration2026 = {
  event_id: '2026',
  registration_id: 'ABCDEF',
  email: 'haikal@example.com',
  photo_url: '',
  full_name: 'MD HAIKAL BIN ABDUL',
  status: 'REGISTERED',
  comments: '',
  created_at: Timestamp.now(),
  updated_at: Timestamp.now(),
  contact_number: '91234567',
  graduating_year: '2020',
  visiting_teachers: ['Mr Lim'],
  written_messages: [],
  search_ngrams: ['h', 'ha', 'hai'],
  updates: [],
  arrived_at: null,
};

describe('registration search', () => {
  it('builds case-insensitive n-grams for partial matching', () => {
    const ngrams = buildRegistrationSearchNgrams([
      REGISTRATION.full_name,
      REGISTRATION.contact_number,
      REGISTRATION.email,
    ]);

    expect(ngrams).toContain('hai');
    expect(ngrams).toContain('ika');
    expect(ngrams).toContain('123');
    expect(ngrams).toContain('@ex');
    expect(new Set(ngrams).size).toBe(ngrams.length);
  });

  it('uses at most three normalized characters for the Firestore lookup', () => {
    expect(searchNgramForTerm(' HAIKAL ')).toBe('hai');
    expect(searchNgramForTerm('MD')).toBe('md');
  });

  it('matches every term across name, contact number, email, and ID', () => {
    expect(registrationMatchesSearch(REGISTRATION, 'HAI 123 example')).toBe(true);
    expect(registrationMatchesSearch(REGISTRATION, 'ika 456')).toBe(true);
    expect(registrationMatchesSearch(REGISTRATION, 'abcdef')).toBe(true);
    expect(registrationMatchesSearch(REGISTRATION, 'hai missing')).toBe(false);
  });

  it('requires every selected visiting teacher', () => {
    expect(registrationVisitsAllTeachers(REGISTRATION, [])).toBe(true);
    expect(registrationVisitsAllTeachers(REGISTRATION, ['Mr Lim'])).toBe(true);
    expect(registrationVisitsAllTeachers(REGISTRATION, ['Mr Lim', 'Ms Tan'])).toBe(false);
    expect(registrationVisitsAllTeachers(LEGACY_REGISTRATION, ['Mr Lim'])).toBe(false);
  });

  it('matches legacy field prefixes without matching words inside names', () => {
    expect(legacyRegistrationMatchesPrefixSearch(LEGACY_REGISTRATION, 'md 912')).toBe(true);
    expect(legacyRegistrationMatchesPrefixSearch(LEGACY_REGISTRATION, '100')).toBe(true);
    expect(legacyRegistrationMatchesPrefixSearch(LEGACY_REGISTRATION, 'hai')).toBe(false);
  });

  it('builds numeric ranges for 2025 contact number prefixes', () => {
    expect(legacyContactNumberRange('91')).toEqual([91_000_000, 91_999_999]);
    expect(legacyContactNumberRange('91234567')).toEqual([91_234_567, 91_234_567]);
    expect(legacyContactNumberRange('invalid')).toBeNull();
  });

  it('normalizes and removes duplicate query terms', () => {
    expect(splitRegistrationSearchTerms('  HAI hai  123 ')).toEqual(['hai', '123']);
  });
});
