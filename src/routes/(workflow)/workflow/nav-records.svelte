<script lang="ts">
  import type { Icon } from '@tabler/icons-svelte';

  import { page } from '$app/state';
  import { DotsIcon, FolderIcon, Share3Icon, TrashIcon } from '$lib/icons';

  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { isPathActive } from '$lib/data/nav';

  let { items }: { items: { title: string; url: string; icon: Icon }[] } = $props();

  const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
  <Sidebar.GroupLabel>Records</Sidebar.GroupLabel>
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
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Sidebar.MenuAction
                {...props}
                showOnHover
                class="data-[state=open]:bg-accent rounded-sm">
                <DotsIcon />
                <span class="sr-only">More</span>
              </Sidebar.MenuAction>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            class="w-24 rounded-lg"
            side={sidebar.isMobile ? 'bottom' : 'right'}
            align={sidebar.isMobile ? 'end' : 'start'}>
            <DropdownMenu.Item>
              <FolderIcon />
              <span>Open</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <Share3Icon />
              <span>Share</span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item variant="destructive">
              <TrashIcon />
              <span>Delete</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
