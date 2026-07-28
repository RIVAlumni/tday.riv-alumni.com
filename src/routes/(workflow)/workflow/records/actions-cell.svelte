<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { MoreHorizontalIcon } from '$lib/icons';

  let {
    registrationId,
    onNavigate,
  }: {
    registrationId: string;
    onNavigate: (registrationId: string) => void;
  } = $props();
</script>

<Button
  variant="ghost"
  size="icon"
  class="size-8"
  onclick={() => onNavigate(registrationId)}>
  <span class="sr-only">View profile</span>
  <MoreHorizontalIcon />
</Button>
