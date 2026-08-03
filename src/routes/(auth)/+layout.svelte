<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';

  import { AccessLevel } from '$lib/models/user';
  import { userStore } from '$lib/stores/user.svelte';
  import { isAuthorized } from '$lib/util/user';

  let { children } = $props();

  onMount(() => userStore.init());

  $effect(() => {
    const user = userStore.state;
    if (user === undefined || !userStore.isSignedIn) return;
    if (!user) {
      goto('/workflow/reception');
      return;
    }

    goto(isAuthorized(user, AccessLevel.Mediator) ? '/workflow/home' : '/workflow/reception');
  });
</script>

{#if userStore.state === undefined}
  <div class="flex h-screen items-center justify-center">
    <p>Loading...</p>
  </div>
{:else if !userStore.isSignedIn}
  {@render children()}
{/if}
