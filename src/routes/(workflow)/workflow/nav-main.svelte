<script lang="ts">
  import type { IconComponent } from '$lib/icons';

  import { page } from '$app/state';
  import { AddCircleIcon, Mail01Icon } from '$lib/icons';

  import { Button } from '$lib/components/ui/button';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { isPathActive } from '$lib/data/nav';

  let { items }: { items: { title: string; url: string; icon?: IconComponent }[] } = $props();
</script>

<Sidebar.Group>
  <Sidebar.GroupContent class="flex flex-col gap-2">
    <Sidebar.Menu>
      <Sidebar.MenuItem class="flex items-center gap-2">
        <Sidebar.MenuButton
          class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
          tooltipContent="Quick create">
          <AddCircleIcon />
          <span>Quick Create</span>
        </Sidebar.MenuButton>
        <Button
          size="icon"
          class="size-8 group-data-[collapsible=icon]:opacity-0"
          variant="outline">
          <Mail01Icon />
          <span class="sr-only">Inbox</span>
        </Button>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
    <Sidebar.Menu>
      {#each items as item (item.title)}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            tooltipContent={item.title}
            isActive={isPathActive(page.url.pathname, item.url)}>
            {#snippet child({ props })}
              <a
                href={item.url}
                {...props}>
                {#if item.icon}
                  <item.icon />
                {/if}
                <span>{item.title}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.GroupContent>
</Sidebar.Group>
