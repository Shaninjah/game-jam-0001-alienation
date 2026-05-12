/* ==========================================================================
   SCREENS / CREATURE.JS
   --------------------------------------------------------------------------
   Rendu de l'écran final avec la créature.
   La créature affichée dépend de la stat dominante.
   ========================================================================== */

(function () {
  "use strict";

  window.PCT = window.PCT || {};

  PCT.renderFinal = function renderFinal() {
    const ui = PCT.state.data.ui;
    const creatureKey = PCT.getDominantStatKey();
    const creature = PCT.state.data.final.creatures[creatureKey] || PCT.state.data.final.creatures.force;

    PCT.state.finalCreatureKey = creatureKey;

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
            <p class="kicker">${PCT.escapeHtml(ui.final.creatureLabel)}</p>
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
              <button class="btn btn-danger" type="button" data-action="show-stop-confirm">
                ${PCT.escapeHtml(ui.final.menuButton)}
              </button>

              <button class="btn btn-primary" type="button" data-action="restart-test">
                ${PCT.escapeHtml(ui.final.nextTestButton)}
              </button>
            </div>
          </section>
        </section>
      </main>
    `;

    PCT.bindImageFallbacks();
  };

  PCT.renderFinalStats = function renderFinalStats() {
    const min = -3;
    const max = 6;

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

    return `
      <div class="stat-list">
        ${statLines}
      </div>
    `;
  };

  PCT.getDominantStatKey = function getDominantStatKey() {
    return PCT.STAT_KEYS.reduce((dominantKey, key) => {
      if (PCT.state.stats[key] > PCT.state.stats[dominantKey]) {
        return key;
      }

      return dominantKey;
    }, PCT.STAT_KEYS[0]);
  };

  PCT.getStatLabel = function getStatLabel(key) {
    return PCT.state.data.ui.stats[key] || key;
  };
})();
