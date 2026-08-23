<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { Separator } from '$lib/components/ui/separator/index.js';
  import { cn } from '$lib/utils.js';

  import { getTimelineContext } from './timeline-context.js';

  type TimelineSeparatorProps = Omit<
    ComponentProps<typeof Separator>,
    'orientation' | 'decorative'
  >;

  let { ref = $bindable(null), class: className, ...restProps }: TimelineSeparatorProps = $props();

  const timeline = getTimelineContext();
</script>

<Separator
  bind:ref
  decorative
  orientation={timeline.orientation()}
  data-slot="timeline-separator"
  class={cn(
    'absolute self-start bg-primary/10 group-last/timeline-item:hidden group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:h-0.5 group-data-[orientation=horizontal]/timeline:w-[calc(100%-1rem-0.25rem)] group-data-[orientation=horizontal]/timeline:translate-x-4.5 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:h-[calc(100%-1rem-0.25rem)] group-data-[orientation=vertical]/timeline:w-0.5 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-[orientation=vertical]/timeline:translate-y-4.5',
    className,
  )}
  {...restProps} />
