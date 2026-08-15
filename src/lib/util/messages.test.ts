import type { Registration, Registration2026 } from '$lib/models/registration';

import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { flattenMessages } from './messages';

function registration(overrides: Partial<Registration2026>): Registration2026 {
  return {
    event_id: '2026',
    registration_id: 'ABCDEF',
    email: 'student@example.com',
    photo_url: '',
    full_name: 'STUDENT A',
    contact_number: '91234567',
    graduating_year: '2020',
    status: 'REGISTERED',
    comments: '',
    created_at: Timestamp.fromMillis(1),
    updated_at: Timestamp.fromMillis(1),
    visiting_teachers: ['MDM NG HWEE KOON'],
    written_messages: [],
    search_ngrams: [],
    updates: [],
    arrived_at: null,
    ...overrides,
  };
}

describe('flattenMessages', () => {
  it('flattens written messages with student names and drops non-2026 registrations', () => {
    const registrations: Registration[] = [
      registration({
        written_messages: [{ teacher_name: 'MDM NG HWEE KOON', message: 'Thank you!' }],
      }),
      { ...registration({}), event_id: '2025' } as unknown as Registration,
    ];
    expect(flattenMessages(registrations)).toEqual([
      {
        student_name: 'STUDENT A',
        teacher_name: 'MDM NG HWEE KOON',
        message: 'Thank you!',
        written_at: Timestamp.fromMillis(1),
      },
    ]);
  });

  it('keeps every message even when a student registers twice for the same teacher', () => {
    const registrations = [
      registration({
        created_at: Timestamp.fromMillis(1),
        written_messages: [{ teacher_name: 'MDM NG HWEE KOON', message: 'First entry' }],
      }),
      registration({
        created_at: Timestamp.fromMillis(2),
        written_messages: [{ teacher_name: 'MDM NG HWEE KOON', message: 'Second entry' }],
      }),
    ];
    expect(flattenMessages(registrations)).toEqual([
      {
        student_name: 'STUDENT A',
        teacher_name: 'MDM NG HWEE KOON',
        message: 'First entry',
        written_at: Timestamp.fromMillis(1),
      },
      {
        student_name: 'STUDENT A',
        teacher_name: 'MDM NG HWEE KOON',
        message: 'Second entry',
        written_at: Timestamp.fromMillis(2),
      },
    ]);
  });

  it('sorts by teacher name', () => {
    const registrations = [
      registration({
        written_messages: [
          { teacher_name: 'MR LIM ZE WEI', message: 'Hi' },
          { teacher_name: 'MDM NG HWEE KOON', message: 'Hi' },
        ],
      }),
    ];
    expect(flattenMessages(registrations).map((row) => row.teacher_name)).toEqual([
      'MDM NG HWEE KOON',
      'MR LIM ZE WEI',
    ]);
  });
});
