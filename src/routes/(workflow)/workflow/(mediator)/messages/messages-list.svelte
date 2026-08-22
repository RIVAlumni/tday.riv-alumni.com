<script lang="ts">
  import type { MessageRow } from '$lib/util/messages';

  import type { Timestamp } from 'firebase/firestore';

  import * as Empty from '$lib/components/ui/empty/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { Mail01Icon } from '$lib/icons';

  let {
    messages,
    loading = false,
    is2026Event = false,
  }: {
    messages: MessageRow[];
    loading?: boolean;
    is2026Event?: boolean;
  } = $props();

  function formatWrittenAt(writtenAt: Timestamp): string {
    return writtenAt.toDate().toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
</script>

<div class="overflow-hidden rounded-lg border">
  <Table.Root>
    <Table.Header class="bg-muted sticky top-0 z-10">
      <Table.Row>
        <Table.Head class="w-56">Student Name</Table.Head>
        <Table.Head class="w-28">Graduating Year</Table.Head>
        <Table.Head class="w-72">Teacher's Name</Table.Head>
        <Table.Head>Written Message</Table.Head>
        <Table.Head class="w-40">Written At</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#if loading}
        <Table.Row>
          <Table.Cell
            colspan={5}
            class="h-32 text-center text-sm text-muted-foreground">
            Loading messages...
          </Table.Cell>
        </Table.Row>
      {:else if !is2026Event}
        <Table.Row>
          <Table.Cell
            colspan={5}
            class="h-32 text-center">
            <Empty.Root>
              <Empty.Header>
                <Empty.Media variant="icon"><Mail01Icon /></Empty.Media>
                <Empty.Title>Written messages are only available for the 2026 event</Empty.Title>
                <Empty.Description
                  >Select the 2026 event to view and export messages.</Empty.Description>
              </Empty.Header>
            </Empty.Root>
          </Table.Cell>
        </Table.Row>
      {:else if messages.length === 0}
        <Table.Row>
          <Table.Cell
            colspan={5}
            class="h-32 text-center">
            <Empty.Root>
              <Empty.Header>
                <Empty.Media variant="icon"><Mail01Icon /></Empty.Media>
                <Empty.Title>No written messages found</Empty.Title>
                <Empty.Description>Try selecting a different teacher.</Empty.Description>
              </Empty.Header>
            </Empty.Root>
          </Table.Cell>
        </Table.Row>
      {:else}
        {#each messages as message, i (i)}
          <Table.Row>
            <Table.Cell class="align-top font-medium">{message.student_name}</Table.Cell>
            <Table.Cell class="align-top">{message.graduating_year}</Table.Cell>
            <Table.Cell class="align-top font-medium">{message.teacher_name}</Table.Cell>
            <Table.Cell class="whitespace-pre-wrap wrap-break-word">{message.message}</Table.Cell>
            <Table.Cell class="whitespace-nowrap align-top text-muted-foreground">
              {formatWrittenAt(message.written_at)}
            </Table.Cell>
          </Table.Row>
        {/each}
      {/if}
    </Table.Body>
  </Table.Root>
</div>
