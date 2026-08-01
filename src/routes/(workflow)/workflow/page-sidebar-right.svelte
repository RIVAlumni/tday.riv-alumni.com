<script lang="ts">
  // Page-facing opt-in for the workflow right sidebar.
  //
  // Render this inside a `+page.svelte` and pass the sidebar's content as its
  // children - any `Sidebar.*` markup, or anything else:
  //
  //     <PageSidebarRight>
  //       <Sidebar.Header>...</Sidebar.Header>
  //       <Sidebar.Content>...</Sidebar.Content>
  //     </PageSidebarRight>
  //
  // This component renders nothing in place. It publishes its children into a
  // context slot that `+layout.svelte` renders inside the `Sidebar.Root` shell,
  // as a sibling of `Sidebar.Inset`. Pages that don't render it get no right
  // sidebar at all.
  //
  // The `Sidebar.Root` shell (sticky, bordered, non-collapsible) is a layout
  // constant owned by `+layout.svelte`, so every page's right sidebar shares
  // it without having to repeat it.

  import { onDestroy, untrack, type Snippet } from 'svelte';
  import { useSidebarRight } from './page-sidebar-right.svelte.ts';

  let { children }: { children: Snippet } = $props();

  const sidebar = useSidebarRight();
  // Register synchronously during init so the sidebar is present on the first
  // render. A page renders one stable content snippet, so capturing the
  // initial value of `children` is intentional - hence `untrack`.
  const token = untrack(() => sidebar.setContent(children));
  // Token-guarded teardown: only clears if this page is still the active one,
  // so navigating between two sidebar pages never leaves the slot empty.
  onDestroy(() => sidebar.clear(token));
</script>
