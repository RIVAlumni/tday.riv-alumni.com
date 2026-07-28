<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import type { RegistrationStatus } from '../reception/_shared/models';
  import { statusMeta } from '../reception/_shared/models';

  let { status }: { status: RegistrationStatus } = $props();

  const meta = $derived(statusMeta[status]);
</script>

<Badge variant="secondary" class={meta.badge}>
  {meta.label}
</Badge>
