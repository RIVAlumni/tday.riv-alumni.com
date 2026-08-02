<script lang="ts">
  import { onMount } from 'svelte';
  import type { Registration } from '$lib/models/registration';
  import { is2024 } from '$lib/models/registration';
  import { arrivedAtFor, visitingTeachersFor } from '$lib/util/registration';
  import { Timestamp } from 'firebase/firestore';

  // --- Table core ---
  import { createSvelteTable } from '$lib/components/ui/data-table/data-table.svelte.js';
  import { FlexRender, renderComponent } from '$lib/components/ui/data-table/index.js';
  import {
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    type SortingState,
    type VisibilityState,
  } from '@tanstack/table-core';

  // --- shadcn-svelte ---
  import * as Table from '$lib/components/ui/table/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Label } from '$lib/components/ui/label/index.js';

  // --- Icons ---
  import {
    ArrowDown01Icon,
    ArrowLeft01Icon,
    ArrowLeftDoubleIcon,
    ArrowRight01Icon,
    ArrowRightDoubleIcon,
    UserIcon,
  } from '$lib/icons';

  // --- Cells ---
  import NameCell from './name-cell.svelte';
  import StatusCell from './status-cell.svelte';
  import ActionsCell from './actions-cell.svelte';

  let {
    registrations,
    globalFilter = $bindable(''),
    columnFilters = $bindable([]),
    table = $bindable(null as unknown as ReturnType<typeof createSvelteTable<Registration>>),
    onNavigate,
  }: {
    registrations: Registration[];
    globalFilter?: string;
    columnFilters?: ColumnFiltersState;
    table?: ReturnType<typeof createSvelteTable<Registration>>;
    onNavigate: (registrationId: string) => void;
  } = $props();

  // --- Table state ---
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 15 });
  let sorting = $state<SortingState>([{ id: 'registration_id', desc: false }]);

  const VISIBILITY_KEY = 'records:column-visibility';
  let columnVisibility = $state<VisibilityState>({});
  let visibilityLoaded = $state(false);

  onMount(() => {
    try {
      const raw = localStorage.getItem(VISIBILITY_KEY);
      if (raw) columnVisibility = JSON.parse(raw) as VisibilityState;
    } catch { /* noop */ }
    visibilityLoaded = true;
  });

  $effect(() => {
    if (!visibilityLoaded) return;
    try {
      localStorage.setItem(VISIBILITY_KEY, JSON.stringify(columnVisibility));
    } catch { /* noop */ }
  });

  // --- Columns ---
  const columns: ColumnDef<Registration>[] = [
    {
      accessorKey: 'registration_id',
      header: 'ID',
      cell: ({ row }) => row.original.registration_id,
    },
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => renderComponent(NameCell, { registration: row.original }),
      enableHiding: false,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => renderComponent(StatusCell, { status: row.original.status }),
      filterFn: 'equalsString',
    },
    {
      accessorKey: 'graduating_year',
      header: 'Year',
      cell: ({ row }) => row.original.graduating_year,
      filterFn: 'equalsString',
    },
    {
      accessorKey: 'current_institution',
      header: 'Institution',
      cell: ({ row }) => is2024(row.original) ? (row.original.current_institution || '-') : '-',
    },
    {
      accessorKey: 'visiting_teachers',
      header: 'Visiting Teachers',
      cell: ({ row }) => {
        const teachers = visitingTeachersFor(row.original);
        return teachers ? teachers : '-';
      },
    },
    {
      accessorKey: 'arrived_at',
      header: 'Arrived',
      cell: ({ row }) => {
        const iso = arrivedAtFor(row.original);
        if (!iso) return '-';
        const d = iso instanceof Timestamp ? iso.toDate() : new Date(iso as unknown as string);
        return d.toLocaleTimeString('en-SG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        renderComponent(ActionsCell, { registrationId: String(row.original.registration_id), onNavigate }),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  table = createSvelteTable({
    get data() {
      return registrations;
    },
    columns,
    state: {
      get pagination() {
        return pagination;
      },
      get sorting() {
        return sorting;
      },
      get columnVisibility() {
        return columnVisibility;
      },
      get columnFilters() {
        return columnFilters;
      },
      get globalFilter() {
        return globalFilter;
      },
    },
    getRowId: (row) => String(row.registration_id),
    enableRowSelection: false,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'auto',
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') pagination = updater(pagination);
      else pagination = updater;
    },
    onSortingChange: (updater) => {
      if (typeof updater === 'function') sorting = updater(sorting);
      else sorting = updater;
    },
    onColumnFiltersChange: (updater) => {
      if (typeof updater === 'function') columnFilters = updater(columnFilters);
      else columnFilters = updater;
    },
    onColumnVisibilityChange: (updater) => {
      if (typeof updater === 'function') columnVisibility = updater(columnVisibility);
      else columnVisibility = updater;
    },
  });

  function handleRowKeydown(e: KeyboardEvent, registrationId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate(registrationId);
    }
  }

  // --- Pagination bind helpers ---
  const pageSizeBind = {
    get: () => `${table.getState().pagination.pageSize}`,
    set: (v: string) => table.setPageSize(Number(v)),
  };
</script>

<div class="overflow-hidden rounded-lg border">
  <Table.Root>
    <Table.Header class="bg-muted sticky top-0 z-10">
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head
              colspan={header.colSpan}
              class={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
              onclick={() => header.column.getCanSort() && header.column.toggleSorting()}>
              <div class="flex items-center gap-1">
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()} />
                  {#if header.column.getIsSorted() === 'asc'}
                    <ArrowDown01Icon class="size-3 rotate-180" />
                  {:else if header.column.getIsSorted() === 'desc'}
                    <ArrowDown01Icon class="size-3" />
                  {/if}
                {/if}
              </div>
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#if table.getRowModel().rows?.length}
        {#each table.getRowModel().rows as row (row.id)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <Table.Row
            data-state={row.original.status === 'CHECKED_IN' ? 'selected' : undefined}
            class="hover:bg-muted/50 cursor-pointer transition-colors"
            tabindex={0}
            role="row"
            onclick={(e: MouseEvent) => {
              if ((e.target as HTMLElement).closest('button, a')) return;
              onNavigate(String(row.original.registration_id));
            }}
            onkeydown={(e: KeyboardEvent) => {
              if ((e.target as HTMLElement).closest('button, a')) return;
              handleRowKeydown(e, String(row.original.registration_id));
            }}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
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
            class="h-32 text-center">
            <div class="flex flex-col items-center gap-2">
              <UserIcon class="text-muted-foreground size-8" />
              <p class="text-muted-foreground text-sm font-medium">No registrations found</p>
              {#if globalFilter}
                <p class="text-muted-foreground text-xs">Try adjusting your search or filter.</p>
              {/if}
            </div>
          </Table.Cell>
        </Table.Row>
      {/if}
    </Table.Body>
  </Table.Root>
</div>

<!-- Pagination -->
<div class="flex items-center justify-between">
  <div class="text-muted-foreground hidden flex-1 text-sm lg:flex">
    {table.getFilteredRowModel().rows.length} of
    {registrations.length} registration(s)
  </div>
  <div class="flex w-full items-center gap-6 lg:w-fit">
    <div class="hidden items-center gap-2 lg:flex">
      <Label
        for="rows-per-page"
        class="text-sm font-medium">Rows per page</Label>
      <Select.Root
        type="single"
        bind:value={pageSizeBind.get, pageSizeBind.set}>
        <Select.Trigger
          size="sm"
          class="w-18"
          id="rows-per-page">
          {table.getState().pagination.pageSize}
        </Select.Trigger>
        <Select.Content side="top">
          {#each [10, 15, 25, 50] as pageSize (pageSize)}
            <Select.Item value={pageSize.toString()}>
              {pageSize}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
    <div class="flex w-fit items-center justify-center text-sm font-medium">
      Page {table.getState().pagination.pageIndex + 1} of
      {table.getPageCount() || 1}
    </div>
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        class="hidden size-8 p-0 lg:flex"
        onclick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}>
        <span class="sr-only">Go to first page</span>
        <ArrowLeftDoubleIcon />
      </Button>
      <Button
        variant="outline"
        class="size-8"
        size="icon"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}>
        <span class="sr-only">Go to previous page</span>
        <ArrowLeft01Icon />
      </Button>
      <Button
        variant="outline"
        class="size-8"
        size="icon"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}>
        <span class="sr-only">Go to next page</span>
        <ArrowRight01Icon />
      </Button>
      <Button
        variant="outline"
        class="hidden size-8 p-0 lg:flex"
        size="icon"
        onclick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}>
        <span class="sr-only">Go to last page</span>
        <ArrowRightDoubleIcon />
      </Button>
    </div>
  </div>
</div>
