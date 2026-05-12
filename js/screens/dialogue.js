/* ==========================================================================
   SCREENS / DIALOGUE.JS
   --------------------------------------------------------------------------
   Rendu et logique de l'interface question / réponse.
   Les noeuds, messages, émotions et choix viennent du JSON.
   ========================================================================== */

(function () {
  "use strict";

  window.PCT = window.PCT || {};

  PCT.renderDialogue = function renderDialogue(nodeId) {
    const node = PCT.state.data.dialogue.nodes[nodeId];

    if (!node) {
      PCT.renderError(new Error(`Noeud de dialogue introuvable : ${nodeId}`));
      return;
    }

    PCT.state.currentNodeId = nodeId;
    PCT.state.messageIndex = Math.min(PCT.state.messageIndex, node.messages.length - 1);

    const message = node.messages[PCT.state.messageIndex];
    const hasMoreMessages = PCT.state.messageIndex < node.messages.length - 1;
    const shouldShowChoices = !hasMoreMessages;
    const avatarImage = PCT.getAvatarImage(message.emotion);
    const choicesHtml = shouldShowChoices ? PCT.renderChoices(node.choices || []) : "";
    const continueButtonHtml = hasMoreMessages ? `
      <div class="dialogue-continue-zone">
        <button class="btn btn-primary" type="button" data-action="continue-dialogue">
          ${PCT.escapeHtml(PCT.state.data.ui.dialogue.continueButton)}
        </button>
      </div>
    ` : "";

    PCT.app.innerHTML = `
      <main class="screen dialogue-screen">
        <section class="screen-inner dialogue-layout">
          ${PCT.renderTopActions()}
          <div class="progress-pill">
            ${PCT.escapeHtml(PCT.state.data.ui.dialogue.testLabel)}
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

    PCT.bindImageFallbacks();
  };

  PCT.continueDialogue = function continueDialogue() {
    const node = PCT.state.data.dialogue.nodes[PCT.state.currentNodeId];

    if (!node) {
      PCT.renderError(new Error(`Noeud de dialogue introuvable : ${PCT.state.currentNodeId}`));
      return;
    }

    if (PCT.state.messageIndex < node.messages.length - 1) {
      PCT.state.messageIndex += 1;
      PCT.renderDialogue(PCT.state.currentNodeId);
    }
  };

  PCT.selectChoice = function selectChoice(choiceIndexValue) {
    const choiceIndex = Number(choiceIndexValue);
    const node = PCT.state.data.dialogue.nodes[PCT.state.currentNodeId];

    if (!node || !node.choices || !node.choices[choiceIndex]) {
      return;
    }

    const choice = node.choices[choiceIndex];

    PCT.applyEffects(choice.effects || {});

    if (choice.next === "final") {
      PCT.renderFinal();
      return;
    }

    PCT.state.messageIndex = 0;
    PCT.renderDialogue(choice.next);
  };

  PCT.applyEffects = function applyEffects(effects) {
    /*
      Je boucle uniquement sur les stats autorisées.
      Si le JSON contient une vieille stat supprimée, elle sera ignorée proprement.
    */
    PCT.STAT_KEYS.forEach((key) => {
      if (typeof effects[key] === "number") {
        PCT.state.stats[key] += effects[key];
      }
    });
  };

  PCT.renderChoices = function renderChoices(choices) {
    if (!choices.length) {
      return `
        <div class="choice-list">
          <button class="btn btn-primary choice-btn" type="button" data-action="select-choice" data-choice-index="0">
            ${PCT.escapeHtml(PCT.state.data.ui.dialogue.defaultFinalChoice)}
          </button>
        </div>
      `;
    }

    const choiceButtons = choices.map((choice, index) => `
      <button class="btn choice-btn" type="button" data-action="select-choice" data-choice-index="${index}">
        ${PCT.escapeHtml(choice.label)}
      </button>
    `).join("");

    return `
      <div class="choice-list">
        ${choiceButtons}
      </div>
    `;
  };

  PCT.renderStatsStrip = function renderStatsStrip() {
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
    const avatarMap = PCT.state.data.dialogue.avatar || {};
    return avatarMap[emotion] || avatarMap.neutral || "assets/avatar/scientist-neutral.png";
  };

  PCT.renderAvatarFrame = function renderAvatarFrame(image, speaker) {
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
