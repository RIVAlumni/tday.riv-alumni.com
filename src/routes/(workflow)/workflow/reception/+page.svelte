<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import PageSidebarRight from '../page-sidebar-right.svelte';

  import EventSwitcher from './event-switcher.svelte';
  import Watermark from './watermark.svelte';
  import { user } from '$lib/data/nav';

  const data = {
    events: [
      'Teachers Day 2024',
      'Teachers Day 2025',
      'Teachers Day 2026'
    ],
  };
</script>

<Watermark name={user.name} email={user.email} />

<PageSidebarRight>
    <Sidebar.Header>
      <EventSwitcher
        events={data.events}
        defaultEvent={data.events[data.events.length - 1]} />
    </Sidebar.Header>

    <Sidebar.Content>
      Hello world
    </Sidebar.Content>
</PageSidebarRight>

Hello world