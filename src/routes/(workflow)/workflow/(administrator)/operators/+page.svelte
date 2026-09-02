<script lang="ts">
  import type { User } from '$lib/models/user';

  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';
  import * as Alert from '$lib/components/ui/alert/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { fetchUsers, revokeUsersAccess, updateUserDisplayName } from '$lib/firebase';
  import { AddCircleIcon } from '$lib/icons';
  import { AccessLevel } from '$lib/models/user';
  import { hasRelevantAccess } from '$lib/util/access-time';

  import UsersTable from './users-table.svelte';

  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state<Error | null>(null);
  let now = $state(Date.now());

  const visibleUsers = $derived(
    [...users]
      .filter((user) => hasRelevantAccess(user, now))
      .sort((left, right) =>
        left.display_name.localeCompare(right.display_name, 'en-SG', { sensitivity: 'base' }),
      ),
  );
  const userSummary = $derived(
    `${visibleUsers.length} user${visibleUsers.length === 1 ? '' : 's'} with current or retained access`,
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

  async function updateDisplayName(uid: string, displayName: string): Promise<void> {
    try {
      const updatedDisplayName = await updateUserDisplayName(uid, displayName);
      users = users.map((user) =>
        user.uid === uid ? { ...user, display_name: updatedDisplayName } : user,
      );
      toast.success('Full name updated');
    } catch (updateError) {
      toast.error('Unable to update full name', {
        description: (updateError as Error).message,
      });
      throw updateError;
    }
  }

  async function revokeAccess(uids: string[]): Promise<void> {
    try {
      const accessExpires = await revokeUsersAccess(uids);
      const revokedUids = new Set(uids);
      users = users.map((user) =>
        revokedUids.has(user.uid)
          ? { ...user, access_level: AccessLevel.None, access_expires: accessExpires }
          : user,
      );
      toast.success('Access revoked', {
        description: `${revokedUids.size} user${revokedUids.size === 1 ? '' : 's'} updated.`,
      });
    } catch (revokeError) {
      toast.error('Unable to revoke access', {
        description: (revokeError as Error).message,
      });
      throw revokeError;
    }
  }

  onMount(() => {
    void loadUsers();
    const interval = window.setInterval(() => (now = Date.now()), 60_000);
    return () => window.clearInterval(interval);
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
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="grid gap-0.5">
        <h1 class="text-base font-semibold">Current Authorization Plan</h1>
        <p class="text-sm text-muted-foreground">
          {#if loading}
            Loading users...
          {:else}
            {userSummary}
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

    <UsersTable
      users={visibleUsers}
      {loading}
      {now}
      onUpdateDisplayName={updateDisplayName}
      onRevokeAccess={revokeAccess} />
  </div>
</div>
