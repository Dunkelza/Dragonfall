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

import { AUGMENT_GRADES } from './constants';
import {
  AttributeMeta,
  AugmentSelection,
  ChargenConstData,
  ChargenState,
  DashboardData,
  GearSelection,
  LifestyleMeta,
  ValidationIssue,
  ValidationResult,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export type DerivedStats = {
  composure: number;
  initiative: number;
  judgeIntentions: number;
  liftCarry: number;
  memory: number;
  mentalLimit: number;
  physicalCM: number;
  physicalLimit: number;
  socialLimit: number;
  stunCM: number;
};

// ============================================================================
// useDashboardData Hook
// ============================================================================

/**
 * Calculates all dashboard data including point allocations, essence, and nuyen.
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

    // Calculate spent points
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

    // Calculate essence from augments
    const essenceBase = 6.0;
    const selectedAugments = chargenState.augments || {};
    // Biocompatibility reduces essence cost by 10%
    const biocompMultiplier = hasBiocompatibility ? 0.9 : 1.0;
    const essenceCost = Object.entries(selectedAugments).reduce(
      (
        total,
        [augmentId, augmentData]: [string, AugmentSelection | undefined],
      ) => {
        if (!augmentData) return total;
        const baseCost =
          chargenConstData?.augment_catalog?.[augmentId]?.essence_cost || 0;
        const grade = augmentData.grade || 'standard';
        const gradeData = AUGMENT_GRADES[grade];
        const gradeMultiplier = gradeData?.essenceMultiplier || 1.0;
        return total + baseCost * gradeMultiplier * biocompMultiplier;
      },
      0,
    );
    const essenceRemaining = essenceBase - essenceCost;

    // Calculate nuyen spent on augments (including cyberlimb upgrades)
    const cyberlimbUpgradeCost =
      chargenConstData?.cyberlimb_upgrade_cost || 5000;
    const augmentNuyenSpent = Object.entries(selectedAugments).reduce(
      (
        total,
        [augmentId, augmentData]: [string, AugmentSelection | undefined],
      ) => {
        if (!augmentData) return total;
        const baseCost =
          chargenConstData?.augment_catalog?.[augmentId]?.nuyen_cost || 0;
        const grade = augmentData.grade || 'standard';
        const gradeData = AUGMENT_GRADES[grade];
        const costMultiplier = gradeData?.costMultiplier || 1.0;
        let cost = baseCost * costMultiplier;

        // Add cyberlimb upgrade costs
        const isCyberlimb =
          chargenConstData?.augment_catalog?.[augmentId]?.is_cyberlimb || false;
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
    const nuyenRemaining = resourcesAmount - nuyenSpent;

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
      nuyenRemaining,
      nuyenSpent,
      nuyenTotal: resourcesAmount,
      augmentNuyenSpent,
      gearNuyenSpent,
      lifestyleCost,
      lifestyle: selectedLifestyle,
      magicRating,
      metatypeLetter,
      priorities,
      effectiveAttributesMeta,
      essenceRemaining,
      essenceTotal: essenceBase,
      hasBiocompatibility,
    };
  }, [chargenState, chargenConstData, hasBiocompatibility]);
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
    const awakening = chargenState.awakening || 'mundane';
    const magicLetter = chargenState.priorities?.['magic'] || 'E';
    const isAwakened = awakening !== 'mundane' && magicLetter !== 'E';

    if (isAwakened) {
      // Check tradition selected for mages/adepts
      if (
        (awakening === 'mage' || awakening === 'mystic_adept') &&
        !chargenState.tradition
      ) {
        issues.push({
          message: 'No magical tradition selected',
          severity: 'warning',
          section: 'magic',
        });
      }

      // Check spells for mages
      const selectedSpells = chargenState.selected_spells || [];
      if (
        (awakening === 'mage' || awakening === 'mystic_adept') &&
        selectedSpells.length === 0
      ) {
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
