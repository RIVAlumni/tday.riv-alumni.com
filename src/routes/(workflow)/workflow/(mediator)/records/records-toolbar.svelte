<script lang="ts">
  import type { Table } from '@tanstack/table-core';

  import type { Registration, RegistrationStatus } from '$lib/models/registration';

  import { tick } from 'svelte';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Command from '$lib/components/ui/command/index.js';
  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as InputGroup from '$lib/components/ui/input-group/index.js';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { events, statusMeta } from '$lib/data/reception';
  import { TEACHER_OPTIONS } from '$lib/data/teachers';
  import {
    ArrowDown01Icon,
    Cancel01Icon,
    CheckIcon,
    FilterIcon,
    Layout03Icon,
    RefreshIcon,
    Search01Icon,
    UnfoldMoreIcon,
  } from '$lib/icons';
  import { eventStore } from '$lib/stores/event.svelte';
  import { cn } from '$lib/utils';

  import type { RecordsFilterValues } from './records-filter';

  let {
    searchValue = $bindable(''),
    registeredFrom = $bindable(''),
    registeredTo = $bindable(''),
    visitingTeachers = $bindable([]),
    columnFilters = $bindable([]),
    table,
    loading = false,
    searchDescription = '',
    searchPlaceholder = 'Name, contact number, email, or registration ID',
    showRegistrationDates = false,
    showTeacherFilter = false,
    externalPagination = false,
    onEventChange,
    onSearch,
    onReload,
  }: {
    searchValue?: string;
    registeredFrom?: string;
    registeredTo?: string;
    visitingTeachers?: string[];
    columnFilters?: import('@tanstack/table-core').ColumnFiltersState;
    table: Table<Registration>;
    loading?: boolean;
    searchDescription?: string;
    searchPlaceholder?: string;
    showRegistrationDates?: boolean;
    showTeacherFilter?: boolean;
    externalPagination?: boolean;
    onEventChange?: (id: string) => void | Promise<void>;
    onSearch: (value: string, filters: RecordsFilterValues) => void | Promise<void>;
    onReload: () => void | Promise<void>;
  } = $props();

  let teacherPopoverOpen = $state(false);
  let yearPopoverOpen = $state(false);
  let yearTriggerRef = $state<HTMLButtonElement>(null!);
  let filtersOpen = $state(true);

  const teacherFilterEnabled = $derived(eventStore.activeEventId === '2026');
  const teacherFilterLabel = $derived(
    visitingTeachers.length === 0
      ? 'All'
      : visitingTeachers.length === 1
        ? visitingTeachers[0]
        : `${visitingTeachers.length} teachers selected`,
  );

  const visibleStatuses: [RegistrationStatus, (typeof statusMeta)[RegistrationStatus]][] = [
    ['REGISTERED', statusMeta.REGISTERED],
    ['CHECKED_IN', statusMeta.CHECKED_IN],
    ['CONFLICT', statusMeta.CONFLICT],
    ['REJECTED', statusMeta.REJECTED],
  ];

  const statusFilterValue = $derived.by(() => {
    const filter = columnFilters.find((item) => item.id === 'status');
    return filter ? (filter.value as RegistrationStatus) : 'all';
  });

  const statusFilterLabel = $derived(
    statusFilterValue === 'all'
      ? 'All'
      : (visibleStatuses.find(([key]) => key === statusFilterValue)?.[1].label ?? 'Status'),
  );

  const currentYear = Number(
    new Intl.DateTimeFormat('en-SG', { year: 'numeric', timeZone: 'Asia/Singapore' }).format(
      new Date(),
    ),
  );
  const availableYears = Array.from(
    { length: currentYear - 1999 + 1 },
    (_, index) => currentYear - index,
  );

  const yearFilterValue = $derived.by(() => {
    const filter = columnFilters.find((item) => item.id === 'graduating_year');
    return filter ? String(filter.value) : 'all';
  });

  const yearFilterLabel = $derived(yearFilterValue === 'all' ? 'All' : yearFilterValue);

  const hiddenCount = $derived(
    table.getAllColumns().filter((column) => column.getCanHide() && !column.getIsVisible()).length,
  );

  const hasActiveFilters = $derived(
    searchValue.trim().length > 0 ||
      statusFilterValue !== 'all' ||
      yearFilterValue !== 'all' ||
      registeredFrom.length > 0 ||
      registeredTo.length > 0 ||
      visitingTeachers.length > 0,
  );

  const activeFilterCount = $derived(
    (statusFilterValue !== 'all' ? 1 : 0) +
      (yearFilterValue !== 'all' ? 1 : 0) +
      (visitingTeachers.length > 0 ? 1 : 0) +
      (registeredFrom.length > 0 ? 1 : 0) +
      (registeredTo.length > 0 ? 1 : 0),
  );

  function setEventYear(id: string): void {
    teacherPopoverOpen = false;
    yearPopoverOpen = false;
    eventStore.setActiveEvent(id);
    void onEventChange?.(id);
  }

  function setColumnFilter(
    filters: import('@tanstack/table-core').ColumnFiltersState,
    columnId: string,
    value: string,
  ): import('@tanstack/table-core').ColumnFiltersState {
    if (value === 'all') return filters.filter((filter) => filter.id !== columnId);

    const existing = filters.find((filter) => filter.id === columnId);
    if (existing) {
      return filters.map((filter) => (filter.id === columnId ? { ...filter, value } : filter));
    }
    return [...filters, { id: columnId, value }];
  }

  function filterValues(
    filters = columnFilters,
    from = registeredFrom,
    to = registeredTo,
    teachers = visitingTeachers,
  ): RecordsFilterValues {
    const status = filters.find((filter) => filter.id === 'status')?.value;
    const graduatingYear = filters.find((filter) => filter.id === 'graduating_year')?.value;

    return {
      status: status ? (String(status) as RegistrationStatus) : 'all',
      graduatingYear: graduatingYear ? String(graduatingYear) : 'all',
      registeredFrom: from,
      registeredTo: to,
      visitingTeachers: teachers,
    };
  }

  function applyFilters(
    filters = columnFilters,
    from = registeredFrom,
    to = registeredTo,
    teachers = visitingTeachers,
  ): void {
    if (!externalPagination) table.setPageIndex(0);
    void onSearch(searchValue, filterValues(filters, from, to, teachers));
  }

  function setStatusFilter(value: string): void {
    const filters = setColumnFilter(columnFilters, 'status', value);
    columnFilters = filters;
    applyFilters(filters);
  }

  async function setYearFilter(value: string): Promise<void> {
    const filters = setColumnFilter(columnFilters, 'graduating_year', value);
    columnFilters = filters;
    yearPopoverOpen = false;
    await tick();
    yearTriggerRef.focus();
    applyFilters(filters);
  }

  function toggleTeacher(teacher: string): void {
    const teachers = visitingTeachers.includes(teacher)
      ? visitingTeachers.filter((selectedTeacher) => selectedTeacher !== teacher)
      : [...visitingTeachers, teacher];
    visitingTeachers = teachers;
    applyFilters(columnFilters, registeredFrom, registeredTo, teachers);
  }

  function setRegisteredFrom(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    registeredFrom = value;
    applyFilters(columnFilters, value, registeredTo);
  }

  function setRegisteredTo(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    registeredTo = value;
    applyFilters(columnFilters, registeredFrom, value);
  }

  function setSearchValue(event: Event): void {
    const textarea = event.currentTarget as HTMLTextAreaElement;
    const value = textarea.value.replace(/[\r\n]+/g, ' ');
    textarea.value = value;
    searchValue = value;
  }

  function handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    applyFilters();
  }

  function handleSearchSubmit(event: SubmitEvent): void {
    event.preventDefault();
    applyFilters();
  }

  function clearFilters(): void {
    yearPopoverOpen = false;
    searchValue = '';
    registeredFrom = '';
    registeredTo = '';
    visitingTeachers = [];
    columnFilters = [];
    if (!externalPagination) table.setPageIndex(0);
    void onSearch('', {
      status: 'all',
      graduatingYear: 'all',
      registeredFrom: '',
      registeredTo: '',
      visitingTeachers: [],
    });
  }

  function reload(): void {
    if (!externalPagination) table.setPageIndex(0);
    void onReload();
  }
</script>

<div class="flex flex-col gap-3">
  <Field.Field class="max-w-sm">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          <Sidebar.MenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            {...props}>
            <div
              class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-heading text-xs font-semibold text-sidebar-primary-foreground">
              {eventStore.activeEvent.year.slice(-2)}
            </div>
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-semibold">{eventStore.activeEvent.title}</span>
              <span class="truncate text-xs text-muted-foreground">Reception Station</span>
            </div>
            <UnfoldMoreIcon class="ms-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        align="start"
        sideOffset={4}>
        <DropdownMenu.Group>
          {#each events as event (event.id)}
            <DropdownMenu.Item onSelect={() => setEventYear(event.id)}>
              <span
                class="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-heading text-[0.65rem] font-semibold text-muted-foreground">
                {event.year.slice(-2)}
              </span>
              <span class="flex-1">{event.title}</span>
              {#if event.id === eventStore.activeEventId}
                <CheckIcon class="ms-auto" />
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Field.Field>

  <form onsubmit={handleSearchSubmit}>
    <Field.FieldGroup class="gap-3">
      <Field.Field>
        <Field.FieldLabel for="records-search">Search registrations</Field.FieldLabel>
        <InputGroup.Root data-disabled={loading}>
          <InputGroup.Textarea
            id="records-search"
            rows={1}
            wrap="off"
            class="min-h-14 max-h-14 overflow-y-hidden px-4 py-3 font-heading text-2xl! font-semibold"
            placeholder={searchPlaceholder}
            value={searchValue}
            disabled={loading}
            autocomplete="off"
            oninput={setSearchValue}
            onkeydown={handleSearchKeydown} />
          <InputGroup.Addon
            align="block-end"
            class="pt-3">
            <InputGroup.Text class="text-xs text-muted-foreground">
              {loading ? 'Searching...' : 'Partial information and multiple terms work.'}
            </InputGroup.Text>
            <InputGroup.Button
              type="submit"
              variant="default"
              class="ms-auto rounded-full"
              size="icon-sm"
              disabled={loading}>
              <Search01Icon />
              <span class="sr-only">Search registrations</span>
            </InputGroup.Button>
          </InputGroup.Addon>
        </InputGroup.Root>
        {#if searchDescription}
          <Field.FieldDescription>{searchDescription}</Field.FieldDescription>
        {/if}
      </Field.Field>

      <Collapsible.Root bind:open={filtersOpen}>
        <Collapsible.Trigger>
          {#snippet child({ props }: { props: Record<string, unknown> })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              {...props}>
              <span data-icon="inline-start"><FilterIcon /></span>
              Filters
              {#if activeFilterCount > 0}
                <Badge
                  variant="secondary"
                  class="size-5 rounded-full px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              {/if}
              <span
                data-icon="inline-end"
                class={cn('transition-transform duration-200', filtersOpen && 'rotate-180')}>
                <ArrowDown01Icon />
              </span>
            </Button>
          {/snippet}
        </Collapsible.Trigger>
        <Collapsible.Content class="pt-3">
          <Field.FieldGroup
            class={cn(
              'grid gap-3 sm:grid-cols-2',
              showRegistrationDates && showTeacherFilter
                ? 'xl:grid-cols-6'
                : showRegistrationDates
                  ? 'xl:grid-cols-4'
                  : showTeacherFilter
                    ? 'xl:grid-cols-4'
                    : 'xl:grid-cols-2',
            )}>
            <Field.Field>
              <Field.FieldLabel for="records-status">Status</Field.FieldLabel>
              <Select.Root
                type="single"
                value={statusFilterValue}
                disabled={loading}
                onValueChange={setStatusFilter}>
                <Select.Trigger
                  id="records-status"
                  class="w-full">
                  {statusFilterLabel}
                </Select.Trigger>
                <Select.Content>
                  <Select.Group>
                    <Select.Item value="all">All</Select.Item>
                    {#each visibleStatuses as [key, meta] (key)}
                      <Select.Item value={key}>{meta.label}</Select.Item>
                    {/each}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            </Field.Field>

            <Field.Field>
              <Field.FieldLabel for="records-year">Graduating year</Field.FieldLabel>
              <Popover.Root bind:open={yearPopoverOpen}>
                <Popover.Trigger bind:ref={yearTriggerRef}>
                  {#snippet child({ props }: { props: Record<string, unknown> })}
                    <Button
                      id="records-year"
                      type="button"
                      variant="ghost"
                      class="w-full justify-between rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm font-normal"
                      disabled={loading}
                      role="combobox"
                      aria-expanded={yearPopoverOpen}
                      {...props}>
                      <span class="min-w-0 flex-1 truncate text-left">{yearFilterLabel}</span>
                      <UnfoldMoreIcon
                        strokeWidth={2}
                        class="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  {/snippet}
                </Popover.Trigger>
                <Popover.Content
                  align="start"
                  class="w-56 p-0">
                  <Command.Root>
                    <Command.Input
                      autofocus
                      placeholder="Search years..." />
                    <Command.List>
                      <Command.Empty>No graduating years found.</Command.Empty>
                      <Command.Group heading="Graduating year">
                        <Command.Item
                          value="all"
                          data-checked={yearFilterValue === 'all'}
                          aria-selected={yearFilterValue === 'all'}
                          onSelect={() => setYearFilter('all')}>
                          <span>All</span>
                        </Command.Item>
                        {#each availableYears as year (year)}
                          <Command.Item
                            value={String(year)}
                            data-checked={yearFilterValue === String(year)}
                            aria-selected={yearFilterValue === String(year)}
                            onSelect={() => setYearFilter(String(year))}>
                            <span>{year}</span>
                          </Command.Item>
                        {/each}
                      </Command.Group>
                    </Command.List>
                  </Command.Root>
                </Popover.Content>
              </Popover.Root>
            </Field.Field>

            {#if showTeacherFilter}
              <Field.Field class="sm:col-span-2 xl:col-span-2">
                <Field.FieldLabel for="records-teachers">Visiting teachers</Field.FieldLabel>
                <Popover.Root bind:open={teacherPopoverOpen}>
                  <Popover.Trigger>
                    {#snippet child({ props }: { props: Record<string, unknown> })}
                      <Button
                        id="records-teachers"
                        type="button"
                        variant="ghost"
                        class="w-full justify-between rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm font-normal"
                        disabled={loading || !teacherFilterEnabled}
                        role="combobox"
                        aria-expanded={teacherPopoverOpen}
                        {...props}>
                        <span class="min-w-0 flex-1 truncate text-left">{teacherFilterLabel}</span>
                        <UnfoldMoreIcon
                          strokeWidth={2}
                          class="size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    {/snippet}
                  </Popover.Trigger>
                  <Popover.Content
                    align="start"
                    class="w-96 max-w-[calc(100vw-2rem)] p-0">
                    <Command.Root>
                      <Command.Input
                        autofocus
                        placeholder="Search teachers..." />
                      <Command.List aria-multiselectable="true">
                        <Command.Empty>No teachers found.</Command.Empty>
                        <Command.Group heading="Teachers">
                          {#each TEACHER_OPTIONS as teacher (teacher)}
                            <Command.Item
                              value={teacher}
                              data-checked={visitingTeachers.includes(teacher)}
                              aria-selected={visitingTeachers.includes(teacher)}
                              onSelect={() => toggleTeacher(teacher)}>
                              <span>{teacher}</span>
                            </Command.Item>
                          {/each}
                        </Command.Group>
                      </Command.List>
                    </Command.Root>
                  </Popover.Content>
                </Popover.Root>
                {#if !teacherFilterEnabled}
                  <Field.FieldDescription
                    >Available for the 2026 event only.</Field.FieldDescription>
                {/if}
              </Field.Field>
            {/if}

            {#if showRegistrationDates}
              <Field.Field>
                <Field.FieldLabel for="registered-from">Registered from</Field.FieldLabel>
                <Input
                  id="registered-from"
                  type="date"
                  class="text-sm"
                  value={registeredFrom}
                  max={registeredTo || undefined}
                  disabled={loading}
                  onchange={setRegisteredFrom} />
              </Field.Field>

              <Field.Field>
                <Field.FieldLabel for="registered-to">Registered to</Field.FieldLabel>
                <Input
                  id="registered-to"
                  type="date"
                  class="text-sm"
                  value={registeredTo}
                  min={registeredFrom || undefined}
                  disabled={loading}
                  onchange={setRegisteredTo} />
              </Field.Field>
            {/if}
          </Field.FieldGroup>
        </Collapsible.Content>
      </Collapsible.Root>

      {#if hasActiveFilters}
        <Button
          type="button"
          variant="ghost"
          class="w-fit"
          disabled={loading}
          onclick={clearFilters}>
          <span data-icon="inline-start"><Cancel01Icon /></span>
          Clear filters
        </Button>
      {/if}
    </Field.FieldGroup>
  </form>

  <div class="flex flex-wrap items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onclick={reload}>
      <span data-icon="inline-start"><RefreshIcon /></span>
      <span class="hidden sm:inline">Reload</span>
    </Button>

    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          <Button
            variant="outline"
            size="sm"
            {...props}>
            <span data-icon="inline-start"><Layout03Icon /></span>
            <span>Columns</span>
            <span data-icon="inline-end"><ArrowDown01Icon /></span>
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="start"
        class="w-48">
        <DropdownMenu.Group>
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
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    {#if hiddenCount > 0}
      <Badge variant="outline">
        {hiddenCount} column{hiddenCount !== 1 ? 's' : ''} hidden
      </Badge>
    {/if}
  </div>
</div>
