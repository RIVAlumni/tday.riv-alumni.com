<script lang="ts">
  import type { FSRegistration } from '$lib/models';

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createForm } from 'svelte-forms-lib';
  import { Render, Subscribe } from 'svelte-headless-table';

  import { authStore } from '$lib/stores';
  import { FSUserAccessLevel } from '$lib/models';

  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';

  import { queryAllWithFilter } from '$lib/firebase/query';

  import {
    records,
    headerRows,
    pageRows,
    tableAttrs,
    tableBodyAttrs,
  } from './table';

  let currentTime = new Date();
  $: currentTimeHours = currentTime.getHours().toString().padStart(2, '0');
  $: currentTimeMinutes = currentTime.getMinutes().toString().padStart(2, '0');
  $: currenttimeSeconds = currentTime.getSeconds().toString().padStart(2, '0');

  onMount(() => {
    if ($authStore?.access_level !== FSUserAccessLevel.Mediator)
      goto('/app/operator', { replaceState: true });

    const interval = setInterval(() => (currentTime = new Date()), 500);
    queryAllWithFilter({}).then(records.set);

    return () => clearInterval(interval);
  });

  const { form, handleChange, handleSubmit } = createForm<
    Partial<Pick<FSRegistration, 'full_name' | 'nric' | 'contact_number'>>
  >({
    initialValues: {},
    onSubmit: async ({ full_name, nric, contact_number }) => {
      const filters = {
        full_name: full_name?.toUpperCase(),
        nric: nric?.toUpperCase(),
        contact_number: contact_number?.toUpperCase(),
      };

      const registrations = await queryAllWithFilter(filters);
      records.set(registrations);
    },
  });
</script>

<svelte:head>
  <title>Reception Station | Conflict Resolution Team</title>
</svelte:head>

{#if $authStore?.access_level === FSUserAccessLevel.Mediator}
  <div class="px-4 w-full h-min">
    <div
      class="top-0 sticky bg-background z-50
            py-4 flex flex-col justify-start">
      <div class="flex flex-row items-center gap-4">
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
          href="/app/operator">
          Switch to Operator View
        </Button>
      </div>

      <form
        on:submit|preventDefault="{handleSubmit}"
        class="top-0 sticky z-50 bg-background
            flex flex-row items-center gap-4">
        <Input
          type="text"
          id="full_name"
          name="full_name"
          class="px-3 py-1 max-w-xs"
          placeholder="Filter by Full Name"
          on:change="{handleChange}"
          bind:value="{$form.full_name}" />

        <Input
          type="text"
          id="nric"
          name="nric"
          class="px-3 py-1 max-w-xs"
          placeholder="Filter by NRIC"
          on:change="{handleChange}"
          bind:value="{$form.nric}" />

        <Input
          type="text"
          id="contact_number"
          name="contact_number"
          class="px-3 py-1 max-w-xs"
          placeholder="Filter by Contact Number"
          on:change="{handleChange}"
          bind:value="{$form.contact_number}" />

        <Button
          type="submit"
          variant="outline">
          Search
        </Button>
      </form>
    </div>

    <Table.Root {...$tableAttrs}>
      <Table.Header>
        {#each $headerRows as headerRow}
          <Subscribe rowAttrs="{headerRow.attrs()}">
            <Table.Row>
              {#each headerRow.cells as cell (cell.id)}
                <Subscribe
                  attrs="{cell.attrs()}"
                  let:attrs
                  props="{cell.props()}">
                  <Table.Head {...attrs}>
                    <Render of="{cell.render()}" />
                  </Table.Head>
                </Subscribe>
              {/each}
            </Table.Row>
          </Subscribe>
        {/each}
      </Table.Header>

      <Table.Body {...$tableBodyAttrs}>
        {#each $pageRows as row (row.id)}
          <Subscribe
            rowAttrs="{row.attrs()}"
            let:rowAttrs>
            <Table.Row {...rowAttrs}>
              {#each row.cells as cell (cell.id)}
                <Subscribe
                  attrs="{cell.attrs()}"
                  let:attrs>
                  <Table.Cell {...attrs}>
                    <Render of="{cell.render()}" />
                  </Table.Cell>
                </Subscribe>
              {/each}
            </Table.Row>
          </Subscribe>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
{/if}
