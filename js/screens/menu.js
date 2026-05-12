/* ==========================================================================
   SCREENS / MENU.JS
   --------------------------------------------------------------------------
   Rendu de l'écran menu principal.
   ========================================================================== */

(function () {
  "use strict";

  window.PCT = window.PCT || {};

  PCT.renderMenu = function renderMenu() {
    const ui = PCT.state.data.ui;

    const languageButtons = PCT.SUPPORTED_LANGUAGES.map((language) => {
      const isSelected = language === PCT.state.language;
      const label = language === "fr" ? ui.languages.fr : ui.languages.en;

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
