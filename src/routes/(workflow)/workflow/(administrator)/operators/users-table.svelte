<script lang="ts">
  import type { Timestamp } from 'firebase/firestore';
  import type { User } from '$lib/models/user';
  import type {
    ColumnDef,
    PaginationState,
    SortingState,
    VisibilityState,
  } from '@tanstack/table-core';

  import { onMount } from 'svelte';

  import { FlexRender, renderComponent } from '$lib/components/ui/data-table';
  import { createSvelteTable } from '$lib/components/ui/data-table/data-table.svelte.js';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Empty from '$lib/components/ui/empty';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Table from '$lib/components/ui/table';
  import {
    ArrowDown01Icon,
    ArrowLeft01Icon,
    ArrowLeftDoubleIcon,
    ArrowRight01Icon,
    ArrowRightDoubleIcon,
    LayoutGridIcon,
    UserMultipleIcon,
  } from '$lib/icons';
  import { AccessLevel } from '$lib/models/user';
  import {
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } from '@tanstack/table-core';

  import AccessExpiryCell from './access-expiry-cell.svelte';
  import AuthorizationCell from './authorization-cell.svelte';
  import AvatarCell from './avatar-cell.svelte';

  let {
    users,
    loading = false,
    onUpdateAccessExpiry,
    onUpdateAuthorization,
  }: {
    users: User[];
    loading?: boolean;
    onUpdateAccessExpiry: (uid: string, accessExpires: Timestamp) => Promise<void>;
    onUpdateAuthorization: (uid: string, accessLevel: AccessLevel) => Promise<void>;
  } = $props();

  let sorting = $state<SortingState>([]);
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
  let columnVisibility = $state<VisibilityState>({});

  const VISIBILITY_KEY = 'users:column-visibility';
  const loadingRows = [0, 1, 2, 3, 4];

  onMount(() => {
    try {
      const stored = localStorage.getItem(VISIBILITY_KEY);
      if (stored) columnVisibility = JSON.parse(stored) as VisibilityState;
    } catch {
      // Use the default visibility when storage is unavailable or invalid.
    }
  });

  function updateColumnVisibility(value: VisibilityState): void {
    columnVisibility = value;
    try {
      localStorage.setItem(VISIBILITY_KEY, JSON.stringify(value));
    } catch {
      // The table still works when storage is unavailable.
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      id: 'avatar',
      header: 'Avatar',
      cell: ({ row }) => renderComponent(AvatarCell, { name: row.original.display_name }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'display_name',
      header: 'Full Name',
      enableHiding: false,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'access_expires',
      header: 'Access Expires',
      cell: ({ row }) =>
        renderComponent(AccessExpiryCell, {
          user: row.original,
          onUpdate: onUpdateAccessExpiry,
        }),
      sortingFn: (left, right) =>
        left.original.access_expires.toMillis() - right.original.access_expires.toMillis(),
    },
    {
      accessorKey: 'access_level',
      header: 'Authorization',
      cell: ({ row }) =>
        renderComponent(AuthorizationCell, {
          user: row.original,
          onUpdate: onUpdateAuthorization,
        }),
      enableHiding: false,
    },
  ];

  const table = createSvelteTable({
    get data() {
      return users;
    },
    columns,
    state: {
      get sorting() {
        return sorting;
      },
      get pagination() {
        return pagination;
      },
      get columnVisibility() {
        return columnVisibility;
      },
    },
    getRowId: (user) => user.uid,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater;
    },
    onPaginationChange: (updater) => {
      pagination = typeof updater === 'function' ? updater(pagination) : updater;
    },
    onColumnVisibilityChange: (updater) => {
      updateColumnVisibility(typeof updater === 'function' ? updater(columnVisibility) : updater);
    },
  });

  const pageSizeBind = {
    get: () => `${table.getState().pagination.pageSize}`,
    set: (value: string) => table.setPageSize(Number(value)),
  };
</script>

<div class="flex items-center justify-between gap-4">
  <p class="text-muted-foreground text-sm">
    {#if loading}
      Loading users...
    {:else}
      {users.length} user{users.length === 1 ? '' : 's'}
    {/if}
  </p>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          variant="outline"
          size="sm"
          {...props}>
          <LayoutGridIcon />
          <span class="hidden sm:inline">Customize Columns</span>
          <span class="sm:hidden">Columns</span>
          <ArrowDown01Icon />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
      align="end"
      class="w-56">
      <DropdownMenu.Group>
        {#each table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()) as column (column.id)}
          <DropdownMenu.CheckboxItem
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}>
            {column.columnDef.header}
          </DropdownMenu.CheckboxItem>
        {/each}
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<div class="overflow-auto rounded-lg border">
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
      {#if loading}
        {#each loadingRows as rowIndex (rowIndex)}
          <Table.Row>
            {#each table.getVisibleLeafColumns() as column (column.id)}
              <Table.Cell>
                <Skeleton class={column.id === 'avatar' ? 'size-8 rounded-full' : 'h-4 w-28'} />
              </Table.Cell>
            {/each}
          </Table.Row>
        {/each}
      {:else if table.getRowModel().rows.length > 0}
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row>
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
            colspan={table.getVisibleLeafColumns().length}
            class="h-32 text-center">
            <Empty.Root>
              <Empty.Header>
                <Empty.Media variant="icon">
                  <UserMultipleIcon />
                </Empty.Media>
                <Empty.Title>No users found</Empty.Title>
                <Empty.Description>No user documents are available.</Empty.Description>
              </Empty.Header>
            </Empty.Root>
          </Table.Cell>
        </Table.Row>
      {/if}
    </Table.Body>
  </Table.Root>
</div>

<div class="flex items-center justify-between">
  <div class="text-muted-foreground hidden flex-1 text-sm lg:flex">
    {table.getFilteredRowModel().rows.length} user{table.getFilteredRowModel().rows.length === 1
      ? ''
      : 's'}
  </div>
  <div class="flex w-full items-center gap-6 lg:w-fit">
    <div class="hidden items-center gap-2 lg:flex">
      <Label
        for="users-rows-per-page"
        class="text-sm font-medium">Rows per page</Label>
      <Select.Root
        type="single"
        disabled={loading}
        bind:value={pageSizeBind.get, pageSizeBind.set}>
        <Select.Trigger
          size="sm"
          class="w-20"
          id="users-rows-per-page">
          {table.getState().pagination.pageSize}
        </Select.Trigger>
        <Select.Content side="top">
          <Select.Group>
            {#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
              <Select.Item value={pageSize.toString()}>{pageSize}</Select.Item>
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>
    <div class="flex w-fit items-center justify-center text-sm font-medium">
      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
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
        class="size-8"
        size="icon"
        onclick={() => table.previousPage()}
        disabled={loading || !table.getCanPreviousPage()}>
        <span class="sr-only">Go to previous page</span>
        <ArrowLeft01Icon />
      </Button>
      <Button
        variant="outline"
        class="size-8"
        size="icon"
        onclick={() => table.nextPage()}
        disabled={loading || !table.getCanNextPage()}>
        <span class="sr-only">Go to next page</span>
        <ArrowRight01Icon />
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
