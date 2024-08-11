<script lang="ts">
  import * as Card from '$lib/components/ui/card';
</script>

<svelte:head>
  <title>Authorisation Error</title>
</svelte:head>

<div
  class="w-full h-full
          flex flex-col justify-center items-center">
  <Card.Root class="m-6 max-w-md">
    <Card.Header>
      <Card.Title>You are not authorised</Card.Title>
      <Card.Description>
        Either your access level is not sufficient to view this page, or that
        your access has expired.
      </Card.Description>
    </Card.Header>
  </Card.Root>
</div>
