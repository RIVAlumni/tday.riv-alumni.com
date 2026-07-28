<script lang="ts">
  import { cn } from '$lib/utils';

  import * as Sidebar from '$lib/components/ui/sidebar';
  import { BanIcon, Flag01Icon, HistoryIcon, UserCheck01Icon } from '$lib/icons';

  import EventSwitcher from './event-switcher.svelte';

  let { events }: { events: string[] } = $props();

  type ActivityTone = 'check-in' | 'flag' | 'deny';

  // prettier-ignore
  const activities = [
    { id: '1',  icon: UserCheck01Icon,  tone: 'check-in'  as ActivityTone, name: 'Aisyah Rahman',   action: 'was checked in',                      detail: 'Class of 2014 · Sciences', time: '2 min ago'        },
    { id: '2',  icon: Flag01Icon,       tone: 'flag'      as ActivityTone, name: 'Daniel Lim',      action: 'was flagged for conflict resolution', detail: 'Possible duplicate registration', time: '8 min ago' },
    { id: '3',  icon: BanIcon,          tone: 'deny'      as ActivityTone, name: 'Unknown Visitor', action: 'was denied entry',                    detail: 'Not on the guest list', time: '14 min ago'          },
    { id: '4',  icon: UserCheck01Icon,  tone: 'check-in'  as ActivityTone, name: 'Priya Krishnan',  action: 'was checked in',                      detail: 'Class of 2010 · Sciences', time: '21 min ago'       },
    { id: '5',  icon: Flag01Icon,       tone: 'flag'      as ActivityTone, name: 'Marcus Wong',     action: 'was flagged for conflict resolution', detail: 'ID did not match record', time: '35 min ago'        },
    { id: '6',  icon: UserCheck01Icon,  tone: 'check-in'  as ActivityTone, name: 'Aisyah Rahman',   action: 'was checked in',                      detail: 'Class of 2014 · Sciences', time: '2 min ago'        },
    { id: '7',  icon: Flag01Icon,       tone: 'flag'      as ActivityTone, name: 'Daniel Lim',      action: 'was flagged for conflict resolution', detail: 'Possible duplicate registration', time: '8 min ago' },
    { id: '8',  icon: BanIcon,          tone: 'deny'      as ActivityTone, name: 'Unknown Visitor', action: 'was denied entry',                    detail: 'Not on the guest list', time: '14 min ago'          },
    { id: '9',  icon: UserCheck01Icon,  tone: 'check-in'  as ActivityTone, name: 'Priya Krishnan',  action: 'was checked in',                      detail: 'Class of 2010 · Sciences', time: '21 min ago'       },
    { id: '10', icon: Flag01Icon,       tone: 'flag'      as ActivityTone, name: 'Marcus Wong',     action: 'was flagged for conflict resolution', detail: 'ID did not match record', time: '35 min ago'        },
    { id: '11', icon: BanIcon,          tone: 'deny'      as ActivityTone, name: 'Unknown Visitor', action: 'was denied entry',                    detail: 'Not on the guest list', time: '14 min ago'          },
    { id: '12', icon: UserCheck01Icon,  tone: 'check-in'  as ActivityTone, name: 'Priya Krishnan',  action: 'was checked in',                      detail: 'Class of 2010 · Sciences', time: '21 min ago'       },
    { id: '13', icon: Flag01Icon,       tone: 'flag'      as ActivityTone, name: 'Marcus Wong',     action: 'was flagged for conflict resolution', detail: 'ID did not match record', time: '35 min ago'        },
  ];

  const toneStyles: Record<ActivityTone, string> = {
    'check-in': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    'flag': 'border-amber-500/30 bg-amber-500/10 text-amber-500',
    'deny': 'border-red-500/30 bg-red-500/10 text-red-500',
  };
</script>

<Sidebar.Header>
  <EventSwitcher
    {events}
    defaultEvent={events[events.length - 1]} />
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
          class="pointer-events-none absolute inset-s-6 top-2 bottom-2 w-px -translate-x-1/2 bg-sidebar-border"
        ></span>

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
