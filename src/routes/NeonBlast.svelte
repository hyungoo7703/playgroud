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

  function handleRetry() { initPhysics(currentStageData); }
  function handleNextStage() {
    const nextLvl = $gameStore.currentLevel + 1;
    gameStore.update(s => ({ ...s, currentLevel: nextLvl }));
    currentStageData = generateStage(nextLvl);
    initPhysics(currentStageData);
  }

  function loop() {
    updatePhysics(canvas.width, canvas.height);
    render();
    frame = requestAnimationFrame(loop);
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    $gameStore.zones.forEach(z => {
      ctx.fillStyle = 'rgba(217, 70, 239, 0.1)'; ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = '#d946ef'; ctx.strokeRect(z.x, z.y, z.w, z.h);
    });

    $gameStore.blackHoles.forEach(bh => {
      const grad = ctx.createRadialGradient(bh.x, bh.y, 5, bh.x, bh.y, bh.radius);
      grad.addColorStop(0, '#000'); grad.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(bh.x, bh.y, bh.radius, 0, Math.PI*2); ctx.fill();
    });

    $gameStore.movingWalls.forEach(w => {
      ctx.fillStyle = '#fff'; ctx.fillRect(w.x - w.w/2, w.y - w.h/2, w.w, w.h);
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
    window.addEventListener('portalWarp', () => playSfx('warp'));
    window.addEventListener('powerUp', () => playSfx('power-up'));
    window.addEventListener('zoneStart', () => { if (!isMuted && zapAudio) zapAudio.play(); });
    window.addEventListener('zoneStop', () => { if (zapAudio) zapAudio.pause(); });
  });

  onDestroy(() => {
    cancelAnimationFrame(frame);
    if (bgmAudio) bgmAudio.pause();
    if (zapAudio) zapAudio.pause();
  });
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 select-none font-sans">
  {#if !isStarted}
    <div class="text-center animate-fade-in">
      <h1 class="text-7xl font-black text-cyan-400 drop-shadow-[0_0_20px_#22d3ee] mb-12 italic">NEON BLAST</h1>
      <div class="flex flex-col gap-4">
        <button on:click={() => start(true)} class="px-16 py-6 bg-cyan-500 rounded-full font-black text-2xl shadow-lg hover:scale-105 transition-all">새 게임</button>
        {#if $gameStore.currentLevel > 1}
          <button on:click={() => start(false)} class="px-16 py-6 bg-gray-800 rounded-full font-black text-2xl border border-gray-600">이어하기 (LV.{$gameStore.currentLevel})</button>
        {/if}
      </div>
    </div>
  {:else}
    <div class="flex flex-col md:flex-row items-start gap-8">
      
      <div class="flex flex-col items-center">
        <div class="w-full max-w-[400px] flex justify-between p-5 bg-gray-900/80 rounded-3xl mb-4 border border-white/10 backdrop-blur-md">
          <div><span class="text-[10px] text-cyan-400 font-bold uppercase">LV.{$gameStore.currentLevel}</span><p class="text-3xl font-black italic">{$gameStore.ballsLeft}</p></div>
          <button on:click={() => { isMuted = !isMuted; if(isMuted) { bgmAudio.pause(); zapAudio.pause(); } else { bgmAudio.play(); } }} class="p-3 bg-gray-800 rounded-2xl">
            {isMuted ? '🔇' : '🔊'}
          </button>
          <div class="text-right flex flex-col"><span class="text-[10px] text-magenta-500 font-bold uppercase tracking-widest">Score</span><span class="text-3xl font-black italic">{$gameStore.score}</span></div>
        </div>

        <div class="relative w-[400px] aspect-[2/3]">
          <canvas bind:this={canvas} width="400" height="600" on:click={(e) => shootBall(e.offsetX)} on:mousemove={(e) => mouseX = e.offsetX}
            class="w-full h-full rounded-[3.5rem] border-4 border-[#00f3ff] shadow-[0_0_50px_rgba(0,243,255,0.2)]"
            style="background: url('{base}/images/neon/background.png') center/cover;"></canvas>

          {#if $gameStore.isWin || $gameStore.isGameOver}
            <div class="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[3.5rem] z-50">
              <h2 class="text-5xl font-black mb-10 {$gameStore.isWin ? 'text-yellow-400' : 'text-red-600'}">
                {$gameStore.isWin ? 'GOLDEN CLEAR!' : 'GAME OVER'}
              </h2>
              <div class="flex flex-col gap-4 w-64">
                {#if $gameStore.isWin} <button on:click={handleNextStage} class="py-5 bg-cyan-500 rounded-full font-black text-2xl">다음 레벨</button>
                {:else} <button on:click={handleRetry} class="py-5 bg-magenta-500 rounded-full font-black text-2xl">다시 도전하기</button> {/if}
                <button on:click={() => location.reload()} class="py-4 bg-gray-800 rounded-full font-black text-xl border border-gray-600">메인 메뉴로</button>
              </div>
            </div>
          {/if}
        </div>
        <p class="mt-6 text-yellow-400 font-black text-lg animate-pulse">✨ 모든 황금 핀을 제거하면 클리어! ✨</p>
      </div>

      <div class="hidden md:flex flex-col items-center p-6 bg-gray-900/60 rounded-[3rem] border border-cyan-500/20 backdrop-blur-xl">
        <p class="text-magenta-400 font-black text-sm tracking-[0.3em] mb-4 animate-pulse">필살기</p>
        <button on:click={() => useSpecialAbility(mouseX)} class="relative group active:scale-95 transition-all">
          <div class="absolute inset-0 bg-magenta-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div class="relative p-8 bg-gradient-to-br from-magenta-500 to-purple-800 rounded-full border-2 border-white/30 shadow-[0_0_30px_rgba(217,70,239,0.5)]">
            <img src="{base}/images/neon/special-ability-icon.png" alt="Skill" class="w-16 h-16 object-contain" />
          </div>
        </button>
        <p class="mt-4 text-[10px] text-gray-400 font-bold uppercase">Overload [3 Balls]</p>
      </div>

      <div class="md:hidden mt-4">
          <button on:click={() => useSpecialAbility(mouseX)} class="flex items-center gap-3 px-6 py-3 bg-magenta-600 rounded-full font-black italic shadow-lg">
            <img src="{base}/images/neon/special-ability-icon.png" alt="Skill" class="w-6 h-6" />
            필살기 사용
          </button>
      </div>

    </div>
  {/if}
</div>

<style>
  canvas { touch-action: none; cursor: crosshair; }
  .animate-fade-in { animation: fadeIn 0.8s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>