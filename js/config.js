/* ==========================================================================
   CONFIG.JS
   --------------------------------------------------------------------------
   Je garde ici les constantes globales du prototype.
   Comme ça, si je veux changer les stats ou les langues plus tard, je commence ici.
   ========================================================================== */

(function () {
  "use strict";

  // Je range tout le prototype dans un seul objet global pour éviter d'éparpiller des variables partout.
  window.PCT = window.PCT || {};

  // Clé utilisée dans localStorage pour retenir la langue choisie.
  PCT.STORAGE_KEY = "prototypeCreatureTestLanguage";

  // Langues supportées par les fichiers JSON dans /data.
  PCT.SUPPORTED_LANGUAGES = ["fr", "en"];

  // Résolution fixe réelle du jeu.
  // Aucun scale automatique : si la fenêtre est plus petite, le contenu est simplement coupé.
  PCT.GAME_FRAME_WIDTH = 1344;
  PCT.GAME_FRAME_HEIGHT = 756;

  // Le joueur ne peut arrêter le protocole qu'à partir du test 4.
  // Comme le code compte à partir de zéro, le test 4 correspond à l'index 3.
  PCT.MIN_STOP_TEST_INDEX = 3;

  // La premiere batterie reste diagnostique : la premiere mutation visible arrive au test 2.
  PCT.FIRST_VISIBLE_MUTATION_TEST_INDEX = 1;

  // Les statistiques finales du prototype.
  // Il n'y a plus de mystère : uniquement les 4 stats demandées.
  PCT.STAT_KEYS = [
    "force",
    "exploration",
    "conciliation",
    "intelligence"
  ];
})();
