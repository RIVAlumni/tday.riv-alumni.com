<script lang="ts">
  import { Separator } from '$lib/components/ui/separator';
  import LoginForm from '$lib/components/login-form.svelte';

  import RIVALogo from '$lib/assets/favicon.svg';
</script>

<div class="grid min-h-svh lg:grid-cols-2">
  <div class="flex flex-col gap-4 p-6 md:p-10">
    <div class="flex justify-center gap-2 md:justify-start">
      <a
        href="##"
        class="flex items-center gap-2 font-medium">
        <div class="text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <img
            src={RIVALogo}
            alt="RIVA Logo"
            class="size-6" />
        </div>
        <Separator
          orientation="vertical"
          class="mx-1 data-[orientation=vertical]:h-4" />
        Internal Systems
      </a>
    </div>
    <div class="flex flex-1 items-center justify-center">
      <div class="w-full max-w-xs">
        <LoginForm />
      </div>
    </div>
  </div>
  <div class="bg-muted relative hidden lg:block">
    <img
      src="/bg1.png"
      alt="placeholder"
      class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
  </div>
</div>
