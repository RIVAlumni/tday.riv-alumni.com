import type { RegistrationStatus } from '$lib/models/registration';

export interface RecordsFilterValues {
  status: RegistrationStatus | 'all';
  graduatingYear: string | 'all';
  registeredFrom: string;
  registeredTo: string;
  visitingTeachers: string[];
}
