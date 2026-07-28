<script lang="ts">
  import { cn } from '$lib/utils';

  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';

  import {
    Alert02Icon,
    BanIcon,
    CancelCircleHalfDotIcon,
    Flag01Icon,
    UserCheck01Icon,
  } from '$lib/icons';

  /**
   * Tracks which fields the operator has flagged as "at fault".
   * Clicking (or Enter/Space on) a card toggles its flag; the upcoming
   * "Send to conflict resolution" action reads this map to know what to flag.
   */
  type FieldKey = 'fullName' | 'contactNumber' | 'graduatingYear' | 'teachersVisiting';

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
      role="button"
      tabindex={0}
      aria-pressed={selectedFields.fullName}
      onclick={() => toggleField('fullName')}
      onkeydown={(event) => handleFieldKeydown(event, 'fullName')}
      class={cn(
        '@container/card relative cursor-pointer select-none transition-shadow @xl/main:col-span-3 @4xl/main:col-span-6',
        selectedFields.fullName && 'ring-2 ring-destructive dark:ring-destructive',
      )}>
      <Card.Header>
        <Card.Description>Full Name</Card.Description>
        <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          TEH LING YI ANGEL
        </Card.Title>
      </Card.Header>
      {#if selectedFields.fullName}
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

    <Card.Root
      role="button"
      tabindex={0}
      aria-pressed={selectedFields.contactNumber}
      onclick={() => toggleField('contactNumber')}
      onkeydown={(event) => handleFieldKeydown(event, 'contactNumber')}
      class={cn(
        '@container/card relative cursor-pointer select-none transition-shadow @xl/main:col-span-3 @4xl/main:col-span-3',
        selectedFields.contactNumber && 'ring-2 ring-destructive dark:ring-destructive',
      )}>
      <Card.Header>
        <Card.Description>Contact Number</Card.Description>
        <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          12345678
        </Card.Title>
      </Card.Header>
      {#if selectedFields.contactNumber}
        {@render selectedBadge()}
      {/if}
    </Card.Root>

    <Card.Root
      role="button"
      tabindex={0}
      aria-pressed={selectedFields.graduatingYear}
      onclick={() => toggleField('graduatingYear')}
      onkeydown={(event) => handleFieldKeydown(event, 'graduatingYear')}
      class={cn(
        '@container/card relative cursor-pointer select-none transition-shadow @xl/main:col-span-3 @4xl/main:col-span-3',
        selectedFields.graduatingYear && 'ring-2 ring-destructive dark:ring-destructive',
      )}>
      <Card.Header>
        <Card.Description>Graduating Year</Card.Description>
        <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          2024
        </Card.Title>
      </Card.Header>
      {#if selectedFields.graduatingYear}
        {@render selectedBadge()}
      {/if}
    </Card.Root>

    <Card.Root
      role="button"
      tabindex={0}
      aria-pressed={selectedFields.teachersVisiting}
      onclick={() => toggleField('teachersVisiting')}
      onkeydown={(event) => handleFieldKeydown(event, 'teachersVisiting')}
      class={cn(
        '@container/card relative cursor-pointer select-none transition-shadow @xl/main:col-span-3 @4xl/main:col-span-6',
        selectedFields.teachersVisiting && 'ring-2 ring-destructive dark:ring-destructive',
      )}>
      <Card.Header>
        <Card.Description>Which Teacher(s) Are They Visiting</Card.Description>
        <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          Mr Zakir, Ms Radha, Ms Tan, Mr Greogry, Mr Lim
        </Card.Title>
      </Card.Header>
      {#if selectedFields.teachersVisiting}
        {@render selectedBadge()}
      {/if}
    </Card.Root>

    <Card.Root class="@container/card @xl/main:col-span-3 @4xl/main:col-span-3">
      <Card.Header>
        <Card.Description>Status</Card.Description>
        <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          REJECTED
        </Card.Title>
      </Card.Header>
    </Card.Root>

    <Card.Root class="@container/card @xl/main:col-span-3 @4xl/main:col-span-3">
      <Card.Header>
        <Card.Description>Previous Registration Record(s)</Card.Description>
        <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          abc
        </Card.Title>
      </Card.Header>
    </Card.Root>

    <div class="flex gap-2 @xl/main:col-span-3 @4xl/main:col-span-6">
      <Button
        variant="destructive"
        size="lg"
        class="min-h-20 min-w-0 flex-1 flex-col gap-1 whitespace-normal">
        <BanIcon class="size-5" />
        Refuse Entry
      </Button>
      <Button
        size="lg"
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
