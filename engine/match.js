// =====================================
// MATCH ENGINE — CLEANED
// Supports 2–6 players, snapshot undo, X01 logic, leg history.
// =====================================
(function () {
  const State = window.StateEngine;
  const S = State.matchState; // shortcut to match state

  // ---------- Init New Match ----------
  function initNewMatch({ gameMode, players, startingScore, startPlayer }) {
    // Mode & start values
    S.gameMode = gameMode;
    S.startingScore = startingScore;
    S.currentPlayer = startPlayer;
    S.legStartPlayer = startPlayer;
    S.setStartPlayer = startPlayer;

    // Reset undo stack & leg history
    S.undoStack = [];
    S.legHistory = [];

    // Build dynamic player array
    S.players = players.map((name, idx) => ({
      id: idx + 1,
      name,
      score: startingScore,

      // Leg / Set stats
      legsWon: 0,
      setsWon: 0,

      // Running match stats
      matchScore: 0,
      matchDarts: 0,
      legScore: 0,
      legDarts: 0,
      turnsThisLeg: 0,
      totalTurnsWonLegs: 0,
      legsWonCount: 0,

      // Checkout tracking
      chkAttempts1D: 0,
      chkAttempts2D: 0,
      chkAttempts3D: 0,
      chkSuccess1D: 0,
      chkSuccess2D: 0,
      chkSuccess3D: 0
    }));

    S.legsCompleted = 0;
    S.scoreEntry = "";
  }

  // ---------- Snapshot / Undo ----------
  function createSnapshot(playerIndex, enteredScore) {
    return {
      playerIndex,
      enteredScore,
      players: JSON.parse(JSON.stringify(S.players)),
      currentPlayer: S.currentPlayer,
      legStartPlayer: S.legStartPlayer,
      setStartPlayer: S.setStartPlayer,
      legsCompleted: S.legsCompleted,
      legHistory: JSON.parse(JSON.stringify(S.legHistory))
    };
  }

  function undoLastTurn() {
    if (S.undoStack.length === 0) return;
    const snap = S.undoStack.pop();
    S.players = snap.players;
    S.currentPlayer = snap.currentPlayer;
    S.legStartPlayer = snap.legStartPlayer;
    S.setStartPlayer = snap.setStartPlayer;
    S.legsCompleted = snap.legsCompleted;
    S.legHistory = snap.legHistory;
  }

  // ---------- Finish Helpers ----------
  function getFinishCategory(score) {
    if ((score >= 2 && score <= 40 && score % 2 === 0) || score === 50) return 1;
    if (score >= 41 && score <= 100 && score !== 50 && score !== 99) return 2;
    if (score >= 101 && score <= 170 && ![159, 162, 163, 166, 168, 169].includes(score)) return 3;
    return 0;
  }
  function isFinishPossible(score) {
    if (score < 2 || score > 170) return false;
    return ![169, 168, 166, 165, 163, 162, 159].includes(score);
  }

  // ---------- Start New Leg / Set ----------
  function startNewLeg(isNewSet) {
    const P = S.players.length;

    // Reset per-leg stats
    S.players.forEach(p => {
      p.score = S.startingScore;
      p.legScore = 0;
      p.legDarts = 0;
      p.turnsThisLeg = 0;
    });

    if (isNewSet) {
      S.legStartPlayer = S.setStartPlayer;
    } else {
      S.legStartPlayer = (S.legStartPlayer + 1) % P;
    }
    S.currentPlayer = S.legStartPlayer;
  }

  function startNewSet() {
    const P = S.players.length;
    S.setStartPlayer = (S.setStartPlayer + 1) % P;
    startNewLeg(true);
  }

  // ---------- Score Entry (X01) ----------
  function enterScore(entered) {
    if (S.gameMode !== State.GameModes.X01) return;

    const P = S.players.length;
    const pIndex = S.currentPlayer;
    const player = S.players[pIndex];
    if (entered < 0 || entered > 180) return;

    // TAKE SNAPSHOT before mutation
    S.undoStack.push(createSnapshot(pIndex, entered));

    const before = player.score;
    const after = before - entered;

    // Track checkout attempt BEFORE applying score
    const cat = getFinishCategory(before);
    if (cat === 1) player.chkAttempts1D++;
    if (cat === 2) player.chkAttempts2D++;
    if (cat === 3) player.chkAttempts3D++;

    // Count turn
    player.turnsThisLeg++;

    // BUST LOGIC
    if (after < 0 || after === 1) {
      player.matchDarts += 3;
      player.legDarts += 3;
      S.currentPlayer = (pIndex + 1) % P;
      return;
    }

    // CHECKOUT LOGIC
    if (after === 0) {
      // If finish isn't logically possible, treat as bust
      if (!isFinishPossible(before)) {
        // restore snapshot-like next player advance to keep flow
        S.currentPlayer = (pIndex + 1) % P;
        return;
      }

      // Mark success
      const catStart = getFinishCategory(before);
      if (catStart === 1) player.chkSuccess1D++;
      if (catStart === 2) player.chkSuccess2D++;
      if (catStart === 3) player.chkSuccess3D++;

      // Apply scoring
      player.score = 0;
      player.matchScore += entered;
      player.matchDarts += 3;
      player.legScore += entered;
      player.legDarts += 3;

      // Turns-to-win tracking
      player.totalTurnsWonLegs += player.turnsThisLeg;
      player.legsWonCount++;

      // Increment global leg counter & record history
      S.legsCompleted++;
      S.legHistory.push({
        winnerIndex: pIndex,
        dartsThrown: player.legDarts,
        setNumber: player.setsWon + 1,
        legNumber: player.legsWon + 1
      });

      // Award leg
      player.legsWon++;

      // SET WIN?
      if (player.legsWon >= S.legsToWinSet) {
        player.setsWon++;
        // Reset legs for all players
        S.players.forEach(pl => pl.legsWon = 0);
        startNewSet();
      } else {
        startNewLeg(false);
      }
      return;
    }

    // NORMAL SCORE APPLY
    player.score = after;
    player.matchScore += entered;
    player.matchDarts += 3;
    player.legScore += entered;
    player.legDarts += 3;

    // Advance turn
    S.currentPlayer = (pIndex + 1) % P;
  }

  // ---------- Averages ----------
  function threeDartAvg(score, darts) {
    if (darts === 0) return 0;
    return (score / darts) * 3;
  }
  function turnsPerLegWon(p) {
    if (p.legsWonCount === 0) return 0;
    return p.totalTurnsWonLegs / p.legsWonCount;
  }
  function checkoutPercent(p) {
    const attempts = p.chkAttempts1D + p.chkAttempts2D + p.chkAttempts3D;
    const success  = p.chkSuccess1D + p.chkSuccess2D + p.chkSuccess3D;
    if (attempts === 0) return 0;
    return Math.round((success / attempts) * 100);
  }
  function getAverages() {
    return S.players.map(p => ({
      name: p.name,
      matchAvg: threeDartAvg(p.matchScore, p.matchDarts),
      turnsAvg: turnsPerLegWon(p),
      checkout: checkoutPercent(p),
      legsWon: p.legsWon,
      setsWon: p.setsWon
    }));
  }

  // ---------- Public API ----------
  window.MatchEngine = {
    initNewMatch,
    enterScore,
    undoLastTurn,
    getPlayers() { return S.players; },
    getPlayer(i) { return S.players[i]; },
    getCurrentPlayer() { return S.currentPlayer; },
    getAverages,
    getLegHistory() { return S.legHistory; },
    reset() { State.resetMatchState(); }
  };
})();
