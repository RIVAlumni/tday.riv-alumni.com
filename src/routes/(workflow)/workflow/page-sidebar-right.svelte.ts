/**
 * Per-page right-sidebar bridge for the `(workflow)` layout.
 *
 * The layout owns a reactive holder ({@link setupSidebarRight}) and renders
 * whatever snippet a page publishes into it. A page opts in by rendering
 * `page-sidebar-right.svelte` (`<PageSidebarRight>`), which calls
 * {@link useSidebarRight}; pages that don't render it get no right sidebar.
 */

import { getContext, setContext } from 'svelte';
import type { Snippet } from 'svelte';

const SIDEBAR_RIGHT_KEY = Symbol('workflow/sidebar-right');

/**
 * API a page (via `PageSidebarRight`) uses to publish right-sidebar content.
 */
export interface SidebarRightApi {
  /**
   * Publish `snippet` into the right sidebar. Returns an ownership token that
   * must be passed to {@link clear} on teardown, so a stale page can never
   * wipe out a newer page's content during navigation.
   */
  setContent(snippet: Snippet): number;
  /** Clear the sidebar iff `token` is still the active one. */
  clear(token: number): void;
}

/**
 * Set up the right-sidebar holder. Call exactly once in `+layout.svelte`.
 * Returns the reactive state the layout should render from.
 */
export function setupSidebarRight() {
  const state = $state<{ snippet: Snippet | null; token: number }>({
    snippet: null,
    token: 0,
  });

  // Monotonic counter so each registration is uniquely identifiable.
  let counter = 0;

  const api: SidebarRightApi = {
    setContent(snippet) {
      const token = ++counter;
      state.snippet = snippet;
      state.token = token;
      return token;
    },
    clear(token) {
      if (token === state.token) state.snippet = null;
    },
  };

  setContext(SIDEBAR_RIGHT_KEY, api);
  return state;
}

/**
 * Read the right-sidebar API. Usable from any component rendered inside the
 * workflow `+layout.svelte` (i.e. any workflow page or its descendants).
 */
export function useSidebarRight(): SidebarRightApi {
  const api = getContext<SidebarRightApi | undefined>(SIDEBAR_RIGHT_KEY);
  if (!api) {
    throw new Error(
      'useSidebarRight() must be used within a component rendered by the workflow +layout.svelte',
    );
  }
  return api;
}
