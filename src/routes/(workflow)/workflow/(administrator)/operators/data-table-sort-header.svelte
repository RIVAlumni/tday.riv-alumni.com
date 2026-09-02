<script lang="ts">
  import type { Column } from '@tanstack/table-core';
  import type { User } from '$lib/models/user';

  import { Button } from '$lib/components/ui/button/index.js';
  import { ArrowDown01Icon, ArrowUp01Icon, Sorting01Icon } from '$lib/icons';

  let { column, label }: { column: Column<User, unknown>; label: string } = $props();
</script>

<Button
  variant="ghost"
  size="sm"
  class="-ms-3"
  onclick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
  {label}
  {#if column.getIsSorted() === 'asc'}
    <ArrowUp01Icon />
  {:else if column.getIsSorted() === 'desc'}
    <ArrowDown01Icon />
  {:else}
    <Sorting01Icon />
  {/if}
</Button>
