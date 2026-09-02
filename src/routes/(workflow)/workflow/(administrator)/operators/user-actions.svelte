<script lang="ts">
  import type { User } from '$lib/models/user';

  import { Button } from '$lib/components/ui/button/index.js';
  import { BanIcon } from '$lib/icons';

  let {
    user,
    disabled = false,
    onRevoke,
  }: {
    user: User;
    disabled?: boolean;
    onRevoke: (user: User) => void;
  } = $props();
</script>

<Button
  variant="destructive"
  size="xs"
  {disabled}
  aria-label={`Revoke access for ${user.display_name}`}
  onclick={() => onRevoke(user)}>
  <BanIcon />
  Revoke access
</Button>
