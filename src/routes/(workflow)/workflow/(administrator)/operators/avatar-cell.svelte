<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';

  let { name }: { name: string } = $props();

  const initials = $derived(
    name
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?',
  );
</script>

<Avatar.Root class="size-8">
  <Avatar.Fallback>{initials}</Avatar.Fallback>
</Avatar.Root>
