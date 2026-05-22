/* ==========================================================================
   DOM.JS
   --------------------------------------------------------------------------
   Petites fonctions utilitaires pour écrire du HTML proprement.
   Je centralise aussi les fallbacks d'image ici.
   ========================================================================== */

(function () {
  "use strict";

  // Je réutilise le même espace global que les autres fichiers du prototype.
  window.PCT = window.PCT || {};

  // Point d'entrée unique où les écrans du jeu sont remplacés.
  PCT.app = document.getElementById("app");

  PCT.escapeHtml = function escapeHtml(value) {
    // Je neutralise le texte avant de l'injecter dans le HTML généré.
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  PCT.escapeAttribute = function escapeAttribute(value) {
    // Même logique pour les attributs HTML, avec le backtick en plus par sécurité.
    return PCT.escapeHtml(value).replaceAll("`", "&#096;");
  };

  PCT.clamp = function clamp(value, min, max) {
    // Je bloque une valeur dans une fourchette, surtout pour les barres de stats.
    return Math.min(Math.max(value, min), max);
  };

  PCT.renderTopActions = function renderTopActions() {
    // Avant le test 4, je ne propose pas encore de quitter le protocole.
    if (!PCT.canStopCurrentTest()) {
      return "";
    }

    // Petit bouton global pour demander à quitter le protocole.
    return `
      <div class="top-actions">
        <button class="btn btn-small btn-danger" type="button" data-action="show-quit-confirm">
          ${PCT.escapeHtml(PCT.state.data.ui.common.quitButton)}
        </button>
      </div>
    `;
  };

  PCT.renderImageFrame = function renderImageFrame(options) {
    // Je prépare l'image et son texte alternatif, avec un libellé de secours si besoin.
    const image = options.image || "";
    const alt = options.alt || options.fallbackLabel || "";

    // Toutes les images passent par ce même bloc pour garder le fallback cohérent.
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
    // Je récupère toutes les images qui ont un placeholder prévu.
    const images = PCT.app.querySelectorAll("img[data-fallback-label]");
    const optionalImages = PCT.app.querySelectorAll("img[data-optional-image]");

    images.forEach((image) => {
      // Si l'image échoue au chargement, je la masque et je laisse apparaître le placeholder.
      image.addEventListener("error", () => {
        image.classList.add("is-broken");
      }, { once: true });

      // Si l'image est déjà cassée au moment où je passe ici, je force le placeholder.
      if (image.complete && image.naturalWidth === 0) {
        image.classList.add("is-broken");
      }
    });

    optionalImages.forEach((image) => {
      // Les calques de créature sont optionnels : s'ils manquent, je les cache sans bloquer la base.
      image.addEventListener("error", () => {
        image.classList.add("is-broken");
      }, { once: true });

      if (image.complete && image.naturalWidth === 0) {
        image.classList.add("is-broken");
      }
    });
  };

  PCT.renderQuitConfirm = function renderQuitConfirm() {
    // Si on n'a pas encore atteint le test 4, l'arrêt du protocole reste verrouillé.
    if (!PCT.canStopCurrentTest()) {
      return;
    }

    // Je supprime d'abord une ancienne modale pour ne jamais en empiler plusieurs.
    PCT.removeModal();

    // Je construis la confirmation de sortie avec les textes de la langue active.
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

    // La modale est ajoutée hors de l'écran courant pour rester au-dessus de tout.
    document.body.appendChild(modal);
  };

  PCT.renderStopConfirm = function renderStopConfirm() {
    // Même règle sur l'écran créature : pas d'arrêt avant le test 4.
    if (!PCT.canStopCurrentTest()) {
      return;
    }

    // Je supprime d'abord une ancienne modale pour repartir sur une seule confirmation.
    PCT.removeModal();

    // Je construis la confirmation d'arrêt du test créature.
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

    // La modale est ajoutée hors de l'écran courant pour rester au-dessus de tout.
    document.body.appendChild(modal);
  };

  PCT.removeModal = function removeModal() {
    // Je cherche une modale ouverte, quelle que soit sa variante.
    const modal = document.querySelector("[data-modal]");

    // S'il y en a une, je la retire simplement du document.
    if (modal) {
      modal.remove();
    }
  };

  PCT.renderError = function renderError(error) {
    // Écran de secours quand le prototype ne peut pas charger ses données.
    PCT.app.innerHTML = `
      <main class="screen menu-screen">
        <section class="error-card panel">
          <p class="kicker">Erreur</p>
          <h1>Alienation</h1>
          <p>${PCT.escapeHtml(error.message)}</p>
          <p>Vérifie que les fichiers JSON sont présents dans le dossier data et que le prototype est lancé via un serveur statique.</p>
        </section>
      </main>
    `;
  };
})();
