<script>
  import { onMount } from 'svelte';
  import { fade, scale, slide } from 'svelte/transition';

  // --- 상태 관리 변수 ---
  let foodList = [];       // 구글 시트에서 가져온 메뉴 리스트
  let spinning = false;    // 룰렛 회전 여부
  let responseult = '오늘 뭐 먹지?';
  let spinInterval;
  let isLoading = true;    // 초기 로딩 상태
  
  // --- 관리자/권한 관련 변수 ---
  let newItem = '';        // 추가할 새 메뉴 이름
  let isAdding = false;    // 메뉴 추가 통신 중 상태
  const userRole = localStorage.getItem('role'); // 로그인 시 저장된 역할 (admin/member)
  const GAS_URL = "https://script.google.com/macros/s/AKfycbyXKahb3Xbi6B1IUXYVKrunW776GaPnS0LxbcQ4BycnzpXXkZiMMNwX4SVNuUA2ExfO/exec";

  /** * 1. 메뉴 리스트 가져오기 (Read)
   * CORS 방지를 위해 헤더를 생략하고 redirect 설정을 추가했습니다.
   */
  async function fetchMenu() {
    isLoading = true;
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ action: 'getManagement', section: 'roulette' })
      });
      const data = await response.json();
      if (data.success) {
        foodList = data.data.map(item => item.value);
      }
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    } finally {
      isLoading = false;
    }
  }

  /**
   * 2. 관리자 메뉴 추가 (Create)
   */
  async function addMenuItem() {
    if (!newItem.trim() || isAdding) return;
    isAdding = true;

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ 
          action: 'addManagement', 
          section: 'roulette', 
          value: newItem 
        })
      });
      const data = await response.json();
      if (data.success) {
        newItem = '';
        await fetchMenu(); // 추가 후 목록 새로고침
      }
    } catch (e) {
      alert("추가 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      isAdding = false;
    }
  }

  /**
   * 3. 룰렛 돌리기 로직
   */
  function startSpin() {
    if (spinning || foodList.length === 0) return;
    
    spinning = true;
    if (navigator.vibrate) navigator.vibrate(50); // 모바일 진동 피드백

    // 80ms 간격으로 랜덤 메뉴 표시
    spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * foodList.length);
      responseult = foodList[randomIndex];
    }, 80);

    // 2.5초 후 멈춤
    setTimeout(() => {
      clearInterval(spinInterval);
      const finalIndex = Math.floor(Math.random() * foodList.length);
      responseult = foodList[finalIndex];
      spinning = false;
      if (navigator.vibrate) navigator.vibrate([100, 30, 100]); // 당첨 진동
    }, 2500);
  }

  onMount(fetchMenu);
</script>

<div class="px-4 py-8 max-w-md mx-auto space-y-8 pb-32">
  <header class="text-center space-y-2">
    <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">메뉴 룰렛 🎰</h2>
    <p class="text-sm text-slate-500 font-medium">우리 가족의 식사 고민을 해결해 드립니다!</p>
  </header>

  <div class="relative group">
    <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
    <div class="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[220px] flex items-center justify-center text-center">
      {#if isLoading}
        <div class="text-slate-400 animate-pulse font-bold">메뉴판 가져오는 중...</div>
      {:else}
        <div class="w-full">
          {#if spinning}
            <div in:scale={{duration: 100}} class="text-4xl font-black text-indigo-600 dark:text-indigo-400 animate-bounce">
              {responseult}
            </div>
          {:else}
            <div in:fade>
              {#if responseult.includes('오늘')}
                <span class="text-slate-200 dark:text-slate-800 text-7xl block mb-2">?</span>
                <p class="text-xl font-bold text-slate-400 italic">{responseult}</p>
              {:else}
                <span class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 block">오늘의 메뉴는?</span>
                <div class="text-4xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                  {responseult}
                </div>
                <p class="text-indigo-600 font-bold animate-pulse">🎉 당첨! 🎉</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <div class="space-y-6">
    <button 
      on:click={startSpin}
      disabled={spinning || isLoading || foodList.length === 0}
      class="w-full relative py-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-50"
    >
      <span class="relative z-10 text-xl font-bold text-white">
        {spinning ? '맛있는 거 고르는 중...' : '돌려 돌려 돌림판!'}
      </span>
    </button>

    {#if userRole === 'admin'}
      <div transition:slide class="bg-indigo-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-indigo-100 dark:border-slate-700">
        <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">🔧 관리자 전용: 메뉴 관리</h4>
        <div class="flex gap-2">
          <input 
            type="text" 
            bind:value={newItem}
            placeholder="새로운 메뉴 입력"
            class="flex-1 px-4 py-3 rounded-xl border-none text-sm bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500"
            on:keydown={(e) => e.key === 'Enter' && addMenuItem()}
          />
          <button 
            on:click={addMenuItem}
            disabled={isAdding || !newItem}
            class="px-5 bg-indigo-600 text-white rounded-xl font-bold text-sm disabled:bg-slate-400 transition-colors"
          >
            {isAdding ? '..' : '추가'}
          </button>
        </div>
      </div>
    {:else}
      <div transition:fade class="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
        <p class="text-sm text-slate-500 font-medium italic">
          💡 메뉴 추가는 관리자에게 부탁합니다!
        </p>
      </div>
    {/if}

    <div class="pt-4 px-2">
      <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">선택 가능한 후보 ({foodList.length})</h4>
      <div class="flex flex-wrap justify-center gap-2">
        {#each foodList as food}
          <span class="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[11px] font-bold border border-slate-200/50 dark:border-slate-700">
            {food}
          </span>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  /* 필요한 스타일은 Tailwind CSS 유틸리티로 대부분 처리됩니다. */
</style>