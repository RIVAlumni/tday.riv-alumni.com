<script lang="ts">
  import PageSidebarRight from '../page-sidebar-right.svelte';
  import DataCards from './data-cards.svelte';
  import PageActivity from './page-activity.svelte';
  import InputSearchBar from './input-search-bar.svelte';

  const data = {
    events: ['Teachers Day 2024', 'Teachers Day 2025', 'Teachers Day 2026'],
  };
</script>

<PageSidebarRight>
  <PageActivity events={data.events} />
</PageSidebarRight>

<DataCards />

<InputSearchBar />
