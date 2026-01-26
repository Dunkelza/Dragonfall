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
// Priority Letters
// ============================================================================

export const PRIORITY_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
export type PriorityLetter = (typeof PRIORITY_LETTERS)[number];

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
