<script lang="ts">
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';

  import {
    BanIcon,
    BuildingBankIcon,
    CalendarStatsIcon,
    ChalkboardIcon,
    CircleCheckFilledIcon,
    ClipboardCheckIcon,
    DoorExitIcon,
    FlagIcon,
    GaugeIcon,
    IdIcon,
    InfoCircleIcon,
    Loader2Icon,
    PencilIcon,
    PhoneIcon,
    SchoolIcon,
    ScanIcon,
    SearchIcon,
    UserCheckIcon,
    UserIcon,
    UsersIcon,
  } from '$lib/icons';

  import {
    actionMeta,
    events,
    formatTime,
    isNricLike,
    normaliseNric,
    initials,
    statusMeta,
    type ActionType,
    type Registration,
  } from '../reception/_shared/models.js';
  import { reception } from '../reception/_shared/store.svelte.js';

  $effect(() => {
    reception.hydrate();
  });

  // --- Page-local UI state -------------------------------------------------
  let query = $state('');
  let selected = $state<Registration | null>(null);
  let busyId = $state<string | null>(null);
  let searchInput = $state<HTMLInputElement | null>(null);

  /** Operator must confirm the ID matches before checking in. */
  let verified = $state(false);
  /** Inline conflict-reason composer. */
  let flagging = $state(false);
  let flagReason = $state('');
  /** Level 2 inline edit mode. */
  let editing = $state(false);
  let draft = $state<{ full_name: string; nric: string; contact_number: string }>({
    full_name: '',
    nric: '',
    contact_number: '',
  });

  const activeEvent = $derived(reception.activeEvent);
  const metrics = $derived(reception.metrics);
  const results = $derived(reception.search(query));
  const canViewStats = $derived(reception.canViewStats);
  const canEdit = $derived(reception.canEditRegistrations);

  const enteredNric = $derived(isNricLike(query) ? normaliseNric(query) : '');

  // Switching event resets the whole flow.
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    reception.activeEventId;
    closeRecord();
    query = '';
  });

  function focusSearch() {
    queueMicrotask(() => searchInput?.focus());
  }

  function openRecord(record: Registration) {
    selected = structuredClone($state.snapshot(record));
    verified = false;
    flagging = false;
    flagReason = '';
    editing = false;
    query = '';
  }

  function closeRecord() {
    selected = null;
    verified = false;
    flagging = false;
    flagReason = '';
    editing = false;
  }

  function reopenFromActivity(registrationId: string) {
    const latest = reception.get(registrationId);
    if (latest) openRecord(latest);
  }

  // Listen for jump-back taps from the right-hand activity rail (sibling tree).
  $effect(() => {
    const handler = (e: Event) => {
      const { registrationId } = (e as CustomEvent).detail ?? {};
      if (typeof registrationId === 'string') reopenFromActivity(registrationId);
    };
    window.addEventListener('reception:open-record', handler);
    return () => window.removeEventListener('reception:open-record', handler);
  });

  function beginEdit() {
    if (!selected) return;
    draft = {
      full_name: selected.full_name,
      nric: selected.nric,
      contact_number: selected.contact_number,
    };
    editing = true;
  }

  function saveEdit() {
    if (!selected || !canEdit) return;
    const patch = {
      full_name: draft.full_name.trim().toUpperCase(),
      nric: normaliseNric(draft.nric) || draft.nric.toUpperCase(),
      contact_number: draft.contact_number.trim(),
    };
    reception.updateRegistration(selected.registration_id, patch);
    selected = { ...selected, ...patch };
    editing = false;
    toast.success('Registration updated', {
      description: 'The corrected details have been saved.',
    });
  }

  // --- Actions -------------------------------------------------------------
  function runAction(record: Registration, action: ActionType, reason?: string) {
    if (busyId !== null) return;
    const meta = actionMeta[action];
    busyId = record.registration_id;
    window.setTimeout(() => {
      reception.applyAction(record.registration_id, action, reason);
      toast.success(meta.toastTitle, {
        description: `${record.full_name} · ${activeEvent.title}.`,
      });
      busyId = null;
      closeRecord();
      focusSearch();
    }, 450);
  }

  function confirmCheckIn() {
    if (!selected || !verified) return;
    runAction(selected, 'CHECKED_IN');
  }

  function submitFlag() {
    if (!selected) return;
    const reason = flagReason.trim();
    if (!reason) return; // reason is required
    runAction(selected, 'CONFLICT', reason);
  }

  function onSearchKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && results.length > 0) {
      // Single match opens directly for verification; the operator still must
      // confirm the ID before checking in.
      openRecord(results[0]);
    } else if (event.key === 'Escape') {
      query = '';
      closeRecord();
    }
  }

  // Progress ring geometry (metrics strip).
  const RADIUS = 30;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const ringOffset = $derived(CIRCUMFERENCE * (1 - metrics.progress));

  const metaTiles = $derived([
    {
      label: 'Checked in',
      value: metrics.checkedIn,
      total: metrics.total,
      icon: UserCheckIcon,
      tone: 'text-emerald-500',
    },
    { label: 'Awaiting', value: metrics.awaiting, icon: UsersIcon, tone: 'text-sky-500' },
    { label: 'Flagged', value: metrics.flagged, icon: FlagIcon, tone: 'text-amber-500' },
    { label: 'Refused', value: metrics.refused, icon: BanIcon, tone: 'text-red-500' },
  ]);
</script>

<svelte:head>
  <title>Reception · Operations Dashboard | RIVA Internal Systems</title>
</svelte:head>

<div class="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
  <!-- Top bar: event switcher + access badge -->
  <div class="flex flex-wrap items-center gap-3">
    <Select.Root
      type="single"
      value={reception.activeEventId}
      onValueChange={(v) => v && reception.setActiveEvent(v)}>
      <Select.Trigger class="h-9 rounded-3xl">
        <span
          data-slot="select-value"
          class="flex items-center gap-2">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-xs font-semibold text-primary-foreground">
            {activeEvent.year.slice(-2)}
          </span>
          <span class="font-medium">{activeEvent.title}</span>
          {#if activeEvent.status === 'active'}
            <span
              class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-emerald-600 dark:text-emerald-400">
              <span class="size-1.5 rounded-full bg-emerald-500"></span>LIVE
            </span>
          {/if}
        </span>
      </Select.Trigger>
      <Select.Content align="start">
        {#each events as event (event.id)}
          <Select.Item
            value={event.id}
            label={event.title}>
            <span class="flex flex-col">
              <span>{event.title}</span>
              <span class="text-xs font-normal text-muted-foreground">
                {event.status === 'active'
                  ? 'In progress'
                  : event.status === 'completed'
                    ? 'Archived'
                    : 'Upcoming'}
                · {event.venue}
              </span>
            </span>
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <span
      class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium {canEdit
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'border-border bg-muted/50 text-muted-foreground'}">
      {#if canEdit}<UserCheckIcon class="size-3.5" />Level 2 · can edit{:else}<UserIcon
          class="size-3.5" />Level 1 · read-only{/if}
    </span>
  </div>

  <!-- Metrics strip (gated: Level 2 / supervisors) -->
  {#if canViewStats}
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <!-- Progress ring tile -->
      <Card.Root
        size="sm"
        class="@container/card">
        <Card.Content class="flex items-center gap-3 pt-2">
          <div class="relative size-16 shrink-0">
            <svg
              viewBox="0 0 72 72"
              class="size-full -rotate-90">
              <circle
                cx="36"
                cy="36"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                stroke-width="7"
                class="text-muted/40" />
              <circle
                cx="36"
                cy="36"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                stroke-width="7"
                stroke-linecap="round"
                stroke-dasharray={CIRCUMFERENCE}
                stroke-dashoffset={ringOffset}
                class="text-emerald-500 transition-all duration-500" />
            </svg>
            <span
              class="absolute inset-0 flex items-center justify-center font-heading text-xs font-semibold tabular-nums">
              {Math.round(metrics.progress * 100)}%
            </span>
          </div>
          <div class="flex flex-col">
            <span class="font-heading text-xl font-semibold tabular-nums leading-none">
              {metrics.checkedIn}<span class="text-sm text-muted-foreground">/{metrics.total}</span>
            </span>
            <span class="text-xs text-muted-foreground">checked in</span>
          </div>
        </Card.Content>
      </Card.Root>

      {#each metaTiles as tile (tile.label)}
        <Card.Root size="sm">
          <Card.Content class="flex flex-col gap-0.5 pt-2">
            <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
              <tile.icon class="size-3.5 {tile.tone}" />
              {tile.label}
            </span>
            <span class="font-heading text-2xl font-semibold tabular-nums leading-tight">
              {tile.value}
              {#if 'total' in tile}
                <span class="text-sm text-muted-foreground">/{tile.total}</span>
              {/if}
            </span>
          </Card.Content>
        </Card.Root>
      {/each}

      <!-- Throughput tile -->
      <Card.Root size="sm">
        <Card.Content class="flex flex-col gap-0.5 pt-2">
          <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GaugeIcon class="size-3.5 text-primary" /> Rate
          </span>
          <span class="font-heading text-2xl font-semibold tabular-nums leading-tight">
            {metrics.rateOverall.toFixed(1)}
            <span class="text-sm font-normal text-muted-foreground">/min</span>
          </span>
          <span class="text-[0.7rem] text-muted-foreground">
            {metrics.rateLastMinute} in last min
          </span>
        </Card.Content>
      </Card.Root>

      <!-- ETA tile -->
      <Card.Root size="sm">
        <Card.Content class="flex flex-col gap-0.5 pt-2">
          <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarStatsIcon class="size-3.5 text-primary" /> Est. clear
          </span>
          <span class="font-heading text-2xl font-semibold tabular-nums leading-tight">
            {#if metrics.etaMinutes === null}—{:else}{metrics.etaMinutes}<span
                class="text-sm font-normal text-muted-foreground">m</span
              >{/if}
          </span>
          <span class="text-[0.7rem] text-muted-foreground">
            {metrics.awaiting} left at current pace
          </span>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}

  <!-- Two-pane workspace -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
    <!-- LEFT: search + results -->
    <section class="flex flex-col gap-4 lg:col-span-7">
      <div class="relative">
        <ScanIcon
          class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInput}
          type="text"
          bind:value={query}
          onkeydown={onSearchKey}
          placeholder="Scan QR or enter NRIC (e.g. T1234567A)…"
          autocomplete="off"
          autofocus
          class="h-11 rounded-3xl pl-10 font-mono uppercase {enteredNric
            ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
            : ''}" />
        {#if enteredNric}
          <CircleCheckFilledIcon
            class="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
        {/if}
      </div>

      <Card.Root class="flex-1">
        <Card.Header>
          <Card.Title class="flex items-center justify-between">
            <span>Guests</span>
            <span class="text-xs font-normal text-muted-foreground">
              {query
                ? `${results.length} match${results.length === 1 ? '' : 'es'}`
                : `${metrics.total} registered`}
            </span>
          </Card.Title>
        </Card.Header>
        <Card.Content class="flex flex-col gap-1.5">
          {#if query && results.length === 0}
            <div
              class="flex flex-col items-center gap-2 rounded-3xl border border-dashed py-10 text-center">
              <SearchIcon class="size-6 text-muted-foreground" />
              <p class="text-sm font-medium">No match for "{query}"</p>
              <p class="max-w-xs text-xs text-muted-foreground">
                Check the NRIC, or flag the visitor for Conflict Resolution.
              </p>
            </div>
          {:else if results.length > 0}
            {#each results as record (record.registration_id)}
              {@const m = statusMeta[record.status]}
              <button
                type="button"
                onclick={() => openRecord(record)}
                class="group flex items-center gap-3 rounded-3xl border p-2.5 text-left transition-colors {selected?.registration_id ===
                record.registration_id
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-transparent hover:bg-muted/50'} focus-visible:border-primary/40 focus-visible:bg-primary/5 focus-visible:outline-none">
                <span
                  class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-heading text-base font-semibold uppercase text-primary">
                  {initials(record.full_name)}
                </span>
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="truncate text-sm font-medium">{record.full_name}</span>
                  <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span class="font-mono">{record.nric}</span>
                    <span aria-hidden="true">·</span>
                    <span class="font-mono">{record.registration_id}</span>
                  </span>
                </span>
                <span
                  class="hidden items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {m.badge} sm:inline-flex">
                  <m.icon class="size-3" />
                  {m.label}
                </span>
                <ScanIcon
                  class="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            {/each}
          {:else}
            <div class="flex flex-col items-center gap-2 py-10 text-center">
              <ScanIcon class="size-6 text-muted-foreground" />
              <p class="text-sm font-medium">Scan or type to find a guest</p>
              <p class="max-w-xs text-xs text-muted-foreground">
                Open a record to verify their ID, then check them in.
              </p>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </section>

    <!-- RIGHT: verification + actions / session activity -->
    <section class="lg:col-span-5">
      {#if selected}
        {@const meta = statusMeta[selected.status]}
        {@const isBusy = busyId === selected.registration_id}
        {@const alreadyIn = selected.status === 'CHECKED_IN'}
        <Card.Root class="ring-primary/20">
          <!-- Identity header — the fields to compare against the physical ID -->
          <Card.Header class="border-b">
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 flex-col gap-2">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {meta.badge}">
                    <meta.icon class="size-3" />
                    {meta.label}
                  </span>
                  {#if canEdit && !editing && !alreadyIn}
                    <Button
                      variant="ghost"
                      size="xs"
                      onclick={beginEdit}
                      class="gap-1">
                      <PencilIcon class="size-3.5" /> Edit
                    </Button>
                  {/if}
                </div>
                {#if editing}
                  <Input
                    bind:value={draft.full_name}
                    class="h-11 font-heading text-lg font-semibold" />
                {:else}
                  <Card.Title class="text-xl leading-tight">{selected.full_name}</Card.Title>
                {/if}
                <div class="flex items-center gap-2">
                  {#if editing}
                    <Input
                      bind:value={draft.nric}
                      placeholder="NRIC"
                      class="h-9 max-w-[11rem] font-mono uppercase" />
                    <Input
                      bind:value={draft.contact_number}
                      placeholder="Contact"
                      class="h-9 max-w-[9rem] font-mono" />
                  {:else}
                    <span
                      class="inline-flex items-center gap-1.5 rounded-2xl bg-muted px-2.5 py-1 font-mono text-sm font-semibold tracking-wider">
                      <IdIcon class="size-3.5 text-muted-foreground" />
                      {selected.nric}
                    </span>
                    <span class="font-mono text-xs text-muted-foreground"
                      >{selected.registration_id}</span>
                    <span class="text-xs text-muted-foreground"
                      >· Class of {selected.graduating_year} {selected.graduating_class}</span>
                  {/if}
                </div>
              </div>
            </div>
          </Card.Header>

          {#if editing}
            <!-- Level 2 edit actions -->
            <Card.Footer class="gap-2 border-t">
              <Button
                variant="ghost"
                onclick={() => (editing = false)}>Cancel</Button>
              <Button
                class="ms-auto gap-1.5"
                onclick={saveEdit}>
                <ClipboardCheckIcon class="size-4" /> Save changes
              </Button>
            </Card.Footer>
          {:else}
            <Card.Content>
              <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt
                    class="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <PhoneIcon class="size-3.5" /> Contact
                  </dt>
                  <dd class="font-medium tabular-nums">{selected.contact_number}</dd>
                </div>
                <div>
                  <dt
                    class="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <UserIcon class="size-3.5" /> Gender
                  </dt>
                  <dd class="font-medium">{selected.gender}</dd>
                </div>
                <div>
                  <dt
                    class="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <SchoolIcon class="size-3.5" /> Institution
                  </dt>
                  <dd class="font-medium">{selected.current_institution}</dd>
                </div>
                <div>
                  <dt
                    class="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <BuildingBankIcon class="size-3.5" /> Ex-Riverlite
                  </dt>
                  <dd class="font-medium">{selected.is_ex_riverlite ? 'Yes' : 'No'}</dd>
                </div>
                <div class="col-span-2">
                  <dt
                    class="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <ChalkboardIcon class="size-3.5" /> Visiting teachers · Arrived
                  </dt>
                  <dd class="font-medium">
                    {selected.visiting_teachers.length} teacher{selected.visiting_teachers
                      .length === 1
                      ? ''
                      : 's'}
                    · {formatTime(selected.arrived_at)}
                  </dd>
                </div>
                {#if selected.comments}
                  <div class="col-span-2">
                    <dt
                      class="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                      <InfoCircleIcon class="size-3.5" /> Notes
                    </dt>
                    <dd
                      class="whitespace-pre-line rounded-3xl bg-muted/40 p-3 text-sm font-normal text-muted-foreground">
                      {selected.comments}
                    </dd>
                  </div>
                {/if}
              </dl>

              {#if !alreadyIn && !flagging}
                <!-- Verification gate -->
                <label
                  class="mt-4 flex cursor-pointer items-start gap-3 rounded-3xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50 has-checked:border-emerald-500/40 has-checked:bg-emerald-500/5">
                  <Checkbox
                    bind:checked={verified}
                    class="mt-0.5 size-5" />
                  <span class="flex flex-col gap-0.5 text-sm">
                    <span class="font-medium"
                      >I confirm the full name and NRIC match the presented ID.</span>
                    <span class="text-xs text-muted-foreground">
                      Required before check-in. If anything is wrong, flag for resolution instead.
                    </span>
                  </span>
                </label>
              {/if}
            </Card.Content>

            <!-- Actions -->
            {#if !alreadyIn}
              <Card.Footer class="flex-col gap-2 border-t">
                {#if flagging}
                  <!-- Conflict reason composer -->
                  <div class="flex w-full flex-col gap-2">
                    <label
                      for="flag-reason"
                      class="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <FlagIcon class="size-3.5" /> Why is this being flagged? (required)
                    </label>
                    <textarea
                      id="flag-reason"
                      bind:value={flagReason}
                      rows="3"
                      placeholder="e.g. Name on NRIC differs — shows “AISHAH BTE RAMAN” but record says “AISHAH RAHMAN”."
                      class="w-full resize-none rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    ></textarea>
                    <div class="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onclick={() => (flagging = false)}
                        disabled={busyId !== null}>
                        Cancel
                      </Button>
                      <Button
                        class="ms-auto gap-1.5 {actionMeta.CONFLICT.button}"
                        onclick={submitFlag}
                        disabled={busyId !== null || flagReason.trim() === ''}>
                        {#if isBusy}<Loader2Icon class="size-4 animate-spin" />{:else}<FlagIcon
                            class="size-4" />{/if}
                        Submit to Resolution
                      </Button>
                    </div>
                  </div>
                {:else}
                  <div class="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="ghost"
                      onclick={closeRecord}
                      disabled={busyId !== null}>
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      class="gap-1.5 {actionMeta.CONFLICT.outline}"
                      onclick={() => (flagging = true)}
                      disabled={busyId !== null}>
                      <FlagIcon class="size-4" /> Flag for Resolution
                    </Button>
                    <Button
                      class="gap-2 {actionMeta.CHECKED_IN.button}"
                      onclick={confirmCheckIn}
                      disabled={!verified || busyId !== null}>
                      {#if isBusy}
                        <Loader2Icon class="size-4 animate-spin" />
                      {:else}
                        <DoorExitIcon class="size-5" />
                      {/if}
                      {verified ? 'Confirm Check-In' : 'Verify to check in'}
                    </Button>
                  </div>
                {/if}
              </Card.Footer>
            {:else}
              <Card.Footer class="border-t">
                <div
                  class="flex w-full items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CircleCheckFilledIcon class="size-4" /> Already checked in
                  <Button
                    variant="ghost"
                    class="ms-auto"
                    onclick={closeRecord}>Close</Button>
                </div>
              </Card.Footer>
            {/if}
          {/if}
        </Card.Root>
      {:else}
        <Card.Root class="flex h-full flex-col">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <ClipboardCheckIcon class="size-4 text-muted-foreground" />
              Verification checklist
            </Card.Title>
            <Card.Description>
              Confirm these against the presented ID before check-in.
            </Card.Description>
          </Card.Header>
          <Card.Content class="flex-1">
            <ul class="flex flex-col gap-3 text-sm">
              <li class="flex items-start gap-2.5">
                <span
                  class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CircleCheckFilledIcon class="size-3.5" />
                </span>
                <span
                  ><span class="font-medium">Full name</span> matches the ID exactly — spelling, spaces,
                  and order.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span
                  class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CircleCheckFilledIcon class="size-3.5" />
                </span>
                <span><span class="font-medium">NRIC number</span> matches the ID.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span
                  class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <FlagIcon class="size-3.5" />
                </span>
                <span
                  >If anything differs, <span class="font-medium"
                    >flag for Conflict Resolution</span> with a short reason.</span>
              </li>
            </ul>
            <p class="mt-4 text-xs text-muted-foreground">
              Recent actions are pinned to the activity rail on the right.
            </p>
          </Card.Content>
        </Card.Root>
      {/if}
    </section>
  </div>
</div>
