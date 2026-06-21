<script lang="ts">
  import RIVALogo from '$lib/assets/favicon.svg';

  import { Separator } from '$lib/components/ui/separator';
  import LoginForm from './login-form.svelte';
</script>

<div class="grid min-h-svh lg:grid-cols-2">
  <div class="flex flex-col gap-4 p-6 md:p-10">
    <div class="flex justify-center gap-2 md:justify-start">
      <a
        href="/"
        class="flex items-center gap-2 font-medium">
        <div class="text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <img
            src={RIVALogo}
            alt="RIVA Logo"
            class="size-6" />
        </div>
        <Separator
          orientation="vertical"
          class="mx-1 data-[orientation=vertical]:h-4 bg-muted-foreground" />
        <p>Internal Systems</p>
      </a>
    </div>
    <div class="flex flex-1 items-center justify-center">
      <div class="w-full max-w-xs">
        <LoginForm />
      </div>
    </div>
  </div>
  <div
    class="pointer-events-none select-none relative hidden lg:block"
    style="background-image: url('/bg1.png'); background-position: 15% center; background-size: cover; filter: brightness(0.2) grayscale(1);"
    role="img"
    aria-label="RIVAlumni background"></div>
</div>
