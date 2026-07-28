<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  import { reception } from '../reception/_shared/store.svelte';
  import type { ColumnFiltersState } from '@tanstack/table-core';
  import { Separator } from '$lib/components/ui/separator/index.js';

  import RecordsToolbar from './records-toolbar.svelte';
  import RecordsTable from './records-table.svelte';

  onMount(() => reception.hydrate());

  let registrations = $derived(reception.forEvent());
  let globalFilter = $state('');
  let columnFilters = $state<ColumnFiltersState>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let table = $state<any>(null);

  function navigateToProfile(registrationId: string) {
    goto(`/workflow/profile/${registrationId}`);
  }

  // Default the year filter to the current year on mount
  $effect(() => {
    const currentYear = new Date().getFullYear().toString();
    if (
      registrations.some((r) => r.graduating_year === currentYear) &&
      !columnFilters.some((f) => f.id === 'graduating_year')
    ) {
      columnFilters = [...columnFilters, { id: 'graduating_year', value: currentYear }];
    }
  });
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
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
