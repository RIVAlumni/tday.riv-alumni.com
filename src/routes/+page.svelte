<script lang="ts">
  import { goto } from '$app/navigation';

  import { authStore } from '$lib/stores';
  import { FSUserAccessLevel } from '$lib/models';

  import * as Card from '$lib/components/ui/card';

  $: (async () => {
    if (typeof window === 'undefined') return;

    if ($authStore?.access_level === FSUserAccessLevel.None)
      return goto('/app/unauthorised', { replaceState: true });

    if ($authStore?.access_level === FSUserAccessLevel.Operator)
      return goto('/app/operator', { replaceState: true });

    if ($authStore?.access_level === FSUserAccessLevel.Mediator)
      return goto('/app/resolution', { replaceState: true });
  })();
</script>

<svelte:head>
  <title>RIVA Teachers' Day System</title>
</svelte:head>

<div
  class="w-full h-full
          flex flex-col justify-center items-center">
  <Card.Root class="m-6 max-w-md">
    <Card.Header>
      <Card.Title>Please wait...</Card.Title>
      <Card.Description>
        Your authorisation level is being checked. You will be redirected
        shortly.
      </Card.Description>
    </Card.Header>
  </Card.Root>
</div>
