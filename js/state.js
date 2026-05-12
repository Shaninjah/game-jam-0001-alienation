/* ==========================================================================
   STATE.JS
   --------------------------------------------------------------------------
   Tout l'état temporaire du jeu est ici.
   Je garde ça séparé pour éviter d'avoir des variables cachées partout.
   ========================================================================== */

(function () {
  "use strict";

  // Je réutilise le même espace global que les autres fichiers du prototype.
  window.PCT = window.PCT || {};

  PCT.getInitialLanguage = function getInitialLanguage() {
    // Je regarde d'abord si le joueur avait déjà choisi une langue dans ce navigateur.
    const savedLanguage = localStorage.getItem(PCT.STORAGE_KEY);

    // Si la langue sauvegardée existe encore dans le prototype, je la reprends.
    if (PCT.SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      return savedLanguage;
    }

    // Sinon je repars sur le français, qui reste la langue par défaut.
    return "fr";
  };

  PCT.createEmptyStats = function createEmptyStats() {
    // Je crée toutes les stats autorisées à zéro pour commencer un test proprement.
    return PCT.STAT_KEYS.reduce((stats, key) => {
      stats[key] = 0;
      return stats;
    }, {});
  };

  // État courant du jeu : langue, données chargées, progression, stats et résultat final.
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
    // Je remets seulement la partie "run" à zéro, sans effacer la langue choisie.
    PCT.state.loreIndex = 0;
    PCT.state.currentNodeId = null;
    PCT.state.messageIndex = 0;
    PCT.state.stats = PCT.createEmptyStats();
    PCT.state.finalCreatureKey = null;
  };
})();
