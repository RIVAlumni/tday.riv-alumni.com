<script lang="ts">
  import { page } from '$app/state';
  import { browser } from '$app/env';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';

  import { statusMeta } from '$lib/data/reception';
  import {
    deleteRegistration,
    fetchRegistration,
    resendRegistrationEmail,
    updateRegistrationFields,
  } from '$lib/firebase';
  import {
    is2024,
    is2025,
    is2026,
    type Registration,
    type Registration2026,
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

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Item from '$lib/components/ui/item/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';

  import {
    ArrowLeft01Icon,
    CheckIcon,
    Delete01Icon,
    Mail01Icon,
    PencilEdit01Icon,
    UserIcon,
  } from '$lib/icons';
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

  const id = $derived(page.params.registration_id ?? '');

  // Pull-only: a single server read. The form is rebuilt from the
  // server-confirmed record after every save, so nothing is held optimistically.
  let record = $state<Registration | null>(null);
  let loading = $state(false);
  let saving = $state(false);
  let emailSending = $state(false);
  let deleting = $state(false);

  const meta = $derived(record ? statusMeta[record.status] : null);
  const canEdit = $derived(
    userStore.state !== null &&
      userStore.state !== undefined &&
      isAuthorized(userStore.state, AccessLevel.Mediator),
  );
  const canDelete = $derived(
    userStore.state !== null &&
      userStore.state !== undefined &&
      isAuthorized(userStore.state, AccessLevel.Administrator),
  );
  const visitingTeachers = $derived(
    record
      ? visitingTeachersFor(record)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
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
  let email = $state('');
  let fullName = $state('');
  let contactNumber = $state('');
  let graduatingYear = $state('');
  let comments = $state('');

  $effect(() => {
    if (record) {
      email = is2026(record) ? record.email : '';
      fullName = record.full_name;
      contactNumber = String(record.contact_number);
      graduatingYear = String(record.graduating_year);
      comments = record.comments;
    }
  });

  let dirty = $derived(
    record &&
      (fullName !== record.full_name ||
        contactNumber !== String(record.contact_number) ||
        graduatingYear !== String(record.graduating_year) ||
        (is2026(record) && email !== record.email) ||
        comments !== record.comments),
  );

  // Field shapes differ by event year (2025 stores numbers, 2024/2026 strings).
  // visiting_teachers is not editable per firestore rules; email exists on 2026 only.
  function buildPatch(): Record<string, unknown> | null {
    if (!record) return null;
    const patch: Record<string, unknown> = { full_name: fullName, comments };
    if (is2025(record)) {
      patch.contact_number = Number(contactNumber);
      patch.graduating_year = Number(graduatingYear);
    } else {
      patch.contact_number = contactNumber;
      patch.graduating_year = graduatingYear;
      if (is2026(record)) patch.email = email;
    }
    return patch;
  }

  async function refreshFromServer() {
    if (!id) return;
    const fresh = await fetchRegistration(eventStore.activeEventId, id).catch(() => null);
    if (fresh !== null) record = fresh;
  }

  async function resendEmail() {
    if (!record || !is2026(record) || emailSending) return;
    emailSending = true;
    try {
      await resendRegistrationEmail(eventStore.activeEventId, record.registration_id);
      toast.success('Email resent to ' + record.email);
    } catch (err) {
      toast.error('Failed to resend email', { description: (err as Error).message });
    } finally {
      emailSending = false;
    }
  }

  async function deleteRecord() {
    if (!record || deleting) return;
    if (!canDelete) {
      toast.error('Only administrators can delete registrations');
      return;
    }
    if (!window.confirm(`Delete ${record.full_name}'s registration? This cannot be undone.`)) {
      return;
    }
    deleting = true;
    try {
      await deleteRegistration(eventStore.activeEventId, String(record.registration_id));
      toast.success('Registration deleted');
      await goto(`/workflow/records${page.url.search}`);
    } catch (err) {
      toast.error('Delete failed', { description: (err as Error).message });
    } finally {
      deleting = false;
    }
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

<div class="grid grid-cols-1 gap-4 p-4 lg:p-6 @xl/main:grid-cols-3 @4xl/main:grid-cols-6">
  <Button
    variant="link"
    href={`/workflow/records${page.url.search}`}
    class={cn('@xl/main:col-span-3 @4xl/main:col-span-6', 'text-muted-foreground w-fit px-0')}>
    <ArrowLeft01Icon />
    Back to registrations
  </Button>

  {#if !loading && !record}
    abc
  {:else if record}
    <!-- Registrant Header -->
    <Card.Root class={cn('@4xl/main:col-span-4')}>
      <Card.Content>
        <Item.Root
          variant="default"
          class="p-0 m-0">
          <Item.Media>
            <Avatar.Root class="size-10">
              {#if loading}
                <Skeleton class="h-10 w-10 rounded-full" />
              {:else}
                <Avatar.Image src={is2026(record) ? record.photo_url : ''} />
                <Avatar.Fallback>{record.full_name.charAt(0)}</Avatar.Fallback>
              {/if}
            </Avatar.Root>
          </Item.Media>

          <Item.Content>
            {#if loading}
              <Skeleton class="h-5 w-32" />
              <Skeleton class="h-5 w-60" />
            {:else}
              <Item.Title>{record.full_name}</Item.Title>
              <Item.Description>
                {is2026(record) ? record.email : record.graduating_year}
              </Item.Description>
            {/if}
          </Item.Content>

          <Item.Content>
            {#if loading}
              <Skeleton class="h-5 w-20" />
            {:else}
              <Badge>{record.status}</Badge>
            {/if}
          </Item.Content>
        </Item.Root>
      </Card.Content>
    </Card.Root>

    <!-- Registrant QR Code -->
    <Card.Root class={cn('@4xl/main:col-span-2 @4xl/main:row-span-2')}>
      <Card.Content class="flex flex-col items-center gap-4">
        {#if loading}
          <Skeleton class="w-full aspect-square rounded-2xl" />
        {:else}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(record.registration_id)}&qzone=4&format=png`}
            alt={`${record.registration_id || 'QR Code'}`}
            class="w-full rounded-2xl object-cover aspect-square"
            referrerpolicy="no-referrer" />
          <span class="text-muted-foreground text-sm font-mono">{record.registration_id}</span>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Registrant Editable Fields -->
    <Card.Root class={cn('@4xl/main:col-span-4')}>
      <Card.Header>
        <Card.Title>Edit Information</Card.Title>
        <Card.Description>All data updates are recorded and audited.</Card.Description>
      </Card.Header>

      <Card.Content>
        <Field.FieldGroup>
          <Field.Field>
            <Field.FieldLabel for="em">Email Address</Field.FieldLabel>
            {#if loading}
              <Skeleton class="h-9 w-full" />
            {:else}
              <Input
                id="em"
                bind:value={email} />
            {/if}
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="fn">Full Name</Field.FieldLabel>
            {#if loading}
              <Skeleton class="h-9 w-full" />
            {:else}
              <Input
                id="fn"
                bind:value={fullName} />
            {/if}
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="cn">Contact Number</Field.FieldLabel>
            {#if loading}
              <Skeleton class="h-9 w-full" />
            {:else}
              <Input
                id="cn"
                bind:value={contactNumber} />
            {/if}
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="gy">Graduating Year</Field.FieldLabel>
            {#if loading}
              <Skeleton class="h-9 w-full" />
            {:else}
              <Input
                id="gy"
                bind:value={graduatingYear} />
            {/if}
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="cm">Comments</Field.FieldLabel>
            {#if loading}
              <Skeleton class="h-24 w-full" />
            {:else}
              <Textarea
                id="cm"
                bind:value={comments}
                placeholder="Internal notes about this registrant..."
                class="min-h-24" />
            {/if}
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

    <!-- Registrant Uneditable Fields -->
    <Card.Root class={cn('@4xl/main:col-span-2')}>
      <Card.Header>
        <Card.Title>Read-only Information</Card.Title>
        <Card.Description>These fields cannot be edited.</Card.Description>
      </Card.Header>

      <Card.Content>
        <Field.FieldGroup>
          <Field.Field>
            <Field.FieldLabel>Registration ID</Field.FieldLabel>

            <Item.Root variant="outline">
              <Item.Content>
                <Item.Description>{record.registration_id}</Item.Description>
              </Item.Content>
            </Item.Root>
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel>Visiting Teachers</Field.FieldLabel>
            {#each visitingTeachers as teacher (teacher)}
              <Item.Root variant="outline">
                <Item.Media variant="icon">
                  <UserIcon />
                </Item.Media>

                <Item.Content>
                  <Item.Description>{teacher}</Item.Description>
                </Item.Content>
              </Item.Root>
            {/each}
          </Field.Field>
          {#if is2026(record) && record.written_messages.length > 0}
            <Field.Field>
              <Field.FieldLabel>Messages Written For</Field.FieldLabel>
              {#each record.written_messages as message}
                <Item.Root variant="outline">
                  <Item.Media variant="icon">
                    <UserIcon />
                  </Item.Media>

                  <Item.Content>
                    <Item.Description>{message.teacher_name}</Item.Description>
                  </Item.Content>
                </Item.Root>
              {/each}
            </Field.Field>
          {/if}
          <Field.Field>
            <Field.FieldLabel>Arrived On</Field.FieldLabel>

            <Item.Root variant="outline">
              <Item.Content>
                <Item.Description>{formatDate(arrivedAtFor(record))}</Item.Description>
              </Item.Content>
            </Item.Root>
          </Field.Field>
        </Field.FieldGroup>
      </Card.Content>
    </Card.Root>

    <Card.Root class={cn('@4xl/main:col-span-2')}>
      <Card.Header>
        <Card.Title>Available Actions</Card.Title>
      </Card.Header>

      <Card.Content>
        <Item.Group>
          <Item.Root>
            <Item.Content class="gap-1">
              <Item.Title>Resend email</Item.Title>
              <Item.Description>Send the registration email again.</Item.Description>
            </Item.Content>
            <Item.Actions>
              <Button
                variant="ghost"
                size="icon"
                class="rounded-full"
                disabled={emailSending || !is2026(record)}
                onclick={resendEmail}>
                <Mail01Icon />
              </Button>
            </Item.Actions>
          </Item.Root>
          <Item.Separator />
          <Item.Root>
            <Item.Content class="gap-1">
              <Item.Title>Delete Record</Item.Title>
              <Item.Description>Delete this registration record.</Item.Description>
            </Item.Content>
            <Item.Actions>
              <Button
                variant="ghost"
                size="icon"
                class="rounded-full"
                disabled={deleting || !canDelete}
                onclick={deleteRecord}>
                <Delete01Icon />
              </Button>
            </Item.Actions>
          </Item.Root>
        </Item.Group>
      </Card.Content>
    </Card.Root>

    {#if is2026(record)}
      <Card.Root class={cn('@4xl/main:col-span-2')}>
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
                      <span class="text-sm font-semibold">{updateMeta[update.action].label}</span>
                      <span class="text-muted-foreground text-xs font-mono tabular-nums"
                        >{formatDate(update.at)}</span>
                    </div>
                    <p class="text-muted-foreground text-sm">
                      {#if actorName && actorEmail}
                        {actorName} ({actorEmail})
                      {:else if actorName}
                        {actorName}
                      {:else if actorEmail}
                        {actorEmail}
                      {:else}
                        Unknown
                      {/if}
                    </p>
                    {#if update.details.trim()}
                      <p class="text-muted-foreground text-sm">{update.details}</p>
                    {/if}
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
