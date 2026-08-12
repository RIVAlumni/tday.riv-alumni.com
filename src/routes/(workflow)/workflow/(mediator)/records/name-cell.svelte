<script lang="ts">
  import { UserIcon } from '$lib/icons';
  import { is2026, type Registration } from '$lib/models/registration';

  let { registration }: { registration: Registration } = $props();

  const photoUrl: string | undefined = $derived(
    is2026(registration) ? registration.photo_url || undefined : undefined,
  );
</script>

<div class="flex items-center gap-2">
  {#if photoUrl}
    <img
      src={photoUrl}
      alt={registration.full_name}
      class="size-8 shrink-0 rounded-full object-cover"
      referrerpolicy="no-referrer"
      loading="lazy" />
  {:else}
    <span class="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
      <UserIcon class="size-4" />
    </span>
  {/if}
  <span class="truncate font-medium">{registration.full_name}</span>
</div>
