<script lang="ts">
  import { ArrowLeft01Icon as RawIcon } from '@hugeicons/core-free-icons';
  import HugeIcon from '$lib/components/HugeIcon.svelte';

  let {
    class: cls,
    size,
    strokeWidth,
    absoluteStrokeWidth,
    color,
    className,
  }: {
    size?: string | number;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
    color?: string;
    class?: string;
    className?: string;
  } = $props();
</script>

<HugeIcon
  icon={RawIcon}
  class={cls || className}
  {size}
  {strokeWidth}
  {absoluteStrokeWidth}
  {color}
/>
