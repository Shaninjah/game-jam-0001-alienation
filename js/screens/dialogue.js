/* ==========================================================================
   SCREENS / DIALOGUE.JS
   --------------------------------------------------------------------------
   Rendu et logique de l'interface question / réponse.
   Les noeuds, messages, émotions et choix viennent du JSON.
   ========================================================================== */

(function () {
  "use strict";

  // Je réutilise le même espace global que les autres fichiers du prototype.
  window.PCT = window.PCT || {};

  PCT.startDialogueTest = function startDialogueTest(testIndex) {
    // Je prépare une batterie de tests précise, puis je démarre son premier noeud.
    const tests = PCT.getDialogueTests();
    const nextTest = tests[testIndex];

    // Si la batterie demandée n'existe pas, j'affiche une erreur claire.
    if (!nextTest) {
      PCT.renderError(new Error(`Batterie de test introuvable : ${testIndex}`));
      return;
    }

    // Chaque nouvelle batterie repart au premier message, mais garde les stats déjà gagnées.
    PCT.state.testIndex = testIndex;
    PCT.state.currentNodeId = null;
    PCT.state.messageIndex = 0;
    PCT.state.lastEffects = [];
    PCT.state.lastMutationEvents = [];
    PCT.state.testMutationEvents = [];
    PCT.state.finalCreatureKey = null;
    PCT.renderDialogue(nextTest.startNode);
  };

  PCT.continueToNextTest = function continueToNextTest() {
    // S'il existe une batterie après celle-ci, je l'enchaîne directement.
    if (PCT.hasNextDialogueTest()) {
      PCT.startDialogueTest(PCT.state.testIndex + 1);
      return;
    }

    // Quand il n'y a plus de batterie écrite, le protocole court est terminé.
    PCT.resetRun();
    PCT.renderMenu();
  };

  PCT.renderDialogue = function renderDialogue(nodeId) {
    // Je récupère le noeud demandé dans le JSON.
    const node = PCT.getDialogueNode(nodeId);

    // Si le JSON pointe vers un noeud inexistant, j'affiche une erreur plutôt que de casser l'écran.
    if (!node) {
      PCT.renderError(new Error(`Noeud de dialogue introuvable : ${nodeId}`));
      return;
    }

    // Je mémorise où on est et je sécurise l'index du message courant.
    PCT.state.currentNodeId = nodeId;
    PCT.state.messageIndex = Math.min(PCT.state.messageIndex, node.messages.length - 1);

    // Je prépare tout ce qui dépend du message actuel avant de fabriquer le HTML.
    const currentTest = PCT.getCurrentDialogueTest() || {};
    const testLabel = PCT.getDialogueProgressLabel(currentTest);
    const message = node.messages[PCT.state.messageIndex];
    const hasMoreMessages = PCT.state.messageIndex < node.messages.length - 1;
    const shouldShowChoices = !hasMoreMessages;
    const avatarImage = PCT.getAvatarImage(message.emotion);

    // Les choix n'apparaissent qu'après le dernier message du noeud.
    const choicesHtml = shouldShowChoices ? PCT.renderChoices(node.choices || []) : "";

    // Tant qu'il reste du dialogue, je montre seulement le bouton continuer.
    const continueButtonHtml = hasMoreMessages ? `
      <div class="dialogue-continue-zone">
        <button class="btn btn-primary" type="button" data-action="continue-dialogue">
          ${PCT.escapeHtml(PCT.state.data.ui.dialogue.continueButton)}
        </button>
      </div>
    ` : "";

    // Je rends l'interface de test : avatar, bulle de dialogue, choix éventuels et stats.
    PCT.app.innerHTML = `
      <main class="screen dialogue-screen">
        <section class="screen-inner dialogue-layout">
          ${PCT.renderTopActions()}
          <div class="progress-pill">
            ${PCT.escapeHtml(testLabel)}
          </div>

          <aside class="avatar-panel panel">
            ${PCT.renderAvatarFrame(avatarImage, message.speaker)}
            <div class="avatar-meta">
              ${PCT.escapeHtml(PCT.state.data.ui.dialogue.avatarEmotion)}:
              <strong>${PCT.escapeHtml(message.emotion || "neutral")}</strong>
            </div>
          </aside>

          <section class="dialogue-panel panel">
            <div>
              <div class="dialogue-bubble">
                <p class="dialogue-speaker">${PCT.escapeHtml(message.speaker)}</p>
                <p class="dialogue-text">${PCT.escapeHtml(message.text)}</p>
                <p class="dialogue-hint">${PCT.escapeHtml(hasMoreMessages ? PCT.state.data.ui.dialogue.clickHint : PCT.state.data.ui.dialogue.choiceHint)}</p>
              </div>

              ${continueButtonHtml}
              ${choicesHtml}
            </div>

            ${PCT.renderStatsStrip()}
          </section>
        </section>
      </main>
    `;

    // Après le rendu, je branche les placeholders sur les images absentes.
    PCT.bindImageFallbacks();
  };

  PCT.continueDialogue = function continueDialogue() {
    // Je reprends le noeud courant pour avancer dans ses messages.
    const node = PCT.getDialogueNode(PCT.state.currentNodeId);

    // Si l'état courant ne correspond plus à un noeud réel, j'affiche une erreur.
    if (!node) {
      PCT.renderError(new Error(`Noeud de dialogue introuvable : ${PCT.state.currentNodeId}`));
      return;
    }

    // S'il reste un message dans ce noeud, j'avance l'index puis je rerends le même noeud.
    if (PCT.state.messageIndex < node.messages.length - 1) {
      PCT.state.messageIndex += 1;
      PCT.renderDialogue(PCT.state.currentNodeId);
    }
  };

  PCT.selectChoice = function selectChoice(choiceIndexValue) {
    // Les boutons donnent un index sous forme de texte, donc je le transforme en nombre.
    const choiceIndex = Number(choiceIndexValue);

    // Je récupère le noeud courant pour trouver la réponse choisie.
    const node = PCT.getDialogueNode(PCT.state.currentNodeId);

    // Si le choix n'existe pas, je ne fais rien : ça protège l'état du jeu.
    if (!node || !node.choices || !node.choices[choiceIndex]) {
      return;
    }

    // À partir d'ici, la réponse est valide et peut modifier la créature.
    const choice = node.choices[choiceIndex];

    // Les effets de la réponse modifient les stats autorisées.
    PCT.state.lastEffects = PCT.applyEffects(choice.effects || {});
    PCT.state.lastMutationEvents = PCT.updateCreatureAppearance();
    PCT.state.testMutationEvents.push(...PCT.state.lastMutationEvents);

    // Certains choix terminent le protocole et envoient directement à l'écran créature.
    if (choice.next === "final") {
      PCT.renderFinal();
      return;
    }

    // Sinon je repars au premier message du noeud suivant.
    PCT.state.messageIndex = 0;
    PCT.renderDialogue(choice.next);
  };

  PCT.applyEffects = function applyEffects(effects) {
    /*
      Je boucle uniquement sur les stats autorisées.
      Si le JSON contient une vieille stat supprimée, elle sera ignorée proprement.
    */
    const appliedEffects = [];

    PCT.STAT_KEYS.forEach((key) => {
      // Une stat ne change que si le choix lui donne explicitement une valeur numérique.
      if (typeof effects[key] === "number") {
        PCT.state.stats[key] += effects[key];

        if (effects[key] !== 0) {
          appliedEffects.push({
            key,
            value: effects[key],
            total: PCT.state.stats[key]
          });
        }
      }
    });

    return appliedEffects;
  };

  PCT.renderChoices = function renderChoices(choices) {
    // Si un noeud n'a pas de choix, je fournis un bouton de fin par défaut.
    if (!choices.length) {
      return `
        <div class="choice-list">
          <button class="btn btn-primary choice-btn" type="button" data-action="select-choice" data-choice-index="0">
            ${PCT.escapeHtml(PCT.state.data.ui.dialogue.defaultFinalChoice)}
          </button>
        </div>
      `;
    }

    // Chaque choix devient un bouton qui renvoie son index au routeur global.
    const choiceButtons = choices.map((choice, index) => `
      <button class="btn choice-btn" type="button" data-action="select-choice" data-choice-index="${index}">
        <span class="choice-label">${PCT.escapeHtml(choice.label)}</span>
        ${PCT.renderChoiceEffects(choice.effects || {})}
      </button>
    `).join("");

    return `
      <div class="choice-list">
        ${choiceButtons}
      </div>
    `;
  };

  PCT.renderChoiceEffects = function renderChoiceEffects(effects) {
    // Les effets visibles rendent le lien choix -> statistiques immédiatement lisible.
    const effectItems = PCT.STAT_KEYS
      .filter((key) => typeof effects[key] === "number" && effects[key] !== 0)
      .map((key) => `
        <span class="choice-effect stat-${PCT.escapeHtml(key)}">
          ${PCT.escapeHtml(PCT.formatEffectValue(effects[key]))}
          ${PCT.escapeHtml(PCT.getStatLabel(key))}
        </span>
      `)
      .join("");

    if (!effectItems) {
      return "";
    }

    return `
      <span class="choice-effects">
        ${effectItems}
      </span>
    `;
  };

  PCT.formatEffectValue = function formatEffectValue(value) {
    // Les valeurs positives gardent un signe explicite pour être lues d'un coup d'œil.
    return value > 0 ? `+${value}` : String(value);
  };

  PCT.getDialogueProgressLabel = function getDialogueProgressLabel(currentTest) {
    // Le protocole est court et borné : j'affiche donc toujours la position dans la série.
    const tests = PCT.getDialogueTests();
    const label = currentTest.label || PCT.state.data.ui.dialogue.testLabel;

    if (!tests.length) {
      return label;
    }

    return `${label} · ${PCT.state.testIndex + 1}/${tests.length}`;
  };

  PCT.renderStatsStrip = function renderStatsStrip() {
    // Je transforme les stats actuelles en petites capsules visibles pendant le test.
    const chips = PCT.STAT_KEYS.map((key) => `
      <div class="stat-chip stat-${PCT.escapeHtml(key)}">
        ${PCT.escapeHtml(PCT.getStatLabel(key))}
        <strong>${PCT.state.stats[key]}</strong>
      </div>
    `).join("");

    return `
      <div class="stats-strip" aria-label="${PCT.escapeHtml(PCT.state.data.ui.final.statsTitle)}">
        ${chips}
      </div>
    `;
  };

  PCT.getAvatarImage = function getAvatarImage(emotion) {
    // Je cherche l'avatar correspondant à l'émotion, puis je retombe sur neutral si besoin.
    const avatarMap = PCT.state.data.dialogue.avatar || {};
    return avatarMap[emotion] || avatarMap.neutral || "assets/avatar/chen_smile.png";
  };

  PCT.renderAvatarFrame = function renderAvatarFrame(image, speaker) {
    // L'avatar utilise le même principe image + placeholder que le reste du prototype.
    return `
      <div class="avatar-frame">
        <img
          class="avatar-img"
          src="${PCT.escapeAttribute(image)}"
          alt="${PCT.escapeAttribute(speaker)}"
          data-fallback-label="${PCT.escapeAttribute(PCT.state.data.ui.fallbacks.avatar)}"
        >
        <div class="avatar-placeholder">
          ${PCT.escapeHtml(PCT.state.data.ui.fallbacks.avatar)}
        </div>
      </div>
    `;
  };
})();
