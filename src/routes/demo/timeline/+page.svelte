<script lang="ts">
  import * as Timeline from '$lib/components/ui/timeline/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Cancel01Icon, CheckIcon } from '$lib/icons';
  import { cn } from '$lib/utils';

  const deployments = [
    {
      id: 1,
      title: 'Production Deploy',
      date: '2 minutes ago',
      commit: 'a1b2c3d',
      branch: 'main',
      status: 'success',
      duration: '42s',
    },
    {
      id: 2,
      title: 'Staging Deploy',
      date: '15 minutes ago',
      commit: 'e4f5g6h',
      branch: 'staging',
      status: 'success',
      duration: '38s',
    },
    {
      id: 3,
      title: 'Preview Deploy',
      date: '1 hour ago',
      commit: 'i7j8k9l',
      branch: 'feat/auth',
      status: 'failed',
      duration: '1m 12s',
    },
    {
      id: 4,
      title: 'Production Deploy',
      date: '3 hours ago',
      commit: 'm0n1o2p',
      branch: 'main',
      status: 'success',
      duration: '45s',
    },
  ] as const;
</script>

<svelte:head>
  <title>Timeline Demo</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-6">
  <Timeline.Root
    defaultValue={deployments.length}
    class="w-full max-w-sm"
    aria-label="Deployment history">
    {#each deployments as deployment (deployment.id)}
      <Timeline.Item
        step={deployment.id}
        class="group-data-[orientation=vertical]/timeline:ms-10">
        <Timeline.Header>
          <Timeline.Separator
            class="bg-input! group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
          <div class="flex items-center gap-2">
            <Timeline.Title>{deployment.title}</Timeline.Title>
            <Badge variant={deployment.status === 'success' ? 'secondary' : 'destructive'}>
              {deployment.status}
            </Badge>
          </div>
          <Timeline.Indicator
            class={cn(
              'flex size-6 items-center justify-center border-none group-data-[orientation=vertical]/timeline:-left-7',
              deployment.status === 'success'
                ? 'bg-primary text-primary-foreground'
                : 'bg-destructive text-background',
            )}>
            {#if deployment.status === 'success'}
              <CheckIcon />
            {:else}
              <Cancel01Icon />
            {/if}
          </Timeline.Indicator>
        </Timeline.Header>
        <Timeline.Content class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <code>{deployment.commit}</code>
            <span aria-hidden="true">&middot;</span>
            <span>{deployment.branch}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{deployment.duration}</span>
          </div>
          <Timeline.Date class="mb-0">{deployment.date}</Timeline.Date>
        </Timeline.Content>
      </Timeline.Item>
    {/each}
  </Timeline.Root>
</main>
