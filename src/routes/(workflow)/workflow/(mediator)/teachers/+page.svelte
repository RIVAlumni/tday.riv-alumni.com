<script lang="ts">
  import { onMount } from 'svelte';

  import * as Alert from '$lib/components/ui/alert/index.js';
  import { getEvent, searchRegistrations } from '$lib/firebase';
  import type { Event } from '$lib/models/event';
  import type { Registration } from '$lib/models/registration';
  import { is2026, type Registration2026 } from '$lib/models/registration';
  import { eventStore } from '$lib/stores/event.svelte';

  import TeachersList from './teachers-list.svelte';
  import TeachersToolbar from './teachers-toolbar.svelte';

  let registrations = $state<Registration[]>([]);
  let event = $state<Event | null>(null);
  let selectedTeachers = $state<string[]>([]);
  let loading = $state(false);
  let error = $state<Error | null>(null);
  let requestSequence = 0;

  const is2026Event = $derived(eventStore.activeEventId === '2026');

  const registrations2026 = $derived(registrations.filter(is2026) as Registration2026[]);

  const teachers = $derived(
    [...new Set(registrations2026.flatMap((registration) => registration.visiting_teachers))]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, 'en-SG', { sensitivity: 'base' })),
  );

  async function loadEvent(eventId: string): Promise<void> {
    const sequence = ++requestSequence;
    selectedTeachers = [];
    registrations = [];
    event = null;
    error = null;

    if (eventId !== '2026') {
      loading = false;
      return;
    }

    loading = true;
    try {
      const [nextRegistrations, nextEvent] = await Promise.all([
        searchRegistrations(eventId, { search: '' }),
        getEvent(eventId),
      ]);
      if (sequence !== requestSequence || eventId !== eventStore.activeEventId) return;
      registrations = nextRegistrations;
      event = nextEvent;
      error = null;
    } catch (queryError) {
      if (sequence !== requestSequence) return;
      registrations = [];
      event = null;
      error = queryError as Error;
    } finally {
      if (sequence === requestSequence) loading = false;
    }
  }

  onMount(() => {
    let mounted = true;
    // Parent layout hydrates eventStore in its own onMount callback.
    queueMicrotask(() => {
      if (mounted) void loadEvent(eventStore.activeEventId);
    });
    return () => {
      mounted = false;
    };
  });
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
  <TeachersToolbar
    bind:selectedTeachers
    {teachers}
    {loading}
    {is2026Event}
    onEventChange={loadEvent} />

  {#if error}
    <Alert.Root variant="destructive">
      <Alert.Title>Unable to load teachers</Alert.Title>
      <Alert.Description>{error.message}</Alert.Description>
    </Alert.Root>
  {/if}

  <TeachersList
    {selectedTeachers}
    registrations={registrations2026}
    {event}
    {loading}
    {is2026Event} />
</div>
