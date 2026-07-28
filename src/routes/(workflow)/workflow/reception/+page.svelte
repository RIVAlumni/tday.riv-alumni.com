<script lang="ts">
  import { user } from '$lib/data/nav';

  import PageSidebarRight from '../page-sidebar-right.svelte';
  import DataCards from './data-cards.svelte';
  import PageActivity from './page-activity.svelte';
  import Watermark from './watermark.svelte';
  import InputSearchBar from './input-search-bar.svelte';

  const data = {
    events: ['Teachers Day 2024', 'Teachers Day 2025', 'Teachers Day 2026'],
  };
</script>

<Watermark
  name={user.name}
  email={user.email} />

<PageSidebarRight>
  <PageActivity events={data.events} />
</PageSidebarRight>

<DataCards />

<InputSearchBar />
