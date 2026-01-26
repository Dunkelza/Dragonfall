/**
 * Shadowrun Character Generation Pure Calculation Functions
 *
 * These functions contain the core calculation logic extracted from hooks
 * for testability. They are pure functions with no React dependencies.
 */

import { AUGMENT_GRADES } from './constants';
import {
  AttributeMeta,
  AugmentSelection,
  ChargenState,
  DashboardData,
  DroneSelection,
  GearSelection,
  LifestyleMeta,
  ValidationIssue,
  ValidationResult,
} from './types';

// ============================================================================
// Types
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

export type AttributeInputs = {
  agility: number;
  body: number;
  charisma: number;
  essence?: number;
  intuition: number;
  logic: number;
  reaction: number;
  strength: number;
  willpower: number;
};

// ============================================================================
// Derived Stats Calculations
// ============================================================================

/**
 * Calculate SR5 Physical Limit
 * Formula: ceil((STR*2 + BOD + REA) / 3)
 */
export function calculatePhysicalLimit(
  strength: number,
  body: number,
  reaction: number,
): number {
  return Math.ceil((strength * 2 + body + reaction) / 3);
}

/**
 * Calculate SR5 Mental Limit
 * Formula: ceil((LOG*2 + INT + WIL) / 3)
 */
export function calculateMentalLimit(
  logic: number,
  intuition: number,
  willpower: number,
): number {
  return Math.ceil((logic * 2 + intuition + willpower) / 3);
}

/**
 * Calculate SR5 Social Limit
 * Formula: ceil((CHA*2 + WIL + ESS) / 3)
 */
export function calculateSocialLimit(
  charisma: number,
  willpower: number,
  essence: number,
): number {
  return Math.ceil((charisma * 2 + willpower + Math.floor(essence)) / 3);
}

/**
 * Calculate SR5 Physical Condition Monitor boxes
 * Formula: 8 + ceil(BOD / 2)
 */
export function calculatePhysicalCM(body: number): number {
  return 8 + Math.ceil(body / 2);
}

/**
 * Calculate SR5 Stun Condition Monitor boxes
 * Formula: 8 + ceil(WIL / 2)
 */
export function calculateStunCM(willpower: number): number {
  return 8 + Math.ceil(willpower / 2);
}

/**
 * Calculate all derived stats from attribute inputs
 */
export function calculateDerivedStats(attrs: AttributeInputs): DerivedStats {
  const essence = attrs.essence ?? 6;

  return {
    composure: attrs.charisma + attrs.willpower,
    judgeIntentions: attrs.charisma + attrs.intuition,
    memory: attrs.logic + attrs.willpower,
    liftCarry: attrs.strength + attrs.body,
    initiative: attrs.reaction + attrs.intuition,
    physicalLimit: calculatePhysicalLimit(
      attrs.strength,
      attrs.body,
      attrs.reaction,
    ),
    mentalLimit: calculateMentalLimit(
      attrs.logic,
      attrs.intuition,
      attrs.willpower,
    ),
    socialLimit: calculateSocialLimit(attrs.charisma, attrs.willpower, essence),
    physicalCM: calculatePhysicalCM(attrs.body),
    stunCM: calculateStunCM(attrs.willpower),
  };
}

// ============================================================================
// Point Calculations
// ============================================================================

/**
 * Calculate attribute points spent based on current values and metatype minimums
 */
export function calculateAttributePointsSpent(
  attributes: Record<string, number>,
  attributesMeta: AttributeMeta[],
  metatypeBounds: Record<string, [number, number]>,
): number {
  return attributesMeta.reduce((sum, attr) => {
    const bounds = metatypeBounds[attr.id];
    const min = bounds ? bounds[0] : (attr.min ?? 1);
    const current = attributes[attr.id] ?? min;
    return sum + Math.max(0, current - min);
  }, 0);
}

/**
 * Calculate skill points spent (including specializations)
 */
export function calculateSkillPointsSpent(
  skills: Record<string, number>,
  skillSpecializations: Record<string, string> = {},
): number {
  const ratingsSpent = Object.values(skills).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );
  const specializationCount = Object.keys(skillSpecializations).length;
  return ratingsSpent + specializationCount;
}

/**
 * Calculate special attribute points spent
 */
export function calculateSpecialPointsSpent(
  special: Record<string, number>,
): number {
  return Object.values(special).reduce(
    (sum, v) => sum + Math.max(0, Number(v) || 0),
    0,
  );
}

// ============================================================================
// Essence Calculations
// ============================================================================

/**
 * Calculate essence cost for a single augment with grade modifier
 */
export function calculateAugmentEssenceCost(
  baseEssenceCost: number,
  grade: string,
  hasBiocompatibility: boolean = false,
): number {
  const gradeData = AUGMENT_GRADES[grade];
  const gradeMultiplier = gradeData?.essenceMultiplier || 1.0;
  const biocompMultiplier = hasBiocompatibility ? 0.9 : 1.0;
  return baseEssenceCost * gradeMultiplier * biocompMultiplier;
}

/**
 * Calculate total essence spent on all augments
 */
export function calculateTotalEssenceSpent(
  augments: Record<string, AugmentSelection>,
  augmentCatalog: Record<string, { essence_cost: number }>,
  hasBiocompatibility: boolean = false,
): number {
  return Object.entries(augments).reduce((total, [augmentId, augmentData]) => {
    if (!augmentData) return total;
    const baseCost = augmentCatalog[augmentId]?.essence_cost || 0;
    const grade = augmentData.grade || 'standard';
    return (
      total + calculateAugmentEssenceCost(baseCost, grade, hasBiocompatibility)
    );
  }, 0);
}

// ============================================================================
// Nuyen Calculations
// ============================================================================

/**
 * Calculate nuyen cost for a single augment with grade and cyberlimb upgrades
 */
export function calculateAugmentNuyenCost(
  baseNuyenCost: number,
  grade: string,
  isCyberlimb: boolean,
  agiUpgrade: number = 0,
  strUpgrade: number = 0,
  cyberlimbUpgradeCost: number = 5000,
): number {
  const gradeData = AUGMENT_GRADES[grade];
  const costMultiplier = gradeData?.costMultiplier || 1.0;
  let cost = baseNuyenCost * costMultiplier;

  if (isCyberlimb) {
    cost += (agiUpgrade + strUpgrade) * cyberlimbUpgradeCost;
  }

  return cost;
}

/**
 * Calculate total nuyen spent on augments
 */
export function calculateAugmentNuyenSpent(
  augments: Record<string, AugmentSelection>,
  augmentCatalog: Record<
    string,
    { is_cyberlimb?: boolean; nuyen_cost: number }
  >,
  cyberlimbUpgradeCost: number = 5000,
): number {
  return Object.entries(augments).reduce((total, [augmentId, augmentData]) => {
    if (!augmentData) return total;
    const catalogEntry = augmentCatalog[augmentId];
    if (!catalogEntry) return total;

    const baseCost = catalogEntry.nuyen_cost || 0;
    const grade = augmentData.grade || 'standard';
    const isCyberlimb = catalogEntry.is_cyberlimb || false;
    const agiUpgrade = augmentData.agi_upgrade || 0;
    const strUpgrade = augmentData.str_upgrade || 0;

    return (
      total +
      calculateAugmentNuyenCost(
        baseCost,
        grade,
        isCyberlimb,
        agiUpgrade,
        strUpgrade,
        cyberlimbUpgradeCost,
      )
    );
  }, 0);
}

/**
 * Calculate total nuyen spent on gear
 */
export function calculateGearNuyenSpent(
  gear: GearSelection[],
  gearCatalog: Record<string, { cost: number }>,
): number {
  return gear.reduce((total, gearEntry) => {
    const gearData = gearCatalog[gearEntry.id];
    if (!gearData) return total;
    const quantity = gearEntry.quantity || 1;
    return total + gearData.cost * quantity;
  }, 0);
}

/**
 * Calculate total nuyen spent on drones (including mods)
 */
export function calculateDroneNuyenSpent(
  drones: Record<string, DroneSelection> | string[] | null | undefined,
  droneCatalog: Record<string, { cost: number }>,
  droneModCatalog: Record<string, { cost: number }>,
): number {
  if (!drones) return 0;

  // Handle legacy array format
  if (Array.isArray(drones)) {
    return drones.reduce((total, droneId) => {
      const droneData = droneCatalog[droneId];
      if (!droneData) return total;
      return total + (droneData.cost || 0);
    }, 0);
  }

  // New format: { [droneId]: { mods: string[] } }
  let total = 0;
  for (const droneId of Object.keys(drones)) {
    const droneData = droneCatalog[droneId];
    if (droneData) {
      total += droneData.cost || 0;
    }
    // Add mod costs
    const droneEntry = drones[droneId];
    for (const modId of droneEntry?.mods || []) {
      const modData = droneModCatalog[modId];
      if (modData) {
        total += modData.cost || 0;
      }
    }
  }
  return total;
}

/**
 * Get lifestyle cost from lifestyle list
 */
export function getLifestyleCost(
  lifestyleId: string,
  lifestyles: LifestyleMeta[],
  defaultCost: number = 2000,
): number {
  const lifestyle = lifestyles.find((l) => l.id === lifestyleId);
  return lifestyle?.cost ?? defaultCost;
}

// ============================================================================
// Completion Percentage
// ============================================================================

/**
 * Calculate character completion percentage
 */
export function calculateCompletionPercent(
  attrTotal: number,
  attrRemaining: number,
  skillTotal: number,
  skillRemaining: number,
  specialTotal: number,
  specialRemaining: number,
  isSaved: boolean,
): number {
  let points = 0;

  // Attributes: 33% weight
  if (attrTotal > 0) {
    const spent = attrTotal - attrRemaining;
    points += (spent / attrTotal) * 33;
  }

  // Skills: 33% weight
  if (skillTotal > 0) {
    const spent = skillTotal - skillRemaining;
    points += (spent / skillTotal) * 33;
  }

  // Special: 20% weight
  if (specialTotal > 0) {
    const spent = specialTotal - specialRemaining;
    points += (spent / specialTotal) * 20;
  }

  // Saved bonus: 14%
  if (isSaved) {
    points += 14;
  }

  return Math.min(100, Math.round(points));
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate character sheet and return issues
 */
export function validateChargenState(
  dashboardData: DashboardData | null,
  chargenState: ChargenState | null,
): ValidationResult {
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
    canSave: errorCount === 0,
  };
}
