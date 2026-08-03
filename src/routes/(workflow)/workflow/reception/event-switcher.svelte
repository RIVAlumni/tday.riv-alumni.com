<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { events } from '$lib/data/reception';
  import { CheckIcon, UnfoldMoreIcon } from '$lib/icons';
  import { eventStore } from '$lib/stores/event.svelte';
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          <Sidebar.MenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            {...props}>
            <div
              class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-heading text-xs font-semibold text-sidebar-primary-foreground">
              {eventStore.activeEvent.year.slice(-2)}
            </div>
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-semibold">{eventStore.activeEvent.title}</span>
              <span class="truncate text-xs text-muted-foreground">Reception Station</span>
            </div>
            <UnfoldMoreIcon class="ms-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        align="start"
        sideOffset={4}>
        {#each events as event (event.id)}
          <DropdownMenu.Item onSelect={() => eventStore.setActiveEvent(event.id)}>
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-heading text-[0.65rem] font-semibold text-muted-foreground">
              {event.year.slice(-2)}
            </span>
            <span class="flex-1">{event.title}</span>
            {#if event.id === eventStore.activeEventId}
              <CheckIcon class="ms-auto" />
            {/if}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
