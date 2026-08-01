<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { internalAuth } from '$lib/firebase/auth.svelte';

	let { children } = $props();

	onMount(() => {
		internalAuth.init();
	});

	// If already logged in, skip the login page
	$effect(() => {
		if (!internalAuth.loading && internalAuth.user) {
			goto('/workflow/reception');
		}
	});
</script>

{#if internalAuth.loading}
	<div class="flex h-screen items-center justify-center">
		<p>Loading...</p>
	</div>
{:else if !internalAuth.user}
	{@render children()}
{/if}
