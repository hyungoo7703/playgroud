<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { api } from '../lib/api.js';
  
  let events = [];
  let isLoading = true;
  
  // 폼 입력 상태
  let newDate = new Date().toISOString().split('T')[0];
  let newTitle = '';
  let newCategory = '일반';
  let isSubmitting = false;
  
  // 수정 모드 상태
  let editingId = null; 

  // D-Day 모달 상태
  let showDDayModal = false;

  async function fetchEvents() {
    isLoading = true;
    const res = await api.getEvents();
    if (res.success) {
      // 날짜순 정렬 (오름차순: 과거 -> 미래)
      events = res.events.sort((a, b) => a.date.localeCompare(b.date));
    }
    isLoading = false;
  }

  // 수정 버튼 클릭 시 실행
  function setEditMode(event) {
    editingId = event.id;
    newDate = event.date;
    newTitle = event.title;
    newCategory = event.category;
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 입력창으로 부드럽게 이동
  }

  // 취소 버튼
  function resetForm() {
    editingId = null;
    newDate = new Date().toISOString().split('T')[0];
    newTitle = ''; newCategory = '일반';
  }

  async function handleSubmit() {
    if (!newDate || !newTitle) return alert('모두 입력해주세요.');
    isSubmitting = true;

    const payload = {
      date: newDate,
      title: newTitle,
      category: newCategory
    };
    
    if (editingId) payload.id = editingId;

    try {
      const result = editingId 
        ? await api.updateEvent(payload)
        : await api.addEvent(payload);

      if (result.success) {
        resetForm();
        await fetchEvents();
      } else {
        alert(result.message);
      }
    } catch (e) {
      alert('통신 오류가 발생했습니다.');
    } finally {
      isSubmitting = false;
    }
  }

  function setDDay(event) {
    if (!confirm(`'${event.title}' 일정을 홈 화면 D-Day로 설정할까요?`)) return;
    localStorage.setItem('dDayEvent', JSON.stringify(event));
    showDDayModal = false;
    alert('설정되었습니다. 홈 화면에서 확인해보세요!');
  }

  // 미래 일정만 필터링 (오늘 포함)
  $: futureEvents = events.filter(e => e.date >= new Date().toISOString().split('T')[0]);

  onMount(fetchEvents);
</script>

<div class="p-4 max-w-md mx-auto space-y-6 pb-24">
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-black text-gray-900 dark:text-white">가족 일정</h2>
    {#if editingId}
      <span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-bold">수정 모드</span>
    {/if}
  </div>

  <!-- D-Day Button -->
  <button 
    on:click={() => showDDayModal = true}
    disabled={isLoading}
    class="w-full py-3 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-pink-100 dark:border-pink-800/50"
  >
    <span class="text-lg">🎉</span>
    홈 화면 D-Day 설정하기
  </button>

  <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-xl border-2 transition-all {editingId ? 'border-amber-400' : 'border-transparent'}">
    <div class="space-y-3">
      <div class="flex gap-2">
        <input type="date" bind:value={newDate} class="flex-[2] p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500" />
        <select bind:value={newCategory} class="flex-1 p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl text-sm border-none">
          <option>일반</option><option>외식</option><option>여행</option><option>경조사</option>
        </select>
      </div>
      <input type="text" bind:value={newTitle} placeholder="내용을 입력하세요" class="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500" />
      
      <div class="flex gap-2 pt-2">
        {#if editingId}
          <button on:click={resetForm} class="flex-1 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl active:scale-95 transition-all">취소</button>
        {/if}
        <button 
          on:click={handleSubmit} 
          disabled={isSubmitting}
          class="flex-[2] py-3 {editingId ? 'bg-amber-500' : 'bg-indigo-600'} text-white font-bold rounded-xl active:scale-95 transition-all disabled:bg-gray-400"
        >
          {isSubmitting ? '처리 중...' : (editingId ? '수정 완료' : '일정 추가하기')}
        </button>
      </div>
    </div>
  </div>

  <div class="space-y-3">
    {#if isLoading}
      <div class="text-center py-10 text-gray-400 animate-pulse">데이터를 가져오는 중...</div>
    {:else}
      {#each events as event (event.id)}
        <div class="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-700">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30">{event.category}</span>
              <span class="text-xs text-gray-400">{event.date.slice(5)}</span>
            </div>
            <h3 class="font-bold text-gray-800 dark:text-gray-100 mt-1">{event.title}</h3>
          </div>
          
          <button 
            on:click={() => setEditMode(event)}
            class="p-2 text-gray-300 hover:text-indigo-500 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        </div>
      {/each}
    {/if}
  </div>

  <!-- D-Day Selection Modal -->
  {#if showDDayModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" transition:fade>
      <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[80vh]" transition:fly={{ y: 20 }}>
        <h3 class="text-xl font-black text-gray-900 dark:text-white mb-4">D-Day 설정</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">홈 화면 상단에 띄울 일정을 선택하세요.</p>
        
        <div class="flex-1 overflow-y-auto space-y-2 pr-1">
          {#if futureEvents.length === 0}
            <p class="text-center text-gray-400 py-10">설정할 수 있는 미래 일정이 없어요.</p>
          {:else}
            {#each futureEvents as event}
              <button 
                on:click={() => setDDay(event)}
                class="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs font-bold text-indigo-500">{event.date}</span>
                  <span class="text-xs bg-white dark:bg-gray-700 px-2 py-0.5 rounded text-gray-400 group-hover:text-indigo-500">선택</span>
                </div>
                <div class="font-bold text-gray-800 dark:text-gray-200">{event.title}</div>
              </button>
            {/each}
          {/if}
        </div>

        <button on:click={() => showDDayModal = false} class="mt-4 w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold rounded-xl">닫기</button>
      </div>
    </div>
  {/if}
</div>