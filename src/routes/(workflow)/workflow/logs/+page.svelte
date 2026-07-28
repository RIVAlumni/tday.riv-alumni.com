<script lang="ts">
  import { onMount } from 'svelte';

  import * as Card from '$lib/components/ui/card/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';

  import {
    BanIcon,
    ArrowRight01Icon,
    Clock01Icon,
    Door01Icon,
    HeartHandshakeIcon,
    HistoryIcon,
    UserIcon,
  } from '$lib/icons';

  import {
    events,
    statusMeta,
    formatTime,
    relativeTime,
    type ActionType,
  } from '../reception/_shared/models.js';
  import { reception } from '../reception/_shared/store.svelte.js';
  import { user } from '$lib/data/nav';
  import {
    buildTimeline,
    groupByDay,
    historicalActivity,
    type TimelineEntry,
  } from '../reception/_shared/activity-log.js';

  // The historical trail is generated relative to the real "now", so it is
  // populated only after mount (keeps SSR output stable and guarantees past
  // timestamps regardless of the system clock).
  let mounted = $state(false);
  let history = $state<TimelineEntry[]>([]);

  let eventFilter = $state<string>('all');

  onMount(() => {
    reception.hydrate();
    history = historicalActivity(reception.registrations);
    mounted = true;
  });

  const timeline = $derived(
    buildTimeline(reception.activity, reception.registrations, history, user.name),
  );
  const filtered = $derived(
    eventFilter === 'all' ? timeline : timeline.filter((e) => e.event_id === eventFilter),
  );
  const groups = $derived(groupByDay(filtered));

  const counts = $derived({
    total: filtered.length,
    checkedIn: filtered.filter((e) => e.action === 'CHECKED_IN').length,
    conflict: filtered.filter((e) => e.action === 'CONFLICT').length,
    refused: filtered.filter((e) => e.action === 'REFUSED').length,
  });

  // Past-tense verbs read better on a timeline than the status labels.
  const actionVerb: Record<ActionType, string> = {
    CHECKED_IN: 'Checked in',
    REFUSED: 'Refused entry',
    CONFLICT: 'Flagged for resolution',
  };

  // Static node icon tones (full class strings so Tailwind's scanner sees them).
  const nodeTone: Record<ActionType, string> = {
    CHECKED_IN: 'text-emerald-500',
    REFUSED: 'text-red-500',
    CONFLICT: 'text-amber-500',
  };

  const summaryTiles = $derived([
    {
      label: 'Actions',
      value: counts.total,
      icon: HistoryIcon,
      tone: 'text-primary',
    },
    {
      label: 'Checked in',
      value: counts.checkedIn,
      icon: Door01Icon,
      tone: 'text-emerald-500',
    },
    {
      label: 'Flagged',
      value: counts.conflict,
      icon: HeartHandshakeIcon,
      tone: 'text-amber-500',
    },
    { label: 'Refused', value: counts.refused, icon: BanIcon, tone: 'text-red-500' },
  ]);

  const filterOptions = $derived([{ id: 'all', title: 'All events' }, ...events]);

  const skeletonRows = Array.from({ length: 5 }, (_, i) => i);
</script>

<svelte:head>
  <title>Audit Log | RIVA Internal Systems</title>
</svelte:head>

<div class="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
  <!-- Header -->
  <header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <HistoryIcon class="size-3.5" />
        Records
      </div>
      <h1 class="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
        Audit &amp; Activity Log
      </h1>
      <p class="max-w-2xl text-sm text-muted-foreground">
        A historical timeline of every check-in, refusal, and conflict handover taken by operators.
        The most recent action is at the top — select any entry to jump straight to the visitor's
        profile.
      </p>
    </div>

    <!-- Event filter -->
    <div class="flex shrink-0 items-center gap-2">
      <Select.Root
        type="single"
        value={eventFilter}
        onValueChange={(v) => v && (eventFilter = v)}>
        <Select.Trigger class="h-9 rounded-3xl min-w-[10rem]">
          <span
            data-slot="select-value"
            class="flex items-center gap-2">
            <Clock01Icon class="size-4 text-muted-foreground" />
            {#if eventFilter === 'all'}
              All events
            {:else}
              {events.find((e) => e.id === eventFilter)?.title ?? 'All events'}
            {/if}
          </span>
        </Select.Trigger>
        <Select.Content align="end">
          {#each filterOptions as opt (opt.id)}
            <Select.Item
              value={opt.id}
              label={opt.title}>
              {opt.title}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </header>

  <!-- Summary tiles -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {#each summaryTiles as tile (tile.label)}
      <Card.Root size="sm">
        <Card.Content class="flex flex-col gap-0.5 pt-2">
          <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <tile.icon class="size-3.5 {tile.tone}" />
            {tile.label}
          </span>
          <span class="font-heading text-2xl font-semibold tabular-nums leading-tight">
            {tile.value}
          </span>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  <!-- Timeline -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center justify-between">
        <span>Timeline</span>
        <span class="text-xs font-normal text-muted-foreground">
          {#if mounted}
            {filtered.length} action{filtered.length === 1 ? '' : 's'}
          {:else}
            Loading&hellip;
          {/if}
        </span>
      </Card.Title>
    </Card.Header>
    <Card.Content>
      {#if !mounted}
        <!-- Skeleton: mirrors the row layout to avoid layout shift on hydration -->
        <div class="flex flex-col gap-4 py-2">
          {#each skeletonRows as i (i)}
            <div class="flex items-center gap-3">
              <Skeleton class="size-9 shrink-0 rounded-full" />
              <div class="flex flex-1 flex-col gap-2">
                <Skeleton class="h-4 w-40" />
                <Skeleton class="h-3 w-56" />
              </div>
            </div>
          {/each}
        </div>
      {:else if groups.length === 0}
        <div
          class="flex flex-col items-center gap-2 rounded-3xl border border-dashed py-12 text-center">
          <HistoryIcon class="size-6 text-muted-foreground" />
          <p class="text-sm font-medium">No actions recorded</p>
          <p class="max-w-xs text-xs text-muted-foreground">
            Operator check-ins, refusals, and conflict handovers will appear here as they happen.
          </p>
        </div>
      {:else}
        <div class="flex flex-col gap-6">
          {#each groups as group (group.key)}
            <section class="flex flex-col gap-2">
              <div
                class="sticky top-2 z-10 w-fit rounded-full bg-background/80 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                {group.label}
              </div>
              <ol class="relative flex flex-col">
                <span
                  class="absolute left-[1.875rem] top-3 bottom-3 w-px bg-border"
                  aria-hidden="true"></span>
                {#each group.entries as entry (entry.registration_id + entry.at.getTime())}
                  {@const meta = statusMeta[entry.action]}
                  {@const verb = actionVerb[entry.action]}
                  {@const profileHref = `/workflow/records/${entry.registration_id}`}
                  <li class="relative">
                    <a
                      href={profileHref}
                      class="group flex items-start gap-3 rounded-3xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50 focus-visible:border-ring focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                      aria-label={`${verb}: ${entry.full_name} (${entry.registration_id}) — open profile`}>
                      <span
                        class="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-background {meta.soft} {nodeTone[
                          entry.action
                        ]}">
                        <meta.icon class="size-4" />
                      </span>
                      <span class="flex min-w-0 flex-1 flex-col">
                        <span class="flex items-center justify-between gap-2">
                          <span class="flex min-w-0 items-center gap-2">
                            <span class="truncate text-sm font-medium">{entry.full_name}</span>
                            {#if entry.live}
                              <span
                                class="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-emerald-600 dark:text-emerald-400">
                                <span class="size-1.5 rounded-full bg-emerald-500"></span>LIVE
                              </span>
                            {/if}
                          </span>
                          <span
                            class="shrink-0 text-xs tabular-nums text-muted-foreground"
                            title={entry.at.toLocaleString('en-SG')}>
                            {#if entry.live}{relativeTime(entry.at)}{:else}{formatTime(
                                entry.at.toISOString(),
                              )}{/if}
                          </span>
                        </span>
                        <span
                          class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span class="font-mono">{entry.registration_id}</span>
                          <span aria-hidden="true">·</span>
                          <span class="font-mono">{entry.nric}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium {meta.badge}">
                            {verb}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span class="inline-flex items-center gap-1">
                            <UserIcon class="size-3" />
                            {entry.operator}
                          </span>
                        </span>
                        {#if entry.reason}
                          <p
                            class="mt-1.5 rounded-2xl bg-muted/50 p-2 text-xs leading-relaxed text-muted-foreground">
                            {entry.reason}
                          </p>
                        {/if}
                      </span>
                      <ArrowRight01Icon
                        class="size-4 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </a>
                  </li>
                {/each}
              </ol>
            </section>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
