<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> = $props();
</script>

<div
  bind:this={ref}
  aria-hidden="true"
  data-slot="timeline-indicator"
  class={cn(
    'absolute size-4 rounded-full border-2 border-primary/20 group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:left-0 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:top-0 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-completed/timeline-item:border-primary [&>svg]:pointer-events-none [&>svg]:size-3',
    className,
  )}
  {...restProps}>
  {@render children?.()}
</div>
