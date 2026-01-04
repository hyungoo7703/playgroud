<script>
  import { Router } from 'svelte-routing';
  import { base } from './lib/store.js';
  import MainLayout from './lib/MainLayout.svelte';
</script>

<Router basepath={$base}>
  <MainLayout />
</Router>
