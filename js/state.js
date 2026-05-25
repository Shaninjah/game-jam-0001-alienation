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

  PCT.createEmptyEvolutionState = function createEmptyEvolutionState() {
    // Ces valeurs suivent la partie cachee du protocole : pression, instabilite et anomalies.
    return {
      instability: 0,
      evolutionPressure: 0,
      anomalyStage: 0,
      dominantHistory: [],
      warnings: []
    };
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
    instability: 0,
    evolutionPressure: 0,
    anomalyStage: 0,
    dominantHistory: [],
    warnings: [],
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

  PCT.updateCreatureInstability = function updateCreatureInstability(effects = {}) {
    // La surcharge reste lisible par le code : elle monte avec les choix trop specialises.
    const config = PCT.getInstabilityConfig();

    if (!config.enabled) {
      return {
        pressureDelta: 0,
        stageChanged: false
      };
    }

    const previousStage = PCT.state.anomalyStage;
    const previousDominantKey = PCT.state.dominantHistory[PCT.state.dominantHistory.length - 1];
    const dominantKey = PCT.getDominantStatKey ? PCT.getDominantStatKey() : PCT.STAT_KEYS[0];
    const statRanking = PCT.getStatRanking();
    const topScore = statRanking[0] ? statRanking[0].value : 0;
    const secondScore = statRanking[1] ? statRanking[1].value : 0;
    const lowestScore = statRanking[statRanking.length - 1] ? statRanking[statRanking.length - 1].value : 0;
    const dominanceGap = topScore - secondScore;
    const overBalancedGap = topScore - lowestScore;
    const isOverBalanced = (
      lowestScore >= config.balancedHighThreshold &&
      overBalancedGap <= config.balancedHighGap
    );
    const positiveEffectTotal = PCT.getPositiveEffectTotal(effects);
    let pressureDelta = config.choicePressure + (positiveEffectTotal * config.positiveEffectPressure);

    if (dominanceGap >= config.dominanceGap) {
      pressureDelta += config.dominancePressure;
    }

    if (topScore >= config.highStatThreshold) {
      pressureDelta += config.highStatPressure;
    }

    if (PCT.state.testIndex >= config.lateTestIndex) {
      pressureDelta += config.lateTestPressure;
    }

    if (previousDominantKey && previousDominantKey !== dominantKey) {
      pressureDelta += config.dominantShiftPressure;
    }

    if (isOverBalanced) {
      pressureDelta += config.balancedHighPressure;
    } else if (dominanceGap <= config.balancedGap) {
      pressureDelta -= config.balancedRelief;
    }

    if (typeof effects.instability === "number") {
      pressureDelta += effects.instability;
    }

    if (typeof effects.pressure === "number") {
      pressureDelta += effects.pressure * config.effectPressureScale;
    }

    if (typeof effects.stability === "number") {
      pressureDelta -= effects.stability * config.effectStabilityScale;
    }

    if (effects.mercy === true) {
      pressureDelta -= config.balancedRelief;
    }

    if (effects.overdrive === true) {
      pressureDelta += config.overdrivePressure;
    }

    const nextPressure = PCT.clamp
      ? PCT.clamp(PCT.state.evolutionPressure + pressureDelta, 0, config.max)
      : Math.min(Math.max(PCT.state.evolutionPressure + pressureDelta, 0), config.max);

    PCT.state.evolutionPressure = Number(nextPressure.toFixed(2));
    PCT.state.instability = PCT.state.evolutionPressure;
    // Une anomalie revelee reste un fait biologique, meme si le protocole redevient plus calme ensuite.
    PCT.state.anomalyStage = Math.max(previousStage, PCT.getAnomalyStage(PCT.state.instability));
    PCT.state.dominantHistory.push(dominantKey);

    if (PCT.state.dominantHistory.length > 24) {
      PCT.state.dominantHistory.shift();
    }

    if (PCT.state.anomalyStage > previousStage) {
      PCT.state.warnings.push({
        type: "anomaly-stage",
        stage: PCT.state.anomalyStage,
        instability: PCT.state.instability,
        dominantStat: dominantKey
      });
    }

    return {
      pressureDelta,
      stageChanged: PCT.state.anomalyStage !== previousStage
    };
  };

  PCT.getInstabilityConfig = function getInstabilityConfig() {
    // Valeurs par defaut pour garder le jeu fonctionnel si la config est incomplete.
    const appearance = PCT.state.appearance || {};
    const config = appearance.instability || {};
    const stageThresholds = config.stageThresholds || {};

    return {
      enabled: config.enabled !== false,
      max: typeof config.max === "number" ? config.max : 12,
      choicePressure: typeof config.choicePressure === "number" ? config.choicePressure : 0.15,
      positiveEffectPressure: typeof config.positiveEffectPressure === "number" ? config.positiveEffectPressure : 0.12,
      effectPressureScale: typeof config.effectPressureScale === "number" ? config.effectPressureScale : 1,
      effectStabilityScale: typeof config.effectStabilityScale === "number" ? config.effectStabilityScale : 1,
      overdrivePressure: typeof config.overdrivePressure === "number" ? config.overdrivePressure : 0.7,
      dominanceGap: typeof config.dominanceGap === "number" ? config.dominanceGap : 5,
      dominancePressure: typeof config.dominancePressure === "number" ? config.dominancePressure : 0.7,
      highStatThreshold: typeof config.highStatThreshold === "number" ? config.highStatThreshold : 9,
      highStatPressure: typeof config.highStatPressure === "number" ? config.highStatPressure : 0.7,
      lateTestIndex: typeof config.lateTestIndex === "number" ? config.lateTestIndex : 3,
      lateTestPressure: typeof config.lateTestPressure === "number" ? config.lateTestPressure : 0.35,
      dominantShiftPressure: typeof config.dominantShiftPressure === "number" ? config.dominantShiftPressure : 0.45,
      balancedGap: typeof config.balancedGap === "number" ? config.balancedGap : 2,
      balancedRelief: typeof config.balancedRelief === "number" ? config.balancedRelief : 0.25,
      balancedHighThreshold: typeof config.balancedHighThreshold === "number" ? config.balancedHighThreshold : 8,
      balancedHighGap: typeof config.balancedHighGap === "number" ? config.balancedHighGap : 3,
      balancedHighPressure: typeof config.balancedHighPressure === "number" ? config.balancedHighPressure : 0.6,
      stageThresholds: {
        1: typeof stageThresholds["1"] === "number" ? stageThresholds["1"] : 4,
        2: typeof stageThresholds["2"] === "number" ? stageThresholds["2"] : 7,
        3: typeof stageThresholds["3"] === "number" ? stageThresholds["3"] : 10
      }
    };
  };

  PCT.getAnomalyStage = function getAnomalyStage(instability) {
    // Les paliers sont cumulables : stage 3 implique que les stages 1 et 2 sont aussi depasses.
    const thresholds = PCT.getInstabilityConfig().stageThresholds;
    let stage = 0;

    Object.keys(thresholds).forEach((stageKey) => {
      const stageNumber = Number(stageKey);

      if (instability >= thresholds[stageKey] && stageNumber > stage) {
        stage = stageNumber;
      }
    });

    return stage;
  };

  PCT.getStatRanking = function getStatRanking() {
    // Classe les stats pour mesurer la specialisation sans exposer de nouvelle stat au joueur.
    return PCT.STAT_KEYS
      .map((key) => ({
        key,
        value: PCT.state.stats[key]
      }))
      .sort((left, right) => right.value - left.value);
  };

  PCT.getPositiveEffectTotal = function getPositiveEffectTotal(effects) {
    // Seules les poussees positives participent a la pression brute.
    return PCT.STAT_KEYS.reduce((total, key) => {
      const value = effects && typeof effects[key] === "number" ? effects[key] : 0;
      return value > 0 ? total + value : total;
    }, 0);
  };

  PCT.updateCreatureAppearance = function updateCreatureAppearance() {
    // Je verrouille une seule evolution par test ; les anomalies passent devant les mutations saines.
    const appearance = PCT.state.appearance;
    const mutationEvents = [];
    const maxEvents = PCT.getRemainingMutationEventsForCurrentTest();
    const firstVisibleMutationTestIndex = typeof PCT.FIRST_VISIBLE_MUTATION_TEST_INDEX === "number"
      ? PCT.FIRST_VISIBLE_MUTATION_TEST_INDEX
      : 1;

    if (!appearance || !appearance.rules) {
      return mutationEvents;
    }

    if (PCT.state.testIndex < firstVisibleMutationTestIndex) {
      return mutationEvents;
    }

    if (maxEvents <= 0) {
      return mutationEvents;
    }

    const candidate = PCT.getNextAppearanceMutationCandidate();

    if (candidate) {
      const unlockedPart = PCT.createUnlockedPart(candidate.rule);

      PCT.state.unlockedParts[candidate.rule.slot] = unlockedPart;
      mutationEvents.push(PCT.createMutationEvent(unlockedPart, candidate.currentPart || null));
    }

    return mutationEvents;
  };

  PCT.getNextAppearanceMutationCandidate = function getNextAppearanceMutationCandidate() {
    const anomalyCandidates = PCT.getAnomalyRules()
      .map(PCT.createAppearanceMutationCandidate)
      .filter(Boolean);

    if (anomalyCandidates.length) {
      return anomalyCandidates.sort(PCT.compareAnomalyMutationCandidates)[0];
    }

    const normalCandidates = PCT.getAppearanceRules()
      .map(PCT.createAppearanceMutationCandidate)
      .filter(Boolean);

    return normalCandidates.sort(PCT.compareAppearanceMutationCandidates)[0] || null;
  };

  PCT.createAppearanceMutationCandidate = function createAppearanceMutationCandidate(rule) {
    if (!PCT.isAppearanceRuleUnlocked(rule)) {
      return null;
    }

    const currentPart = PCT.state.unlockedParts[rule.slot];

    if (rule.isAnomaly) {
      if (currentPart && !PCT.shouldApplyAnomalyRule(rule, currentPart)) {
        return null;
      }
    } else if (currentPart && (currentPart.isAnomaly || rule.tier <= currentPart.tier)) {
      return null;
    }

    return {
      rule,
      currentPart: currentPart || null,
      currentTier: currentPart ? currentPart.tier : 0,
      slotPriority: PCT.getAppearanceSlotPriority(rule.slot),
      targetTier: rule.tier || 0,
      isAnomaly: rule.isAnomaly === true
    };
  };

  PCT.compareAppearanceMutationCandidates = function compareAppearanceMutationCandidates(left, right) {
    if (left.currentTier !== right.currentTier) {
      return left.currentTier - right.currentTier;
    }

    if (left.slotPriority !== right.slotPriority) {
      return left.slotPriority - right.slotPriority;
    }

    if (left.targetTier !== right.targetTier) {
      return left.targetTier - right.targetTier;
    }

    return Number(left.isAnomaly) - Number(right.isAnomaly);
  };

  PCT.compareAnomalyMutationCandidates = function compareAnomalyMutationCandidates(left, right) {
    const leftStage = left.rule.stage || 0;
    const rightStage = right.rule.stage || 0;

    if (leftStage !== rightStage) {
      return rightStage - leftStage;
    }

    if (left.currentTier !== right.currentTier) {
      return left.currentTier - right.currentTier;
    }

    if (left.slotPriority !== right.slotPriority) {
      return left.slotPriority - right.slotPriority;
    }

    if (left.targetTier !== right.targetTier) {
      return right.targetTier - left.targetTier;
    }

    return 0;
  };

  PCT.getAppearanceSlotPriority = function getAppearanceSlotPriority(slot) {
    const slots = Array.isArray((PCT.state.appearance || {}).slots)
      ? PCT.state.appearance.slots
      : [];
    const index = slots.indexOf(slot);

    return index >= 0 ? index : slots.length;
  };

  PCT.getRemainingMutationEventsForCurrentTest = function getRemainingMutationEventsForCurrentTest() {
    // Un test ne peut ajouter qu'une seule nouvelle partie ou evolution visible.
    const maxEventsPerTest = 1;
    const currentEvents = Array.isArray(PCT.state.testMutationEvents)
      ? PCT.state.testMutationEvents.length
      : 0;

    return Math.max(maxEventsPerTest - currentEvents, 0);
  };

  PCT.shouldApplyAnomalyRule = function shouldApplyAnomalyRule(rule, currentPart) {
    if (currentPart.id === rule.id) {
      return false;
    }

    if (!currentPart.isAnomaly) {
      return true;
    }

    if ((rule.stage || 0) > (currentPart.anomalyStage || 0)) {
      return true;
    }

    return (rule.stage || 0) === (currentPart.anomalyStage || 0);
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

  PCT.getAnomalyRules = function getAnomalyRules() {
    const appearance = PCT.state.appearance || {};
    const anomalyRules = appearance.anomalyRules || {};

    if (Array.isArray(anomalyRules)) {
      return anomalyRules.map((rule) => ({
        ...rule,
        isAnomaly: true
      }));
    }

    const slots = Array.isArray(appearance.slots) ? appearance.slots : [];

    return slots.flatMap((slot) => {
      const rules = Array.isArray(anomalyRules[slot]) ? anomalyRules[slot] : [];

      return rules.map((rule) => ({
        ...rule,
        slot,
        isAnomaly: true
      }));
    });
  };

  PCT.isAppearanceRuleUnlocked = function isAppearanceRuleUnlocked(rule) {
    if (rule && rule.isAnomaly) {
      return PCT.isAnomalyRuleUnlocked(rule);
    }

    // Une règle n'est valide que si la stat demandée atteint son seuil.
    return (
      rule &&
      PCT.STAT_KEYS.includes(rule.stat) &&
      typeof rule.min === "number" &&
      PCT.state.stats[rule.stat] >= PCT.getEffectiveAppearanceMin(rule)
    );
  };

  PCT.isAnomalyRuleUnlocked = function isAnomalyRuleUnlocked(rule) {
    const config = PCT.getInstabilityConfig();

    if (!config.enabled || !rule || typeof rule.minInstability !== "number") {
      return false;
    }

    if (PCT.state.instability < rule.minInstability) {
      return false;
    }

    if (typeof rule.stage === "number" && PCT.state.anomalyStage < rule.stage) {
      return false;
    }

    const dominantStat = PCT.getDominantStatKey ? PCT.getDominantStatKey() : PCT.STAT_KEYS[0];

    if (rule.stat && rule.stat !== "any" && rule.stat !== dominantStat) {
      return false;
    }

    if (typeof rule.minDominantStat === "number" && PCT.state.stats[dominantStat] < rule.minDominantStat) {
      return false;
    }

    return true;
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
        !part.isAnomaly &&
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
    const isAnomaly = rule.isAnomaly === true;
    const stat = rule.stat === "any" && PCT.getDominantStatKey
      ? PCT.getDominantStatKey()
      : rule.stat;

    return {
      id: rule.id,
      slot: rule.slot,
      tier: rule.tier,
      stat,
      min: isAnomaly ? rule.minInstability : rule.min,
      effectiveMin: isAnomaly ? rule.minInstability : PCT.getEffectiveAppearanceMin(rule),
      label: PCT.getLocalizedValue(rule.label, rule.id),
      asset: rule.asset,
      isAnomaly,
      anomalyStage: isAnomaly ? rule.stage || 1 : 0
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
      previousLabel: previousPart ? previousPart.label : "",
      isAnomaly: part.isAnomaly === true,
      anomalyStage: part.anomalyStage || 0
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
    // Le rendu lit seulement les parties déjà verrouillées à la fin du test.
    const appearance = PCT.state.appearance || {};
    const slots = Array.isArray(appearance.slots) ? appearance.slots : [];

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
    PCT.state.instability = 0;
    PCT.state.evolutionPressure = 0;
    PCT.state.anomalyStage = 0;
    PCT.state.dominantHistory = [];
    PCT.state.warnings = [];
    PCT.state.unlockedParts = {};
    PCT.state.lastEffects = [];
    PCT.state.lastMutationEvents = [];
    PCT.state.testMutationEvents = [];
    PCT.state.finalCreatureKey = null;
  };
})();
