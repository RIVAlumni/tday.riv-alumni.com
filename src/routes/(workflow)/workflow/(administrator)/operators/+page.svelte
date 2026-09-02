<script lang="ts">
  import type { User } from '$lib/models/user';

  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';
  import * as Alert from '$lib/components/ui/alert/index.js';
  import { fetchUsers, revokeUsersAccess, updateUserDisplayName } from '$lib/firebase';
  import { AccessLevel } from '$lib/models/user';
  import { userStore } from '$lib/stores/user.svelte';
  import { hasRelevantAccess } from '$lib/util/access-time';

  import UsersTable from './users-table.svelte';

  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state<Error | null>(null);
  let now = $state(Date.now());

  const currentUserUid = $derived(userStore.authUser?.uid);
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
    const revocableUids = uids.filter((uid) => uid !== currentUserUid);
    if (revocableUids.length === 0) return;

    try {
      const accessExpires = await revokeUsersAccess(revocableUids);
      const revokedUids = new Set(revocableUids);
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

    <UsersTable
      users={visibleUsers}
      {loading}
      {now}
      {currentUserUid}
      onCreatePlan={() => void goto('/workflow/operators/plan')}
      onUpdateDisplayName={updateDisplayName}
      onRevokeAccess={revokeAccess} />
  </div>
</div>
