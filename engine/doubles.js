// =====================================
// DOUBLES PRACTICE ENGINE (fixed counting)
// Attempts are incremented for the category JUST attempted,
// success increments on HIT, then we roll a new target.
// =====================================
(function () {
  const State = window.StateEngine;
  const S = State.doublesState;

  // ---------- Random Targets ----------
  function getRandom1DScore() {
    const idx = Math.floor(Math.random() * 21);
    return (idx === 20) ? 50 : (2 + idx * 2); // 2..40 even, or 50
  }
  function getRandom2DScore() {
    while (true) {
      const s = Math.floor(Math.random() * (100 - 41 + 1)) + 41;
      if (s !== 50 && s !== 99) return s;
    }
  }
  function getRandom3DScore() {
    while (true) {
      const s = Math.floor(Math.random() * (170 - 101 + 1)) + 101;
      if (![159, 162, 163, 166, 168, 169].includes(s)) return s;
    }
  }

  // ---------- Category helper ----------
  function getFinishCategory(score) {
    if ((score >= 2 && score <= 40 && score % 2 === 0) || score === 50) return 1; // 1D
    if (score >= 41 && score <= 100 && score !== 50 && score !== 99) return 2;     // 2D
    if (score >= 101 && score <= 170 && ![159, 162, 163, 166, 168, 169].includes(score)) return 3; // 3D
    return 0;
  }

  // ---------- Next Target (NO attempts here) ----------
  function nextTarget() {
    const cat = Math.floor(Math.random() * 3); // 0,1,2
    if (cat === 0)      { S.currentTarget = getRandom1DScore(); }
    else if (cat === 1) { S.currentTarget = getRandom2DScore(); }
    else                { S.currentTarget = getRandom3DScore(); }
  }

  // ---------- Record a visit (Hit/Miss) ----------
  function enterScore(score) {
    const target = S.currentTarget;
    if (target == null) { nextTarget(); return; }

    const cat = getFinishCategory(target);

    // 1) Count the ATTEMPT for the category JUST attempted
    if (cat === 1) S.attempts1D++;
    if (cat === 2) S.attempts2D++;
    if (cat === 3) S.attempts3D++;

    // 2) If HIT, count SUCCESS for that same category
    if (score === target) {
      if (cat === 1) S.success1D++;
      if (cat === 2) S.success2D++;
      if (cat === 3) S.success3D++;
    }

    // 3) Roll the next target
    nextTarget();
  }

  // ---------- Public API ----------
  window.DoublesEngine = {
    getCurrentTarget() { return S.currentTarget; },
    nextTarget() { nextTarget(); }, // optional manual advance
    enterScore(score) { enterScore(score); },
    getStats() {
      return {
        attempts1D: S.attempts1D, attempts2D: S.attempts2D, attempts3D: S.attempts3D,
        success1D:  S.success1D,  success2D:  S.success2D,  success3D:  S.success3D
      };
    },
    reset() { State.resetDoublesState(); nextTarget(); },
    init()  { if (S.currentTarget == null) nextTarget(); }
  };
})();
