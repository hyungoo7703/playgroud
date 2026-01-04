<script>
  import { Router } from 'svelte-routing';
  import { base } from './store.js';
  import MainLayout from './lib/MainLayout.svelte';
</script>

<Router basepath={base}>
  <MainLayout />
</Router>
