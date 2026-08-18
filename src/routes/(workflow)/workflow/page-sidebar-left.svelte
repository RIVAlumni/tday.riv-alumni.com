<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { goto } from '$app/navigation';
  import RIVALogo from '$lib/assets/favicon.svg';
  import NavDocuments from './nav-records.svelte';
  import NavMain from './nav-main.svelte';
  import NavSecondary from './nav-secondary.svelte';
  import NavSystem from './nav-system.svelte';
  import NavUser from './nav-user.svelte';
  import SettingsDialog from './settings-dialog.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { records, navMain, navSecondary, system, type NavItem } from '$lib/data/nav';
  import { AccessLevel } from '$lib/models/user';
  import { userStore } from '$lib/stores/user.svelte';
  import { isAuthorized } from '$lib/util/user';

  let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  let settingsOpen = $state(false);

  const homeHref = $derived(
    userStore.state && isAuthorized(userStore.state, AccessLevel.Mediator)
      ? '/workflow/home'
      : '/workflow/reception',
  );
  const visibleMain = $derived(
    navMain.filter(
      (item) => userStore.state && isAuthorized(userStore.state, item.minimumAccessLevel),
    ),
  );
  const visibleRecords = $derived(
    records.filter(
      (item) => userStore.state && isAuthorized(userStore.state, item.minimumAccessLevel),
    ),
  );
  const visibleSystem = $derived(
    system.filter(
      (item) => userStore.state && isAuthorized(userStore.state, item.minimumAccessLevel),
    ),
  );
  const visibleSecondary = $derived(
    navSecondary.filter(
      (item) => userStore.state && isAuthorized(userStore.state, item.minimumAccessLevel),
    ),
  );

  function handleSecondaryActivate(item: NavItem): void {
    if (item.url === '/workflow/settings') {
      settingsOpen = true;
    } else {
      void goto(item.url);
    }
  }
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
              href={homeHref}
              {...props}>
              <img
                src={RIVALogo}
                alt="RIVAlumni logo"
                class="size-5!" />
              <span class="text-base font-semibold">Internal Systems</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain items={visibleMain} />
    {#if visibleRecords.length > 0}
      <NavDocuments items={visibleRecords} />
    {/if}
    {#if visibleSystem.length > 0}
      <NavSystem items={visibleSystem} />
    {/if}
    <NavSecondary
      items={visibleSecondary}
      class="mt-auto"
      onActivate={handleSecondaryActivate} />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser />
  </Sidebar.Footer>
  <Sidebar.Rail class="inset-y-2.5 after:inset-y-2.5" />

  <SettingsDialog bind:open={settingsOpen} />
</Sidebar.Root>
