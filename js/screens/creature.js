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
    const stability = PCT.getCreatureStability();
    const ending = PCT.getFinalEnding(stability);
    const hasNextTest = PCT.hasNextDialogueTest();
    const nextAction = hasNextTest ? "continue-test" : "finish-run";
    const nextButtonLabel = hasNextTest ? PCT.getContinueTestButtonLabel(stability) : ui.final.completeButton;
    const nextButtonClass = hasNextTest ? ` btn-${PCT.escapeAttribute(stability.key)}` : "";
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

            <p class="creature-description">${PCT.escapeHtml(ending.text || creature.description)}</p>
            ${PCT.renderEvolutionPanel(stability, ending)}

            <div class="button-row final-actions">
              ${stopButtonHtml}
              <button class="btn btn-primary${nextButtonClass}" type="button" data-action="${PCT.escapeAttribute(nextAction)}">
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

  PCT.renderEvolutionPanel = function renderEvolutionPanel(stability, ending) {
    // Ce panneau affiche l'état actif de la créature, pas seulement le dernier déblocage.
    const ui = PCT.state.data.ui.final;
    const activeParts = PCT.getVisibleMutationParts();
    const shouldShowEmptyMutationText = PCT.state.testIndex >= 1;
    const eventsHtml = activeParts.length
      ? activeParts.map(PCT.renderMutationPart).join("")
      : shouldShowEmptyMutationText
        ? `<p class="evolution-empty">${PCT.escapeHtml(ui.noMutationText)}</p>`
        : "";

    return `
      <aside class="evolution-panel" aria-label="${PCT.escapeAttribute(ui.mutationTitle)}">
        <h3>${PCT.escapeHtml(ui.mutationTitle)}</h3>
        ${PCT.renderStabilityStatus(stability, ending)}
        <div class="evolution-list">
          ${eventsHtml}
        </div>
      </aside>
    `;
  };

  PCT.renderStabilityStatus = function renderStabilityStatus(stability, ending) {
    const ui = PCT.state.data.ui.final;
    const statusTitle = ui.stabilityTitle || "Stability";
    const statusText = ending.text || stability.summary;

    return `
      <section class="evolution-status status-${PCT.escapeHtml(stability.key)}">
        <div class="evolution-status-header">
          <span>${PCT.escapeHtml(statusTitle)}</span>
          <strong>${PCT.escapeHtml(stability.label)}</strong>
        </div>
        <p>${PCT.escapeHtml(ending.title)}</p>
        <small>${PCT.escapeHtml(statusText)}</small>
      </section>
    `;
  };

  PCT.renderStopEnding = function renderStopEnding() {
    const finalData = PCT.state.data.final || {};
    const creatureKey = PCT.getDominantStatKey();
    const creature = finalData.creatures[creatureKey] || finalData.creatures.force || {};
    const stability = PCT.getCreatureStability();
    const stopEnding = PCT.getStopEnding(stability);

    PCT.app.innerHTML = `
      <main class="screen stop-ending-screen">
        <section class="screen-inner stop-ending-card panel status-${PCT.escapeHtml(stability.key)}">
          <p class="kicker">${PCT.escapeHtml(stopEnding.kicker || "Fin viable")}</p>
          <h1>${PCT.escapeHtml(stopEnding.title || "Tu refuses la perfection")}</h1>
          <p class="stop-ending-text">${PCT.escapeHtml(stopEnding.text || "")}</p>

          <div class="stop-ending-summary stat-${PCT.escapeHtml(creatureKey)}">
            <span>${PCT.escapeHtml(creature.name || "")}</span>
            <strong>${PCT.escapeHtml(stability.label)}</strong>
          </div>

          <button class="btn btn-primary" type="button" data-action="return-menu">
            ${PCT.escapeHtml(stopEnding.button || PCT.state.data.ui.final.menuButton)}
          </button>
        </section>
      </main>
    `;
  };

  PCT.renderProtocolEnding = function renderProtocolEnding() {
    const finalData = PCT.state.data.final || {};
    const creatureKey = PCT.getDominantStatKey();
    const creature = finalData.creatures[creatureKey] || finalData.creatures.force || {};
    const stability = PCT.getCreatureStability();
    const protocolEnding = PCT.getProtocolEnding(stability);

    PCT.app.innerHTML = `
      <main class="screen protocol-ending-screen">
        <section class="screen-inner stop-ending-card protocol-ending-card panel status-${PCT.escapeHtml(stability.key)}">
          <p class="kicker">${PCT.escapeHtml(protocolEnding.kicker || "Fin du protocole")}</p>
          <h1>${PCT.escapeHtml(protocolEnding.title || "")}</h1>
          <p class="stop-ending-text">${PCT.escapeHtml(protocolEnding.text || "")}</p>

          <div class="stop-ending-summary stat-${PCT.escapeHtml(creatureKey)}">
            <span>${PCT.escapeHtml(creature.name || "")}</span>
            <strong>${PCT.escapeHtml(stability.label)}</strong>
          </div>

          <button class="btn btn-primary" type="button" data-action="return-menu">
            ${PCT.escapeHtml(protocolEnding.button || PCT.state.data.ui.final.completeButton)}
          </button>
        </section>
      </main>
    `;
  };

  PCT.getVisibleMutationParts = function getVisibleMutationParts() {
    // Le jeu expose les parties les plus lisibles dans la fenêtre Mutations.
    const visibleSlots = ["ears", "tails", "eyes", "mouths"];

    return visibleSlots
      .map((slot) => PCT.state.unlockedParts[slot])
      .filter(Boolean);
  };

  PCT.renderMutationPart = function renderMutationPart(part) {
    // Chaque ligne correspond à la partie actuellement active sur son slot.
    const ui = PCT.state.data.ui.final;
    const slotLabel = PCT.getAppearanceSlotLabel(part.slot);
    const tierLabel = part.isAnomaly
      ? ui.anomalyTierLabel || ui.tierLabel
      : ui.tierLabel;
    const tierValue = part.isAnomaly ? part.anomalyStage : part.tier;

    return `
      <div class="evolution-item stat-${PCT.escapeHtml(part.stat)}${part.isAnomaly ? " is-anomaly" : ""}">
        <div class="evolution-item-header">
          <strong>${PCT.escapeHtml(slotLabel)}</strong>
          <span>${PCT.escapeHtml(tierLabel)} ${PCT.escapeHtml(tierValue)}</span>
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
    const tailImages = parts
      .filter((part) => PCT.getCreaturePartSlot(part) === "tails")
      .map(PCT.renderCreaturePartImage)
      .join("");
    const partImages = parts
      .filter((part) => PCT.getCreaturePartSlot(part) !== "tails")
      .map(PCT.renderCreaturePartImage)
      .join("");

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
        ${tailImages}
        ${partImages}
      </div>
    `;
  };

  PCT.renderCreaturePartImage = function renderCreaturePartImage(part) {
    const slot = PCT.getCreaturePartSlot(part);
    const asset = PCT.getCreaturePartAsset(part);

    return `
        <img
          class="creature-img creature-part-img creature-part-${PCT.escapeAttribute(slot)}"
          src="${PCT.escapeAttribute(asset)}"
          alt=""
          aria-hidden="true"
          data-optional-image="true"
        >
    `;
  };

  PCT.getCreaturePartSlot = function getCreaturePartSlot(part) {
    return part && typeof part === "object" ? part.slot || "" : "";
  };

  PCT.getCreaturePartAsset = function getCreaturePartAsset(part) {
    return part && typeof part === "object" ? part.asset || "" : part;
  };

  PCT.renderFinalStats = function renderFinalStats() {
    // La jauge suit le score le plus haut du run pour eviter une saturation trop precoce.
    const statValues = PCT.STAT_KEYS.map((key) => PCT.state.stats[key]);
    const maxStatValue = Math.max(...statValues);
    const max = Math.max(12, Math.ceil(maxStatValue / 5) * 5);

    // Chaque stat devient une ligne avec son score et sa barre colorée.
    const statLines = PCT.STAT_KEYS.map((key) => {
      const value = PCT.state.stats[key];
      const percentage = PCT.clamp((value / max) * 100, 4, 100);

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

  PCT.getCreatureStability = function getCreatureStability() {
    const ui = PCT.state.data.ui.final;
    const states = ui.stabilityStates || {};
    let key = "stable";
    let endingKey = "stable";

    if (PCT.state.anomalyStage >= 3) {
      key = "critical";
      endingKey = "degenerate";
    } else if (PCT.state.anomalyStage >= 1) {
      key = "anomaly";
      endingKey = "unstable";
    } else if (PCT.state.instability >= 2.5) {
      key = "strained";
      endingKey = "specialized";
    }

    const stateText = states[key] || {};

    return {
      key,
      endingKey,
      label: stateText.label || key,
      summary: stateText.summary || "",
      instability: PCT.state.instability,
      anomalyStage: PCT.state.anomalyStage
    };
  };

  PCT.getContinueTestButtonLabel = function getContinueTestButtonLabel(stability) {
    const buttons = PCT.state.data.ui.final.continueButtons || {};
    return buttons[stability.key] || PCT.state.data.ui.final.nextTestButton;
  };

  PCT.getFinalEnding = function getFinalEnding(stability) {
    const endings = PCT.state.data.final.endings || {};
    const ending = endings[stability.endingKey] || endings.stable || {};

    return {
      title: ending.title || "",
      text: ending.text || ""
    };
  };

  PCT.getStopEnding = function getStopEnding(stability) {
    const finalData = PCT.state.data.final || {};
    const fallback = finalData.stopEnding || {};
    const stopEndings = finalData.stopEndings || {};

    return {
      ...fallback,
      ...(stopEndings[stability.key] || {})
    };
  };

  PCT.getProtocolEnding = function getProtocolEnding(stability) {
    const finalData = PCT.state.data.final || {};
    const protocolEndings = finalData.protocolEndings || {};
    const fallback = PCT.getFinalEnding(stability);

    return {
      title: fallback.title || "",
      text: fallback.text || "",
      ...(protocolEndings[stability.key] || {})
    };
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
