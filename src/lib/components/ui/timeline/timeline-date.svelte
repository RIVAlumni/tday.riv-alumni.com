<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLTimeElement>, HTMLTimeElement> = $props();
</script>

<time
  bind:this={ref}
  data-slot="timeline-date"
  class={cn(
    'mb-1 block text-xs font-medium text-muted-foreground group-data-[orientation=vertical]/timeline:max-sm:h-4',
    className,
  )}
  {...restProps}>
  {@render children?.()}
</time>
