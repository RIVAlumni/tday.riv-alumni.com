<script lang="ts">
  import type { ColumnFiltersState, PaginationState } from '@tanstack/table-core';

  import type { Registration } from '$lib/models/registration';
  import type { RegistrationStatus } from '$lib/models/registration';
  import type {
    RegistrationPageCursor,
    RegistrationPageDirection,
    RegistrationQueryFilters,
  } from '$lib/firebase';

  import { Timestamp } from 'firebase/firestore';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as Alert from '$lib/components/ui/alert/index.js';
  import { createSvelteTable } from '$lib/components/ui/data-table/data-table.svelte.js';
  import { fetchRegistrationPage, searchRegistrations } from '$lib/firebase';
  import { eventStore } from '$lib/stores/event.svelte';

  import type { RecordsFilterValues } from './records-filter';
  import RecordsTable from './records-table.svelte';
  import RecordsToolbar from './records-toolbar.svelte';

  const EMPTY_FILTERS: RecordsFilterValues = {
    status: 'all',
    graduatingYear: 'all',
    registeredFrom: '',
    registeredTo: '',
    visitingTeachers: [],
  };
  const URL_QUERY_KEYS = ['q', 'status', 'year', 'from', 'to', 'teachers', 'page', 'size'];
  const VALID_STATUSES: RegistrationStatus[] = ['REGISTERED', 'CHECKED_IN', 'CONFLICT', 'REJECTED'];
  const SINGAPORE_OFFSET_MILLISECONDS = 8 * 60 * 60 * 1000;

  let registrations = $state<Registration[]>([]);
  let searchValue = $state('');
  let submittedSearch = $state('');
  let registeredFrom = $state('');
  let registeredTo = $state('');
  let visitingTeachers = $state<string[]>([]);
  let submittedFilters = $state<RecordsFilterValues>({ ...EMPTY_FILTERS });
  let loading = $state(false);
  let error = $state<Error | null>(null);
  let columnFilters = $state<ColumnFiltersState>([]);
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 15 });
  let totalCount = $state(0);
  let pageCursor = $state<RegistrationPageCursor | null>(null);
  let clientPaginatedRegistrations: Registration[] = [];
  let table = $state<ReturnType<typeof createSvelteTable<Registration>>>();
  let requestSequence = 0;

  function singaporeDateBoundary(value: string, dayOffset = 0): Timestamp {
    const [year, month, day] = value.split('-').map(Number);
    return Timestamp.fromMillis(
      Date.UTC(year, month - 1, day + dayOffset) - SINGAPORE_OFFSET_MILLISECONDS,
    );
  }

  function registrationQueryFilters(
    search: string,
    filters: RecordsFilterValues,
  ): RegistrationQueryFilters {
    if (
      filters.registeredFrom &&
      filters.registeredTo &&
      filters.registeredFrom > filters.registeredTo
    ) {
      throw new Error('The registration start date must not be after the end date.');
    }

    return {
      search,
      status: filters.status === 'all' ? undefined : filters.status,
      graduatingYear: filters.graduatingYear === 'all' ? undefined : filters.graduatingYear,
      createdFrom: filters.registeredFrom
        ? singaporeDateBoundary(filters.registeredFrom)
        : undefined,
      createdBefore: filters.registeredTo
        ? singaporeDateBoundary(filters.registeredTo, 1)
        : undefined,
      visitingTeachers: filters.visitingTeachers.length > 0 ? filters.visitingTeachers : undefined,
    };
  }

  function usesClientPagination(filters: RegistrationQueryFilters): boolean {
    return filters.search.length > 0 || (filters.visitingTeachers?.length ?? 0) > 0;
  }

  function restoreFromUrl(searchParams: Pick<URLSearchParams, 'has' | 'get' | 'getAll'>): boolean {
    const params = searchParams;
    if (!URL_QUERY_KEYS.some((key) => params.has(key))) return false;

    const status = params.get('status');
    const year = params.get('year');
    const restoredFilters: RecordsFilterValues = {
      status: VALID_STATUSES.includes(status as RegistrationStatus)
        ? (status as RegistrationStatus)
        : 'all',
      graduatingYear: year ?? 'all',
      registeredFrom: params.get('from') ?? '',
      registeredTo: params.get('to') ?? '',
      visitingTeachers: params.getAll('teachers'),
    };
    const restoredPageIndex = Number(params.get('page'));
    const restoredPageSize = Number(params.get('size'));

    searchValue = params.get('q') ?? '';
    submittedSearch = searchValue;
    registeredFrom = restoredFilters.registeredFrom;
    registeredTo = restoredFilters.registeredTo;
    visitingTeachers = [...restoredFilters.visitingTeachers];
    submittedFilters = {
      ...restoredFilters,
      visitingTeachers: [...restoredFilters.visitingTeachers],
    };
    columnFilters = [];
    if (restoredFilters.status !== 'all') {
      columnFilters.push({ id: 'status', value: restoredFilters.status });
    }
    if (restoredFilters.graduatingYear !== 'all') {
      columnFilters.push({ id: 'graduating_year', value: restoredFilters.graduatingYear });
    }
    pagination = {
      pageIndex:
        Number.isInteger(restoredPageIndex) && restoredPageIndex > 0 ? restoredPageIndex : 0,
      pageSize: Number.isInteger(restoredPageSize) && restoredPageSize > 0 ? restoredPageSize : 15,
    };
    return true;
  }

  function syncUrl(): void {
    const params = new URLSearchParams();
    if (submittedSearch) params.set('q', submittedSearch);
    if (submittedFilters.status !== 'all') params.set('status', submittedFilters.status);
    if (submittedFilters.graduatingYear !== 'all') {
      params.set('year', submittedFilters.graduatingYear);
    }
    if (submittedFilters.registeredFrom) params.set('from', submittedFilters.registeredFrom);
    if (submittedFilters.registeredTo) params.set('to', submittedFilters.registeredTo);
    for (const teacher of submittedFilters.visitingTeachers) params.append('teachers', teacher);
    if (pagination.pageIndex > 0) params.set('page', String(pagination.pageIndex));
    if (pagination.pageSize !== 15) params.set('size', String(pagination.pageSize));
    const query = params.toString();
    void goto(query ? `/workflow/records?${query}` : '/workflow/records', { replaceState: true });
  }

  function sortRegistrations(values: Registration[]): Registration[] {
    return [...values].sort((left, right) =>
      String(left.registration_id).localeCompare(String(right.registration_id), 'en-SG', {
        numeric: true,
        sensitivity: 'base',
      }),
    );
  }

  async function runQuery(
    eventId: string,
    querySearch: string,
    filterValues: RecordsFilterValues,
    requestedPagination: PaginationState,
    direction: RegistrationPageDirection = 'first',
    reuseClientResults = false,
  ): Promise<void> {
    const sequence = ++requestSequence;
    loading = true;

    try {
      const filters = registrationQueryFilters(querySearch, filterValues);
      let nextRegistrations: Registration[];
      let nextTotalCount: number;
      let nextCursor: RegistrationPageCursor | null;
      let nextClientResults: Registration[];

      if (usesClientPagination(filters)) {
        const allResults = reuseClientResults
          ? clientPaginatedRegistrations
          : sortRegistrations(await searchRegistrations(eventId, filters));
        const pageStart = requestedPagination.pageIndex * requestedPagination.pageSize;
        nextRegistrations = allResults.slice(pageStart, pageStart + requestedPagination.pageSize);
        nextTotalCount = allResults.length;
        nextCursor = null;
        nextClientResults = allResults;
      } else {
        const result = await fetchRegistrationPage(eventId, {
          pageSize: requestedPagination.pageSize,
          direction,
          cursor: pageCursor,
          filters,
        });
        nextRegistrations = result.registrations;
        nextTotalCount = result.totalCount;
        nextCursor = result.cursor;
        nextClientResults = [];
      }

      if (sequence !== requestSequence || eventId !== eventStore.activeEventId) return;
      registrations = nextRegistrations;
      totalCount = nextTotalCount;
      pageCursor = nextCursor;
      clientPaginatedRegistrations = nextClientResults;
      error = null;
    } catch (queryError) {
      if (sequence !== requestSequence) return;
      registrations = [];
      totalCount = 0;
      pageCursor = null;
      clientPaginatedRegistrations = [];
      error = queryError as Error;
    } finally {
      if (sequence === requestSequence) loading = false;
    }
  }

  function loadEvent(eventId: string): void {
    const firstPage = { pageIndex: 0, pageSize: pagination.pageSize };
    searchValue = '';
    submittedSearch = '';
    registeredFrom = '';
    registeredTo = '';
    visitingTeachers = [];
    submittedFilters = { ...EMPTY_FILTERS, visitingTeachers: [] };
    columnFilters = [];
    pagination = firstPage;
    totalCount = 0;
    pageCursor = null;
    clientPaginatedRegistrations = [];
    void goto('/workflow/records', { replaceState: true });
    void runQuery(eventId, '', EMPTY_FILTERS, firstPage);
  }

  onMount(() => {
    let mounted = true;
    // Parent layout hydrates eventStore in its onMount callback.
    queueMicrotask(() => {
      if (!mounted) return;
      if (restoreFromUrl(page.url.searchParams)) {
        void runQuery(eventStore.activeEventId, submittedSearch, submittedFilters, pagination);
      } else {
        loadEvent(eventStore.activeEventId);
      }
    });
    return () => {
      mounted = false;
    };
  });

  async function search(rawValue: string, filters: RecordsFilterValues): Promise<void> {
    const normalizedSearch = rawValue.trim();
    const firstPage = { pageIndex: 0, pageSize: pagination.pageSize };
    searchValue = normalizedSearch;
    submittedSearch = normalizedSearch;
    submittedFilters = { ...filters, visitingTeachers: [...filters.visitingTeachers] };
    pagination = firstPage;
    syncUrl();
    await runQuery(eventStore.activeEventId, normalizedSearch, filters, firstPage);
  }

  async function reload(): Promise<void> {
    const firstPage = { pageIndex: 0, pageSize: pagination.pageSize };
    pagination = firstPage;
    await runQuery(eventStore.activeEventId, submittedSearch, submittedFilters, firstPage);
  }

  async function paginate(
    nextPagination: PaginationState,
    previousPagination: PaginationState,
  ): Promise<void> {
    const lastPageIndex = Math.max(0, Math.ceil(totalCount / nextPagination.pageSize) - 1);
    const direction: RegistrationPageDirection =
      nextPagination.pageSize !== previousPagination.pageSize || nextPagination.pageIndex === 0
        ? 'first'
        : nextPagination.pageIndex > previousPagination.pageIndex + 1 &&
            nextPagination.pageIndex === lastPageIndex
          ? 'last'
          : nextPagination.pageIndex > previousPagination.pageIndex
            ? 'next'
            : 'previous';
    await runQuery(
      eventStore.activeEventId,
      submittedSearch,
      submittedFilters,
      nextPagination,
      direction,
      true,
    );
    syncUrl();
  }

  function navigateToProfile(registrationId: string): void {
    // carry the current query so the detail page's back link restores it
    goto(`/workflow/records/${registrationId}${page.url.search}`);
  }
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
  {#if table}
    <RecordsToolbar
      bind:searchValue
      bind:registeredFrom
      bind:registeredTo
      bind:visitingTeachers
      bind:columnFilters
      {table}
      {loading}
      showRegistrationDates
      showTeacherFilter
      externalPagination
      onEventChange={loadEvent}
      onSearch={search}
      onReload={reload} />
  {/if}

  {#if error}
    <Alert.Root variant="destructive">
      <Alert.Title>Unable to load registrations</Alert.Title>
      <Alert.Description>{error.message}</Alert.Description>
    </Alert.Root>
  {/if}

  <RecordsTable
    {registrations}
    {totalCount}
    {loading}
    manualPagination
    bind:columnFilters
    bind:pagination
    bind:table
    onPaginationChange={paginate}
    onNavigate={navigateToProfile} />
</div>
