<script lang="ts">
  import { page } from '$app/state';
  import LiveClock from '$lib/components/live-clock.svelte';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { pageTitleForPath } from '$lib/data/nav.js';
  import { getPageTitle } from '$lib/data/page-title.svelte.js';

  const override = $derived(getPageTitle());
  const pageTitle = $derived(override ?? pageTitleForPath(page.url.pathname));
</script>

<svelte:head>
  <title>{`${pageTitle} | RIVA Internal Systems`}</title>
</svelte:head>

<header
  class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
  <div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
    <Sidebar.Trigger class="-ms-1" />
    <Separator
      orientation="vertical"
      class="mx-2 data-[orientation=vertical]:h-4" />
    <h1 class="min-w-0 flex-1 truncate text-base font-medium">{pageTitle}</h1>
    <div class="ms-auto flex items-center gap-2">
      <LiveClock class="hidden sm:inline-flex" />
    </div>
  </div>
</header>
