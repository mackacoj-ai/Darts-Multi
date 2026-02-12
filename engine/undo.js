// =====================================
// UNDO ENGINE (resolves MatchEngine at call time)
// =====================================
(function () {
  function undo() {
    const Match = window.MatchEngine;
    if (Match && typeof Match.undoLastTurn === "function") {
      Match.undoLastTurn(); // uses the snapshot stack in match.js
    } else {
      console.warn("[UndoEngine] MatchEngine.undoLastTurn() not available");
    }
  }
  window.UndoEngine = { undo };
})();
``
