<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
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
		<div class="flex w-full max-w-sm flex-col items-center gap-4 px-4">
			<Skeleton class="size-16 rounded-full" />
			<div class="flex w-full flex-col gap-3">
				<Skeleton class="h-4 w-3/4" />
				<Skeleton class="h-4 w-1/2" />
			</div>
			<div class="mt-4 flex w-full flex-col gap-3">
				<Skeleton class="h-12 w-full rounded-xl" />
				<Skeleton class="h-12 w-full rounded-xl" />
			</div>
		</div>
	</div>
{:else if internalAuth.user}
	{@render children()}
{/if}
