import { Registration } from './registration';

import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

function doc(data: unknown): { data(): unknown } {
  return { data: () => data };
}

describe('Registration.fromFirestore', () => {
  it('returns null for empty or non-object data', () => {
    expect(Registration.fromFirestore(doc(null), '2026')).toBeNull();
    expect(Registration.fromFirestore(doc('x'), '2026')).toBeNull();
  });

  it('coerces 2025 numeric fields and empty status', () => {
    const registration = Registration.fromFirestore(
      doc({
        event_id: '2025',
        registration_id: '1001',
        contact_number: '91234567',
        contact_number_short: '1234',
        graduating_year: '2020',
        status: '',
        full_name: 'A',
        comments: '',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        visiting_teachers: 'Mr Lim',
        is_ex_riverlite: 'Yes',
      }),
      '2025',
    )!;
    expect(registration.registration_id).toBe(1001);
    expect(registration.contact_number).toBe(91234567);
    expect(registration.graduating_year).toBe(2020);
    expect(registration.status).toBe('REGISTERED');
    expect(registration.arrived_at).toBeNull();
  });

  it('defaults 2026 optional fields', () => {
    const registration = Registration.fromFirestore(
      doc({
        event_id: '2026',
        registration_id: 'ABCDEF',
        email: 'a@b.com',
        full_name: 'A',
        status: 'REGISTERED',
        comments: '',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        contact_number: '91234567',
        graduating_year: '2020',
        visiting_teachers: 'Mr Lim',
      }),
      '2026',
    )!;
    expect(registration.photo_url).toBe('');
    expect(registration.visiting_teachers).toEqual(['Mr Lim']);
    expect(registration.written_messages).toEqual([]);
    expect(registration.updates).toEqual([]);
    expect(registration.arrived_at).toBeNull();
  });

  it('stamps event_id from the parameter', () => {
    const registration = Registration.fromFirestore(doc({ full_name: 'A' }), '2024');
    expect(registration?.event_id).toBe('2024');
  });
});
