/* ==========================================================================
   STATE.JS
   --------------------------------------------------------------------------
   Tout l'état temporaire du jeu est ici.
   Je garde ça séparé pour éviter d'avoir des variables cachées partout.
   ========================================================================== */

(function () {
  "use strict";

  // Je réutilise le même espace global que les autres fichiers du prototype.
  window.PCT = window.PCT || {};

  PCT.getInitialLanguage = function getInitialLanguage() {
    // Je regarde d'abord si le joueur avait déjà choisi une langue dans ce navigateur.
    const savedLanguage = localStorage.getItem(PCT.STORAGE_KEY);

    // Si la langue sauvegardée existe encore dans le prototype, je la reprends.
    if (PCT.SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      return savedLanguage;
    }

    // Sinon je repars sur le français, qui reste la langue par défaut.
    return "fr";
  };

  PCT.createEmptyStats = function createEmptyStats() {
    // Je crée toutes les stats autorisées à zéro pour commencer un test proprement.
    return PCT.STAT_KEYS.reduce((stats, key) => {
      stats[key] = 0;
      return stats;
    }, {});
  };

  // État courant du jeu : langue, données chargées, progression, stats et résultat final.
  PCT.state = {
    language: PCT.getInitialLanguage(),
    data: null,
    appearance: null,
    loreIndex: 0,
    testIndex: 0,
    currentNodeId: null,
    messageIndex: 0,
    stats: PCT.createEmptyStats(),
    unlockedParts: {},
    lastEffects: [],
    lastMutationEvents: [],
    testMutationEvents: [],
    finalCreatureKey: null
  };

  PCT.getDialogueTests = function getDialogueTests() {
    // Je lis la liste des batteries de tests depuis le JSON si elle existe.
    const dialogue = PCT.state.data && PCT.state.data.dialogue;

    // Tant que les données ne sont pas chargées, il n'y a pas encore de test disponible.
    if (!dialogue) {
      return [];
    }

    // Nouvelle structure : plusieurs batteries peuvent s'enchaîner dans le prototype.
    if (Array.isArray(dialogue.tests) && dialogue.tests.length) {
      return dialogue.tests;
    }

    // Ancienne structure de secours : un seul startNode, pour ne pas casser le prototype.
    return [
      {
        startNode: dialogue.startNode
      }
    ];
  };

  PCT.getCurrentDialogueTest = function getCurrentDialogueTest() {
    // Je récupère la batterie courante, ou la première si l'index sort de la liste.
    const tests = PCT.getDialogueTests();
    return tests[PCT.state.testIndex] || tests[0] || null;
  };

  PCT.getCurrentDialogueNodes = function getCurrentDialogueNodes() {
    // Nouveau format : chaque batterie de test contient ses propres noeuds.
    const currentTest = PCT.getCurrentDialogueTest();

    if (currentTest && currentTest.nodes) {
      return currentTest.nodes;
    }

    // Ancien format de secours : tous les noeuds étaient rangés dans dialogue.nodes.
    const dialogue = PCT.state.data && PCT.state.data.dialogue;
    return dialogue && dialogue.nodes ? dialogue.nodes : {};
  };

  PCT.getDialogueNode = function getDialogueNode(nodeId) {
    // Je passe par cette fonction pour ne pas dépendre de l'emplacement physique des noeuds.
    return PCT.getCurrentDialogueNodes()[nodeId];
  };

  PCT.hasNextDialogueTest = function hasNextDialogueTest() {
    // Le bouton Continuer le test utilise ça pour savoir s'il doit avancer ou boucler.
    return PCT.state.testIndex < PCT.getDialogueTests().length - 1;
  };

  PCT.canStopCurrentTest = function canStopCurrentTest() {
    // Je n'autorise l'arrêt du protocole qu'à partir de la quatrième batterie de tests.
    return PCT.state.testIndex >= PCT.MIN_STOP_TEST_INDEX;
  };

  PCT.updateCreatureAppearance = function updateCreatureAppearance() {
    // Je parcours les règles d'apparence dans leur ordre : cet ordre sert de départage.
    const appearance = PCT.state.appearance;
    const mutationEvents = [];

    if (!appearance || !appearance.rules) {
      return mutationEvents;
    }

    PCT.getAppearanceRules().forEach((rule) => {
      if (!PCT.isAppearanceRuleUnlocked(rule)) {
        return;
      }

      const currentPart = PCT.state.unlockedParts[rule.slot];

      // Si le slot est vide, la première règle débloquée prend la place.
      if (!currentPart) {
        const unlockedPart = PCT.createUnlockedPart(rule);

        PCT.state.unlockedParts[rule.slot] = unlockedPart;
        mutationEvents.push(PCT.createMutationEvent(unlockedPart, null));
        return;
      }

      // Un tier plus haut remplace le lock actuel, même s'il arrive plus tard.
      if (rule.tier > currentPart.tier) {
        const unlockedPart = PCT.createUnlockedPart(rule);

        PCT.state.unlockedParts[rule.slot] = unlockedPart;
        mutationEvents.push(PCT.createMutationEvent(unlockedPart, currentPart));
      }
    });

    return mutationEvents;
  };

  PCT.getAppearanceRules = function getAppearanceRules() {
    // Le format lisible range les règles par slot, mais je garde aussi l'ancien tableau plat en secours.
    const appearance = PCT.state.appearance || {};

    if (Array.isArray(appearance.rules)) {
      return appearance.rules;
    }

    const slots = Array.isArray(appearance.slots) ? appearance.slots : [];

    return slots.flatMap((slot) => {
      const rules = appearance.rules && Array.isArray(appearance.rules[slot]) ? appearance.rules[slot] : [];

      return rules.map((rule) => ({
        ...rule,
        slot
      }));
    });
  };

  PCT.isAppearanceRuleUnlocked = function isAppearanceRuleUnlocked(rule) {
    // Une règle n'est valide que si la stat demandée atteint son seuil.
    return (
      rule &&
      PCT.STAT_KEYS.includes(rule.stat) &&
      typeof rule.min === "number" &&
      PCT.state.stats[rule.stat] >= PCT.getEffectiveAppearanceMin(rule)
    );
  };

  PCT.getEffectiveAppearanceMin = function getEffectiveAppearanceMin(rule) {
    // Seuil interne : plus un tier a déjà de parties actives, plus la prochaine coûte cher.
    const difficulty = PCT.getAppearanceUnlockDifficulty();

    if (!difficulty.enabled || PCT.isAppearanceDifficultyIgnored(rule.slot)) {
      return rule.min;
    }

    const minimumBase = PCT.getMinimumBaseForTier(rule.tier);
    const baseMin = Math.max(rule.min, minimumBase);

    return baseMin + PCT.getSameTierDifficultyOffset(rule);
  };

  PCT.getAppearanceUnlockDifficulty = function getAppearanceUnlockDifficulty() {
    // Configuration de balancing côté développeur, jamais exposée directement au joueur.
    const appearance = PCT.state.appearance || {};
    const difficulty = appearance.unlockDifficulty || {};

    return {
      enabled: difficulty.enabled !== false,
      incrementPerActivePart: typeof difficulty.incrementPerActivePart === "number"
        ? difficulty.incrementPerActivePart
        : 1,
      ignoredSlots: Array.isArray(difficulty.ignoredSlots)
        ? difficulty.ignoredSlots
        : [],
      minimumBaseByTier: difficulty.minimumBaseByTier || {}
    };
  };

  PCT.getMinimumBaseForTier = function getMinimumBaseForTier(tier) {
    // Les seuils de base par tier permettent de garder une progression régulière.
    const difficulty = PCT.getAppearanceUnlockDifficulty();
    const tierKey = String(tier);
    const minimumBase = difficulty.minimumBaseByTier[tierKey];

    return typeof minimumBase === "number" ? minimumBase : 0;
  };

  PCT.getSameTierDifficultyOffset = function getSameTierDifficultyOffset(rule) {
    // Je compte seulement les parties actives du même tier, hors slots ignorés.
    const difficulty = PCT.getAppearanceUnlockDifficulty();
    const activePartCount = Object.values(PCT.state.unlockedParts)
      .filter((part) => (
        part &&
        part.tier === rule.tier &&
        part.slot !== rule.slot &&
        !PCT.isAppearanceDifficultyIgnored(part.slot)
      ))
      .length;

    return activePartCount * difficulty.incrementPerActivePart;
  };

  PCT.isAppearanceDifficultyIgnored = function isAppearanceDifficultyIgnored(slot) {
    // Certaines parties, comme la queue de base, ne doivent pas durcir les prochains seuils.
    return PCT.getAppearanceUnlockDifficulty().ignoredSlots.includes(slot);
  };

  PCT.createUnlockedPart = function createUnlockedPart(rule) {
    // Je garde les infos utiles pour comprendre quel calque a été verrouillé.
    return {
      id: rule.id,
      slot: rule.slot,
      tier: rule.tier,
      stat: rule.stat,
      min: rule.min,
      effectiveMin: PCT.getEffectiveAppearanceMin(rule),
      label: PCT.getLocalizedValue(rule.label, rule.id),
      asset: rule.asset
    };
  };

  PCT.createMutationEvent = function createMutationEvent(part, previousPart) {
    // L'écran créature affiche ces événements pour rendre les paliers visibles au joueur.
    return {
      type: previousPart ? "upgrade" : "unlock",
      slot: part.slot,
      tier: part.tier,
      stat: part.stat,
      min: part.min,
      effectiveMin: part.effectiveMin,
      label: part.label,
      previousLabel: previousPart ? previousPart.label : ""
    };
  };

  PCT.getLocalizedValue = function getLocalizedValue(value, fallback) {
    // Les configs communes peuvent porter des libellés FR/EN sans dépendre d'un seul fichier de langue.
    if (typeof value === "string") {
      return value;
    }

    if (value && typeof value === "object") {
      return value[PCT.state.language] || value.fr || value.en || fallback;
    }

    return fallback;
  };

  PCT.getCreatureAppearance = function getCreatureAppearance() {
    // Avant de rendre la créature, je m'assure que les dernières stats ont bien débloqué leurs calques.
    const appearance = PCT.state.appearance || {};
    const slots = Array.isArray(appearance.slots) ? appearance.slots : [];

    PCT.updateCreatureAppearance();

    return {
      base: appearance.base || "",
      parts: slots
        .map((slot) => PCT.state.unlockedParts[slot])
        .filter(Boolean)
        .map((part) => part.asset)
    };
  };

  PCT.resetRun = function resetRun() {
    // Je remets seulement la partie "run" à zéro, sans effacer la langue choisie.
    PCT.state.loreIndex = 0;
    PCT.state.testIndex = 0;
    PCT.state.currentNodeId = null;
    PCT.state.messageIndex = 0;
    PCT.state.stats = PCT.createEmptyStats();
    PCT.state.unlockedParts = {};
    PCT.state.lastEffects = [];
    PCT.state.lastMutationEvents = [];
    PCT.state.testMutationEvents = [];
    PCT.state.finalCreatureKey = null;
  };
})();
