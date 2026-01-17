<script>
  import { fade, slide } from 'svelte/transition';
  
  let amount = '';
  let calculated = 0;
  let copied = false;
  
  $: calculated = Math.floor((parseFloat(amount) || 0) * 0.15);

  function formatNumber(num) {
    return num.toLocaleString();
  }
  
  async function copyToClipboard() {
    if (!calculated) return;
    try {
      await navigator.clipboard.writeText(calculated.toString());
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      alert('복사 실패: ' + err);
    }
  }
</script>

<div class="p-6 max-w-sm mx-auto min-h-screen flex flex-col items-center justify-center space-y-8 pb-20">
  <div class="text-center space-y-2">
      <h2 class="text-3xl font-black text-gray-900 dark:text-white">15% 계산기</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm">입력한 금액의 15%를 계산합니다.</p>
  </div>
  
  <div class="w-full space-y-2">
    <label class="font-bold text-xs text-gray-400 ml-2">계산할 금액</label>
    <input 
      type="number" 
      bind:value={amount} 
      placeholder="0" 
      class="w-full p-6 bg-white dark:bg-gray-800 rounded-3xl text-3xl font-black text-center outline-none ring-4 ring-transparent focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all text-gray-900 dark:text-white shadow-sm"
    />
  </div>

  <div class="w-full relative">
     <div class="absolute left-1/2 -top-4 -translate-x-1/2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
     </div>
     
     <div class="w-full bg-indigo-600 rounded-[2.5rem] p-10 text-center text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
        <!-- Decoration -->
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
        
        <p class="text-indigo-200 font-bold mb-1 text-sm uppercase tracking-wider">Calculated 15%</p>
        <div class="flex items-baseline justify-center gap-1">
           <h1 class="text-5xl font-black tracking-tight">{formatNumber(calculated)}</h1>
           <span class="text-xl font-medium text-indigo-300">원</span>
        </div>
    </div>
  </div>

  <button 
    on:click={copyToClipboard}
    disabled={!calculated}
    class="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:active:scale-100"
  >
    {#if copied}
      <span in:fade class="flex items-center gap-2">
         <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
         복사되었습니다!
      </span>
    {:else}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
      <span>결과 복사하기</span>
    {/if}
  </button>
</div>
