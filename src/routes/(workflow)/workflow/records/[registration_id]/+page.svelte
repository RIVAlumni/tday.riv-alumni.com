<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';

  import { reception } from '../../reception/_shared/store.svelte';
  import { statusMeta } from '../../reception/_shared/models';
  import { setPageTitle } from '$lib/data/page-title.svelte.js';

  import * as Card from '$lib/components/ui/card/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';

  import {
    ArrowLeft01Icon,
    CheckIcon,
    UserIcon,
  } from '$lib/icons';

  onMount(() => reception.hydrate());

  const id = $derived(page.params.registration_id ?? '');
  const record = $derived(reception.registrations.find((r) => r.registration_id === id));
  const meta = $derived(record ? statusMeta[record.status] : null);

  $effect(() => {
    setPageTitle(record ? `Editing ${record.full_name}` : null);
    return () => setPageTitle(null);
  });

  // --- Edit form state ---
  let fullName = $state('');
  let contactNumber = $state('');
  let graduatingYear = $state('');
  let teachersInput = $state('');
  let comments = $state('');
  let saving = $state(false);

  $effect(() => {
    if (record) {
      fullName = record.full_name;
      contactNumber = record.contact_number;
      graduatingYear = record.graduating_year;
      teachersInput = record.visiting_teachers.join(', ');
      comments = record.comments;
    }
  });

  let dirty = $derived(
    record &&
      (fullName !== record.full_name ||
        contactNumber !== record.contact_number ||
        graduatingYear !== record.graduating_year ||
        teachersInput !== record.visiting_teachers.join(', ') ||
        comments !== record.comments),
  );

  function save() {
    if (!record || !dirty) return;
    if (!reception.canEditRegistrations) {
      toast.error('Insufficient permissions');
      return;
    }

    saving = true;
    const teachers = teachersInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    Object.assign(record, {
      full_name: fullName,
      contact_number: contactNumber,
      graduating_year: graduatingYear,
      visiting_teachers: teachers,
      comments,
    });

    toast.success('Details saved');
    saving = false;
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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

  {#if !record}
    <Card.Root>
      <Card.Content class="flex flex-col items-center gap-4 py-16">
        <div class="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-4xl">
          <UserIcon class="size-8" />
        </div>
        <div class="flex flex-col items-center gap-1 text-center">
          <Card.Title>Record not found</Card.Title>
          <Card.Description>No registration matches "{id}".</Card.Description>
        </div>
        <Button href="/workflow/records">Return to list</Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Identity -->
    <Card.Root>
      <Card.Content class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          <span class="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold uppercase">
            {record.full_name.charAt(0)}
          </span>
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl font-semibold tracking-tight">{record.full_name}</h1>
            <p class="text-muted-foreground font-mono text-sm">
              {record.registration_id}
              <span class="mx-1.5" aria-hidden="true">·</span>
              Class of {record.graduating_year}
            </p>
          </div>
        </div>
        {#if meta}
          <Badge variant="secondary" class={meta.badge}>
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
            <Input id="fn" bind:value={fullName} />
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="cn">Contact Number</Field.FieldLabel>
            <Input id="cn" bind:value={contactNumber} />
          </Field.Field>
          <Field.Field>
            <Field.FieldLabel for="gy">Graduating Year</Field.FieldLabel>
            <Input id="gy" bind:value={graduatingYear} />
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
              placeholder="Internal notes about this registrant…"
              class="min-h-24" />
            <Field.FieldDescription>Visible only to your team.</Field.FieldDescription>
          </Field.Field>
        </Field.FieldGroup>
      </Card.Content>
      <Card.Footer>
        <Button onclick={save} disabled={!dirty || saving}>
          <CheckIcon />
          {saving ? 'Saving…' : 'Save Changes'}
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
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">NRIC</span>
          <span class="text-sm font-medium tabular-nums">{record.nric}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Gender</span>
          <span class="text-sm font-medium">{record.gender}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Graduating Class</span>
          <span class="text-sm font-medium">{record.graduating_class}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Institution</span>
          <span class="text-sm font-medium">{record.current_institution || '—'}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Ex-Riverlite</span>
          <span class="text-sm font-medium">
            {#if record.is_ex_riverlite}
              <Badge variant="secondary">Yes</Badge>
            {:else}
              No
            {/if}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Arrived</span>
          <span class="text-sm font-medium">{formatDate(record.arrived_at)}</span>
        </div>
        {#if record.comments}
          <div class="flex flex-col gap-1 sm:col-span-2">
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Comments</span>
            <span class="text-muted-foreground whitespace-pre-wrap text-sm">{record.comments}</span>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
