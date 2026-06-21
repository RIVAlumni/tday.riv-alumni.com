<script lang="ts">
  import RIVALogo from '$lib/assets/favicon.svg';
  import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
  import DatabaseIcon from '@tabler/icons-svelte/icons/database';
  import FileWordIcon from '@tabler/icons-svelte/icons/file-word';
  import HelpIcon from '@tabler/icons-svelte/icons/help';
  import ReportIcon from '@tabler/icons-svelte/icons/report';
  import SearchIcon from '@tabler/icons-svelte/icons/search';
  import SettingsIcon from '@tabler/icons-svelte/icons/settings';
  import MoodCheckIcon from '@tabler/icons-svelte/icons/mood-check';
  import FaceIdErrorIcon from '@tabler/icons-svelte/icons/face-id-error';
  import NavDocuments from './nav-documents.svelte';
  import NavMain from './nav-main.svelte';
  import NavSecondary from './nav-secondary.svelte';
  import NavUser from './nav-user.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import type { ComponentProps } from 'svelte';

  const data = {
    user: {
      name: 'RIVAlumni Operator',
      email: 'operator@riv-alumni.com',
      avatar: '/avatars/shadcn.jpg',
    },
    navMain: [
      {
        title: 'Dashboard',
        url: '/workflow/home',
        icon: DashboardIcon,
      },
      {
        title: 'Check-In',
        url: '/workflow/check-in',
        icon: MoodCheckIcon,
      },
      {
        title: 'Conflict Resolution',
        url: '#',
        icon: FaceIdErrorIcon,
      },
    ],
    navSecondary: [
      {
        title: 'Settings',
        url: '#',
        icon: SettingsIcon,
      },
      {
        title: 'Get Help',
        url: '#',
        icon: HelpIcon,
      },
      {
        title: 'Search',
        url: '#',
        icon: SearchIcon,
      },
    ],
    documents: [
      {
        name: 'Data Library',
        url: '#',
        icon: DatabaseIcon,
      },
      {
        name: 'Reports',
        url: '#',
        icon: ReportIcon,
      },
      {
        name: 'Word Assistant',
        url: '#',
        icon: FileWordIcon,
      },
    ],
  };

  let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root
  collapsible="offcanvas"
  {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5!">
          {#snippet child({ props })}
            <a
              href="/workflow/home"
              {...props}>
              <img src={RIVALogo} alt="RIVAlumni logo" class="size-5!" />
              <span class="text-base font-semibold">Teachers' Day</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain items={data.navMain} />
    <NavDocuments items={data.documents} />
    <NavSecondary
      items={data.navSecondary}
      class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser user={data.user} />
  </Sidebar.Footer>
</Sidebar.Root>
