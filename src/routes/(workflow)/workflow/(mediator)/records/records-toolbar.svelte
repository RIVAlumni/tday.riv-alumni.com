<script lang="ts">
  import type { Registration, RegistrationStatus } from '$lib/models/registration';
  import type { Table } from '@tanstack/table-core';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { events, statusMeta } from '$lib/data/reception';
  import { ArrowDown01Icon, Layout03Icon, RefreshIcon, Search01Icon } from '$lib/icons';
  import { eventStore } from '$lib/stores/event.svelte';

  let {
    registrations,
    searchValue = $bindable(''),
    columnFilters = $bindable([]),
    table,
    loading = false,
    onSearch,
    onReload,
  }: {
    registrations: Registration[];
    searchValue?: string;
    columnFilters?: import('@tanstack/table-core').ColumnFiltersState;
    table: Table<Registration>;
    loading?: boolean;
    onSearch: (value: string) => void | Promise<void>;
    onReload: () => void | Promise<void>;
  } = $props();

  const eventYearLabel = $derived(
    events.find((event) => event.id === eventStore.activeEventId)?.title ?? 'Event Year',
  );

  const visibleStatuses: [RegistrationStatus, (typeof statusMeta)[RegistrationStatus]][] = [
    ['CHECKED_IN', statusMeta.CHECKED_IN],
    ['CONFLICT', statusMeta.CONFLICT],
    ['REJECTED', statusMeta.REJECTED],
  ];

  const statusFilterValue = $derived.by(() => {
    const filter = columnFilters.find((item) => item.id === 'status');
    return filter ? (filter.value as string) : 'all';
  });

  const statusFilterLabel = $derived(
    statusFilterValue === 'all'
      ? 'Status'
      : (visibleStatuses.find(([key]) => key === statusFilterValue)?.[1].label ?? 'Status'),
  );

  const availableYears = $derived(
    [...new Set(registrations.map((registration) => String(registration.graduating_year)))].sort(
      (first, second) => Number(second) - Number(first),
    ),
  );

  const yearFilterValue = $derived.by(() => {
    const filter = columnFilters.find((item) => item.id === 'graduating_year');
    return filter ? (filter.value as string) : 'all';
  });

  const yearFilterLabel = $derived(yearFilterValue === 'all' ? 'Grad Year' : yearFilterValue);

  const hiddenCount = $derived(
    table.getAllColumns().filter((column) => column.getCanHide() && !column.getIsVisible()).length,
  );

  function setEventYear(id: string): void {
    eventStore.setActiveEvent(id);
  }

  function setStatusFilter(value: string): void {
    if (value === 'all') {
      columnFilters = columnFilters.filter((filter) => filter.id !== 'status');
    } else {
      setColumnFilter('status', value);
    }
  }

  function setYearFilter(value: string): void {
    if (value === 'all') {
      columnFilters = columnFilters.filter((filter) => filter.id !== 'graduating_year');
    } else {
      setColumnFilter('graduating_year', value);
    }
  }

  function setColumnFilter(columnId: string, value: string): void {
    const existing = columnFilters.find((filter) => filter.id === columnId);
    if (existing) {
      columnFilters = columnFilters.map((filter) =>
        filter.id === columnId ? { ...filter, value } : filter,
      );
    } else {
      columnFilters = [...columnFilters, { id: columnId, value }];
    }
  }

  function handleSearchSubmit(event: SubmitEvent): void {
    event.preventDefault();
    table.setPageIndex(0);
    void onSearch(searchValue);
  }

  function reload(): void {
    table.setPageIndex(0);
    void onReload();
  }
</script>

<div class="flex flex-col gap-3">
  <form
    class="relative w-full"
    onsubmit={handleSearchSubmit}>
    <Search01Icon class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 size-5" />
    <Input
      type="search"
      placeholder="Search by registration ID"
      class="pr-24 pl-10 font-mono uppercase"
      bind:value={searchValue}
      disabled={loading}
      autocomplete="off"
      autocapitalize="characters" />
    <Button
      type="submit"
      size="sm"
      class="absolute top-1/2 right-1 -translate-y-1/2"
      disabled={loading}>
      {loading ? 'Searching...' : 'Search'}
    </Button>
  </form>

  <div class="flex items-center gap-3">
    <Select.Root
      type="single"
      value={eventStore.activeEventId}
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

  <div class="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onclick={reload}>
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
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()) as column (column.id)}
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
      <span class="text-muted-foreground text-xs">
        {hiddenCount} column{hiddenCount !== 1 ? 's' : ''} hidden
      </span>
    {/if}
  </div>
</div>
