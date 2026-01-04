<script>
  import { Router } from 'svelte-routing';
  import MainLayout from './lib/MainLayout.svelte';

  const base = import.meta.env.PROD ? '/playground' : '';
</script>

<Router basepath={base}>
  <MainLayout />
</Router>
