// =====================================
// STATE ENGINE (UPDATED FOR DYNAMIC PLAYERS)
// =====================================
(function () {

    // -------------------------------
    // GAME MODES
    // -------------------------------
    const GameModes = {
        X01: "x01",
        DOUBLES: "doubles"
    };

    // -------------------------------
    // MATCH STATE (DYNAMIC)
// This is EMPTY on startup and is filled when the Setup Screen starts a match.
    // -------------------------------
    const matchState = {

        gameMode: GameModes.X01,      // "x01" or "doubles"

        startingScore: 501,           // 501 / 301 / 101
        players: [],                  // Dynamically created at match init

        currentPlayer: 0,             // Index of active player
        legStartPlayer: 0,            // Who starts each leg
        setStartPlayer: 0,            // Who starts each set

        legsToWinSet: 3,              // You can expose this later if you want
        legsCompleted: 0,             // Tracks history

        // Undo system storage (populated from MatchEngine)
        undoStack: [],

        // UI convenience
        scoreEntry: "",
        currentScreen: "setup"
    };


    // -------------------------------
    // DOUBLES PRACTICE STATE (unchanged)
    // -------------------------------
    const doublesState = {
        currentTarget: null,
        attempts1D: 0,
        attempts2D: 0,
        attempts3D: 0,
        success1D: 0,
        success2D: 0,
        success3D: 0
    };


    // -------------------------------
    // PLAYER DATABASE (LocalStorage)
    // -------------------------------
    const playersDB = {
        key: "dart_scorer_players",

        load() {
            const raw = localStorage.getItem(this.key);
            return raw ? JSON.parse(raw) : [];
        },

        save(list) {
            localStorage.setItem(this.key, JSON.stringify(list));
        },

        reset() {
            localStorage.removeItem(this.key);
        }
    };


    // -------------------------------
    // RESET MATCH STATE
    // (Resets a running match, not the initial template)
    // -------------------------------
    function resetMatchState() {

        // For an active match, rebuild all player round stats but keep names.
        matchState.players = matchState.players.map(p => {
            return {
                ...p,
                score: matchState.startingScore,
                legsWon: 0,
                setsWon: 0,
                matchScore: 0,
                matchDarts: 0,
                legScore: 0,
                legDarts: 0,
                turnsThisLeg: 0,
                totalTurnsWonLegs: 0,
                legsWonCount: 0,
                chkAttempts1D: 0,
                chkAttempts2D: 0,
                chkAttempts3D: 0,
                chkSuccess1D: 0,
                chkSuccess2D: 0,
                chkSuccess3D: 0
            };
        });

        matchState.currentPlayer = 0;
        matchState.legStartPlayer = 0;
        matchState.setStartPlayer = 0;
        matchState.legsCompleted = 0;

        matchState.scoreEntry = "";
        matchState.undoStack = [];
    }


    // -------------------------------
    // RESET DOUBLES STATE
    // -------------------------------
    function resetDoublesState() {
        doublesState.currentTarget = null;
        doublesState.attempts1D =
            doublesState.attempts2D =
            doublesState.attempts3D = 0;
        doublesState.success1D =
            doublesState.success2D =
            doublesState.success3D = 0;
    }


    // -------------------------------
    // EXPORT
    // -------------------------------
    window.StateEngine = {

        GameModes,

        matchState,
        doublesState,

        playersDB,

        resetMatchState,
        resetDoublesState
    };

})();
``
