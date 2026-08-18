<script lang="ts">
  import type { User } from '$lib/models/user';

  import * as Select from '$lib/components/ui/select';
  import { Label } from '$lib/components/ui/label';
  import { ACCESS_LEVEL_NAMES } from '$lib/data/access';
  import { AccessLevel } from '$lib/models/user';

  let {
    user,
    onUpdate,
  }: {
    user: User;
    onUpdate: (uid: string, accessLevel: AccessLevel) => Promise<void>;
  } = $props();

  const accessLevels = [
    AccessLevel.None,
    AccessLevel.Operator,
    AccessLevel.Mediator,
    AccessLevel.Administrator,
  ];

  let selected = $state('');
  let saving = $state(false);

  $effect(() => {
    if (!saving) selected = String(user.access_level);
  });

  async function updateAuthorization(value: string): Promise<void> {
    const accessLevel = Number(value) as AccessLevel;
    if (accessLevel === user.access_level || saving) return;

    const previous = selected;
    selected = value;
    saving = true;
    try {
      await onUpdate(user.uid, accessLevel);
    } catch {
      selected = previous;
    } finally {
      saving = false;
    }
  }
</script>

<Label
  for={`${user.uid}-authorization`}
  class="sr-only">Authorization</Label>
<Select.Root
  type="single"
  disabled={saving}
  bind:value={() => selected, (value) => void updateAuthorization(value)}>
  <Select.Trigger
    class="w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
    size="sm"
    id={`${user.uid}-authorization`}>
    <span data-slot="select-value">
      {saving ? 'Saving...' : ACCESS_LEVEL_NAMES[Number(selected) as AccessLevel]}
    </span>
  </Select.Trigger>
  <Select.Content align="end">
    <Select.Group>
      {#each accessLevels as accessLevel (accessLevel)}
        <Select.Item value={String(accessLevel)}>
          {ACCESS_LEVEL_NAMES[accessLevel]}
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
