export const generateStage = (level) => {
  const pegs = [];
  const movingWalls = [];
  const portals = [];
  const blackHoles = [];
  const rows = 15;
  const cols = 10;

  // 1. 핀 배치: 레벨이 높을수록 황금 핀이 아래쪽(장애물 뒤)에 배치됨
  for (let r = 5; r < rows - 2; r += 2) {
    for (let c = 1; c < cols; c++) {
      if (Math.random() > 0.4) {
        const isGold =
          level < 10 ? Math.random() > 0.8 : r > 10 && Math.random() > 0.7;
        pegs.push({
          x: c * (400 / cols) + 20,
          y: r * 38,
          type: isGold ? "gold" : "normal",
          color: isGold ? "#ffff00" : "#00f3ff",
          radius: isGold ? 16 : 12,
          active: true,
        });
      }
    }
  }

  // 2. 장애물: 스테이지 10부터 움직이는 벽 (황금 핀 앞을 가로막음)
  if (level >= 10) {
    movingWalls.push({
      x: 200,
      y: 350,
      w: 120,
      h: 20,
      dir: 1,
      speed: 2 + level * 0.05,
      range: 140,
    });
  }

  // 3. 워프: 스테이지 20부터 포탈 등장
  if (level >= 20) {
    portals.push({ entry: { x: 60, y: 450 }, exit: { x: 340, y: 120 } });
  }

  // 4. 지옥의 구간: 스테이지 50부터 블랙홀 핀 등장 (구슬을 강력하게 끌어당김)
  if (level >= 50) {
    blackHoles.push({ x: 200, y: 250, radius: 40, force: 0.8 });
  }

  return {
    level,
    pegs,
    movingWalls,
    portals,
    blackHoles,
    ballCount: Math.max(5, 12 - Math.floor(level / 15)), // 레벨이 높을수록 기본 구슬 수 감소
    gravityZones: [{ x: 100, y: 200, w: 200, h: 100, power: -0.15 }],
  };
};
