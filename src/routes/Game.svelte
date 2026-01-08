<script>
  import { onMount, onDestroy } from 'svelte';
  import { scale, fly, fade } from 'svelte/transition';
  import { quintOut, bounceOut } from 'svelte/easing';
  import { base } from '../lib/store.js';

  // --- 1. 게임 및 사운드 설정 ---
  const ROWS = 8;
  const COLS = 7;
  const FRUITS = ['🍎', '🍊', '🍇', '🥝', '🍋'];
  const BOMB = '💣';
  const MUSHROOM = '🍄'; // 하드모드 방해 요소
  const POP_START_TIMES = [0, 0.6, 1.2, 1.8, 2.4];

  // --- 2. 상태 관리 ---
  let grid = [];
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('fruitBestScore') || '0');
  let isNewRecord = false;
  let isMuted = false;
  let isProcessing = false;
  let isShaking = false;
  let particles = [];

  // 하드모드 관련 변수
  let isHardMode = false;
  let energy = 100;
  let gameOver = false;
  let gameInterval;

  const popSound = typeof Audio !== 'undefined' ? new Audio(`${base}/sounds/pop.mp3`) : null;

  // --- 3. 핵심 기능 함수 ---

  function playPop(type = 'normal') {
    if (!popSound || isMuted) return;
    const sound = popSound.cloneNode();
    const randomIndex = Math.floor(Math.random() * POP_START_TIMES.length);
    sound.currentTime = POP_START_TIMES[randomIndex];
    
    if (type === 'bomb') sound.playbackRate = 0.6;
    else if (type === 'refill') sound.playbackRate = 1.5;
    else sound.playbackRate = 1.0;
    
    sound.play().catch(() => {});
    setTimeout(() => { sound.pause(); sound.remove(); }, 500);
  }

  function startEnergyDrain() {
    if (gameInterval) clearInterval(gameInterval);
    energy = 100;
    gameOver = false;
    
    gameInterval = setInterval(() => {
      if (!isProcessing && !gameOver && isHardMode) {
        // 점수가 높을수록 에너지가 더 빨리 소모됨 (다이나믹 난이도)
        const drainSpeed = 0.8 + (score / 3000); 
        energy -= drainSpeed;
        
        if (energy <= 0) {
          energy = 0;
          handleGameOver();
        }
      }
    }, 100);
  }

  function handleGameOver() {
    clearInterval(gameInterval);
    gameOver = true;
    isShaking = true;
    playPop('bomb');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
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
      clearInterval(gameInterval);
      energy = 100;
    }
  }

  function createParticles(r, c, emoji) {
    const newItems = Array.from({ length: 6 }, (_, i) => ({
      id: Math.random(),
      angle: (i * 60) * (Math.PI / 180),
      emoji,
      dist: Math.random() * 80 + 40
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

  async function handleCellClick(r, c) {
    if (isProcessing || gameOver) return;
    const target = grid[r][c];
    if (!target) return;

    if (target === MUSHROOM) {
      energy -= 25; // 독버섯 페널티
      playPop('bomb');
      if (navigator.vibrate) navigator.vibrate(150);
      grid[r][c] = null;
      grid = [...grid];
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
      if (navigator.vibrate) navigator.vibrate(30);

      score += group.length * 10;
      if (isHardMode) energy = Math.min(100, energy + group.length * 1.5); // 에너지 회복
      
      const shouldCreateBomb = group.length >= 5;

      group.forEach(({ r: row, c: col }, index) => {
        grid[row][col] = (shouldCreateBomb && index === 0) ? BOMB : null;
      });
      grid = [...grid];
      setTimeout(applyGravityOnly, 350);
    }
  }

  async function triggerBomb(r, c) {
    playPop('normal');
    setTimeout(() => {
      isShaking = true;
      playPop('bomb');
      createParticles(r, c, '🔥');
      if (navigator.vibrate) navigator.vibrate([100, 50, 150]);

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
      setTimeout(() => { isShaking = false; applyGravityOnly(); }, 400);
    }, 150);
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
    setTimeout(refillGrid, 450);
  }

  function refillGrid() {
    let hasRefilled = false;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[r][c] === null) {
          const rand = Math.random();
          if (isHardMode && rand < 0.07) grid[r][c] = MUSHROOM; // 하드모드 독버섯 생성
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
    setTimeout(() => { isProcessing = false; }, 600);
  }

  onMount(() => initGame());
  onDestroy(() => clearInterval(gameInterval));
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-indigo-50 dark:bg-gray-900 p-4 select-none overflow-hidden">
  
  <div class="w-full max-w-xs flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-lg border border-white dark:border-gray-700">
    <div class="text-left">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</p>
      <p class="text-2xl font-black text-indigo-600 dark:text-indigo-400">{score}</p>
    </div>
    <button on:click={() => isMuted = !isMuted} class="text-xl p-2 bg-indigo-50 dark:bg-gray-700 rounded-full">
      {isMuted ? '🔇' : '🔊'}
    </button>
    <div class="text-right">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Best</p>
      <p class="text-2xl font-black {isNewRecord ? 'text-orange-500 animate-bounce' : 'text-purple-600'}">{bestScore}</p>
    </div>
  </div>

  {#if isHardMode}
    <div class="w-full max-w-xs h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden border-2 border-white dark:border-gray-800 shadow-inner">
      <div 
        class="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 transition-all duration-150"
        style="width: {energy}%"
      ></div>
    </div>
  {/if}

  <div class="relative {isShaking ? 'shake-animation' : ''}">
    <div class="bg-indigo-100 dark:bg-gray-700 p-3 rounded-[2.5rem] shadow-inner border-4 border-white dark:border-gray-800">
      <div class="grid grid-cols-7 gap-1.5 relative bg-white/20 dark:bg-black/10 rounded-2xl p-1">
        {#each grid as row, r}
          {#each row as cell, c}
            <div class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center relative">
              {#if cell}
                <button 
                  class="w-full h-full flex items-center justify-center text-2xl bg-white dark:bg-gray-800 rounded-xl shadow-md active:scale-75 transition-all duration-300"
                  on:click={() => handleCellClick(r, c)}
                  in:fly={{ y: -200, duration: 600, easing: bounceOut, delay: r * 40 }}
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
      <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 rounded-[2.5rem] backdrop-blur-sm" in:fade>
        <p class="text-6xl mb-4">😵</p>
        <h2 class="text-3xl font-black text-white mb-2 tracking-tighter">GAME OVER</h2>
        <p class="text-white/70 mb-8 font-bold text-lg">최종 점수: {score}점</p>
        <button on:click={() => initGame()} class="bg-white text-black px-10 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">
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
            in:fly={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist, duration: 600, easing: quintOut }}
            out:fade
          >
            {p.emoji}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <div class="mt-8 w-full max-w-xs space-y-3">
    <div class="flex gap-2 p-1 bg-white/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm">
      <button 
        on:click={() => { isHardMode = false; initGame(true); }}
        class="flex-1 py-3 rounded-xl font-black text-xs transition-all { !isHardMode ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400' }">
        일반 모드
      </button>
      <button 
        on:click={() => { isHardMode = true; initGame(true); }}
        class="flex-1 py-3 rounded-xl font-black text-xs transition-all { isHardMode ? 'bg-red-600 text-white shadow-md' : 'text-gray-400' }">
        하드 모드 🔥
      </button>
    </div>
    
    <button on:click={() => initGame()} class="w-full bg-gray-900 dark:bg-gray-100 dark:text-black text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">
      새 게임 시작
    </button>
  </div>
</div>

<style>
  .shake-animation {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }
  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
  }
  button { -webkit-tap-highlight-color: transparent; outline: none; }
</style>