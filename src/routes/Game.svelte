<script>
  import { onMount } from 'svelte';
  import { scale, fly } from 'svelte/transition';
  import { base } from '../lib/store.js';

  // --- 게임 설정 ---
  const ROWS = 8;
  const COLS = 7;
  const FRUITS = ['🍎', '🍊', '🍇', '🥝', '🍋'];
  const BOMB = '💣';
  
  // 사운드 슬라이스 설정 (3초 파일 내 5개 팝 소리의 시작 지점)
  const POP_START_TIMES = [0, 0.6, 1.2, 1.8, 2.4];

  // --- 상태 관리 ---
  let grid = [];
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('fruitBestScore') || '0');
  let isNewRecord = false;
  let isMuted = false;

  // 오디오 객체 생성
  const popSound = typeof Audio !== 'undefined' ? new Audio(`${base}/sounds/pop.mp3`) : null;

  // --- 효과음 재생 로직 ---
  function playPop(type = 'normal') {
    if (!popSound || isMuted) return;

    // 소리가 겹칠 수 있도록 복제본 생성
    const sound = popSound.cloneNode();
    
    // 5개의 소리 중 랜덤 선택
    const randomIndex = Math.floor(Math.random() * POP_START_TIMES.length);
    sound.currentTime = POP_START_TIMES[randomIndex];

    // 타입에 따른 속도 변화로 다른 느낌 주기
    if (type === 'bomb') {
      sound.playbackRate = 0.7; // 웅장한 소리
    } else if (type === 'refill') {
      sound.playbackRate = 1.4; // 경쾌한 소리
    } else {
      sound.playbackRate = 1.0; // 일반 소리
    }

    sound.play().catch(() => {});

    // 소리가 다음 구간으로 넘어가지 않게 0.5초 후 정지 및 제거
    setTimeout(() => {
      sound.pause();
      sound.remove();
    }, 500);
  }

  // --- 게임 로직 ---
  function initGame() {
    grid = Array.from({ length: ROWS }, () => 
      Array.from({ length: COLS }, () => FRUITS[Math.floor(Math.random() * FRUITS.length)])
    );
    score = 0;
    isNewRecord = false;
  }

  // 연결된 블록 찾기 (DFS)
  function getConnectedGroup(r, c, target, visited = new Set()) {
    const key = `${r},${c}`;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || visited.has(key) || grid[r][c] !== target) return [];
    
    visited.add(key);
    let group = [{ r, c }];
    
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let [dr, dc] of directions) {
      group = group.concat(getConnectedGroup(r + dr, c + dc, target, visited));
    }
    return group;
  }

  // 폭탄 터뜨리기 (3x3 영역)
  function explodeBomb(r, c) {
    playPop('bomb');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    for (let i = r - 1; i <= r + 1; i++) {
      for (let j = c - 1; j <= c + 1; j++) {
        if (i >= 0 && i < ROWS && j >= 0 && j < COLS) {
          grid[i][j] = null;
          score += 20;
        }
      }
    }
    applyGravityAndRefill();
  }

  // 클릭 핸들러
  function handleCellClick(r, c) {
    const target = grid[r][c];
    if (!target) return;

    if (target === BOMB) {
      explodeBomb(r, c);
      return;
    }

    const group = getConnectedGroup(r, c, target);
    if (group.length >= 2) {
      playPop('normal');
      if (navigator.vibrate) navigator.vibrate(30);

      score += group.length * 10;
      
      // 5개 이상 터뜨리면 폭탄 생성 여부 결정
      const shouldCreateBomb = group.length >= 5;

      group.forEach(({ r: row, c: col }, index) => {
        grid[row][col] = (shouldCreateBomb && index === 0) ? BOMB : null;
      });

      applyGravityAndRefill();
    }
  }

  // 중력 및 리필
  function applyGravityAndRefill() {
    let hasRefilled = false;

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
      
      for (let r = emptyRow; r >= 0; r--) {
        grid[r][c] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        hasRefilled = true;
      }
    }
    
    if (hasRefilled) {
      setTimeout(() => playPop('refill'), 100);
    }
    
    grid = [...grid]; // 반응성 트리거

    // 최고 점수 체크
    if (score > bestScore) {
      bestScore = score;
      isNewRecord = true;
      localStorage.setItem('fruitBestScore', bestScore.toString());
    }
  }

  onMount(initGame);
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-indigo-50 dark:bg-gray-900 p-4 font-sans">
  
  <div class="w-full max-w-xs flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="text-left">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</p>
      <p class="text-2xl font-black text-indigo-600">{score}</p>
    </div>
    
    <button on:click={() => isMuted = !isMuted} class="text-xl p-2 bg-gray-50 dark:bg-gray-700 rounded-full active:scale-90 transition-all">
      {isMuted ? '🔇' : '🔊'}
    </button>

    <div class="text-right relative">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Best</p>
      <p class="text-2xl font-black {isNewRecord ? 'text-orange-500 animate-bounce' : 'text-purple-600'}">
        {bestScore}
      </p>
      {#if isNewRecord}
        <span class="absolute -top-3 -right-2 text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
      {/if}
    </div>
  </div>

  <div class="bg-indigo-100 dark:bg-gray-700 p-3 rounded-[2.5rem] shadow-inner border-4 border-white dark:border-gray-800">
    <div class="grid grid-cols-7 gap-1.5">
      {#each grid as row, r}
        {#each row as cell, c}
          <button 
            class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl text-2xl shadow-sm active:scale-75 transition-all duration-150 overflow-hidden"
            on:click={() => handleCellClick(r, c)}
          >
            {#if cell}
              <div in:scale={{ duration: 300, start: 0.3 }} class="select-none">
                {cell}
              </div>
            {/if}
          </button>
        {/each}
      {/each}
    </div>
  </div>

  <div class="mt-8 text-center space-y-4">
    <div class="px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-full backdrop-blur-sm">
      <p class="text-xs text-gray-500 dark:text-gray-400 font-bold">
        💡 5개 이상 터뜨리면 <span class="text-lg">💣</span> 생성!
      </p>
    </div>
    
    <button 
      on:click={initGame} 
      class="bg-gray-900 dark:bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all tracking-wider"
    >
      새 게임 시작
    </button>
  </div>
</div>

<style>
  /* 터치 시 파란색 하이라이트 방지 (모바일용) */
  button {
    -webkit-tap-highlight-color: transparent;
  }
</style>