<script lang="ts">
  import { HugeiconsIcon } from '@hugeicons/svelte';
  import type { IconSvgElement } from '@hugeicons/svelte';

  interface Props {
    icon: IconSvgElement;
    size?: string | number;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
    color?: string;
    class?: string;
    /** @deprecated Use `class` prop instead. */
    className?: string;
  }

  let {
    icon,
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth = false,
    color = 'currentColor',
    class: className = '',
    className: legacyClassName = '',
  }: Props = $props();

  const finalClass = $derived(className || legacyClassName);
</script>

<HugeiconsIcon
  {icon}
  {size}
  {strokeWidth}
  {absoluteStrokeWidth}
  {color}
  class={finalClass}
/>
