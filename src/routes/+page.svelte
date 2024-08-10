<script lang="ts">
  import { authStore } from '$lib/stores';
  import { goto } from '$app/navigation';

  $: (async () => {
    if (typeof window === 'undefined') return;
    if (!$authStore) await goto('/auth/continue', { replaceState: true });
  })();
</script>

<svelte:head>
  <title>RIVA Teachers' Day System</title>
</svelte:head>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
