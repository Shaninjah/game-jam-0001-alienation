/* ==========================================================================
   SCREENS / CREATURE.JS
   --------------------------------------------------------------------------
   Rendu de l'écran final avec la créature.
   La créature affichée dépend de la stat dominante.
   ========================================================================== */

(function () {
  "use strict";

  // Je réutilise le même espace global que les autres fichiers du prototype.
  window.PCT = window.PCT || {};

  PCT.renderFinal = function renderFinal() {
    // Je récupère les textes d'interface et la créature liée à la stat dominante.
    const ui = PCT.state.data.ui;
    const currentTest = PCT.getCurrentDialogueTest() || {};
    const creatureLabel = currentTest.creatureLabel || ui.final.creatureLabel;
    const creatureKey = PCT.getDominantStatKey();
    const creature = PCT.state.data.final.creatures[creatureKey] || PCT.state.data.final.creatures.force;
    const appearance = PCT.getCreatureAppearance();
    const hasNextTest = PCT.hasNextDialogueTest();
    const nextAction = hasNextTest ? "continue-test" : "finish-run";
    const nextButtonLabel = hasNextTest ? ui.final.nextTestButton : ui.final.completeButton;
    const stopButtonHtml = PCT.canStopCurrentTest() ? `
              <button class="btn btn-danger" type="button" data-action="show-stop-confirm">
                ${PCT.escapeHtml(ui.final.menuButton)}
              </button>
    ` : "";

    // Je garde la clé du résultat, utile si on veut enchaîner plusieurs niveaux plus tard.
    PCT.state.finalCreatureKey = creatureKey;

    // Je rends la scène finale fixe : décor CSS, stats à gauche, créature au centre, boutons en bas.
    PCT.app.innerHTML = `
      <main class="screen final-screen">
        <section class="screen-inner final-layout">
          ${PCT.renderTopActions()}

          <aside class="final-stats panel">
            <p class="kicker">${PCT.escapeHtml(ui.final.kicker)}</p>
            <h2>${PCT.escapeHtml(ui.final.statsTitle)}</h2>
            ${PCT.renderFinalStats()}
          </aside>

          <section class="final-creature panel">
            <p class="kicker">${PCT.escapeHtml(creatureLabel)}</p>
            <h2>${PCT.escapeHtml(creature.name)}</h2>

            ${PCT.renderCreatureFrame(creature, appearance, ui.fallbacks.creature)}

            <p class="creature-description">${PCT.escapeHtml(creature.description)}</p>
            ${PCT.renderEvolutionPanel()}

            <div class="button-row final-actions">
              ${stopButtonHtml}
              <button class="btn btn-primary" type="button" data-action="${PCT.escapeAttribute(nextAction)}">
                ${PCT.escapeHtml(nextButtonLabel)}
              </button>
            </div>
          </section>
        </section>
      </main>
    `;

    // Après le rendu, je branche le placeholder si l'image de créature manque.
    PCT.bindImageFallbacks();
  };

  PCT.renderEvolutionPanel = function renderEvolutionPanel() {
    // Ce panneau affiche l'état actif de la créature, pas l'historique des paliers remplacés.
    const ui = PCT.state.data.ui.final;
    const activeParts = PCT.getVisibleMutationParts();
    const eventsHtml = activeParts.length
      ? activeParts.map(PCT.renderMutationPart).join("")
      : `<p class="evolution-empty">${PCT.escapeHtml(ui.noMutationText)}</p>`;

    return `
      <aside class="evolution-panel" aria-label="${PCT.escapeAttribute(ui.mutationTitle)}">
        <h3>${PCT.escapeHtml(ui.mutationTitle)}</h3>
        <div class="evolution-list">
          ${eventsHtml}
        </div>
      </aside>
    `;
  };

  PCT.getVisibleMutationParts = function getVisibleMutationParts() {
    // Le jeu expose seulement ces trois éléments dans la fenêtre Mutations.
    const visibleSlots = ["ears", "tails", "eyes"];

    return visibleSlots
      .map((slot) => PCT.state.unlockedParts[slot])
      .filter(Boolean);
  };

  PCT.renderMutationPart = function renderMutationPart(part) {
    // Chaque ligne correspond à la partie actuellement active sur son slot.
    const ui = PCT.state.data.ui.final;
    const slotLabel = PCT.getAppearanceSlotLabel(part.slot);

    return `
      <div class="evolution-item stat-${PCT.escapeHtml(part.stat)}">
        <div class="evolution-item-header">
          <strong>${PCT.escapeHtml(slotLabel)}</strong>
          <span>${PCT.escapeHtml(ui.tierLabel)} ${PCT.escapeHtml(part.tier)}</span>
        </div>
        <p>${PCT.escapeHtml(part.label)}</p>
        <small>
          ${PCT.escapeHtml(PCT.getStatLabel(part.stat))}
        </small>
      </div>
    `;
  };

  PCT.renderCreatureFrame = function renderCreatureFrame(creature, appearance, fallbackLabel) {
    // Je superpose la base de la créature et ses parties, qui ont toutes le même canvas.
    const parts = Array.isArray(appearance.parts) ? appearance.parts : [];
    const partImages = parts.map((part) => `
        <img
          class="creature-img creature-part-img"
          src="${PCT.escapeAttribute(part)}"
          alt=""
          aria-hidden="true"
          data-optional-image="true"
        >
    `).join("");

    return `
      <div class="creature-frame">
        <img
          class="creature-img creature-base-img"
          src="${PCT.escapeAttribute(appearance.base || "")}"
          alt="${PCT.escapeAttribute(creature.name)}"
          data-fallback-label="${PCT.escapeAttribute(fallbackLabel)}"
        >
        <div class="creature-placeholder">
          ${PCT.escapeHtml(fallbackLabel)}
        </div>
        ${partImages}
      </div>
    `;
  };

  PCT.renderFinalStats = function renderFinalStats() {
    // Fourchette temporaire utilisée pour transformer les scores en largeur de barre.
    const min = -3;
    const max = 6;

    // Chaque stat devient une ligne avec son score et sa barre colorée.
    const statLines = PCT.STAT_KEYS.map((key) => {
      const value = PCT.state.stats[key];
      const percentage = PCT.clamp(((value - min) / (max - min)) * 100, 4, 100);

      return `
        <div class="stat-line stat-${PCT.escapeHtml(key)}">
          <div class="stat-line-header">
            <span>${PCT.escapeHtml(PCT.getStatLabel(key))}</span>
            <strong>${value}</strong>
          </div>
          <div class="stat-bar" aria-hidden="true">
            <div class="stat-bar-fill" style="--value: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join("");

    // Le bloc de stats est renvoyé complet pour être posé dans le décor final.
    return `
      <div class="stat-list">
        ${statLines}
      </div>
    `;
  };

  PCT.getDominantStatKey = function getDominantStatKey() {
    // Je parcours les stats et je garde celle qui a le score le plus haut.
    return PCT.STAT_KEYS.reduce((dominantKey, key) => {
      // En cas d'égalité, je garde la première stat déjà dominante pour rester prévisible.
      if (PCT.state.stats[key] > PCT.state.stats[dominantKey]) {
        return key;
      }

      return dominantKey;
    }, PCT.STAT_KEYS[0]);
  };

  PCT.getStatLabel = function getStatLabel(key) {
    // Les noms affichés des stats viennent du JSON, avec la clé brute en secours.
    return PCT.state.data.ui.stats[key] || key;
  };

  PCT.getAppearanceSlotLabel = function getAppearanceSlotLabel(slot) {
    // Les noms de slots restent traduisibles dans les fichiers de langue.
    const labels = PCT.state.data.ui.appearanceSlots || {};
    return labels[slot] || slot;
  };
})();
