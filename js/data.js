/* ==========================================================================
   DATA.JS
   --------------------------------------------------------------------------
   Chargement des fichiers JSON.
   Tout le contenu narratif vient de /data/fr.json ou /data/en.json.
   ========================================================================== */

(function () {
  "use strict";

  // Je réutilise le même espace global que les autres fichiers du prototype.
  window.PCT = window.PCT || {};

  PCT.loadLanguage = async function loadLanguage(language) {
    try {
      // Je garde la langue choisie en mémoire et dans le navigateur.
      PCT.state.language = language;
      document.documentElement.lang = language;
      localStorage.setItem(PCT.STORAGE_KEY, language);

      /*
        Je mets no-store pour éviter de croire qu'une modification JSON ne marche pas
        alors que le navigateur affiche juste une ancienne version en cache.
      */
      const response = await fetch(`data/${language}.json`, { cache: "no-store" });

      // Si le fichier n'est pas trouvé, j'arrête tout de suite avec une erreur lisible.
      if (!response.ok) {
        throw new Error(`Impossible de charger data/${language}.json`);
      }

      // Une fois le JSON chargé, il devient la seule source de texte du prototype.
      PCT.state.data = await response.json();

      // Le menu est rendu seulement après avoir les textes de la langue active.
      PCT.renderMenu();
    } catch (error) {
      // En cas de problème de fichier ou de JSON, j'affiche un écran d'erreur simple.
      PCT.renderError(error);
    }
  };
})();
