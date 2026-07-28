<script lang="ts">
  import { UserIcon } from '$lib/icons';
  import type { Registration } from '../reception/_shared/models';

  let { registration }: { registration: Registration } = $props();
</script>

<div class="flex items-center gap-2">
  <span class="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
    <UserIcon class="size-4" />
  </span>
  <span class="truncate font-medium">{registration.full_name}</span>
</div>
