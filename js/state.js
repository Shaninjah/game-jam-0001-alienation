/* ==========================================================================
   STATE.JS
   --------------------------------------------------------------------------
   Tout l'état temporaire du jeu est ici.
   Je garde ça séparé pour éviter d'avoir des variables cachées partout.
   ========================================================================== */

(function () {
  "use strict";

  window.PCT = window.PCT || {};

  PCT.getInitialLanguage = function getInitialLanguage() {
    const savedLanguage = localStorage.getItem(PCT.STORAGE_KEY);

    if (PCT.SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      return savedLanguage;
    }

    return "fr";
  };

  PCT.createEmptyStats = function createEmptyStats() {
    return PCT.STAT_KEYS.reduce((stats, key) => {
      stats[key] = 0;
      return stats;
    }, {});
  };

  PCT.state = {
    language: PCT.getInitialLanguage(),
    data: null,
    loreIndex: 0,
    currentNodeId: null,
    messageIndex: 0,
    stats: PCT.createEmptyStats(),
    finalCreatureKey: null
  };

  PCT.resetRun = function resetRun() {
    PCT.state.loreIndex = 0;
    PCT.state.currentNodeId = null;
    PCT.state.messageIndex = 0;
    PCT.state.stats = PCT.createEmptyStats();
    PCT.state.finalCreatureKey = null;
  };
})();
