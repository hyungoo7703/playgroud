<script>
  import { onMount } from 'svelte';
  import { scale, fly, fade } from 'svelte/transition';
  import { quintOut, bounceOut } from 'svelte/easing';
  import { base } from '../lib/store.js';

  // --- 1. 게임 및 사운드 설정 ---
  const ROWS = 8;
  const COLS = 7;
  const FRUITS = ['🍎', '🍊', '🍇', '🥝', '🍋'];
  const BOMB = '💣';
  
  // 3초 파일 내 5개 팝 소리의 시작점 (초)
  const POP_START_TIMES = [0, 0.6, 1.2, 1.8, 2.4];

  let grid = [];
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('fruitBestScore') || '0');
  let isNewRecord = false;
  let isMuted = false;
  let isProcessing = false;
  let isShaking = false;
  let particles = [];

  // 오디오 객체 (경로 주의: public/sounds/pop-91931.mp3)
  const popSound = typeof Audio !== 'undefined' ? new Audio(`${base}/sounds/pop.mp3`) : null;

  // --- 2. 사운드 재생 함수 (핵심) ---
  function playPop(type = 'normal') {
    if (!popSound || isMuted) return;

    const sound = popSound.cloneNode(); // 겹침 재생 가능하도록 복제
    const randomIndex = Math.floor(Math.random() * POP_START_TIMES.length);
    sound.currentTime = POP_START_TIMES[randomIndex];

    if (type === 'bomb') {
      sound.playbackRate = 0.6; // 폭탄은 낮고 웅장하게
    } else if (type === 'refill') {
      sound.playbackRate = 1.4; // 리필은 경쾌하게
    } else {
      sound.playbackRate = 1.0; // 일반 클릭
    }

    sound.play().catch(() => {});

    // 소리가 다음 구간으로 넘어가지 않게 0.5초 후 정지
    setTimeout(() => {
      sound.pause();
      sound.remove();
    }, 500);
  }

  // --- 3. 게임 로직 ---
  function initGame() {
    grid = Array.from({ length: ROWS }, () => 
      Array.from({ length: COLS }, () => FRUITS[Math.floor(Math.random() * FRUITS.length)])
    );
    score = 0;
    isNewRecord = false;
    isProcessing = false;
    particles = [];
  }

  // 파티클 효과 (터질 때 이모지 파편)
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

  // 연결 블록 찾기
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

  // 클릭 이벤트 핸들러
  async function handleCellClick(r, c) {
    if (isProcessing) return;
    const target = grid[r][c];
    if (!target) return;

    if (target === BOMB) {
      isProcessing = true;
      await triggerBomb(r, c);
      return;
    }

    const group = getConnectedGroup(r, c, target);
    if (group.length >= 2) {
      isProcessing = true;
      playPop('normal'); // 일반 터뜨리기 사운드
      createParticles(r, c, target);
      if (navigator.vibrate) navigator.vibrate(30);

      score += group.length * 10;
      const shouldCreateBomb = group.length >= 5;

      // [1단계] 터뜨리기 (비우기)
      group.forEach(({ r: row, c: col }, index) => {
        grid[row][col] = (shouldCreateBomb && index === 0) ? BOMB : null;
      });
      grid = [...grid];

      // [2단계] 중력 이동
      setTimeout(applyGravityOnly, 350);
    }
  }

  // 폭탄 로직
  async function triggerBomb(r, c) {
    playPop('normal'); // 전조 사운드
    if (navigator.vibrate) navigator.vibrate(50);
    
    setTimeout(() => {
      isShaking = true;
      playPop('bomb'); // 폭탄 사운드 (저음)
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

  // 중력: 기존 과일 아래로 밀기
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
    
    // [3단계] 위에서 채우기
    setTimeout(refillGrid, 450);
  }

  // 리필: 비어있는 공간 채우기
  function refillGrid() {
    let hasRefilled = false;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[r][c] === null) {
          grid[r][c] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
          hasRefilled = true;
        }
      }
    }
    
    if (hasRefilled) {
      playPop('refill'); // 리필 사운드 (고음)
      grid = [...grid];
    }

    if (score > bestScore) {
      bestScore = score;
      isNewRecord = true;
      localStorage.setItem('fruitBestScore', bestScore.toString());
    }

    // 모든 처리가 끝나면 클릭 잠금 해제
    setTimeout(() => { isProcessing = false; }, 600);
  }

  onMount(initGame);
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-indigo-50 dark:bg-gray-900 p-4 select-none overflow-hidden">
  
  <div class="w-full max-w-xs flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-5 rounded-[2.5rem] shadow-lg border border-white dark:border-gray-700">
    <div class="text-left">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</p>
      <p class="text-2xl font-black text-indigo-600 dark:text-indigo-400">{score}</p>
    </div>
    <button on:click={() => isMuted = !isMuted} class="text-xl p-2 bg-indigo-50 dark:bg-gray-700 rounded-full active:scale-90 transition-all">
      {isMuted ? '🔇' : '🔊'}
    </button>
    <div class="text-right">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Best</p>
      <p class="text-2xl font-black {isNewRecord ? 'text-orange-500 animate-bounce' : 'text-purple-600'}">{bestScore}</p>
    </div>
  </div>

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
                  <span class={cell === BOMB ? 'animate-pulse scale-110' : ''}>{cell}</span>
                </button>
              {/if}
            </div>
          {/each}
        {/each}
      </div>
    </div>

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

  <div class="mt-10 w-full max-w-xs space-y-4">
    <div class="py-2 bg-white/60 dark:bg-gray-800/60 rounded-full text-center shadow-sm">
       <p class="text-[11px] text-gray-400 font-bold">💡 5개 이상 터뜨리면 <span class="text-lg">💣</span> 보너스!</p>
    </div>
    <button on:click={initGame} class="w-full bg-gray-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">
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
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
  }
  button { -webkit-tap-highlight-color: transparent; outline: none; }
</style>