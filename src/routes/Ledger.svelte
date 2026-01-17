<script>
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { api } from '../lib/api.js';
  import { navigate } from 'svelte-routing';
  import { base } from '../lib/store.js';

  let ledgerItems = [];
  let isLoading = true;
  let showForm = false;
  let isSubmitting = false;

  // Form State
  let formData = {
    id: null,
    date: new Date().toISOString().split('T')[0],
    type: '이체', // 이체 위주
    title: '',
    amount: '',
    giver: '나',
    receiver: '가족',
    is_settled: false
  };

  const USERS = ['아빠', '엄마', '현구', '범수'];
  const TYPES = ['이체', '지출', '수입'];

  async function loadLedger() {
    isLoading = true;
    const res = await api.getLedger();
    if (res.success) {
      ledgerItems = res.ledger.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      alert('장부 불러오기 실패: ' + (res.message || '알 수 없는 오류'));
    }
    isLoading = false;
  }

  // User State
  let currentUser = '아빠';
  let loggedInUser = '아빠';
  let showOnlyMine = false;

  const CODE_MAP = {
    'master!99': '현구',
    'cm!01': '아빠',
    'cm!02': '엄마',
    'cm!03': '범수'
  };

  // Rule State
  let rules = [];
  let showRuleModal = false;
  let isRuleSubmitting = false;
  let newRuleDay = 1;
  let newRuleTitle = "";
  let newRuleAmount = "";
  let newRuleGiver = "나";
  let newRuleReceiver = "가족";
  let isBatchSubmitting = false;

  function checkUser() {
    const code = localStorage.getItem('accessCode');
    if (code && CODE_MAP[code]) {
      loggedInUser = CODE_MAP[code];
      currentUser = loggedInUser;
    }
  }

  onMount(() => {
    checkUser();
    loadLedger();
  });

  async function openRuleModal() {
    if (currentUser !== '현구') return alert('관리자(현구)만 접근할 수 있습니다.');
    showRuleModal = true;
    isLoading = true;
    const res = await api.getRules();
    if (res.success) {
      rules = res.rules;
    } else {
       rules = [];
    }
    isLoading = false;
  }

  async function handleAddRule() {
    if (!newRuleTitle || !newRuleAmount) return alert('내용과 금액을 입력해주세요.');
    isRuleSubmitting = true;
    const payload = {
      day: newRuleDay,
      title: newRuleTitle,
      amount: newRuleAmount,
      giver: newRuleGiver,
      receiver: newRuleReceiver,
      type: '이체'
    };
    const res = await api.addRule(payload);
    if(res.success) {
      newRuleTitle = "";
      newRuleAmount = "";
      const r = await api.getRules();
      if(r.success) rules = r.rules;
    } else {
      alert('규칙 추가 실패: ' + res.message);
    }
    isRuleSubmitting = false;
  }

  async function handleDeleteRule(id) {
    if(!confirm('고정 내역을 삭제하시겠습니까?')) return;
    const res = await api.deleteRule(id);
    if(res.success) {
        const r = await api.getRules();
        if(r.success) rules = r.rules;
    } else {
        alert('삭제 실패: ' + res.message);
    }
  }

  async function applyRulesToMonth() {
    if (rules.length === 0) return alert('등록된 규칙이 없습니다.');
    if (!confirm(`${displayMonth}월 장부에 ${rules.length}개의 고정 내역을 추가하시겠습니까?`)) return;

    isBatchSubmitting = true;
    
    // Create items for current viewed month
    const newItems = rules.map(rule => {
      // Handle day overflow (e.g. Feb 30 -> Feb 28/29) or just rely on Date auto-correction
      // Construct date string YYYY-MM-DD
      const y = displayYear;
      const m = String(displayMonth).padStart(2, '0');
      const d = String(rule.day || 1).padStart(2, '0'); 
      return {
        date: `${y}-${m}-${d}`,
        type: rule.type || '이체',
        title: rule.title,
        amount: rule.amount,
        giver: rule.giver,
        receiver: rule.receiver,
        is_settled: false
      };
    });

    const res = await api.batchAddLedger(newItems);
    if (res.success) {
      alert('성공적으로 추가되었습니다!');
      showRuleModal = false;
      loadLedger();
    } else {
      alert('일괄 추가 실패: ' + res.message);
    }
    isBatchSubmitting = false;
  }

  function openAddForm() {
    formData = {
      id: null,
      date: new Date().toISOString().split('T')[0],
      type: '이체',
      title: '',
      amount: '',
      giver: '나',
      receiver: '가족',
      is_settled: false
    };
    showForm = true;
  }

  function openEditForm(item) {
    formData = { ...item };
    showForm = true;
  }

  async function handleSubmit() {
    if (!formData.title || !formData.amount) return alert('내용과 금액을 입력해주세요.');
    
    isSubmitting = true;
    let res;
    
    // Amount can be string now
    const payload = { ...formData };

    if (formData.id) {
      res = await api.updateLedger(payload);
    } else {
      res = await api.addLedger(payload);
    }

    if (res.success) {
      showForm = false;
      loadLedger();
    } else {
      alert('저장 실패: ' + res.message);
    }
    isSubmitting = false;
  }

  async function handleDelete(id) {
    if(!confirm('정말 삭제하시겠습니까?')) return;
    
    const res = await api.deleteLedger(id);
    if (res.success) {
      alert('삭제되었습니다.');
      loadLedger();
    } else {
      alert('삭제 실패: ' + res.message);
    }
  }

  async function toggleSettle(item) {
    if(!confirm(item.is_settled ? '정산 취소 처리하시겠습니까?' : '정산 완료 처리하시겠습니까?')) return;
    
    const res = await api.updateLedger({
      ...item,
      is_settled: !item.is_settled
    });
    
    if (res.success) {
      loadLedger();
    }
  }

  // Helper to safely format amount
  function formatAmount(amt) {
    const num = parseFloat(amt);
    // If it's a valid number and the string is purely numeric (or minimal formatting), format it
    // Check if regex matches pure number to avoid formatting "50%" as "50"
    if (!isNaN(num) && String(amt).match(/^[\d\.\-]+$/)) {
      return num.toLocaleString();
    }
    return amt;
  }

  // Date Filter State
  let currentDate = new Date();
  $: displayYear = currentDate.getFullYear();
  $: displayMonth = currentDate.getMonth() + 1;

  function prevMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  }

  function nextMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  // Filter items by month
  $: filteredItems = ledgerItems.filter(item => {
    const d = new Date(item.date);
    const isMonthMatch = d.getFullYear() === displayYear && (d.getMonth() + 1) === displayMonth;
    if (!isMonthMatch) return false;
    
    if (showOnlyMine) {
      return item.giver === currentUser || item.receiver === currentUser;
    }
    return true;
  });

  // Calculate totals from filtered items
  $: totalAmount = filteredItems.reduce((sum, item) => {
    const n = parseFloat(item.amount);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  
  $: unsettledAmount = filteredItems.filter(i => !i.is_settled).reduce((sum, item) => {
    const n = parseFloat(item.amount);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
  <!-- Header -->
  <header class="bg-indigo-600 px-6 pt-12 pb-20 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
    <div class="relative z-10">
      <div class="flex justify-between items-start mb-6">
        <!-- User Selector (Admin Check) -->
         <div class="flex flex-col gap-2">
           <select bind:value={currentUser} disabled={loggedInUser !== '현구'} class="bg-indigo-500/50 text-indigo-100 text-xs font-bold py-1 px-2 rounded-lg border-none outline-none backdrop-blur-sm disabled:opacity-80 disabled:cursor-not-allowed">
             {#each USERS as u}<option value={u}>{u}</option>{/each}
           </select>
           <button 
             on:click={() => showOnlyMine = !showOnlyMine}
             class="text-[10px] font-bold px-2 py-1 rounded-lg transition-all border {showOnlyMine ? 'bg-white text-indigo-600 border-white' : 'bg-transparent text-indigo-300 border-indigo-400/50 hover:bg-indigo-500/30'}"
           >
             내 내역만
           </button>
         </div>

        <div class="flex items-center gap-4 bg-indigo-500/50 rounded-full px-4 py-1.5 backdrop-blur-sm">
          <button on:click={prevMonth} class="text-indigo-200 hover:text-white active:scale-75 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <span class="text-white font-bold text-sm tracking-widest">{displayYear}.{String(displayMonth).padStart(2, '0')}</span>
          <button on:click={nextMonth} class="text-indigo-200 hover:text-white active:scale-75 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
        
        <div class="flex items-center gap-2">
          {#if currentUser === '현구'}
            <button on:click={openRuleModal} class="p-2 bg-pink-500 text-white rounded-xl shadow-lg font-bold text-xs active:scale-95 transition-all whitespace-nowrap">
              고정내역
            </button>
          {/if}
        </div>
      </div>
      
      <div class="text-white text-center mt-4">
        <p class="text-indigo-200 text-sm font-bold mb-1">{displayMonth}월 미정산 금액 (추산)</p>
        <h1 class="text-4xl font-black">
          {unsettledAmount.toLocaleString()} <span class="text-xl font-normal">원</span>
        </h1>
        <p class="text-indigo-300 text-xs mt-2">총 이체 예정: {totalAmount.toLocaleString()}원</p>
      </div>

       <!-- New Item Button Floating or specific? User kept standard Add button removed in diff? No, I need to restore standard Add button or replace "Manage"? 
           User wants "Admin manages rules", but "Regular members can check off". Regular members might still strictly need to Add AD-HOC items? 
           Usually yes. I'll Put the + button back for everyone, floating or somewhere.
           In my previous replace, I removed the Left Button div. I will put User Select Left, Date Center, Add Right.
           And "Manage" button somewhere else? Or maybe "User Select" -> If Admin -> Show "Manage" besides "+"?
           Let's put "Manage" next to "+" if admin.
       -->
    </div>
    
     <!-- Add Button (Standard) -->


    <!-- Decorative -->
    <div class="absolute right-0 top-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    <div class="absolute left-0 bottom-0 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
  </header>

  <!-- Content -->
  <main class="px-5 -mt-10 relative z-20 space-y-4">
    {#if isLoading && !showRuleModal}
      <div class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    {:else if filteredItems.length === 0}
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-sm">
        <p class="text-gray-400">내역이 없습니다.<br/>새로운 내역을 추가해보세요!</p>
      </div>
    {:else}
      {#each filteredItems as item (item.id)}
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all relative overflow-hidden group">
          
          <!-- Status Line -->
          <div class="absolute left-0 top-0 bottom-0 w-1.5 {item.is_settled ? 'bg-gray-200 dark:bg-gray-700' : 'bg-pink-500'}"></div>

          <div class="pl-3 flex justify-between items-center">
            <div class="flex-1 {currentUser === '현구' ? 'cursor-pointer' : ''}" on:click={() => currentUser === '현구' && openEditForm(item)}>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {new Date(item.date).getDate()}일
                </span>
                <span class="text-[10px] font-bold text-indigo-500">{item.type}</span>
              </div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 {item.is_settled ? 'line-through opacity-50' : ''}">
                {item.title}
              </h3>
              <div class="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <span>{item.giver}</span>
                <span>→</span>
                <span>{item.receiver}</span>
              </div>
            </div>

            <div class="flex flex-col items-end gap-2 text-right">
              <span class="font-black text-lg {item.is_settled ? 'text-gray-400' : 'text-gray-900 dark:text-white'}">
                {formatAmount(item.amount)}
              </span>
              <!-- Toggle Settle Button -->
              <button 
                on:click|stopPropagation={() => toggleSettle(item)}
                class="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-colors
                  {item.is_settled 
                    ? 'border-gray-200 text-gray-400 bg-gray-50' 
                    : 'border-pink-200 text-pink-500 bg-pink-50 hover:bg-pink-100'}"
              >
                {item.is_settled ? '정산완료' : '미정산'}
              </button>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </main>

  <!-- Add/Edit Modal (existing) -->
  {#if showForm}
    <!-- ... same as before ... -->
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" transition:fade>
      <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-2xl relative" transition:slide={{ duration: 300, axis: 'y' }}>
        <!-- ... form content needs to be preserved ... -->
        <h2 class="text-xl font-black text-gray-900 dark:text-white mb-6">
          {formData.id ? '내역 수정' : '새로운 내역'}
        </h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-gray-400 ml-2 block mb-1">날짜</label>
              <input type="date" bind:value={formData.date} class="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all border-none" />
            </div>
            <div>
              <label class="text-xs font-bold text-gray-400 ml-2 block mb-1">분류</label>
              <select bind:value={formData.type} class="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all border-none">
                {#each TYPES as t}<option value={t}>{t}</option>{/each}
              </select>
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-gray-400 ml-2 block mb-1">내용</label>
            <input type="text" bind:value={formData.title} placeholder="어디서 무엇을 썼나요?" class="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all border-none" />
          </div>

          <div>
            <label class="text-xs font-bold text-gray-400 ml-2 block mb-1">금액</label>
            <input type="text" bind:value={formData.amount} placeholder="예: 50000" class="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-xl font-black outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all border-none" />
          </div>

          <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <div>
              <label class="text-xs font-bold text-gray-400 ml-2 block mb-1">누가</label>
              <select bind:value={formData.giver} class="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none border-none">
                {#each USERS as u}<option value={u}>{u}</option>{/each}
              </select>
            </div>
            <span class="text-gray-300 font-bold mt-5">→</span>
            <div>
              <label class="text-xs font-bold text-gray-400 ml-2 block mb-1">누구에게</label>
              <select bind:value={formData.receiver} class="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none border-none">
                {#each USERS as u}<option value={u}>{u}</option>{/each}
              </select>
            </div>
          </div>
          
          <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl" on:click={() => formData.is_settled = !formData.is_settled}>
             <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors {formData.is_settled ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}">
               {#if formData.is_settled}
                 <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
               {/if}
             </div>
             <span class="text-sm font-bold text-gray-600 dark:text-gray-300">정산 완료 처리</span>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button on:click={() => showForm = false} class="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-2xl active:scale-95 transition-all">취소</button>
          <button on:click={handleSubmit} disabled={isSubmitting} class="flex-1 py-4 font-black text-white bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
            {isSubmitting ? '저장 중...' : '저장하기'}
          </button>
        </div>

        {#if formData.id}
          <button on:click={() => handleDelete(formData.id)} class="absolute top-6 right-6 text-red-400 text-xs font-bold">삭제</button>
        {/if}
     </div></div>
  {/if}

  <!-- Rules Management Modal (Admin Only) -->
  {#if showRuleModal}
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" transition:fade>
      <div class="w-full max-w-sm h-[85vh] flex flex-col bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-2xl relative" transition:slide={{ duration: 300, axis: 'y' }}>
        <div class="flex justify-between items-center mb-6 shrink-0">
          <div>
             <h2 class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            📌 고정 내역 관리
             </h2>
             <p class="text-xs text-gray-400">관리자(현구) 전용 기능입니다.</p>
          </div>
          <button on:click={() => showRuleModal = false} class="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <!-- Batch Apply Section -->
        <div class="shrink-0 mb-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl">
           <h3 class="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2">이번 달({displayMonth}월) 장부로 가져오기</h3>
           <p class="text-xs text-indigo-700/70 dark:text-indigo-300 mb-3">등록된 {rules.length}개의 규칙을 현재 보고 있는 월의 내역으로 일괄 등록합니다.</p>
           <button on:click={applyRulesToMonth} disabled={isBatchSubmitting} class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">
             {isBatchSubmitting ? '등록 중...' : `📋 ${displayMonth}월 장부에 일괄 추가`}
           </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-3 mb-6">
          {#if rules.length === 0}
            <div class="text-center py-10 text-gray-400 text-sm">
              우측 하단 폼을 통해<br/>고정 내역을 등록해주세요.
            </div>
          {:else}
            {#each rules as rule}
              <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex justify-between items-center">
                 <div>
                   <div class="flex items-center gap-2">
                     <span class="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">매월 {rule.day}일</span>
                     <h4 class="font-bold text-gray-900 dark:text-white text-sm">{rule.title}</h4>
                   </div>
                   <p class="text-xs text-indigo-500 mt-0.5">{formatAmount(rule.amount)} ({rule.giver} → {rule.receiver})</p>
                 </div>
                 <button on:click={() => handleDeleteRule(rule.id)} class="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                 </button>
              </div>
            {/each}
          {/if}
        </div>

        <div class="shrink-0 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl space-y-3 border-t border-gray-100 dark:border-gray-700">
          <div class="flex gap-2">
             <div class="w-20">
                <input type="number" min="1" max="31" bind:value={newRuleDay} placeholder="일" class="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-3 rounded-xl text-sm font-bold outline-none text-center" />
             </div>
             <input type="text" bind:value={newRuleTitle} placeholder="내용 (예: 월세)" class="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl text-sm font-bold outline-none" />
          </div>
          <div class="flex gap-2">
            <input type="text" bind:value={newRuleAmount} placeholder="금액" class="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl text-sm font-bold outline-none" />
          </div>
          <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <select bind:value={newRuleGiver} class="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-xl text-xs font-bold outline-none">
              {#each USERS as u}<option value={u}>{u}</option>{/each}
           </select>
           <span class="text-gray-300">→</span>
           <select bind:value={newRuleReceiver} class="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-xl text-xs font-bold outline-none">
              {#each USERS as u}<option value={u}>{u}</option>{/each}
           </select>
          </div>
          <button on:click={handleAddRule} disabled={isRuleSubmitting} class="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold shadow-lg active:scale-95 transition-all">
            {isRuleSubmitting ? '저장 중...' : '+ 규칙 추가'}
          </button>
        </div>
      </div>
    </div>
  {/if}
  {#if currentUser === '현구'}
    <button 
      on:click={() => openAddForm()} 
      class="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl font-light z-40 hover:scale-110 active:scale-90 transition-all"
      transition:fade
    >
      +
    </button>
  {/if}
</div>
