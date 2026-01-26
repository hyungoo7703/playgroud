<script>
  import { onMount } from "svelte";
  import { fade, scale, slide } from "svelte/transition";
  import { GAS_URL, currentUser } from "../lib/store.js"; // Import currentUser

  // --- 상태 관리 변수 ---
  let foodList = []; // 구글 시트에서 가져온 메뉴 리스트
  let spinMode = "menu"; // 'menu' or 'whoPay'
  const WHO_PAY_MEMBERS = ["엄마", "현구", "범수"];

  let spinning = false; // 룰렛 회전 여부
  let responseult = "오늘 뭐 먹지?";
  let spinInterval;
  let isLoading = true; // 초기 로딩 상태

  // Secret Admin State
  let targetWinner = null;

  // --- 관리자/권한 관련 변수 ---
  let newItem = ""; // 추가할 새 메뉴 이름
  let isAdding = false; // 메뉴 추가 통신 중 상태
  const userRole = localStorage.getItem("role"); // 로그인 시 저장된 역할 (admin/member)

  /** * 1. 메뉴 리스트 가져오기 (Read) */
  async function fetchMenu() {
    isLoading = true;
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "getManagement", section: "roulette" }),
      });
      const data = await response.json();
      if (data.success) {
        foodList = data.data.map((item) => item.value);
      }
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    } finally {
      isLoading = false;
    }
  }

  // --- 2. 관리자 메뉴 추가 (Create) ---
  async function addMenuItem() {
    if (!newItem.trim() || isAdding) return;
    isAdding = true;

    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "addManagement",
          section: "roulette",
          value: newItem,
        }),
      });
      const data = await response.json();
      if (data.success) {
        newItem = "";
        if (spinMode === "menu") await fetchMenu();
      }
    } catch (e) {
      alert("추가 중 오류가 발생했습니다.");
    } finally {
      isAdding = false;
    }
  }

  function switchMode(mode) {
    spinMode = mode;
    responseult = mode === "menu" ? "오늘 뭐 먹지?" : "누가 낼까?";
    spinning = false;
  }

  /**
   * 3. 룰렛 돌리기 로직
   */
  function startSpin() {
    const list = spinMode === "menu" ? foodList : WHO_PAY_MEMBERS;
    if (spinning || list.length === 0) return;

    spinning = true;
    if (navigator.vibrate) navigator.vibrate(50);

    // 80ms 간격으로 랜덤 메뉴 표시
    spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * list.length);
      responseult = list[randomIndex];
    }, 80);

    // 2.5초 후 멈춤
    setTimeout(() => {
      clearInterval(spinInterval);

      // Rigged Logic
      if (
        spinMode === "whoPay" &&
        targetWinner &&
        list.includes(targetWinner)
      ) {
        responseult = targetWinner;
        // targetWinner = null; // Optional: Reset after win? Let's keep it manual for repeated trolling.
      } else {
        const finalIndex = Math.floor(Math.random() * list.length);
        responseult = list[finalIndex];
      }

      spinning = false;
      if (navigator.vibrate) navigator.vibrate([100, 30, 100]);
    }, 2500);
  }

  onMount(fetchMenu);
</script>

<div class="px-4 py-8 max-w-md mx-auto space-y-8 pb-32">
  <div class="flex justify-center gap-2 mb-4">
    <button
      on:click={() => switchMode("menu")}
      class="px-4 py-2 rounded-xl font-bold transition-all {spinMode === 'menu'
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'bg-slate-100 text-slate-400'}">메뉴 고르기</button
    >
    <button
      on:click={() => switchMode("whoPay")}
      class="px-4 py-2 rounded-xl font-bold transition-all {spinMode ===
      'whoPay'
        ? 'bg-green-600 text-white shadow-lg'
        : 'bg-slate-100 text-slate-400'}">밥값 내기 💸</button
    >
  </div>

  <header class="text-center space-y-2">
    <h2
      class="text-3xl font-black text-slate-900 dark:text-white tracking-tight"
    >
      {spinMode === "menu" ? "메뉴 룰렛 🎰" : "밥값 룰렛 💳"}
    </h2>
    <p class="text-sm text-slate-500 font-medium">
      {spinMode === "menu"
        ? "우리 가족의 식사 고민을 해결해 드립니다!"
        : "오늘의 물주는 과연 누구?"}
    </p>
  </header>

  <div class="relative group">
    <div
      class="absolute -inset-1 bg-gradient-to-r {spinMode === 'menu'
        ? 'from-indigo-500 to-purple-600'
        : 'from-green-400 to-emerald-600'} rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"
    ></div>
    <div
      class="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[220px] flex items-center justify-center text-center"
    >
      {#if isLoading && spinMode === "menu"}
        <div class="text-slate-400 animate-pulse font-bold">
          메뉴판 가져오는 중...
        </div>
      {:else}
        <div class="w-full">
          {#if spinning}
            <div
              in:scale={{ duration: 100 }}
              class="text-4xl font-black {spinMode === 'menu'
                ? 'text-indigo-600'
                : 'text-green-600'} animate-bounce"
            >
              {responseult}
            </div>
          {:else}
            <div in:fade>
              {#if responseult.includes("오늘") || responseult.includes("누가")}
                <span
                  class="text-slate-200 dark:text-slate-800 text-7xl block mb-2"
                  >?</span
                >
                <p class="text-xl font-bold text-slate-400 italic">
                  {responseult}
                </p>
              {:else}
                <span
                  class="text-xs font-black {spinMode === 'menu'
                    ? 'text-indigo-500'
                    : 'text-green-500'} uppercase tracking-widest mb-2 block"
                >
                  {spinMode === "menu" ? "오늘의 메뉴는?" : "당첨자 확정!"}
                </span>
                <div
                  class="text-4xl font-black text-slate-900 dark:text-white leading-tight mb-2"
                >
                  {responseult}
                </div>
                <p
                  class="{spinMode === 'menu'
                    ? 'text-indigo-600'
                    : 'text-green-600'} font-bold animate-pulse"
                >
                  🎉 당첨! 🎉
                </p>
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
      disabled={spinning ||
        (spinMode === "menu" && (isLoading || foodList.length === 0))}
      class="w-full relative py-5 {spinMode === 'menu'
        ? 'bg-indigo-600 shadow-indigo-200'
        : 'bg-green-600 shadow-green-200'} rounded-3xl shadow-xl dark:shadow-none active:scale-95 transition-all disabled:opacity-50"
    >
      <span class="relative z-10 text-xl font-bold text-white">
        {spinning
          ? "두구두구두구..."
          : spinMode === "menu"
            ? "돌려 돌려 돌림판!"
            : "누가 낼까? 클릭!"}
      </span>
    </button>

    {#if spinMode === "menu"}
      {#if userRole === "admin"}
        <div
          transition:slide
          class="bg-indigo-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-indigo-100 dark:border-slate-700"
        >
          <h4
            class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4"
          >
            🔧 관리자 전용: 메뉴 관리
          </h4>
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={newItem}
              placeholder="새로운 메뉴 입력"
              class="flex-1 px-4 py-3 rounded-xl border-none text-sm bg-white dark:bg-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500"
              on:keydown={(e) => e.key === "Enter" && addMenuItem()}
            />
            <button
              on:click={addMenuItem}
              disabled={isAdding || !newItem}
              class="px-5 bg-indigo-600 text-white rounded-xl font-bold text-sm disabled:bg-slate-400 transition-colors"
            >
              {isAdding ? ".." : "추가"}
            </button>
          </div>
        </div>
      {:else}
        <div
          transition:fade
          class="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center"
        >
          <p class="text-sm text-slate-500 font-medium italic">
            💡 메뉴 추가는 관리자에게 부탁합니다!
          </p>
        </div>
      {/if}

      <div class="pt-4 px-2">
        <h4
          class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 text-center"
        >
          선택 가능한 후보 ({foodList.length})
        </h4>
        <div class="flex flex-wrap justify-center gap-2">
          {#each foodList as food}
            <span
              class="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[11px] font-bold border border-slate-200/50 dark:border-slate-700"
            >
              {food}
            </span>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Who Pay Candidates -->
      <div class="pt-4 px-2" transition:fade>
        <h4
          class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 text-center"
        >
          결제 후보자
        </h4>
        <div class="flex flex-wrap justify-center gap-4">
          {#each WHO_PAY_MEMBERS as member}
            <div
              class="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2"
            >
              <span>👤</span>
              {member}
            </div>
          {/each}
        </div>

        <!-- Secret Admin Logic (Only for Hyungoo) -->
        {#if $currentUser === "현구"}
          <div
            class="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 opacity-30 hover:opacity-100 transition-opacity"
          >
            <p class="text-[10px] text-center text-slate-300 mb-2">
              🤫 관리자 권한: 타겟 설정 (쉿!)
            </p>
            <div class="flex justify-center gap-2">
              {#each WHO_PAY_MEMBERS as mem}
                <button
                  on:click={() =>
                    (targetWinner = targetWinner === mem ? null : mem)}
                  class="px-3 py-1 text-xs rounded-lg border transition-all {targetWinner ===
                  mem
                    ? 'bg-red-100 text-red-600 border-red-200'
                    : 'bg-transparent border-slate-200 text-slate-400'}"
                >
                  {mem}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
