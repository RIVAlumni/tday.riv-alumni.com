<script lang="ts">
  import type { ColumnFiltersState } from '@tanstack/table-core';

  import type { Registration } from '$lib/models/registration';

  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { createSvelteTable } from '$lib/components/ui/data-table/data-table.svelte.js';
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
  let table = $state<ReturnType<typeof createSvelteTable<Registration>>>();
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

  function loadEvent(eventId: string): void {
    searchValue = '';
    submittedSearch = '';
    columnFilters = [{ id: 'status', value: 'CONFLICT' }];
    void runQuery(eventId, '');
  }

  onMount(() => {
    let mounted = true;
    // Parent layout hydrates eventStore in its onMount callback.
    queueMicrotask(() => {
      if (mounted) loadEvent(eventStore.activeEventId);
    });
    return () => {
      mounted = false;
    };
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
      bind:searchValue
      bind:columnFilters
      {table}
      {loading}
      searchDescription="Enter a complete registration ID."
      searchPlaceholder="Search by registration ID"
      onEventChange={loadEvent}
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
