/**
 * UI Types - Types used exclusively in the client-side UI
 *
 * These types represent:
 * - Calculated/derived data for display (DashboardData, DerivedStats)
 * - Validation results (client-side validation)
 * - Component props
 * - Branded ID types for type safety
 *
 * These types are NOT sent to the server - they're computed client-side.
 */

import { PartialPrioritySelection } from '../constants';
import { AttributeMeta, ChargenConstData, ChargenState } from './api';

// ============================================================================
// BRANDED TYPES
// ============================================================================
// These prevent accidental misuse of IDs by making them nominally distinct.
// Example: You can't pass a SpellId where an AugmentId is expected.

/**
 * Brand interface for creating nominal/branded types.
 * The __brand property exists only at compile time.
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

/** Unique identifier for a spell */
export type SpellId = Brand<string, 'SpellId'>;

/** Unique identifier for an adept power */
export type AdeptPowerId = Brand<string, 'AdeptPowerId'>;

/** Unique identifier for a complex form */
export type ComplexFormId = Brand<string, 'ComplexFormId'>;

/** Unique identifier for an augment (cyberware/bioware) */
export type AugmentId = Brand<string, 'AugmentId'>;

/** Unique identifier for a skill */
export type SkillId = Brand<string, 'SkillId'>;

/** Unique identifier for a skill group */
export type SkillGroupId = Brand<string, 'SkillGroupId'>;

/** Unique identifier for an attribute */
export type AttributeId = Brand<string, 'AttributeId'>;

/** Unique identifier for a knowledge skill */
export type KnowledgeSkillId = Brand<string, 'KnowledgeSkillId'>;

/** Unique identifier for a language */
export type LanguageId = Brand<string, 'LanguageId'>;

/** Unique identifier for a gear item */
export type GearId = Brand<string, 'GearId'>;

/** Unique identifier for a drone */
export type DroneId = Brand<string, 'DroneId'>;

/** Unique identifier for a drone mod */
export type DroneModId = Brand<string, 'DroneModId'>;

/** Unique identifier for a metatype/species */
export type MetatypeId = Brand<string, 'MetatypeId'>;

/** Unique identifier for a tradition */
export type TraditionId = Brand<string, 'TraditionId'>;

/** Unique identifier for a mentor spirit */
export type MentorSpiritId = Brand<string, 'MentorSpiritId'>;

/** Unique identifier for a contact type */
export type ContactTypeId = Brand<string, 'ContactTypeId'>;

/** Unique identifier for a lifestyle tier */
export type LifestyleId = Brand<string, 'LifestyleId'>;

/**
 * Helper to cast a string to a branded type.
 * Use sparingly - only at API boundaries where you receive string IDs.
 *
 * @example
 * const spellId = asBrandedId<SpellId>('spell_fireball');
 * const augmentId = asBrandedId<AugmentId>('cyberarm_obvious');
 */
export function asBrandedId<T extends Brand<string, unknown>>(id: string): T {
  return id as T;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/** Common props passed to most chargen components */
export type ChargenComponentProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  value: ChargenState | null;
};

/** Extended props for components that need embedded mode */
export type EmbeddableChargenProps = ChargenComponentProps & {
  embedded?: boolean;
};

// ============================================================================
// CALCULATED/DERIVED DATA
// ============================================================================

/**
 * Dashboard data calculated from chargen state.
 * This is computed client-side and displayed in the UI.
 */
export interface DashboardData {
  attrRemaining: number;
  attrSpent: number;
  attrTotal: number;
  augmentNuyenSpent: number;
  droneNuyenSpent: number;
  effectiveAttributesMeta: AttributeMeta[];
  essenceRemaining: number;
  essenceSpent: number;
  essenceTotal: number;
  gearNuyenSpent: number;
  hasBiocompatibility: boolean;
  lifestyle: string;
  lifestyleCost: number;
  magicRating: number;
  metatypeLetter: string;
  nuyenRemaining: number;
  nuyenSpent: number;
  nuyenTotal: number;
  priorities: PartialPrioritySelection;
  resources: number;
  skillRemaining: number;
  skillSpent: number;
  skillTotal: number;
  specialRemaining: number;
  specialTotal: number;
}

/**
 * Derived statistics calculated from attributes.
 * These are computed client-side for display.
 */
export interface DerivedStats {
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
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation severity levels:
 * - error: Prevents saving (e.g., overspent points)
 * - warning: Allowed but suboptimal (e.g., unspent points)
 * - info: Helpful suggestions (e.g., "Consider taking Biocompatibility")
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Fields that can have validation issues attached.
 * Used for inline validation indicators.
 */
export type ValidationField =
  | 'attributes'
  | 'augments'
  | 'contacts'
  | 'drones'
  | 'gear'
  | 'knowledge'
  | 'magic'
  | 'metatype'
  | 'nuyen'
  | 'priorities'
  | 'qualities'
  | 'skills'
  | 'special'
  | `attribute_${string}` // e.g., attribute_body, attribute_strength
  | `augment_${string}` // e.g., augment_datajack
  | `quality_${string}` // e.g., quality_biocompatibility
  | `skill_${string}`; // e.g., skill_firearms

/**
 * An actionable fix suggestion that can be applied automatically.
 * Used for "click to fix" functionality.
 */
export interface FixAction {
  /** Amount to adjust (for numeric changes) */
  amount?: number;
  /** Label for the fix action button */
  label: string;
  /** Target ID (attribute id, skill id, augment id, etc.) */
  targetId?: string;
  /** Type of action to perform */
  type:
    | 'reduce_attribute'
    | 'reduce_skill'
    | 'reduce_special'
    | 'remove_augment'
    | 'remove_gear'
    | 'other';
}

/**
 * A single validation issue.
 */
export interface ValidationIssue {
  /** The specific field this issue relates to (for inline indicators) */
  field?: ValidationField;
  /** Optional actionable fix that can be applied */
  fixAction?: FixAction;
  /** Human-readable message describing the issue */
  message: string;
  /** Prerequisites that are not met (for prerequisite errors) */
  missingPrereqs?: string[];
  /** Related items that triggered this validation (for cross-section) */
  relatedItems?: string[];
  /** The section this issue belongs to (for tab-level display) */
  section: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Optional suggestion on how to fix the issue */
  suggestion?: string;
}

/**
 * Result of validating a character sheet.
 */
export interface ValidationResult {
  /** Whether the character can be saved (no errors) */
  canSave: boolean;
  /** Number of error-level issues */
  errorCount: number;
  /** Number of info-level issues */
  infoCount: number;
  /** Whether the character is fully valid (no errors or warnings) */
  isValid: boolean;
  /** All validation issues */
  issues: ValidationIssue[];
  /** Issues grouped by field for inline indicators */
  issuesByField: Record<string, ValidationIssue[]>;
  /** Issues grouped by section for tab-level display */
  issuesBySection: Record<string, ValidationIssue[]>;
  /** Number of warning-level issues */
  warningCount: number;
}
