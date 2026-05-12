/* ==========================================================================
   SCREENS / LORE.JS
   --------------------------------------------------------------------------
   Rendu des écrans de lore.
   Le nombre d'écrans dépend directement du tableau lore dans le JSON.
   ========================================================================== */

(function () {
  "use strict";

  window.PCT = window.PCT || {};

  PCT.renderLore = function renderLore() {
    const ui = PCT.state.data.ui;
    const loreScreen = PCT.state.data.lore[PCT.state.loreIndex];

    PCT.app.innerHTML = `
      <main class="screen lore-screen">
        <section class="screen-inner lore-card panel">
          ${PCT.renderTopActions()}
          <div class="progress-pill">
            ${PCT.escapeHtml(ui.lore.progressLabel)}
            ${PCT.state.loreIndex + 1}/${PCT.state.data.lore.length}
          </div>

          ${PCT.renderImageFrame({
            className: "lore-illustration",
            imageClassName: "media-img",
            placeholderClassName: "media-placeholder",
            image: loreScreen.image,
            alt: loreScreen.title,
            fallbackLabel: ui.fallbacks.illustration
          })}

          <div class="lore-text-panel">
            <h2>${PCT.escapeHtml(loreScreen.title)}</h2>
            <p>${PCT.escapeHtml(loreScreen.text)}</p>

            <div class="button-row lore-actions">
              <button class="btn btn-primary" type="button" data-action="continue-lore">
                ${PCT.escapeHtml(ui.lore.continueButton)}
              </button>
            </div>
          </div>
        </section>
      </main>
    `;

    PCT.bindImageFallbacks();
  };

  PCT.continueLore = function continueLore() {
    const nextIndex = PCT.state.loreIndex + 1;

    if (nextIndex >= PCT.state.data.lore.length) {
      PCT.renderDialogue(PCT.state.data.dialogue.startNode);
      return;
    }

    PCT.state.loreIndex = nextIndex;
    PCT.renderLore();
  };
})();
