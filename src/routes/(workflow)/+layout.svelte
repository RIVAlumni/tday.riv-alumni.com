<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as Item from '$lib/components/ui/item';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import * as Empty from '$lib/components/ui/empty';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { AccessLevel } from '$lib/models/user';
  import { eventStore } from '$lib/stores/event.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import { isAuthorized } from '$lib/util/user';

  let { children } = $props();

  const accountName = $derived(
    userStore.authUser?.displayName ?? userStore.state?.display_name ?? 'Unknown account',
  );
  const accountEmail = $derived(userStore.authUser?.email ?? userStore.state?.email ?? '');
  const accountLabel = $derived(accountEmail ? `${accountName} (${accountEmail})` : accountName);
  const accountPhoto = $derived(userStore.authUser?.photoURL);
  const accountInitials = $derived(
    accountName
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?',
  );

  onMount(() => {
    userStore.init();
    eventStore.hydrate();
  });

  $effect(() => {
    const user = userStore.state;
    if (user === null && !userStore.isSignedIn) {
      if (page.url.pathname.startsWith('/workflow')) {
        goto('/auth/login');
      }
    }
  });

  async function handleSignOut(): Promise<void> {
    await userStore.signOut();
    await goto('/auth/login');
  }
</script>

{#if userStore.state === undefined}
  <div class="flex h-screen items-center justify-center">
    <div class="flex w-full max-w-sm flex-col items-center gap-4 px-4">
      <Skeleton class="size-16 rounded-full" />
      <div class="flex w-full flex-col gap-3">
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </div>
      <div class="mt-4 flex w-full flex-col gap-3">
        <Skeleton class="h-12 w-full rounded-xl" />
        <Skeleton class="h-12 w-full rounded-xl" />
      </div>
    </div>
  </div>
{:else if userStore.state && isAuthorized(userStore.state, AccessLevel.Operator)}
  {@render children()}
{:else if userStore.isSignedIn}
  <main class="flex flex-col min-h-screen items-center justify-center p-6">
    <Empty.Root>
      <Empty.Header>
        <Empty.Media class="mb-6">
          <Item.Root variant="outline">
            <Item.Media>
              <Avatar.Root class="size-10">
                <Avatar.Image src={accountPhoto} />
                <Avatar.Fallback>{accountInitials}</Avatar.Fallback>
              </Avatar.Root>
            </Item.Media>
            <Item.Content>
              <Item.Title>{accountName}</Item.Title>
              <Item.Description>{accountEmail}</Item.Description>
            </Item.Content>
          </Item.Root>
        </Empty.Media>
        <Empty.Title>You are not authorized</Empty.Title>
        <Empty.Description>
          <p>This account does not have access to the operator system.</p>
          <p>Contact an administrator if you believe this is a mistake.</p>
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button onclick={handleSignOut}>Sign out</Button>
      </Empty.Content>
    </Empty.Root>
  </main>
{/if}
