<script lang="ts">
  import type { EventStats } from '$lib/util/registration';

  import { browser } from '$app/env';

  import * as Card from '$lib/components/ui/card/index.js';
  import { fetchEventStats } from '$lib/firebase';
  import { eventStore } from '$lib/stores/event.svelte';

  const EMPTY_STATS: EventStats = {
    total: 0,
    checkedIn: 0,
    refused: 0,
    conflict: 0,
    awaiting: 0,
    progress: 0,
  };

  let stats = $state<EventStats>(EMPTY_STATS);
  let error = $state<Error | null>(null);
  let requestSequence = 0;

  $effect(() => {
    const eventId = eventStore.activeEventId;
    if (!browser) return;

    const sequence = ++requestSequence;
    fetchEventStats(eventId)
      .then((result) => {
        if (sequence !== requestSequence || eventId !== eventStore.activeEventId) return;
        stats = result;
        error = null;
      })
      .catch((queryError) => {
        if (sequence !== requestSequence) return;
        stats = EMPTY_STATS;
        error = queryError as Error;
      });
  });

  const rate = $derived(stats.total > 0 ? Math.round(stats.progress * 100) : 0);
</script>

{#if error}
  <p
    class="text-destructive px-4 text-sm lg:px-6"
    role="alert">
    Unable to load event statistics: {error.message}
  </p>
{/if}

<div
  class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
  <Card.Root class="@container/card">
    <Card.Header>
      <Card.Description>Total Registrations</Card.Description>
      <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        {stats.total}
      </Card.Title>
    </Card.Header>
    <Card.Footer class="flex-col items-start gap-1.5 text-sm">
      <div class="text-muted-foreground">{eventStore.activeEvent.title}</div>
    </Card.Footer>
  </Card.Root>
  <Card.Root class="@container/card">
    <Card.Header>
      <Card.Description>Checked In</Card.Description>
      <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        {stats.checkedIn}
      </Card.Title>
    </Card.Header>
    <Card.Footer class="flex-col items-start gap-1.5 text-sm">
      <div class="text-muted-foreground">Arrived visitors</div>
    </Card.Footer>
  </Card.Root>
  <Card.Root class="@container/card">
    <Card.Header>
      <Card.Description>Check-in Rate</Card.Description>
      <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        {rate}%
      </Card.Title>
    </Card.Header>
    <Card.Footer class="flex-col items-start gap-1.5 text-sm">
      <div class="text-muted-foreground">Of total registrations</div>
    </Card.Footer>
  </Card.Root>
  <Card.Root class="@container/card">
    <Card.Header>
      <Card.Description>Awaiting Check-in</Card.Description>
      <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        {stats.awaiting}
      </Card.Title>
    </Card.Header>
    <Card.Footer class="flex-col items-start gap-1.5 text-sm">
      <div class="text-muted-foreground">{stats.conflict} flagged for resolution</div>
    </Card.Footer>
  </Card.Root>
</div>
