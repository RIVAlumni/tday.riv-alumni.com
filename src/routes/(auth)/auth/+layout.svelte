<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores';

  $: (async () => {
    if (typeof window === 'undefined') return;
    if ($authStore) await goto('/', { replaceState: true });
  })();
</script>

<slot />
