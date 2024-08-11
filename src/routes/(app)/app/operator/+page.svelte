<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
  <title>Reception Station | Operator</title>
</svelte:head>

<div
  class="p-4 w-full h-min
          grid grid-flow-row-dense
          grid-cols-2 sm:grid-cols-3 gap-2">
  <Card.Root class="col-span-2 sm:col-span-1 sm:order-2">
    <Card.Header class="text-sm font-normal">
      Search by Partials or QR
    </Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="search"
        type="text"
        value=""
        placeholder="Search by Partials or QR"
        class="border-0 text-2xl md:text-3xl font-bold
                          focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:order-1">
    <Card.Header class="text-sm font-normal">Full Name</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="full_name"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-1 sm:order-3">
    <Card.Header class="text-sm font-normal">NRIC</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="nric"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-1 sm:order-4">
    <Card.Header class="text-sm font-normal">Gender</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="gender"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-1 sm:order-6">
    <Card.Header class="text-sm font-normal">Graduating Class</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="graduating_class"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-1 sm:order-7">
    <Card.Header class="text-sm font-normal">Graduating Year</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="graduating_year"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:order-9">
    <Card.Header class="text-sm font-normal">
      Current School / Institution
    </Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="current_school_institution"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:order-10">
    <Card.Header class="text-sm font-normal">Contact Number</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="contact_number"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-1 sm:order-12">
    <Card.Header class="text-sm font-normal">Name of Next-of-Kin</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="name_of_nok"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-1 sm:order-[13]">
    <Card.Header class="text-sm font-normal">
      Relationship with Next-of-Kin
    </Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="relationship_with_nok"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:order-[14]">
    <Card.Header class="text-sm font-normal">
      Emergency Contact of Next-of-Kin
    </Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="emergency_contact_nok"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:col-span-1 sm:order-[15]">
    <Card.Header class="text-sm font-normal">Form Teachers</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="form_teachers"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:col-span-1 sm:order-[16]">
    <Card.Header class="text-sm font-normal">
      Total Number of Teachers Visiting
    </Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="total_teachers_visiting"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="sm:order-5 col-span-2 sm:col-span-1">
    <Card.Header class="text-sm font-normal">Status</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="status"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:col-span-1 row-span-2 sm:order-8">
    <Card.Header class="text-sm font-normal">Comments</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Textarea
        id="comments"
        value=""
        placeholder="No Record"
        class="border-0 font-mono h-full max-h-full
                  focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:col-span-1 row-span-3 sm:order-11">
    <Card.Header class="text-sm font-normal">
      Previous Registration Records
    </Card.Header>
    <Card.Content class="flex flex-row items-center">
      <Input
        id="prev"
        type="text"
        value=""
        placeholder="No Record"
        class="border-0 text-2xl md:text-3xl font-bold
                focus-visible:ring-0 disabled:opacity-100 disabled:cursor-text" />
    </Card.Content>
  </Card.Root>

  <Card.Root class="col-span-2 sm:col-span-1 sm:order-[17]">
    <Card.Header class="text-sm font-normal">Action</Card.Header>
    <Card.Content class="flex flex-row items-center">
      <div class="w-full flex flex-col gap-2">
        <Button
          type="button"
          class="text-white bg-yellow-600 hover:bg-yellow-600/90 shadow">
          Handover to Conflict Resolution Station
        </Button>

        <div class="flex flex-row gap-2">
          <Button
            type="button"
            class="w-full text-white bg-emerald-600 hover:bg-emerald-600/90 shadow">
            Check-In
          </Button>

          <Button
            type="button"
            class="w-full text-white bg-red-600 hover:bg-red-600/90 shadow">
            Refuse Entry
          </Button>
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</div>
