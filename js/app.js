/* ==========================================================================
   APP.JS
   --------------------------------------------------------------------------
   Point d'entrée du prototype.
   Je garde ici uniquement le routage des actions utilisateur.
   ========================================================================== */

(function () {
  "use strict";

  // Je centralise les clics : chaque bouton annonce son action avec data-action.
  document.addEventListener("click", handleGlobalClick);

  // Je garde aussi quelques raccourcis globaux, comme Escape pour fermer une fenêtre.
  document.addEventListener("keydown", handleGlobalKeydown);

  // Chargement initial : on démarre sur la langue sauvegardée ou sur le français.
  PCT.loadLanguage(PCT.state.language);

  function handleGlobalClick(event) {
    // Je cherche le bouton ou l'élément cliquable qui porte une action de jeu.
    const actionElement = event.target.closest("[data-action]");

    // Si le clic ne concerne pas le jeu, je l'ignore.
    if (!actionElement) {
      return;
    }

    // À partir d'ici, l'action devient une petite route interne du prototype.
    const action = actionElement.dataset.action;

    // Changement de langue : je recharge le JSON correspondant et je reviens au menu.
    if (action === "set-language") {
      const language = actionElement.dataset.language;

      // Je vérifie la langue pour éviter de charger un fichier JSON inattendu.
      if (PCT.SUPPORTED_LANGUAGES.includes(language)) {
        PCT.loadLanguage(language);
      }

      return;
    }

    // Tant que les données JSON ne sont pas chargées, les autres actions ne peuvent rien faire.
    if (!PCT.state.data) {
      return;
    }

    // Démarrage d'une partie : je remets les compteurs à zéro puis j'affiche le lore.
    if (action === "start-game") {
      PCT.resetRun();
      PCT.renderLore();
      return;
    }

    // Écran de lore suivant, ou passage au dialogue si on a fini le lore.
    if (action === "continue-lore") {
      PCT.continueLore();
      return;
    }

    // Message suivant dans le dialogue du Professeur Chen.
    if (action === "continue-dialogue") {
      PCT.continueDialogue();
      return;
    }

    // Choix du joueur : le bouton donne l'index de la réponse à appliquer.
    if (action === "select-choice") {
      PCT.selectChoice(actionElement.dataset.choiceIndex);
      return;
    }

    // Continuer le test lance la batterie suivante pour montrer la boucle de gameplay.
    if (action === "continue-test") {
      PCT.continueToNextTest();
      return;
    }

    // Fin naturelle du protocole court : on affiche une vraie conclusion avant le retour menu.
    if (action === "finish-run") {
      PCT.renderProtocolEnding();
      return;
    }

    // Le vrai arrêt du protocole devient une fin : le joueur accepte la créature imparfaite.
    if (action === "accept-creature") {
      PCT.removeModal();
      PCT.renderStopEnding();
      return;
    }

    // Après une fin, le bouton Suite affiche les crédits avant le retour menu.
    if (action === "show-credits") {
      PCT.renderCredits();
      return;
    }

    // Sur les credits, le joueur peut garder une image de sa creature avant le reset.
    if (action === "download-creature") {
      PCT.downloadCreatureShareImage(actionElement);
      return;
    }

    // Retour au menu depuis une fin.
    if (action === "return-menu") {
      PCT.resetRun();
      PCT.renderMenu();
      return;
    }

    // Retour menu : je nettoie la partie en cours et je ferme une éventuelle confirmation.
    if (action === "back-to-menu") {
      if (!PCT.canStopCurrentTest()) {
        PCT.removeModal();
        return;
      }

      PCT.resetRun();
      PCT.removeModal();
      PCT.renderMenu();
      return;
    }

    // Confirmation utilisée quand le joueur veut quitter pendant le protocole.
    if (action === "show-quit-confirm") {
      PCT.renderQuitConfirm();
      return;
    }

    // Confirmation utilisée sur l'écran créature quand le joueur veut arrêter les tests.
    if (action === "show-stop-confirm") {
      PCT.renderStopConfirm();
      return;
    }

    // Les fenêtres de confirmation se ferment sans changer la progression.
    if (action === "close-modal") {
      PCT.removeModal();
    }
  }

  function handleGlobalKeydown(event) {
    // Escape sert de geste simple pour annuler une confirmation ouverte.
    if (event.key === "Escape") {
      PCT.removeModal();
    }
  }
})();
