<script lang="ts">
  import type { WithoutChildren } from '$lib/utils';
  import type { ComponentProps } from 'svelte';
  import type { NavItem } from '$lib/data/nav';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { isPathActive } from '$lib/data/nav';

  let {
    items,
    onActivate,
    ...restProps
  }: {
    items: NavItem[];
    onActivate?: (item: NavItem) => void;
  } & WithoutChildren<ComponentProps<typeof Sidebar.Group>> = $props();

  function activate(item: NavItem): void {
    if (onActivate) {
      onActivate(item);
    } else {
      void goto(item.url);
    }
  }
</script>

<Sidebar.Group {...restProps}>
  <Sidebar.GroupContent>
    <Sidebar.Menu>
      {#each items as item (item.title)}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isPathActive(page.url.pathname, item.url)}>
            {#snippet child({ props })}
              {#if onActivate}
                <button
                  type="button"
                  onclick={() => activate(item)}
                  {...props}>
                  <item.icon />
                  <span>{item.title}</span>
                </button>
              {:else}
                <a
                  href={item.url}
                  {...props}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              {/if}
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.GroupContent>
</Sidebar.Group>
