<script lang="ts">
  import { ClockIcon } from '$lib/icons';

  // Real-time clock. The initial `new Date()` is what renders on the server and
  // on first paint; `$effect` then starts a sub-second interval once mounted in
  // the browser (effects don't run during SSR) and cleans itself up on destroy.
  let now = $state(new Date());

  $effect(() => {
    const interval = setInterval(() => (now = new Date()), 500);
    return () => clearInterval(interval);
  });

  // 12-hour time, splitting the AM/PM period out via `formatToParts` so it can
  // be styled as a distinct element on the side of the digits.
  const timeParts = $derived(
    new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).formatToParts(now),
  );

  const time = $derived(
    timeParts
      .filter((p) => p.type === 'hour' || p.type === 'minute' || p.type === 'second')
      .map((p) => p.value)
      .join(':'),
  );

  const period = $derived(timeParts.find((p) => p.type === 'dayPeriod')?.value ?? '');

  const date = $derived(
    now.toLocaleDateString(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }),
  );

  let { class: className = '' }: { class?: string } = $props();
</script>

<div
  class="inline-flex items-center gap-2 rounded-4xl border border-transparent bg-muted/40 px-3 py-1 text-sm tabular-nums {className}"
  aria-live="polite"
  title="Current time">
  <!-- Heartbeat "live" indicator: instant attack, gradual Mazda-style decay -->
  <span
    class="relative flex size-2.5"
    aria-hidden="true">
    <span class="absolute inline-flex size-full animate-heartbeat-ring rounded-full bg-emerald-400"
    ></span>
    <span class="relative inline-flex size-2.5 rounded-full bg-emerald-500 animate-heartbeat"
    ></span>
  </span>

  <ClockIcon class="size-4 text-muted-foreground" />

  <span class="font-medium tracking-wide">{time} {period}</span>

  <span class="hidden text-muted-foreground/50 sm:inline">·</span>
  <span class="hidden text-muted-foreground sm:inline">{date}</span>
</div>
