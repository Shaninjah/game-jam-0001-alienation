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

            ${PCT.renderImageFrame({
              className: "creature-frame",
              imageClassName: "creature-img",
              placeholderClassName: "creature-placeholder",
              image: creature.image,
              alt: creature.name,
              fallbackLabel: ui.fallbacks.creature
            })}

            <p class="creature-description">${PCT.escapeHtml(creature.description)}</p>

            <div class="button-row final-actions">
              ${stopButtonHtml}
              <button class="btn btn-primary" type="button" data-action="continue-test">
                ${PCT.escapeHtml(ui.final.nextTestButton)}
              </button>
            </div>
          </section>
        </section>
      </main>
    `;

    // Après le rendu, je branche le placeholder si l'image de créature manque.
    PCT.bindImageFallbacks();
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
})();
