<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import type { RegistrationStatus } from '$lib/models/registration';
  import { statusMeta } from '$lib/data/reception';

  let { status }: { status: RegistrationStatus } = $props();

  const meta = $derived(statusMeta[status]);
</script>

<Badge
  variant="secondary"
  class={meta.badge}>
  {meta.label}
</Badge>
