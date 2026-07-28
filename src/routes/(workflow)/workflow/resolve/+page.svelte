<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  import { reception } from '../reception/_shared/store.svelte';
  import type { ColumnFiltersState } from '@tanstack/table-core';
  import { Separator } from '$lib/components/ui/separator/index.js';

  import RecordsToolbar from '../records/records-toolbar.svelte';
  import RecordsTable from '../records/records-table.svelte';

  onMount(() => reception.hydrate());

  let registrations = $derived(reception.forEvent());
  let globalFilter = $state('');
  let columnFilters = $state<ColumnFiltersState>([{ id: 'status', value: 'CONFLICT' }]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let table = $state<any>(null);

  function navigateToProfile(registrationId: string) {
    goto(`/workflow/profile/${registrationId}`);
  }
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Conflict Resolution</h1>
    <p class="text-muted-foreground text-sm">Records flagged for review</p>
  </div>

  <Separator />

  {#if table}
    <RecordsToolbar
      {registrations}
      bind:globalFilter
      bind:columnFilters
      {table} />
  {/if}
  <RecordsTable
    {registrations}
    bind:globalFilter
    bind:columnFilters
    bind:table
    onNavigate={navigateToProfile} />
</div>
