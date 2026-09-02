<script lang="ts">
  import type {
    ColumnDef,
    PaginationState,
    RowSelectionState,
    SortingState,
  } from '@tanstack/table-core';
  import type { User } from '$lib/models/user';

  import {
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } from '@tanstack/table-core';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { createSvelteTable } from '$lib/components/ui/data-table/data-table.svelte.js';
  import { FlexRender, renderComponent } from '$lib/components/ui/data-table/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { ACCESS_LEVEL_NAMES } from '$lib/data/access';
  import {
    AddCircleIcon,
    ArrowLeft01Icon,
    ArrowLeftDoubleIcon,
    ArrowRight01Icon,
    ArrowRightDoubleIcon,
    BanIcon,
    UserMultipleIcon,
  } from '$lib/icons';
  import { accessStatusFor, formatAccessExpiry } from '$lib/util/access-time';

  import DataTableCheckbox from './data-table-checkbox.svelte';
  import DataTableSortHeader from './data-table-sort-header.svelte';
  import UserActions from './user-actions.svelte';
  import UserNameCell from './user-name-cell.svelte';
  import UserStatusCell from './user-status-cell.svelte';

  let {
    users,
    loading = false,
    now,
    currentUserUid,
    onCreatePlan,
    onUpdateDisplayName,
    onRevokeAccess,
  }: {
    users: User[];
    loading?: boolean;
    now: number;
    currentUserUid?: string;
    onCreatePlan: () => void;
    onUpdateDisplayName: (uid: string, displayName: string) => Promise<void>;
    onRevokeAccess: (uids: string[]) => Promise<void>;
  } = $props();

  const loadingRows = [0, 1, 2, 3, 4];

  let sorting = $state<SortingState>([]);
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
  let rowSelection = $state<RowSelectionState>({});
  let revokeDialogOpen = $state(false);
  let revokeTargets = $state<User[]>([]);
  let revoking = $state(false);

  function requestRevocation(targets: User[]): void {
    const revocableTargets = targets.filter((user) => user.uid !== currentUserUid);
    if (revocableTargets.length === 0 || revoking) return;
    revokeTargets = revocableTargets;
    revokeDialogOpen = true;
  }

  async function confirmRevocation(): Promise<void> {
    if (revokeTargets.length === 0 || revoking) return;

    const targets = [...revokeTargets];
    const revokedUids = new Set(targets.map((user) => user.uid));
    const remainingUserCount = users.filter((user) => !revokedUids.has(user.uid)).length;
    const lastPageIndex = Math.max(0, Math.ceil(remainingUserCount / pagination.pageSize) - 1);
    revoking = true;

    try {
      await onRevokeAccess([...revokedUids]);
      rowSelection = Object.fromEntries(
        Object.entries(rowSelection).filter(([uid]) => !revokedUids.has(uid)),
      );
      pagination = { ...pagination, pageIndex: Math.min(pagination.pageIndex, lastPageIndex) };
      revokeDialogOpen = false;
    } catch {
      return;
    } finally {
      revoking = false;
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        renderComponent(DataTableCheckbox, {
          checked: table.getIsAllRowsSelected(),
          indeterminate: table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected(),
          onCheckedChange: (value: boolean) => table.toggleAllRowsSelected(!!value),
          ariaLabel: 'Select all users',
          disabled: !table.getFilteredRowModel().flatRows.some((row) => row.getCanSelect()),
        }),
      cell: ({ row }) =>
        renderComponent(DataTableCheckbox, {
          checked: row.getIsSelected(),
          onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
          ariaLabel: `Select ${row.original.display_name}`,
          disabled: !row.getCanSelect(),
        }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'display_name',
      header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Full Name' }),
      cell: ({ row }) =>
        renderComponent(UserNameCell, {
          user: row.original,
          onUpdate: onUpdateDisplayName,
        }),
    },
    {
      id: 'status',
      accessorFn: (user) => accessStatusFor(user, now),
      header: ({ column }) => renderComponent(DataTableSortHeader, { column, label: 'Status' }),
      cell: ({ row }) => renderComponent(UserStatusCell, { user: row.original, now }),
    },
    {
      accessorKey: 'access_expires',
      header: ({ column }) =>
        renderComponent(DataTableSortHeader, { column, label: 'Access Expires' }),
      cell: ({ row }) => formatAccessExpiry(row.original.access_expires),
      sortingFn: (left, right) =>
        left.original.access_expires.toMillis() - right.original.access_expires.toMillis(),
    },
    {
      accessorKey: 'access_level',
      header: ({ column }) =>
        renderComponent(DataTableSortHeader, { column, label: 'Authorization Level' }),
      cell: ({ row }) =>
        `${ACCESS_LEVEL_NAMES[row.original.access_level]} (${row.original.access_level})`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) =>
        renderComponent(UserActions, {
          user: row.original,
          disabled: revoking || row.original.uid === currentUserUid,
          onRevoke: (user: User) => requestRevocation([user]),
        }),
      enableSorting: false,
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
      get rowSelection() {
        return rowSelection;
      },
    },
    getRowId: (user) => user.uid,
    enableRowSelection: (row) => row.original.uid !== currentUserUid,
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
    onRowSelectionChange: (updater) => {
      rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
    },
  });

  const selectedUsers = $derived(
    users.filter((user) => user.uid !== currentUserUid && rowSelection[user.uid]),
  );
  const pageCount = $derived(table.getPageCount() || 1);
  const revokeDescription = $derived(
    revokeTargets.length === 1
      ? `This immediately revokes access for ${revokeTargets[0].display_name}. Their authorization level will be set to None and their access expiry will be set to one minute ago.`
      : 'This immediately revokes access for all selected users. Their authorization levels will be set to None and their access expiries will be set to one minute ago.',
  );
  const pageSizeBind = {
    get: () => `${table.getState().pagination.pageSize}`,
    set: (value: string) => table.setPageSize(Number(value)),
  };
</script>

<div class="flex flex-wrap justify-end gap-2">
  <Button
    size="sm"
    disabled={loading}
    onclick={onCreatePlan}>
    <AddCircleIcon />
    New authorization plan
  </Button>
  <Button
    variant="destructive"
    size="sm"
    disabled={selectedUsers.length === 0 || loading || revoking}
    onclick={() => requestRevocation(selectedUsers)}>
    <BanIcon />
    Revoke selected access
  </Button>
</div>

<div class="overflow-auto rounded-lg border">
  <Table.Root>
    <Table.Header class="sticky top-0 z-10 bg-muted">
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head
              colspan={header.colSpan}
              class="[&:has([role=checkbox])]:ps-3">
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
      {#if loading}
        {#each loadingRows as rowIndex (rowIndex)}
          <Table.Row>
            {#each table.getVisibleLeafColumns() as column (column.id)}
              <Table.Cell class="[&:has([role=checkbox])]:ps-3">
                <Skeleton class={column.id === 'select' ? 'size-4' : 'h-4 w-28'} />
              </Table.Cell>
            {/each}
          </Table.Row>
        {/each}
      {:else if table.getRowModel().rows.length > 0}
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row data-state={row.getIsSelected() ? 'selected' : undefined}>
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
            class="h-32 text-center">
            <Empty.Root>
              <Empty.Header>
                <Empty.Media variant="icon">
                  <UserMultipleIcon />
                </Empty.Media>
                <Empty.Title>No users found</Empty.Title>
                <Empty.Description>No users have current or retained access.</Empty.Description>
              </Empty.Header>
            </Empty.Root>
          </Table.Cell>
        </Table.Row>
      {/if}
    </Table.Body>
  </Table.Root>
</div>

<div class="flex items-center justify-between">
  <div class="hidden flex-1 text-sm text-muted-foreground lg:flex">
    {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length}
    row(s) selected.
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
      Page {table.getState().pagination.pageIndex + 1} of {pageCount}
    </div>
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        class="hidden lg:flex"
        onclick={() => table.setPageIndex(0)}
        disabled={loading || !table.getCanPreviousPage()}>
        <span class="sr-only">Go to first page</span>
        <ArrowLeftDoubleIcon />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onclick={() => table.previousPage()}
        disabled={loading || !table.getCanPreviousPage()}>
        <span class="sr-only">Go to previous page</span>
        <ArrowLeft01Icon />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onclick={() => table.nextPage()}
        disabled={loading || !table.getCanNextPage()}>
        <span class="sr-only">Go to next page</span>
        <ArrowRight01Icon />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        class="hidden lg:flex"
        onclick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={loading || !table.getCanNextPage()}>
        <span class="sr-only">Go to last page</span>
        <ArrowRightDoubleIcon />
      </Button>
    </div>
  </div>
</div>

<AlertDialog.Root bind:open={revokeDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>
        {revokeTargets.length === 1
          ? 'Revoke access?'
          : `Revoke access for ${revokeTargets.length} users?`}
      </AlertDialog.Title>
      <AlertDialog.Description>{revokeDescription}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={revoking}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        variant="destructive"
        disabled={revoking}
        aria-busy={revoking}
        onclick={(event) => {
          event.preventDefault();
          void confirmRevocation();
        }}>
        {revoking ? 'Revoking...' : 'Revoke access'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
