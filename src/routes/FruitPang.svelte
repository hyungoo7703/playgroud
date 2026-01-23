<script>
  import { onMount, onDestroy } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut, bounceOut } from 'svelte/easing';
  import { base } from '../lib/store.js';

  // --- 1. 설정 ---
  const ROWS = 8;
  const COLS = 7;
  const FRUITS = ['🍎', '🍊', '🍇', '🥝', '🍋'];
  const BOMB = '💣';
  const MUSHROOM = '🍄';
  const POP_START_TIMES = [0, 0.6, 1.2, 1.8, 2.4];

  // --- 2. 상태 관리 ---
  let grid = [];
  let score = 0;
  let bestScore = 0;
  let isNewRecord = false;
  let isMuted = false;
  let isProcessing = false;
  let isShaking = false;
  let particles = [];

  // 하드모드 핵심 변수
  let isHardMode = false;
  let energy = 100;
  let gameOver = false;
  let gameInterval = null; // 인터벌 참조 저장

  const popSound = typeof Audio !== 'undefined' ? new Audio(`${base}/sounds/pop.mp3`) : null;

  // 로컬 스토리지 복구
  onMount(() => {
    bestScore = parseInt(localStorage.getItem('fruitBestScore') || '0');
    initGame();
  });

  // --- 3. 핵심 로직 수정 ---

  function startEnergyDrain() {
    stopEnergyDrain(); // 중복 방지
    energy = 100;
    
    gameInterval = setInterval(() => {
      if (!gameOver && isHardMode) {
        // [수정] isProcessing일 때도 에너지는 줄어들어야 긴장감이 유지됩니다.
        const drainSpeed = 0.5 + (score / 5000); 
        energy -= drainSpeed;
        
        if (energy <= 0) {
          energy = 0;
          handleGameOver();
        }
      }
    }, 100);
  }

  function stopEnergyDrain() {
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
  }

  function handleGameOver() {
    stopEnergyDrain();
    gameOver = true;
    isShaking = true;
    playPop('bomb');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    setTimeout(() => isShaking = false, 500);
  }

  function initGame(modeChange = false) {
    if (modeChange) score = 0;
    
    // 그리드 생성 (Svelte 반응성을 위해 완전 할당)
    grid = Array.from({ length: ROWS }, () => 
      Array.from({ length: COLS }, () => FRUITS[Math.floor(Math.random() * FRUITS.length)])
    );
    
    isNewRecord = false;
    isProcessing = false;
    gameOver = false;
    particles = [];
    
    if (isHardMode) {
      startEnergyDrain();
    } else {
      stopEnergyDrain();
      energy = 100;
    }
  }

  // 모드 변경 함수
  function toggleMode(hard) {
    if (isProcessing) return; // 처리 중 모드 변경 방지
    isHardMode = hard;
    initGame(true);
  }

  async function handleCellClick(r, c) {
    if (isProcessing || gameOver) return;
    const target = grid[r][c];
    if (!target) return;

    if (target === MUSHROOM) {
      energy = Math.max(0, energy - 20); // 독버섯 페널티
      playPop('bomb');
      grid[r][c] = null;
      grid = [...grid];
      isProcessing = true;
      setTimeout(applyGravityOnly, 200);
      return;
    }

    if (target === BOMB) {
      isProcessing = true;
      await triggerBomb(r, c);
      return;
    }

    const group = getConnectedGroup(r, c, target);
    if (group.length >= 2) {
      isProcessing = true;
      playPop('normal');
      createParticles(r, c, target);

      score += group.length * 10;
      
      // [수정] 에너지 회복 로직 강화
      if (isHardMode) {
        energy = Math.min(100, energy + (group.length * 2));
      }
      
      const shouldCreateBomb = group.length >= 5;
      group.forEach(({ r: row, c: col }, index) => {
        grid[row][col] = (shouldCreateBomb && index === 0) ? BOMB : null;
      });
      
      grid = [...grid];
      setTimeout(applyGravityOnly, 300);
    }
  }

  function applyGravityOnly() {
    for (let c = 0; c < COLS; c++) {
      let emptyRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r][c] !== null) {
          const temp = grid[r][c];
          grid[r][c] = null;
          grid[emptyRow][c] = temp;
          emptyRow--;
        }
      }
    }
    grid = [...grid];
    setTimeout(refillGrid, 300);
  }

  function refillGrid() {
    let hasRefilled = false;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[r][c] === null) {
          const rand = Math.random();
          // [수정] 독버섯 생성 확률 조정
          if (isHardMode && rand < 0.08) grid[r][c] = MUSHROOM;
          else grid[r][c] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
          hasRefilled = true;
        }
      }
    }
    
    if (hasRefilled) {
      playPop('refill');
      grid = [...grid];
    }

    if (score > bestScore) {
      bestScore = score;
      isNewRecord = true;
      localStorage.setItem('fruitBestScore', bestScore.toString());
    }
    
    // 모든 처리가 끝난 후 클릭 해제
    setTimeout(() => { isProcessing = false; }, 400);
  }

  // --- 유틸리티 ---
  function playPop(type) {
    if (!popSound || isMuted) return;
    const s = popSound.cloneNode();
    s.currentTime = POP_START_TIMES[Math.floor(Math.random() * 5)];
    s.playbackRate = type === 'bomb' ? 0.7 : (type === 'refill' ? 1.4 : 1.0);
    s.play().catch(() => {});
  }

  function createParticles(r, c, emoji) {
    const newItems = Array.from({ length: 6 }, (_, i) => ({
      id: Math.random(),
      angle: (i * 60) * (Math.PI / 180),
      emoji,
      dist: 60
    }));
    particles = [...particles, { r, c, items: newItems }];
    setTimeout(() => { particles = particles.filter(p => p.items !== newItems); }, 600);
  }

  function getConnectedGroup(r, c, target, visited = new Set()) {
    const key = `${r},${c}`;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || visited.has(key) || grid[r][c] !== target) return [];
    visited.add(key);
    let group = [{ r, c }];
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => {
      group = group.concat(getConnectedGroup(r + dr, c + dc, target, visited));
    });
    return group;
  }

  async function triggerBomb(r, c) {
    isShaking = true;
    playPop('bomb');
    for (let i = r - 1; i <= r + 1; i++) {
      for (let j = c - 1; j <= c + 1; j++) {
        if (i >= 0 && i < ROWS && j >= 0 && j < COLS) {
          if (grid[i][j]) createParticles(i, j, grid[i][j]);
          grid[i][j] = null;
          score += 20;
        }
      }
    }
    grid = [...grid];
    setTimeout(() => { isShaking = false; applyGravityOnly(); }, 300);
  }

  onDestroy(() => stopEnergyDrain());
</script>

<div class="flex flex-col items-center justify-center h-full bg-indigo-50 dark:bg-gray-900 p-4 select-none overflow-hidden font-sans">

  <div class="w-full max-w-xs flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-xl border-b-4 border-indigo-200 dark:border-gray-700">
    <div class="flex flex-col">
      <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</span>
      <span class="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{score}</span>
    </div>
    <button on:click={() => isMuted = !isMuted} class="text-xl p-3 bg-indigo-50 dark:bg-gray-700 rounded-2xl active:scale-90 transition-all">
      {isMuted ? '🔇' : '🔊'}
    </button>
    <div class="flex flex-col items-end">
      <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Best</span>
      <span class="text-3xl font-black {isNewRecord ? 'text-orange-500 animate-pulse' : 'text-purple-600 dark:text-purple-400'} leading-none">{bestScore}</span>
    </div>
  </div>

  <div class="w-full max-w-xs h-5 bg-gray-200 dark:bg-gray-800 rounded-full mb-6 p-1 shadow-inner overflow-hidden {isHardMode ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-500">
    <div 
      class="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 transition-all duration-150 ease-linear shadow-sm"
      style="width: {energy}%"
    ></div>
  </div>

  <div class="relative {isShaking ? 'shake-animation' : ''}">
    <div class="bg-indigo-200 dark:bg-gray-700 p-3 rounded-[2.8rem] shadow-2xl border-4 border-white dark:border-gray-800">
      <div class="grid grid-cols-7 gap-2 relative bg-white/30 dark:bg-black/20 rounded-[2rem] p-2">
        {#each grid as row, r}
          {#each row as cell, c}
            <div class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center relative">
              {#if cell}
                <button 
                  class="w-full h-full flex items-center justify-center text-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-md active:scale-75 transition-all duration-200 hover:brightness-110"
                  on:click={() => handleCellClick(r, c)}
                  in:fly={{ y: -100, duration: 500, easing: bounceOut, delay: r * 30 }}
                >
                  <span class={cell === BOMB || cell === MUSHROOM ? 'animate-pulse scale-110' : ''}>{cell}</span>
                </button>
              {/if}
            </div>
          {/each}
        {/each}
      </div>
    </div>

    {#if gameOver}
      <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 rounded-[2.8rem] backdrop-blur-md" in:fade>
        <span class="text-7xl mb-4">⏰</span>
        <h2 class="text-4xl font-black text-white mb-2 tracking-tighter">TIME OVER</h2>
        <p class="text-indigo-300 mb-8 font-bold text-xl uppercase tracking-widest">{score} POINTS</p>
        <button on:click={() => initGame()} class="bg-indigo-500 hover:bg-indigo-400 text-white px-12 py-5 rounded-3xl font-black text-xl shadow-[0_8px_0_rgb(67,56,202)] active:translate-y-1 active:shadow-none transition-all">
          TRY AGAIN
        </button>
      </div>
    {/if}

    <div class="absolute inset-0 pointer-events-none">
      {#each particles as group}
        {#each group.items as p}
          <div 
            class="absolute text-xl"
            style="left: {group.c * 14.3 + 7}%; top: {group.r * 12.5 + 6}%;"
            in:fly={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist, duration: 600, easing: quintOut }}
            out:fade
          >
            {p.emoji}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <div class="mt-8 w-full max-w-[300px] flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-3 p-1.5 bg-gray-200 dark:bg-gray-800 rounded-[1.8rem]">
      <button 
        on:click={() => toggleMode(false)}
        class="py-3 rounded-[1.4rem] font-black text-sm transition-all { !isHardMode ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500' }">
        NORMAL
      </button>
      <button 
        on:click={() => toggleMode(true)}
        class="py-3 rounded-[1.4rem] font-black text-sm transition-all { isHardMode ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500' }">
        HARD 🔥
      </button>
    </div>

    <button on:click={() => initGame()} class="w-full bg-gray-900 dark:bg-gray-100 dark:text-black text-white py-5 rounded-[1.8rem] font-black text-lg shadow-xl active:scale-95 transition-all uppercase tracking-tighter">
      Restart Game
    </button>
  </div>
</div>

<style>
  .shake-animation {
    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
  }
  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
    40%, 60% { transform: translate3d(3px, 0, 0); }
  }
  :global(body) { background-color: #f8fafc; }
  button { -webkit-tap-highlight-color: transparent; }
</style>