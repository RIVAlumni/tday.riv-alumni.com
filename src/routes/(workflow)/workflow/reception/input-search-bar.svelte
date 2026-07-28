<script lang="ts">
  import { cn } from '$lib/utils';

  import * as Drawer from '$lib/components/ui/drawer';
  import { buttonVariants } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';

  import { QrCode01Icon, Search01Icon } from '$lib/icons';

  import QrScannerDrawer from './input-search-qr.svelte';

  let searchQuery = $state('');
  let qrDrawerOpen = $state(false);

  function handleQrScan(value: string) {
    searchQuery = value;
    qrDrawerOpen = false;
  }
</script>

<div
  class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
  <div class="pointer-events-auto relative w-full max-w-md">
    <Search01Icon
      class="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      bind:value={searchQuery}
      placeholder="Search by name or contact number"
      aria-label="Search recipients"
      class="h-13 rounded-full ps-11 shadow-lg bg-background/80 backdrop-blur-md" />
  </div>

  <Drawer.Root bind:open={qrDrawerOpen}>
    <Drawer.Trigger
      aria-label="Scan recipient QR code"
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
