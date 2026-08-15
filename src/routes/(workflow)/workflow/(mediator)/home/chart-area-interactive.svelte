<script lang="ts">
  import * as Chart from '$lib/components/ui/chart/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
  import { scaleUtc } from 'd3-scale';
  import { Area, AreaChart } from 'layerchart';
  import { curveNatural } from 'd3-shape';

  import { browser } from '$app/env';

  import { fetchRegistrationsByDay } from '$lib/firebase';
  import { eventStore } from '$lib/stores/event.svelte';
  import {
    seriesFromCounts,
    sgtDayRanges,
    type RegistrationSeriesPoint,
  } from '$lib/util/registration-series';

  const RANGE_DAYS: Record<string, number> = {
    '7d': 7,
    '15d': 15,
    '30d': 30,
  };

  let timeRange = $state('7d');
  let chartData = $state<RegistrationSeriesPoint[]>([]);
  let error = $state<Error | null>(null);
  let requestSequence = 0;

  const selectedLabel = $derived.by(() => {
    switch (timeRange) {
      case '15d':
        return 'Last 15 days';
      case '30d':
        return 'Last 30 days';
      default:
        return 'Last 7 days';
    }
  });

  $effect(() => {
    const eventId = eventStore.activeEventId;
    const days = RANGE_DAYS[timeRange] ?? 7;
    if (!browser) return;

    const sequence = ++requestSequence;
    error = null;
    const ranges = sgtDayRanges(days);
    Promise.all(ranges.map((range) => fetchRegistrationsByDay(eventId, range.start, range.end)))
      .then((counts) => {
        if (sequence !== requestSequence || eventId !== eventStore.activeEventId) return;
        chartData = seriesFromCounts(ranges, counts);
      })
      .catch((queryError) => {
        if (sequence !== requestSequence) return;
        chartData = [];
        error = queryError as Error;
      });
  });

  const chartConfig = {
    registrations: { label: 'Registrations', color: 'var(--primary)' },
  } satisfies Chart.ChartConfig;
</script>

<Card.Root class="@container/card">
  <Card.Header>
    <Card.Title>Registrations over time</Card.Title>
    <Card.Description>
      <span class="hidden @[540px]/card:block"> {selectedLabel} </span>
      <span class="@[540px]/card:hidden">{selectedLabel}</span>
    </Card.Description>
    <Card.Action>
      <ToggleGroup.Root
        type="single"
        bind:value={timeRange}
        variant="outline"
        class="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex">
        <ToggleGroup.Item value="7d">Last 7 days</ToggleGroup.Item>
        <ToggleGroup.Item value="15d">Last 15 days</ToggleGroup.Item>
        <ToggleGroup.Item value="30d">Last 30 days</ToggleGroup.Item>
      </ToggleGroup.Root>
      <Select.Root
        type="single"
        bind:value={timeRange}>
        <Select.Trigger
          size="sm"
          class="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
          aria-label="Select a value">
          <span data-slot="select-value">
            {selectedLabel}
          </span>
        </Select.Trigger>
        <Select.Content class="rounded-xl">
          <Select.Item
            value="7d"
            class="rounded-lg">Last 7 days</Select.Item>
          <Select.Item
            value="15d"
            class="rounded-lg">Last 15 days</Select.Item>
          <Select.Item
            value="30d"
            class="rounded-lg">Last 30 days</Select.Item>
        </Select.Content>
      </Select.Root>
    </Card.Action>
  </Card.Header>
  <Card.Content class="px-2 pt-4 sm:px-6 sm:pt-6">
    {#if error}
      <p
        class="text-destructive text-sm"
        role="alert">
        Unable to load registration counts: {error.message}
      </p>
    {/if}
    <Chart.Container
      config={chartConfig}
      class="aspect-auto h-62.5 w-full">
      <AreaChart
        legend
        data={chartData}
        x="date"
        xScale={scaleUtc()}
        series={[
          {
            key: 'registrations',
            label: 'Registrations',
            color: chartConfig.registrations.color,
          },
        ]}
        props={{
          xAxis: {
            ticks: RANGE_DAYS[timeRange] ?? 7,
            format: (v: Date) => {
              return v.toLocaleDateString('en-SG', {
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Singapore',
              });
            },
          },
          yAxis: { format: () => '' },
        }}>
        {#snippet marks({ context })}
          <defs>
            <linearGradient
              id="fillRegistrations"
              x1="0"
              y1="0"
              x2="0"
              y2="1">
              <stop
                offset="5%"
                stop-color="var(--color-registrations)"
                stop-opacity={1.0} />
              <stop
                offset="95%"
                stop-color="var(--color-registrations)"
                stop-opacity={0.1} />
            </linearGradient>
          </defs>
          {#each context.series.visibleSeries as s (s.key)}
            <Area
              seriesKey={s.key}
              curve={curveNatural}
              fillOpacity={0.4}
              line={{ class: 'stroke-1' }}
              motion="tween"
              {...s.props}
              fill="url(#fillRegistrations)" />
          {/each}
        {/snippet}
        {#snippet tooltip()}
          <Chart.Tooltip
            labelFormatter={(v: Date) => {
              return v.toLocaleDateString('en-SG', {
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Singapore',
              });
            }}
            indicator="line" />
        {/snippet}
      </AreaChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
