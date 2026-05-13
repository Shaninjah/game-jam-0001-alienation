/* ==========================================================================
   DATA.JS
   --------------------------------------------------------------------------
   Chargement des fichiers JSON.
   fr.json et en.json servent de points d'entrée.
   Les conversations longues peuvent ensuite être chargées depuis des fichiers séparés.
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
      const appearanceData = await PCT.loadJsonFile("data/appearance.json", { allowComments: true });
      const languageData = await PCT.loadJsonFile(`data/${language}.json`);

      // Après le manifest de langue, je charge les conversations listées dedans.
      await PCT.loadDialogueTests(languageData);

      // L'apparence est une config commune, indépendante de la langue choisie.
      PCT.state.appearance = appearanceData;

      // Une fois tous les JSON chargés, ils deviennent la source de texte du prototype.
      PCT.state.data = languageData;

      // Le menu est rendu seulement après avoir les textes de la langue active.
      PCT.renderMenu();
    } catch (error) {
      // En cas de problème de fichier ou de JSON, j'affiche un écran d'erreur simple.
      PCT.renderError(error);
    }
  };

  PCT.loadJsonFile = async function loadJsonFile(filePath, options = {}) {
    // Tous les chargements JSON passent ici pour avoir la même erreur lisible.
    const response = await fetch(filePath, { cache: "no-store" });

    // Si le fichier n'est pas trouvé, j'arrête tout de suite avec son chemin exact.
    if (!response.ok) {
      throw new Error(`Impossible de charger ${filePath}`);
    }

    // Pour les fichiers de config humains, je peux accepter des commentaires a la main.
    if (options.allowComments) {
      const text = await response.text();
      return JSON.parse(PCT.removeJsonComments(text));
    }

    return response.json();
  };

  PCT.removeJsonComments = function removeJsonComments(text) {
    // Je retire les commentaires sans toucher aux // ou /* qui seraient dans une chaine de texte.
    let cleanedText = "";
    let inString = false;
    let escaped = false;
    let inLineComment = false;
    let inBlockComment = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      const nextCharacter = text[index + 1];

      // Quand je suis dans un commentaire //, je jette tout jusqu'au retour ligne.
      if (inLineComment) {
        if (character === "\n") {
          inLineComment = false;
          cleanedText += character;
        }

        continue;
      }

      // Quand je suis dans un commentaire /* */, je garde juste les retours ligne pour les erreurs.
      if (inBlockComment) {
        if (character === "\n") {
          cleanedText += character;
        }

        if (character === "*" && nextCharacter === "/") {
          inBlockComment = false;
          index += 1;
        }

        continue;
      }

      // Dans une chaine JSON, tout est du contenu normal, y compris les slashes.
      if (inString) {
        cleanedText += character;

        if (escaped) {
          escaped = false;
          continue;
        }

        if (character === "\\") {
          escaped = true;
          continue;
        }

        if (character === "\"") {
          inString = false;
        }

        continue;
      }

      // Hors texte, je detecte les commentaires visuels qu'on veut pouvoir ecrire dans la config.
      if (character === "/" && nextCharacter === "/") {
        inLineComment = true;
        index += 1;
        continue;
      }

      if (character === "/" && nextCharacter === "*") {
        inBlockComment = true;
        index += 1;
        continue;
      }

      if (character === "\"") {
        inString = true;
      }

      cleanedText += character;
    }

    return cleanedText;
  };

  PCT.loadDialogueTests = async function loadDialogueTests(languageData) {
    // Si le JSON garde encore l'ancien format avec nodes globaux, je ne touche à rien.
    if (!languageData.dialogue || !Array.isArray(languageData.dialogue.tests)) {
      return;
    }

    // Je remplace le manifest des tests par les fichiers de conversation vraiment chargés.
    const loadedTests = [];

    for (const testEntry of languageData.dialogue.tests) {
      const manifestData = testEntry && typeof testEntry === "object" ? testEntry : {};

      // Si un test est déjà écrit en entier dans le manifest, je le garde tel quel.
      if (manifestData.nodes) {
        loadedTests.push(testEntry);
        continue;
      }

      // Sinon je lis le fichier déclaré dans le manifest.
      const file = typeof testEntry === "string" ? testEntry : manifestData.file;

      if (!file) {
        throw new Error("Un test de dialogue n'a pas de fichier JSON associé.");
      }

      const testData = await PCT.loadJsonFile(`data/${file}`);

      // Je garde aussi l'id et le chemin du manifest pour mieux tracer d'où vient le test.
      loadedTests.push({
        ...manifestData,
        ...testData,
        file
      });
    }

    languageData.dialogue.tests = loadedTests;
  };
})();
