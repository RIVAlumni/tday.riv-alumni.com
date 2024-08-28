<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  import { queryCount } from '$lib/firebase/query';
  import * as Card from '$lib/components/ui/card';

  const validRecords = writable(0);
  const invalidRecords = writable(0);
  const checkedInRecords = writable(0);

  onMount(() => {
    queryCount('!=', 'REJECTED').then(validRecords.set);
    queryCount('==', 'REJECTED').then(invalidRecords.set);
    queryCount('==', 'CHECKED_IN').then(checkedInRecords.set);

    const interval = setInterval(async () => {
      const validRecordsCount = await queryCount('!=', 'REJECTED');
      const invalidRecordsCount = await queryCount('==', 'REJECTED');
      const checkedInRecordsCount = await queryCount('==', 'CHECKED_IN');

      validRecords.set(validRecordsCount);
      invalidRecords.set(invalidRecordsCount);
      checkedInRecords.set(checkedInRecordsCount);
    }, 30000);

    return () => clearInterval(interval);
  });
</script>

<div
  class="p-4 w-full h-screen
            grid grid-flow-row-dense
            grid-cols-2 gap-2">
  <Card.Root>
    <Card.Header class="text-lg">Total Valid</Card.Header>
    <Card.Content>
      <p class="text-9xl font-bold">{$validRecords}</p>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header class="text-lg">Total Checked In</Card.Header>
    <Card.Content>
      <p class="text-9xl font-bold">{$checkedInRecords}</p>
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2">
    <Card.Header class="text-lg">Total Walk-in</Card.Header>
    <Card.Content>
      <p class="text-9xl font-bold">{$invalidRecords}</p>
    </Card.Content>
  </Card.Root>
</div>
