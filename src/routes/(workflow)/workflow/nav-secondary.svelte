<script lang="ts">
  import type { WithoutChildren } from '$lib/utils';
  import type { ComponentProps } from 'svelte';
  import type { IconComponent } from '$lib/icons';

  import { page } from '$app/state';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { isPathActive } from '$lib/data/nav';

  let {
    items,
    ...restProps
  }: { items: { title: string; url: string; icon: IconComponent }[] } & WithoutChildren<
    ComponentProps<typeof Sidebar.Group>
  > = $props();
</script>

<Sidebar.Group {...restProps}>
  <Sidebar.GroupContent>
    <Sidebar.Menu>
      {#each items as item (item.title)}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isPathActive(page.url.pathname, item.url)}>
            {#snippet child({ props })}
              <a
                href={item.url}
                {...props}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.GroupContent>
</Sidebar.Group>
