<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import type { RegistrationStatus } from '$lib/models/registration';
  import { statusMeta } from '$lib/data/reception';

  let { status }: { status: RegistrationStatus | string } = $props();

  const meta = $derived(statusMeta[status as RegistrationStatus]);
  const fallbackLabel = $derived.by(() => {
    const value = String(status ?? '')
      .trim()
      .replace(/[_-]+/g, ' ')
      .toLowerCase();
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
  });
</script>

<Badge
  variant="secondary"
  class={meta?.badge}>
  {meta?.label ?? fallbackLabel}
</Badge>
