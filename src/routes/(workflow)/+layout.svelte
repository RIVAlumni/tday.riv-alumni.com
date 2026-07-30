<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { internalAuth } from '$lib/firebase/auth.svelte';

	let { children } = $props();

	onMount(() => {
		internalAuth.init();
	});

	// Redirect unauthenticated users away from workflow routes
	$effect(() => {
		if (!internalAuth.loading && !internalAuth.user) {
			// Safety check: only redirect if we're on a workflow page
			if (page.url.pathname.startsWith('/workflow')) {
				goto('/auth/login');
			}
		}
	});
</script>

{#if internalAuth.loading}
	<div class="flex h-screen items-center justify-center">
		<p>Loading…</p>
	</div>
{:else if internalAuth.user}
	{@render children()}
{/if}
