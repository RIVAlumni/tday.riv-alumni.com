<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef } from '$lib/utils.js';

  import { getTimelineContext } from './timeline-context.js';

  let {
    ref = $bindable(null),
    step,
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    step: number;
  } = $props();

  const timeline = getTimelineContext();
  const completed = $derived(step <= timeline.activeStep());
</script>

<div
  bind:this={ref}
  data-slot="timeline-item"
  data-completed={completed || undefined}
  class={cn(
    'group/timeline-item relative flex flex-1 flex-col gap-0.5 group-data-[orientation=vertical]/timeline:ms-8 group-data-[orientation=horizontal]/timeline:mt-8 group-data-[orientation=horizontal]/timeline:not-last:pe-8 group-data-[orientation=vertical]/timeline:not-last:pb-6 has-[+[data-completed]]:**:data-[slot=timeline-separator]:bg-primary',
    className,
  )}
  {...restProps}>
  {@render children?.()}
</div>
