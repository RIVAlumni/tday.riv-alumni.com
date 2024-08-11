<script lang="ts">
  import { dev } from '$app/environment';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores';

  /**
   * Pre-load authentication state
   */
  $authStore;

  $: (async () => {
    if (typeof window === 'undefined') return;

    if (dev) console.log($authStore);

    if ($authStore === null)
      await goto('/auth/continue', { replaceState: true });

    // @ts-ignore
    if ($authStore?.access_expires.toMillis() <= Date.now())
      return goto('/app/unauthorised', { replaceState: true });
  })();
</script>

<div
  class="w-full h-screen min-h-screen
				   text-white bg-background">
  {#if $authStore !== undefined}
    <slot />
  {/if}
</div>
