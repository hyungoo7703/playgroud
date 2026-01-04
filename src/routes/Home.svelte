<script>
  // ... 기존 스크립트 로직 유지 ...
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { navigate } from 'svelte-routing';

  let monthlyEvents = [];
  let isLoading = true;
  const userName = localStorage.getItem('userName') || '가족';
  const GAS_URL = "https://script.google.com/macros/s/AKfycbyXKahb3Xbi6B1IUXYVKrunW776GaPnS0LxbcQ4BycnzpXXkZiMMNwX4SVNuUA2ExfO/exec";

  onMount(async () => {
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ action: 'getEvents' })
      });
      const result = await response.json();
      
      if (result.success) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        monthlyEvents = result.events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    } finally {
      isLoading = false;
    }
  });

  function navigateTo(page) {
    navigate('/' + page);
  }

  function getDay(dateString) {
    return new Date(dateString).getDate();
  }
</script>

<div class="px-4 py-6 space-y-6 max-w-md mx-auto pb-20">
  
  <header in:fade={{ duration: 800 }} class="relative overflow-hidden rounded-[2.5rem] bg-gray-900 p-8 text-white shadow-2xl">
    <div class="relative z-10">
      <span class="text-indigo-400 font-bold text-sm tracking-widest uppercase">Welcome back</span>
      <h1 class="text-3xl font-black mt-1 leading-tight">
        {userName}님,<br/>오늘도 반갑습니다!
      </h1>
    </div>
    <div class="absolute -right-10 -top-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
  </header>

  <section class="grid grid-cols-3 gap-3">
    <button on:click={() => navigateTo('events')} class="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">
      <div class="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-xl mb-2">📅</div>
      <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300">가족 일정</span>
    </button>
    <button on:click={() => navigateTo('bulletin-board')} class="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">
      <div class="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center text-xl mb-2">💬</div>
      <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300">가족 게시판</span>
    </button>
    <button on:click={() => navigateTo('ledger')} class="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">
      <div class="w-10 h-10 bg-yellow-50 rounded-2xl flex items-center justify-center text-xl mb-2">💰</div>
      <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300">장부</span>
    </button>
  </section>

  <section in:fly={{ x: -20, delay: 200 }} class="relative">
    <button 
      on:click={() => navigateTo('food-spinner')}
      class="w-full flex items-center justify-between p-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] text-white shadow-lg active:scale-[0.98] transition-all overflow-hidden"
    >
      <div class="relative z-10 text-left">
        <h3 class="font-black text-lg">오늘 뭐 먹지? 🎰</h3>
        <p class="text-xs opacity-80">고민될 땐 룰렛을 돌려보세요!</p>
      </div>
      <div class="relative z-10 bg-white/20 p-2 rounded-xl backdrop-blur-md">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
      </div>
      <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
    </button>
  </section>

  <section in:fly={{ y: 20, delay: 400 }} class="p-6 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
        <span class="w-1.5 h-5 bg-indigo-600 rounded-full"></span>
        이번 달 일정
      </h2>
      <button on:click={() => navigateTo('events')} class="text-xs font-bold text-indigo-600">전체보기</button>
    </div>
    
    <div class="space-y-4">
      {#if isLoading}
        <div class="animate-pulse flex flex-col gap-3">
          <div class="h-16 bg-gray-50 rounded-2xl"></div>
        </div>
      {:else if monthlyEvents.length > 0}
        {#each monthlyEvents as event (event.id)}
          <li class="list-none flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
            <div class="flex flex-col items-center justify-center min-w-[3rem] h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <span class="text-[10px] font-bold text-gray-400 uppercase">{new Date().toLocaleString('en-US', {month: 'short'})}</span>
              <span class="text-lg font-black text-indigo-600 leading-none">{getDay(event.date)}</span>
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-[10px] font-bold text-indigo-400 truncate uppercase">{event.category}</p>
              <p class="font-bold text-gray-800 dark:text-gray-200 truncate">{event.title}</p>
            </div>
          </li>
        {/each}
      {:else}
        <div class="text-center py-8">
          <p class="text-sm text-gray-400">예정된 일정이 없습니다. ☕</p>
        </div>
      {/if}
    </div>
  </section>
</div>