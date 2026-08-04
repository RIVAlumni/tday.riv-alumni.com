<script lang="ts">
  import { page } from '$app/state';
  import { browser } from '$app/env';
  import { toast } from 'svelte-sonner';

  import { statusMeta } from '$lib/data/reception';
  import { fetchRegistration, updateRegistrationFields } from '$lib/firebase';
  import {
    is2024,
    is2025,
    is2026,
    type Registration,
    type RegistrationUpdate,
    type RegistrationUpdateAction,
  } from '$lib/models/registration';
  import { AccessLevel } from '$lib/models/user';
  import { eventStore } from '$lib/stores/event.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import { arrivedAtFor, visitingTeachersFor } from '$lib/util/registration';
  import { isAuthorized } from '$lib/util/user';
  import { cn } from '$lib/utils';
  import type { Component } from 'svelte';
  import { Timestamp } from 'firebase/firestore';
  import { setPageTitle } from '$lib/data/page-title.svelte.js';

  import * as Card from '$lib/components/ui/card/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';

  import { ArrowLeft01Icon, CheckIcon, PencilEdit01Icon, UserIcon } from '$lib/icons';

  const id = $derived(page.params.registration_id ?? '');

  // Pull-only: a single server read. The form is rebuilt from the
  // server-confirmed record after every save, so nothing is held optimistically.
  let record = $state<Registration | null>(null);
  let loading = $state(false);
  let saving = $state(false);

  const meta = $derived(record ? statusMeta[record.status] : null);
  const canEdit = $derived(
    userStore.state !== null &&
      userStore.state !== undefined &&
      isAuthorized(userStore.state, AccessLevel.Mediator),
  );

  $effect(() => {
    setPageTitle(record ? `Editing ${record.full_name}` : null);
    return () => setPageTitle(null);
  });

  $effect(() => {
    const regId = id;
    const eventId = eventStore.activeEventId;
    if (!browser || !regId) {
      record = null;
      return;
    }
    let cancelled = false;
    loading = true;
    fetchRegistration(eventId, regId)
      .then((r) => {
        if (!cancelled) record = r;
      })
      .catch(() => {
        if (!cancelled) record = null;
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });
    return () => {
      cancelled = true;
    };
  });

  // --- Edit form state ---
  let fullName = $state('');
  let contactNumber = $state('');
  let graduatingYear = $state('');
  let teachersInput = $state('');
  let comments = $state('');

  $effect(() => {
    if (record) {
      fullName = record.full_name;
      contactNumber = String(record.contact_number);
      graduatingYear = String(record.graduating_year);
      teachersInput = visitingTeachersFor(record);
      comments = record.comments;
    }
  });

  let dirty = $derived(
    record &&
      (fullName !== record.full_name ||
        contactNumber !== String(record.contact_number) ||
        graduatingYear !== String(record.graduating_year) ||
        teachersInput !== visitingTeachersFor(record) ||
        comments !== record.comments),
  );

  // Field shapes differ by event year (2025 stores numbers, 2024/2026 strings;
  // visiting_teachers is a string for 2024/2025 and an array for 2026). Build
  // a patch that matches the stored shape so the write validates cleanly.
  function buildPatch(): Record<string, unknown> | null {
    if (!record) return null;
    const teachers = teachersInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const patch: Record<string, unknown> = { full_name: fullName, comments };
    if (is2025(record)) {
      patch.contact_number = Number(contactNumber);
      patch.graduating_year = Number(graduatingYear);
      patch.visiting_teachers = teachers.join(', ');
    } else if (is2026(record)) {
      patch.contact_number = contactNumber;
      patch.graduating_year = graduatingYear;
      patch.visiting_teachers = teachers;
    } else {
      // 2024
      patch.contact_number = contactNumber;
      patch.graduating_year = graduatingYear;
      patch.visiting_teachers = teachers.join(', ');
    }
    return patch;
  }

  async function refreshFromServer() {
    if (!id) return;
    const fresh = await fetchRegistration(eventStore.activeEventId, id).catch(() => null);
    if (fresh !== null) record = fresh;
  }

  async function save() {
    if (!record || !dirty || saving) return;
    if (!canEdit) {
      toast.error('Insufficient permissions');
      return;
    }
    const patch = buildPatch();
    if (!patch) return;

    saving = true;
    try {
      await updateRegistrationFields(
        eventStore.activeEventId,
        String(record.registration_id),
        patch,
      );
      await refreshFromServer();
      toast.success('Details saved');
    } catch (err) {
      // revert to the server-confirmed state on failure
      await refreshFromServer();
      toast.error('Save failed', { description: (err as Error).message });
    } finally {
      saving = false;
    }
  }

  function formatDate(iso: Timestamp | string | null): string {
    if (!iso) return '-';
    const d = iso instanceof Timestamp ? iso.toDate() : new Date(iso);
    return d.toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  const updateTone: Record<RegistrationUpdateAction, string> = {
    REGISTERED: 'border-sky-500/30 bg-sky-500/10 text-sky-500',
    CHECKED_IN: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    CONFLICT: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
    REJECTED: 'border-red-500/30 bg-red-500/10 text-red-500',
    UPDATED: 'border-slate-500/30 bg-slate-500/10 text-slate-500',
  };

  const updateMeta: Record<RegistrationUpdateAction, { label: string; icon: Component }> = {
    REGISTERED: { label: statusMeta.REGISTERED.label, icon: statusMeta.REGISTERED.icon },
    CHECKED_IN: { label: statusMeta.CHECKED_IN.label, icon: statusMeta.CHECKED_IN.icon },
    CONFLICT: { label: statusMeta.CONFLICT.label, icon: statusMeta.CONFLICT.icon },
    REJECTED: { label: statusMeta.REJECTED.label, icon: statusMeta.REJECTED.icon },
    UPDATED: { label: 'Details updated', icon: PencilEdit01Icon },
  };

  // pre-nested entries stored the actor as a bare uid string
  function updateActorName(update: RegistrationUpdate): string {
    const by = update.by;
    return typeof by === 'object' ? by.name || by.email : by;
  }

  function updateActorEmail(update: RegistrationUpdate): string {
    const by = update.by;
    return typeof by === 'object' ? by.email : '';
  }
</script>

<div class="@container/main flex flex-col gap-6 p-4 lg:p-6">
  <Button
    variant="link"
    class="text-muted-foreground hover:text-foreground w-fit px-0"
    href="/workflow/records">
    <ArrowLeft01Icon />
    Back to Registrations
  </Button>

  {#if !record && !loading}
    <Card.Root>
      <Card.Content class="flex flex-col items-center gap-4 py-16">
        <div
          class="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-4xl">
          <UserIcon class="size-8" />
        </div>
        <div class="flex flex-col items-center gap-1 text-center">
          <Card.Title>Record not found</Card.Title>
          <Card.Description>No registration matches "{id}".</Card.Description>
        </div>
        <Button href="/workflow/records">Return to list</Button>
      </Card.Content>
    </Card.Root>
  {:else if loading}
    <Card.Root>
      <Card.Content class="flex flex-col items-center gap-4 py-16">
        <div class="text-muted-foreground text-sm">Loading...</div>
      </Card.Content>
    </Card.Root>
  {:else if record}
    <!-- Identity -->
    <Card.Root>
      <Card.Content class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          <span
            class="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold uppercase">
            {record.full_name.charAt(0)}
          </span>
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl font-semibold tracking-tight">{record.full_name}</h1>
            <p class="text-muted-foreground font-mono text-sm">
              {record.registration_id}
              <span
                class="mx-1.5"
                aria-hidden="true">-</span>
              Class of {record.graduating_year}
            </p>
          </div>
        </div>
        {#if meta}
          <Badge
            variant="secondary"
            class={meta.badge}>
            {meta.label}
          </Badge>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Edit -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Edit</Card.Title>
        <Card.Description>Update the registrant's details below.</Card.Description>
      </Card.Header>
      <Card.Content>
        <Field.FieldGroup>
          <Field.Field>
            <Field.FieldLabel for="fn">Full Name</Field.FieldLabel>
            <Input
              id="fn"
              bind:value={fullName} />
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="cn">Contact Number</Field.FieldLabel>
            <Input
              id="cn"
              bind:value={contactNumber} />
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="gy">Graduating Year</Field.FieldLabel>
            <Input
              id="gy"
              bind:value={graduatingYear} />
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="vt">Which Teacher(s) would you like to meet</Field.FieldLabel>
            <Input
              id="vt"
              bind:value={teachersInput}
              placeholder="e.g. Mdm Siti Khadijah, Mr Tan Wei Ming" />
            <Field.FieldDescription>Separate names with commas.</Field.FieldDescription>
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="cm">Comments</Field.FieldLabel>
            <Textarea
              id="cm"
              bind:value={comments}
              placeholder="Internal notes about this registrant..."
              class="min-h-24" />
            <Field.FieldDescription>Visible only to your team.</Field.FieldDescription>
          </Field.Field>
        </Field.FieldGroup>
      </Card.Content>
      <Card.Footer>
        <Button
          onclick={save}
          disabled={!dirty || saving}>
          <CheckIcon />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card.Footer>
    </Card.Root>

    <!-- Read-only details -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Details</Card.Title>
        <Card.Description>Read-only registration data.</Card.Description>
      </Card.Header>
      <Card.Content class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {#if is2024(record)}
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide"
              >NRIC</span>
            <span class="text-sm font-medium tabular-nums">{record.nric}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide"
              >Gender</span>
            <span class="text-sm font-medium">{record.gender === 'M' ? 'Male' : 'Female'}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide"
              >Graduating Class</span>
            <span class="text-sm font-medium">{record.graduating_class}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide"
              >Institution</span>
            <span class="text-sm font-medium">{record.current_institution || '-'}</span>
          </div>
        {/if}
        {#if is2025(record)}
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide"
              >Ex-Riverlite</span>
            <span class="text-sm font-medium">
              {#if record.is_ex_riverlite === 'Yes'}
                <Badge variant="secondary">Yes</Badge>
              {:else}
                No
              {/if}
            </span>
          </div>
        {/if}
        {#if arrivedAtFor(record) !== null}
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide"
              >Arrived</span>
            <span class="text-sm font-medium">{formatDate(arrivedAtFor(record))}</span>
          </div>
        {/if}
        {#if record.comments}
          <div class="flex flex-col gap-1 sm:col-span-2">
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide"
              >Comments</span>
            <span class="text-muted-foreground whitespace-pre-wrap text-sm">{record.comments}</span>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Audit trail -->
    {#if is2026(record)}
      <Card.Root>
        <Card.Header>
          <Card.Title>Audit Trail</Card.Title>
          <Card.Description>Status changes and who performed them.</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if record.updates.length === 0}
            <p class="text-muted-foreground text-sm">No activity recorded yet.</p>
          {:else}
            <ol class="relative space-y-4">
              <span
                aria-hidden="true"
                class="pointer-events-none absolute inset-s-3 top-2 bottom-2 w-px -translate-x-1/2 bg-border"
              ></span>
              {#each [...record.updates].reverse() as update, i (record.updates.length - 1 - i)}
                {@const actorName = updateActorName(update)}
                {@const actorEmail = updateActorEmail(update)}
                {@const Icon = updateMeta[update.action].icon}
                <li class="relative flex gap-3">
                  <span
                    class={cn(
                      'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border',
                      updateTone[update.action],
                    )}>
                    <Icon class="size-3.5" />
                  </span>
                  <div class="min-w-0 flex-1 pb-1">
                    <div class="flex flex-wrap items-baseline gap-x-2">
                      <span class="text-sm font-medium">{updateMeta[update.action].label}</span>
                      <span
                        class="text-muted-foreground text-xs"
                        title={actorEmail}>{actorName}</span>
                    </div>
                    {#if update.details}
                      <p class="text-muted-foreground mt-0.5 text-xs">{update.details}</p>
                    {/if}
                    <p class="text-muted-foreground/80 mt-0.5 text-[0.7rem]">
                      {formatDate(update.at)}
                    </p>
                  </div>
                </li>
              {/each}
            </ol>
          {/if}
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}
</div>
