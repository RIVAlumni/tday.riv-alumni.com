<script lang="ts">
  import type { Timestamp } from 'firebase/firestore';
  import type { User } from '$lib/models/user';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  import * as Alert from '$lib/components/ui/alert';
  import { fetchUsers, updateUserAccessExpiry, updateUserAccessLevel } from '$lib/firebase';
  import { AccessLevel } from '$lib/models/user';

  import UsersTable from './users-table.svelte';

  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state<Error | null>(null);

  onMount(() => {
    let mounted = true;
    fetchUsers()
      .then((result) => {
        if (!mounted) return;
        users = result;
        error = null;
      })
      .catch((fetchError) => {
        if (!mounted) return;
        users = [];
        error = fetchError as Error;
      })
      .finally(() => {
        if (mounted) loading = false;
      });

    return () => {
      mounted = false;
    };
  });

  async function updateAccessExpiry(uid: string, accessExpires: Timestamp): Promise<void> {
    try {
      await updateUserAccessExpiry(uid, accessExpires);
      users = users.map((user) =>
        user.uid === uid ? { ...user, access_expires: accessExpires } : user,
      );
      toast.success('Access expiry updated');
    } catch (updateError) {
      toast.error('Unable to update access expiry', {
        description: (updateError as Error).message,
      });
      throw updateError;
    }
  }

  async function updateAuthorization(uid: string, accessLevel: AccessLevel): Promise<void> {
    try {
      await updateUserAccessLevel(uid, accessLevel);
      users = users.map((user) =>
        user.uid === uid ? { ...user, access_level: accessLevel } : user,
      );
      toast.success('Authorization updated');
    } catch (updateError) {
      toast.error('Unable to update authorization', {
        description: (updateError as Error).message,
      });
      throw updateError;
    }
  }
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
  {#if error}
    <Alert.Root variant="destructive">
      <Alert.Title>Unable to load users</Alert.Title>
      <Alert.Description>{error.message}</Alert.Description>
    </Alert.Root>
  {/if}

  <UsersTable
    {users}
    {loading}
    onUpdateAccessExpiry={updateAccessExpiry}
    onUpdateAuthorization={updateAuthorization} />
</div>
