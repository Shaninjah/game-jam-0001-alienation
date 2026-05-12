/* ==========================================================================
   APP.JS
   --------------------------------------------------------------------------
   Point d'entrée du prototype.
   Je garde ici uniquement le routage des actions utilisateur.
   ========================================================================== */

(function () {
  "use strict";

  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("keydown", handleGlobalKeydown);

  // Chargement initial : on démarre sur la langue sauvegardée ou sur le français.
  PCT.loadLanguage(PCT.state.language);

  function handleGlobalClick(event) {
    const actionElement = event.target.closest("[data-action]");

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.action;

    if (action === "set-language") {
      const language = actionElement.dataset.language;

      if (PCT.SUPPORTED_LANGUAGES.includes(language)) {
        PCT.loadLanguage(language);
      }

      return;
    }

    if (!PCT.state.data) {
      return;
    }

    if (action === "start-game") {
      PCT.resetRun();
      PCT.renderLore();
      return;
    }

    if (action === "continue-lore") {
      PCT.continueLore();
      return;
    }

    if (action === "continue-dialogue") {
      PCT.continueDialogue();
      return;
    }

    if (action === "select-choice") {
      PCT.selectChoice(actionElement.dataset.choiceIndex);
      return;
    }

    if (action === "restart-test") {
      PCT.resetRun();
      PCT.renderDialogue(PCT.state.data.dialogue.startNode);
      return;
    }

    if (action === "back-to-menu") {
      PCT.resetRun();
      PCT.removeModal();
      PCT.renderMenu();
      return;
    }

    if (action === "show-quit-confirm") {
      PCT.renderQuitConfirm();
      return;
    }

    if (action === "show-stop-confirm") {
      PCT.renderStopConfirm();
      return;
    }

    if (action === "close-modal") {
      PCT.removeModal();
    }
  }

  function handleGlobalKeydown(event) {
    if (event.key === "Escape") {
      PCT.removeModal();
    }
  }
})();
