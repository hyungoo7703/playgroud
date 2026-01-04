<script>
  import { onMount } from 'svelte';
  import { Route, navigate, useLocation } from 'svelte-routing';
  import { base, deferredPrompt, isLoggedIn } from './store.js';

  import Header from './Header.svelte';
  import SideMenu from './SideMenu.svelte';

  // Page Components
  import Home from '../routes/Home.svelte';
  import EventList from '../routes/EventList.svelte';
  import Settings from '../routes/Settings.svelte';
  import PensionCalculator from '../routes/PensionCalculator.svelte';
  import FoodSpinner from '../routes/FoodSpinner.svelte';
  import Login from '../routes/Login.svelte';
  import BulletinBoard from '../routes/BulletinBoard.svelte';
  import Ledger from '../routes/Ledger.svelte';

  const location = useLocation();

  // 1. 로그인 상태를 체크하여 리다이렉트하는 함수
  function checkAuth() {
    const loginPath = `${base}/login`;
    if (!$isLoggedIn && $location.pathname !== loginPath) {
      navigate(loginPath, { replace: true });
    }
  }

  // 2. 초기 마운트 시 실행
  onMount(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('${base}/sw.js')
        .then(() => console.log("SW Registered!"))
        .catch(err => console.error("SW Registration failed:", err));
    }
    checkAuth();
  });

  // 3. 상태 변화(로그인 여부, 경로 변경) 시마다 체크
  $: $isLoggedIn, $location.pathname, checkAuth();

  // 브라우저가 설치 가능함을 알릴 때 이벤트 저장
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // 기본 팝업 방지
      deferredPrompt.set(e); // 이벤트를 스토어에 저장
    });

    // 설치 완료 시 이벤트 초기화
    window.addEventListener('appinstalled', () => {
      deferredPrompt.set(null);
    });
  }
</script>

<div class="relative min-h-screen bg-gray-100 dark:bg-gray-900">
  {#if $isLoggedIn && $location.pathname !== '${base}/login'}
    <Header />
    <SideMenu />
  {/if}

  <main class="p-4 sm:p-6">
    {#if !$isLoggedIn}
      <Login />
    {:else}
      <Route path="/" component={Home} />
      <Route path="/events" component={EventList} />
      <Route path="/pension-calculator" component={PensionCalculator} />
      <Route path="/food-spinner" component={FoodSpinner} />
      <Route path="/settings" component={Settings} />
      <Route path="/bulletin-board" component={BulletinBoard} />
      <Route path="/ledger" component={Ledger} />
    {/if}
  </main>
</div>