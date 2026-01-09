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
    $gameStore.movingWalls.forEach(w => {
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
      ctx.fillRect(w.x - w.w/2, w.y - w.h/2, w.w, w.h);
    });
    $gameStore.pegs.forEach(p => {
      if (!p.active) return;
      const isGold = p.type === 'gold';
      ctx.shadowBlur = isGold ? 45 : 15; ctx.shadowColor = p.color;
      ctx.fillStyle = isGold ? '#fff' : p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
      if (isGold) { ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 4; ctx.stroke(); }
    });
    $gameStore.balls.forEach(b => {
      ctx.shadowBlur = 10; ctx.shadowColor = '#ff00ff';
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI*2); ctx.fill();
    });
  }

  function handleShoot(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    shootBall((e.clientX - rect.left) * scaleX);
  }

  onMount(() => {
    window.addEventListener('pegHit', () => playSfx('glass-clink'));
    window.addEventListener('portalWarp', () => playSfx('warp'));
    window.addEventListener('powerUp', () => playSfx('power-up'));
    window.addEventListener('zoneStart', () => { if (!isMuted && zapAudio) zapAudio.play(); });
    window.addEventListener('zoneStop', () => { if (zapAudio) { zapAudio.pause(); zapAudio.currentTime = 0; } });
  });

  onDestroy(() => { stopPersistentSounds(); cancelAnimationFrame(frame); if (bgmAudio) bgmAudio.pause(); });
</script>

<div class="flex flex-col items-center w-full h-[100dvh] md:h-auto md:min-h-screen bg-[#050505] text-white select-none font-sans relative overflow-hidden md:overflow-y-auto">
  
  {#if !isStarted}
    <div class="flex flex-col items-center justify-center min-h-[100dvh] w-full px-6 py-20 z-10">
      <h1 class="text-6xl font-black text-cyan-400 drop-shadow-[0_0_20px_#22d3ee] mb-16 italic text-center">NEON BLAST</h1>
      <div class="flex flex-col gap-6 w-full max-w-sm">
        <button on:click={() => start(true)} class="w-full py-6 bg-cyan-500 rounded-full font-black text-2xl shadow-xl active:scale-95 transition-all">새 게임</button>
        {#if $gameStore.currentLevel > 1}
          <button on:click={() => start(false)} class="w-full py-6 bg-gray-800 rounded-full font-black text-2xl border border-gray-600 active:scale-95">이어하기 (LV.{$gameStore.currentLevel})</button>
        {/if}
      </div>
    </div>
  {:else}
    <header class="w-full max-w-[480px] px-5 py-2 flex justify-between items-center bg-gray-900/60 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
      <div class="flex flex-col">
        <span class="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Stage {$gameStore.currentLevel}</span>
        <p class="text-2xl font-black italic">{$gameStore.ballsLeft}</p>
      </div>
      <button on:click={() => { isMuted = !isMuted; if(isMuted) { bgmAudio.pause(); zapAudio.pause(); } else { bgmAudio.play(); } }} class="p-2 bg-gray-800 rounded-xl border border-gray-700">
        {isMuted ? '🔇' : '🔊'}
      </button>
      <div class="text-right flex flex-col">
        <span class="text-[10px] text-magenta-500 font-bold uppercase tracking-widest">Score</span>
        <p class="text-2xl font-black italic">{$gameStore.score}</p>
      </div>
    </header>

    <main class="flex-1 w-full max-w-[480px] flex flex-col items-center justify-center p-2 min-h-0 relative">
      <div class="mt-1 mb-2 text-center shrink-0 z-10">
        <p class="text-yellow-400 font-black text-base animate-pulse">✨ 모든 황금 핀을 제거하면 클리어! ✨</p>
      </div>
      
      <div class="relative w-full h-full max-h-[52dvh] md:max-h-none aspect-[2/3] touch-none">
        <canvas bind:this={canvas} width="400" height="600" 
          on:click={handleShoot} 
          on:mousemove={(e) => { const rect = canvas.getBoundingClientRect(); mouseX = (e.clientX - rect.left) * (canvas.width / rect.width); }}
          class="w-full h-full rounded-[2.8rem] border-4 border-[#00f3ff] shadow-[0_0_50px_rgba(0,243,255,0.25)]"
          style="background: url('{base}/images/neon/background.png') center/cover;"></canvas>

        {#if $gameStore.isWin || $gameStore.isGameOver}
          <div class="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[2.8rem] z-50 p-6 backdrop-blur-sm animate-fade-in">
            <h2 class="text-5xl font-black mb-10 text-center {$gameStore.isWin ? 'text-yellow-400' : 'text-red-600'}">
              {$gameStore.isWin ? 'STAY GOLD!' : 'FAILED'}
            </h2>
            <div class="flex flex-col gap-4 w-full max-w-[260px]">
              {#if $gameStore.isWin} <button on:click={handleNextStage} class="w-full py-5 bg-cyan-500 rounded-full font-black text-2xl shadow-lg active:scale-95 transition-all">다음 단계로</button>
              {:else} <button on:click={handleRetry} class="w-full py-5 bg-magenta-500 rounded-full font-black text-2xl shadow-lg active:scale-95 transition-all">다시 도전</button> {/if}
              <button on:click={() => location.reload()} class="w-full py-4 bg-gray-800 rounded-full font-black text-xl border border-gray-600 active:scale-95">메인 메뉴</button>
            </div>
          </div>
        {/if}
      </div>
    </main>

    <footer class="w-full py-3 px-8 flex justify-center items-center shrink-0 z-20">
      <button on:click={() => useSpecialAbility(mouseX)} class="flex items-center gap-5 px-10 py-4 bg-gradient-to-br from-magenta-500 to-purple-800 rounded-full border-2 border-white/30 shadow-[0_0_25px_rgba(217,70,239,0.5)] active:scale-90 transition-all group overflow-hidden">
        <div class="relative">
          <div class="absolute inset-0 bg-white blur-md opacity-25"></div>
          <img src="{base}/images/neon/special-ability-icon.png" alt="Skill" class="w-9 h-9 object-contain relative z-10" />
        </div>
        <div class="flex flex-col items-start leading-none">
          <span class="text-white font-black text-2xl italic leading-none">필살기 사용</span>
          <span class="text-magenta-200 text-[10px] font-bold uppercase mt-1 opacity-80">Overload [3 Balls]</span>
        </div>
      </button>
    </footer>

  {/if}
</div>

<style>
  canvas { touch-action: none; cursor: crosshair; }
  .animate-fade-in { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  
  /* 전역 바디 설정: 웹 스크롤을 위해 overflow: hidden 제거 */
  :global(body) {
    background-color: #050505;
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
  }
</style>