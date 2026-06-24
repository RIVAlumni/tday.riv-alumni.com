<script lang="ts">
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card/index.js';
  import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldTitle,
  } from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';

  import {
    ArrowRightIcon,
    BanIcon,
    BuildingBankIcon,
    CalendarStarIcon,
    CalendarIcon,
    ChalkboardIcon,
    CircleCheckFilledIcon,
    DoorExitIcon,
    HeartHandshakeIcon,
    IdBadge2Icon,
    InfoCircleIcon,
    Loader2Icon,
    PhoneIcon,
    QrcodeIcon,
    SchoolIcon,
    SearchIcon,
    SparklesIcon,
    UserIcon,
    UsersIcon,
  } from '$lib/icons';

  import {
    findRegistrations,
    mockRegistrations,
    type Registration,
    type RegistrationStatus,
  } from './data';

  // --- Session state ------------------------------------------------------
  // TODO(firebase): once auth lands, drive these from the real FSUser /
  // authStore rather than the static placeholder in `src/lib/data/nav.ts`.
  const operatorName = 'RIVAlumni Operator';

  // --- Search -------------------------------------------------------------
  let query = $state('');

  const results = $derived(findRegistrations(query));

  // --- Selected visitor ---------------------------------------------------
  let selected = $state<Registration | null>(null);

  function selectVisitor(record: Registration) {
    selected = structuredClone($state.snapshot(record));
    query = '';
  }

  function clearSelection() {
    selected = null;
  }

  // --- Activity log -------------------------------------------------------
  interface ActivityEntry {
    registration_id: string;
    full_name: string;
    action: 'CHECKED_IN' | 'REFUSED' | 'CONFLICT';
    at: Date;
  }

  let activity = $state<ActivityEntry[]>([]);

  // --- Actions ------------------------------------------------------------
  // Simulated mutations. Each returns a Promise so the swap to real Firestore
  // actions (see master's `actionCheckIn` / `actionRefuseEntry` /
  // `actionSetConflict`) is a drop-in change.
  function persistAction(
    action: ActivityEntry['action'],
    verb: string,
    toastTitle: string,
    toastDescription: string,
  ): Promise<void> {
    if (!selected) return Promise.resolve();
    const record = selected;
    const previousStatus = record.status;

    return new Promise((resolve) => {
      setTimeout(() => {
        // Mutate the in-memory seed so subsequent searches reflect the change.
        const target = mockRegistrations.find((r) => r.registration_id === record.registration_id);
        if (target) {
          target.status = action as RegistrationStatus;
          if (action === 'CHECKED_IN') target.arrived_at = new Date().toISOString();
        }

        activity = [
          {
            registration_id: record.registration_id,
            full_name: record.full_name,
            action,
            at: new Date(),
          },
          ...activity,
        ].slice(0, 8);

        toast.success(toastTitle, { description: toastDescription });
        console.info(`[${verb}] ${record.registration_id} (${previousStatus} → ${action})`);
        clearSelection();
        resolve();
      }, 650);
    });
  }

  let busyAction = $state<ActivityEntry['action'] | null>(null);

  function handleCheckIn() {
    if (!selected) return;
    busyAction = 'CHECKED_IN';
    persistAction(
      'CHECKED_IN',
      'check-in',
      'Visitor checked in',
      `${selected.full_name} has been welcomed to Teachers' Day 2026.`,
    ).finally(() => (busyAction = null));
  }

  function handleRefuseEntry() {
    if (!selected) return;
    busyAction = 'REFUSED';
    persistAction(
      'REFUSED',
      'refuse-entry',
      'Entry refused',
      `${selected.full_name} was turned away. Please direct them off-site.`,
    ).finally(() => (busyAction = null));
  }

  function handleConflict() {
    if (!selected) return;
    busyAction = 'CONFLICT';
    persistAction(
      'CONFLICT',
      'handover',
      'Handed over to Conflict Resolution',
      `${selected.full_name} has been routed to the Resolution Station.`,
    ).finally(() => (busyAction = null));
  }

  // --- Derived helpers ----------------------------------------------------
  const totalRegistered = mockRegistrations.length;
  const totalCheckedIn = mockRegistrations.filter((r) => r.status === 'CHECKED_IN').length;

  const visitingTeacherCount = $derived(selected?.visiting_teachers.length ?? 0);

  const statusMeta: Record<
    RegistrationStatus,
    { label: string; class: string; icon: typeof UserIcon }
  > = {
    REGISTERED: {
      label: 'Registered',
      class: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/25',
      icon: IdBadge2Icon,
    },
    CHECKED_IN: {
      label: 'Checked In',
      class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25',
      icon: CircleCheckFilledIcon,
    },
    REFUSED: {
      label: 'Entry Refused',
      class: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/25',
      icon: BanIcon,
    },
    CONFLICT: {
      label: 'Needs Resolution',
      class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25',
      icon: InfoCircleIcon,
    },
    REJECTED: {
      label: 'Rejected',
      class: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/25',
      icon: BanIcon,
    },
  };

  function formatTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  function relativeTime(date: Date): string {
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    return `${hours}h ago`;
  }
</script>

<svelte:head>
  <title>Reception Station | RIVA Internal Systems</title>
</svelte:head>

<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
  <!-- Hero / intro -->
  <section class="px-4 lg:px-6">
    <div
      class="relative overflow-hidden rounded-4xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground shadow-lg md:p-8">
      <div
        class="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true">
      </div>
      <div
        class="pointer-events-none absolute -bottom-24 right-24 size-72 rounded-full bg-white/5 blur-3xl"
        aria-hidden="true">
      </div>

      <div class="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col gap-3">
          <Badge
            variant="secondary"
            class="w-fit gap-1.5 bg-white/15 text-primary-foreground hover:bg-white/20">
            <SparklesIcon class="size-3.5" />
            Teachers' Day 2026
          </Badge>
          <h1 class="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Reception Check-In Station
          </h1>
          <p class="max-w-xl text-sm text-primary-foreground/80">
            Search for a registered alumni visitor by name, registration ID, or contact number,
            verify their details, then complete check-in.
          </p>
        </div>

        <!-- Live stats -->
        <div class="flex shrink-0 gap-3">
          <div class="rounded-3xl bg-white/10 px-5 py-3 backdrop-blur-sm">
            <div class="font-heading text-2xl font-semibold tabular-nums">
              {totalCheckedIn}
              <span class="text-primary-foreground/60">/{totalRegistered}</span>
            </div>
            <div class="text-xs text-primary-foreground/70">Checked in</div>
          </div>
          <div class="rounded-3xl bg-white/10 px-5 py-3 backdrop-blur-sm">
            <div class="font-heading text-2xl font-semibold tabular-nums">
              {totalRegistered - totalCheckedIn}
            </div>
            <div class="text-xs text-primary-foreground/70">Awaiting</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Main two-pane workspace -->
  <section class="grid grid-cols-1 gap-4 px-4 lg:grid-cols-5 lg:gap-6 lg:px-6">
    <!-- LEFT: search + results -->
    <div class="flex flex-col gap-4 lg:col-span-2">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <span
              class="flex size-7 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SearchIcon class="size-4" />
            </span>
            Find a visitor
          </Card.Title>
          <Card.Description>
            Start typing to search. Press a result to open their record.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Field>
            <FieldLabel for="reception-search">
              <FieldTitle>Search</FieldTitle>
            </FieldLabel>
            <FieldContent>
              <div class="relative">
                <SearchIcon
                  class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reception-search"
                  type="text"
                  bind:value={query}
                  placeholder="Name, ID, or contact"
                  autocomplete="off"
                  class="rounded-3xl pl-9" />
              </div>
              <FieldDescription>
                {#if query}
                  {results.length}
                  {results.length === 1 ? 'match' : 'matches'}
                  for "{query}"
                {:else}
                  Try "Aishah", "TDY26-0001", or a contact number.
                {/if}
              </FieldDescription>
            </FieldContent>
          </Field>
        </Card.Content>
      </Card.Root>

      <!-- Results -->
      <Card.Root class="flex-1">
        <Card.Header>
          <Card.Title>Search results</Card.Title>
        </Card.Header>
        <Card.Content class="flex flex-col gap-2">
          {#if query && results.length === 0}
            <div
              class="flex flex-col items-center gap-2 rounded-3xl border border-dashed py-10 text-center">
              <SearchIcon class="size-6 text-muted-foreground" />
              <p class="text-sm font-medium">No visitors found</p>
              <p class="max-w-xs text-xs text-muted-foreground">
                Check the spelling, or send the visitor to the Conflict Resolution station for
                manual lookup.
              </p>
            </div>
          {:else if !query}
            <div
              class="flex flex-col items-center gap-2 rounded-3xl border border-dashed py-10 text-center">
              <QrcodeIcon class="size-6 text-muted-foreground" />
              <p class="text-sm font-medium">Awaiting search</p>
              <p class="max-w-xs text-xs text-muted-foreground">
                Results will appear here as you type in the search box above.
              </p>
            </div>
          {:else}
            {#each results as record (record.registration_id)}
              {@const meta = statusMeta[record.status]}
              <button
                type="button"
                onclick={() => selectVisitor(record)}
                class="group flex w-full items-center gap-3 rounded-3xl border border-transparent bg-muted/30 p-3 text-left transition-colors hover:border-border hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none">
                <span
                  class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-heading text-sm font-semibold uppercase text-primary">
                  {record.full_name.charAt(0)}
                </span>
                <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span class="truncate text-sm font-medium">{record.full_name}</span>
                  <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span class="font-mono">{record.registration_id}</span>
                    <span aria-hidden="true">·</span>
                    <span>Class of {record.graduating_year}</span>
                  </span>
                </span>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium {meta.class}">
                  {meta.label}
                </span>
                <ArrowRightIcon
                  class="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            {/each}
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <!-- RIGHT: visitor detail + actions -->
    <div class="lg:col-span-3">
      {#if selected}
        {@const meta = statusMeta[selected.status]}
        <Card.Root class="ring-primary/20">
          <!-- Detail header -->
          <Card.Header class="border-b">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-4">
                <span
                  class="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-primary/10 font-heading text-xl font-semibold uppercase text-primary">
                  {selected.full_name.charAt(0)}
                </span>
                <div class="flex flex-col gap-1">
                  <Card.Title class="text-lg tracking-tight md:text-xl">
                    {selected.full_name}
                  </Card.Title>
                  <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span class="inline-flex items-center gap-1 font-mono">
                      <IdBadge2Icon class="size-3.5" />
                      {selected.registration_id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span class="inline-flex items-center gap-1">
                      <CalendarStarIcon class="size-3.5" />
                      Class of {selected.graduating_year}
                      {selected.graduating_class}
                    </span>
                  </div>
                </div>
              </div>
              <span
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {meta.class}">
                <meta.icon class="size-3.5" />
                {meta.label}
              </span>
            </div>
          </Card.Header>

          <!-- Detail grid -->
          <Card.Content>
            <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-1">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <PhoneIcon class="size-3.5" /> Contact number
                </dt>
                <dd class="text-sm font-medium tabular-nums">{selected.contact_number}</dd>
              </div>

              <div class="flex flex-col gap-1">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <UserIcon class="size-3.5" /> Gender
                </dt>
                <dd class="text-sm font-medium">{selected.gender}</dd>
              </div>

              <div class="flex flex-col gap-1">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <SchoolIcon class="size-3.5" /> Current institution
                </dt>
                <dd class="text-sm font-medium">{selected.current_institution}</dd>
              </div>

              <div class="flex flex-col gap-1">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <BuildingBankIcon class="size-3.5" /> Ex-Riverlite
                </dt>
                <dd class="text-sm font-medium">
                  {#if selected.is_ex_riverlite}
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
                  <span>{visitingTeacherCount} teacher{visitingTeacherCount === 1 ? '' : 's'}</span>
                  {#if selected.visiting_teachers.length > 0}
                    <span class="text-xs font-normal text-muted-foreground">
                      {selected.visiting_teachers.join(', ')}
                    </span>
                  {/if}
                </dd>
              </div>

              <div class="flex flex-col gap-1">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <CalendarIcon class="size-3.5" /> Arrived at
                </dt>
                <dd class="text-sm font-medium tabular-nums">
                  {formatTime(selected.arrived_at)}
                </dd>
              </div>
            </dl>

            {#if selected.comments}
              <Separator class="my-4" />
              <div class="flex flex-col gap-2">
                <dt
                  class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <InfoCircleIcon class="size-3.5" /> Notes
                </dt>
                <p
                  class="rounded-3xl bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
                  {selected.comments}
                </p>
              </div>
            {/if}
          </Card.Content>

          <!-- Action footer -->
          <Card.Footer
            class="flex-col gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              onclick={clearSelection}
              disabled={busyAction !== null}>
              Cancel
            </Button>
            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onclick={handleConflict}
                disabled={busyAction !== null}
                class="gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-400">
                {#if busyAction === 'CONFLICT'}
                  <Loader2Icon class="size-4 animate-spin" />
                {/if}
                Conflict Resolution
              </Button>
              <Button
                variant="outline"
                onclick={handleRefuseEntry}
                disabled={busyAction !== null}
                class="gap-1.5 border-red-500/40 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400">
                {#if busyAction === 'REFUSED'}
                  <Loader2Icon class="size-4 animate-spin" />
                {:else}
                  <BanIcon class="size-4" />
                {/if}
                Refuse Entry
              </Button>
              <Button
                onclick={handleCheckIn}
                disabled={busyAction !== null}
                class="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90">
                {#if busyAction === 'CHECKED_IN'}
                  <Loader2Icon class="size-4 animate-spin" />
                {:else}
                  <DoorExitIcon class="size-4" />
                {/if}
                Check In
              </Button>
            </div>
          </Card.Footer>
        </Card.Root>
      {:else}
        <!-- Empty state -->
        <Card.Root class="flex h-full flex-col items-center justify-center py-16 text-center">
          <div
            class="mb-4 flex size-16 items-center justify-center rounded-4xl bg-primary/10 text-primary">
            <UsersIcon class="size-8" />
          </div>
          <Card.Title class="text-lg">No visitor selected</Card.Title>
          <Card.Description class="max-w-sm">
            Search for an alumni visitor on the left and select a result to review their
            registration and complete check-in here.
          </Card.Description>
        </Card.Root>
      {/if}
    </div>
  </section>

  <!-- Recent activity -->
  <section class="px-4 lg:px-6">
    <Card.Root size="sm">
      <Card.Header>
        <Card.Title>Recent activity</Card.Title>
        <Card.Description>
          Your check-in actions this session, signed in as {operatorName}.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if activity.length === 0}
          <p class="py-6 text-center text-sm text-muted-foreground">
            No actions yet — completed check-ins and handovers will show here.
          </p>
        {:else}
          <ol class="flex flex-col divide-y">
            {#each activity as entry (entry.registration_id + entry.at.getTime())}
              {@const meta = statusMeta[entry.action]}
              <li class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span
                  class="flex size-7 shrink-0 items-center justify-center rounded-2xl {meta.class}">
                  <meta.icon class="size-3.5" />
                </span>
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="truncate text-sm font-medium">{entry.full_name}</span>
                  <span class="font-mono text-xs text-muted-foreground">
                    {entry.registration_id}
                  </span>
                </div>
                <span
                  class="text-xs font-medium {meta.class.includes('emerald')
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : meta.class.includes('amber')
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'}">
                  {meta.label}
                </span>
                <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {relativeTime(entry.at)}
                </span>
              </li>
            {/each}
          </ol>
        {/if}
      </Card.Content>
    </Card.Root>
  </section>
</div>
