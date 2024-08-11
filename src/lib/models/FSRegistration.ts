import type { FSMetadata } from './FSMetadata';

interface FSRegistration extends FSMetadata {
  registration_id: string;
  full_name: string;
  status: string;
  comments: string;
  nric: string;
  gender: string;
  graduating_class: string;
  graduating_year: string;
  current_school_institution: string;
  contact_number: string;
  contact_number_short: string;
  name_of_nok: string;
  relationship_with_nok: string;
  emergency_contact_nok: string;
  form_teachers: string;
  visiting_teachers: string;
}

export type { FSRegistration };
