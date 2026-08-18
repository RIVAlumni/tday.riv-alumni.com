<script lang="ts">
  import type { User } from '$lib/models/user';

  import { Timestamp } from 'firebase/firestore';

  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let {
    user,
    onUpdate,
  }: {
    user: User;
    onUpdate: (uid: string, accessExpires: Timestamp) => Promise<void>;
  } = $props();

  const SINGAPORE_OFFSET_MILLISECONDS = 8 * 60 * 60 * 1000;

  let selected = $state('');
  let saving = $state(false);

  function singaporeDate(timestamp: Timestamp): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(timestamp.toDate());
    const part = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((value) => value.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  function singaporeEndOfDay(value: string): Timestamp {
    const [year, month, day] = value.split('-').map(Number);
    return Timestamp.fromMillis(
      Date.UTC(year, month - 1, day + 1) - SINGAPORE_OFFSET_MILLISECONDS - 1,
    );
  }

  $effect(() => {
    if (!saving) selected = singaporeDate(user.access_expires);
  });

  async function updateExpiry(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const value = input.value;
    if (!value) {
      input.value = selected;
      return;
    }
    if (value === selected || saving) return;

    const previous = selected;
    selected = value;
    saving = true;
    try {
      await onUpdate(user.uid, singaporeEndOfDay(value));
    } catch {
      selected = previous;
    } finally {
      saving = false;
    }
  }
</script>

<Label
  for={`${user.uid}-access-expires`}
  class="sr-only">Access Expires</Label>
<Input
  id={`${user.uid}-access-expires`}
  type="date"
  class="w-40 text-sm"
  value={selected}
  disabled={saving}
  aria-busy={saving}
  required
  onchange={(event) => void updateExpiry(event)} />
