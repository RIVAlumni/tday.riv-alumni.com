<script lang="ts">
  import { onMount } from 'svelte';

  import * as Alert from '$lib/components/ui/alert/index.js';
  import { searchRegistrations } from '$lib/firebase';
  import { eventStore } from '$lib/stores/event.svelte';
  import { buildMessagesCsv } from '$lib/util/messages-csv';
  import { flattenMessages, type MessageRow } from '$lib/util/messages';

  import MessagesList from './messages-list.svelte';
  import MessagesToolbar from './messages-toolbar.svelte';

  let messages = $state<MessageRow[]>([]);
  let selectedTeacher = $state('all');
  let loading = $state(false);
  let error = $state<Error | null>(null);
  let requestSequence = 0;

  const is2026Event = $derived(eventStore.activeEventId === '2026');

  const filteredMessages = $derived(
    selectedTeacher === 'all'
      ? messages
      : messages.filter((message) => teacherMatches(message.teacher_name, selectedTeacher)),
  );

  function teacherMatches(teacherName: string, selected: string): boolean {
    return teacherName.trim().toUpperCase() === selected.trim().toUpperCase();
  }

  async function loadEvent(eventId: string): Promise<void> {
    const sequence = ++requestSequence;
    selectedTeacher = 'all';
    messages = [];
    error = null;

    if (eventId !== '2026') {
      loading = false;
      return;
    }

    loading = true;
    try {
      const registrations = await searchRegistrations(eventId, { search: '' });
      if (sequence !== requestSequence || eventId !== eventStore.activeEventId) return;
      messages = flattenMessages(registrations);
      error = null;
    } catch (queryError) {
      if (sequence !== requestSequence) return;
      messages = [];
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

  function downloadCsv(): void {
    const csv = buildMessagesCsv(filteredMessages);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `written-messages-${eventStore.activeEventId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
</script>

<div class="@container/main flex flex-col gap-4 p-4 lg:p-6">
  <MessagesToolbar
    bind:selectedTeacher
    {loading}
    messageCount={filteredMessages.length}
    {is2026Event}
    onEventChange={loadEvent}
    onDownload={downloadCsv} />

  {#if error}
    <Alert.Root variant="destructive">
      <Alert.Title>Unable to load messages</Alert.Title>
      <Alert.Description>{error.message}</Alert.Description>
    </Alert.Root>
  {/if}

  <MessagesList
    messages={filteredMessages}
    {loading}
    {is2026Event} />
</div>
