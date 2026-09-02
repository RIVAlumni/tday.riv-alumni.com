<script lang="ts">
  import type { User } from '$lib/models/user';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { accessStatusFor } from '$lib/util/access-time';

  let { user, now }: { user: User; now: number } = $props();

  const status = $derived(accessStatusFor(user, now));
</script>

{#if status === 'Active'}
  <Badge>Active</Badge>
{:else if status === 'Expired'}
  <Badge variant="destructive">Expired</Badge>
{:else}
  <Badge variant="secondary">No access</Badge>
{/if}
