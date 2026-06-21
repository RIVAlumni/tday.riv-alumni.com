<script lang="ts">
  import RIVALogo from '$lib/assets/favicon.svg';
  import NavDocuments from './nav-documents.svelte';
  import NavMain from './nav-main.svelte';
  import NavSecondary from './nav-secondary.svelte';
  import NavUser from './nav-user.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import {
    documents,
    navMain,
    navSecondary,
    user,
  } from '$lib/data/nav.js';
  import type { ComponentProps } from 'svelte';

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
    <NavMain items={navMain} />
    <NavDocuments items={documents} />
    <NavSecondary
      items={navSecondary}
      class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser {user} />
  </Sidebar.Footer>
</Sidebar.Root>
