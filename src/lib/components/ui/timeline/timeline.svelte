<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef } from '$lib/utils.js';

  import { setTimelineContext, type TimelineOrientation } from './timeline-context.js';

  let {
    ref = $bindable(null),
    defaultValue = 1,
    value = $bindable(),
    orientation = 'vertical',
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    defaultValue?: number;
    value?: number;
    orientation?: TimelineOrientation;
  } = $props();

  const activeStep = $derived(value ?? defaultValue);

  setTimelineContext({
    activeStep: () => activeStep,
    orientation: () => orientation,
  });
</script>

<div
  bind:this={ref}
  data-slot="timeline"
  data-orientation={orientation}
  class={cn(
    'group/timeline flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
    className,
  )}
  {...restProps}>
  {@render children?.()}
</div>
