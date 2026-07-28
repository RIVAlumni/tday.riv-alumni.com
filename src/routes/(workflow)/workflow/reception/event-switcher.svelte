<script lang="ts">
  // ── Component imports from $lib ───────────────────────────────────────
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

  // ── Icon imports from $lib ────────────────────────────────────────────
  import { CheckIcon, UnfoldMoreIcon } from '$lib/icons';

  let { events, defaultEvent }: { events: string[]; defaultEvent: string } = $props();

  // svelte-ignore state_referenced_locally
  let selectedEvent = $state(defaultEvent);

  /** "Teachers Day 2026" → "2026", else null. */
  function yearOf(label: string): string | null {
    return label.match(/\b(\d{4})\b/)?.[1] ?? null;
  }

  /** Two-digit year badge ("26"), falling back to the label's initial. */
  function badgeOf(label: string): string {
    const year = yearOf(label);
    return year ? year.slice(-2) : (label.trim().charAt(0) || '•').toUpperCase();
  }
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
              {badgeOf(selectedEvent)}
            </div>
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-semibold">{selectedEvent}</span>
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
        {#each events as event (event)}
          <DropdownMenu.Item onSelect={() => (selectedEvent = event)}>
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-heading text-[0.65rem] font-semibold text-muted-foreground">
              {badgeOf(event)}
            </span>
            <span class="flex-1">{event}</span>
            {#if event === selectedEvent}
              <CheckIcon class="ms-auto" />
            {/if}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
