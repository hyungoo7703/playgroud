<script>
  import { onMount } from 'svelte';
  import Header from './lib/Header.svelte';
  import SideMenu from './lib/SideMenu.svelte';
  import { currentPage } from './lib/store.js';

  // Page Components
  import Home from './routes/Home.svelte';
  import EventList from './routes/EventList.svelte';
  import Settings from './routes/Settings.svelte';
  import PensionCalculator from './routes/PensionCalculator.svelte';
  import FoodSpinner from './routes/FoodSpinner.svelte';
  import Login from './routes/Login.svelte';
  import BulletinBoard from './routes/BulletinBoard.svelte'; // New Import
  import Ledger from './routes/Ledger.svelte'; // New Import

  onMount(() => {
    const accessCode = localStorage.getItem('accessCode');
    if (!accessCode) {
      currentPage.set('login');
    }
  });
</script>

<div class="relative min-h-screen bg-gray-100 dark:bg-gray-900">
  {#if $currentPage !== 'login'}
    <Header />
    <SideMenu />
  {/if}

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
    {:else if $currentPage === 'bulletin-board'}  <!-- New Route -->
      <BulletinBoard />
    {:else if $currentPage === 'ledger'} <!-- New Route -->
      <Ledger />
    {:else if $currentPage === 'login'}
      <Login />
    {/if}
  </main>
</div>
