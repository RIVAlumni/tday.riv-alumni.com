<script lang="ts">
  import '../app.css';

  import { dev } from '$app/environment';
  import { authStore } from '$lib/stores';

  /**
   * Pre-load authentication state
   */
  $authStore;

  if (dev && typeof window !== 'undefined') console.log($authStore);
</script>

<div
  class="bg-background h-screen min-h-screen
					w-full text-white">
  <slot></slot>
</div>
