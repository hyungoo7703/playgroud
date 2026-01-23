<script>
  import { onMount, onDestroy } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut, bounceOut } from 'svelte/easing';
  import { base } from '../lib/store.js';

  // --- 1. 게임 설정 ---
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

  let isHardMode = false;
  let energy = 100;
  let gameOver = false;
  let gameInterval = null;

  const popSound = typeof Audio !== 'undefined' ? new Audio(`${base}/sounds/pop.mp3`) : null;

  // 게임 루프 및 상태 관리 이해를 돕는 구조 

  // 에너지 바 시작 함수 (하드모드 전용)
  function startEnergyDrain() {
    stopEnergyDrain();
    energy = 100;
    gameInterval = setInterval(() => {
      if (isHardMode && !gameOver) {
        // 처리 중(isProcessing)에도 에너지는 계속 감소해야 함
        const drainAmount = 0.6 + (score / 4000); 
        energy = Math.max(0, energy - drainAmount);
        
        if (energy <= 0) {
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
    setTimeout(() => isShaking = false, 500);
  }

  function initGame(modeChange = false) {
    if (modeChange) score = 0;
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

  async function handleCellClick(r, c) {
    if (isProcessing || gameOver) return;
    const target = grid[r][c];
    if (!target) return;

    if (target === MUSHROOM) {
      energy = Math.max(0, energy - 20);
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
      if (isHardMode) energy = Math.min(100, energy + (group.length * 1.5));
      
      const shouldCreateBomb = group.length >= 5;
      group.forEach(({ r: row, c: col }, index) => {
        grid[row][col] = (shouldCreateBomb && index === 0) ? BOMB : null;
      });
      grid = [...grid];
      setTimeout(applyGravityOnly, 250);
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
    setTimeout(refillGrid, 250);
  }

  function refillGrid() {
    let hasRefilled = false;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[r][c] === null) {
          const rand = Math.random();
          if (isHardMode && rand < 0.07) grid[r][c] = MUSHROOM;
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
    setTimeout(() => { isProcessing = false; }, 300);
  }

  // --- 유틸리티 함수 ---
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
      dist: 50
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

  onMount(() => {
    bestScore = parseInt(localStorage.getItem('fruitBestScore') || '0');
    initGame();
  });
  onDestroy(() => stopEnergyDrain());
</script>

<div class="flex flex-col items-center justify-between w-full h-[100dvh] bg-indigo-50 dark:bg-gray-900 p-2 md:p-4 select-none overflow-hidden font-sans">

  <div class="w-full max-w-xs flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-3xl shadow-md border-b-2 border-indigo-100">
    <div class="flex flex-col">
      <span class="text-[9px] font-bold text-gray-400 uppercase">현재 점수</span>
      <span class="text-2xl font-black text-indigo-600 leading-none">{score}</span>
    </div>
    <button on:click={() => isMuted = !isMuted} class="p-2 bg-indigo-50 dark:bg-gray-700 rounded-full">
      {isMuted ? '🔇' : '🔊'}
    </button>
    <div class="flex flex-col items-end">
      <span class="text-[9px] font-bold text-gray-400 uppercase">최고 기록</span>
      <span class="text-2xl font-black {isNewRecord ? 'text-orange-500 animate-bounce' : 'text-purple-600'} leading-none">{bestScore}</span>
    </div>
  </div>

  <div class="w-full max-w-xs h-4 bg-gray-200 dark:bg-gray-800 rounded-full p-0.5 shadow-inner mt-2 {isHardMode ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'} transition-all">
    <div 
      class="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 transition-all duration-150 ease-linear shadow-sm"
      style="width: {energy}%"
    ></div>
  </div>

  <div class="relative flex-1 flex items-center justify-center w-full max-h-[60%] {isShaking ? 'shake-animation' : ''}">
    <div class="bg-indigo-200 dark:bg-gray-700 p-2 rounded-[2rem] shadow-xl border-2 border-white">
      <div class="grid grid-cols-7 gap-1 bg-white/30 rounded-[1.5rem] p-1.5">
        {#each grid as row, r}
          {#each row as cell, c}
            <div class="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center relative">
              {#if cell}
                <button 
                  class="w-full h-full flex items-center justify-center text-xl sm:text-2xl bg-white dark:bg-gray-800 rounded-lg shadow active:scale-75 transition-all duration-200"
                  on:click={() => handleCellClick(r, c)}
                  in:fly={{ y: -50, duration: 400, easing: bounceOut, delay: r * 20 }}
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
      <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 rounded-[2rem] backdrop-blur-sm" in:fade>
        <span class="text-6xl mb-2">⏰</span>
        <h2 class="text-3xl font-black text-white mb-1">게임 종료</h2>
        <p class="text-indigo-300 font-bold mb-6">{score} 점을 획득했습니다!</p>
        <button on:click={() => initGame()} class="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black shadow-lg active:scale-95">
          다시 도전!
        </button>
      </div>
    {/if}

    <div class="absolute inset-0 pointer-events-none">
      {#each particles as group}
        {#each group.items as p}
          <div 
            class="absolute text-lg"
            style="left: {group.c * 14.3 + 7}%; top: {group.r * 12.5 + 6}%;"
            in:fly={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist, duration: 500, easing: quintOut }}
            out:fade
          >
            {p.emoji}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <div class="w-full max-w-[280px] flex flex-col gap-2 pb-2">
    <div class="grid grid-cols-2 gap-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-2xl">
      <button 
        on:click={() => { isHardMode = false; initGame(true); }}
        class="py-2.5 rounded-xl font-black text-[11px] transition-all { !isHardMode ? 'bg-white text-indigo-600 shadow' : 'text-gray-500' }">
        일반 모드
      </button>
      <button 
        on:click={() => { isHardMode = true; initGame(true); }}
        class="py-2.5 rounded-xl font-black text-[11px] transition-all { isHardMode ? 'bg-red-500 text-white shadow' : 'text-gray-500' }">
        하드 모드 🔥
      </button>
    </div>

    <button on:click={() => initGame()} class="w-full bg-gray-900 dark:bg-gray-100 dark:text-black text-white py-3.5 rounded-2xl font-black text-sm shadow-md active:scale-95">
      새 게임 시작
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
  :global(body) { background-color: #f8fafc; margin: 0; padding: 0; overflow: hidden; }
</style>