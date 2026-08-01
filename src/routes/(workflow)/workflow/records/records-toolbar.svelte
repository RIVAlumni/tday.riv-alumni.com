<script lang="ts">
  import type { Table } from '@tanstack/table-core';
  import type { Registration, RegistrationStatus } from '$lib/models/registration';
  import { statusMeta, events, type ReceptionEvent } from '../reception/_shared/models';
  import { reception } from '../reception/_shared/store.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { ArrowDown01Icon, Layout03Icon, RefreshIcon, Search01Icon } from '$lib/icons';

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

  // --- Event year filter ---
  let eventYearLabel = $derived(
    events.find((e) => e.id === reception.activeEventId)?.title ?? 'Event Year',
  );

  function setEventYear(id: string) {
    reception.setActiveEvent(id);
  }
  const visibleStatuses: [RegistrationStatus, (typeof statusMeta)[RegistrationStatus]][] = [
    ['CHECKED_IN', statusMeta.CHECKED_IN],
    ['CONFLICT', statusMeta.CONFLICT],
    ['REJECTED', statusMeta.REJECTED],
  ];

  let statusFilterValue = $derived.by(() => {
    const f = columnFilters.find((f) => f.id === 'status');
    return f ? (f.value as string) : 'all';
  });

  let statusFilterLabel = $derived(
    statusFilterValue === 'all'
      ? 'Status'
      : (visibleStatuses.find(([k]) => k === statusFilterValue)?.[1].label ?? 'Status'),
  );

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

  let yearFilterLabel = $derived(
    yearFilterValue === 'all' ? 'Grad Year' : yearFilterValue,
  );

  function setYearFilter(v: string) {
    if (v === 'all') {
      columnFilters = columnFilters.filter((f) => f.id !== 'graduating_year');
    } else {
      setColumnFilter('graduating_year', v);
    }
  }

  function reload() {
    globalFilter = '';
    columnFilters = [];
    table.setPageIndex(0);
  }

  // --- Column visibility count ---
  let hiddenCount = $derived(
    table.getAllColumns().filter((c) => c.getCanHide() && !c.getIsVisible()).length,
  );

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

  <!-- Row 2: Event Year + Status + Graduation Year -->
  <div class="flex items-center gap-3">
    <Select.Root
      type="single"
      value={reception.activeEventId}
      onValueChange={setEventYear}>
      <Select.Trigger
        size="sm"
        class="w-44">
        {eventYearLabel}
      </Select.Trigger>
      <Select.Content>
        {#each events as event (event.id)}
          <Select.Item value={event.id}>{event.title}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <Select.Root
      type="single"
      value={statusFilterValue}
      onValueChange={setStatusFilter}>
      <Select.Trigger
        size="sm"
        class="w-40">
        {statusFilterLabel}
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
        {yearFilterLabel}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="all">All years</Select.Item>
        {#each availableYears as year (year)}
          <Select.Item value={year}>{year}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <!-- Row 3: Reload + Column visibility -->
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" onclick={reload}>
      <RefreshIcon class="size-3.5" />
      <span class="hidden sm:inline">Reload</span>
    </Button>

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
    {#if hiddenCount > 0}
      <span class="text-muted-foreground text-xs">{hiddenCount} column{hiddenCount !== 1 ? 's' : ''} hidden</span>
    {/if}
  </div>
</div>
