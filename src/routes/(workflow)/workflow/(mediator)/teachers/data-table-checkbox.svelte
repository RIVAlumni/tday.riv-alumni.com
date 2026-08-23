<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    'aria-label': ariaLabel = 'Toggle select',
    onCheckedChange = () => {},
  }: {
    'checked'?: boolean;
    'indeterminate'?: boolean;
    'aria-label'?: string;
    'onCheckedChange'?: (checked: boolean) => void;
  } = $props();

  function handleChange(next: boolean): void {
    checked = next;
    onCheckedChange(next);
  }
</script>

<Checkbox
  bind:checked
  {indeterminate}
  aria-label={ariaLabel}
  onCheckedChange={handleChange} />
