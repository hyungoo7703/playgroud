<script>
  import Header from './lib/Header.svelte';
  import SideMenu from './lib/SideMenu.svelte';
  import { currentPage } from './lib/store.js';

  // Page Components
  import Home from './routes/Home.svelte';
  import EventList from './routes/EventList.svelte';
  import Settings from './routes/Settings.svelte';
  import PensionCalculator from './routes/PensionCalculator.svelte';
  import FoodSpinner from './routes/FoodSpinner.svelte';
</script>

<div class="relative min-h-screen bg-gray-100 dark:bg-gray-900">
  <Header />
  <SideMenu />

  <main class="p-4 sm:p-6">
    {#if $currentPage === 'home'}
      <Home />
    {:else if $currentPage === 'events'}
      <EventList />
    {:else if $currentPage === 'pension-calculator'}
      <PensionCalculator />
    {:else if $currentPage === 'food-spinner'}
      <FoodSpinner />
    {:else if $currentPage === 'settings'}
      <Settings />
    {/if}
  </main>
</div>
