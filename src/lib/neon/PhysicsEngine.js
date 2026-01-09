import { gameStore } from "../store.js";

const GRAVITY = 0.22;
const BOUNCE = 0.75;
const SUB_STEPS = 4;

export function initPhysics(stage) {
  gameStore.update((state) => ({
    ...state,
    pegs: stage.pegs,
    zones: stage.gravityZones,
    portals: stage.portals,
    movingWalls: stage.movingWalls,
    blackHoles: stage.blackHoles || [],
    ballsLeft: stage.ballCount,
    balls: [],
    particles: [],
    score: 0,
    isWin: false,
    isGameOver: false,
    wasZoneActive: false,
  }));
}

export function updatePhysics(width, height) {
  gameStore.update((state) => {
    if (state.isWin || state.isGameOver) return state;

    state.movingWalls.forEach((w) => {
      w.x += w.dir * w.speed;
      if (Math.abs(w.x - 200) > w.range) w.dir *= -1;
    });

    let anyBallInZone = false;

    for (let s = 0; s < SUB_STEPS; s++) {
      state.balls.forEach((ball) => {
        let gravity = GRAVITY / SUB_STEPS;

        state.blackHoles.forEach((bh) => {
          const dx = bh.x - ball.x;
          const dy = bh.y - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ball.vx += (dx / dist) * (bh.force / SUB_STEPS);
            ball.vy += (dy / dist) * (bh.force / SUB_STEPS);
          }
        });

        state.zones.forEach((z) => {
          if (
            ball.x > z.x &&
            ball.x < z.x + z.w &&
            ball.y > z.y &&
            ball.y < z.y + z.h
          ) {
            gravity = z.power / SUB_STEPS;
            anyBallInZone = true;
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

        state.movingWalls.forEach((w) => {
          const halfW = w.w / 2 + 7;
          const halfH = w.h / 2 + 7;
          if (
            ball.x > w.x - halfW &&
            ball.x < w.x + halfW &&
            ball.y > w.y - halfH &&
            ball.y < w.y + halfH
          ) {
            ball.vy *= -BOUNCE;
            ball.y = ball.vy > 0 ? w.y + halfH : w.y - halfH;
            window.dispatchEvent(new CustomEvent("pegHit"));
          }
        });

        state.pegs.forEach((peg) => {
          if (!peg.active) return;
          const dist = Math.sqrt((ball.x - peg.x) ** 2 + (ball.y - peg.y) ** 2);
          const minDist = peg.type === "gold" ? 24 : 18;
          if (dist < minDist) {
            const angle = Math.atan2(ball.y - peg.y, ball.x - peg.x);
            ball.vx = Math.cos(angle) * 7;
            ball.vy = Math.sin(angle) * 7;
            peg.active = false;
            state.score += peg.type === "gold" ? 1000 : 100;
            window.dispatchEvent(new CustomEvent("pegHit"));
          }
        });

        state.portals.forEach((p) => {
          if (
            Math.sqrt((ball.x - p.entry.x) ** 2 + (ball.y - p.entry.y) ** 2) <
            20
          ) {
            ball.x = p.exit.x;
            ball.y = p.exit.y;
            window.dispatchEvent(new CustomEvent("portalWarp"));
          }
        });
      });
    }

    if (anyBallInZone && !state.wasZoneActive) {
      window.dispatchEvent(new CustomEvent("zoneStart"));
      state.wasZoneActive = true;
    } else if (!anyBallInZone && state.wasZoneActive) {
      window.dispatchEvent(new CustomEvent("zoneStop"));
      state.wasZoneActive = false;
    }

    const goldLeft = state.pegs.filter(
      (p) => p.type === "gold" && p.active
    ).length;
    if (goldLeft === 0 && state.pegs.length > 0) {
      state.isWin = true;
      localStorage.setItem(
        "neon_blast_save",
        JSON.stringify({
          level: state.currentLevel + 1,
          highScore: Math.max(state.highScore, state.score),
        })
      );
    }
    if (state.ballsLeft === 0 && state.balls.length === 0 && !state.isWin)
      state.isGameOver = true;

    return { ...state, balls: state.balls.filter((b) => b.y < height + 50) };
  });
}

export function shootBall(x) {
  gameStore.update((state) => {
    if (state.ballsLeft <= 0 || state.isWin || state.isGameOver) return state;
    return {
      ...state,
      ballsLeft: state.ballsLeft - 1,
      balls: [
        ...state.balls,
        { x, y: 30, vx: (Math.random() - 0.5) * 2, vy: 3 },
      ],
    };
  });
}

export function useSpecialAbility(x) {
  gameStore.update((state) => {
    if (state.ballsLeft < 3 || state.isWin || state.isGameOver) return state;
    window.dispatchEvent(new CustomEvent("powerUp"));
    const newBalls = [-2, 0, 2].map((vx) => ({ x, y: 35, vx, vy: 5 }));
    return {
      ...state,
      ballsLeft: state.ballsLeft - 3,
      balls: [...state.balls, ...newBalls],
    };
  });
}
