<script lang="ts">
  import type { Registration } from '$lib/models/registration';

  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button';
  import * as Empty from '$lib/components/ui/empty';
  import type { ActionType, ReceptionActivityEntry } from '$lib/data/reception';
  import {
    checkInRegistration,
    fetchRegistration,
    flagConflict,
    refuseRegistration,
  } from '$lib/firebase';
  import { QrCodeIcon } from '$lib/icons';
  import { eventStore } from '$lib/stores/event.svelte';

  import PageSidebarRight from '../page-sidebar-right.svelte';
  import DataCards from './data-cards.svelte';
  import InputSearchBar from './input-search-bar.svelte';
  import PageActivity from './page-activity.svelte';

  let registration = $state<Registration | null>(null);
  let searchQuery = $state('');
  let lookupPending = $state(false);
  let actionPending = $state(false);
  let qrDrawerOpen = $state(false);
  let focusToken = $state(0);
  let activity = $state<ReceptionActivityEntry[]>([]);
  let lookupSequence = 0;
  let nextFocusToken = 0;

  function focusSearch(): void {
    focusToken = ++nextFocusToken;
  }

  $effect(() => {
    void eventStore.activeEventId;
    lookupSequence++;
    registration = null;
    searchQuery = '';
    lookupPending = false;
    focusSearch();
  });

  async function lookupRegistration(rawId: string): Promise<void> {
    const registrationId = rawId.trim().toUpperCase();
    if (!registrationId || lookupPending || actionPending) return;

    const eventId = eventStore.activeEventId;
    const sequence = ++lookupSequence;
    lookupPending = true;
    registration = null;

    try {
      const result = await fetchRegistration(eventId, registrationId);
      if (sequence !== lookupSequence || eventId !== eventStore.activeEventId) return;

      if (!result) {
        toast.error('Registration not found');
        focusSearch();
        return;
      }

      registration = result;
      searchQuery = registrationId;
    } catch (error) {
      if (sequence === lookupSequence) {
        toast.error('Lookup failed', { description: (error as Error).message });
        focusSearch();
      }
    } finally {
      if (sequence === lookupSequence) lookupPending = false;
    }
  }

  async function applyAction(action: ActionType, reason?: string): Promise<void> {
    const current = registration;
    if (!current || actionPending) return;

    const eventId = current.event_id;
    const registrationId = String(current.registration_id);
    actionPending = true;

    try {
      if (action === 'CHECKED_IN') {
        await checkInRegistration(eventId, registrationId);
      } else if (action === 'REFUSED') {
        await refuseRegistration(eventId, registrationId);
      } else {
        await flagConflict(eventId, registrationId, reason?.trim() ?? '');
      }

      activity = [
        {
          event_id: eventId,
          registration_id: registrationId,
          full_name: current.full_name,
          action,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
          at: new Date(),
        },
        ...activity,
      ].slice(0, 24);

      registration = null;
      searchQuery = '';
      focusSearch();
    } finally {
      actionPending = false;
    }
  }
</script>

<PageSidebarRight>
  <PageActivity entries={activity} />
</PageSidebarRight>

{#if registration}
  <DataCards
    {registration}
    disabled={actionPending}
    onAction={applyAction} />
{:else}
  <Empty.Root>
    <Empty.Header>
      <Empty.Media
        variant="icon"
        class="bg-primary">
        <QrCodeIcon />
      </Empty.Media>
      <Empty.Title>Awaiting query...</Empty.Title>
      <Empty.Description>Enter the Registration ID or scan the QR code.</Empty.Description>
    </Empty.Header>

    <Empty.Content>
      <Button
        disabled={lookupPending || actionPending}
        onclick={() => (qrDrawerOpen = true)}>
        <span data-icon="inline-start"><QrCodeIcon /></span>
        Scan QR code
      </Button>
    </Empty.Content>
  </Empty.Root>
{/if}

<InputSearchBar
  bind:searchQuery
  bind:qrDrawerOpen
  loading={lookupPending}
  disabled={actionPending}
  {focusToken}
  onSubmit={lookupRegistration} />
