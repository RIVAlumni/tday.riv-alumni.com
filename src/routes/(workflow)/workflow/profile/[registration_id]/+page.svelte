<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/state';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';

  import {
    ArrowRightIcon,
    BuildingBankIcon,
    CalendarStarIcon,
    ChalkboardIcon,
    ChevronLeftIcon,
    ClockIcon,
    DoorExitIcon,
    HeartHandshakeIcon,
    IdBadge2Icon,
    IdIcon,
    InfoCircleIcon,
    PhoneIcon,
    SchoolIcon,
    UserIcon,
  } from '$lib/icons';

  import {
    actionMeta,
    formatTime,
    getEvent,
    initials,
    relativeTime,
    statusMeta,
    type ActionType,
  } from '../../reception/_shared/models.js';
  import { reception } from '../../reception/_shared/store.svelte.js';
  import { user } from '$lib/data/nav';
  import {
    buildTimeline,
    historicalActivity,
    type TimelineEntry,
  } from '../../reception/_shared/activity-log.js';

  const registrationId = $derived(page.params.registration_id);
  const registration = $derived(
    reception.registrations.find((r) => r.registration_id === registrationId),
  );

  // Seed once on mount so SSR stays stable and timestamps are always in the past.
  let mounted = $state(false);
  let history = $state<TimelineEntry[]>([]);

  onMount(() => {
    reception.hydrate();
    history = historicalActivity(reception.registrations);
    mounted = true;
  });

  const timeline = $derived(
    buildTimeline(reception.activity, reception.registrations, history, user.name),
  );
  /** This visitor's own action history, newest first. */
  const visitorHistory = $derived(timeline.filter((e) => e.registration_id === registrationId));

  const actionVerb: Record<ActionType, string> = {
    CHECKED_IN: 'Checked in',
    REFUSED: 'Refused entry',
    CONFLICT: 'Flagged for resolution',
  };

  const nodeTone: Record<ActionType, string> = {
    CHECKED_IN: 'text-emerald-500',
    REFUSED: 'text-red-500',
    CONFLICT: 'text-amber-500',
  };

  const evt = $derived(registration ? getEvent(registration.event_id) : undefined);

  const skeletonRows = Array.from({ length: 3 }, (_, i) => i);
</script>

<svelte:head>
  <title
    >{registration ? `${registration.full_name} · Profile` : 'Profile'} | RIVA Internal Systems</title>
</svelte:head>

<div class="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
  <!-- Back link -->
  <div>
    <a
      href="/workflow/logs"
      class="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
      <ChevronLeftIcon class="size-4" />
      Back to Audit Log
    </a>
  </div>

  {#if !registration}
    <!-- Not found -->
    <Card.Root class="flex flex-col items-center justify-center py-16 text-center">
      <div
        class="mb-4 flex size-16 items-center justify-center rounded-4xl bg-muted text-muted-foreground">
        <UserIcon class="size-8" />
      </div>
      <Card.Title class="text-lg">Profile not found</Card.Title>
      <Card.Description class="max-w-sm">
        No registration matches the ID “{registrationId}”. It may have been archived or the link is
        stale.
      </Card.Description>
      <Card.Footer class="mt-4">
        <Button href="/workflow/logs">Return to Audit Log</Button>
      </Card.Footer>
    </Card.Root>
  {:else}
    {@const meta = statusMeta[registration.status]}
    {@const isExRiverlite = registration.is_ex_riverlite}
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <!-- Identity header -->
      <Card.Root class="flex-1 ring-primary/20">
        <Card.Header class="border-b">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <span
                class="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-primary/10 font-heading text-xl font-semibold uppercase text-primary">
                {initials(registration.full_name)}
              </span>
              <div class="flex flex-col gap-1">
                <Card.Title class="text-lg tracking-tight md:text-xl">
                  {registration.full_name}
                </Card.Title>
                <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span class="inline-flex items-center gap-1 font-mono">
                    <IdBadge2Icon class="size-3.5" />
                    {registration.registration_id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span class="inline-flex items-center gap-1 font-mono">
                    <IdIcon class="size-3.5" />
                    {registration.nric}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span class="inline-flex items-center gap-1">
                    <CalendarStarIcon class="size-3.5" />
                    Class of {registration.graduating_year}
                    {registration.graduating_class}
                  </span>
                </div>
              </div>
            </div>
            <span
              class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {meta.badge}">
              <meta.icon class="size-3.5" />
              {meta.label}
            </span>
          </div>
        </Card.Header>

        <Card.Content>
          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <dt
                class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <PhoneIcon class="size-3.5" /> Contact number
              </dt>
              <dd class="text-sm font-medium tabular-nums">{registration.contact_number}</dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt
                class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <UserIcon class="size-3.5" /> Gender
              </dt>
              <dd class="text-sm font-medium">{registration.gender}</dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt
                class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <SchoolIcon class="size-3.5" /> Current institution
              </dt>
              <dd class="text-sm font-medium">{registration.current_institution}</dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt
                class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BuildingBankIcon class="size-3.5" /> Ex-Riverlite
              </dt>
              <dd class="text-sm font-medium">
                {#if isExRiverlite}
                  <Badge
                    variant="secondary"
                    class="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <HeartHandshakeIcon class="size-3" /> Yes
                  </Badge>
                {:else}
                  <span class="text-muted-foreground">No</span>
                {/if}
              </dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt
                class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ChalkboardIcon class="size-3.5" /> Visiting teachers
              </dt>
              <dd class="flex flex-col gap-1 text-sm font-medium">
                <span>
                  {registration.visiting_teachers.length} teacher{registration.visiting_teachers
                    .length === 1
                    ? ''
                    : 's'}
                </span>
                {#if registration.visiting_teachers.length > 0}
                  <span class="text-xs font-normal text-muted-foreground">
                    {registration.visiting_teachers.join(', ')}
                  </span>
                {/if}
              </dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt
                class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ClockIcon class="size-3.5" /> Arrived at
              </dt>
              <dd class="text-sm font-medium tabular-nums">
                {formatTime(registration.arrived_at)}
              </dd>
            </div>
          </dl>

          {#if registration.comments}
            <Separator class="my-4" />
            <div class="flex flex-col gap-2">
              <dt
                class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <InfoCircleIcon class="size-3.5" /> Notes
              </dt>
              <p
                class="whitespace-pre-line rounded-3xl bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
                {registration.comments}
              </p>
            </div>
          {/if}
        </Card.Content>

        <Card.Footer class="flex-col gap-2 border-t sm:flex-row sm:justify-between">
          <span class="text-xs text-muted-foreground">
            {#if evt}
              {evt.title} · {evt.venue}
            {/if}
          </span>
          <Button
            href="/workflow/reception"
            class="gap-1.5 {actionMeta.CHECKED_IN.button}">
            <DoorExitIcon class="size-4" />
            Open at Reception
            <ArrowRightIcon class="size-4" />
          </Button>
        </Card.Footer>
      </Card.Root>

      <!-- Action history for this visitor -->
      <Card.Root class="lg:w-80">
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <ClockIcon class="size-4 text-muted-foreground" />
            Action history
          </Card.Title>
          <Card.Description>Operator actions recorded for this visitor.</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if !mounted}
            <div class="flex flex-col gap-3 py-1">
              {#each skeletonRows as i (i)}
                <div class="flex items-center gap-3">
                  <Skeleton class="size-7 shrink-0 rounded-full" />
                  <div class="flex flex-1 flex-col gap-1.5">
                    <Skeleton class="h-3.5 w-24" />
                    <Skeleton class="h-3 w-16" />
                  </div>
                </div>
              {/each}
            </div>
          {:else if visitorHistory.length === 0}
            <p class="py-6 text-center text-sm text-muted-foreground">
              No actions recorded for this visitor yet.
            </p>
          {:else}
            <ol class="relative flex flex-col">
              <span
                class="absolute left-[0.875rem] top-2 bottom-2 w-px bg-border"
                aria-hidden="true"></span>
              {#each visitorHistory as entry (entry.at.getTime())}
                {@const m = statusMeta[entry.action]}
                <li class="relative flex items-start gap-3 py-2 first:pt-0 last:pb-0">
                  <span
                    class="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-background {m.soft} {nodeTone[
                      entry.action
                    ]}">
                    <m.icon class="size-3.5" />
                  </span>
                  <div class="flex min-w-0 flex-1 flex-col">
                    <span class="text-sm font-medium">{actionVerb[entry.action]}</span>
                    <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{entry.operator}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        class="tabular-nums"
                        title={entry.at.toLocaleString('en-SG')}>
                        {entry.live ? relativeTime(entry.at) : formatTime(entry.at.toISOString())}
                      </span>
                    </span>
                    {#if entry.reason}
                      <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {entry.reason}
                      </p>
                    {/if}
                  </div>
                </li>
              {/each}
            </ol>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
