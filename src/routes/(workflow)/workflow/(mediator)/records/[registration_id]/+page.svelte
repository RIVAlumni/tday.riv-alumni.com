<script lang="ts">
  import type { Component } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Timestamp } from 'firebase/firestore';

  import { browser } from '$app/env';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { setPageTitle } from '$lib/data/page-title.svelte.js';
  import { statusMeta } from '$lib/data/reception';
  import {
    deleteRegistration,
    fetchRegistration,
    resendRegistrationEmail,
    updateRegistrationFields,
  } from '$lib/firebase';
  import {
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

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import * as Item from '$lib/components/ui/item/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import * as Kbd from '$lib/components/ui/kbd/index.js';
  import * as Timeline from '$lib/components/ui/timeline/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { ScrollArea } from '$lib/components/ui/scroll-area';

  import {
    ArrowLeft01Icon,
    CheckIcon,
    Delete01Icon,
    HistoryIcon,
    Mail01Icon,
    PencilEdit01Icon,
    ScanIcon,
    Share01Icon,
    UnfoldMoreIcon,
    UserIcon,
  } from '$lib/icons';
  import SkeletonControl from './SkeletonControl.svelte';

  const id = $derived(page.params.registration_id ?? '');

  // Pull-only: a single server read. The form is rebuilt from the
  // server-confirmed record after every save, so nothing is held optimistically.
  let record = $state<Registration | null>(null);
  let loading = $state(false);
  let saving = $state(false);
  let emailSending = $state(false);
  let deleting = $state(false);
  let requestInfoOpen = $state(false);
  let incompleteName = $state(false);
  let incorrectYear = $state(false);

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

  const currentYear = new Date().getFullYear();
  const hasSelectedIssue = $derived(incompleteName || incorrectYear);

  function openRequestInfoDialog() {
    incompleteName = false;
    incorrectYear = false;
    requestInfoOpen = true;
  }

  // WhatsApp bold formatting uses *asterisks*; each checked issue becomes a numbered line.
  function requestMoreInfoBody(): string {
    if (!record) return '';
    const issues: string[] = [];
    if (incompleteName) {
      issues.push(
        '*Incomplete Full Name*. Please provide your full name as shown on your EZ-Link/NRIC/SingPass app.',
      );
    }
    if (incorrectYear) {
      issues.push(
        `*Incorrect Graduating Year*. The current year is ${currentYear} and you have indicated that your graduating year is ${record.graduating_year}. Is this information correct?`,
      );
    }
    const numbered = issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n');
    return [
      "*[RIVA] Teachers' Day Visitations: More Information Required*",
      '',
      `Hello ${record.full_name}!`,
      '',
      "Thank you for registering your Teachers' Day visit! Your registration has been flagged for manual review.",
      '',
      'As such, please provide more information or confirm the details on the following:',
      '',
      numbered,
      '',
      'Please reply us as soon as possible to complete your registration!',
      '',
      '— RIVA Community Outreach Team',
    ].join('\n');
  }

  function openWhatsApp() {
    if (!record || !hasSelectedIssue) return;
    const url = `https://api.whatsapp.com/send/?phone=65${String(record.contact_number)}&text=${encodeURIComponent(requestMoreInfoBody())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    requestInfoOpen = false;
  }

  function manualCheckInBody(): string {
    if (!record) return '';
    return [
      `Hello ${record.full_name}!`,
      '',
      'Welcome back to RIVPS! Please use the following code for manual check-in at our Reception Station at the Kindness Corner.',
      '',
      `Manual Check-in Code: *${record.registration_id}*`,
    ].join('\n');
  }

  function openManualCheckInWhatsApp() {
    if (!record) return;
    const url = `https://api.whatsapp.com/send/?phone=65${String(record.contact_number)}&text=${encodeURIComponent(manualCheckInBody())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
    REGISTERED: 'bg-secondary text-secondary-foreground',
    CHECKED_IN: 'bg-primary text-primary-foreground',
    CONFLICT: 'bg-warning text-foreground',
    REJECTED: 'bg-destructive text-background',
    UPDATED: 'bg-muted text-muted-foreground',
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

<div
  class="h-full grid grid-cols-1 items-start gap-4 p-4 lg:p-6 @xl/main:grid-cols-3 @4xl/main:grid-cols-6">
  <Button
    variant="link"
    href={`/workflow/records${page.url.search}`}
    class={cn('@xl/main:col-span-3 @4xl/main:col-span-6', 'text-muted-foreground w-fit px-0')}>
    <ArrowLeft01Icon />
    Back to registrations
  </Button>

  {#if !loading && !record}
    <div class="@xl/main:col-span-3 @4xl/main:col-span-6 flex flex-col">
      <Empty.Root>
        <Empty.Header>
          <Empty.Media variant="icon">
            <UserIcon />
          </Empty.Media>

          <Empty.Title>No record found</Empty.Title>
          <Empty.Description>
            We could not find record
            <Kbd.Root>{id}</Kbd.Root>
            from the system.
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
    </div>
  {:else if record}
    <ScrollArea
      orientation="both"
      class="@xl/main:col-span-3 @4xl/main:col-span-6">
      <div class="flex flex-col gap-4 @xl/main:w-max @xl/main:flex-row">
        <div class="w-full @xl/main:w-96 flex flex-col gap-4 shrink-0">
          <!-- Registrant Header -->
          <Card.Root>
            <Card.Content>
              <Item.Root
                variant="default"
                class="p-0 m-0">
                <Item.Media>
                  <Avatar.Root class="size-10">
                    <SkeletonControl
                      {loading}
                      class="h-10 w-10 rounded-full">
                      <Avatar.Image src={is2026(record) ? record.photo_url : ''} />
                      <Avatar.Fallback>{record.full_name.charAt(0)}</Avatar.Fallback>
                    </SkeletonControl>
                  </Avatar.Root>
                </Item.Media>

                <Item.Content>
                  <SkeletonControl
                    {loading}
                    class="h-5 w-32">
                    <Item.Title>{record.full_name}</Item.Title>
                  </SkeletonControl>
                  <SkeletonControl
                    {loading}
                    class="h-5 w-60">
                    <Item.Description>
                      {is2026(record) ? record.email : record.graduating_year}
                    </Item.Description>
                  </SkeletonControl>
                </Item.Content>

                <Item.Content>
                  <SkeletonControl
                    {loading}
                    class="h-5 w-20">
                    <Badge
                      variant="secondary"
                      class={meta?.badge}>
                      {meta?.label ?? record.status}
                    </Badge>
                  </SkeletonControl>
                </Item.Content>
              </Item.Root>
            </Card.Content>
          </Card.Root>

          <!-- Registrant Editable Fields -->
          <Card.Root>
            <Card.Header>
              <Card.Title>Edit Information</Card.Title>
              <Card.Description>All data updates are recorded and audited.</Card.Description>
            </Card.Header>

            <Card.Content>
              <Field.FieldGroup>
                <Field.Field>
                  <Field.FieldLabel for="em">Email Address</Field.FieldLabel>
                  <SkeletonControl
                    {loading}
                    class="h-9 w-full">
                    <Input
                      id="em"
                      bind:value={email} />
                  </SkeletonControl>
                </Field.Field>
                <Field.Field>
                  <Field.FieldLabel for="fn">Full Name</Field.FieldLabel>
                  <SkeletonControl
                    {loading}
                    class="h-9 w-full">
                    <Input
                      id="fn"
                      bind:value={fullName} />
                  </SkeletonControl>
                </Field.Field>
                <Field.Field>
                  <Field.FieldLabel for="cn">Contact Number</Field.FieldLabel>
                  <SkeletonControl
                    {loading}
                    class="h-9 w-full">
                    <Input
                      id="cn"
                      bind:value={contactNumber} />
                  </SkeletonControl>
                </Field.Field>
                <Field.Field>
                  <Field.FieldLabel for="gy">Graduating Year</Field.FieldLabel>
                  <SkeletonControl
                    {loading}
                    class="h-9 w-full">
                    <Input
                      id="gy"
                      bind:value={graduatingYear} />
                  </SkeletonControl>
                </Field.Field>
                <Field.Field>
                  <Field.FieldLabel for="cm">Comments</Field.FieldLabel>
                  <SkeletonControl
                    {loading}
                    class="h-24 w-full">
                    <Textarea
                      id="cm"
                      bind:value={comments}
                      placeholder="Internal notes about this registrant..."
                      class="min-h-24" />
                  </SkeletonControl>
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

          <Card.Root class="h-max">
            <Card.Header>
              <Card.Title>Available Actions</Card.Title>
            </Card.Header>

            <Card.Content>
              <Item.Group>
                <Item.Root
                  class="cursor-pointer hover:bg-muted disabled:pointer-events-none disabled:opacity-50">
                  {#snippet child({ props })}
                    {#if record && is2026(record)}
                      <button
                        type="button"
                        disabled={emailSending || !record}
                        onclick={resendEmail}
                        {...props}>
                        <Item.Content class="gap-1">
                          <Item.Title>Email the Event Ticket</Item.Title>
                          <Item.Description>
                            Resend the event ticket to {record.email}.
                          </Item.Description>
                        </Item.Content>
                        <Item.Actions>
                          <Mail01Icon class="size-4" />
                        </Item.Actions>
                      </button>
                    {:else}
                      <button
                        type="button"
                        disabled
                        {...props}>
                        <Item.Content class="gap-1">
                          <Item.Title>Email the Event Ticket</Item.Title>
                          <Item.Description
                            >Not available for this registration year</Item.Description>
                        </Item.Content>
                        <Item.Actions>
                          <Mail01Icon class="size-4" />
                        </Item.Actions>
                      </button>
                    {/if}
                  {/snippet}
                </Item.Root>
                <Item.Separator />
                <Item.Root
                  class="cursor-pointer hover:bg-muted disabled:pointer-events-none disabled:opacity-50">
                  {#snippet child({ props })}
                    <button
                      type="button"
                      onclick={openManualCheckInWhatsApp}
                      {...props}>
                      <Item.Content class="gap-1">
                        <Item.Title>Send Manual Check-in Code</Item.Title>
                        <Item.Description>
                          Send the manual check-in code to {record?.contact_number}.
                        </Item.Description>
                      </Item.Content>
                      <Item.Actions>
                        <ScanIcon class="size-4" />
                      </Item.Actions>
                    </button>
                  {/snippet}
                </Item.Root>
                <Item.Separator />
                <Item.Root
                  class="cursor-pointer hover:bg-muted disabled:pointer-events-none disabled:opacity-50">
                  {#snippet child({ props })}
                    <button
                      type="button"
                      onclick={openRequestInfoDialog}
                      {...props}>
                      <Item.Content class="gap-1">
                        <Item.Title>Request More Information</Item.Title>
                        <Item.Description>
                          Ask the registrant to clarify missing or incorrect details via WhatsApp.
                        </Item.Description>
                      </Item.Content>
                      <Item.Actions>
                        <Share01Icon class="size-4" />
                      </Item.Actions>
                    </button>
                  {/snippet}
                </Item.Root>
                <Item.Separator />
                <Item.Root
                  variant="destructive"
                  class="cursor-pointer disabled:pointer-events-none disabled:opacity-50">
                  {#snippet child({ props })}
                    <button
                      type="button"
                      disabled={deleting || !canDelete}
                      onclick={deleteRecord}
                      {...props}>
                      <Item.Content class="gap-1">
                        <Item.Title>Delete Record</Item.Title>
                        <Item.Description>Delete this registration record.</Item.Description>
                      </Item.Content>
                      <Item.Actions>
                        <Delete01Icon class="size-4" />
                      </Item.Actions>
                    </button>
                  {/snippet}
                </Item.Root>
              </Item.Group>
            </Card.Content>
          </Card.Root>
        </div>

        <div class="w-full @xl/main:w-96 flex flex-col gap-4 shrink-0">
          <!-- Registrant QR Code -->
          <Card.Root>
            <Card.Content class="flex flex-col items-center gap-4">
              <SkeletonControl
                {loading}
                class="w-full aspect-square rounded-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(record.registration_id)}&qzone=4&format=png`}
                  alt={`${record.registration_id || 'QR Code'}`}
                  class="w-60 rounded-2xl object-cover aspect-square"
                  referrerpolicy="no-referrer" />
                <span class="text-muted-foreground text-sm font-mono"
                  >{record.registration_id}</span>
              </SkeletonControl>
            </Card.Content>
          </Card.Root>

          <!-- Registrant Uneditable Fields -->
          <Card.Root class="grow">
            <Card.Header>
              <Card.Title>Read-only Information</Card.Title>
              <Card.Description>These fields cannot be edited.</Card.Description>
            </Card.Header>

            <Card.Content>
              <Field.FieldGroup>
                <Field.Field>
                  <Field.FieldLabel>Registration ID</Field.FieldLabel>

                  <SkeletonControl
                    {loading}
                    class="h-12 w-full">
                    <Item.Root variant="outline">
                      <Item.Content>
                        <Item.Description>{record.registration_id}</Item.Description>
                      </Item.Content>
                    </Item.Root>
                  </SkeletonControl>
                </Field.Field>
                <Field.Field>
                  <Field.FieldLabel>Visiting Teachers</Field.FieldLabel>

                  <SkeletonControl
                    {loading}
                    class="h-12 w-full">
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
                  </SkeletonControl>
                </Field.Field>
                {#if is2026(record) && record.written_messages.length > 0}
                  <Field.Field>
                    <Field.FieldLabel>Messages Written For</Field.FieldLabel>
                    <SkeletonControl
                      {loading}
                      class="h-12 w-full">
                      {#each record.written_messages as msg, i (i)}
                        <Item.Root variant="outline">
                          <Item.Media variant="icon">
                            <UserIcon />
                          </Item.Media>

                          <Item.Content>
                            <Item.Title>{msg.teacher_name}</Item.Title>
                            <Item.Description>{msg.message}</Item.Description>
                          </Item.Content>
                        </Item.Root>
                      {/each}
                    </SkeletonControl>
                  </Field.Field>
                {/if}
                <Field.Field>
                  <Field.FieldLabel>Arrived On</Field.FieldLabel>

                  <SkeletonControl
                    {loading}
                    class="h-12 w-full">
                    <Item.Root variant="outline">
                      <Item.Content>
                        <Item.Description>
                          {formatDate(arrivedAtFor(record))}
                        </Item.Description>
                      </Item.Content>
                    </Item.Root>
                  </SkeletonControl>
                </Field.Field>
              </Field.FieldGroup>
            </Card.Content>
          </Card.Root>
        </div>

        {#if is2026(record)}
          <div class="w-full @xl/main:w-96 flex flex-col gap-4 shrink-0">
            <Card.Root class="grow order-6">
              <Card.Header>
                <Card.Title>Audit Trail</Card.Title>
                <Card.Description>Status changes and who performed them.</Card.Description>
              </Card.Header>

              <Card.Content>
                {#if record.updates.length === 0}
                  <Empty.Root class="p-6">
                    <Empty.Header>
                      <Empty.Media variant="icon">
                        <HistoryIcon />
                      </Empty.Media>
                      <Empty.Title>No activity recorded</Empty.Title>
                      <Empty.Description>Status changes will appear here.</Empty.Description>
                    </Empty.Header>
                  </Empty.Root>
                {:else}
                  <Timeline.Root defaultValue={record.updates.length}>
                    {#each [...record.updates].reverse() as update, i (record.updates.length - 1 - i)}
                      {@const actorName = updateActorName(update)}
                      {@const actorEmail = updateActorEmail(update)}
                      {@const details = update.details.trim()}
                      {@const hasCollapsedDetails = update.action === 'UPDATED' && details !== ''}
                      {@const Icon = updateMeta[update.action].icon}
                      <Timeline.Item
                        step={record.updates.length - i}
                        class="group-data-[orientation=vertical]/timeline:ms-10">
                        <Collapsible.Root class="flex flex-col gap-0.5">
                          <Timeline.Header>
                            <Timeline.Separator
                              class="bg-input! group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                            <div class="flex flex-wrap items-center gap-2">
                              <Timeline.Title>{updateMeta[update.action].label}</Timeline.Title>
                              {#if hasCollapsedDetails}
                                <Collapsible.Trigger
                                  type="button"
                                  class={buttonVariants({ variant: 'ghost', size: 'xs' })}>
                                  View changes
                                  <UnfoldMoreIcon data-icon="inline-end" />
                                </Collapsible.Trigger>
                              {/if}
                            </div>
                            <Timeline.Indicator
                              class={cn(
                                'flex size-6 items-center justify-center border-none group-data-[orientation=vertical]/timeline:-left-7',
                                updateTone[update.action],
                              )}>
                              <Icon />
                            </Timeline.Indicator>
                          </Timeline.Header>
                          <Timeline.Content class="flex flex-col gap-1">
                            {#if hasCollapsedDetails}
                              <div class="flex flex-wrap items-center gap-2">
                                <span>{actorName || actorEmail || 'Unknown'}</span>
                                <span aria-hidden="true">&middot;</span>
                                <Timeline.Date class="mb-0">{formatDate(update.at)}</Timeline.Date>
                              </div>
                            {:else}
                              <div class="flex flex-col gap-0.5">
                                <div class="flex flex-wrap items-center gap-2">
                                  <span>{actorName || actorEmail || 'Unknown'}</span>
                                  {#if actorEmail && actorName !== actorEmail}
                                    <span aria-hidden="true">&middot;</span>
                                    <span>{actorEmail}</span>
                                  {/if}
                                </div>
                                <Timeline.Date class="mb-0">{formatDate(update.at)}</Timeline.Date>
                              </div>
                            {/if}
                            {#if hasCollapsedDetails}
                              <Collapsible.Content class="pt-2">
                                <Item.Group>
                                  {#if actorEmail && actorName !== actorEmail}
                                    <Item.Root
                                      variant="muted"
                                      size="xs">
                                      <Item.Content>
                                        <Item.Title>Operator email</Item.Title>
                                        <Item.Description class="line-clamp-none break-words">
                                          {actorEmail}
                                        </Item.Description>
                                      </Item.Content>
                                    </Item.Root>
                                  {/if}
                                  <Item.Root
                                    variant="muted"
                                    size="xs">
                                    <Item.Content>
                                      <Item.Title>Recorded changes</Item.Title>
                                      <Item.Description class="line-clamp-none break-words">
                                        {details}
                                      </Item.Description>
                                    </Item.Content>
                                  </Item.Root>
                                </Item.Group>
                              </Collapsible.Content>
                            {/if}
                            {#if !hasCollapsedDetails && details}
                              <p>{details}</p>
                            {/if}
                          </Timeline.Content>
                        </Collapsible.Root>
                      </Timeline.Item>
                    {/each}
                  </Timeline.Root>
                {/if}
              </Card.Content>
            </Card.Root>
          </div>
        {/if}
      </div>
    </ScrollArea>

    <Dialog.Root bind:open={requestInfoOpen}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Request More Information</Dialog.Title>
          <Dialog.Description>
            Select the details that are incorrect or incomplete. A WhatsApp message will be drafted
            to the registrant.
          </Dialog.Description>
        </Dialog.Header>

        <div class="flex flex-col gap-3">
          <Field.Field>
            <Field.FieldLabel
              for="issue-full-name"
              class="w-full cursor-pointer items-start gap-3 rounded-2xl border border-border p-4">
              <Checkbox
                id="issue-full-name"
                bind:checked={incompleteName}
                class="mt-0.5" />
              <span class="flex flex-col gap-1">
                <span class="font-semibold">Incomplete Full Name</span>
                <span class="text-muted-foreground">
                  Please provide your full name as shown on your EZ-Link/NRIC/SingPass app.
                </span>
              </span>
            </Field.FieldLabel>
          </Field.Field>

          <Field.Field>
            <Field.FieldLabel
              for="issue-graduating-year"
              class="w-full cursor-pointer items-start gap-3 rounded-2xl border border-border p-4">
              <Checkbox
                id="issue-graduating-year"
                bind:checked={incorrectYear}
                class="mt-0.5" />
              <span class="flex flex-col gap-1">
                <span class="font-semibold">Incorrect Graduating Year</span>
                <span class="text-muted-foreground">
                  The current year is {currentYear} and you have indicated that your graduating year is
                  {record.graduating_year}. Is this information correct?
                </span>
              </span>
            </Field.FieldLabel>
          </Field.Field>
        </div>

        <Dialog.Footer>
          <Dialog.Close>
            {#snippet child({ props })}
              <Button
                variant="outline"
                {...props}>
                Cancel
              </Button>
            {/snippet}
          </Dialog.Close>
          <Button
            disabled={!hasSelectedIssue}
            onclick={openWhatsApp}>
            <Share01Icon />
            Send via WhatsApp
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  {/if}
</div>
