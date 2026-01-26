/**
 * Shadowrun Character Generation Constants
 *
 * Shared constants used across calculation and UI modules.
 * Extracted to avoid circular dependencies with React components.
 */

// ============================================================================
// Augment Grade Definitions
// ============================================================================

export type AugmentGradeData = {
  color: string;
  costMultiplier: number;
  description: string;
  essenceMultiplier: number;
  name: string;
};

/**
 * Augment grade definitions - affects essence cost multiplier, nuyen cost, and availability.
 *
 * Per SR5 rules:
 * - Used: 125% essence, 75% cost
 * - Standard: 100% essence, 100% cost
 * - Alphaware: 80% essence, 200% cost
 * - Betaware: 60% essence, 400% cost
 * - Deltaware: 50% essence, 1000% cost
 */
export const AUGMENT_GRADES: Record<string, AugmentGradeData> = {
  used: {
    name: 'Used',
    essenceMultiplier: 1.25,
    costMultiplier: 0.75,
    description: 'Second-hand cyberware. Higher essence cost, lower price.',
    color: '#888',
  },
  standard: {
    name: 'Standard',
    essenceMultiplier: 1.0,
    costMultiplier: 1.0,
    description: 'Factory-new augmentation at base stats.',
    color: '#9b8fc7',
  },
  alphaware: {
    name: 'Alphaware',
    essenceMultiplier: 0.8,
    costMultiplier: 2.0,
    description: 'Higher quality, 20% less essence cost.',
    color: '#4fc3f7',
  },
  betaware: {
    name: 'Betaware',
    essenceMultiplier: 0.6,
    costMultiplier: 4.0,
    description: 'Premium grade, 40% less essence cost.',
    color: '#81c784',
  },
  deltaware: {
    name: 'Deltaware',
    essenceMultiplier: 0.5,
    costMultiplier: 10.0,
    description: 'Top-tier quality, 50% less essence cost. Very rare.',
    color: '#ffb74d',
  },
};

// ============================================================================
// Lifestyle Tiers
// ============================================================================

export const LIFESTYLE_TIERS = [
  'street',
  'squatter',
  'low',
  'middle',
  'high',
  'luxury',
] as const;

export type LifestyleTier = (typeof LIFESTYLE_TIERS)[number];

// ============================================================================
// Priority Constants
// ============================================================================

export const PRIORITY_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
export type PriorityLetter = (typeof PRIORITY_LETTERS)[number];

export const PRIORITY_CATEGORIES = [
  'metatype',
  'attributes',
  'magic',
  'skills',
  'resources',
] as const;
export type PriorityCategory = (typeof PRIORITY_CATEGORIES)[number];

/**
 * Strict priority selection type - ensures all categories have a valid letter.
 * Use this when you need a fully complete priority selection.
 */
export type PrioritySelection = {
  [K in PriorityCategory]: PriorityLetter;
};

/**
 * Partial priority selection - allows incomplete assignments during editing.
 * Use this for in-progress state where not all categories are assigned yet.
 */
export type PartialPrioritySelection = Partial<PrioritySelection>;

/**
 * Type guard to check if priorities are complete (all 5 categories assigned)
 */
export function isPrioritySelectionComplete(
  priorities: PartialPrioritySelection,
): priorities is PrioritySelection {
  return PRIORITY_CATEGORIES.every(
    (cat) =>
      priorities[cat] !== undefined &&
      PRIORITY_LETTERS.includes(priorities[cat] as PriorityLetter),
  );
}

/**
 * Convert a loose Record<string, string> to PartialPrioritySelection
 * Filters out invalid categories and letters
 */
export function toPrioritySelection(
  priorities: Record<string, string>,
): PartialPrioritySelection {
  const result: PartialPrioritySelection = {};
  for (const cat of PRIORITY_CATEGORIES) {
    const letter = priorities[cat];
    if (letter && PRIORITY_LETTERS.includes(letter as PriorityLetter)) {
      result[cat] = letter as PriorityLetter;
    }
  }
  return result;
}

// ============================================================================
// Awakening Types
// ============================================================================

export const AWAKENING_TYPES = [
  'mundane',
  'mage',
  'adept',
  'mystic_adept',
  'technomancer',
] as const;

export type AwakeningType = (typeof AWAKENING_TYPES)[number];

// Awakening type constants for direct use
export const AWAKENING = {
  MUNDANE: 'mundane' as const,
  MAGE: 'mage' as const,
  ADEPT: 'adept' as const,
  MYSTIC_ADEPT: 'mystic_adept' as const,
  TECHNOMANCER: 'technomancer' as const,
};

// Awakening display names for UI
export const AWAKENING_DISPLAY_NAMES: Record<AwakeningType, string> = {
  mundane: 'Mundane',
  mage: 'Mage',
  adept: 'Adept',
  mystic_adept: 'Mystic Adept',
  technomancer: 'Technomancer',
};

// Helper functions for awakening checks
export const isAwakened = (awakening: AwakeningType | string): boolean =>
  awakening !== AWAKENING.MUNDANE;

export const isMagicUser = (awakening: AwakeningType | string): boolean =>
  awakening === AWAKENING.MAGE || awakening === AWAKENING.MYSTIC_ADEPT;

export const isAdeptUser = (awakening: AwakeningType | string): boolean =>
  awakening === AWAKENING.ADEPT || awakening === AWAKENING.MYSTIC_ADEPT;

export const isTechnomancer = (awakening: AwakeningType | string): boolean =>
  awakening === AWAKENING.TECHNOMANCER;

// ============================================================================
// Character Generation Limits
// ============================================================================

/** Base essence for all characters */
export const BASE_ESSENCE = 6.0;

/** Default lifestyle cost if not specified */
export const DEFAULT_LIFESTYLE_COST = 2000;

/** Default cyberlimb upgrade cost per +1 to AGI or STR */
export const DEFAULT_CYBERLIMB_UPGRADE_COST = 5000;

/** Base AGI/STR for cyberlimbs before upgrades */
export const CYBERLIMB_BASE_STATS = 3;

/** Maximum upgrade amount per stat for cyberlimbs */
export const CYBERLIMB_MAX_UPGRADE = 3;
