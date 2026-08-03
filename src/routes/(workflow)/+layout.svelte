<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { AccessLevel } from '$lib/models/user';
  import { eventStore } from '$lib/stores/event.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import { isAuthorized } from '$lib/util/user';

  let { children } = $props();

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
  <main class="flex min-h-screen items-center justify-center p-6">
    <section class="flex max-w-md flex-col items-center gap-4 text-center">
      <h1 class="text-2xl font-semibold">Unauthorized</h1>
      <div class="text-muted-foreground">
        <p>This account does not have access to the operator system.</p>
        <p>Contact an administrator if you believe this is a mistake.</p>
      </div>
      <Button onclick={handleSignOut}>Sign out</Button>
    </section>
  </main>
{/if}
