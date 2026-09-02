<script lang="ts">
  import type { Registration } from '$lib/models/registration';

  import { toast } from 'svelte-sonner';

  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import {
    actionMeta,
    formatTime,
    statusForAction,
    statusMeta,
    type ActionType,
  } from '$lib/data/reception';
  import {
    Alert02Icon,
    BanIcon,
    CancelCircleHalfDotIcon,
    Flag01Icon,
    UserCheck01Icon,
  } from '$lib/icons';
  import { arrivedAtFor, visitingTeachersPreviewFor } from '$lib/util/registration';
  import { cn } from '$lib/utils';
  let {
    registration,
    disabled = false,
    onAction,
  }: {
    registration: Registration;
    disabled?: boolean;
    onAction: (action: ActionType, reason?: string) => Promise<void>;
  } = $props();

  const selected = $derived(registration);
  const hasSelection = $derived(selected !== null);
  const statusBadge = $derived(statusMeta[selected.status]);

  // Fields the operator has flagged as "at fault"; the Conflict action
  // builds its reason from the flagged set.
  type FieldKey = 'fullName' | 'contactNumber' | 'graduatingYear' | 'teachersVisiting';
  const fieldLabels: Record<FieldKey, string> = {
    fullName: 'Full name',
    contactNumber: 'Contact number',
    graduatingYear: 'Graduating year',
    teachersVisiting: 'Visiting teachers',
  };
  const selectedFields = $state<Record<FieldKey, boolean>>({
    fullName: false,
    contactNumber: false,
    graduatingYear: false,
    teachersVisiting: false,
  });

  function toggleField(field: FieldKey) {
    selectedFields[field] = !selectedFields[field];
  }

  function handleFieldKeydown(event: KeyboardEvent, field: FieldKey) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleField(field);
    }
  }

  // Reset flags whenever the focused visitor changes.
  $effect(() => {
    // touch the id so the effect re-runs on selection change
    void selected?.registration_id;
    selectedFields.fullName = false;
    selectedFields.contactNumber = false;
    selectedFields.graduatingYear = false;
    selectedFields.teachersVisiting = false;
    pending = null;
    alreadyCheckedInOpen = false;
    rejectDialogOpen = false;
  });

  let pending = $state<ActionType | null>(null);
  let alreadyCheckedInOpen = $state(false);
  let rejectDialogOpen = $state(false);
  let checkedInAt = $state('-');

  async function act(action: ActionType) {
    const r = selected;
    if (!r || pending || disabled) return;
    if (action === 'CHECKED_IN' && r.status === 'CHECKED_IN') {
      checkedInAt = formatTime(arrivedAtFor(r));
      alreadyCheckedInOpen = true;
      return;
    }
    // Conflict requires at least one flagged field; the reason carries them.
    const flagged = (Object.keys(selectedFields) as FieldKey[]).filter((k) => selectedFields[k]);
    if (action === 'CHECKED_IN' && flagged.length > 0) {
      toast.error('Unable to check-in registrant', {
        description: 'You selected one or more fields as conflict. Deselect them to check-in.',
      });
      return;
    }
    if (action === 'CONFLICT' && flagged.length === 0) {
      toast.error('Unable to flag as conflict', {
        description: 'Please select the field(s) that are problematic.',
      });
      return;
    }
    const reason =
      action === 'CONFLICT'
        ? `Flagged field(s): ${flagged.map((f) => fieldLabels[f]).join(', ')}`
        : undefined;

    pending = action;
    try {
      await onAction(action, reason);
      if (action === 'CHECKED_IN') toast.success(actionMeta[action].toastTitle);
      else toast.error(actionMeta[action].toastTitle);
      selectedFields.fullName = false;
      selectedFields.contactNumber = false;
      selectedFields.graduatingYear = false;
      selectedFields.teachersVisiting = false;
    } catch (err) {
      toast.error('Action failed', { description: (err as Error).message });
    } finally {
      pending = null;
    }
  }
</script>

<div class="flex flex-col gap-4 py-4 pb-24 md:gap-6 md:py-6 md:pb-24">
  {#snippet selectedBadge()}
    <Card.Action class="absolute top-6 right-6">
      <Badge variant="destructive">
        <CancelCircleHalfDotIcon />
        Conflict Marked
      </Badge>
    </Card.Action>
  {/snippet}

  <div class="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3 @4xl/main:grid-cols-6">
    <Card.Root
      role={hasSelection ? 'button' : undefined}
      tabindex={hasSelection ? 0 : undefined}
      aria-pressed={hasSelection ? selectedFields.fullName : undefined}
      onclick={hasSelection ? () => toggleField('fullName') : undefined}
      onkeydown={hasSelection ? (event) => handleFieldKeydown(event, 'fullName') : undefined}
      class={cn(
        '@container/card relative select-none transition-shadow @xl/main:col-span-3 @4xl/main:col-span-6',
        hasSelection && 'cursor-pointer',
        selectedFields.fullName && 'ring-2 ring-destructive dark:ring-destructive',
      )}>
      <Card.Header>
        <Card.Description>Full Name</Card.Description>
        <Card.Title class={cn('text-2xl font-semibold tabular-nums @[250px]/card:text-3xl')}>
          {selected ? selected.full_name : 'No visitor record'}
        </Card.Title>
      </Card.Header>
      {#if hasSelection && selectedFields.fullName}
        {@render selectedBadge()}
      {/if}
      <Card.Footer class="flex-col items-start gap-1.5 text-sm">
        <div
          class="flex items-center gap-2 line-clamp-1 font-medium text-amber-600 dark:text-amber-400">
          <Alert02Icon class="size-4 shrink-0 motion-safe:animate-pulse" />
          Ensure that the name matches the EZ-Link/NRIC/SingPass exactly. All spaces, commas, and special
          characters are important.
        </div>
      </Card.Footer>
    </Card.Root>

    <!-- Contact Number -->
    <Card.Root
      role={hasSelection ? 'button' : undefined}
      tabindex={hasSelection ? 0 : undefined}
      aria-pressed={hasSelection ? selectedFields.contactNumber : undefined}
      onclick={hasSelection ? () => toggleField('contactNumber') : undefined}
      onkeydown={hasSelection ? (event) => handleFieldKeydown(event, 'contactNumber') : undefined}
      class={cn(
        '@container/card relative select-none transition-shadow @xl/main:col-span-3 @4xl/main:col-span-3',
        hasSelection && 'cursor-pointer',
        selectedFields.contactNumber && 'ring-2 ring-destructive dark:ring-destructive',
      )}>
      <Card.Header>
        <Card.Description>Contact Number</Card.Description>
        <Card.Title
          class={cn(
            'text-2xl font-semibold tabular-nums @[250px]/card:text-3xl',
            !hasSelection && 'text-muted-foreground',
          )}>
          {selected ? String(selected.contact_number) : '-'}
        </Card.Title>
      </Card.Header>
      {#if hasSelection && selectedFields.contactNumber}
        {@render selectedBadge()}
      {/if}
    </Card.Root>

    <!-- Graduating Year -->
    <Card.Root
      role={hasSelection ? 'button' : undefined}
      tabindex={hasSelection ? 0 : undefined}
      aria-pressed={hasSelection ? selectedFields.graduatingYear : undefined}
      onclick={hasSelection ? () => toggleField('graduatingYear') : undefined}
      onkeydown={hasSelection ? (event) => handleFieldKeydown(event, 'graduatingYear') : undefined}
      class={cn(
        '@container/card relative select-none transition-shadow @xl/main:col-span-3 @4xl/main:col-span-3',
        hasSelection && 'cursor-pointer',
        selectedFields.graduatingYear && 'ring-2 ring-destructive dark:ring-destructive',
      )}>
      <Card.Header>
        <Card.Description>Graduating Year</Card.Description>
        <Card.Title
          class={cn(
            'text-2xl font-semibold tabular-nums @[250px]/card:text-3xl',
            !hasSelection && 'text-muted-foreground',
          )}>
          {selected ? String(selected.graduating_year) : '-'}
        </Card.Title>
      </Card.Header>
      {#if hasSelection && selectedFields.graduatingYear}
        {@render selectedBadge()}
      {/if}
    </Card.Root>

    <!-- Status -->
    <Card.Root class="@container/card @xl/main:col-span-3 @4xl/main:col-span-3">
      <Card.Header>
        <Card.Description>Status</Card.Description>
        <Card.Title
          class={cn(
            'text-2xl font-semibold tabular-nums @[250px]/card:text-3xl',
            !hasSelection && 'text-muted-foreground',
          )}>
          {statusBadge?.label ?? '-'}
        </Card.Title>
      </Card.Header>
    </Card.Root>

    <!-- Visiting Teachers -->
    <Card.Root
      role={hasSelection ? 'button' : undefined}
      tabindex={hasSelection ? 0 : undefined}
      aria-pressed={hasSelection ? selectedFields.teachersVisiting : undefined}
      onclick={hasSelection ? () => toggleField('teachersVisiting') : undefined}
      onkeydown={hasSelection
        ? (event) => handleFieldKeydown(event, 'teachersVisiting')
        : undefined}
      class={cn(
        '@container/card relative select-none transition-shadow @xl/main:col-span-3 @4xl/main:col-span-3',
        hasSelection && 'cursor-pointer',
        selectedFields.teachersVisiting && 'ring-2 ring-destructive dark:ring-destructive',
      )}>
      <Card.Header>
        <Card.Description>Which teacher(s) are they visiting?</Card.Description>
        <Card.Title
          class={cn(
            'text-2xl font-semibold tabular-nums @[250px]/card:text-3xl',
            !hasSelection && 'text-muted-foreground',
          )}>
          {selected ? visitingTeachersPreviewFor(selected) || '-' : '-'}
        </Card.Title>
      </Card.Header>
      {#if hasSelection && selectedFields.teachersVisiting}
        {@render selectedBadge()}
      {/if}
    </Card.Root>

    <div class="flex gap-2 @xl/main:col-span-3 @4xl/main:col-span-6">
      <Button
        variant="destructive"
        size="lg"
        disabled={disabled ||
          pending !== null ||
          !hasSelection ||
          selected?.status === statusForAction('REFUSED')}
        onclick={() => (rejectDialogOpen = true)}
        class="min-h-20 min-w-0 flex-1 flex-col gap-1 whitespace-normal">
        <BanIcon class="size-5" />
        Reject
      </Button>
      <Button
        size="lg"
        disabled={disabled ||
          pending !== null ||
          !hasSelection ||
          selected?.status !== 'REGISTERED'}
        onclick={() => act('CONFLICT')}
        class={cn(
          'min-h-20 min-w-0 flex-1 flex-col gap-1 whitespace-normal',
          'text-warning bg-warning/10',
          'hover:bg-warning/20 focus-visible:ring-warning/20 focus-visible:border-warning/40',
          'dark:bg-warning/20 dark:hover:bg-warning/30 dark:focus-visible:ring-warning/40',
        )}>
        <Flag01Icon class="size-5" />
        Conflict
      </Button>
      <Button
        size="lg"
        disabled={disabled ||
          pending !== null ||
          !hasSelection ||
          selected?.status !== 'REGISTERED'}
        onclick={() => act('CHECKED_IN')}
        class={cn(
          'min-h-20 min-w-0 flex-1 flex-col gap-1 whitespace-normal',
          'text-emerald-500 bg-emerald-500/10',
          'hover:bg-emerald-500/20 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40',
          'dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:focus-visible:ring-emerald-500/40',
        )}>
        <UserCheck01Icon class="size-5" />
        Check-in
      </Button>
    </div>
  </div>
</div>

<AlertDialog.Root bind:open={alreadyCheckedInOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>STOP. DO NOT PROCEED.</AlertDialog.Title>
      <AlertDialog.Description>
        {`This registrant has already checked in at ${checkedInAt}. Hand their identification card over to the Conflict Resolution team to investigate.`}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action onclick={() => (alreadyCheckedInOpen = false)}
        >I understand</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={rejectDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
      <AlertDialog.Description>
        You are about to reject the registrant. This cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (rejectDialogOpen = false)}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        variant="destructive"
        onclick={() => {
          rejectDialogOpen = false;
          void act('REFUSED');
        }}>Reject</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
