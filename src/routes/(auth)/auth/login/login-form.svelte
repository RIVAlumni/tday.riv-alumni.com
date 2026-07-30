<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { internalAuth } from '$lib/firebase/auth.svelte';
  import { FieldGroup, Field, FieldDescription } from '$lib/components/ui/field/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { cn, type WithElementRef } from '$lib/utils.js';
  import type { HTMLFormAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithElementRef<HTMLFormAttributes> = $props();

  const id = $props.id();

  onMount(() => {
    internalAuth.init();
    toast.error('Sign-in failed. Please try again.');
  });

  let loginError = $state<string | null>(null);

  async function handleGoogleLogin() {
    loginError = null;
    try {
      await internalAuth.signInWithGoogle();
      goto('/workflow/home');
    } catch (err) {
      console.error('Login failed:', err);
      loginError = 'Sign-in failed. Please try again.';
    }
  }
</script>

<form
  class={cn('flex flex-col gap-6', className)}
  bind:this={ref}
  {...restProps}>
  <FieldGroup>
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-2xl font-bold">Login to your RIVA account</h1>
      <p class="text-muted-foreground text-sm text-balance">
        Your volunteering journey begins here
      </p>
    </div>
    <Field>
      <Button
        variant="outline"
        type="button"
        onclick={handleGoogleLogin}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24">
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="currentColor" />
        </svg>
        Login with Google
      </Button>
      {#if loginError}
        <p class="text-destructive text-center text-sm">{loginError}</p>
      {/if}
      <FieldDescription class="text-center">
        Unable to login?
        <a
          href="https://go.riv-alumni.com/outreach"
          class="underline underline-offset-4">Contact RIVA Community Outreach</a> for assistance.
      </FieldDescription>
    </Field>
  </FieldGroup>
</form>
