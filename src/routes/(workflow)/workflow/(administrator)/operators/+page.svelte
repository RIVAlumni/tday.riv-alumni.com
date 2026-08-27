<script lang="ts">
  import type { User } from '$lib/models/user';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import * as Alert from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import * as Empty from '$lib/components/ui/empty';
  import { ACCESS_LEVEL_NAMES } from '$lib/data/access';
  import { fetchUsers } from '$lib/firebase';
  import { AddCircleIcon, UserMultipleIcon } from '$lib/icons';
  import { formatAccessExpiry } from '$lib/util/access-time';

  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state<Error | null>(null);

  // Users with unexpired access, and/or a level above None.
  const activeUsers = $derived(
    [...users]
      .filter((user) => user.access_expires.toMillis() > Date.now() || user.access_level > 0)
      .sort((left, right) =>
        left.display_name.localeCompare(right.display_name, 'en-SG', { sensitivity: 'base' }),
      ),
  );

  async function loadUsers(): Promise<void> {
    loading = true;
    try {
      users = await fetchUsers();
      error = null;
    } catch (fetchError) {
      users = [];
      error = fetchError as Error;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadUsers();
  });
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
  {#if error}
    <Alert.Root variant="destructive">
      <Alert.Title>Unable to load users</Alert.Title>
      <Alert.Description>{error.message}</Alert.Description>
    </Alert.Root>
  {/if}

  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <div class="grid gap-0.5">
        <h1 class="text-base font-semibold">Current Authorization Plan</h1>
        <p class="text-sm text-muted-foreground">
          {#if loading}
            Loading users...
          {:else}
            {activeUsers.length} user{activeUsers.length === 1 ? '' : 's'} with active access
          {/if}
        </p>
      </div>
      <Button
        disabled={loading}
        onclick={() => void goto('/workflow/operators/plan')}>
        <AddCircleIcon />
        New authorization plan
      </Button>
    </div>

    {#if loading}
      <p class="text-sm text-muted-foreground">Loading users...</p>
    {:else if activeUsers.length === 0}
      <Empty.Root>
        <Empty.Header>
          <Empty.Media variant="icon">
            <UserMultipleIcon />
          </Empty.Media>
          <Empty.Title>No active access</Empty.Title>
          <Empty.Description
            >No user currently has unexpired access or an authorization level.</Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {:else}
      <div class="divide-y rounded-lg border">
        {#each activeUsers as user (user.uid)}
          <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{user.display_name}</p>
              <p class="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div class="flex shrink-0 items-center gap-6 text-right">
              <div class="grid gap-0.5">
                <p class="text-xs text-muted-foreground">Access expires</p>
                <p class="text-sm tabular-nums">{formatAccessExpiry(user.access_expires)}</p>
              </div>
              <div class="grid gap-0.5">
                <p class="text-xs text-muted-foreground">Authorization</p>
                <p class="text-sm tabular-nums">
                  {ACCESS_LEVEL_NAMES[user.access_level]} ({user.access_level})
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
