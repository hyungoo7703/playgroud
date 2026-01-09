<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { gameStore, base } from '../lib/store.js';
  import { generateStage } from '../lib/neon/StageData.js';
  import { initPhysics, updatePhysics, shootBall, useSpecialAbility } from '../lib/neon/PhysicsEngine.js';

  let canvas, ctx, frame, isStarted = false;
  let isMuted = false;
  let zapAudio, bgmAudio;
  let mouseX = 200;
  let currentStageData;

  const playSfx = (name) => {
    if (isMuted) return;
    const audio = new Audio(`${base}/sounds/neon/${name}.mp3`);
    audio.volume = 0.4; audio.play().catch(() => {});
  };

  function stopPersistentSounds() {
    if (zapAudio) { zapAudio.pause(); zapAudio.currentTime = 0; }
    gameStore.update(s => ({ ...s, wasZoneActive: false }));
  }

  async function start(isNew = true) {
    if (isNew) {
      localStorage.setItem('neon_blast_save', JSON.stringify({ level: 1, highScore: $gameStore.highScore }));
      gameStore.update(s => ({ ...s, currentLevel: 1 }));
    }
    isStarted = true;
    await tick();
    ctx = canvas.getContext('2d');
    zapAudio = new Audio(`${base}/sounds/neon/zap-synth.mp3`); zapAudio.loop = true; zapAudio.volume = 0.3;
    bgmAudio = new Audio(`${base}/sounds/neon/bgm.mp3`); bgmAudio.loop = true; bgmAudio.volume = 0.4;
    if (!isMuted) bgmAudio.play().catch(() => {});
    currentStageData = generateStage($gameStore.currentLevel);
    initPhysics(currentStageData);
    loop();
  }

  function handleRetry() { stopPersistentSounds(); initPhysics(currentStageData); }
  function handleNextStage() {
    stopPersistentSounds();
    const nextLvl = $gameStore.currentLevel + 1;
    gameStore.update(s => ({ ...s, currentLevel: nextLvl }));
    currentStageData = generateStage(nextLvl);
    initPhysics(currentStageData);
  }

  function loop() { updatePhysics(canvas.width, canvas.height); render(); frame = requestAnimationFrame(loop); }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    $gameStore.zones.forEach(z => {
      ctx.fillStyle = 'rgba(217, 70, 239, 0.15)'; ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = '#d946ef'; ctx.lineWidth = 2; ctx.strokeRect(z.x, z.y, z.w, z.h);
    });
    $gameStore.blackHoles.forEach(bh => {
      const grad = ctx.createRadialGradient(bh.x, bh.y, 5, bh.x, bh.y, bh.radius);
      grad.addColorStop(0, '#000'); grad.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(bh.x, bh.y, bh.radius, 0, Math.PI*2); ctx.fill();
    });
    $gameStore.movingWalls.forEach(w => {
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
      ctx.fillRect(w.x - w.w/2, w.y - w.h/2, w.w, w.h);
    });
    $gameStore.pegs.forEach(p => {
      if (!p.active) return;
      const isGold = p.type === 'gold';
      ctx.shadowBlur = isGold ? 40 : 15; ctx.shadowColor = p.color;
      ctx.fillStyle = isGold ? '#fff' : p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
      if (isGold) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
    });
    $gameStore.balls.forEach(b => {
      ctx.shadowBlur = 10; ctx.shadowColor = '#ff00ff';
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI*2); ctx.fill();
    });
  }

  onMount(() => {
    window.addEventListener('pegHit', () => playSfx('glass-clink'));
    window.addEventListener('powerUp', () => playSfx('power-up'));
    window.addEventListener('zoneStart', () => { if (!isMuted && zapAudio) zapAudio.play(); });
    window.addEventListener('zoneStop', () => { if (zapAudio) { zapAudio.pause(); zapAudio.currentTime = 0; } });
  });

  onDestroy(() => { cancelAnimationFrame(frame); if (bgmAudio) bgmAudio.pause(); if (zapAudio) zapAudio.pause(); });
</script>

<div class="flex flex-col items-center w-full min-h-screen h-[100dvh] bg-[#050505] text-white overflow-y-auto md:overflow-hidden select-none font-sans relative">
  
  {#if !isStarted}
    <div class="flex flex-col items-center justify-center flex-1 w-full px-6 py-20">
      <h1 class="text-6xl font-black text-cyan-400 drop-shadow-[0_0_20px_#22d3ee] mb-16 italic text-center">NEON BLAST</h1>
      <div class="flex flex-col gap-5 w-full max-w-sm">
        <button on:click={() => start(true)} class="w-full py-6 bg-cyan-500 rounded-full font-black text-2xl shadow-xl active:scale-95 transition-all">새 게임</button>
        {#if $gameStore.currentLevel > 1}
          <button on:click={() => start(false)} class="w-full py-6 bg-gray-800 rounded-full font-black text-2xl border border-gray-600 active:scale-95">이어하기 (LV.{$gameStore.currentLevel})</button>
        {/if}
      </div>
    </div>
  {:else}
    <header class="w-full max-w-[500px] px-5 py-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-md border-b border-white/10 shrink-0">
      <div class="flex flex-col">
        <span class="text-[10px] text-cyan-400 font-bold uppercase tracking-widest leading-none">Stage {$gameStore.currentLevel}</span>
        <p class="text-2xl font-black italic text-white mt-1">{$gameStore.ballsLeft}</p>
      </div>
      <button on:click={() => { isMuted = !isMuted; if(isMuted) { bgmAudio.pause(); zapAudio.pause(); } else { bgmAudio.play(); } }} class="p-2 bg-gray-800 rounded-xl border border-gray-700">
        {isMuted ? '🔇' : '🔊'}
      </button>
      <div class="text-right flex flex-col">
        <span class="text-[10px] text-magenta-500 font-bold uppercase tracking-widest leading-none">Score</span>
        <p class="text-2xl font-black italic text-white mt-1">{$gameStore.score}</p>
      </div>
    </header>

    <main class="flex-1 w-full max-w-[500px] flex flex-col items-center justify-center p-2 min-h-0 relative">
      <p class="mb-3 text-yellow-400 font-black text-base animate-pulse text-center">✨ 모든 황금 핀을 제거하면 클리어! ✨</p>
      <div class="relative w-full h-full max-h-[65dvh] aspect-[2/3] group">
        <canvas bind:this={canvas} width="400" height="600" on:click={(e) => shootBall(e.offsetX)} on:mousemove={(e) => mouseX = e.offsetX}
          class="w-full h-full rounded-[2.5rem] border-4 border-[#00f3ff] shadow-[0_0_40px_rgba(0,243,255,0.2)]"
          style="background: url('{base}/images/neon/background.png') center/cover;"></canvas>

        {#if $gameStore.isWin || $gameStore.isGameOver}
          <div class="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[2.5rem] z-50 p-6 backdrop-blur-sm">
            <h2 class="text-5xl font-black mb-10 text-center {$gameStore.isWin ? 'text-yellow-400' : 'text-red-600'}">
              {$gameStore.isWin ? 'GOLDEN CLEAR!' : 'GAME OVER'}
            </h2>
            <div class="flex flex-col gap-4 w-full max-w-[260px]">
              {#if $gameStore.isWin} <button on:click={handleNextStage} class="w-full py-5 bg-cyan-500 rounded-full font-black text-2xl shadow-lg active:scale-95">다음 레벨</button>
              {:else} <button on:click={handleRetry} class="w-full py-5 bg-magenta-500 rounded-full font-black text-2xl shadow-lg active:scale-95">다시 도전하기</button> {/if}
              <button on:click={() => location.reload()} class="w-full py-4 bg-gray-800 rounded-full font-black text-xl border border-gray-600">메인 메뉴로</button>
            </div>
          </div>
        {/if}
      </div>
    </main>

    <footer class="absolute bottom-6 right-6 z-40 md:relative md:bottom-auto md:right-auto md:w-full md:max-w-[450px] md:py-6 md:flex md:justify-center shrink-0">
      <button on:click={() => useSpecialAbility(mouseX)} class="flex items-center gap-4 px-8 py-4 bg-gradient-to-br from-magenta-500 to-purple-800 rounded-3xl border-2 border-white/30 shadow-[0_0_25px_rgba(217,70,239,0.5)] active:scale-90 transition-all group">
        <div class="relative">
          <div class="absolute inset-0 bg-white blur-md opacity-20"></div>
          <img src="{base}/images/neon/special-ability-icon.png" alt="Skill" class="w-7 h-7 object-contain relative z-10" />
        </div>
        <div class="flex flex-col items-start leading-none">
          <span class="text-white font-black text-xl italic leading-none">필살기 사용</span>
          <span class="text-magenta-200 text-[9px] font-bold uppercase tracking-tighter mt-1">Overload [3 Balls]</span>
        </div>
      </button>
    </footer>
  {/if}
</div>

<style>
  canvas { touch-action: none; cursor: crosshair; }
  .animate-fade-in { animation: fadeIn 0.5s ease-out; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  :global(body) { background-color: #050505; margin: 0; padding: 0; }
</style>