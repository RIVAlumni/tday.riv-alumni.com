import { Timestamp } from 'firebase/firestore';

export type RegistrationStatus = 'REGISTERED' | 'CHECKED_IN' | 'REFUSED' | 'CONFLICT' | 'REJECTED';

export type EventId = '2024' | '2025' | '2026';

export interface BaseRegistration {
  event_id: string;
  registration_id: string;
  full_name: string;
  status: RegistrationStatus;
  contact_number: string;
  graduating_year: string;
  visiting_teachers: string[];
  comments: string;
  arrived_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Registration2024 extends BaseRegistration {
  event_id: '2024';
  nric: string;
  gender: 'M' | 'F';
  graduating_class: string;
  current_institution: string;
  contact_number_short: string;
  emergency_contact_nok: string;
  name_of_nok: string;
  relationship_with_nok: string;
  form_teachers: string[];
}

export interface Registration2025 extends BaseRegistration {
  event_id: '2025';
  is_ex_riverlite: boolean;
  contact_number_short: string;
}

export interface WrittenMessage {
  teacher_name: string;
  message: string;
}

export interface Registration2026 extends BaseRegistration {
  event_id: '2026';
  written_messages: WrittenMessage[];
}

export type Registration = Registration2024 | Registration2025 | Registration2026;

export function is2024(r: Registration): r is Registration2024 {
  return r.event_id === '2024';
}
export function is2025(r: Registration): r is Registration2025 {
  return r.event_id === '2025';
}
export function is2026(r: Registration): r is Registration2026 {
  return r.event_id === '2026';
}
