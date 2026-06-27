<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import PageSidebarRight from '../page-sidebar-right.svelte';

  import type { Icon } from '@tabler/icons-svelte';

  import EventSwitcher from './event-switcher.svelte';
  import Watermark from './watermark.svelte';
  import { BanIcon, FlagIcon, HistoryIcon, UserCheckIcon } from '$lib/icons';
  import { cn } from '$lib/utils';
  import { user } from '$lib/data/nav';

  const data = {
    events: ['Teachers Day 2024', 'Teachers Day 2025', 'Teachers Day 2026'],
  };

  /**
   * Static activity feed — display skeleton only, nothing is interactive.
   * Each entry's `tone` maps to a colour set in `toneStyles` below.
   */
  type ActivityTone = 'check-in' | 'flag' | 'deny';

  const activities: {
    id: string;
    icon: Icon;
    tone: ActivityTone;
    name: string;
    action: string;
    detail: string;
    time: string;
  }[] = [
    {
      id: '1',
      icon: UserCheckIcon,
      tone: 'check-in',
      name: 'Aisyah Rahman',
      action: 'was checked in',
      detail: 'Class of 2014 · Sciences',
      time: '2 min ago',
    },
    {
      id: '2',
      icon: FlagIcon,
      tone: 'flag',
      name: 'Daniel Lim',
      action: 'was flagged for conflict resolution',
      detail: 'Possible duplicate registration',
      time: '8 min ago',
    },
    {
      id: '3',
      icon: BanIcon,
      tone: 'deny',
      name: 'Unknown Visitor',
      action: 'was denied entry',
      detail: 'Not on the guest list',
      time: '14 min ago',
    },
    {
      id: '4',
      icon: UserCheckIcon,
      tone: 'check-in',
      name: 'Priya Krishnan',
      action: 'was checked in',
      detail: 'Class of 2010 · Sciences',
      time: '21 min ago',
    },
    {
      id: '5',
      icon: FlagIcon,
      tone: 'flag',
      name: 'Marcus Wong',
      action: 'was flagged for conflict resolution',
      detail: 'ID did not match record',
      time: '35 min ago',
    },
    {
      id: '6',
      icon: UserCheckIcon,
      tone: 'check-in',
      name: 'Aisyah Rahman',
      action: 'was checked in',
      detail: 'Class of 2014 · Sciences',
      time: '2 min ago',
    },
    {
      id: '7',
      icon: FlagIcon,
      tone: 'flag',
      name: 'Daniel Lim',
      action: 'was flagged for conflict resolution',
      detail: 'Possible duplicate registration',
      time: '8 min ago',
    },
    {
      id: '8',
      icon: BanIcon,
      tone: 'deny',
      name: 'Unknown Visitor',
      action: 'was denied entry',
      detail: 'Not on the guest list',
      time: '14 min ago',
    },
    {
      id: '9',
      icon: UserCheckIcon,
      tone: 'check-in',
      name: 'Priya Krishnan',
      action: 'was checked in',
      detail: 'Class of 2010 · Sciences',
      time: '21 min ago',
    },
    {
      id: '10',
      icon: FlagIcon,
      tone: 'flag',
      name: 'Marcus Wong',
      action: 'was flagged for conflict resolution',
      detail: 'ID did not match record',
      time: '35 min ago',
    },
    {
      id: '11',
      icon: BanIcon,
      tone: 'deny',
      name: 'Unknown Visitor',
      action: 'was denied entry',
      detail: 'Not on the guest list',
      time: '14 min ago',
    },
    {
      id: '12',
      icon: UserCheckIcon,
      tone: 'check-in',
      name: 'Priya Krishnan',
      action: 'was checked in',
      detail: 'Class of 2010 · Sciences',
      time: '21 min ago',
    },
    {
      id: '13',
      icon: FlagIcon,
      tone: 'flag',
      name: 'Marcus Wong',
      action: 'was flagged for conflict resolution',
      detail: 'ID did not match record',
      time: '35 min ago',
    },
  ];

  /**
   * Colour per event tone — full class strings are written out literally so
   * the Tailwind scanner can detect them. Emerald mirrors the existing
   * "live" motif in the app's CSS; amber warns; red denotes denial.
   */
  const toneStyles: Record<ActivityTone, string> = {
    'check-in': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    'flag': 'border-amber-500/30 bg-amber-500/10 text-amber-500',
    'deny': 'border-red-500/30 bg-red-500/10 text-red-500',
  };
</script>

<Watermark
  name={user.name}
  email={user.email} />

<PageSidebarRight>
  <Sidebar.Header>
    <EventSwitcher
      events={data.events}
      defaultEvent={data.events[data.events.length - 1]} />
  </Sidebar.Header>

  <Sidebar.Content>
    <div class="sticky top-0 z-20 bg-sidebar">
      <Sidebar.Separator class="mx-0" />
      <div class="flex items-center gap-2 px-4 py-4 text-muted-foreground">
        <HistoryIcon class="size-4" />
        <span class="text-xs font-medium uppercase tracking-wider">Activity</span>
      </div>
    </div>

    <Sidebar.Group class="-mt-4 px-0">
      <Sidebar.GroupContent>
        <ol class="relative space-y-3 ps-3 pe-3">
          <span
            aria-hidden="true"
            class="pointer-events-none absolute inset-s-6 top-2 bottom-2 w-px -translate-x-1/2 bg-sidebar-border" />

          {#each activities as activity (activity.id)}
            <li class="relative flex gap-3">
              <span
                class={cn(
                  'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border',
                  toneStyles[activity.tone],
                )}>
                <activity.icon class="size-3.5" />
              </span>

              <div class="min-w-0 flex-1 pb-1">
                <p class="truncate text-sm leading-snug">
                  <span class="font-medium text-sidebar-foreground">{activity.name}</span>
                  {' '}
                  <span class="text-muted-foreground">{activity.action}</span>
                </p>
                <p class="truncate text-xs text-muted-foreground">{activity.detail}</p>
                <p class="mt-0.5 text-[0.7rem] text-muted-foreground/80">{activity.time}</p>
              </div>
            </li>
          {/each}
        </ol>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</PageSidebarRight>

<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
  <div class="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
    <div>hello</div>

    <div>world</div>

    <div>today</div>
  </div>
</div>
