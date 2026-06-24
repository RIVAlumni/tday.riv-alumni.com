/**
 * Shared reception domain model — multi-event aware.
 *
 * This replaces the legacy approach in `../master` which derived the working
 * event from `new Date().getFullYear()`. Everything here is explicitly scoped
 * to an `event_id`, so operators pick the event they are working at instead of
 * trusting the system clock. See `_shared/store.svelte.ts` for the reactive
 * store that backs every reception design.
 */

import {
  BanIcon,
  CircleCheckFilledIcon,
  DoorExitIcon,
  HeartHandshakeIcon,
  IdBadge2Icon,
  InfoCircleIcon,
} from '$lib/icons';

// --- Events ---------------------------------------------------------------
export type EventStatus = 'upcoming' | 'active' | 'completed';

export interface ReceptionEvent {
  id: string;
  year: string;
  title: string;
  /** ISO date the event takes place. */
  date: string;
  venue: string;
  status: EventStatus;
}

export const events: ReceptionEvent[] = [
  {
    id: 'tdy-2024',
    year: '2024',
    title: "Teachers' Day 2024",
    date: '2024-09-06',
    venue: 'RIVA Heritage Hall',
    status: 'completed',
  },
  {
    id: 'tdy-2025',
    year: '2025',
    title: "Teachers' Day 2025",
    date: '2025-09-05',
    venue: 'RIVA Heritage Hall',
    status: 'completed',
  },
  {
    id: 'tdy-2026',
    year: '2026',
    title: "Teachers' Day 2026",
    date: '2026-06-26',
    venue: 'RIVA Parade Square',
    status: 'active',
  },
  {
    id: 'tdy-2027',
    year: '2027',
    title: "Teachers' Day 2027",
    date: '2027-06-25',
    venue: 'To be confirmed',
    status: 'upcoming',
  },
];

/** The event to default to — never the clock, always an explicit choice. */
export const defaultEventId: string =
  events.find((e) => e.status === 'active')?.id ?? events.at(-1)!.id;

export function getEvent(id: string): ReceptionEvent {
  return events.find((e) => e.id === id) ?? events[0];
}

// --- Registrations --------------------------------------------------------
export type RegistrationStatus = 'REGISTERED' | 'CHECKED_IN' | 'REFUSED' | 'CONFLICT' | 'REJECTED';

/**
 * Singapore NRIC/FIN shape: one prefix letter (S/T/F/G/M), 7 digits, one
 * check letter. Used to normalise what an operator types or scans from a QR.
 */
const NRIC_PATTERN = /^[STFGM]\d{7}[A-Z]$/;

/** Upper-case and validate an NRIC-like string; returns "" if invalid. */
export function normaliseNric(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, '');
  return NRIC_PATTERN.test(cleaned) ? cleaned : '';
}

export function isNricLike(value: string): boolean {
  return normaliseNric(value) !== '';
}

export interface Registration {
  event_id: string;
  registration_id: string;
  full_name: string;
  /** Singapore NRIC/FIN, e.g. "T1234567A". The primary key for door lookup. */
  nric: string;
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

export const seedRegistrations: Registration[] = [
  // --- 2026 (active) ---
  {
    event_id: 'tdy-2026',
    registration_id: 'TDY26-0001',
    full_name: 'AISHAH BTE RAHMAN',
    nric: 'T0234567A',
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
    event_id: 'tdy-2026',
    registration_id: 'TDY26-0002',
    full_name: 'BENJAMIN GOH JIA WEI',
    nric: 'S9876543B',
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
    event_id: 'tdy-2026',
    registration_id: 'TDY26-0003',
    full_name: 'CHLOE LIM XIN YI',
    nric: 'T9012345C',
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
    event_id: 'tdy-2026',
    registration_id: 'TDY26-0004',
    full_name: 'DEVENDRAN S/O MURUGAN',
    nric: 'S9555888D',
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
    event_id: 'tdy-2026',
    registration_id: 'TDY26-0005',
    full_name: 'ELIZABETH WONG SOO LIN',
    nric: 'T9000111E',
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
  {
    event_id: 'tdy-2026',
    registration_id: 'TDY26-0006',
    full_name: 'FARID BIN OSMAN',
    nric: 'S9333444F',
    status: 'REGISTERED',
    gender: 'Male',
    contact_number: '93334444',
    graduating_year: '2012',
    graduating_class: '4E1',
    current_institution: 'Singapore University of Social Sciences',
    is_ex_riverlite: false,
    visiting_teachers: ['Mr Goh Chee Seng'],
    comments: '',
    arrived_at: null,
  },
  // --- 2025 (completed) ---
  {
    event_id: 'tdy-2025',
    registration_id: 'TDY25-0102',
    full_name: 'GRACE TAN MEI LING',
    nric: 'T9800011G',
    status: 'CHECKED_IN',
    gender: 'Female',
    contact_number: '98000011',
    graduating_year: '2013',
    graduating_class: '4E3',
    current_institution: 'Working Professional',
    is_ex_riverlite: true,
    visiting_teachers: ['Mdm Siti Khadijah'],
    comments: 'Archived record from 2025.',
    arrived_at: '2025-09-05T09:10:00+08:00',
  },
  {
    event_id: 'tdy-2025',
    registration_id: 'TDY25-0103',
    full_name: 'HARITH BIN ZAINAL',
    nric: 'S9800022H',
    status: 'CHECKED_IN',
    gender: 'Male',
    contact_number: '98000022',
    graduating_year: '2011',
    graduating_class: '5N2',
    current_institution: 'Working Professional',
    is_ex_riverlite: false,
    visiting_teachers: ['Mr Raj Kumar'],
    comments: '',
    arrived_at: '2025-09-05T09:24:00+08:00',
  },
  {
    event_id: 'tdy-2025',
    registration_id: 'TDY25-0104',
    full_name: 'IVY NG YI FANG',
    nric: 'T9800033I',
    status: 'REFUSED',
    gender: 'Female',
    contact_number: '98000033',
    graduating_year: '2015',
    graduating_class: '4E4',
    current_institution: 'Working Professional',
    is_ex_riverlite: false,
    visiting_teachers: ['Mrs Lee Hui Fen'],
    comments: 'No valid registration on arrival.',
    arrived_at: null,
  },
  // --- 2024 (completed) ---
  {
    event_id: 'tdy-2024',
    registration_id: 'TDY24-0201',
    full_name: 'JONATHAN SEOW',
    nric: 'S9700001J',
    status: 'CHECKED_IN',
    gender: 'Male',
    contact_number: '97000001',
    graduating_year: '2010',
    graduating_class: '4N1',
    current_institution: 'Working Professional',
    is_ex_riverlite: false,
    visiting_teachers: ['Ms Lim Bee Hoon'],
    comments: 'Archived record from 2024.',
    arrived_at: '2024-09-06T08:55:00+08:00',
  },
  {
    event_id: 'tdy-2024',
    registration_id: 'TDY24-0202',
    full_name: 'KAVITHA D/O RAJ',
    nric: 'T9700002K',
    status: 'CHECKED_IN',
    gender: 'Female',
    contact_number: '97000002',
    graduating_year: '2009',
    graduating_class: '4E1',
    current_institution: 'Working Professional',
    is_ex_riverlite: true,
    visiting_teachers: ['Mr Goh Chee Seng'],
    comments: '',
    arrived_at: '2024-09-06T09:05:00+08:00',
  },
];

// --- Pure helpers (work on any pool, so they're trivial to unit-test) -----
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
        [r.registration_id, r.nric, r.full_name, r.contact_number, r.graduating_year]
          .join('\n')
          .toUpperCase()
          .includes(q),
    )
    .sort((a, b) => {
      // An exact NRIC hit always wins — it's the intended door lookup key.
      const aNric = a.nric === q ? -1 : 0;
      const bNric = b.nric === q ? -1 : 0;
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
  return pool.find((r) => r.event_id === eventId && r.registration_id === id);
}

export interface EventStats {
  total: number;
  checkedIn: number;
  refused: number;
  conflict: number;
  awaiting: number;
  /** 0–1 fraction checked in. */
  progress: number;
}

export function statsFor(eventId: string, pool: Registration[]): EventStats {
  const scoped = pool.filter((r) => r.event_id === eventId);
  const total = scoped.length;
  const checkedIn = scoped.filter((r) => r.status === 'CHECKED_IN').length;
  const refused = scoped.filter((r) => r.status === 'REFUSED').length;
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

// --- Presentation metadata (shared so every design stays consistent) ------
type IconComponent = typeof IdBadge2Icon;

export const statusMeta: Record<
  RegistrationStatus,
  { label: string; icon: IconComponent; badge: string; dot: string; soft: string }
> = {
  REGISTERED: {
    label: 'Registered',
    icon: IdBadge2Icon,
    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/25',
    dot: 'bg-sky-500',
    soft: 'bg-sky-500/10',
  },
  CHECKED_IN: {
    label: 'Checked in',
    icon: CircleCheckFilledIcon,
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-500/10',
  },
  REFUSED: {
    label: 'Entry refused',
    icon: BanIcon,
    badge: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/25',
    dot: 'bg-red-500',
    soft: 'bg-red-500/10',
  },
  CONFLICT: {
    label: 'Needs resolution',
    icon: InfoCircleIcon,
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25',
    dot: 'bg-amber-500',
    soft: 'bg-amber-500/10',
  },
  REJECTED: {
    label: 'Rejected',
    icon: BanIcon,
    badge: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/25',
    dot: 'bg-red-500',
    soft: 'bg-red-500/10',
  },
};

export type ActionType = 'CHECKED_IN' | 'REFUSED' | 'CONFLICT';

export const actionMeta: Record<
  ActionType,
  {
    label: string;
    icon: IconComponent;
    /** Tailwind classes for a solid primary action button. */
    button: string;
    /** Outline variant classes for a secondary placement. */
    outline: string;
    toastTitle: string;
    toastVerb: string;
  }
> = {
  CHECKED_IN: {
    label: 'Check In',
    icon: DoorExitIcon,
    button: 'bg-emerald-600 text-white hover:bg-emerald-600/90',
    outline: 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400',
    toastTitle: 'Visitor checked in',
    toastVerb: 'check-in',
  },
  REFUSED: {
    label: 'Refuse Entry',
    icon: BanIcon,
    button: 'bg-red-600 text-white hover:bg-red-600/90',
    outline: 'border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400',
    toastTitle: 'Entry refused',
    toastVerb: 'refuse-entry',
  },
  CONFLICT: {
    label: 'Conflict Resolution',
    icon: HeartHandshakeIcon,
    button: 'bg-amber-500 text-white hover:bg-amber-500/90',
    outline: 'border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400',
    toastTitle: 'Handed to Conflict Resolution',
    toastVerb: 'handover',
  },
};

// --- Formatting -----------------------------------------------------------
export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function initials(name: string): string {
  return name.charAt(0);
}
