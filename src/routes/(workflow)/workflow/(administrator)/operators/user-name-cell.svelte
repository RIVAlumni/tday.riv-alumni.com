<script lang="ts">
  import type { User } from '$lib/models/user';

  import { tick } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Cancel01Icon, CheckIcon, PencilEdit01Icon } from '$lib/icons';

  let {
    user,
    onUpdate,
  }: {
    user: User;
    onUpdate: (uid: string, displayName: string) => Promise<void>;
  } = $props();

  const inputId = $props.id();

  let editing = $state(false);
  let draft = $state('');
  let saving = $state(false);
  let validationError = $state<string | null>(null);
  let inputElement = $state<HTMLInputElement | null>(null);

  async function startEditing(): Promise<void> {
    draft = user.display_name;
    validationError = null;
    editing = true;
    await tick();
    inputElement?.focus();
    inputElement?.select();
  }

  function cancelEditing(): void {
    if (saving) return;
    draft = user.display_name;
    validationError = null;
    editing = false;
  }

  async function saveName(): Promise<void> {
    if (saving) return;

    const displayName = draft.trim();
    if (displayName.length === 0) {
      validationError = 'Enter a full name.';
      inputElement?.focus();
      return;
    }
    if (displayName.length > 120) {
      validationError = 'Full name must be 120 characters or fewer.';
      inputElement?.focus();
      return;
    }
    if (displayName === user.display_name) {
      editing = false;
      return;
    }

    saving = true;
    validationError = null;
    try {
      await onUpdate(user.uid, displayName);
      draft = displayName;
      editing = false;
    } catch {
      validationError = 'The full name could not be saved.';
      inputElement?.focus();
    } finally {
      saving = false;
    }
  }

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void saveName();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    cancelEditing();
  }
</script>

{#if editing}
  <form
    class="min-w-64"
    novalidate
    onsubmit={handleSubmit}>
    <Field.Group class="gap-1">
      <Field.Field
        class="gap-1"
        data-invalid={validationError !== null}>
        <Field.Label
          for={inputId}
          class="sr-only">Full Name</Field.Label>
        <div class="flex items-center gap-1">
          <Input
            bind:ref={inputElement}
            bind:value={draft}
            id={inputId}
            maxlength={120}
            autocomplete="off"
            disabled={saving}
            aria-invalid={validationError !== null}
            aria-busy={saving}
            onkeydown={handleKeydown} />
          <Button
            type="submit"
            size="icon-sm"
            disabled={saving}
            aria-label={`Save full name for ${user.display_name}`}>
            <CheckIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={saving}
            aria-label={`Cancel editing ${user.display_name}`}
            onclick={cancelEditing}>
            <Cancel01Icon />
          </Button>
        </div>
        {#if validationError}
          <Field.Error>{validationError}</Field.Error>
        {/if}
      </Field.Field>
    </Field.Group>
  </form>
{:else}
  <div class="flex min-w-0 items-center gap-1">
    <div class="min-w-0">
      <p class="truncate font-medium">{user.display_name}</p>
      <p class="truncate text-xs text-muted-foreground">{user.email}</p>
    </div>
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={`Edit full name for ${user.display_name}`}
      onclick={() => void startEditing()}>
      <PencilEdit01Icon />
    </Button>
  </div>
{/if}
