<script lang="ts">
  import { CheckmarkCircle01Icon, MoreVerticalIcon, Logout01Icon } from '$lib/icons';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { goto } from '$app/navigation';
  import { ACCESS_LEVEL_NAMES, permissionsFor } from '$lib/data/access';
  import { userStore } from '$lib/stores/user.svelte';

  const accountName = $derived(userStore.state?.display_name ?? 'RIVAlumni Operator');
  const email = $derived(
    userStore.state?.email ?? userStore.authUser?.email ?? 'operator@riv-alumni.com',
  );
  const isInternalEmail = $derived(email.toLowerCase().endsWith('@riv-alumni.com'));
  const displayName = $derived(`${accountName}${isInternalEmail ? '' : ' (EXTERNAL)'}`);
  const photo = $derived(userStore.authUser?.photoURL ?? '/favicon.png');
  const accessLevelLabel = $derived.by(() => {
    const accessLevel = userStore.state?.access_level;
    return accessLevel === undefined ? 'Unknown' : (ACCESS_LEVEL_NAMES[accessLevel] ?? 'Unknown');
  });
  const permissions = $derived(userStore.state ? permissionsFor(userStore.state.access_level) : []);

  const sidebar = Sidebar.useSidebar();

  async function handleSignOut() {
    await userStore.signOut();
    goto('/auth/login');
  }
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            {...props}
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Image
                src={photo}
                alt={displayName} />
              <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-medium">{displayName}</span>
              <span class="text-muted-foreground truncate text-xs">
                {email}
              </span>
            </div>
            <MoreVerticalIcon class="ms-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}>
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Image
                src={photo}
                alt={displayName} />
              <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-medium">{displayName}</span>
              <span class="text-muted-foreground truncate text-xs">
                {email}
              </span>
            </div>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <div class="flex items-center justify-between gap-2 px-3 py-1.5">
            <span class="text-muted-foreground text-xs">Access Level</span>
            <span class="text-xs">{accessLevelLabel}</span>
          </div>
          <div class="px-3 py-1.5">
            <p class="text-muted-foreground mb-2 text-xs">You have authorization to</p>
            <div class="grid gap-1.5">
              {#each permissions as permission (permission.label)}
                <span class="flex items-center gap-2 text-sm">
                  <CheckmarkCircle01Icon class="text-primary size-4 shrink-0" />
                  {permission.label}
                </span>
              {/each}
            </div>
          </div>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={handleSignOut}>
          <Logout01Icon />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
