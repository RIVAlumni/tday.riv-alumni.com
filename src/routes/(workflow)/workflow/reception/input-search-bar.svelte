<script lang="ts">
  import { tick } from 'svelte';

  import { buttonVariants } from '$lib/components/ui/button';
  import * as Drawer from '$lib/components/ui/drawer';
  import { Input } from '$lib/components/ui/input';
  import { QrCode01Icon, Search01Icon } from '$lib/icons';
  import { cn } from '$lib/utils';

  import QrScannerDrawer from './input-search-qr.svelte';

  let {
    searchQuery = $bindable(''),
    qrDrawerOpen = $bindable(false),
    loading = false,
    disabled = false,
    focusToken = 0,
    onSubmit,
  }: {
    searchQuery?: string;
    qrDrawerOpen?: boolean;
    loading?: boolean;
    disabled?: boolean;
    focusToken?: number;
    onSubmit: (registrationId: string) => void | Promise<void>;
  } = $props();

  let searchForm = $state<HTMLFormElement>();
  let inputElement = $state<HTMLInputElement | null>(null);

  $effect(() => {
    void focusToken;
    if (disabled) return;
    void tick().then(() => inputElement?.focus());
  });

  function handleSearchSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (loading || disabled) return;
    void onSubmit(searchQuery);
  }

  async function handleQrScan(value: string): Promise<void> {
    searchQuery = value.trim();
    qrDrawerOpen = false;
    await tick();
    searchForm?.requestSubmit();
  }
</script>

<div
  class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
  <form
    bind:this={searchForm}
    onsubmit={handleSearchSubmit}
    class="pointer-events-auto relative w-full max-w-md">
    <Search01Icon
      class="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
    <Input
      bind:ref={inputElement}
      type="search"
      bind:value={searchQuery}
      aria-busy={loading}
      {disabled}
      placeholder={loading ? 'Looking up registration...' : 'Enter registration ID'}
      aria-label="Registration ID"
      autocomplete="off"
      autocapitalize="characters"
      class="h-13 rounded-full ps-11 shadow-lg bg-background/80 font-mono uppercase backdrop-blur-md" />
  </form>

  <Drawer.Root bind:open={qrDrawerOpen}>
    <Drawer.Trigger
      aria-label="Scan registration QR code"
      {disabled}
      class={cn(
        buttonVariants({ variant: 'default', size: 'icon-lg' }),
        'pointer-events-auto size-13 shrink-0 rounded-full shadow-lg',
      )}>
      <QrCode01Icon class="size-5" />
    </Drawer.Trigger>

    <QrScannerDrawer
      open={qrDrawerOpen}
      onScan={handleQrScan} />
  </Drawer.Root>
</div>
