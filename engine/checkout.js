// =====================================
// CHECKOUT ENGINE
// Provides checkout suggestions
// =====================================

(function () {

    const table = window.CheckoutTable; // loaded from checkout_table.js




    // =====================================
    // FINISH POSSIBLE?
    // Mirrors Arduino isFinishPossible()
    // =====================================

    function isFinishPossible(score) {
        if (score < 2 || score > 170) return false;
        return ![169, 168, 166, 165, 163, 162, 159].includes(score);
    }


    // =====================================
    // GET CHECKOUT SUGGESTION
    // Mirrors Arduino getCheckout()
    // =====================================

    function getSuggestion(score) {
        if (score < 2 || score > 170) return "";
        if (!table[score]) return "";
        return table[score];
    }


    // =====================================
    // PUBLIC API
    // =====================================

    window.CheckoutEngine = {
        getSuggestion,
        isFinishPossible
    };

})();
