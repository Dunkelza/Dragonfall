/**
 * Shadowrun Character Generation Pure Calculation Functions
 *
 * These functions contain the core calculation logic extracted from hooks
 * for testability. They are pure functions with no React dependencies.
 */

import {
  AUGMENT_GRADES,
  AWAKENING,
  isAwakened as checkAwakened,
  isMagicUser,
} from './constants';
import {
  AttributeMeta,
  AugmentSelection,
  ChargenState,
  DashboardData,
  DerivedStats,
  DroneSelection,
  FixAction,
  GearSelection,
  LifestyleMeta,
  ValidationIssue,
  ValidationResult,
} from './types';

// Re-export DerivedStats for backwards compatibility
export type { DerivedStats } from './types';

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
// Fix Suggestion Helpers
// ============================================================================

/** Result of generating a fix suggestion */
type FixSuggestionResult = {
  action?: FixAction;
  text: string;
};

/** Readable attribute names */
const ATTR_NAMES: Record<string, string> = {
  body: 'Body',
  agility: 'Agility',
  reaction: 'Reaction',
  strength: 'Strength',
  willpower: 'Willpower',
  logic: 'Logic',
  intuition: 'Intuition',
  charisma: 'Charisma',
};

/**
 * Generate actionable fix suggestion for overspent attributes.
 * Finds the highest-rated attribute(s) and suggests reducing them.
 */
function generateAttributeFixSuggestion(
  state: ChargenState,
  overspent: number,
): FixSuggestionResult {
  const attributes = state.attributes || {};

  // Find attributes with ratings above minimum (1)
  const adjustable = Object.entries(attributes)
    .filter(([, rating]) => rating > 1)
    .sort((a, b) => b[1] - a[1]); // Sort by rating descending

  if (adjustable.length === 0) {
    return { text: 'Reduce attribute ratings to free up points.' };
  }

  // Get highest rated attribute(s)
  const [highestId, highestRating] = adjustable[0];
  const highestName = ATTR_NAMES[highestId] || highestId;

  // Calculate how much to reduce
  const maxReduction = highestRating - 1; // Can't go below 1
  const reduction = Math.min(overspent, maxReduction);

  if (reduction >= overspent) {
    // Single attribute reduction can fix it
    return {
      text: `Remove ${overspent} point(s) from ${highestName} (${highestRating} → ${highestRating - overspent}) to fix.`,
      action: {
        label: `Reduce ${highestName} by ${overspent}`,
        type: 'reduce_attribute',
        targetId: highestId,
        amount: overspent,
      },
    };
  }

  // Need to reduce multiple attributes
  const suggestions: string[] = [];
  let remaining = overspent;

  for (const [attrId, rating] of adjustable) {
    if (remaining <= 0) break;
    const attrName = ATTR_NAMES[attrId] || attrId;
    const canReduce = Math.min(remaining, rating - 1);
    if (canReduce > 0) {
      suggestions.push(`${attrName} by ${canReduce}`);
      remaining -= canReduce;
    }
  }

  return {
    text: `Reduce ${suggestions.join(', or ')} to free ${overspent} point(s).`,
    action: {
      label: `Reduce ${highestName} by ${reduction}`,
      type: 'reduce_attribute',
      targetId: highestId,
      amount: reduction,
    },
  };
}

/**
 * Generate actionable fix suggestion for overspent skills.
 * Finds the highest-rated skills and suggests reducing them.
 */
function generateSkillFixSuggestion(
  state: ChargenState,
  overspent: number,
): FixSuggestionResult {
  const skills = state.skills || {};

  // Find skills with ratings above 0
  const adjustable = Object.entries(skills)
    .filter(([, rating]) => rating > 0)
    .sort((a, b) => b[1] - a[1]); // Sort by rating descending

  if (adjustable.length === 0) {
    return { text: 'Reduce skill ratings to free up points.' };
  }

  // Get highest rated skill(s)
  const [highestId, highestRating] = adjustable[0];
  const highestName = formatSkillName(highestId);

  // Calculate how much to reduce
  const reduction = Math.min(overspent, highestRating);

  if (reduction >= overspent) {
    return {
      text: `Remove ${overspent} point(s) from ${highestName} (${highestRating} → ${highestRating - overspent}) to fix.`,
      action: {
        label: `Reduce ${highestName} by ${overspent}`,
        type: 'reduce_skill',
        targetId: highestId,
        amount: overspent,
      },
    };
  }

  // Need to reduce multiple skills
  const suggestions: string[] = [];
  let remaining = overspent;

  for (const [skillId, rating] of adjustable) {
    if (remaining <= 0) break;
    const skillName = formatSkillName(skillId);
    const canReduce = Math.min(remaining, rating);
    if (canReduce > 0) {
      suggestions.push(`${skillName} by ${canReduce}`);
      remaining -= canReduce;
    }
    if (suggestions.length >= 3) break; // Limit suggestions
  }

  return {
    text: `Reduce ${suggestions.join(', or ')} to free ${overspent} point(s).`,
    action: {
      label: `Reduce ${highestName} by ${reduction}`,
      type: 'reduce_skill',
      targetId: highestId,
      amount: reduction,
    },
  };
}

/** Format skill ID to readable name (e.g., "unarmed_combat" -> "Unarmed Combat") */
function formatSkillName(skillId: string): string {
  return skillId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate actionable fix suggestion for overspent special points.
 */
function generateSpecialFixSuggestion(
  state: ChargenState,
  overspent: number,
): FixSuggestionResult {
  const special = state.special || {};

  // Check magic and edge ratings
  const magic = special['magic'] || 0;
  const edge = special['edge'] || 0;
  const resonance = special['resonance'] || 0;

  const suggestions: string[] = [];

  if (magic > 1) {
    const reduction = Math.min(overspent, magic - 1);
    suggestions.push(`Magic by ${reduction}`);
    if (reduction >= overspent) {
      return {
        text: `Remove ${overspent} point(s) from Magic (${magic} → ${magic - overspent}) to fix.`,
        action: {
          label: `Reduce Magic by ${overspent}`,
          type: 'reduce_special',
          targetId: 'magic',
          amount: overspent,
        },
      };
    }
  }

  if (resonance > 1) {
    const reduction = Math.min(overspent, resonance - 1);
    suggestions.push(`Resonance by ${reduction}`);
    if (reduction >= overspent && suggestions.length === 1) {
      return {
        text: `Remove ${overspent} point(s) from Resonance (${resonance} → ${resonance - overspent}) to fix.`,
        action: {
          label: `Reduce Resonance by ${overspent}`,
          type: 'reduce_special',
          targetId: 'resonance',
          amount: overspent,
        },
      };
    }
  }

  if (edge > 1) {
    const reduction = Math.min(overspent, edge - 1);
    suggestions.push(`Edge by ${reduction}`);
  }

  if (suggestions.length === 0) {
    return { text: 'Reduce Magic, Resonance, or Edge to free up points.' };
  }

  return {
    text: `Reduce ${suggestions.join(', or ')} to free ${overspent} point(s).`,
  };
}

/**
 * Generate actionable fix suggestion for essence overspend.
 * Suggests removing or downgrading augments.
 */
function generateEssenceFixSuggestion(
  state: ChargenState,
  overspent: number,
): FixSuggestionResult {
  const augments = state.augments || {};
  const augmentList = Object.entries(augments);

  if (augmentList.length === 0) {
    return { text: 'Remove augments to restore essence.' };
  }

  // Find augments with higher grades (can be downgraded) or recently added
  const suggestions: string[] = [];

  // Count augments by grade
  const gradeCount: Record<string, number> = {};
  for (const [, aug] of augmentList) {
    const grade = aug.grade || 'standard';
    gradeCount[grade] = (gradeCount[grade] || 0) + 1;
  }

  // If using high-grade augments, suggest downgrading
  if (
    gradeCount['deltaware'] ||
    gradeCount['betaware'] ||
    gradeCount['alphaware']
  ) {
    suggestions.push(
      'consider using lower-grade augments (Used grade costs 125% essence but is cheaper)',
    );
  }

  // Suggest removing the most recent/any augment
  const lastAugmentId = augmentList[augmentList.length - 1]?.[0];
  if (lastAugmentId) {
    const augName = formatSkillName(lastAugmentId.replace(/_/g, ' '));
    return {
      text: `Remove ${augName} or downgrade augment grades to restore ${overspent.toFixed(2)} essence.`,
      action: {
        label: `Remove ${augName}`,
        type: 'remove_augment',
        targetId: lastAugmentId,
      },
    };
  }

  return {
    text: `Remove augments to restore ${overspent.toFixed(2)} essence.`,
  };
}

/**
 * Generate actionable fix suggestion for nuyen overspend.
 * Suggests removing gear, drones, or downgrading augments.
 */
function generateNuyenFixSuggestion(
  state: ChargenState,
  overspent: number,
): FixSuggestionResult {
  const gear = state.gear || [];
  const drones = state.drones || {};
  const augments = state.augments || {};

  const suggestions: string[] = [];

  // Check what categories have items
  if (gear.length > 0) {
    suggestions.push('remove gear items');
  }
  if (Object.keys(drones).length > 0) {
    suggestions.push('remove drones');
  }
  if (Object.keys(augments).length > 0) {
    suggestions.push('remove or downgrade augments');
  }

  if (suggestions.length === 0) {
    return { text: `Reduce purchases to free ¥${overspent.toLocaleString()}.` };
  }

  // Suggest removing the most recent gear item if any
  if (gear.length > 0) {
    const lastGear = gear[gear.length - 1];
    const gearName = lastGear.name || formatSkillName(lastGear.id || 'item');
    return {
      text: `Remove ${gearName} or ${suggestions.slice(1).join(', ')} to free ¥${overspent.toLocaleString()}.`,
      action: {
        label: `Remove ${gearName}`,
        type: 'remove_gear',
        targetId: lastGear.id,
      },
    };
  }

  return {
    text: `${suggestions.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' or ')} to free ¥${overspent.toLocaleString()}.`,
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Group issues by a key function for O(1) lookup
 */
function groupIssuesBy(
  issues: ValidationIssue[],
  getKey: (issue: ValidationIssue) => string | undefined,
): Record<string, ValidationIssue[]> {
  const grouped: Record<string, ValidationIssue[]> = {};
  for (const issue of issues) {
    const key = getKey(issue);
    if (key) {
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(issue);
    }
  }
  return grouped;
}

/**
 * Build a ValidationResult from a list of issues
 */
function buildValidationResult(
  issues: ValidationIssue[],
  options: { hasData?: boolean } = {},
): ValidationResult {
  const { hasData = true } = options;
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  return {
    issues,
    errorCount,
    warningCount,
    infoCount,
    // isValid is false if there are any errors/warnings OR if there's no data
    isValid: hasData && errorCount === 0 && warningCount === 0,
    // canSave is false if there are errors OR if there's no data
    canSave: hasData && errorCount === 0,
    issuesBySection: groupIssuesBy(issues, (i) => i.section),
    issuesByField: groupIssuesBy(issues, (i) => i.field),
  };
}

/**
 * Validate character sheet and return issues
 */
export function validateChargenState(
  dashboardData: DashboardData | null,
  chargenState: ChargenState | null,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!dashboardData || !chargenState) {
    return buildValidationResult(issues, { hasData: false });
  }

  // ========================================================================
  // POINT ALLOCATION VALIDATION
  // ========================================================================

  // Attribute points validation
  if (dashboardData.attrRemaining < 0) {
    const overspent = Math.abs(dashboardData.attrRemaining);
    const attrSuggestion = generateAttributeFixSuggestion(
      chargenState,
      overspent,
    );
    issues.push({
      message: `Overspent ${overspent} attribute point(s)`,
      severity: 'error',
      section: 'attributes',
      field: 'attributes',
      suggestion: attrSuggestion.text,
      fixAction: attrSuggestion.action,
    });
  } else if (dashboardData.attrRemaining > 0) {
    issues.push({
      message: `${dashboardData.attrRemaining} attribute point(s) unspent`,
      severity: 'warning',
      section: 'attributes',
      field: 'attributes',
      suggestion: 'Allocate remaining points to attributes before saving.',
    });
  }

  // Skill points validation
  if (dashboardData.skillRemaining < 0) {
    const overspent = Math.abs(dashboardData.skillRemaining);
    const skillSuggestion = generateSkillFixSuggestion(chargenState, overspent);
    issues.push({
      message: `Overspent ${overspent} skill point(s)`,
      severity: 'error',
      section: 'skills',
      field: 'skills',
      suggestion: skillSuggestion.text,
      fixAction: skillSuggestion.action,
    });
  } else if (dashboardData.skillRemaining > 0) {
    issues.push({
      message: `${dashboardData.skillRemaining} skill point(s) unspent`,
      severity: 'warning',
      section: 'skills',
      field: 'skills',
      suggestion: 'Allocate remaining points to skills before saving.',
    });
  }

  // Special points validation
  if (dashboardData.specialRemaining < 0) {
    const overspent = Math.abs(dashboardData.specialRemaining);
    const specialSuggestion = generateSpecialFixSuggestion(
      chargenState,
      overspent,
    );
    issues.push({
      message: `Overspent ${overspent} special point(s)`,
      severity: 'error',
      section: 'special',
      field: 'special',
      suggestion: specialSuggestion.text,
      fixAction: specialSuggestion.action,
    });
  } else if (
    dashboardData.specialRemaining > 0 &&
    dashboardData.specialTotal > 0
  ) {
    issues.push({
      message: `${dashboardData.specialRemaining} special point(s) unspent`,
      severity: 'warning',
      section: 'special',
      field: 'special',
      suggestion: 'Allocate remaining points to Magic or Resonance.',
    });
  }

  // ========================================================================
  // MAGIC/RESONANCE VALIDATION
  // ========================================================================

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
        field: 'magic',
        suggestion: 'Select a tradition to define your magical practice.',
      });
    }

    // Check spells for mages
    const selectedSpells = chargenState.selected_spells || [];
    if (isMagicUser(awakening) && selectedSpells.length === 0) {
      issues.push({
        message: 'No spells selected',
        severity: 'warning',
        section: 'magic',
        field: 'magic',
        suggestion: 'Select spells to use your magical abilities.',
      });
    }
  }

  // ========================================================================
  // RESOURCE VALIDATION (Essence, Nuyen)
  // ========================================================================

  // Essence validation
  if (dashboardData.essenceRemaining < 0) {
    const essenceOverspent = Math.abs(dashboardData.essenceRemaining);
    const essenceSuggestion = generateEssenceFixSuggestion(
      chargenState,
      essenceOverspent,
    );
    issues.push({
      message: `Essence overspent by ${essenceOverspent.toFixed(2)}`,
      severity: 'error',
      section: 'augments',
      field: 'augments',
      suggestion: essenceSuggestion.text,
      fixAction: essenceSuggestion.action,
    });
  }

  // Nuyen validation
  if (dashboardData.nuyenRemaining < 0) {
    const nuyenOverspent = Math.abs(dashboardData.nuyenRemaining);
    const nuyenSuggestion = generateNuyenFixSuggestion(
      chargenState,
      nuyenOverspent,
    );
    issues.push({
      message: `Overspent ¥${nuyenOverspent.toLocaleString()} nuyen`,
      severity: 'error',
      section: 'augments',
      field: 'nuyen',
      suggestion: nuyenSuggestion.text,
      fixAction: nuyenSuggestion.action,
    });
  }

  // ========================================================================
  // CROSS-SECTION VALIDATION
  // ========================================================================

  validateCrossSectionRules(chargenState, dashboardData, issues);

  // ========================================================================
  // INFO-LEVEL SUGGESTIONS
  // ========================================================================

  validateSuggestions(chargenState, dashboardData, issues);

  return buildValidationResult(issues);
}

/**
 * Cross-section validation rules.
 * These check combinations across different parts of the character.
 */
function validateCrossSectionRules(
  state: ChargenState,
  dashboard: DashboardData,
  issues: ValidationIssue[],
): void {
  const selectedAugments = state.augments || {};
  const augmentCount = Object.keys(selectedAugments).length;
  const qualities = state.qualities || [];

  // Check: Has cyberware but no Biocompatibility
  if (augmentCount > 0) {
    const hasBiocompatibility = qualities.some(
      (q) =>
        q.id === 'biocompatibility' ||
        q.id === 'biocompatibility_cyberware' ||
        q.id === 'biocompatibility_bioware',
    );

    // Only suggest if they have significant augments (essence cost > 0.5)
    if (!hasBiocompatibility && dashboard.essenceSpent > 0.5) {
      issues.push({
        message: 'Consider taking Biocompatibility quality',
        severity: 'info',
        section: 'qualities',
        field: 'qualities',
        suggestion:
          'Biocompatibility reduces essence cost of augments by 10%, saving you essence.',
        relatedItems: Object.keys(selectedAugments).slice(0, 3),
      });
    }
  }

  // Check: Has combat skills but no weapon
  const combatSkills = [
    'firearms',
    'automatics',
    'longarms',
    'pistols',
    'blades',
    'clubs',
    'unarmed_combat',
  ];
  const skills = state.skills || {};
  const hasCombatSkill = combatSkills.some(
    (skillId) => (skills[skillId] || 0) >= 1,
  );
  const gear = state.gear || [];
  const hasWeapon = gear.some(
    (g) =>
      g.id?.includes('gun') ||
      g.id?.includes('pistol') ||
      g.id?.includes('rifle') ||
      g.id?.includes('blade') ||
      g.id?.includes('sword') ||
      g.id?.includes('knife'),
  );

  if (hasCombatSkill && !hasWeapon) {
    issues.push({
      message: 'Combat skills but no weapons purchased',
      severity: 'info',
      section: 'gear',
      field: 'gear',
      suggestion:
        "You have combat skills but haven't purchased any weapons yet.",
    });
  }

  // Check: Mage without reagents
  const awakening = state.awakening || AWAKENING.MUNDANE;
  if (isMagicUser(awakening)) {
    const hasReagents = gear.some((g) => g.id?.includes('reagent'));
    if (!hasReagents) {
      issues.push({
        message: 'Consider purchasing reagents',
        severity: 'info',
        section: 'gear',
        field: 'gear',
        suggestion:
          'Reagents are useful for ritual spellcasting and binding spirits.',
      });
    }
  }

  // Check: Decker/Technomancer without commlink
  const hasDeckingSkills =
    (skills['computer'] || 0) >= 1 ||
    (skills['hacking'] || 0) >= 1 ||
    (skills['cybercombat'] || 0) >= 1;
  const hasCommlink = gear.some(
    (g) => g.id?.includes('commlink') || g.id?.includes('deck'),
  );

  if (hasDeckingSkills && !hasCommlink) {
    issues.push({
      message: 'Matrix skills but no commlink or deck',
      severity: 'info',
      section: 'gear',
      field: 'gear',
      suggestion:
        'You have Matrix skills but no commlink or cyberdeck. Consider purchasing one.',
    });
  }
}

/**
 * Generate helpful suggestions based on character build.
 */
function validateSuggestions(
  state: ChargenState,
  dashboard: DashboardData,
  issues: ValidationIssue[],
): void {
  // Suggest specialization for high-rated skills
  const skills = state.skills || {};
  const specializations = state.skill_specializations || {};

  for (const [skillId, rating] of Object.entries(skills)) {
    if ((rating as number) >= 4 && !specializations[skillId]) {
      issues.push({
        message: `Consider specializing in ${skillId}`,
        severity: 'info',
        section: 'skills',
        field: `skill_${skillId}` as const,
        suggestion: `Skills at 4+ benefit from specializations (+2 dice for 1 skill point).`,
      });
      // Only show first suggestion to avoid spam
      break;
    }
  }

  // Suggest contacts if none selected
  const contacts = state.contacts || [];
  if (contacts.length === 0) {
    issues.push({
      message: 'No contacts selected',
      severity: 'info',
      section: 'contacts',
      field: 'contacts',
      suggestion:
        'Contacts provide valuable information and services during runs.',
    });
  }
}
