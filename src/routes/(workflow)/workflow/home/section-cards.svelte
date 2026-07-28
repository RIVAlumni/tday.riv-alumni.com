<script lang="ts">
  import { ChartDownIcon, ChartUpIcon } from '$lib/icons';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
</script>

<div
  class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
  <Card.Root class="@container/card">
    <Card.Header>
      <Card.Description>Total Registrations</Card.Description>
      <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        550
      </Card.Title>
      <Card.Action>
        <Badge variant="outline">
          <ChartUpIcon />
          +12.5%
        </Badge>
      </Card.Action>
    </Card.Header>
    <Card.Footer class="flex-col items-start gap-1.5 text-sm">
      <div class="line-clamp-1 flex gap-2 font-medium">
        Trending up this year <ChartUpIcon class="size-4" />
      </div>
      <div class="text-muted-foreground">Registrations for the last year</div>
    </Card.Footer>
  </Card.Root>
  <Card.Root class="@container/card">
    <Card.Header>
      <Card.Description>Checked In</Card.Description>
      <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        334
      </Card.Title>
      <Card.Action>
        <Badge variant="outline">
          <ChartDownIcon />
          -20%
        </Badge>
      </Card.Action>
    </Card.Header>
    <Card.Footer class="flex-col items-start gap-1.5 text-sm">
      <div class="line-clamp-1 flex gap-2 font-medium">
        Down 20% this year <ChartDownIcon class="size-4" />
      </div>
      <div class="text-muted-foreground">Checked in attendees for the last year</div>
    </Card.Footer>
  </Card.Root>
  <Card.Root class="@container/card">
    <Card.Header>
      <Card.Description>Check-in Rate</Card.Description>
      <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        60.8%
      </Card.Title>
      <Card.Action>
        <Badge variant="outline">
          <ChartUpIcon />
          +12.5%
        </Badge>
      </Card.Action>
    </Card.Header>
    <Card.Footer class="flex-col items-start gap-1.5 text-sm">
      <div class="line-clamp-1 flex gap-2 font-medium">
        Strong user retention <ChartUpIcon class="size-4" />
      </div>
      <div class="text-muted-foreground">Engagement exceed targets</div>
    </Card.Footer>
  </Card.Root>
  <Card.Root class="@container/card">
    <Card.Header>
      <Card.Description>Peak Throughput</Card.Description>
      <Card.Title class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        99 per 15 mins
      </Card.Title>
      <Card.Action>
        <Badge variant="outline">
          <ChartUpIcon />
          +4.5%
        </Badge>
      </Card.Action>
    </Card.Header>
    <Card.Footer class="flex-col items-start gap-1.5 text-sm">
      <div class="line-clamp-1 flex gap-2 font-medium">
        Steady performance increase <ChartUpIcon class="size-4" />
      </div>
      <div class="text-muted-foreground">Meets growth projections</div>
    </Card.Footer>
  </Card.Root>
</div>
