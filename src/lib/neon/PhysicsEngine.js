import { gameStore } from "../store.js";

const GRAVITY = 0.22;
const BOUNCE = 0.75;
const SUB_STEPS = 4;

export function initPhysics(stage) {
  const resetPegs = stage.pegs.map((p) => ({ ...p, active: true }));
  const resetWalls = stage.movingWalls.map((w) => ({ ...w }));
  const resetBars = stage.rotatingBars.map((b) => ({ ...b }));

  gameStore.update((state) => ({
    ...state,
    pegs: resetPegs,
    zones: stage.gravityZones,
    portals: stage.portals,
    movingWalls: resetWalls,
    rotatingBars: resetBars,
    ballsLeft: stage.ballCount,
    balls: [],
    score: 0,
    isWin: false,
    isGameOver: false,
    suctionTarget: null,
  }));
}

export function updatePhysics(width, height) {
  gameStore.update((state) => {
    if (state.isWin || state.isGameOver) return state;

    // --- [NEW] Start of Update Loop Changes ---
    // 1. Update Shake
    if (state.shake > 0) state.shake *= 0.9;
    if (Math.abs(state.shake) < 0.5) state.shake = 0;

    // 2. Update Particles
    // Simple particle physics: verify particles exist before filtering
    if (state.particles && state.particles.length > 0) {
      state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        p.vy += 0.1; // gravity
      });
      state.particles = state.particles.filter(p => p.life > 0);
    }

    // 3. Update Floating Texts
    if (state.floatingTexts && state.floatingTexts.length > 0) {
      state.floatingTexts.forEach(t => {
        t.y -= 1;
        t.life -= 0.02;
      });
      state.floatingTexts = state.floatingTexts.filter(t => t.life > 0);
    }
    // --- [NEW] End of Update Loop Changes ---

    state.movingWalls.forEach((w) => {
      w.x += w.dir * w.speed;
      if (Math.abs(w.x - 200) > w.range) w.dir *= -1;
    });

    state.rotatingBars.forEach((b) => {
      b.angle += b.speed;
    });

    for (let s = 0; s < SUB_STEPS; s++) {
      state.balls.forEach((ball) => {
        if (state.suctionTarget) {
          const dx = state.suctionTarget.x - ball.x;
          const dy = state.suctionTarget.y - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 8) {
            ball.vx = dx * 0.25;
            ball.vy = dy * 0.25;
          } else {
            ball.y = height + 1000;
            return;
          }
          ball.x += ball.vx;
          ball.y += ball.vy;
          return;
        }

        let gravity = GRAVITY / SUB_STEPS;
        state.zones.forEach((z) => {
          if (
            ball.x > z.x &&
            ball.x < z.x + z.w &&
            ball.y > z.y &&
            ball.y < z.y + z.h
          ) {
            gravity = z.power / SUB_STEPS;
          }
        });

        ball.vy += gravity;
        ball.x += ball.vx / SUB_STEPS;
        ball.y += ball.vy / SUB_STEPS;

        if (ball.x < 15) {
          ball.x = 15;
          ball.vx *= -BOUNCE;
        } else if (ball.x > width - 15) {
          ball.x = width - 15;
          ball.vx *= -BOUNCE;
        }

        state.rotatingBars.forEach((b) => {
          const dx = ball.x - b.x;
          const dy = ball.y - b.y;
          const cos = Math.cos(-b.angle);
          const sin = Math.sin(-b.angle);
          const rx = dx * cos - dy * sin;
          const ry = dx * sin + dy * cos;
          const halfL = b.length / 2 + 7;
          const halfW = b.width / 2 + 7;

          if (Math.abs(rx) < halfL && Math.abs(ry) < halfW) {
            let vrx = ball.vx * cos - ball.vy * sin;
            let vry = ball.vx * sin + ball.vy * cos;
            const pushOut = (halfW - Math.abs(ry)) * Math.sign(ry);
            ball.x += -pushOut * sin;
            ball.y += pushOut * cos;
            vry *= -BOUNCE;
            ball.vx = vrx * Math.cos(b.angle) - vry * Math.sin(b.angle);
            ball.vy = vrx * Math.sin(b.angle) + vry * Math.cos(b.angle);
            window.dispatchEvent(new CustomEvent("pegHit"));
          }
        });

        state.pegs.forEach((peg) => {
          if (!peg.active) return;
          const dist = Math.sqrt((ball.x - peg.x) ** 2 + (ball.y - peg.y) ** 2);
          if (dist < peg.radius + 8) {
            if (peg.type === "suction") {
              state.suctionTarget = { x: peg.x, y: peg.y };
              window.dispatchEvent(new CustomEvent("powerUp"));
              peg.active = false;
              // Effect for suction
              state.shake = 10;
              createExplosion(state, peg.x, peg.y, peg.color);
            } else {
              const angle = Math.atan2(ball.y - peg.y, ball.x - peg.x);
              ball.vx = Math.cos(angle) * 7;
              ball.vy = Math.sin(angle) * 7;
              peg.active = false;

              // --- [NEW] Scoring & Combo Logic ---
              state.currentCombo = (state.currentCombo || 0) + 1;
              const baseScore = peg.type === "gold" ? 1000 : 100;
              const comboMultiplier = 1 + (state.currentCombo * 0.1); // +10% per combo
              const finalScore = Math.floor(baseScore * comboMultiplier);
              state.score += finalScore;

              // Effects
              createExplosion(state, peg.x, peg.y, peg.color);
              state.floatingTexts.push({
                x: peg.x,
                y: peg.y,
                text: `+${finalScore}`,
                life: 1.0,
                color: peg.type === "gold" ? "#ffff00" : "#fff"
              });
              if (peg.type === 'gold' || state.currentCombo % 5 === 0) state.shake = 5;

              window.dispatchEvent(new CustomEvent("pegHit"));
            }
          }
        });

        state.portals.forEach((p) => {
          if (
            Math.sqrt((ball.x - p.entry.x) ** 2 + (ball.y - p.entry.y) ** 2) <
            22
          ) {
            ball.x = p.exit.x;
            ball.y = p.exit.y;
            window.dispatchEvent(new CustomEvent("portalWarp"));
          }
        });
      });
    }

    const activeBalls = state.balls.filter((b) => b.y < height);
    if (state.suctionTarget && activeBalls.length === 0)
      state.suctionTarget = null;

    const goldLeft = state.pegs.filter(
      (p) => p.type === "gold" && p.active
    ).length;
    if (goldLeft === 0 && state.pegs.length > 0 && !state.isWin) {
      state.isWin = true;
      const nextLevel = state.currentLevel + 1;
      const newHighScore = Math.max(state.highScore, state.score);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          "neon_blast_save",
          JSON.stringify({ level: nextLevel, highScore: newHighScore })
        );
      }
      state.currentLevel = nextLevel;
      state.highScore = newHighScore;
    }

    if (state.ballsLeft === 0 && activeBalls.length === 0 && !state.isWin)
      state.isGameOver = true;
    return { ...state, balls: activeBalls };
  });
}

function createExplosion(state, x, y, color) {
  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1.0,
      color: color
    });
  }
}

// 이 함수가 정상적으로 export 되어야 에러가 해결됩니다!
export function shootBall(x) {
  gameStore.update((state) => {
    if (
      state.ballsLeft <= 0 ||
      state.isWin ||
      state.isGameOver ||
      state.suctionTarget
    )
      return state;

    // Reset combo on new shot? 
    // Usually peggle style is combo per shot, accumulating.
    // Let's reset combo to 0 for the new shot

    return {
      ...state,
      ballsLeft: state.ballsLeft - 1,
      currentCombo: 0, // Reset combo
      balls: [
        ...state.balls,
        { x, y: 30, vx: (Math.random() - 0.5) * 2, vy: 3 },
      ],
    };
  });
}
