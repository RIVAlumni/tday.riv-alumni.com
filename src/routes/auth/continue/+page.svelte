<script lang="ts">
  import * as Card from '$lib/components/ui/card';

  import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
  <title>Continue with your RIVA Identity</title>
</svelte:head>

<div
  class="w-full h-full
          flex flex-col justify-center items-center">
  <Card.Root class="m-6 max-w-md">
    <Card.Header>
      <Card.Title class="flex flex-row align-middle gap-2">
        <img
          src="/favicon.png"
          alt="RIVAlumni Logo"
          class="w-8 h-8" />

        <h1 class="text-2xl font-normal">
          RIVAlumni <span class="font-bold">Internal Systems</span>
        </h1>
      </Card.Title>
      <Card.Description>Use your RIVA account to continue.</Card.Description>
    </Card.Header>

    <Card.Content class="space-y-6">
      <Button
        type="button"
        variant="outline"
        class="w-full">
        <i class="fa-brands fa-google mr-2"></i>
        Google (@riv-alumni.com)
      </Button>

      <p class="px-8 text-center text-sm text-muted-foreground">
        By continuing, you agree to our
        <a
          href="/terms"
          class="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>
        and
        <a
          href="//ops.riv-alumni.com/privacy"
          class="underline underline-offset-4 hover:text-primary">
          Privacy Policy.
        </a>
      </p>
    </Card.Content>
  </Card.Root>
</div>
