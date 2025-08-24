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
        accessor: 'contact_number',
        header: 'Contact',
      }),
      viewTable.column({
        accessor: 'is_ex_riverlite',
        header: 'Ex-Riverlite',
      }),
    ],
  }),
  viewTable.group({
    header: 'Graduating',
    columns: [
      viewTable.column({
        accessor: 'graduating_year',
        header: 'Year',
      }),
    ],
  }),
  viewTable.column({
    accessor: 'visiting_teachers',
    header: 'Visiting Teachers',
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
