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
  import { playScanSound } from '$lib/util/sound';
  import { toast } from 'svelte-sonner';

  import { Copy02Icon } from '$lib/icons';

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

  type CameraTestStatus = 'idle' | 'starting' | 'active' | 'error';

  let cameraTestStatus = $state<CameraTestStatus>('idle');
  let cameraTestError = $state('');
  let cameraTestVideoEl = $state<HTMLVideoElement>();
  let cameraTestStream: MediaStream | null = null;
  let cameraInputCount = $state<number | null>(null);
  let online = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const platformLabel = $derived.by(() => {
    if (typeof navigator === 'undefined') return '-';
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    return 'Desktop';
  });

  const browserLabel = $derived.by(() => {
    if (typeof navigator === 'undefined') return '-';
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return 'Edge';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua)) return 'Safari';
    return 'Unknown';
  });

  const displayLabel = $derived.by(() => {
    if (typeof screen === 'undefined') return '-';
    const dpr = typeof devicePixelRatio === 'undefined' ? 1 : devicePixelRatio;
    return `${screen.width} x ${screen.height} @ ${dpr}x`;
  });

  async function startCameraTest(): Promise<void> {
    stopCameraTest();
    cameraTestStatus = 'starting';
    cameraTestError = '';

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraTestStatus = 'error';
      cameraTestError = 'Camera access requires a secure (HTTPS) connection.';
      return;
    }

    let nextStream: MediaStream;
    try {
      nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch (err) {
      // Devices without a rear camera reject `facingMode: environment` - retry with any camera.
      if (err instanceof DOMException && err.name === 'OverconstrainedError') {
        try {
          nextStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (retryErr) {
          handleCameraTestError(retryErr);
          return;
        }
      } else {
        handleCameraTestError(err);
        return;
      }
    }

    cameraTestStream = nextStream;
    if (cameraTestVideoEl) {
      cameraTestVideoEl.srcObject = nextStream;
      await cameraTestVideoEl.play().catch(() => {});
    }
    cameraTestStatus = 'active';
  }

  function stopCameraTest(): void {
    cameraTestStream?.getTracks().forEach((track) => track.stop());
    cameraTestStream = null;
    if (cameraTestVideoEl) cameraTestVideoEl.srcObject = null;
    cameraTestStatus = 'idle';
  }

  function handleCameraTestError(err: unknown): void {
    cameraTestStatus = 'error';
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      cameraTestError =
        'Camera permission was denied. Allow camera access in your browser settings, then try again.';
    } else if (err instanceof DOMException && err.name === 'NotFoundError') {
      cameraTestError = 'No camera was found on this device.';
    } else {
      cameraTestError = 'The camera could not be started. Please try again.';
    }
  }

  $effect(() => {
    if (!open) return;
    cameraInputCount = null;
    if (!navigator.mediaDevices?.enumerateDevices) return;
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      cameraInputCount = devices.filter((device) => device.kind === 'videoinput').length;
    });
  });

  $effect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => (online = true);
    const handleOffline = () => (online = false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  $effect(() => {
    if (!open) stopCameraTest();
  });

  async function copyToClipboard(value: string, label: string): Promise<void> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // fallback for non-secure contexts (e.g. LAN preview over http)
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      toast.success(`Copied ${label} to clipboard`);
    } catch {
      toast.error('Copy to clipboard failed');
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="settings-scroll max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
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

        {#snippet diagRow(label: string, value: string, mono = false)}
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <dt class="text-xs text-muted-foreground">{label}</dt>
              <dd class="break-all text-sm {mono ? 'font-mono' : ''}">{value}</dd>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              class="shrink-0 rounded-lg"
              aria-label={`Copy ${label}`}
              onclick={() => void copyToClipboard(value, label)}>
              <Copy02Icon class="size-4" />
            </Button>
          </div>
        {/snippet}

        <dl class="space-y-4 rounded-2xl border bg-muted/40 p-4">
          {@render diagRow('User UID', uid, true)}
          {@render diagRow('User Email', email)}
          {@render diagRow('Access Expiry', accessExpiryLabel)}
          {@render diagRow('Access Level', accessLevelLabel)}
        </dl>

        <dl class="space-y-4 rounded-2xl border bg-muted/40 p-4">
          {@render diagRow('Connection', online ? 'Online' : 'Offline')}
          {@render diagRow('Platform', platformLabel)}
          {@render diagRow('Browser', browserLabel)}
          {@render diagRow('Display', displayLabel)}
          {@render diagRow(
            'Camera inputs detected',
            cameraInputCount === null ? '-' : String(cameraInputCount),
          )}
        </dl>

        <div class="rounded-2xl border bg-muted/40 p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="grid gap-0.5">
              <h3 class="text-sm font-medium">Camera test</h3>
              <p class="text-xs text-muted-foreground">
                Opens the camera to confirm it works on this device.
              </p>
            </div>
            <Button
              size="sm"
              variant={cameraTestStatus === 'active' ? 'outline' : 'default'}
              disabled={cameraTestStatus === 'starting'}
              onclick={cameraTestStatus === 'active' ? stopCameraTest : startCameraTest}>
              {cameraTestStatus === 'active'
                ? 'Stop'
                : cameraTestStatus === 'starting'
                  ? 'Starting...'
                  : 'Test camera'}
            </Button>
          </div>

          {#if cameraTestStatus === 'active' || cameraTestStatus === 'starting'}
            <!-- muted + playsinline are required for iOS inline autoplay -->
            <video
              bind:this={cameraTestVideoEl}
              autoplay
              playsinline
              muted
              class="mt-3 aspect-video w-full rounded-xl bg-black object-cover"></video>
          {:else if cameraTestStatus === 'error'}
            <p class="mt-3 text-xs text-destructive">{cameraTestError}</p>
          {/if}
        </div>

        <div class="rounded-2xl border bg-muted/40 p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="grid gap-0.5">
              <h3 class="text-sm font-medium">Scan sound</h3>
              <p class="text-xs text-muted-foreground">
                Plays the sound that confirms a successful scan.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onclick={playScanSound}>
              Test sound
            </Button>
          </div>
        </div>
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

<style>
  :global(.settings-scroll) {
    /* thin scrollbar with rounded thumb keeps the corners clear */
    scrollbar-width: thin;
    scrollbar-color: var(--muted-foreground) transparent;
  }

  :global(.settings-scroll)::-webkit-scrollbar {
    width: 10px;
  }

  :global(.settings-scroll)::-webkit-scrollbar-track {
    /* inset the scrollbar from top and bottom so the rounded corners show */
    margin-block: 0.75rem;
  }

  :global(.settings-scroll)::-webkit-scrollbar-thumb {
    border-radius: 9999px;
    /* transparent border + padding-box clip insets the thumb from the track */
    border: 3px solid transparent;
    background-clip: padding-box;
    background-color: var(--muted-foreground);
    opacity: 0.5;
  }
</style>
