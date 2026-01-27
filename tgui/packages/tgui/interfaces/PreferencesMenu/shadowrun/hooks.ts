/**
 * Shadowrun Character Generation Custom Hooks
 *
 * Extracted from ShadowrunPageInner to reduce component complexity.
 * These hooks encapsulate the complex useMemo calculations for:
 * - Dashboard data (point totals, essence, nuyen)
 * - Derived stats (limits, condition monitors, composure, etc.)
 * - Character validation (errors, warnings, save eligibility)
 * - Completion percentage
 */

import { useMemo } from 'react';

import {
  AUGMENT_GRADES,
  AWAKENING,
  isAwakened as checkAwakened,
  isMagicUser,
} from './constants';
import {
  AttributeMeta,
  AugmentMeta,
  AugmentSelection,
  ChargenConstData,
  ChargenState,
  DashboardData,
  DerivedStats,
  GearSelection,
  LifestyleMeta,
  ValidationIssue,
  ValidationResult,
} from './types';

// Re-export DerivedStats for backwards compatibility
export type { DerivedStats } from './types';

/** Point allocation data from usePointAllocation hook */
export type PointAllocationData = {
  attrRemaining: number;
  attrSpent: number;
  attrTotal: number;
  effectiveAttributesMeta: AttributeMeta[];
  magicRating: number;
  metatypeLetter: string;
  priorities: PartialPrioritySelection;
  resources: number;
  skillRemaining: number;
  skillSpent: number;
  skillTotal: number;
  specialRemaining: number;
  specialTotal: number;
};

/** Essence calculation data from useEssenceCalculation hook */
export type EssenceCalculationData = {
  essenceCost: number;
  essenceRemaining: number;
  essenceTotal: number;
  hasBiocompatibility: boolean;
};

/** Nuyen calculation data from useNuyenCalculation hook */
export type NuyenCalculationData = {
  augmentNuyenSpent: number;
  droneNuyenSpent: number;
  gearNuyenSpent: number;
  lifestyle: string;
  lifestyleCost: number;
  nuyenRemaining: number;
  nuyenSpent: number;
  nuyenTotal: number;
};

// ============================================================================
// usePointAllocation Hook
// ============================================================================

/**
 * Calculates attribute, skill, and special point allocations.
 * Focused hook for tracking point spend vs. available from priorities.
 *
 * @param chargenState - Current character generation state
 * @param chargenConstData - Constant data from server (priority tables, etc.)
 * @returns Point allocation data or null if inputs are invalid
 */
export function usePointAllocation(
  chargenState: ChargenState | null,
  chargenConstData: ChargenConstData | null,
): PointAllocationData | null {
  return useMemo(() => {
    if (!chargenState || !chargenConstData) {
      return null;
    }

    const priorityTables = chargenConstData.priority_tables;
    if (!priorityTables) {
      return null;
    }

    const priorities = chargenState.priorities;
    const attrLetter = priorities['attributes'] || 'E';
    const skillLetter = priorities['skills'] || 'E';
    const magicLetter = priorities['magic'] || 'E';
    const resourcesLetter = priorities['resources'] || 'E';
    const metatypeLetter = priorities['metatype'] || 'E';

    const totalAttrPoints = priorityTables.attributes?.[attrLetter] || 0;
    const totalSkillPoints = priorityTables.skills?.[skillLetter] || 0;
    const totalSpecialPoints =
      priorityTables.metatype_special?.[metatypeLetter] || 0;
    const resourcesAmount = priorityTables.resources?.[resourcesLetter] || 0;
    const magicRating = priorityTables.magic?.[magicLetter] || 0;

    // Calculate attribute points spent
    const attributesMeta = chargenConstData.attributes || [];
    const metatypeBounds =
      chargenConstData.metatype_attribute_bounds?.[
        chargenState.metatype_species
      ] || {};

    const effectiveAttributesMeta = attributesMeta.map((a: AttributeMeta) => {
      const range = metatypeBounds[a.id];
      if (Array.isArray(range) && range.length >= 2) {
        return { ...a, min: range[0], max: range[1] };
      }
      return a;
    });

    const attrSpent = effectiveAttributesMeta.reduce(
      (sum: number, a: AttributeMeta) => {
        const current = chargenState.attributes[a.id] ?? a.min;
        return sum + Math.max(0, current - a.min);
      },
      0,
    );

    // Calculate skill points spent (ratings + specializations)
    const skillRatingsSpent = Object.values(
      chargenState.skills || {},
    ).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
    const skillSpecializationCount = Object.keys(
      chargenState.skill_specializations || {},
    ).length;
    const skillSpent = skillRatingsSpent + skillSpecializationCount;

    const specialSpent = Object.values(
      chargenState.special || {},
    ).reduce<number>((sum, v) => sum + Math.max(0, Number(v) || 0), 0);

    return {
      attrRemaining: totalAttrPoints - attrSpent,
      attrSpent,
      attrTotal: totalAttrPoints,
      skillRemaining: totalSkillPoints - skillSpent,
      skillSpent,
      skillTotal: totalSkillPoints,
      specialRemaining: totalSpecialPoints - specialSpent,
      specialTotal: totalSpecialPoints,
      resources: resourcesAmount,
      magicRating,
      metatypeLetter,
      priorities,
      effectiveAttributesMeta,
    };
  }, [chargenState, chargenConstData]);
}

// ============================================================================
// useEssenceCalculation Hook
// ============================================================================

/**
 * Calculates essence spent and remaining from augmentations.
 * Handles grade multipliers and Biocompatibility quality bonus.
 *
 * @param chargenState - Current character generation state
 * @param chargenConstData - Constant data from server (augment catalog)
 * @param hasBiocompatibility - Whether player has Biocompatibility quality
 * @returns Essence calculation data or null if inputs are invalid
 */
export function useEssenceCalculation(
  chargenState: ChargenState | null,
  chargenConstData: ChargenConstData | null,
  hasBiocompatibility: boolean,
): EssenceCalculationData | null {
  return useMemo(() => {
    if (!chargenState || !chargenConstData) {
      return null;
    }

    const essenceBase = 6.0;
    const selectedAugments = chargenState.augments || {};
    // Biocompatibility reduces essence cost by 10%
    const biocompMultiplier = hasBiocompatibility ? 0.9 : 1.0;

    // Build augment lookup from augments array or use as-is if it's a Record
    // Server sends augments as a Record keyed by ID at runtime
    const augmentLookup =
      (chargenConstData?.augments as unknown as Record<string, AugmentMeta>) ||
      {};

    const essenceCost = Object.entries(selectedAugments).reduce(
      (
        total,
        [augmentId, augmentData]: [string, AugmentSelection | undefined],
      ) => {
        if (!augmentData) return total;
        const baseCost = augmentLookup[augmentId]?.essence_cost || 0;
        const grade = augmentData.grade || 'standard';
        const gradeData = AUGMENT_GRADES[grade];
        const gradeMultiplier = gradeData?.essenceMultiplier || 1.0;
        return total + baseCost * gradeMultiplier * biocompMultiplier;
      },
      0,
    );

    return {
      essenceCost,
      essenceRemaining: essenceBase - essenceCost,
      essenceTotal: essenceBase,
      hasBiocompatibility,
    };
  }, [chargenState, chargenConstData, hasBiocompatibility]);
}

// ============================================================================
// useNuyenCalculation Hook
// ============================================================================

/**
 * Calculates nuyen spent and remaining from all purchases.
 * Includes augments, gear, drones, and lifestyle costs.
 *
 * @param chargenState - Current character generation state
 * @param chargenConstData - Constant data from server (catalogs, costs)
 * @param totalResources - Total nuyen from Resources priority
 * @returns Nuyen calculation data or null if inputs are invalid
 */
export function useNuyenCalculation(
  chargenState: ChargenState | null,
  chargenConstData: ChargenConstData | null,
  totalResources: number,
): NuyenCalculationData | null {
  return useMemo(() => {
    if (!chargenState || !chargenConstData) {
      return null;
    }

    // Calculate nuyen spent on augments (including cyberlimb upgrades)
    const selectedAugments = chargenState.augments || {};
    const cyberlimbUpgradeCost =
      chargenConstData?.cyberlimb_upgrade_cost || 5000;

    // Build augment lookup from augments (server sends as Record at runtime)
    const augmentLookup =
      (chargenConstData?.augments as unknown as Record<string, AugmentMeta>) ||
      {};

    const augmentNuyenSpent = Object.entries(selectedAugments).reduce(
      (
        total,
        [augmentId, augmentData]: [string, AugmentSelection | undefined],
      ) => {
        if (!augmentData) return total;
        const augmentMeta = augmentLookup[augmentId];
        const baseCost = augmentMeta?.nuyen_cost || 0;
        const grade = augmentData.grade || 'standard';
        const gradeData = AUGMENT_GRADES[grade];
        const costMultiplier = gradeData?.costMultiplier || 1.0;
        let cost = baseCost * costMultiplier;

        // Add cyberlimb upgrade costs
        const isCyberlimb = augmentMeta?.is_cyberlimb || false;
        if (isCyberlimb) {
          const agiUpgrade = augmentData.agi_upgrade || 0;
          const strUpgrade = augmentData.str_upgrade || 0;
          cost += (agiUpgrade + strUpgrade) * cyberlimbUpgradeCost;
        }

        return total + cost;
      },
      0,
    );

    // Calculate lifestyle cost (1 month prepaid)
    const lifestyles = chargenConstData?.lifestyles || [];
    const selectedLifestyle = chargenState.lifestyle || 'low';
    const lifestyleData = lifestyles.find(
      (l: LifestyleMeta) => l.id === selectedLifestyle,
    );
    const lifestyleCost = lifestyleData?.cost || 2000;

    // Calculate gear cost
    const gearCatalog = chargenConstData?.gear_catalog || {};
    const selectedGear = chargenState.gear || [];
    const gearNuyenSpent = selectedGear.reduce(
      (total: number, gearEntry: GearSelection) => {
        const gearData = gearCatalog[gearEntry.id];
        if (!gearData) return total;
        const quantity = gearEntry.quantity || 1;
        return total + gearData.cost * quantity;
      },
      0,
    );

    // Calculate drone cost (including mods)
    const droneCatalog = chargenConstData?.drone_catalog || {};
    const droneModCatalog = chargenConstData?.drone_mod_catalog || {};
    const rawDrones = chargenState.drones;

    // Handle both legacy array format and new object format
    const droneNuyenSpent = (() => {
      if (!rawDrones) return 0;
      if (Array.isArray(rawDrones)) {
        // Legacy format: string[]
        return rawDrones.reduce((total: number, droneId: string) => {
          const droneData = droneCatalog[droneId];
          if (!droneData) return total;
          return total + (droneData.cost || 0);
        }, 0);
      }
      // New format: { [droneId]: { mods: string[] } }
      let total = 0;
      for (const droneId of Object.keys(rawDrones)) {
        const droneData = droneCatalog[droneId];
        if (droneData) {
          total += droneData.cost || 0;
        }
        // Add mod costs
        const droneEntry = rawDrones[droneId];
        for (const modId of droneEntry?.mods || []) {
          const modData = droneModCatalog[modId];
          if (modData) {
            total += modData.cost || 0;
          }
        }
      }
      return total;
    })();

    const nuyenSpent =
      augmentNuyenSpent + lifestyleCost + gearNuyenSpent + droneNuyenSpent;

    return {
      augmentNuyenSpent,
      droneNuyenSpent,
      gearNuyenSpent,
      lifestyle: selectedLifestyle,
      lifestyleCost,
      nuyenRemaining: totalResources - nuyenSpent,
      nuyenSpent,
      nuyenTotal: totalResources,
    };
  }, [chargenState, chargenConstData, totalResources]);
}

// ============================================================================
// useDashboardData Hook (Composition of focused hooks)
// ============================================================================

/**
 * Calculates all dashboard data including point allocations, essence, and nuyen.
 * This is a composition hook that combines the focused hooks for convenience.
 *
 * For more granular control, use the individual hooks:
 * - usePointAllocation - Attribute/skill/special points
 * - useEssenceCalculation - Essence tracking
 * - useNuyenCalculation - Budget tracking
 *
 * @param chargenState - Current character generation state
 * @param chargenConstData - Constant data from server (priority tables, etc.)
 * @param hasBiocompatibility - Whether player has Biocompatibility quality
 * @returns Dashboard data object or null if inputs are invalid
 */
export function useDashboardData(
  chargenState: ChargenState | null,
  chargenConstData: ChargenConstData | null,
  hasBiocompatibility: boolean,
): DashboardData | null {
  const pointAllocation = usePointAllocation(chargenState, chargenConstData);
  const essenceCalc = useEssenceCalculation(
    chargenState,
    chargenConstData,
    hasBiocompatibility,
  );
  const nuyenCalc = useNuyenCalculation(
    chargenState,
    chargenConstData,
    pointAllocation?.resources || 0,
  );

  return useMemo(() => {
    if (!pointAllocation || !essenceCalc || !nuyenCalc) {
      return null;
    }

    return {
      // Point allocation
      ...pointAllocation,
      // Essence
      essenceRemaining: essenceCalc.essenceRemaining,
      essenceTotal: essenceCalc.essenceTotal,
      hasBiocompatibility: essenceCalc.hasBiocompatibility,
      // Nuyen
      ...nuyenCalc,
    };
  }, [pointAllocation, essenceCalc, nuyenCalc]);
}

// ============================================================================
// useDerivedStats Hook
// ============================================================================

/**
 * Calculates derived statistics (limits, condition monitors, composure, etc.)
 *
 * @param dashboardData - Dashboard data from useDashboardData
 * @param chargenState - Current character generation state
 * @returns Derived stats object or null if inputs are invalid
 */
export function useDerivedStats(
  dashboardData: DashboardData | null,
  chargenState: ChargenState | null,
): DerivedStats | null {
  return useMemo(() => {
    if (!dashboardData || !chargenState) {
      return null;
    }

    const getAttrValue = (name: string) => {
      const meta = dashboardData.effectiveAttributesMeta.find(
        (a: AttributeMeta) =>
          a.name?.toLowerCase() === name.toLowerCase() ||
          a.id?.toLowerCase().includes(name.toLowerCase()),
      );
      if (!meta) {
        return 1;
      }
      return chargenState.attributes[meta.id] ?? meta.min ?? 1;
    };

    const body = getAttrValue('body');
    const agility = getAttrValue('agility');
    const reaction = getAttrValue('reaction');
    const strength = getAttrValue('strength');
    const willpower = getAttrValue('willpower');
    const logic = getAttrValue('logic');
    const intuition = getAttrValue('intuition');
    const charisma = getAttrValue('charisma');

    // SR5 Limits calculation (rounded up)
    const physicalLimit = Math.ceil((strength * 2 + body + reaction) / 3);
    const mentalLimit = Math.ceil((logic * 2 + intuition + willpower) / 3);
    const socialLimit = Math.ceil(
      (charisma * 2 +
        willpower +
        Math.floor(chargenState.special?.['/datum/rpg_stat/essence'] ?? 6)) /
        3,
    );

    // SR5 Condition Monitors
    const physicalCM = 8 + Math.ceil(body / 2);
    const stunCM = 8 + Math.ceil(willpower / 2);

    return {
      composure: charisma + willpower,
      judgeIntentions: charisma + intuition,
      memory: logic + willpower,
      liftCarry: strength + body,
      initiative: reaction + intuition,
      // Limits
      physicalLimit,
      mentalLimit,
      socialLimit,
      // Condition Monitors
      physicalCM,
      stunCM,
    };
  }, [dashboardData, chargenState]);
}

// ============================================================================
// useCompletionPercent Hook
// ============================================================================

/**
 * Calculates the character creation completion percentage.
 *
 * @param dashboardData - Dashboard data from useDashboardData
 * @param isSaved - Whether the character has been saved
 * @returns Completion percentage (0-100)
 */
export function useCompletionPercent(
  dashboardData: DashboardData | null,
  isSaved: boolean,
): number {
  return useMemo(() => {
    if (!dashboardData) {
      return 0;
    }

    let points = 0;

    // Attributes: give points for spending all
    if (dashboardData.attrTotal > 0) {
      const spent = dashboardData.attrTotal - dashboardData.attrRemaining;
      points += (spent / dashboardData.attrTotal) * 33;
    }

    // Skills: give points for spending all
    if (dashboardData.skillTotal > 0) {
      const spent = dashboardData.skillTotal - dashboardData.skillRemaining;
      points += (spent / dashboardData.skillTotal) * 33;
    }

    // Special: give points for spending all
    if (dashboardData.specialTotal > 0) {
      const spent = dashboardData.specialTotal - dashboardData.specialRemaining;
      points += (spent / dashboardData.specialTotal) * 20;
    }

    // Saved: bonus points
    if (isSaved) {
      points += 14;
    }

    return Math.min(100, Math.round(points));
  }, [dashboardData, isSaved]);
}

// ============================================================================
// useChargenValidation Hook
// ============================================================================

/**
 * Validates the character sheet and returns issues, counts, and save eligibility.
 *
 * @param dashboardData - Dashboard data from useDashboardData
 * @param chargenState - Current character generation state
 * @returns Validation result with issues array and status flags
 */
export function useChargenValidation(
  dashboardData: DashboardData | null,
  chargenState: ChargenState | null,
): ValidationResult {
  return useMemo(() => {
    const issues: ValidationIssue[] = [];

    if (!dashboardData || !chargenState) {
      return {
        issues,
        isValid: false,
        canSave: false,
        errorCount: 0,
        warningCount: 0,
      };
    }

    // Attribute points validation
    if (dashboardData.attrRemaining < 0) {
      issues.push({
        message: `Overspent ${Math.abs(dashboardData.attrRemaining)} attribute point(s)`,
        severity: 'error',
        section: 'attributes',
      });
    } else if (dashboardData.attrRemaining > 0) {
      issues.push({
        message: `${dashboardData.attrRemaining} attribute point(s) unspent`,
        severity: 'warning',
        section: 'attributes',
      });
    }

    // Skill points validation
    if (dashboardData.skillRemaining < 0) {
      issues.push({
        message: `Overspent ${Math.abs(dashboardData.skillRemaining)} skill point(s)`,
        severity: 'error',
        section: 'skills',
      });
    } else if (dashboardData.skillRemaining > 0) {
      issues.push({
        message: `${dashboardData.skillRemaining} skill point(s) unspent`,
        severity: 'warning',
        section: 'skills',
      });
    }

    // Special points validation
    if (dashboardData.specialRemaining < 0) {
      issues.push({
        message: `Overspent ${Math.abs(dashboardData.specialRemaining)} special point(s)`,
        severity: 'error',
        section: 'special',
      });
    } else if (
      dashboardData.specialRemaining > 0 &&
      dashboardData.specialTotal > 0
    ) {
      issues.push({
        message: `${dashboardData.specialRemaining} special point(s) unspent`,
        severity: 'warning',
        section: 'special',
      });
    }

    // Magic user validation
    const awakening = chargenState.awakening || AWAKENING.MUNDANE;
    const magicLetter = chargenState.priorities?.['magic'] || 'E';
    const isAwakened = checkAwakened(awakening) && magicLetter !== 'E';

    if (isAwakened) {
      // Check tradition selected for mages/adepts
      if (isMagicUser(awakening) && !chargenState.tradition) {
        issues.push({
          message: 'No magical tradition selected',
          severity: 'warning',
          section: 'magic',
        });
      }

      // Check spells for mages
      const selectedSpells = chargenState.selected_spells || [];
      if (isMagicUser(awakening) && selectedSpells.length === 0) {
        issues.push({
          message: 'No spells selected',
          severity: 'warning',
          section: 'magic',
        });
      }
    }

    // Essence validation
    if (dashboardData.essenceRemaining < 0) {
      issues.push({
        message: 'Essence cannot go below 0',
        severity: 'error',
        section: 'augments',
      });
    }

    // Nuyen validation
    if (dashboardData.nuyenRemaining < 0) {
      issues.push({
        message: `Overspent ¥${Math.abs(dashboardData.nuyenRemaining).toLocaleString()} nuyen`,
        severity: 'error',
        section: 'augments',
      });
    }

    // Count errors and warnings
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    return {
      issues,
      errorCount,
      warningCount,
      isValid: errorCount === 0 && warningCount === 0,
      canSave: errorCount === 0, // Can save with warnings, but not errors
    };
  }, [dashboardData, chargenState]);
}

// ============================================================================
// Bump Value Utilities
// ============================================================================

/**
 * Configuration for createBumpHandler.
 */
export type BumpHandlerConfig<T extends Record<string, number>> = {
  /** Function to check if bumping is allowed (e.g., locked by group) */
  canBump?: (id: string, delta: number) => boolean;
  /** Current record of id -> value */
  currentValues: T;
  /** Whether to delete entry when value becomes 0 (default true) */
  deleteOnZero?: boolean;
  /** Function to get max value for an id (defaults to 6) */
  getMax?: (id: string) => number;
  /** Function to get min value for an id (defaults to 0) */
  getMin?: (id: string) => number;
  /** Function to validate point budget. Returns true if valid. */
  validatePoints?: (
    id: string,
    currentValue: number,
    newValue: number,
  ) => boolean;
};

/**
 * Result from a bump operation.
 */
export type BumpResult<T extends Record<string, number>> = {
  changedId?: string;
  newValue?: number;
  newValues: T;
  oldValue?: number;
  success: boolean;
};

/**
 * Utility function to calculate a bumped value record.
 * This is the pure logic extracted from all the handleBump* functions.
 *
 * @param id - The ID of the item to bump
 * @param delta - The amount to change (+1 or -1 typically)
 * @param config - Configuration for the bump operation
 * @returns BumpResult with the new values record
 *
 * @example
 * ```tsx
 * const result = calculateBumpedValue(skillId, delta, {
 *   currentValues: skills,
 *   getMin: () => 0,
 *   getMax: () => 6,
 *   validatePoints: (id, curr, next) => {
 *     const costDelta = next - curr;
 *     return costDelta <= 0 || spentPoints + costDelta <= totalPoints;
 *   },
 * });
 * if (result.success) {
 *   updateState({ skills: result.newValues });
 * }
 * ```
 */
export function calculateBumpedValue<T extends Record<string, number>>(
  id: string,
  delta: number,
  config: BumpHandlerConfig<T>,
): BumpResult<T> {
  const {
    currentValues,
    getMin = () => 0,
    getMax = () => 6,
    canBump = () => true,
    validatePoints = () => true,
    deleteOnZero = true,
  } = config;

  const current = Number(currentValues[id]) || 0;
  const minValue = getMin(id);
  const maxValue = getMax(id);

  // Clamp to valid range
  const newValue = Math.max(minValue, Math.min(maxValue, current + delta));

  // No change
  if (newValue === current) {
    return { success: false, newValues: currentValues };
  }

  // Check if bumping is allowed
  if (!canBump(id, delta)) {
    return { success: false, newValues: currentValues };
  }

  // Validate points budget
  if (!validatePoints(id, current, newValue)) {
    return { success: false, newValues: currentValues };
  }

  // Create new values object
  const newValues = { ...currentValues } as T;
  if (deleteOnZero && newValue <= 0) {
    delete newValues[id];
  } else {
    (newValues as Record<string, number>)[id] = newValue;
  }

  return {
    success: true,
    newValues,
    changedId: id,
    oldValue: current,
    newValue,
  };
}

/**
 * Factory function to create a bump handler with consistent behavior.
 * This reduces boilerplate in components that need bump functionality.
 *
 * @param config - Static configuration for the handler
 * @returns A handler function that takes (id, delta) and returns BumpResult
 *
 * @example
 * ```tsx
 * const bumpSkill = createBumpHandler({
 *   currentValues: skills,
 *   getMax: () => 6,
 *   validatePoints: (id, curr, next) => next - curr <= remainingPoints,
 * });
 *
 * const result = bumpSkill(skillId, 1);
 * if (result.success) {
 *   handleStateUpdate({ skills: result.newValues });
 * }
 * ```
 */
export function createBumpHandler<T extends Record<string, number>>(
  config: BumpHandlerConfig<T>,
): (id: string, delta: number) => BumpResult<T> {
  return (id: string, delta: number) => calculateBumpedValue(id, delta, config);
}
