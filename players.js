// =====================================
// PLAYERS ENGINE
// Updated for compatibility with
// dynamic multi‑player match engine.
// =====================================
(function () {

    const State = window.StateEngine;
    const DB = State.playersDB;

    // =====================================
    // INTERNAL HELPERS
    // =====================================
    function loadPlayers() {
        return DB.load();
    }

    function savePlayers(list) {
        DB.save(list);
    }

    function generateId() {
        return Math.floor(Math.random() * 90000) + 10000; // 5‑digit ID
    }

    // =====================================
    // PUBLIC API
    // =====================================
    window.PlayersEngine = {

        // -------------------------------
        // GET ALL PLAYERS
        // -------------------------------
        getAll() {
            return loadPlayers();
        },

        // -------------------------------
        // ADD PLAYER (Career DB)
        // -------------------------------
        add(name) {
            const list = loadPlayers();

            const newPlayer = {
                id: generateId(),
                name,

                // Career stats
                careerScore: 0,
                careerDarts: 0,
                legsWon: 0,
                setsWon: 0,
                careerTurnsWonLegs: 0,
                careerLegsWonCount: 0,

                // Checkout career stats
                careerChkAttempts1D: 0,
                careerChkAttempts2D: 0,
                careerChkAttempts3D: 0,
                careerChkSuccess1D: 0,
                careerChkSuccess2D: 0,
                careerChkSuccess3D: 0
            };

            list.push(newPlayer);
            savePlayers(list);
            return newPlayer;
        },

        // -------------------------------
        // DELETE PLAYER (Career DB)
        // -------------------------------
        delete(id) {
            let list = loadPlayers();
            list = list.filter(p => p.id != id);
            savePlayers(list);
        },

        // -------------------------------
        // APPLY MATCH RESULTS
        // Updated for multi‑player support
        // -------------------------------
        applyMatchResults(matchStatsArray) {
            // matchStatsArray = [ { id, matchScore, matchDarts, legsWon, setsWon, ... }, ... ]

            const list = loadPlayers();

            matchStatsArray.forEach(stats => {
                const p = list.find(x => x.id === stats.id);
                if (!p) return;

                p.careerScore += stats.matchScore;
                p.careerDarts += stats.matchDarts;
                p.legsWon += stats.legsWon;
                p.setsWon += stats.setsWon;

                p.careerTurnsWonLegs += stats.totalTurnsWonLegs;
                p.careerLegsWonCount += stats.legsWonCount;

                p.careerChkAttempts1D += stats.chkAttempts1D;
                p.careerChkAttempts2D += stats.chkAttempts2D;
                p.careerChkAttempts3D += stats.chkAttempts3D;

                p.careerChkSuccess1D += stats.chkSuccess1D;
                p.careerChkSuccess2D += stats.chkSuccess2D;
                p.careerChkSuccess3D += stats.chkSuccess3D;
            });

            savePlayers(list);
        },

        // -------------------------------
        // RESET CAREER DATABASE
        // -------------------------------
        reset() {
            DB.reset();
        }
    };

})();