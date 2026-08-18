<script lang="ts">
  import { goto } from '$app/navigation';

  import { AccessLevel } from '$lib/models/user';
  import { userStore } from '$lib/stores/user.svelte';
  import { isAuthorized } from '$lib/util/user';

  let { children } = $props();

  const canAccess = $derived(
    userStore.state !== null &&
      userStore.state !== undefined &&
      isAuthorized(userStore.state, AccessLevel.Administrator),
  );

  $effect(() => {
    if (userStore.state !== undefined && !canAccess) {
      goto('/workflow/reception');
    }
  });
</script>

{#if canAccess}
  {@render children()}
{/if}
