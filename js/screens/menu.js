/* ==========================================================================
   SCREENS / MENU.JS
   --------------------------------------------------------------------------
   Rendu de l'écran menu principal.
   ========================================================================== */

(function () {
  "use strict";

  // Je réutilise le même espace global que les autres fichiers du prototype.
  window.PCT = window.PCT || {};

  PCT.renderMenu = function renderMenu() {
    // Les textes du menu viennent toujours du JSON de la langue active.
    const ui = PCT.state.data.ui;

    // Je génère un bouton par langue supportée, sans écrire les langues en dur dans le HTML.
    const languageButtons = PCT.SUPPORTED_LANGUAGES.map((language) => {
      // Je marque visuellement la langue en cours.
      const isSelected = language === PCT.state.language;

      // Le libellé vient du JSON, mais la clé vient de la langue parcourue.
      const label = language === "fr" ? ui.languages.fr : ui.languages.en;

      // Chaque bouton renvoie juste une action et une langue au routeur global.
      return `
        <button
          class="btn ${isSelected ? "btn-selected" : ""}"
          type="button"
          data-action="set-language"
          data-language="${PCT.escapeHtml(language)}"
          aria-pressed="${isSelected ? "true" : "false"}"
        >
          ${PCT.escapeHtml(label)}
        </button>
      `;
    }).join("");

    // Je remplace tout l'écran par le menu principal fixe.
    PCT.app.innerHTML = `
      <main class="screen menu-screen">
        <section class="screen-inner menu-card panel">
          <p class="kicker">${PCT.escapeHtml(ui.menu.kicker)}</p>
          <h1 class="title">${PCT.escapeHtml(PCT.state.data.meta.title)}</h1>
          <p class="subtitle">${PCT.escapeHtml(ui.menu.subtitle)}</p>

          <div class="language-panel">
            <div class="language-header">
              <h2>${PCT.escapeHtml(ui.menu.languageTitle)}</h2>
              <div class="selected-language">
                ${PCT.escapeHtml(ui.menu.selectedLanguage)}:
                <strong>${PCT.escapeHtml(PCT.state.language.toUpperCase())}</strong>
              </div>
            </div>

            <div class="button-row">
              ${languageButtons}
            </div>
          </div>

          <div class="button-row menu-actions">
            <button class="btn btn-primary" type="button" data-action="start-game">
              ${PCT.escapeHtml(ui.menu.playButton)}
            </button>
          </div>
        </section>
      </main>
    `;
  };
})();
