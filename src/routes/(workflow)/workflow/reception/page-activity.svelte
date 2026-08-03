<script lang="ts">
  import type { ReceptionActivityEntry } from '$lib/data/reception';

  import * as Sidebar from '$lib/components/ui/sidebar';
  import { actionMeta, relativeTime, type ActionType } from '$lib/data/reception';
  import { eventStore } from '$lib/stores/event.svelte';
  import { cn } from '$lib/utils';

  import EventSwitcher from './event-switcher.svelte';

  let { entries: allEntries }: { entries: ReceptionActivityEntry[] } = $props();

  const entries = $derived(
    allEntries.filter((entry) => entry.event_id === eventStore.activeEventId),
  );

  const toneStyles: Record<ActionType, string> = {
    CHECKED_IN: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    REFUSED: 'border-red-500/30 bg-red-500/10 text-red-500',
    CONFLICT: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  };
</script>

<Sidebar.Header>
  <EventSwitcher />
</Sidebar.Header>

<Sidebar.Content>
  <div class="sticky top-0 z-20 bg-sidebar">
    <Sidebar.Separator class="mx-0" />
    <div class="flex items-center gap-2 px-4 py-4 text-muted-foreground">
      <span class="text-xs font-medium uppercase tracking-wider">Activity</span>
    </div>
  </div>

  <Sidebar.Group class="-mt-4 px-0">
    <Sidebar.GroupContent>
      {#if entries.length === 0}
        <p class="px-4 py-6 text-xs text-muted-foreground">
          No actions yet this session. Check-ins, refusals and conflict handovers will appear here.
        </p>
      {:else}
        <ol class="relative space-y-3 ps-3 pe-3">
          <span
            aria-hidden="true"
            class="pointer-events-none absolute inset-s-6 top-2 bottom-2 w-px -translate-x-1/2 bg-sidebar-border"
          ></span>

          {#each entries as entry (entry.registration_id + entry.at.getTime())}
            {@const Icon = actionMeta[entry.action].icon}
            <li class="relative flex gap-3">
              <span
                class={cn(
                  'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border',
                  toneStyles[entry.action],
                )}>
                <Icon class="size-3.5" />
              </span>

              <div class="min-w-0 flex-1 pb-1">
                <p class="truncate text-sm leading-snug">
                  <span class="font-medium text-sidebar-foreground">{entry.full_name}</span>
                  <span class="text-muted-foreground"> {actionMeta[entry.action].label}</span>
                </p>
                {#if entry.reason}
                  <p class="truncate text-xs text-muted-foreground">{entry.reason}</p>
                {/if}
                <p class="mt-0.5 text-[0.7rem] text-muted-foreground/80">
                  {relativeTime(entry.at)}
                </p>
              </div>
            </li>
          {/each}
        </ol>
      {/if}
    </Sidebar.GroupContent>
  </Sidebar.Group>
</Sidebar.Content>
