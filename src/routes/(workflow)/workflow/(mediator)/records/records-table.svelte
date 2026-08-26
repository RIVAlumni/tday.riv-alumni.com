<script lang="ts">
  import { onMount } from 'svelte';
  import type { Registration } from '$lib/models/registration';
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
  import * as Empty from '$lib/components/ui/empty/index.js';
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
    pagination = $bindable({ pageIndex: 0, pageSize: 15 }),
    table = $bindable(),
    totalCount = 0,
    manualPagination = false,
    loading = false,
    onPaginationChange,
    onNavigate,
  }: {
    registrations: Registration[];
    globalFilter?: string;
    columnFilters?: ColumnFiltersState;
    pagination?: PaginationState;
    table?: ReturnType<typeof createSvelteTable<Registration>>;
    totalCount?: number;
    manualPagination?: boolean;
    loading?: boolean;
    onPaginationChange?: (
      pagination: PaginationState,
      previousPagination: PaginationState,
    ) => void | Promise<void>;
    onNavigate: (registrationId: string) => void;
  } = $props();

  // --- Table state ---
  // No default sort: the server returns records newest-first (created_at desc).
  let sorting = $state<SortingState>([]);

  const VISIBILITY_KEY = 'records:column-visibility';
  let columnVisibility = $state<VisibilityState>({});

  onMount(() => {
    try {
      const raw = localStorage.getItem(VISIBILITY_KEY);
      if (raw) columnVisibility = JSON.parse(raw) as VisibilityState;
    } catch {
      /* noop */
    }
  });

  function updateColumnVisibility(value: VisibilityState): void {
    columnVisibility = value;
    try {
      localStorage.setItem(VISIBILITY_KEY, JSON.stringify(value));
    } catch {
      /* noop */
    }
  }

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
        renderComponent(ActionsCell, {
          registrationId: String(row.original.registration_id),
          onNavigate,
        }),
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
    get manualPagination() {
      return manualPagination;
    },
    get pageCount() {
      return manualPagination ? Math.ceil(totalCount / pagination.pageSize) : undefined;
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'auto',
    onPaginationChange: (updater) => {
      if (loading) return;
      const previousPagination = pagination;
      const updatedPagination =
        typeof updater === 'function' ? updater(previousPagination) : updater;
      const nextPagination =
        updatedPagination.pageSize !== previousPagination.pageSize
          ? { ...updatedPagination, pageIndex: 0 }
          : updatedPagination;
      pagination = nextPagination;
      void onPaginationChange?.(nextPagination, previousPagination);
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
      updateColumnVisibility(typeof updater === 'function' ? updater(columnVisibility) : updater);
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

  // page numbers with an ellipsis window around the current page
  function getPageItems(pageIndex: number, pageCount: number): (number | '...')[] {
    const current = pageIndex + 1;
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const items: (number | '...')[] = [1];
    const windowStart = Math.max(2, current - 2);
    const windowEnd = Math.min(pageCount - 1, current + 2);
    if (windowStart > 2) items.push('...');
    for (let page = windowStart; page <= windowEnd; page++) items.push(page);
    if (windowEnd < pageCount - 1) items.push('...');
    items.push(pageCount);
    return items;
  }

  const pageCount = $derived(table.getPageCount() || 1);
  const pageIndex = $derived(table.getState().pagination.pageIndex);
  const pageItems = $derived(getPageItems(pageIndex, pageCount));
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
            <Empty.Root>
              <Empty.Header>
                <Empty.Media variant="icon">
                  <UserIcon />
                </Empty.Media>
                <Empty.Title>No registrations found</Empty.Title>
                <Empty.Description>Try adjusting your search or filters.</Empty.Description>
              </Empty.Header>
            </Empty.Root>
          </Table.Cell>
        </Table.Row>
      {/if}
    </Table.Body>
  </Table.Root>
</div>

<!-- Pagination -->
<div class="flex items-center justify-between">
  <div class="text-muted-foreground hidden flex-1 text-sm lg:flex">
    {#if manualPagination}
      {registrations.length} of {totalCount} registration(s)
    {:else}
      {table.getFilteredRowModel().rows.length} of {registrations.length} registration(s)
    {/if}
  </div>
  <div class="flex w-full flex-wrap items-center gap-x-6 gap-y-2 lg:w-fit">
    <div class="hidden items-center gap-2 lg:flex">
      <Label
        for="rows-per-page"
        class="text-sm font-medium">Rows per page</Label>
      <Select.Root
        type="single"
        disabled={loading}
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
      Page {pageIndex + 1} of
      {pageCount}
    </div>
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        class="hidden size-8 p-0 lg:flex"
        onclick={() => table.setPageIndex(0)}
        disabled={loading || !table.getCanPreviousPage()}>
        <span class="sr-only">Go to first page</span>
        <ArrowLeftDoubleIcon />
      </Button>
      <Button
        variant="outline"
        class="size-8 gap-1 p-0 lg:size-auto lg:px-3 lg:py-2"
        onclick={() => table.previousPage()}
        disabled={loading || !table.getCanPreviousPage()}>
        <span class="sr-only">Go to previous page</span>
        <ArrowLeft01Icon />
        <span class="hidden lg:inline">Prev</span>
      </Button>
      {#if pageCount > 1}
        <div class="flex items-center">
          {#each pageItems as item, i (i)}
            {#if item === '...'}
              <span class="grid size-8 select-none place-items-center text-sm text-muted-foreground"
                >...</span>
            {:else}
              <button
                type="button"
                class="grid size-8 cursor-pointer place-items-center rounded-full text-sm transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 {item ===
                pageIndex + 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'}"
                aria-label={`Go to page ${item}`}
                aria-current={item === pageIndex + 1 ? 'page' : undefined}
                disabled={loading}
                onclick={() => table.setPageIndex(item - 1)}>
                {item}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
      <Button
        variant="outline"
        class="size-8 gap-1 p-0 lg:size-auto lg:px-3 lg:py-2"
        onclick={() => table.nextPage()}
        disabled={loading || !table.getCanNextPage()}>
        <span class="sr-only">Go to next page</span>
        <ArrowRight01Icon />
        <span class="hidden lg:inline">Next</span>
      </Button>
      <Button
        variant="outline"
        class="hidden size-8 p-0 lg:flex"
        size="icon"
        onclick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={loading || !table.getCanNextPage()}>
        <span class="sr-only">Go to last page</span>
        <ArrowRightDoubleIcon />
      </Button>
    </div>
  </div>
</div>
