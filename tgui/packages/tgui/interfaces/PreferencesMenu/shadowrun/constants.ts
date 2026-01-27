/**
 * @fileoverview Shadowrun Character Generation Constants
 *
 * Shared constants used across calculation and UI modules.
 * Extracted to avoid circular dependencies with React components.
 *
 * @module constants
 * @see {@link ./types/api.ts} for server data types
 * @see {@link ./types/ui.ts} for client-only types
 */

// ============================================================================
// Augment Grade Definitions
// ============================================================================

/**
 * Augment grade data structure.
 *
 * Each grade modifies the base essence cost and nuyen cost of augments.
 */
export type AugmentGradeData = {
  /** Display color for UI theming. */
  color: string;
  /** Nuyen cost multiplier (e.g., 2.0 = double price). */
  costMultiplier: number;
  /** Human-readable description. */
  description: string;
  /** Essence cost multiplier (e.g., 0.8 = 20% reduction). */
  essenceMultiplier: number;
  /** Display name. */
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
 *
 * @example
 * ```typescript
 * const grade = AUGMENT_GRADES['alphaware'];
 * const adjustedEssence = baseEssence * grade.essenceMultiplier; // 0.8x
 * const adjustedCost = baseCost * grade.costMultiplier; // 2.0x
 * ```
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

/**
 * Available lifestyle tiers from lowest to highest.
 *
 * @see {@link LifestyleTier} for the union type.
 */
export const LIFESTYLE_TIERS = [
  'street',
  'squatter',
  'low',
  'middle',
  'high',
  'luxury',
] as const;

/**
 * Valid lifestyle tier values.
 *
 * @example
 * ```typescript
 * const tier: LifestyleTier = 'middle';
 * ```
 */
export type LifestyleTier = (typeof LIFESTYLE_TIERS)[number];

/**
 * Lifestyle tier constants for direct use.
 *
 * @example
 * ```typescript
 * const defaultLifestyle = LIFESTYLE.STREET;
 * if (chargenState.lifestyle === LIFESTYLE.LUXURY) {
 *   // Show luxury lifestyle benefits
 * }
 * ```
 */
export const LIFESTYLE = {
  STREET: 'street' as const,
  SQUATTER: 'squatter' as const,
  LOW: 'low' as const,
  MIDDLE: 'middle' as const,
  HIGH: 'high' as const,
  LUXURY: 'luxury' as const,
};

// ============================================================================
// Priority Constants
// ============================================================================

/**
 * Valid priority letters from highest (A) to lowest (E).
 */
export const PRIORITY_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

/**
 * A priority letter (A through E).
 */
export type PriorityLetter = (typeof PRIORITY_LETTERS)[number];

/**
 * The five priority categories that must each have a unique letter.
 */
export const PRIORITY_CATEGORIES = [
  'metatype',
  'attributes',
  'magic',
  'skills',
  'resources',
] as const;

/**
 * A priority category name.
 */
export type PriorityCategory = (typeof PRIORITY_CATEGORIES)[number];

/**
 * Strict priority selection type - ensures all categories have a valid letter.
 *
 * Use this when you need a fully complete priority selection (e.g., for saving).
 *
 * @example
 * ```typescript
 * const priorities: PrioritySelection = {
 *   metatype: 'D',
 *   attributes: 'B',
 *   magic: 'A',
 *   skills: 'C',
 *   resources: 'E',
 * };
 * ```
 */
export type PrioritySelection = {
  [K in PriorityCategory]: PriorityLetter;
};

/**
 * Partial priority selection - allows incomplete assignments during editing.
 *
 * Use this for in-progress state where not all categories are assigned yet.
 *
 * @example
 * ```typescript
 * // During editing, only some categories may be assigned
 * const partial: PartialPrioritySelection = {
 *   metatype: 'D',
 *   magic: 'A',
 *   // attributes, skills, resources not yet selected
 * };
 * ```
 */
export type PartialPrioritySelection = Partial<PrioritySelection>;

/**
 * Type guard to check if priorities are complete (all 5 categories assigned).
 *
 * @param priorities - The partial selection to check
 * @returns True if all 5 categories have valid letters assigned
 *
 * @example
 * ```typescript
 * if (isPrioritySelectionComplete(priorities)) {
 *   // TypeScript now knows priorities is PrioritySelection
 *   savePriorities(priorities);
 * }
 * ```
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
 * Convert a loose Record<string, string> to PartialPrioritySelection.
 *
 * Filters out invalid categories and letters, useful at API boundaries.
 *
 * @param priorities - Raw priority data from server or form
 * @returns Validated partial priority selection
 *
 * @example
 * ```typescript
 * const rawData = { metatype: 'A', invalid: 'X', attributes: 'B' };
 * const selection = toPrioritySelection(rawData);
 * // selection = { metatype: 'A', attributes: 'B' }
 * ```
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

/**
 * Valid awakening type values.
 *
 * @remarks
 * - `'mundane'` - No magical ability (most of humanity)
 * - `'mage'` - Full spellcaster with tradition
 * - `'adept'` - Physical magic channeled through body
 * - `'mystic_adept'` - Hybrid mage/adept (splits magic between spells and powers)
 * - `'technomancer'` - Matrix-native with Resonance instead of Magic
 */
export const AWAKENING_TYPES = [
  'mundane',
  'mage',
  'adept',
  'mystic_adept',
  'technomancer',
] as const;

/**
 * Valid awakening type.
 *
 * @see {@link AWAKENING} for convenient constants.
 * @see {@link AWAKENING_DISPLAY_NAMES} for UI labels.
 */
export type AwakeningType = (typeof AWAKENING_TYPES)[number];

/**
 * Awakening type constants for direct use.
 *
 * @example
 * ```typescript
 * if (chargenState.awakening === AWAKENING.MAGE) {
 *   // Show spell selection
 * }
 * ```
 */
export const AWAKENING = {
  MUNDANE: 'mundane' as const,
  MAGE: 'mage' as const,
  ADEPT: 'adept' as const,
  MYSTIC_ADEPT: 'mystic_adept' as const,
  TECHNOMANCER: 'technomancer' as const,
};

/**
 * Human-readable display names for awakening types.
 */
export const AWAKENING_DISPLAY_NAMES: Record<AwakeningType, string> = {
  mundane: 'Mundane',
  mage: 'Mage',
  adept: 'Adept',
  mystic_adept: 'Mystic Adept',
  technomancer: 'Technomancer',
};

/**
 * Check if the character is awakened (has magical or resonance ability).
 *
 * @param awakening - The awakening type to check
 * @returns True if not mundane
 */
export const isAwakened = (awakening: AwakeningType | string): boolean =>
  awakening !== AWAKENING.MUNDANE;

/**
 * Check if the character can cast spells (mage or mystic adept).
 *
 * @param awakening - The awakening type to check
 * @returns True if mage or mystic adept
 */
export const isMagicUser = (awakening: AwakeningType | string): boolean =>
  awakening === AWAKENING.MAGE || awakening === AWAKENING.MYSTIC_ADEPT;

/**
 * Check if the character can use adept powers (adept or mystic adept).
 *
 * @param awakening - The awakening type to check
 * @returns True if adept or mystic adept
 */
export const isAdeptUser = (awakening: AwakeningType | string): boolean =>
  awakening === AWAKENING.ADEPT || awakening === AWAKENING.MYSTIC_ADEPT;

/**
 * Check if the character is a technomancer (uses Resonance).
 *
 * @param awakening - The awakening type to check
 * @returns True if technomancer
 */
export const isTechnomancer = (awakening: AwakeningType | string): boolean =>
  awakening === AWAKENING.TECHNOMANCER;

// ============================================================================
// Character Generation Limits
// ============================================================================

/**
 * Base essence for all characters.
 *
 * Essence is reduced when installing cyberware/bioware.
 */
export const BASE_ESSENCE = 6.0;

// ============================================================================
// SIN Status Constants
// ============================================================================

/**
 * Valid SIN status values.
 */
export const SIN_STATUS_TYPES = ['legitimate', 'fake', 'criminal'] as const;

/**
 * Valid SIN status type.
 */
export type SinStatusType = (typeof SIN_STATUS_TYPES)[number];

/**
 * SIN status constants for direct use.
 *
 * @example
 * ```typescript
 * if (chargenState.sin_status === SIN_STATUS.CRIMINAL) {
 *   // Show restricted SIN options
 * }
 * ```
 */
export const SIN_STATUS = {
  LEGITIMATE: 'legitimate' as const,
  FAKE: 'fake' as const,
  CRIMINAL: 'criminal' as const,
};

// ============================================================================
// Religion Constants
// ============================================================================

/**
 * Religion constants for direct use.
 *
 * Note: Additional religion values come from server data.
 * These are just the common defaults.
 */
export const RELIGION = {
  NONE: 'none' as const,
};

// ============================================================================
// Birthplace Constants
// ============================================================================

/**
 * Birthplace constants for direct use.
 */
export const BIRTHPLACE = {
  SEATTLE: 'seattle' as const,
};

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default metatype species path (human).
 */
export const DEFAULT_METATYPE = '/datum/species/human';

/**
 * Default lifestyle tier.
 */
export const DEFAULT_LIFESTYLE = LIFESTYLE.STREET;

/**
 * Default SIN status.
 */
export const DEFAULT_SIN_STATUS = SIN_STATUS.LEGITIMATE;

/**
 * Default religion.
 */
export const DEFAULT_RELIGION = RELIGION.NONE;

/**
 * Default birthplace.
 */
export const DEFAULT_BIRTHPLACE = BIRTHPLACE.SEATTLE;

/**
 * Default awakening type.
 */
export const DEFAULT_AWAKENING = AWAKENING.MUNDANE;
