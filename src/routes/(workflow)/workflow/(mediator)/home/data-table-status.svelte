<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { CheckmarkCircle01Icon, Loading01Icon } from '$lib/icons';
  import type { Row } from '@tanstack/table-core';
  import type { Schema } from './schemas.js';

  let { row }: { row: Row<Schema> } = $props();
</script>

<Badge
  variant="outline"
  class="text-muted-foreground px-1.5">
  {#if row.original.status === 'Done'}
    <CheckmarkCircle01Icon class="fill-green-500 dark:fill-green-400" />
  {:else}
    <Loading01Icon />
  {/if}
  {row.original.status}
</Badge>
