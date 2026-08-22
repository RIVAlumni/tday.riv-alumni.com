<script lang="ts">
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { formatTime } from '$lib/data/reception';
  import { ClipboardCheckIcon, Mail01Icon, Presentation07Icon } from '$lib/icons';
  import type { Event } from '$lib/models/event';
  import type { Registration2026 } from '$lib/models/registration';
  import { arrivedAtFor, visitingTeachersFor } from '$lib/util/registration';
  import {
    buildTeacherEmailBody,
    buildTeacherEmailBodyHtml,
    formatEventDate,
    formatEventTime,
    teacherMailtoHref,
  } from '$lib/util/teacher-email';

  let {
    selectedTeachers,
    registrations,
    event,
    loading = false,
    is2026Event = false,
  }: {
    selectedTeachers: string[];
    registrations: Registration2026[];
    event: Event | null;
    loading?: boolean;
    is2026Event?: boolean;
  } = $props();

  const emailTemplate = $derived({
    date: formatEventDate(event?.event_start?.toDate()),
    startTime: formatEventTime(event?.event_start?.toDate()),
    endTime: formatEventTime(event?.event_end?.toDate()),
  });

  function studentsFor(teacher: string): Registration2026[] {
    return registrations.filter((registration) =>
      registration.visiting_teachers.some(
        (candidate) => candidate.trim().toUpperCase() === teacher.trim().toUpperCase(),
      ),
    );
  }

  // Puts rich text (text/html + text/plain) on the clipboard so pasting into
  // an email client renders the student list as a real table, like pasting
  // from a spreadsheet.
  async function copyEmailBody(teacher: string, students: Registration2026[]): Promise<void> {
    const text = buildTeacherEmailBody(teacher, students, emailTemplate);
    const html = buildTeacherEmailBodyHtml(teacher, students, emailTemplate);
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      toast.success('Email body copied', {
        description: 'Paste it into the email to include the formatted student table.',
      });
    } catch (error) {
      toast.error('Failed to copy email body', { description: (error as Error).message });
    }
  }
</script>

<div class="flex flex-col gap-6">
  {#if loading}
    <div class="text-sm text-muted-foreground">Loading teachers...</div>
  {:else if !is2026Event}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon"><Presentation07Icon /></Empty.Media>
        <Empty.Title>Teachers are only available for the 2026 event</Empty.Title>
        <Empty.Description
          >Select the 2026 event to view teachers and email them.</Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else if selectedTeachers.length === 0}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon"><Presentation07Icon /></Empty.Media>
        <Empty.Title>Select a teacher</Empty.Title>
        <Empty.Description
          >Choose one or more teachers above to see their students.</Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else}
    {#each selectedTeachers as teacher (teacher)}
      {@const students = studentsFor(teacher)}
      <section class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold">{teacher}</h2>
            <p class="text-sm text-muted-foreground">{students.length} student(s)</p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onclick={() => copyEmailBody(teacher, students)}>
              <span data-icon="inline-start"><ClipboardCheckIcon /></span>
              Copy email body
            </Button>
            <Button
              href={teacherMailtoHref(teacher, students, emailTemplate)}
              target="_blank"
              variant="outline"
              size="sm">
              <span data-icon="inline-start"><Mail01Icon /></span>
              Email the teacher
            </Button>
          </div>
        </div>
        <div class="overflow-hidden rounded-lg border">
          <Table.Root>
            <Table.Header class="bg-muted">
              <Table.Row>
                <Table.Head class="w-32">ID</Table.Head>
                <Table.Head>Name</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head class="w-20">Year</Table.Head>
                <Table.Head>Visiting Teachers</Table.Head>
                <Table.Head class="w-28">Arrived</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each students as registration (registration.registration_id)}
                <Table.Row>
                  <Table.Cell class="font-mono text-xs">{registration.registration_id}</Table.Cell>
                  <Table.Cell class="font-medium">{registration.full_name}</Table.Cell>
                  <Table.Cell>{registration.status}</Table.Cell>
                  <Table.Cell>{registration.graduating_year}</Table.Cell>
                  <Table.Cell>{visitingTeachersFor(registration)}</Table.Cell>
                  <Table.Cell class="text-muted-foreground">
                    {formatTime(arrivedAtFor(registration))}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      </section>
    {/each}
  {/if}
</div>
