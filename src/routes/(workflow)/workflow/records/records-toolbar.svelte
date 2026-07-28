<script lang="ts">
  import type { Table } from '@tanstack/table-core';
  import type { Registration, RegistrationStatus } from '../reception/_shared/models';
  import { statusMeta } from '../reception/_shared/models';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { ArrowDown01Icon, Layout03Icon, Search01Icon } from '$lib/icons';

  let {
    registrations,
    globalFilter = $bindable(''),
    columnFilters = $bindable([]),
    table,
  }: {
    registrations: Registration[];
    globalFilter?: string;
    columnFilters?: import('@tanstack/table-core').ColumnFiltersState;
    table: Table<Registration>;
  } = $props();

  // --- Status filter ---
  const visibleStatuses: [RegistrationStatus, (typeof statusMeta)[RegistrationStatus]][] = [
    ['CHECKED_IN', statusMeta.CHECKED_IN],
    ['CONFLICT', statusMeta.CONFLICT],
    ['REJECTED', statusMeta.REJECTED],
  ];

  let statusFilterValue = $derived.by(() => {
    const f = columnFilters.find((f) => f.id === 'status');
    return f ? (f.value as string) : 'all';
  });

  function setStatusFilter(v: string) {
    if (v === 'all') {
      columnFilters = columnFilters.filter((f) => f.id !== 'status');
    } else {
      setColumnFilter('status', v);
    }
  }

  // --- Year filter ---
  let availableYears = $derived(
    [...new Set(registrations.map((r) => r.graduating_year))].sort((a, b) => Number(b) - Number(a)),
  );

  let yearFilterValue = $derived.by(() => {
    const f = columnFilters.find((f) => f.id === 'graduating_year');
    return f ? (f.value as string) : 'all';
  });

  function setYearFilter(v: string) {
    if (v === 'all') {
      columnFilters = columnFilters.filter((f) => f.id !== 'graduating_year');
    } else {
      setColumnFilter('graduating_year', v);
    }
  }

  // --- Shared ---
  function setColumnFilter(columnId: string, value: string) {
    const existing = columnFilters.find((f) => f.id === columnId);
    if (existing) {
      columnFilters = columnFilters.map((f) => (f.id === columnId ? { ...f, value } : f));
    } else {
      columnFilters = [...columnFilters, { id: columnId, value }];
    }
  }
</script>

<div class="flex flex-col gap-3">
  <!-- Row 1: Search (full width) -->
  <div class="relative w-full">
    <Search01Icon class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 size-5" />
    <Input
      type="search"
      placeholder="Search full name or current institution"
      class="pl-10"
      bind:value={globalFilter} />
  </div>

  <!-- Row 2: Status + Year -->
  <div class="flex items-center gap-3">
    <Select.Root
      type="single"
      value={statusFilterValue}
      onValueChange={setStatusFilter}>
      <Select.Trigger
        size="sm"
        class="w-36">
        Status
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="all">All statuses</Select.Item>
        {#each visibleStatuses as [key, meta] (key)}
          <Select.Item value={key}>{meta.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <Select.Root
      type="single"
      value={yearFilterValue}
      onValueChange={setYearFilter}>
      <Select.Trigger
        size="sm"
        class="w-28">
        Year
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="all">All years</Select.Item>
        {#each availableYears as year (year)}
          <Select.Item value={year}>{year}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <!-- Row 3: Column visibility -->
  <div>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          <Button
            variant="outline"
            size="sm"
            {...props}>
            <Layout03Icon />
            <span>Columns</span>
            <ArrowDown01Icon />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="start"
        class="w-48">
        {#each table
          .getAllColumns()
          .filter((col) => typeof col.accessorFn !== 'undefined' && col.getCanHide()) as column (column.id)}
          <DropdownMenu.CheckboxItem
            class="capitalize"
            checked={column.getIsVisible()}
            closeOnSelect={false}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}>
            {column.id.replace(/_/g, ' ')}
          </DropdownMenu.CheckboxItem>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
</div>
