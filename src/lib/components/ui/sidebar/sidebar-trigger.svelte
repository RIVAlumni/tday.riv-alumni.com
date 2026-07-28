<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { SidebarLeftIcon } from '$lib/icons';
	import { cn } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { useSidebar } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();
</script>

<Button
	bind:ref
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="icon-sm"
	class={cn("cn-sidebar-trigger", className)}
	type="button"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<SidebarLeftIcon strokeWidth={2} />
	<span class="sr-only">Toggle Sidebar</span>
</Button>
