<script lang="ts">
  import type { Registration } from '$lib/models/registration';
  import type { ColumnFiltersState } from '@tanstack/table-core';

  import { browser } from '$app/env';
  import { goto } from '$app/navigation';

  import { fetchConflictRegistrations, searchRegistrationsById } from '$lib/firebase';
  import { eventStore } from '$lib/stores/event.svelte';

  import RecordsTable from '../records/records-table.svelte';
  import RecordsToolbar from '../records/records-toolbar.svelte';

  let registrations = $state<Registration[]>([]);
  let searchValue = $state('');
  let submittedSearch = $state('');
  let loading = $state(false);
  let error = $state<Error | null>(null);
  let columnFilters = $state<ColumnFiltersState>([{ id: 'status', value: 'CONFLICT' }]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let table = $state<any>(null);
  let requestSequence = 0;

  async function runQuery(eventId: string, registrationId: string): Promise<void> {
    const sequence = ++requestSequence;
    loading = true;

    try {
      const results = registrationId
        ? (await searchRegistrationsById(eventId, registrationId)).filter(
            (registration) => registration.status === 'CONFLICT',
          )
        : await fetchConflictRegistrations(eventId);

      if (sequence !== requestSequence || eventId !== eventStore.activeEventId) return;
      registrations = results;
      error = null;
    } catch (queryError) {
      if (sequence !== requestSequence) return;
      registrations = [];
      error = queryError as Error;
    } finally {
      if (sequence === requestSequence) loading = false;
    }
  }

  $effect(() => {
    const eventId = eventStore.activeEventId;
    if (!browser) return;

    searchValue = '';
    submittedSearch = '';
    columnFilters = [{ id: 'status', value: 'CONFLICT' }];
    void runQuery(eventId, '');
  });

  async function search(rawValue: string): Promise<void> {
    const registrationId = rawValue.trim().toUpperCase();
    searchValue = registrationId;
    submittedSearch = registrationId;
    await runQuery(eventStore.activeEventId, registrationId);
  }

  async function reload(): Promise<void> {
    await runQuery(eventStore.activeEventId, submittedSearch);
  }

  function navigateToProfile(registrationId: string): void {
    goto(`/workflow/records/${registrationId}`);
  }
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Conflict Resolution</h1>
    <p class="text-muted-foreground text-sm">Records flagged for review</p>
  </div>

  {#if table}
    <RecordsToolbar
      {registrations}
      bind:searchValue
      bind:columnFilters
      {table}
      {loading}
      onSearch={search}
      onReload={reload} />
  {/if}

  {#if error}
    <p
      class="text-destructive text-sm"
      role="alert">
      Unable to load conflict records: {error.message}
    </p>
  {/if}

  <RecordsTable
    {registrations}
    bind:columnFilters
    bind:table
    onNavigate={navigateToProfile} />
</div>
