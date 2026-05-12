/* ==========================================================================
   SCREENS / LORE.JS
   --------------------------------------------------------------------------
   Rendu des écrans de lore.
   Le nombre d'écrans dépend directement du tableau lore dans le JSON.
   ========================================================================== */

(function () {
  "use strict";

  // Je réutilise le même espace global que les autres fichiers du prototype.
  window.PCT = window.PCT || {};

  PCT.renderLore = function renderLore() {
    // Je prends les textes d'interface et l'écran de lore correspondant à l'index actuel.
    const ui = PCT.state.data.ui;
    const loreScreen = PCT.state.data.lore[PCT.state.loreIndex];

    // Je rends une page de lore fixe : progression, image, texte et bouton continuer.
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

    // Après le rendu, je branche les placeholders sur les images absentes.
    PCT.bindImageFallbacks();
  };

  PCT.continueLore = function continueLore() {
    // Je prépare l'index suivant sans l'appliquer tout de suite.
    const nextIndex = PCT.state.loreIndex + 1;

    // Si le lore est terminé, je passe au premier noeud de dialogue du JSON.
    if (nextIndex >= PCT.state.data.lore.length) {
      PCT.startDialogueTest(0);
      return;
    }

    // Sinon j'avance d'un écran de lore et je le rends.
    PCT.state.loreIndex = nextIndex;
    PCT.renderLore();
  };
})();
