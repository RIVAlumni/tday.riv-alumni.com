import type { FSRegistration } from '$lib/models';

import { writable } from 'svelte/store';
import { createTable } from 'svelte-headless-table';

type SearchableFSRegistration = FSRegistration & {
  search: string;
};

const records = writable<SearchableFSRegistration[]>([]);

const viewTable = createTable(records);
const viewColumns = viewTable.createColumns([
  viewTable.group({
    header: 'Personal Info',
    columns: [
      viewTable.column({
        accessor: 'registration_id',
        header: 'Registration ID',
      }),
      viewTable.column({
        accessor: 'full_name',
        header: 'Full Name',
      }),
      viewTable.column({
        accessor: 'status',
        header: 'Status',
      }),
      viewTable.column({
        accessor: 'nric',
        header: 'NRIC',
      }),
      viewTable.column({
        accessor: 'gender',
        header: 'Gender',
      }),
      viewTable.column({
        accessor: 'current_school_institution',
        header: 'Current School',
      }),
      viewTable.column({
        accessor: 'contact_number',
        header: 'Contact',
      }),
    ],
  }),
  viewTable.group({
    header: 'Graduating',
    columns: [
      viewTable.column({
        accessor: 'graduating_class',
        header: 'Class',
      }),
      viewTable.column({
        accessor: 'graduating_year',
        header: 'Year',
      }),
    ],
  }),
  viewTable.group({
    header: 'Next-of-Kin',
    columns: [
      viewTable.column({
        accessor: 'name_of_nok',
        header: 'Name',
      }),
      viewTable.column({
        accessor: 'relationship_with_nok',
        header: 'Relationship',
      }),
      viewTable.column({
        accessor: 'emergency_contact_nok',
        header: 'Emergency Contact',
      }),
    ],
  }),
  viewTable.column({
    accessor: 'search',
    header: 'Investigate',
  }),
]);

const { headerRows, pageRows, tableAttrs, tableBodyAttrs } =
  viewTable.createViewModel(viewColumns);

export type { SearchableFSRegistration };
export { records, headerRows, pageRows, tableAttrs, tableBodyAttrs };
