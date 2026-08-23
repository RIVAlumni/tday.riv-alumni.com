<script lang="ts">
  import { getCoreRowModel, type ColumnDef } from '@tanstack/table-core';

  import { createSvelteTable } from '$lib/components/ui/data-table/data-table.svelte.js';
  import { FlexRender, renderComponent } from '$lib/components/ui/data-table/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { formatTime } from '$lib/data/reception';
  import type { Registration2026 } from '$lib/models/registration';
  import { arrivedAtFor } from '$lib/util/registration';

  import DataTableCheckbox from './data-table-checkbox.svelte';

  let {
    students,
    selected = [],
    onselectedchange = () => {},
  }: {
    students: Registration2026[];
    selected?: string[];
    onselectedchange?: (selected: string[]) => void;
  } = $props();

  // Selection is owned by the parent (email buttons read it); the table
  // merely mirrors it via row ids mapped to boolean flags.
  const rowSelection = $derived(
    Object.fromEntries(selected.map((id) => [id, true])) as Record<string, boolean>,
  );

  const columns: ColumnDef<Registration2026>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        renderComponent(DataTableCheckbox, {
          'checked': table.getIsAllPageRowsSelected(),
          'indeterminate': table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
          'onCheckedChange': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
          'aria-label': 'Select all',
        }),
      cell: ({ row }) =>
        renderComponent(DataTableCheckbox, {
          'checked': row.getIsSelected(),
          'onCheckedChange': (value: boolean) => row.toggleSelected(!!value),
          'aria-label': 'Select row',
        }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'registration_id',
      header: 'ID',
      cell: ({ row }) => row.original.registration_id,
    },
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => row.original.full_name,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => row.original.status,
    },
    {
      accessorKey: 'graduating_year',
      header: 'Year',
      cell: ({ row }) => row.original.graduating_year,
    },
    {
      accessorKey: 'arrived_at',
      header: 'Arrived',
      cell: ({ row }) => formatTime(arrivedAtFor(row.original)),
    },
  ];

  const table = createSvelteTable({
    get data() {
      return students;
    },
    columns,
    getRowId: (row) => row.registration_id,
    enableRowSelection: true,
    state: {
      get rowSelection() {
        return rowSelection;
      },
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      onselectedchange(Object.keys(next).filter((id) => next[id]));
    },
    getCoreRowModel: getCoreRowModel(),
  });
</script>

<div class="overflow-hidden rounded-lg border">
  <Table.Root>
    <Table.Header class="bg-muted">
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head class="[&:has([role=checkbox])]:ps-3">
              {#if !header.isPlaceholder}
                <FlexRender
                  content={header.column.columnDef.header}
                  context={header.getContext()} />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#if table.getRowModel().rows?.length}
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row data-state={row.getIsSelected() && 'selected'}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell class="[&:has([role=checkbox])]:ps-3">
                <FlexRender
                  content={cell.column.columnDef.cell}
                  context={cell.getContext()} />
              </Table.Cell>
            {/each}
          </Table.Row>
        {/each}
      {:else}
        <Table.Row>
          <Table.Cell
            colspan={columns.length}
            class="h-24 text-center">
            No students.
          </Table.Cell>
        </Table.Row>
      {/if}
    </Table.Body>
  </Table.Root>
</div>
<div class="px-3 py-2 text-xs text-muted-foreground">
  {#if selected.length === 0}
    All {students.length} student(s) will be included in the email.
  {:else}
    {selected.length} of {students.length} student(s) selected; only these will be included in the email.
  {/if}
</div>
