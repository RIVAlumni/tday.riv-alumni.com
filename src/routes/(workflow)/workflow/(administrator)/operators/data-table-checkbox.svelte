<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    ariaLabel = 'Toggle selection',
    disabled = false,
    onCheckedChange = () => {},
  }: {
    checked?: boolean;
    indeterminate?: boolean;
    ariaLabel?: string;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  } = $props();

  function handleChange(next: boolean): void {
    checked = next;
    onCheckedChange(next);
  }
</script>

<Checkbox
  bind:checked
  {indeterminate}
  {disabled}
  aria-label={ariaLabel}
  onCheckedChange={handleChange} />
