<script lang="ts">
  import { onMount } from 'svelte';

  import { toast } from 'svelte-sonner';

  import * as Alert from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { formatTime } from '$lib/data/reception';
  import {
    claimTeacher,
    completeTeacher,
    releaseClaim,
    uncompleteTeacher,
  } from '$lib/firebase/claims';
  import {
    CheckIcon,
    ClipboardCheckIcon,
    Mail01Icon,
    Presentation07Icon,
    Sorting01Icon,
    Sorting02Icon,
  } from '$lib/icons';
  import type { Event } from '$lib/models/event';
  import type { Registration2026 } from '$lib/models/registration';
  import type { TeacherClaim } from '$lib/util/teacher-claims';
  import {
    isClaimStale,
    normalizeTeacherKey,
    rankTeachersByStudentCount,
  } from '$lib/util/teacher-claims';
  import {
    buildTeacherEmailBody,
    buildTeacherEmailBodyHtml,
    formatEventDate,
    formatEventTime,
    teacherMailtoHref,
  } from '$lib/util/teacher-email';

  import StudentsTable from './students-table.svelte';

  let {
    selectedTeachers,
    registrations,
    event,
    loading = false,
    is2026Event = false,
    claims = {} as Record<string, TeacherClaim>,
    viewer = null as { email: string; name: string } | null,
  }: {
    selectedTeachers: string[];
    registrations: Registration2026[];
    event: Event | null;
    loading?: boolean;
    is2026Event?: boolean;
    claims?: Record<string, TeacherClaim>;
    viewer?: { email: string; name: string } | null;
  } = $props();

  const emailTemplate = $derived({
    date: formatEventDate(event?.event_start?.toDate()),
    startTime: formatEventTime(event?.event_start?.toDate()),
    endTime: formatEventTime(event?.event_end?.toDate()),
  });

  const rankedTeachers = $derived(
    selectedTeachers.length > 0 ? selectedTeachers : rankTeachersByStudentCount(registrations),
  );

  let sortDirection = $state<'asc' | 'desc'>('desc');

  // stable count sort; ties stay alphabetical in both directions
  const sortedTeachers = $derived(
    [...rankedTeachers].sort((left, right) => {
      const countDelta = studentsFor(left).length - studentsFor(right).length;
      if (countDelta !== 0) return sortDirection === 'asc' ? countDelta : -countDelta;
      return left.localeCompare(right, 'en-SG', { sensitivity: 'base' });
    }),
  );

  // View switcher: Unassigned / Assigned to me / Assigned to others.
  // A claim keyed by normalized teacher name decides membership; the claim
  // status (CLAIMED vs COMPLETED) only changes how the row is rendered.
  type TeacherView = 'unassigned' | 'mine' | 'others';

  const teacherViews: { id: TeacherView; label: string }[] = [
    { id: 'unassigned', label: 'Unassigned' },
    { id: 'mine', label: 'Assigned to me' },
    { id: 'others', label: 'Assigned to others' },
  ];

  let view = $state<TeacherView>('unassigned');
  const viewLabel = $derived(teacherViews.find((v) => view === v.id)?.label ?? 'Select a view');

  const viewTeachers = $derived(sortedTeachers.filter(matchesView));

  const viewCounts = $derived({
    unassigned: rankedTeachers.filter((teacher) => !claimFor(teacher)).length,
    mine: rankedTeachers.filter((teacher) => claimFor(teacher)?.claimed_by.email === viewer?.email)
      .length,
    others: rankedTeachers.filter((teacher) => {
      const claim = claimFor(teacher);
      return claim !== undefined && claim.claimed_by.email !== viewer?.email;
    }).length,
  });

  function matchesView(teacher: string): boolean {
    const claim = claimFor(teacher);
    if (view === 'unassigned') return claim === undefined;
    if (view === 'mine') return claim?.claimed_by.email === viewer?.email;
    return claim !== undefined && claim.claimed_by.email !== viewer?.email;
  }

  // Claim staleness depends on the current time, so tick a non-write
  // render clock to re-evaluate badges and the blocked alert without
  // waiting for the next claims snapshot.
  let now = $state(Date.now());
  onMount(() => {
    const interval = setInterval(() => {
      now = Date.now();
    }, 60_000);
    return () => clearInterval(interval);
  });

  // Selected student ids per teacher (normalized key). No selection means
  // every student is included in the email; any selection narrows it.
  let selectedStudents = $state<Record<string, string[]>>({});

  function claimFor(teacher: string): TeacherClaim | undefined {
    return claims[normalizeTeacherKey(teacher)];
  }

  function isCompleted(teacher: string): boolean {
    return claimFor(teacher)?.status === 'COMPLETED';
  }

  function isMine(teacher: string): boolean {
    const claim = claimFor(teacher);
    return claim?.claimed_by.email === viewer?.email && claim?.status === 'CLAIMED';
  }

  function isBlocked(teacher: string): boolean {
    const claim = claimFor(teacher);
    return (
      viewer !== null &&
      claim !== undefined &&
      claim.status === 'CLAIMED' &&
      !isMine(teacher) &&
      !isClaimStale(claim, now)
    );
  }

  function blockerName(teacher: string): string {
    return claimFor(teacher)?.claimed_by.name ?? '';
  }

  function claimStatus(teacher: string): string {
    const claim = claimFor(teacher);
    if (!claim) return 'Unassigned';
    if (claim.status === 'COMPLETED') {
      return `Completed by ${claim.completed_by?.name} at ${formatTime(claim.completed_at)}`;
    }
    if (claim.claimed_by.email === viewer?.email) return 'Assigned to you';
    if (isClaimStale(claim, now)) {
      return `Assigned to ${claim.claimed_by.name} (timed out)`;
    }
    return `Assigned to ${claim.claimed_by.name} at ${formatTime(claim.claimed_at)}`;
  }

  function studentsFor(teacher: string): Registration2026[] {
    return registrations.filter((registration) =>
      registration.visiting_teachers.some(
        (candidate) => candidate.trim().toUpperCase() === teacher.trim().toUpperCase(),
      ),
    );
  }

  function emailableStudents(teacher: string): Registration2026[] {
    const selected = selectedStudents[normalizeTeacherKey(teacher)];
    const all = studentsFor(teacher);
    if (!selected || selected.length === 0) return all;
    const wanted = new Set(selected);
    return all.filter((registration) => wanted.has(registration.registration_id));
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

  async function onClaim(teacher: string): Promise<void> {
    if (!viewer) return;
    try {
      await claimTeacher(teacher, viewer);
      toast.success(`Assigned ${teacher} to you`);
    } catch (error) {
      toast.error('Unable to assign', { description: (error as Error).message });
    }
  }

  async function onRelease(teacher: string): Promise<void> {
    try {
      await releaseClaim(teacher);
      toast.success(`Unassigned ${teacher} from you`);
    } catch (error) {
      toast.error('Unable to unassign', { description: (error as Error).message });
    }
  }

  async function onComplete(teacher: string): Promise<void> {
    if (!viewer) return;
    try {
      await completeTeacher(teacher, viewer);
      toast.success(`Marked ${teacher} as completed`);
    } catch (error) {
      toast.error('Unable to complete', { description: (error as Error).message });
    }
  }

  async function onUndoComplete(teacher: string): Promise<void> {
    if (!viewer) return;
    try {
      await uncompleteTeacher(teacher, viewer);
      toast.success(`Reopened ${teacher}`);
    } catch (error) {
      toast.error('Unable to undo completion', { description: (error as Error).message });
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
  {:else}
    <div class="flex items-center justify-between">
      <Label
        for="view-selector"
        class="sr-only">View</Label>
      <Select.Root
        type="single"
        bind:value={view}>
        <Select.Trigger
          class="flex w-fit @4xl/main:hidden"
          size="sm"
          id="view-selector">
          {viewLabel}
        </Select.Trigger>
        <Select.Content>
          {#each teacherViews as teacherView (teacherView.id)}
            <Select.Item value={teacherView.id}>
              {teacherView.label} ({viewCounts[teacherView.id]})
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <Tabs.Root
        value={view}
        onValueChange={(next) => (view = next as TeacherView)}
        class="w-full flex-col justify-start gap-6">
        <Tabs.List
          class="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          {#each teacherViews as teacherView (teacherView.id)}
            <Tabs.Trigger value={teacherView.id}>
              {teacherView.label}
              <Badge variant="secondary">{viewCounts[teacherView.id]}</Badge>
            </Tabs.Trigger>
          {/each}
        </Tabs.List>
      </Tabs.Root>
      <Button
        variant="outline"
        size="sm"
        class="shrink-0"
        aria-label={`Sort by ${sortDirection === 'asc' ? 'ascending' : 'descending'} count`}
        aria-pressed={sortDirection === 'asc'}
        onclick={() => (sortDirection = sortDirection === 'asc' ? 'desc' : 'asc')}>
        {#if sortDirection === 'asc'}
          <Sorting02Icon />
        {:else}
          <Sorting01Icon />
        {/if}
        {sortDirection === 'asc' ? 'Sort by ascending count' : 'Sort by descending count'}
      </Button>
    </div>

    {#if viewTeachers.length === 0}
      <Empty.Root>
        <Empty.Header>
          <Empty.Media variant="icon">
            <Presentation07Icon />
          </Empty.Media>
          {#if view === 'unassigned'}
            <Empty.Title>No teachers to be assigned</Empty.Title>
            <Empty.Description>All teachers have been assigned already.</Empty.Description>
          {:else if view === 'mine'}
            <Empty.Title>No teachers assigned to you</Empty.Title>
            <Empty.Description
              >Assign a teacher to yourself to start emailing them.</Empty.Description>
          {:else}
            <Empty.Title>No teachers assigned to others</Empty.Title>
            <Empty.Description>Every current assignment is yours.</Empty.Description>
          {/if}
        </Empty.Header>
      </Empty.Root>
    {:else}
      {#each viewTeachers as teacher (teacher)}
        {@const students = studentsFor(teacher)}
        {#if isCompleted(teacher)}
          <section class="rounded-lg border">
            <div class="flex items-center justify-between gap-3 px-4 py-2">
              <div class="flex items-baseline gap-3">
                <CheckIcon class="size-4 text-muted-foreground" />
                <span class="text-sm font-medium">{teacher}</span>
                <span class="text-sm text-muted-foreground">{students.length} student(s)</span>
                <span class="text-xs text-muted-foreground">
                  Completed by {claimFor(teacher)?.completed_by?.name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onclick={() => onUndoComplete(teacher)}>
                Undo
              </Button>
            </div>
          </section>
        {:else}
          {@const blocked = isBlocked(teacher)}
          <section class="flex flex-col gap-2">
            {#if blocked}
              <Alert.Root
                variant="destructive"
                class="px-5 py-4">
                <Alert.Title class="text-base font-semibold"
                  >Assigned to {blockerName(teacher)}</Alert.Title>
                <Alert.Description class="text-sm">
                  {blockerName(teacher)} is emailing this teacher. Email or copy only if you have checked
                  with them.
                </Alert.Description>
              </Alert.Root>
            {/if}
            <div class="flex flex-col gap-3">
              <div class="flex flex-wrap items-center gap-3">
                <h2 class="text-base font-semibold">{teacher}</h2>
                <Badge variant="secondary">{students.length} student(s)</Badge>
                <span class="text-sm text-muted-foreground">{claimStatus(teacher)}</span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                {#if isMine(teacher)}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={blocked}
                    onclick={() => onRelease(teacher)}>
                    Unassign myself
                  </Button>
                {:else}
                  <Button
                    variant="outline"
                    size="sm"
                    class="border-green-600 bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                    disabled={blocked}
                    onclick={() => onClaim(teacher)}>
                    Assign to me
                  </Button>
                {/if}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => copyEmailBody(teacher, emailableStudents(teacher))}>
                  <span data-icon="inline-start"><ClipboardCheckIcon /></span>
                  Copy email body
                </Button>
                <Button
                  href={teacherMailtoHref(teacher, emailableStudents(teacher), emailTemplate)}
                  target="_blank"
                  variant="outline"
                  size="sm">
                  <span data-icon="inline-start"><Mail01Icon /></span>
                  Email the teacher
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={blocked}
                  onclick={() => onComplete(teacher)}>
                  <span data-icon="inline-start"><CheckIcon /></span>
                  Mark as completed
                </Button>
              </div>
            </div>
            <StudentsTable
              {students}
              selected={selectedStudents[normalizeTeacherKey(teacher)] ?? []}
              onselectedchange={(ids) => {
                selectedStudents[normalizeTeacherKey(teacher)] = ids;
              }} />
          </section>
        {/if}
      {/each}
    {/if}
  {/if}
</div>
