<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { currentPage } from '../lib/store.js';

  let monthlyEvents = [];

  onMount(async () => {
    try {
      const response = await fetch('./data.json');
      if (!response.ok) {
        throw new Error('데이터를 불러오는 데 실패했습니다.');
      }
      const data = await response.json();
      
      const today = new Date();
      const currentMonth = today.getMonth() + 1;

      monthlyEvents = data.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() + 1 === currentMonth;
      });

    } catch (e) {
      console.error(e);
    }
  });

  function formatDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return { month, day };
  }

  // 주요 기능 카드 데이터
  const features = [
    { id: 'tax', page: 'pension-calculator', title: '연금저축펀드 계산기', desc: '내 돈 지키는 세액공제 확인', icon: '💰', color: 'bg-blue-500' },
    { id: 'food', page: 'food-spinner', title: '오늘 뭐 먹지?', desc: '결정장애 해결! 식당 룰렛', icon: '🎲', color: 'bg-orange-500' }
  ];

  function navigateTo(page) {
    if (page) {
      currentPage.set(page);
    } else {
      alert('아직 준비 중인 기능입니다.');
    }
  }
</script>

<div class="space-y-8 pb-10">
  
  <header in:fade={{ duration: 800 }} class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl">
    <div class="relative z-10">
      <h1 class="text-4xl font-extrabold mb-2 tracking-tight">
        가족의 공간
      </h1>
      <p class="text-lg opacity-90 font-medium">대충 만든 사이트!</p>
    </div>
    
    <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
    <div class="absolute -left-10 -top-10 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl"></div>
  </header>

  <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each features as card, i}
      <button 
        on:click={() => navigateTo(card.page)}
        in:fly={{ y: 20, delay: 200 * i, duration: 500 }}
        class="group relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-left transition-all hover:-translate-y-2 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!card.page}
      >
        <div class="{card.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
          {card.icon}
        </div>
        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-1">{card.title}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">{card.desc}</p>
        
        <div class="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="text-gray-400">→</span>
        </div>
      </button>
    {/each}
  </section>

  <section in:fade={{ delay: 800 }} class="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold flex items-center gap-2">
        <span>📅</span> 이번 달 가족 소식
      </h2>
      <button on:click={() => currentPage.set('events')} class="text-xs text-blue-500 hover:underline">모두 보기</button>
    </div>
    
    <ul class="space-y-3">
      {#if monthlyEvents.length > 0}
        {#each monthlyEvents as event (event.id)}
          <li class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
            <div class="text-center bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm">
              <p class="text-xs text-gray-400">{formatDate(event.date).month}</p>
              <p class="font-bold text-lg text-indigo-500">{formatDate(event.date).day}</p>
            </div>
            <div>
              <p class="font-bold text-sm text-gray-800 dark:text-gray-200">{event.title}</p>
            </div>
          </li>
        {/each}
      {:else}
        <li class="text-center py-4 text-gray-500 dark:text-gray-400">
          이번 달에는 예정된 일정이 없습니다.
        </li>
      {/if}
      </ul>
  </section>
</div>

<style>
  /* 폰트나 세부 애니메이션은 Tailwind로 대부분 처리 가능 */
</style>