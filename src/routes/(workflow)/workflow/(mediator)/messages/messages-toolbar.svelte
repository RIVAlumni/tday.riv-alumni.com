<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Command from '$lib/components/ui/command/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { events } from '$lib/data/reception';
  import { TEACHER_OPTIONS } from '$lib/data/teachers';
  import { CheckIcon, Download01Icon, UnfoldMoreIcon } from '$lib/icons';
  import { eventStore } from '$lib/stores/event.svelte';

  let {
    selectedTeacher = $bindable('all'),
    loading = false,
    messageCount = 0,
    is2026Event = false,
    onEventChange,
    onDownload,
  }: {
    selectedTeacher?: string;
    loading?: boolean;
    messageCount?: number;
    is2026Event?: boolean;
    onEventChange?: (id: string) => void | Promise<void>;
    onDownload: () => void;
  } = $props();

  let teacherPopoverOpen = $state(false);

  const teacherFilterLabel = $derived(selectedTeacher === 'all' ? 'All teachers' : selectedTeacher);

  function setEventYear(id: string): void {
    teacherPopoverOpen = false;
    eventStore.setActiveEvent(id);
    void onEventChange?.(id);
  }
</script>

<div class="flex flex-col gap-3">
  <Field.Field class="max-w-sm">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          <Sidebar.MenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            {...props}>
            <div
              class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-heading text-xs font-semibold text-sidebar-primary-foreground">
              {eventStore.activeEvent.year.slice(-2)}
            </div>
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-semibold">{eventStore.activeEvent.title}</span>
              <span class="truncate text-xs text-muted-foreground">Reception Station</span>
            </div>
            <UnfoldMoreIcon class="ms-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        align="start"
        sideOffset={4}>
        <DropdownMenu.Group>
          {#each events as event (event.id)}
            <DropdownMenu.Item onSelect={() => setEventYear(event.id)}>
              <span
                class="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-heading text-[0.65rem] font-semibold text-muted-foreground">
                {event.year.slice(-2)}
              </span>
              <span class="flex-1">{event.title}</span>
              {#if event.id === eventStore.activeEventId}
                <CheckIcon class="ms-auto" />
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Field.Field>

  <Field.Field class="max-w-sm">
    <Field.FieldLabel for="messages-teacher">Teacher</Field.FieldLabel>
    <Popover.Root bind:open={teacherPopoverOpen}>
      <Popover.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          <Button
            id="messages-teacher"
            type="button"
            variant="ghost"
            class="w-full justify-between rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm font-normal"
            disabled={loading || !is2026Event}
            role="combobox"
            aria-expanded={teacherPopoverOpen}
            {...props}>
            <span class="min-w-0 flex-1 truncate text-left">{teacherFilterLabel}</span>
            <UnfoldMoreIcon
              strokeWidth={2}
              class="size-4 shrink-0 text-muted-foreground" />
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content
        align="start"
        class="w-96 max-w-[calc(100vw-2rem)] p-0">
        <Command.Root>
          <Command.Input
            autofocus
            placeholder="Search teachers..." />
          <Command.List>
            <Command.Empty>No teachers found.</Command.Empty>
            <Command.Group heading="Teachers">
              <Command.Item
                value="all"
                data-checked={selectedTeacher === 'all'}
                aria-selected={selectedTeacher === 'all'}
                onSelect={() => {
                  selectedTeacher = 'all';
                  teacherPopoverOpen = false;
                }}>
                <span>All teachers</span>
              </Command.Item>
              {#each TEACHER_OPTIONS as teacher (teacher)}
                <Command.Item
                  value={teacher}
                  data-checked={selectedTeacher === teacher}
                  aria-selected={selectedTeacher === teacher}
                  onSelect={() => {
                    selectedTeacher = teacher;
                    teacherPopoverOpen = false;
                  }}>
                  <span>{teacher}</span>
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.List>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
    {#if !is2026Event}
      <Field.FieldDescription>Available for the 2026 event only.</Field.FieldDescription>
    {/if}
  </Field.Field>

  <div class="flex flex-wrap items-center gap-2">
    <Button
      variant="default"
      disabled={loading || !is2026Event || messageCount === 0}
      onclick={onDownload}>
      <span data-icon="inline-start"><Download01Icon /></span>
      Download CSV
    </Button>
    <span class="text-sm text-muted-foreground">{messageCount} message(s)</span>
  </div>
</div>
