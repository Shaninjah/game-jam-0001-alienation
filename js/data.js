/* ==========================================================================
   DATA.JS
   --------------------------------------------------------------------------
   Chargement des fichiers JSON.
   Tout le contenu narratif vient de /data/fr.json ou /data/en.json.
   ========================================================================== */

(function () {
  "use strict";

  window.PCT = window.PCT || {};

  PCT.loadLanguage = async function loadLanguage(language) {
    try {
      PCT.state.language = language;
      document.documentElement.lang = language;
      localStorage.setItem(PCT.STORAGE_KEY, language);

      /*
        Je mets no-store pour éviter de croire qu'une modification JSON ne marche pas
        alors que le navigateur affiche juste une ancienne version en cache.
      */
      const response = await fetch(`data/${language}.json`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Impossible de charger data/${language}.json`);
      }

      PCT.state.data = await response.json();
      PCT.renderMenu();
    } catch (error) {
      PCT.renderError(error);
    }
  };
})();
