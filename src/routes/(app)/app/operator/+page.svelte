<script lang="ts">
  import type { FSRegistration } from '$lib/models';
  import type { FormInputEvent } from '$lib/components/ui/input';

  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';

  import SearchIcon from 'lucide-svelte/icons/search';

  import { page } from '$app/stores';

  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Button } from '$lib/components/ui/button';
  import Watermark from '$lib/components/Watermark.svelte';

  import { authStore } from '$lib/stores';
  import { queryConsensus, queryContactNumber, getRegistrationById } from '$lib/firebase/query';
  import {
    actionSetConflict,
    actionCheckIn,
    actionRefuseEntry,
  } from '$lib/firebase/actions';

  onMount(() => {
    searchMaskOrQr = $page.url.searchParams.get('search') ?? '';
    if (searchMaskOrQr) handleIdQuery(searchMaskOrQr);

    const interval = setInterval(() => (currentTime = new Date()), 500);
    return () => clearInterval(interval);
  });

  let currentTime = new Date();
  $: currentTimeHours = currentTime.getHours().toString().padStart(2, '0');
  $: currentTimeMinutes = currentTime.getMinutes().toString().padStart(2, '0');
  $: currenttimeSeconds = currentTime.getSeconds().toString().padStart(2, '0');

  let consensus = '';

  let searchMaskOrQr = '';
  let searchMaskOrQrError = '';

  let actionButtonSuccess = '';
  let actionButtonError = '';

  const records = writable<FSRegistration[]>([]);
  const recordCursor = derived(
    records,
    ($records) => $records.shift() ?? ({} as FSRegistration),
  );
  $: recordCursorWritable = writable<FSRegistration>($recordCursor);
  $: (async () => {
    if (!$recordCursor.registration_id) return;

    consensus = await queryConsensus(
      $recordCursor.graduating_year,
      $recordCursor.graduating_class,
    );
  })();

  const onKeyInput = async (event: FormInputEvent<KeyboardEvent>) => {
    if (event.key !== 'Enter') return;
    handleMaskQuery();
  };

  const handleIdQuery = async (id: string) => {
    searchMaskOrQrError = '';
    actionButtonSuccess = '';
    actionButtonError = '';

    const registration = await getRegistrationById(id);
    records.set([registration]);
    searchMaskOrQr = '';
  }

  const handleMaskQuery = async () => {
    // if (searchMaskOrQr.toUpperCase().match(/^[STFGM]\d{7}.$/))
    //   return (searchMaskOrQr = searchMaskOrQr.substring(5, 9).toUpperCase());

    // if (searchMaskOrQr.length < 8)
    //   return (searchMaskOrQrError = 'Minimum 8 characters required');

    searchMaskOrQrError = '';
    actionButtonSuccess = '';
    actionButtonError = '';

    const registrations = await queryContactNumber(searchMaskOrQr.toUpperCase());
    records.set(registrations);
    searchMaskOrQr = '';
  };

  const handleCheckIn = () => {
    actionButtonSuccess = '';
    actionButtonError = '';

    if (!$authStore) return;
    if (!$recordCursorWritable.registration_id) return;

    actionCheckIn($authStore, $recordCursorWritable)
      .then(() => {
        actionButtonSuccess = 'Check-in successful.';
        records.set([]);
      })
      .catch((err) => {
        actionButtonError = err.message;
      });
  };

  const handleRefuseEntry = () => {
    actionButtonSuccess = '';
    actionButtonError = '';

    if (!$authStore) return;
    if (!$recordCursorWritable.registration_id) return;
    if ($authStore.access_level < 2)
      return (actionButtonError =
        'Access denied. Please call the Conflict Resolution Team for assistance.');

    actionRefuseEntry($authStore, $recordCursorWritable)
      .then(() => {
        actionButtonSuccess =
          'Refusal of entry successful. Please turn them away from the school now.';
        records.set([]);
      })
      .catch((err) => {
        actionButtonError = err.message;
      });
  };

  const handleSetConflict = () => {
    actionButtonSuccess = '';
    actionButtonError = '';

    if (!$authStore) return;
    if (!$recordCursorWritable.registration_id) return;

    actionSetConflict($authStore, $recordCursorWritable)
      .then(() => {
        actionButtonSuccess =
          'Handover complete. Please send them over to the Conflict Resolution Station.';
        records.set([]);
      })
      .catch((err) => {
        actionButtonError = err.message;
      });
  };
</script>

<svelte:head>
  <title>Reception Station | Operator</title>
</svelte:head>

<Watermark displayName={$authStore?.display_name || ''} email={$authStore?.email || ''} />

<div
  class="px-4 pt-4 top-0 sticky bg-background shadow
          flex flex-row items-center gap-4">
  <p class="text-sm">
    Currently logged in as
    <span class="font-bold">
      {$authStore?.display_name}
    </span>
  </p>

  <p class="text-sm">Access Level - {$authStore?.access_level}</p>

  <p class="text-sm">
    Time now is {currentTimeHours}:{currentTimeMinutes}:{currenttimeSeconds}
  </p>

  <Button
    variant="link"
    href="/app/resolution">
    Switch to Resolution View
  </Button>
</div>

<div
  class="p-4 w-full h-min
          grid grid-flow-row-dense
          grid-cols-2 sm:grid-cols-3 gap-2">
  <Card.Root class="col-span-2 sm:col-span-1 sm:order-2">
    <Card.Header class="text-sm font-normal">
      Search by Partials or QR
    </Card.Header>
    <Card.Content class="flex flex-row items-center gap-2">
      <Input
        id="search"
        type="text"
        name="search"
        on:keydown="{onKeyInput}"
        on:change="{(e) => e.currentTarget.value.toUpperCase()}"
        bind:value="{searchMaskOrQr}"
        placeholder="Search by Partials or QR"
        class="border-0 text-2xl md:text-3xl font-bold
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />

      <Button
        variant="ghost"
        on:click="{handleMaskQuery}">
        <SearchIcon />
      </Button>
    </Card.Content>
    {#if searchMaskOrQrError}
      <Card.Footer class="text-xs text-red-600">
        {searchMaskOrQrError}
      </Card.Footer>
    {/if}
  </Card.Root>

  <Card.Root class="col-span-2 sm:order-1">
    <Card.Header class="text-sm font-normal">Full Name</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="full_name"
        type="text"
        bind:value="{$recordCursorWritable.full_name}"
        on:keyup="{() =>
          ($recordCursorWritable.full_name =
            $recordCursorWritable.full_name.toUpperCase())}"
        placeholder="No Record"
        disabled="{$authStore && $authStore.access_level < 2}"
        class="border-0 text-2xl md:text-3xl font-bold
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
    <Card.Footer>
      <p class="text-xs text-yellow-600">
        Ensure that the name matches the EZ-Link/NRIC/SingPass exactly. All
        spaces, commas, and special characters are important.
      </p>
    </Card.Footer>
  </Card.Root>

  <Card.Root class="col-span-1 sm:order-3">
    <Card.Header class="text-sm font-normal">Contact Number</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="contact_number"
        type="text"
        bind:value="{$recordCursorWritable.contact_number}"
        placeholder="No Record"
        disabled="{$authStore && $authStore.access_level < 2}"
        class="border-0 text-2xl md:text-3xl font-bold
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-1 sm:order-4">
    <Card.Header class="text-sm font-normal">Ex-Riverlite?</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="ex_riverlite"
        type="text"
        bind:value="{$recordCursorWritable.is_ex_riverlite}"
        placeholder="No Record"
        disabled="{$authStore && $authStore.access_level < 2}"
        class="border-0 text-2xl md:text-3xl font-bold
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:order-5">
    <Card.Header class="text-sm font-normal">Graduating Year</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="graduating_year"
        type="text"
        bind:value="{$recordCursorWritable.graduating_year}"
        placeholder="No Record"
        disabled="{$authStore && $authStore.access_level < 2}"
        class="border-0 text-2xl md:text-3xl font-bold
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:order-6">
    <Card.Header class="text-sm font-normal">
      Total Number of Teachers Visiting
    </Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="total_teachers_visiting"
        type="text"
        value="{$recordCursorWritable.visiting_teachers &&
          $recordCursorWritable.visiting_teachers.split(', ').length}"
        placeholder="No Record"
        disabled="{$authStore && $authStore.access_level < 2}"
        class="border-0 text-2xl md:text-3xl font-bold
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
    <Card.Footer>
      <p class="text-xs">
        {$recordCursorWritable.visiting_teachers}
      </p>
    </Card.Footer>
  </Card.Root>

  <Card.Root class="sm:order-7 col-span-2 sm:col-span-1">
    <Card.Header class="text-sm font-normal">Status</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        disabled
        id="status"
        type="text"
        value="{$recordCursorWritable.status}"
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold uppercase placeholder:normal-case
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 row-span-2 sm:order-9">
    <Card.Header class="text-sm font-normal">Comments</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Textarea
        id="comments"
        rows="{7}"
        bind:value="{$recordCursorWritable.comments}"
        placeholder="No Record"
        disabled="{$authStore && $authStore.access_level < 2}"
        class="border-0 font-mono h-full max-h-full uppercase placeholder:normal-case
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:col-span-1 row-span-3 sm:order-8">
    <Card.Header class="text-sm font-normal">
      Previous Registration Records
    </Card.Header>
    <Card.Content>
      {#each $records as record}
        <p
          class="text-xs uppercase whitespace-pre-line placeholder:normal-case">
          {record.comments}
        </p>

        <hr class="h-px my-4 bg-gray-200 border-0" />
      {:else}
        <p class="text-xs">No previous registration records found</p>
      {/each}
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:col-span-1 sm:order-10">
    <Card.Header class="text-sm font-normal">Action</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <div class="w-full flex flex-col gap-2">
        <Button
          type="button"
          on:click="{handleSetConflict}"
          class="text-white bg-yellow-600 hover:bg-yellow-600/90 shadow">
          Handover to Conflict Resolution Station
        </Button>

        <div class="flex flex-row gap-2">
          <Button
            type="button"
            on:click="{handleCheckIn}"
            class="w-full text-white bg-emerald-600 hover:bg-emerald-600/90 shadow">
            Check-In
          </Button>

          <Button
            type="button"
            on:click="{handleRefuseEntry}"
            class="w-full text-white bg-red-600 hover:bg-red-600/90 shadow">
            Refuse Entry
          </Button>
        </div>
      </div>
    </Card.Content>
    <Card.Footer class="text-xs">
      <p class="text-green-600">
        {actionButtonSuccess}
      </p>

      <p class="text-red-600">
        {actionButtonError}
      </p>
    </Card.Footer>
  </Card.Root>
</div>
