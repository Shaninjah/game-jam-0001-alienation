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
    testIndex: 0,
    currentNodeId: null,
    messageIndex: 0,
    stats: PCT.createEmptyStats(),
    finalCreatureKey: null
  };

  PCT.getDialogueTests = function getDialogueTests() {
    // Je lis la liste des batteries de tests depuis le JSON si elle existe.
    const dialogue = PCT.state.data && PCT.state.data.dialogue;

    // Tant que les données ne sont pas chargées, il n'y a pas encore de test disponible.
    if (!dialogue) {
      return [];
    }

    // Nouvelle structure : plusieurs batteries peuvent s'enchaîner dans le prototype.
    if (Array.isArray(dialogue.tests) && dialogue.tests.length) {
      return dialogue.tests;
    }

    // Ancienne structure de secours : un seul startNode, pour ne pas casser le prototype.
    return [
      {
        startNode: dialogue.startNode
      }
    ];
  };

  PCT.getCurrentDialogueTest = function getCurrentDialogueTest() {
    // Je récupère la batterie courante, ou la première si l'index sort de la liste.
    const tests = PCT.getDialogueTests();
    return tests[PCT.state.testIndex] || tests[0] || null;
  };

  PCT.getCurrentDialogueNodes = function getCurrentDialogueNodes() {
    // Nouveau format : chaque batterie de test contient ses propres noeuds.
    const currentTest = PCT.getCurrentDialogueTest();

    if (currentTest && currentTest.nodes) {
      return currentTest.nodes;
    }

    // Ancien format de secours : tous les noeuds étaient rangés dans dialogue.nodes.
    const dialogue = PCT.state.data && PCT.state.data.dialogue;
    return dialogue && dialogue.nodes ? dialogue.nodes : {};
  };

  PCT.getDialogueNode = function getDialogueNode(nodeId) {
    // Je passe par cette fonction pour ne pas dépendre de l'emplacement physique des noeuds.
    return PCT.getCurrentDialogueNodes()[nodeId];
  };

  PCT.hasNextDialogueTest = function hasNextDialogueTest() {
    // Le bouton Continuer le test utilise ça pour savoir s'il doit avancer ou boucler.
    return PCT.state.testIndex < PCT.getDialogueTests().length - 1;
  };

  PCT.canStopCurrentTest = function canStopCurrentTest() {
    // Je n'autorise l'arrêt du protocole qu'à partir de la quatrième batterie de tests.
    return PCT.state.testIndex >= PCT.MIN_STOP_TEST_INDEX;
  };

  PCT.resetRun = function resetRun() {
    // Je remets seulement la partie "run" à zéro, sans effacer la langue choisie.
    PCT.state.loreIndex = 0;
    PCT.state.testIndex = 0;
    PCT.state.currentNodeId = null;
    PCT.state.messageIndex = 0;
    PCT.state.stats = PCT.createEmptyStats();
    PCT.state.finalCreatureKey = null;
  };
})();
