<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Field from '$lib/components/ui/field';
  import { Slider } from '$lib/components/ui/slider';
  import { ACCESS_LEVEL_NAMES } from '$lib/data/access';
  import {
    SCAN_POLLING_RATES,
    settingsStore,
    type ScanPollingRate,
  } from '$lib/stores/settings.svelte';
  import { userStore } from '$lib/stores/user.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const uid = $derived(userStore.authUser?.uid ?? '-');
  const email = $derived(userStore.state?.email ?? userStore.authUser?.email ?? '-');
  const accessLevelLabel = $derived.by(() => {
    const user = userStore.state;
    if (!user) return '-';
    return `${ACCESS_LEVEL_NAMES[user.access_level] ?? 'Unknown'} (${user.access_level})`;
  });
  const accessExpiryLabel = $derived.by(() => {
    const accessExpires = userStore.state?.access_expires;
    if (!accessExpires) return '-';
    return accessExpires.toDate().toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  });

  function handlePollingRateChange(value: number): void {
    if ((SCAN_POLLING_RATES as readonly number[]).includes(value)) {
      settingsStore.setScanPollingRate(value as ScanPollingRate);
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Settings</Dialog.Title>
    </Dialog.Header>

    <div class="grid gap-6">
      <Field.Field>
        <Field.FieldLabel id="scan-polling-rate-label">
          QR Code scanner polling rate
        </Field.FieldLabel>
        <Field.FieldDescription>
          100 ms responds the fastest; 500 ms conserves the most battery.
        </Field.FieldDescription>
        <div class="flex items-center gap-4">
          <Slider
            type="single"
            aria-labelledby="scan-polling-rate-label"
            value={settingsStore.scanPollingRate}
            min={SCAN_POLLING_RATES[0]}
            max={SCAN_POLLING_RATES[SCAN_POLLING_RATES.length - 1]}
            step={100}
            onValueChange={handlePollingRateChange}
            class="flex-1" />
          <span class="w-12 shrink-0 text-right text-sm font-medium tabular-nums">
            {settingsStore.scanPollingRate} ms
          </span>
        </div>
      </Field.Field>

      <div class="grid gap-3">
        <h2 class="text-sm font-medium">Diagnostics</h2>
        <dl class="rounded-2xl border bg-muted/40 p-4">
          <div class="grid gap-1">
            <dt class="text-xs text-muted-foreground">User UID</dt>
            <dd class="break-all font-mono text-sm">{uid}</dd>
          </div>
          <div class="mt-4 grid gap-1">
            <dt class="text-xs text-muted-foreground">User Email</dt>
            <dd class="break-all text-sm">{email}</dd>
          </div>
          <div class="mt-4 grid gap-1">
            <dt class="text-xs text-muted-foreground">Access Expiry</dt>
            <dd class="text-sm">{accessExpiryLabel}</dd>
          </div>
          <div class="mt-4 grid gap-1">
            <dt class="text-xs text-muted-foreground">Access Level</dt>
            <dd class="text-sm">{accessLevelLabel}</dd>
          </div>
        </dl>
      </div>
    </div>

    <Dialog.Footer>
      <Dialog.Close>
        {#snippet child({ props })}
          <Button
            variant="outline"
            {...props}>
            Close
          </Button>
        {/snippet}
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
