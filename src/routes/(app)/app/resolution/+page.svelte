<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { createTable, Render, Subscribe } from 'svelte-headless-table';

  import * as Table from '$lib/components/ui/table';
  import Input from '$lib/components/ui/input/input.svelte';

  import { queryAllWithFilter } from '$lib/firebase/query';
  import type { FSRegistration } from '$lib/models';

  onMount(async () => {
    const registrations = await queryAllWithFilter({});
    records.set(registrations);
  });

  const records = writable<FSRegistration[]>([]);

  const table = createTable(records);
  const columns = table.createColumns([
    table.group({
      header: 'Personal Info',
      columns: [
        table.column({
          accessor: 'registration_id',
          header: 'Registration ID',
        }),
        table.column({
          accessor: 'full_name',
          header: 'Full Name',
        }),
        table.column({
          accessor: 'status',
          header: 'Status',
        }),
        table.column({
          accessor: 'nric',
          header: 'NRIC',
        }),
        table.column({
          accessor: 'gender',
          header: 'Gender',
        }),
        table.column({
          accessor: 'current_school_institution',
          header: 'Current School',
        }),
        table.column({
          accessor: 'contact_number',
          header: 'Contact',
        }),
      ],
    }),
    table.group({
      header: 'Graduating',
      columns: [
        table.column({
          accessor: 'graduating_class',
          header: 'Class',
        }),
        table.column({
          accessor: 'graduating_year',
          header: 'Year',
        }),
      ],
    }),
    table.group({
      header: 'Next-of-Kin',
      columns: [
        table.column({
          accessor: 'name_of_nok',
          header: 'Name',
        }),
        table.column({
          accessor: 'relationship_with_nok',
          header: 'Relationship',
        }),
        table.column({
          accessor: 'emergency_contact_nok',
          header: 'Emergency Contact',
        }),
      ],
    }),
  ]);

  const { headerRows, pageRows, tableAttrs, tableBodyAttrs } =
    table.createViewModel(columns);
</script>

<svelte:head>
  <title>Reception Station | Conflict Resolution Team</title>
</svelte:head>

<div class="p-4 w-full h-min">
  <div class="flex flex-row items-center py-4">
    <Input
      type="text"
      class="max-w-sm"
      placeholder="Search by Full Name" />
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
