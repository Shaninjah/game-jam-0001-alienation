/* ==========================================================================
   DOM.JS
   --------------------------------------------------------------------------
   Petites fonctions utilitaires pour écrire du HTML proprement.
   Je centralise aussi les fallbacks d'image ici.
   ========================================================================== */

(function () {
  "use strict";

  window.PCT = window.PCT || {};

  PCT.app = document.getElementById("app");

  PCT.escapeHtml = function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  PCT.escapeAttribute = function escapeAttribute(value) {
    return PCT.escapeHtml(value).replaceAll("`", "&#096;");
  };

  PCT.clamp = function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  };

  PCT.renderTopActions = function renderTopActions() {
    return `
      <div class="top-actions">
        <button class="btn btn-small btn-danger" type="button" data-action="show-quit-confirm">
          ${PCT.escapeHtml(PCT.state.data.ui.common.quitButton)}
        </button>
      </div>
    `;
  };

  PCT.renderImageFrame = function renderImageFrame(options) {
    const image = options.image || "";
    const alt = options.alt || options.fallbackLabel || "";

    return `
      <div class="${PCT.escapeHtml(options.className)} media-frame">
        <img
          class="${PCT.escapeHtml(options.imageClassName)}"
          src="${PCT.escapeAttribute(image)}"
          alt="${PCT.escapeAttribute(alt)}"
          data-fallback-label="${PCT.escapeAttribute(options.fallbackLabel)}"
        >
        <div class="${PCT.escapeHtml(options.placeholderClassName)}">
          ${PCT.escapeHtml(options.fallbackLabel)}
        </div>
      </div>
    `;
  };

  PCT.bindImageFallbacks = function bindImageFallbacks() {
    const images = PCT.app.querySelectorAll("img[data-fallback-label]");

    images.forEach((image) => {
      image.addEventListener("error", () => {
        image.classList.add("is-broken");
      }, { once: true });

      // Si l'image est déjà cassée au moment où je passe ici, je force le placeholder.
      if (image.complete && image.naturalWidth === 0) {
        image.classList.add("is-broken");
      }
    });
  };

  PCT.renderQuitConfirm = function renderQuitConfirm() {
    PCT.removeModal();

    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.dataset.modal = "quit-confirm";
    modal.innerHTML = `
      <section class="modal-card panel" role="dialog" aria-modal="true" aria-labelledby="quit-title">
        <h2 id="quit-title">${PCT.escapeHtml(PCT.state.data.ui.confirmQuit.title)}</h2>
        <p>${PCT.escapeHtml(PCT.state.data.ui.confirmQuit.text)}</p>

        <div class="button-row modal-actions">
          <button class="btn" type="button" data-action="close-modal">
            ${PCT.escapeHtml(PCT.state.data.ui.confirmQuit.cancelButton)}
          </button>

          <button class="btn btn-danger" type="button" data-action="back-to-menu">
            ${PCT.escapeHtml(PCT.state.data.ui.confirmQuit.confirmButton)}
          </button>
        </div>
      </section>
    `;

    document.body.appendChild(modal);
  };

  PCT.renderStopConfirm = function renderStopConfirm() {
    PCT.removeModal();

    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.dataset.modal = "stop-confirm";
    modal.innerHTML = `
      <section class="modal-card panel" role="dialog" aria-modal="true" aria-labelledby="stop-title">
        <h2 id="stop-title">${PCT.escapeHtml(PCT.state.data.ui.confirmStop.title)}</h2>
        <p>${PCT.escapeHtml(PCT.state.data.ui.confirmStop.text)}</p>

        <div class="button-row modal-actions">
          <button class="btn" type="button" data-action="close-modal">
            ${PCT.escapeHtml(PCT.state.data.ui.confirmStop.cancelButton)}
          </button>

          <button class="btn btn-danger" type="button" data-action="back-to-menu">
            ${PCT.escapeHtml(PCT.state.data.ui.confirmStop.confirmButton)}
          </button>
        </div>
      </section>
    `;

    document.body.appendChild(modal);
  };

  PCT.removeModal = function removeModal() {
    const modal = document.querySelector("[data-modal]");

    if (modal) {
      modal.remove();
    }
  };

  PCT.renderError = function renderError(error) {
    PCT.app.innerHTML = `
      <main class="screen menu-screen">
        <section class="error-card panel">
          <p class="kicker">Erreur</p>
          <h1>Prototype Creature Test</h1>
          <p>${PCT.escapeHtml(error.message)}</p>
          <p>Vérifie que les fichiers JSON sont présents dans le dossier data et que le prototype est lancé via un serveur statique.</p>
        </section>
      </main>
    `;
  };
})();
