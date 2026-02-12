// =============================================
// APP CONTROLLER (v2.0 core + v1.0 Doubles UI + dynamic Summary)
// =============================================
let scoreBuffer = "";                 // for match keypad
let matchKeyListenerBound = false;    // guard multiple keydown handlers

let Match = null;
let Doubles = null;
let Checkout = null;
let Undo = null;

// Track active screen
let currentScreen = "setup";

document.addEventListener("DOMContentLoaded", () => {
  // Cache engines
  Match   = window.MatchEngine;
  Doubles = window.DoublesEngine;
  Checkout= window.CheckoutEngine;
  Undo    = window.UndoEngine;

  setupNavigation();
  setupSetupScreen();

  // Ensure Doubles has a target ready when needed
  if (Doubles && typeof Doubles.init === "function") {
    try { Doubles.init(); } catch (e) { console.error("[Doubles.init] failed:", e); }
  }

  switchScreen("setup");
});

// =====================================================
// NAVIGATION
// =====================================================
function setupNavigation() {
  const navButtons = document.querySelectorAll(".top-nav button");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.screen;
      switchScreen(target);
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function switchScreen(name) {
  currentScreen = name;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add("active");

  if (name === "match")   safeRender(renderMatchScreen);
  if (name === "summary") safeRender(renderSummaryScreen);
  if (name === "doubles") {
    safeRender(bindDoublesButtons);
    safeRender(renderDoublesScreen);
  }
}

function safeRender(fn) {
  try { typeof fn === "function" && fn(); }
  catch (e) { console.error("[render] failed:", e); }
}

// =====================================================
// SETUP SCREEN (modes, players, starting score/thrower)
// =====================================================
function setupSetupScreen() {
  const modeRow    = document.getElementById("game-mode-select");
  const countRow   = document.getElementById("player-count-select");
  const scoreRow   = document.getElementById("starting-score-select");
  const nameWrap   = document.getElementById("player-name-inputs");
  const throwerWrap= document.getElementById("starting-thrower-select");
  const startBtn   = document.getElementById("start-match-btn");

  function wireSelectRow(rowEl, onChange) {
    if (!rowEl) return;
    rowEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".select-btn");
      if (!btn) return;
      [...rowEl.querySelectorAll(".select-btn")].forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (typeof onChange === "function") onChange(btn);
    });
  }

  function getSelectedPlayerCount() {
    const active = countRow?.querySelector(".select-btn.active");
    return active ? parseInt(active.dataset.count, 10) : 2;
  }

  function renderNameInputs() {
    const n = getSelectedPlayerCount();
    nameWrap.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Player ${i + 1} name`;
      input.value = `Player ${i + 1}`;
      input.dataset.index = i.toString();
      nameWrap.appendChild(input);
    }
  }

  function renderStartingThrower() {
    const n = getSelectedPlayerCount();
    throwerWrap.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const btn = document.createElement("button");
      btn.className = "select-btn" + (i === 0 ? " active" : "");
      btn.dataset.index = i.toString();
      btn.textContent = `Start: P${i + 1}`;
      btn.addEventListener("click", () => {
        [...throwerWrap.querySelectorAll(".select-btn")].forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
      throwerWrap.appendChild(btn);
    }
  }

  function getSelectedStartingScore() {
    const active = scoreRow?.querySelector(".select-btn.active");
    return active ? parseInt(active.dataset.score, 10) : 501;
  }
  function getSelectedStartPlayerIndex() {
    const active = throwerWrap?.querySelector(".select-btn.active");
    return active ? parseInt(active.dataset.index, 10) : 0;
  }

  // Wire selectors + initial render
  wireSelectRow(modeRow,  () => {}); // mode exists visually but we always start X01 from Setup
  wireSelectRow(countRow, () => { renderNameInputs(); renderStartingThrower(); });
  wireSelectRow(scoreRow, () => {});
  renderNameInputs();
  renderStartingThrower();

  // Always start an X01 match from Setup (no Doubles here)
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const startingScore = getSelectedStartingScore();
      const startPlayer   = getSelectedStartPlayerIndex();
      const nameInputs    = [...nameWrap.querySelectorAll("input")];
      const players       = nameInputs.map((inp, idx) => inp.value?.trim() || `Player ${idx + 1}`);

      try {
        Match?.initNewMatch?.({
          gameMode: (window.StateEngine?.GameModes?.X01 ?? "x01"),
          players,
          startingScore,
          startPlayer
        });
      } catch (e) {
        console.error("[Match.initNewMatch] failed:", e);
      }
      scoreBuffer = "";
      switchScreen("match");
    });
  }
}

// =====================================================
// MATCH RENDERING + KEYPAD (X01)
// =====================================================
function renderMatchScreen() {
  const board      = document.getElementById("scoreboard");
  const entryEl    = document.getElementById("entry-display");
  const checkoutEl = document.getElementById("checkout-display");
  if (!board) return;

  const players = (Match && typeof Match.getPlayers === "function") ? Match.getPlayers() : [];
  const current = (Match && typeof Match.getCurrentPlayer === "function") ? Match.getCurrentPlayer() : 0;

  // Render scoreboard (colour‑tinted cards)
  board.innerHTML = "";
  players.forEach((p, idx) => {
    const card  = document.createElement("div");
    const tint  = ` player-color-${idx % 6}`;
    card.className = "player-card" + tint + (idx === current ? " active" : "");

    const name  = document.createElement("h2");
    name.textContent = p.name ?? `Player ${idx + 1}`;

    const score = document.createElement("div");
    score.className = "player-score";
    score.textContent = p.score ?? 0;

    card.appendChild(name);
    card.appendChild(score);
    board.appendChild(card);
  });

  if (entryEl) entryEl.textContent = scoreBuffer ? `Score: ${scoreBuffer}` : "Score: —";

  if (checkoutEl && players[current]) {
    const remain = players[current].score;
    let suggestion = "—";
    try {
      suggestion = (Checkout && typeof Checkout.getSuggestion === "function")
        ? (Checkout.getSuggestion(remain) || "—")
        : "—";
    } catch {}
    checkoutEl.textContent = `Checkout: ${suggestion}`;
  }

  wireMatchKeypad();
}

function wireMatchKeypad() {
  const keys = document.querySelectorAll("#screen-match .key");
  if (!keys || keys.length === 0) return;

  // remove previous listeners by cloning
  keys.forEach(key => {
    const clone = key.cloneNode(true);
    key.parentNode.replaceChild(clone, key);
  });

  const freshKeys = document.querySelectorAll("#screen-match .key");
  freshKeys.forEach(key => {
    key.addEventListener("click", () => {
      if (key.classList.contains("key-undo"))  { undoAction(); return; }
      if (key.classList.contains("key-enter")) { submitMatchScore(); return; }
      const val = key.textContent.trim();
      handleDigit(val);
    });
  });

  if (!matchKeyListenerBound) {
    document.addEventListener("keydown", onMatchKeyDown);
    matchKeyListenerBound = true;
  }
}

function onMatchKeyDown(e) {
  if (!document.getElementById("screen-match")?.classList.contains("active")) return;
  const k = e.key;
  if (k >= "0" && k <= "9")      { handleDigit(k); }
  else if (k === "Backspace")    { undoAction();   }
  else if (k === "Enter")        { submitMatchScore(); }
}

function handleDigit(d) {
  if (scoreBuffer.length >= 3) return; // max 180
  scoreBuffer += d;
  renderMatchScreen();
}

function handleUndoDigit() {
  scoreBuffer = scoreBuffer.slice(0, -1);
  renderMatchScreen();
}

function undoAction() {
  // If we're typing, Undo deletes the last digit; otherwise full-turn undo via engine
  if (scoreBuffer && scoreBuffer.length > 0) { handleUndoDigit(); return; }
  try { Undo?.undo?.(); } catch (e) { console.error("[Undo] failed:", e); }
  renderMatchScreen();
}

function submitMatchScore() {
  if (!scoreBuffer) return;
  const score = parseInt(scoreBuffer, 10);
  if (!(score >= 0 && score <= 180)) { scoreBuffer = ""; renderMatchScreen(); return; }
  try { Match?.enterScore?.(score); } catch (e) { console.error("[Match.enterScore] failed:", e); }
  scoreBuffer = "";
  renderMatchScreen();
}

// =====================================================
// SUMMARY / AVERAGES — dynamic cards (2–6 players)
// (v1.0 fields powered by v2.0 stats)
// =====================================================
function pct(n)      { return isFinite(n) ? `${(Math.round(n * 10) / 10).toFixed(1)}%` : "0.0%"; }
function toFixed(n,d=1){ return (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "0.0"; }

function getSummaryArray() {
  const players = (Match && typeof Match.getPlayers === "function") ? Match.getPlayers() : [];
  return players.map((p) => {
    const attempts = (p.chkAttempts1D || 0) + (p.chkAttempts2D || 0) + (p.chkAttempts3D || 0);
    const success  = (p.chkSuccess1D  || 0) + (p.chkSuccess2D  || 0) + (p.chkSuccess3D  || 0);
    const matchAvg = (p.matchDarts > 0) ? (p.matchScore / p.matchDarts) * 3 : 0;
    const turnsAvg = (p.legsWonCount > 0) ? (p.totalTurnsWonLegs / p.legsWonCount) : 0;
    const catPct   = (succ, att) => (att > 0 ? (succ / att) * 100 : 0);

    return {
      name: p.name ?? "Player",
      matchAvg,
      checkout: (attempts > 0 ? (success / attempts) * 100 : 0),
      matchDarts: p.matchDarts ?? 0,
      turnsAvg,
      setsWon: p.setsWon ?? 0,
      chkAttempts1D: p.chkAttempts1D ?? 0,
      chkAttempts2D: p.chkAttempts2D ?? 0,
      chkAttempts3D: p.chkAttempts3D ?? 0,
      chkPct1D: catPct(p.chkSuccess1D || 0, p.chkAttempts1D || 0),
      chkPct2D: catPct(p.chkSuccess2D || 0, p.chkAttempts2D || 0),
      chkPct3D: catPct(p.chkSuccess3D || 0, p.chkAttempts3D || 0),
    };
  });
}

function renderSummaryScreen() {
  const avgs    = document.getElementById("summary-averages");
  const setsLegs= document.getElementById("summary-sets-legs");
  if (!avgs) return;

  const rows = getSummaryArray(); // 2–6 dynamic
  const cardsHTML = rows.map((r, idx) => `
    <article class="avg-card avg-card--c${idx % 6}">
      <h3>${r.name}</h3>
      <div class="avg-main">${toFixed(r.matchAvg, 1)}</div>
      <div class="avg-subgrid">
        <div class="avg-item"><span class="label">Checkout %</span><span class="value">${pct(r.checkout)}</span></div>
        <div class="avg-item"><span class="label">Darts thrown</span><span class="value">${r.matchDarts}</span></div>
        <div class="avg-item"><span class="label">Turns / Leg Won</span><span class="value">${toFixed(r.turnsAvg, 1)}</span></div>
        <div class="avg-item"><span class="label">Sets</span><span class="value">${r.setsWon}</span></div>
        <div class="avg-item"><span class="label">1‑D Attempts</span><span class="value">${r.chkAttempts1D}</span></div>
        <div class="avg-item"><span class="label">1‑D Success %</span><span class="value">${pct(r.chkPct1D)}</span></div>
        <div class="avg-item"><span class="label">2‑D Attempts</span><span class="value">${r.chkAttempts2D}</span></div>
        <div class="avg-item"><span class="label">2‑D Success %</span><span class="value">${pct(r.chkPct2D)}</span></div>
        <div class="avg-item"><span class="label">3‑D Attempts</span><span class="value">${r.chkAttempts3D}</span></div>
        <div class="avg-item"><span class="label">3‑D Success %</span><span class="value">${pct(r.chkPct3D)}</span></div>
      </div>
    </article>
  `).join("");

  avgs.innerHTML = `<section class="averages-grid">${cardsHTML}</section>`;

  // Optional: leg history (if provided by engine)
  if (setsLegs) {
    const hist = (Match && typeof Match.getLegHistory === "function") ? Match.getLegHistory() : [];
    setsLegs.innerHTML = "";
    if (hist && hist.length) {
      const wrap = document.createElement("div");
      wrap.className = "summary-card";
      const h = document.createElement("h3");
      h.textContent = "Leg History";
      wrap.appendChild(h);
      hist.forEach((leg, idx) => {
        const p = document.createElement("p");
        p.textContent = `Leg ${idx + 1}: Winner P${(leg.winnerIndex ?? 0) + 1}, Darts ${leg.dartsThrown}`;
        wrap.appendChild(p);
      });
      setsLegs.appendChild(wrap);
    }
  }
}

// =====================================================
// DOUBLES — v1.0 Hit/Miss UI backed by v2.0 engine
// (engine APIs used: init, getCurrentTarget, enterScore, getStats, reset) [1](https://nhs-my.sharepoint.com/personal/james_mackenzie3_nhs_net/Documents/Microsoft%20Copilot%20Chat%20Files/doubles.js)
// =====================================================
function classForPct(pct) { return (pct >= 66) ? "stat-ok" : (pct >= 33) ? "stat-warn" : "stat-bad"; }
function fmtPct(n) { return (Math.round(n * 10) / 10).toFixed(1) + "%"; }
function updatePctEl(el, pct) {
  if (!el) return;
  el.classList.remove("stat-ok","stat-warn","stat-bad");
  el.classList.add(classForPct(pct));
  el.textContent = fmtPct(pct);
}

function renderDoublesScreen() {
  // ensure a target exists
  if (typeof Doubles.getCurrentTarget === "function" && Doubles.getCurrentTarget() == null) {
    try { Doubles.init(); } catch (e) { console.error("[Doubles.init] in renderDoublesScreen failed:", e); }
  }
  const target = Doubles.getCurrentTarget();
  const suggestion = (Checkout && typeof Checkout.getSuggestion === "function" && target != null)
    ? (Checkout.getSuggestion(target) || "—") : "—";

  const tEl = document.getElementById("doubles-target");
  const sEl = document.getElementById("doubles-suggestion");
  if (tEl) tEl.textContent = (target ?? "—");
  if (sEl) sEl.textContent = suggestion;

  const st = Doubles.getStats();
  const p1 = st.attempts1D ? (st.success1D / st.attempts1D) * 100 : 0;
  const p2 = st.attempts2D ? (st.success2D / st.attempts2D) * 100 : 0;
  const p3 = st.attempts3D ? (st.success3D / st.attempts3D) * 100 : 0;
  updatePctEl(document.getElementById("doubles-pct-1d"), p1);
  updatePctEl(document.getElementById("doubles-pct-2d"), p2);
  updatePctEl(document.getElementById("doubles-pct-3d"), p3);
}

function bindDoublesButtons() {
  const hitBtn  = document.getElementById("doubles-hit-btn");
  const missBtn = document.getElementById("doubles-miss-btn");
  if (hitBtn && !hitBtn.dataset.bound) {
    hitBtn.addEventListener("click", () => {
      const target = Doubles.getCurrentTarget();
      try { Doubles.enterScore(target); } catch (e) { console.error("[Doubles.enterScore] (hit) failed:", e); }
      renderDoublesScreen();
    });
    hitBtn.dataset.bound = "1";
  }
  if (missBtn && !missBtn.dataset.bound) {
    missBtn.addEventListener("click", () => {
      try { Doubles.enterScore(-1); } catch (e) { console.error("[Doubles.enterScore] (miss) failed:", e); }
      renderDoublesScreen();
    });
    missBtn.dataset.bound = "1";
  }
}

// =====================================================
// SETTINGS
// =====================================================
document.getElementById("reset-data-btn")?.addEventListener("click", () => {
  if (confirm("Reset all match and doubles data?")) {
    try { Match?.reset?.(); } catch {}
    try { Doubles?.reset?.(); } catch {}
    renderMatchScreen();
    renderDoublesScreen();
    renderSummaryScreen();
  }
});