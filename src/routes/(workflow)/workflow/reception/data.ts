/**
 * Mock data + types for the Reception check-in station.
 *
 * Shape is inspired by the legacy `FSRegistration` model but simplified for the
 * new Svelte 5 codebase. Once the Firebase data layer lands, swap
 * `findRegistrations`/`RecordSummary` for the real Firestore queries and keep
 * the `Registration` interface as the single contract this page depends on.
 */

export type RegistrationStatus = 'REGISTERED' | 'CHECKED_IN' | 'REFUSED' | 'CONFLICT' | 'REJECTED';

export interface Registration {
  registration_id: string;
  full_name: string;
  status: RegistrationStatus;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  contact_number: string;
  graduating_year: string;
  graduating_class: string;
  current_institution: string;
  is_ex_riverlite: boolean;
  visiting_teachers: string[];
  comments: string;
  arrived_at: string | null;
}

/**
 * Lightweight roll-up of a registration used for the recent-activity list and
 * stats. Derived from `Registration` so they can never drift apart.
 */
export type RecordSummary = Pick<
  Registration,
  'registration_id' | 'full_name' | 'status' | 'graduating_year' | 'graduating_class'
>;

const seed: Registration[] = [
  {
    registration_id: 'TDY26-0001',
    full_name: 'AISHAH BTE RAHMAN',
    status: 'REGISTERED',
    gender: 'Female',
    contact_number: '91234567',
    graduating_year: '2014',
    graduating_class: '4E2',
    current_institution: 'National University of Singapore',
    is_ex_riverlite: true,
    visiting_teachers: ['Mdm Siti Khadijah', 'Mr Tan Wei Ming'],
    comments: 'Prefers to be addressed as Aishah.',
    arrived_at: null,
  },
  {
    registration_id: 'TDY26-0002',
    full_name: 'BENJAMIN GOH JIA WEI',
    status: 'CHECKED_IN',
    gender: 'Male',
    contact_number: '98765432',
    graduating_year: '2016',
    graduating_class: '5A1',
    current_institution: 'Nanyang Technological University',
    is_ex_riverlite: false,
    visiting_teachers: ['Mrs Lee Hui Fen'],
    comments: 'Arrived with family (2 guests).',
    arrived_at: '2026-06-22T08:42:00+08:00',
  },
  {
    registration_id: 'TDY26-0003',
    full_name: 'CHLOE LIM XIN YI',
    status: 'REGISTERED',
    gender: 'Female',
    contact_number: '90123456',
    graduating_year: '2014',
    graduating_class: '4E2',
    current_institution: 'Singapore Management University',
    is_ex_riverlite: true,
    visiting_teachers: ['Mdm Siti Khadijah', 'Mr Goh Chee Seng'],
    comments: '',
    arrived_at: null,
  },
  {
    registration_id: 'TDY26-0004',
    full_name: 'DEVENDRAN S/O MURUGAN',
    status: 'REGISTERED',
    gender: 'Male',
    contact_number: '95558888',
    graduating_year: '2010',
    graduating_class: '4N1',
    current_institution: 'Singapore Institute of Technology',
    is_ex_riverlite: false,
    visiting_teachers: ['Mr Raj Kumar', 'Ms Lim Bee Hoon'],
    comments: 'Wheelchair user — please arrange ground-floor access.',
    arrived_at: null,
  },
  {
    registration_id: 'TDY26-0005',
    full_name: 'ELIZABETH WONG SOO LIN',
    status: 'CONFLICT',
    gender: 'Female',
    contact_number: '90001111',
    graduating_year: '2014',
    graduating_class: '4E2',
    current_institution: 'Working Professional',
    is_ex_riverlite: true,
    visiting_teachers: ['Mdm Siti Khadijah'],
    comments: 'Duplicate registration — refer to Conflict Resolution.',
    arrived_at: null,
  },
];

/**
 * Case-insensitive search across the fields an operator is likely to use at the
 * door: registration id, name, and contact number. Returns the top 6 matches.
 *
 * TODO(firebase): replace with the real Firestore query (see legacy
 * `queryContactNumber` / `queryAllWithFilter` in the master worktree).
 */
export function findRegistrations(needle: string, pool: Registration[] = seed): Registration[] {
  const q = needle.trim().toUpperCase();
  if (!q) return [];
  return pool
    .filter((r) =>
      [r.registration_id, r.full_name, r.contact_number, r.graduating_year]
        .join(' ')
        .toUpperCase()
        .includes(q),
    )
    .sort((a, b) => Number(b.graduating_year) - Number(a.graduating_year))
    .slice(0, 6);
}

export function getRegistrationById(
  id: string,
  pool: Registration[] = seed,
): Registration | undefined {
  return pool.find((r) => r.registration_id === id);
}

export { seed as mockRegistrations };
