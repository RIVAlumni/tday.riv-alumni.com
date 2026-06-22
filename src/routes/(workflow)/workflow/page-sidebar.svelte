<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import RIVALogo from '$lib/assets/favicon.svg';
  import NavDocuments from './nav-records.svelte';
  import NavMain from './nav-main.svelte';
  import NavSecondary from './nav-secondary.svelte';
  import NavUser from './nav-user.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { records, navMain, navSecondary, user } from '$lib/data/nav';

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
    <NavMain items={navMain} />
    <NavDocuments items={records} />
    <NavSecondary
      items={navSecondary}
      class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser {user} />
  </Sidebar.Footer>
</Sidebar.Root>
