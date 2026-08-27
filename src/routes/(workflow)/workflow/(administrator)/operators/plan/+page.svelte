<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  import * as Alert from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import * as Table from '$lib/components/ui/table';
  import { ACCESS_LEVEL_NAMES } from '$lib/data/access';
  import { fetchUsers, updateUserAccessExpiry, updateUserAccessLevel } from '$lib/firebase';
  import { AddCircleIcon, ArrowLeft01Icon, Cancel01Icon, CheckIcon } from '$lib/icons';
  import type { User } from '$lib/models/user';
  import { AccessLevel } from '$lib/models/user';
  import { setPageTitle } from '$lib/data/page-title.svelte.js';
  import { formatAccessExpiry, singaporeDate, singaporeEndOfDay } from '$lib/util/access-time';

  type PlanStep = 'add' | 'edit' | 'review';

  interface PlanEntry {
    user: User;
    accessLevel: string;
    expiryDate: string;
  }

  const accessLevels = [
    AccessLevel.None,
    AccessLevel.Operator,
    AccessLevel.Mediator,
    AccessLevel.Administrator,
  ];

  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state<Error | null>(null);
  let step = $state<PlanStep>('add');
  let searchQuery = $state('');
  let plan = $state<PlanEntry[]>([]);
  let applying = $state(false);

  const planUids = $derived(new Set(plan.map((entry) => entry.user.uid)));

  const stepDescription = $derived(
    `Step ${step === 'add' ? 1 : step === 'edit' ? 2 : 3} of 3 - ${
      step === 'add'
        ? 'Add users by name or email'
        : step === 'edit'
          ? 'Change access expiry and authorization'
          : 'Review the changes'
    }`,
  );

  const searchResults = $derived(
    users
      .filter((user) => {
        if (planUids.has(user.uid)) return false;
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          user.display_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      })
      .sort((left, right) =>
        left.display_name.localeCompare(right.display_name, 'en-SG', { sensitivity: 'base' }),
      ),
  );

  const planChanges = $derived(
    plan
      .filter(
        (entry) =>
          Number(entry.accessLevel) !== entry.user.access_level ||
          entry.expiryDate !== singaporeDate(entry.user.access_expires),
      )
      .map((entry) => ({
        name: entry.user.display_name,
        email: entry.user.email,
        previousExpiry: formatAccessExpiry(entry.user.access_expires),
        newExpiry: formatAccessExpiry(singaporeEndOfDay(entry.expiryDate)),
        previousLevel: `${ACCESS_LEVEL_NAMES[entry.user.access_level]} (${entry.user.access_level})`,
        newLevel: `${ACCESS_LEVEL_NAMES[Number(entry.accessLevel) as AccessLevel]} (${entry.accessLevel})`,
      })),
  );

  onMount(() => {
    setPageTitle('Authorization Plan');
    void loadUsers();
    return () => setPageTitle(null);
  });

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

  function addToPlan(user: User): void {
    plan = [
      ...plan,
      {
        user,
        accessLevel: String(user.access_level),
        expiryDate: singaporeDate(user.access_expires),
      },
    ];
    searchQuery = '';
  }

  function removeFromPlan(uid: string): void {
    plan = plan.filter((entry) => entry.user.uid !== uid);
  }

  function cancel(): void {
    void goto('/workflow/operators');
  }

  async function applyPlan(): Promise<void> {
    if (planChanges.length === 0 || applying) return;
    applying = true;
    try {
      for (const entry of plan) {
        const levelChanged = Number(entry.accessLevel) !== entry.user.access_level;
        const expiryChanged = entry.expiryDate !== singaporeDate(entry.user.access_expires);
        if (levelChanged) {
          await updateUserAccessLevel(entry.user.uid, Number(entry.accessLevel) as AccessLevel);
        }
        if (expiryChanged) {
          await updateUserAccessExpiry(entry.user.uid, singaporeEndOfDay(entry.expiryDate));
        }
      }
      toast.success('Authorization plan applied', {
        description: `${planChanges.length} user(s) updated.`,
      });
      void goto('/workflow/operators');
    } catch (applyError) {
      toast.error('Unable to apply authorization plan', {
        description: (applyError as Error).message,
      });
    } finally {
      applying = false;
    }
  }
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
  <div class="flex w-full max-w-2xl flex-col gap-6">
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        class="-ms-2 text-muted-foreground"
        disabled={applying}
        onclick={cancel}>
        <ArrowLeft01Icon />
        Back to operators
      </Button>
    </div>

    <div class="grid gap-1">
      <h1 class="text-xl font-semibold">Authorization Plan</h1>
      <p class="text-sm text-muted-foreground">{stepDescription}</p>
    </div>

    {#if error}
      <Alert.Root variant="destructive">
        <Alert.Title>Unable to load users</Alert.Title>
        <Alert.Description>{error.message}</Alert.Description>
      </Alert.Root>
    {/if}

    {#if loading}
      <p class="text-sm text-muted-foreground">Loading users...</p>
    {:else if error}
      <Button
        variant="outline"
        class="w-fit"
        onclick={() => void loadUsers()}>
        Try again
      </Button>
    {:else if step === 'add'}
      <div class="grid gap-4">
        <Input
          type="search"
          bind:value={searchQuery}
          placeholder="Search by name or email..." />
        <div class="divide-y rounded-lg border">
          {#if searchResults.length === 0}
            <p class="px-4 py-6 text-center text-sm text-muted-foreground">
              {searchQuery.trim() ? 'No users match your search.' : 'Start typing to find users.'}
            </p>
          {:else}
            {#each searchResults as user (user.uid)}
              <div class="flex items-center justify-between gap-3 px-4 py-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{user.display_name}</p>
                  <p class="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  class="shrink-0"
                  onclick={() => addToPlan(user)}>
                  <AddCircleIcon />
                  Add
                </Button>
              </div>
            {/each}
          {/if}
        </div>
        {#if plan.length > 0}
          <div>
            <p class="mb-2 text-sm font-medium">
              In plan ({plan.length})
            </p>
            <div class="divide-y rounded-lg border">
              {#each plan as entry (entry.user.uid)}
                <div class="flex items-center justify-between gap-3 px-4 py-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">{entry.user.display_name}</p>
                    <p class="truncate text-xs text-muted-foreground">{entry.user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="shrink-0"
                    aria-label={`Remove ${entry.user.display_name}`}
                    onclick={() => removeFromPlan(entry.user.uid)}>
                    <Cancel01Icon />
                  </Button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else if step === 'edit'}
      <div class="grid gap-4">
        {#each plan as entry (entry.user.uid)}
          <div class="min-w-0 rounded-lg border p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{entry.user.display_name}</p>
                <p class="truncate text-xs text-muted-foreground">{entry.user.email}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                class="shrink-0"
                aria-label={`Remove ${entry.user.display_name}`}
                onclick={() => removeFromPlan(entry.user.uid)}>
                <Cancel01Icon />
              </Button>
            </div>
            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="grid min-w-0 gap-1">
                <label
                  for={`${entry.user.uid}-expiry`}
                  class="text-xs text-muted-foreground">Access expiry</label>
                <Input
                  id={`${entry.user.uid}-expiry`}
                  type="date"
                  class="w-full"
                  bind:value={entry.expiryDate} />
              </div>
              <div class="grid min-w-0 gap-1">
                <label
                  for={`${entry.user.uid}-level`}
                  class="text-xs text-muted-foreground">Authorization level</label>
                <Select.Root
                  type="single"
                  bind:value={entry.accessLevel}>
                  <Select.Trigger
                    id={`${entry.user.uid}-level`}
                    size="sm"
                    class="w-full">
                    <span data-slot="select-value">
                      {ACCESS_LEVEL_NAMES[Number(entry.accessLevel) as AccessLevel]} ({entry.accessLevel})
                    </span>
                  </Select.Trigger>
                  <Select.Content align="start">
                    <Select.Group>
                      {#each accessLevels as accessLevel (accessLevel)}
                        <Select.Item value={String(accessLevel)}>
                          {ACCESS_LEVEL_NAMES[accessLevel]} ({accessLevel})
                        </Select.Item>
                      {/each}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="overflow-x-auto rounded-lg border">
        {#if planChanges.length === 0}
          <p class="px-4 py-6 text-center text-sm text-muted-foreground">
            No changes have been made yet. Go back to adjust the plan.
          </p>
        {:else}
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Full Name</Table.Head>
                <Table.Head>Email</Table.Head>
                <Table.Head>Previous Access Expiry</Table.Head>
                <Table.Head>New Access Expiry</Table.Head>
                <Table.Head>Previous Access Level</Table.Head>
                <Table.Head>New Access Level</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each planChanges as change, i (change.name + i)}
                <Table.Row>
                  <Table.Cell class="font-medium whitespace-nowrap">{change.name}</Table.Cell>
                  <Table.Cell class="whitespace-nowrap">{change.email}</Table.Cell>
                  <Table.Cell class="whitespace-nowrap">{change.previousExpiry}</Table.Cell>
                  <Table.Cell class="whitespace-nowrap">{change.newExpiry}</Table.Cell>
                  <Table.Cell class="whitespace-nowrap">{change.previousLevel}</Table.Cell>
                  <Table.Cell class="whitespace-nowrap">{change.newLevel}</Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        {/if}
      </div>
    {/if}

    {#if !loading && !error}
      <div
        class="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border bg-background/90 p-3 shadow-lg backdrop-blur">
        {#if step === 'add'}
          <Button
            variant="outline"
            disabled={applying}
            onclick={cancel}>
            Cancel
          </Button>
        {:else}
          <Button
            variant="outline"
            disabled={applying}
            onclick={() => (step = step === 'review' ? 'edit' : 'add')}>
            Back
          </Button>
        {/if}
        {#if step === 'review'}
          <Button
            disabled={planChanges.length === 0 || applying}
            onclick={() => void applyPlan()}>
            <CheckIcon />
            {applying ? 'Applying...' : 'Apply plan'}
          </Button>
        {:else}
          <Button
            disabled={plan.length === 0 || applying}
            onclick={() => (step = step === 'add' ? 'edit' : 'review')}>
            Next
          </Button>
        {/if}
      </div>
    {/if}
  </div>
</div>
