// ====== Config embutida (para rodar direto via file://) ======
const APP_CONFIG = {
  apiBaseUrl: "http://localhost:8001/api-proxy", // Proxy local para contornar CORS
  headers: {},
  requestTimeoutMs: 120000,
  maxRetries: 3,
  retryBaseMs: 600,
  mode: 'cors' // Adiciona modo CORS explícito
};

// ====== Datas fixas ======
const START_DATE_FIXED = "2024-10-15";
const END_DATE_FIXED = "2025-10-03";

// ====== Debug de conectividade ======
function debugLog(message, data = null) {
  const debugEl = document.getElementById("debugInfo");
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] ${message}${data ? `: ${JSON.stringify(data)}` : ""}`;
  console.log(logLine);
  if (debugEl) {
    debugEl.innerHTML += logLine + "<br>";
    debugEl.scrollTop = debugEl.scrollHeight;
  }
}

// ====== Info visual da config (sem buscar arquivo) ======
async function loadConfig() {
  const info = document.getElementById("configInfo");
  if (info) info.textContent = `API: ${APP_CONFIG.apiBaseUrl}`;
  
  debugLog("Config carregada", {
    apiBaseUrl: APP_CONFIG.apiBaseUrl,
    userAgent: navigator.userAgent,
    origin: window.location.origin,
    protocol: window.location.protocol
  });
}

// ====== Áudio ======
let audioCtx;
let audioEnabled = JSON.parse(localStorage.getItem("ex_audioEnabled") ?? "true");
function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playBeep(freq = 660, durMs = 140, type = "sine", gain = 0.06) { if (!audioEnabled) return; ensureAudio(); const now = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, now); g.gain.setValueAtTime(gain, now); o.connect(g).connect(audioCtx.destination); o.start(now); o.stop(now + durMs / 1000); }
function playChord() { playBeep(660, 160, "triangle", 0.07); setTimeout(() => playBeep(880, 160, "triangle", 0.07), 120); setTimeout(() => playBeep(990, 220, "triangle", 0.07), 240); }
function playError() { playBeep(180, 200, "sawtooth", 0.06); setTimeout(() => playBeep(140, 220, "sawtooth", 0.06), 150); }

// ====== Sprites ======
function spriteSVG(score) {
  if (score >= 90) return `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="90" width="128" height="38" fill="#3b7a2a"/><circle cx="64" cy="58" r="18" fill="#22c55e"/><path d="M64 90 C55 70, 40 60, 34 48 C50 50, 60 40, 64 30 C68 40, 78 50, 94 48 C88 60, 73 70, 64 90" fill="#16a34a"/><circle cx="98" cy="36" r="12" fill="#fbbf24"/></svg>`;
  if (score >= 60) return `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="96" width="128" height="32" fill="#2c5a1f"/><circle cx="64" cy="70" r="12" fill="#84cc16"/><path d="M64 96 C58 84, 48 78, 44 70 C52 70, 58 64, 64 58 C70 64, 76 70, 84 70 C80 78, 70 84, 64 96" fill="#65a30d"/></svg>`;
  return `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="102" width="128" height="26" fill="#4b3b2a"/><path d="M64 102 C60 92, 52 86, 50 78 C56 78, 60 74, 64 70 C68 74, 72 78, 78 78 C76 86, 68 92, 64 102" fill="#8b5e34"/><line x1="64" y1="70" x2="64" y2="50" stroke="#8b5e34" stroke-width="3"/></svg>`;
}

// ====== Conquistas ======
const ACHIEVEMENTS = [
  { id: "first_run", label: "Primeira Colheita", emoji: "🌱", desc: "Execute sua primeira simulação." },
  { id: "score_75", label: "Gestor 75+", emoji: "🥈", desc: "Alcance score ≥ 75." },
  { id: "score_90", label: "Guardião 90+", emoji: "🏅", desc: "Alcance score ≥ 90." },
  { id: "efic_2", label: "Eficiência 2.0+", emoji: "💧", desc: "Efic ≥ 2.0 kg/m³." },
  { id: "stress_50", label: "Stress ≤ 50", emoji: "🛡️", desc: "Stress ≤ 50 mm." },
];
function loadProgress() { const best = Number(localStorage.getItem("ex_bestScore") ?? "0"); const unlocked = JSON.parse(localStorage.getItem("ex_achievements") ?? "[]"); return { bestScore: best, unlocked: new Set(unlocked) }; }
function saveProgress(progress) { localStorage.setItem("ex_bestScore", String(progress.bestScore)); localStorage.setItem("ex_achievements", JSON.stringify(Array.from(progress.unlocked))); }
function renderAchievements(progress) {
  document.getElementById("bestScore").textContent = progress.bestScore ? progress.bestScore : "—";
  const ul = document.getElementById("achievementsList"); ul.innerHTML = "";
  ACHIEVEMENTS.forEach(a => {
    const li = document.createElement("li");
    const unlocked = progress.unlocked.has(a.id);
    li.innerHTML = `<span class="emoji">${a.emoji}</span><span class="label">${a.label}</span><span class="desc"> — ${a.desc}${unlocked ? " (Desbloqueada)" : ""}</span>`;
    if (unlocked) li.style.borderColor = "rgba(34,197,94,0.45)";
    ul.appendChild(li);
  });
}

// ====== Regiões e metas ======
const regions = [
  { id: 1, name: "Uberlândia-MG", soil: "SandyLoam" },
  { id: 10, name: "Santarém-PA", soil: "ClayLoam" },
  { id: 11, name: "Ji-Paraná-RO", soil: "Clay" },
  { id: 12, name: "Sinop-MT (Transição)", soil: "SandyClayLoam" },
  { id: 20, name: "Kano-Nigéria", soil: "SandyLoam" },
  { id: 21, name: "Zinder-Níger", soil: "Sand" },
  { id: 22, name: "Ouagadougou-Burkina Faso", soil: "SandyLoam" },
  { id: 30, name: "Punjab-Índia", soil: "SiltLoam" },
  { id: 31, name: "Uttar Pradesh-Índia", soil: "ClayLoam" },
  { id: 32, name: "Central Luzon-Filipinas", soil: "Clay" },
  { id: 33, name: "Delta do Mekong-Vietnã", soil: "Clay" },
  { id: 40, name: "Flevopolder-Holanda", soil: "ClayLoam" },
  { id: 41, name: "Beauce-França", soil: "SiltLoam" },
  { id: 42, name: "Champagne-França", soil: "SiltClayLoam" },
  { id: 50, name: "Iowa-EUA (Corn Belt)", soil: "SiltLoam" },
  { id: 51, name: "Illinois-EUA", soil: "SiltLoam" },
  { id: 52, name: "Nebraska-EUA", soil: "SiltClayLoam" },
  { id: 53, name: "Kansas-EUA", soil: "SiltLoam" },
  { id: 60, name: "Darling Downs-Queensland", soil: "Clay" },
  { id: 61, name: "Riverina-NSW", soil: "ClayLoam" },
  { id: 62, name: "Esperance-Western Australia", soil: "SandyLoam" },
];
const byCropTargetYield = {
  Maize: { goodMin: 8, goodMax: 12 },
  Wheat: { goodMin: 4, goodMax: 6 },
  Rice: { goodMin: 6, goodMax: 9 },
  Cotton: { goodMin: 2.5, goodMax: 4.5 },
  Potato: { goodMin: 20, goodMax: 40 },
  Tomato: { goodMin: 50, goodMax: 90 },
  Soybean: { goodMin: 2.5, goodMax: 4.5 },
};

let growthChart;
let progress = loadProgress();

// ====== UI helpers ======
function populateRegions() {
  const select = document.getElementById("regionSelect");
  select.innerHTML = "";
  for (const r of regions) {
    const opt = document.createElement("option");
    opt.value = String(r.id);
    opt.textContent = `${r.id} • ${r.name} (${r.soil})`;
    select.appendChild(opt);
  }
  select.value = "60";
}
function setupWaterSelect() {
  const waterSelect = document.getElementById("waterSelect");
  const customWrap = document.getElementById("customWaterWrap");
  waterSelect.addEventListener("change", () => {
    customWrap.classList.toggle("hidden", waterSelect.value !== "custom");
  });
}
function setupPreset() {
  document.getElementById("tryPresetBtn").addEventListener("click", () => {
    document.getElementById("regionSelect").value = "20";
    document.getElementById("cropSelect").value = "Maize";
    document.getElementById("resolutionSelect").value = "weekly";
    document.getElementById("waterSelect").value = "WP";
    document.getElementById("customWaterWrap").classList.add("hidden");
    playBeep(520, 120, "square", 0.05);
  });
}
function uiStatus(text, type = "") {
  const el = document.getElementById("status");
  el.textContent = text;
  el.className = "status";
  if (type) el.classList.add(type);
}
function sanitizeGrowth(crescimento) {
  if (!Array.isArray(crescimento)) return [];
  const trimmed = [...crescimento];
  while (trimmed.length > 1) {
    const last = trimmed[trimmed.length - 1];
    if ((Number(last.alt_cm || 0) === 0) && (Number(last.bio_ton || 0) === 0)) trimmed.pop(); else break;
  }
  return trimmed;
}

// ====== API (timeout + retries) com debug detalhado ======
async function callApiWithRetries(payload) {
  if (!APP_CONFIG.apiBaseUrl) throw new Error("API não configurada.");
  
  const headers = { 
    "Content-Type": "application/json",
    ...APP_CONFIG.headers 
  };
  const maxRetries = Math.max(0, APP_CONFIG.maxRetries || 0);
  const baseDelay = Math.max(100, APP_CONFIG.retryBaseMs || 600);

  debugLog("Iniciando chamada API", {
    url: APP_CONFIG.apiBaseUrl,
    method: "POST",
    headers: headers,
    payload: payload,
    maxRetries: maxRetries,
    timeout: APP_CONFIG.requestTimeoutMs
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      debugLog(`Timeout após ${APP_CONFIG.requestTimeoutMs}ms (tentativa ${attempt + 1})`);
      controller.abort();
    }, APP_CONFIG.requestTimeoutMs || 120000);

    try {
      debugLog(`Tentativa ${attempt + 1}/${maxRetries + 1}`, {
        url: APP_CONFIG.apiBaseUrl,
        headers: headers,
        body: JSON.stringify(payload)
      });

      const resp = await fetch(APP_CONFIG.apiBaseUrl, { 
        method: "POST", 
        headers, 
        body: JSON.stringify(payload), 
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });
      
      clearTimeout(timer);

      debugLog(`Resposta recebida (tentativa ${attempt + 1})`, {
        status: resp.status,
        statusText: resp.statusText,
        headers: Object.fromEntries(resp.headers.entries()),
        url: resp.url
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        const errorMsg = `Erro ${resp.status}: ${text || resp.statusText}`;
        
        debugLog(`Erro HTTP (tentativa ${attempt + 1})`, {
          status: resp.status,
          statusText: resp.statusText,
          responseText: text,
          shouldRetry: (resp.status >= 500 || resp.status === 429) && attempt < maxRetries
        });

        if ((resp.status >= 500 || resp.status === 429) && attempt < maxRetries) {
          const retryAfter = Number(resp.headers.get("Retry-After")) || 0;
          const delay = retryAfter > 0 ? retryAfter * 1000 : baseDelay * Math.pow(2, attempt);
          uiStatus(`Tentando novamente (${attempt + 1}/${maxRetries})...`, "warn");
          debugLog(`Aguardando ${delay}ms antes da próxima tentativa`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(errorMsg);
      }

      const jsonData = await resp.json();
      debugLog(`Sucesso (tentativa ${attempt + 1})`, {
        responseSize: JSON.stringify(jsonData).length,
        hasCrescimento: Array.isArray(jsonData.crescimento),
        hasSolo: !!jsonData.solo
      });

      return jsonData;
    } catch (e) {
      clearTimeout(timer);
      
      debugLog(`Erro na tentativa ${attempt + 1}`, {
        name: e.name,
        message: e.message,
        stack: e.stack,
        isAbortError: e.name === "AbortError",
        isNetworkError: e.message.includes("fetch"),
        isCorsError: e.message.includes("CORS") || e.message.includes("cross-origin")
      });

      if (e.name === "AbortError" && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        uiStatus(`Timeout. Repetindo (${attempt + 1}/${maxRetries})...`, "warn");
        debugLog(`Aguardando ${delay}ms após timeout`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        uiStatus(`Falha de rede. Repetindo (${attempt + 1}/${maxRetries})...`, "warn");
        debugLog(`Aguardando ${delay}ms após erro de rede`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      throw e;
    }
  }
}

// ====== Score e render ======
function computeScore(solo, crop) {
  const efic = Number(solo?.efic ?? 0);
  const stress = Number(solo?.stress ?? 0);
  const prod = Number(solo?.prod ?? 0);

  let pEfic; if (efic >= 2.0) pEfic = 100; else if (efic >= 1.5) pEfic = 80 + (efic - 1.5) / 0.5 * 20; else pEfic = Math.max(20, (efic / 1.5) * 80);
  let pStress; if (stress <= 50) pStress = 100; else if (stress <= 150) pStress = 100 - ((stress - 50) / 100) * 60; else pStress = 20;

  const target = byCropTargetYield[crop] || { goodMin: 0, goodMax: 999 };
  let pProd;
  if (prod >= target.goodMin && prod <= target.goodMax) pProd = 100;
  else {
    const dist = prod < target.goodMin ? target.goodMin - prod : prod - target.goodMax;
    pProd = Math.max(30, 100 - dist * 10);
  }

  const score = Math.round(pEfic * 0.4 + pStress * 0.35 + pProd * 0.25);
  let badge = "Aprendiz"; if (score >= 90) badge = "Guardião da Água 🏅"; else if (score >= 75) badge = "Gestor Sustentável 🥈"; else if (score >= 60) badge = "Agrônomo Consciente 🥉";
  return { score, badge, pEfic: Math.round(pEfic), pStress: Math.round(pStress), pProd: Math.round(pProd) };
}
function renderMetrics(solo, crop) {
  document.getElementById("metricEfic").textContent = solo?.efic?.toFixed ? solo.efic.toFixed(2) : "—";
  document.getElementById("metricStress").textContent = solo?.stress?.toFixed ? solo.stress.toFixed(1) : "—";
  document.getElementById("metricProd").textContent = solo?.prod?.toFixed ? solo.prod.toFixed(2) : "—";
  const { score, badge } = computeScore(solo, crop);
  document.getElementById("metricScore").textContent = String(score);
  document.getElementById("badge").textContent = badge;
  document.getElementById("sprite").innerHTML = spriteSVG(score);
}
function renderChart(crescimento) {
  const ctx = document.getElementById("growthChart");
  const labels = crescimento.map((_, i) => `T${i + 1}`);
  const height = crescimento.map(c => c.alt_cm ?? 0);
  const biomass = crescimento.map(c => c.bio_ton ?? 0);
  if (growthChart) { growthChart.data.labels = labels; growthChart.data.datasets[0].data = height; growthChart.data.datasets[1].data = biomass; growthChart.update(); return; }
  growthChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [
      { label: "Altura da raiz (cm)", data: height, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.2)", tension: 0.25 },
      { label: "Biomassa (ton/ha)", data: biomass, borderColor: "#38bdf8", backgroundColor: "rgba(56,189,248,0.2)", tension: 0.25, yAxisID: "y1" }
    ] },
    options: { responsive: true, scales: { y: { title: { display: true, text: "cm" } }, y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "ton/ha" } } }, plugins: { legend: { labels: { color: "#e5e7eb" } } } }
  });
}
function renderRaw(json) { document.getElementById("rawOutput").textContent = JSON.stringify(json, null, 2); }

// ====== Inputs (datas fixas) ======
function validateInputs() {
  const regiao = Number(document.getElementById("regionSelect").value);
  const crop = document.getElementById("cropSelect").value;
  const res = document.getElementById("resolutionSelect").value;
  const waterSel = document.getElementById("waterSelect").value;
  const customWater = document.getElementById("customWater")?.value;
  if (!regiao) throw new Error("Selecione a região.");

  let agua;
  if (waterSel === "custom") {
    const pct = Number(customWater);
    if (isNaN(pct) || pct < 0 || pct > 100) throw new Error("Percentual de água deve ser entre 0 e 100.");
    agua = String(pct);
  } else {
    agua = waterSel;
  }

  const daily = res === "daily";
  const dt_i = START_DATE_FIXED;
  const dt_f = END_DATE_FIXED;
  return { regiao, crop, dt_i, dt_f, daily, agua };
}

// ====== Fluxo principal ======
function evaluateAchievements(result) {
  const newly = [];
  if (!progress.unlocked.has("first_run")) { progress.unlocked.add("first_run"); newly.push("first_run"); }
  if (result.score >= 75 && !progress.unlocked.has("score_75")) { progress.unlocked.add("score_75"); newly.push("score_75"); }
  if (result.score >= 90 && !progress.unlocked.has("score_90")) { progress.unlocked.add("score_90"); newly.push("score_90"); }
  if (result.efic >= 2.0 && !progress.unlocked.has("efic_2")) { progress.unlocked.add("efic_2"); newly.push("efic_2"); }
  if (result.stress <= 50 && !progress.unlocked.has("stress_50")) { progress.unlocked.add("stress_50"); newly.push("stress_50"); }
  if (newly.length) playChord(); else playBeep(700, 120, "triangle", 0.05);
}

async function onSimulate() {
  try {
    uiStatus("Executando simulação...", "");
    playBeep(400, 80, "sine", 0.04);
    
    const inputs = validateInputs();
    debugLog("Inputs validados", inputs);
    
    const payload = { regiao: inputs.regiao, dt_i: inputs.dt_i, dt_f: inputs.dt_f, daily: inputs.daily, agua: inputs.agua, crop: inputs.crop };
    
    let json;
    try {
      json = await callApiWithRetries(payload);
    } catch (apiError) {
      debugLog("Erro na API, usando dados simulados", { error: apiError.message });
      // Dados simulados para demonstração
      json = {
        solo: {
          efic: 1.8,
          stress: 45,
          prod: 8.5
        },
        crescimento: Array.from({ length: 20 }, (_, i) => ({
          alt_cm: Math.min(120, i * 6),
          bio_ton: Math.min(15, i * 0.75)
        }))
      };
      uiStatus("Usando dados simulados (API indisponível)", "warn");
    }
    
    if (!json || (!json.crescimento && !json.solo)) throw new Error("Resposta inesperada da API.");

    const growth = sanitizeGrowth(Array.isArray(json.crescimento) ? json.crescimento : []);
    renderRaw({ ...json, crescimento: growth });
    renderMetrics(json.solo, inputs.crop);
    if (growth.length) renderChart(growth);

    const solo = json.solo || {};
    const { score } = computeScore(solo, inputs.crop);
    if (score > progress.bestScore) { progress.bestScore = score; playBeep(940, 160, "square", 0.06); }
    evaluateAchievements({ score, efic: Number(solo.efic ?? 0), stress: Number(solo.stress ?? 9999) });
    saveProgress(progress);
    renderAchievements(progress);

    const tips = [];
    if (solo.efic < 1.5) tips.push("Baixa eficiência: tente outra região.");
    if (solo.stress > 200) tips.push("Stress muito alto: use água inicial maior (FC/SAT) ou resolução diária.");
    const tg = byCropTargetYield[inputs.crop];
    if (tg && (solo.prod < tg.goodMin || solo.prod > tg.goodMax)) tips.push("Prod fora da faixa típica: ajuste cultura/região.");
    uiStatus(tips.length ? `Dicas: ${tips.join(" | ")}` : "Simulação concluída com sucesso.");

    if (window.farmApplySimulation) {
      farmApplySimulation({ solo, crescimento: growth, crop: inputs.crop });
    }
  } catch (err) {
    console.error("Erro completo:", err);
    debugLog("Erro capturado", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    uiStatus(err.message || "Erro ao executar simulação.", "error");
    playError();
  }
}

// ====== Boot ======
function init() {
  populateRegions();
  setupWaterSelect();
  setupPreset();

  const soundBtn = document.getElementById("soundToggle");
  soundBtn.textContent = audioEnabled ? "🔊" : "🔇";
  soundBtn.addEventListener("click", async () => {
    audioEnabled = !audioEnabled;
    localStorage.setItem("ex_audioEnabled", JSON.stringify(audioEnabled));
    soundBtn.textContent = audioEnabled ? "🔊" : "🔇";
    if (audioEnabled) { ensureAudio(); if (audioCtx.state === "suspended") await audioCtx.resume(); playBeep(700, 100, "sine", 0.04); }
  });

  document.getElementById("resetProgress").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja apagar o progresso?")) {
      localStorage.removeItem("ex_bestScore");
      localStorage.removeItem("ex_achievements");
      progress = loadProgress();
      renderAchievements(progress);
      playBeep(300, 120, "square", 0.05);
    }
  });

  renderAchievements(progress);
  document.getElementById("sprite").innerHTML = spriteSVG(0);
  document.getElementById("simulateBtn").addEventListener("click", onSimulate);
}

document.addEventListener("DOMContentLoaded", async () => { await loadConfig(); init(); });