<script lang="ts">
  import { Toaster } from '$lib/components/ui/sonner';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { userStore } from '$lib/stores/user.svelte';

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

<Toaster
  richColors
  duration={2_000}
  offset={{ bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 4.25rem)' }}
  mobileOffset={{ bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 4.25rem)' }} />

<Sidebar.Provider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);">
  <PageSidebarLeft variant="inset" />
  <Sidebar.Inset>
    <PageHeader />
    <div class="flex flex-1 flex-col">
      <div class="@container/main relative flex flex-1 flex-col gap-2">
        <PageWatermark
          name={userStore.state?.display_name}
          email={userStore.state?.email} />
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
