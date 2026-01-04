<script>
  import { onMount } from 'svelte';
  import { Router, Route, navigate, useLocation } from 'svelte-routing';

  import Header from './lib/Header.svelte';
  import SideMenu from './lib/SideMenu.svelte';

  // Page Components
  import Home from './routes/Home.svelte';
  import EventList from './routes/EventList.svelte';
  import Settings from './routes/Settings.svelte';
  import PensionCalculator from './routes/PensionCalculator.svelte';
  import FoodSpinner from './routes/FoodSpinner.svelte';
  import Login from './routes/Login.svelte';
  import BulletinBoard from './routes/BulletinBoard.svelte';
  import Ledger from './routes/Ledger.svelte';

  const location = useLocation();

  onMount(() => {
    const accessCode = localStorage.getItem('accessCode');
    if (!accessCode) {
      navigate('/login', { replace: true });
    }
  });
</script>

<Router>
  <div class="relative min-h-screen bg-gray-100 dark:bg-gray-900">
    {#if $location && $location.pathname !== '/login'}
      <Header />
      <SideMenu />
    {/if}

    <main class="p-4 sm:p-6">
      <Route path="/" component={Home} />
      <Route path="/events" component={EventList} />
      <Route path="/pension-calculator" component={PensionCalculator} />
      <Route path="/food-spinner" component={FoodSpinner} />
      <Route path="/settings" component={Settings} />
      <Route path="/bulletin-board" component={BulletinBoard} />
      <Route path="/ledger" component={Ledger} />
      <Route path="/login" component={Login} />
    </main>
  </div>
</Router>
