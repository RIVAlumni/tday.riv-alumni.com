<script lang="ts">
  import type { IconComponent } from '$lib/icons';

  import { page } from '$app/state';

  import * as Sidebar from '$lib/components/ui/sidebar';
  import { isPathActive } from '$lib/data/nav';

  let { items }: { items: { title: string; url: string; icon: IconComponent }[] } = $props();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
  <Sidebar.GroupLabel>System</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each items as item (item.title)}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton isActive={isPathActive(page.url.pathname, item.url)}>
          {#snippet child({ props })}
            <a
              {...props}
              href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
