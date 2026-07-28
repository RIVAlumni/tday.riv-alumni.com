<script lang="ts">
  import { user } from '$lib/data/nav';

  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import PageHeader from './page-header.svelte';
  import PageSidebarLeft from './page-sidebar-left.svelte';
  import PageWatermark from './page-watermark.svelte';
  import { setupSidebarRight } from './page-sidebar-right.svelte.ts';

  let { children } = $props();

  // Per-page right sidebar. A page opts in by rendering `<PageSidebarRight>`
  // (./page-sidebar-right.svelte) with whatever content it wants; pages that
  // don't render it get no right sidebar at all. The shell is a layout constant.
  const sidebarRight = setupSidebarRight();
</script>

<Sidebar.Provider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);">
  <PageSidebarLeft variant="inset" />
  <Sidebar.Inset>
    <PageHeader />
    <div class="flex flex-1 flex-col">
      <div class="@container/main relative flex flex-1 flex-col gap-2">
        <PageWatermark
          name={user.name}
          email={user.email} />
        {@render children()}
      </div>
    </div>
  </Sidebar.Inset>
  {#if sidebarRight.snippet}
    <Sidebar.Root
      collapsible="none"
      class="sticky top-0 hidden h-svh border-s lg:flex">
      {@render sidebarRight.snippet()}
    </Sidebar.Root>
  {/if}
</Sidebar.Provider>
