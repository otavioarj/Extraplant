const FARM_SIZE = 25; // 5x5
const FARM_COLS = 5;

const FarmTileState = {
  EMPTY: "empty",
  PLANTED: "planted",
  GROWING: "growing",
  READY: "ready"
};

let farm = {
  day: 1,
  waterLevel: 50,
  coins: 0,
  tiles: Array.from({ length: FARM_SIZE }, () => ({ state: FarmTileState.EMPTY, growth: 0, growthTarget: 100, crop: null })),
  season: { growthRatePerDay: 6, waterDrainPerDay: 4, yieldMultiplier: 1.0 }
};

function farmInitGrid() {
  const grid = document.getElementById("farmGrid");
  grid.innerHTML = "";
  for (let i = 0; i < FARM_SIZE; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "farm-tile";
    cell.dataset.idx = String(i);
    cell.addEventListener("click", () => farmOnTileClick(i));
    grid.appendChild(cell);
  }
  farmRender();
}

function farmSpriteByTile(tile) {
  if (tile.state === FarmTileState.EMPTY) return `<svg class="farm-sprite" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="46" width="64" height="18" fill="#4b3b2a"/></svg>`;
  if (tile.state === FarmTileState.PLANTED) return `<svg class="farm-sprite" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="46" width="64" height="18" fill="#4b3b2a"/><circle cx="32" cy="42" r="4" fill="#84cc16"/></svg>`;
  if (tile.state === FarmTileState.GROWING) {
    const h = Math.max(6, Math.floor((tile.growth / tile.growthTarget) * 24));
    return `<svg class="farm-sprite" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="46" width="64" height="18" fill="#3b2b1a"/><rect x="31" y="${46 - h}" width="2" height="${h}" fill="#65a30d"/><circle cx="28" cy="${46 - h}" r="4" fill="#84cc16"/><circle cx="36" cy="${46 - h}" r="4" fill="#84cc16"/></svg>`;
  }
  return `<svg class="farm-sprite" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="46" width="64" height="18" fill="#2c5a1f"/><circle cx="24" cy="28" r="8" fill="#f59e0b"/><circle cx="40" cy="24" r="10" fill="#fbbf24"/></svg>`;
}

function farmRender() {
  document.getElementById("farmDay").textContent = String(farm.day);
  document.getElementById("farmWaterLevel").textContent = String(farm.waterLevel);
  document.getElementById("farmCoins").textContent = String(farm.coins);

  const grid = document.getElementById("farmGrid").children;
  for (let i = 0; i < FARM_SIZE; i++) {
    const tile = farm.tiles[i];
    const cell = grid[i];
    cell.innerHTML = farmSpriteByTile(tile);
    cell.title = tile.state === FarmTileState.EMPTY ? "Vazio" : `${tile.state} • ${Math.min(100, Math.round(100 * tile.growth / tile.growthTarget))}%`;
    cell.querySelector(".farm-sprite")?.setAttribute("aria-label", tile.state);
    cell.querySelector(".badge-floating")?.remove();
    if (tile.state === FarmTileState.READY) {
      const b = document.createElement("div"); b.className = "badge-floating"; b.textContent = "Pronto"; cell.appendChild(b);
    }
  }
}

function farmOnTileClick(idx) {
  const mode = farm.currentAction || "plant";
  const tile = farm.tiles[idx];
  if (mode === "plant") {
    if (tile.state !== FarmTileState.EMPTY) { playError(); return; }
    tile.state = FarmTileState.PLANTED; tile.growth = 0; tile.growthTarget = 100; tile.crop = "default"; playBeep(700, 80, "square", 0.05);
  } else if (mode === "water") {
    farm.waterLevel = Math.min(100, farm.waterLevel + 15); playBeep(520, 100, "sine", 0.04);
  } else if (mode === "harvest") {
    if (tile.state !== FarmTileState.READY) { playError(); return; }
    const coinsEarned = Math.max(1, Math.round(5 * farm.season.yieldMultiplier));
    farm.coins += coinsEarned; tile.state = FarmTileState.EMPTY; tile.growth = 0; tile.crop = null; playChord();
  }
  farmRender();
}

function farmSetAction(action) {
  farm.currentAction = action;
  if (action === "plant") playBeep(600, 60, "sine", 0.04);
  if (action === "water") playBeep(500, 60, "sine", 0.04);
  if (action === "harvest") playBeep(800, 60, "sine", 0.04);
}

function farmNextDay() {
  farm.waterLevel = Math.max(0, farm.waterLevel - farm.season.waterDrainPerDay);
  for (const tile of farm.tiles) {
    if (tile.state === FarmTileState.PLANTED || tile.state === FarmTileState.GROWING) {
      const waterFactor = farm.waterLevel >= 50 ? 1.0 : farm.waterLevel >= 25 ? 0.7 : 0.4;
      tile.growth += farm.season.growthRatePerDay * waterFactor;
      tile.state = tile.growth >= tile.growthTarget ? FarmTileState.READY : FarmTileState.GROWING;
    }
  }
  farm.day += 1;
  farmRender();
}

function farmApplySimulation({ solo, crescimento, crop }) {
  const { score } = computeScore(solo, crop);
  const rate = score >= 90 ? 12 : score >= 75 ? 9 : score >= 60 ? 7 : 5;
  const drain = solo.stress <= 50 ? 3 : solo.stress <= 150 ? 5 : 7;
  const yieldMul = score >= 90 ? 1.8 : score >= 75 ? 1.4 : score >= 60 ? 1.1 : 0.8;
  const len = Array.isArray(crescimento) ? Math.max(1, crescimento.length) : 60;
  const lenFactor = len >= 120 ? 1.1 : len >= 60 ? 1.0 : 0.9;

  farm.season.growthRatePerDay = Math.round(rate * lenFactor);
  farm.season.waterDrainPerDay = Math.round(drain);
  farm.season.yieldMultiplier = Number(yieldMul.toFixed(2));

  uiStatus(`Temporada: crescimento ${farm.season.growthRatePerDay}%/dia, drenagem ${farm.season.waterDrainPerDay}/dia, rendimento x${farm.season.yieldMultiplier}.`);
  playBeep(900, 120, "triangle", 0.05);
}

(function farmBoot(){
  if (!document.getElementById("farmGrid")) return;
  farmInitGrid();
  document.getElementById("farmPlant").addEventListener("click", () => farmSetAction("plant"));
  document.getElementById("farmWater").addEventListener("click", () => farmSetAction("water"));
  document.getElementById("farmHarvest").addEventListener("click", () => farmSetAction("harvest"));
  setInterval(farmNextDay, 4000);
})();