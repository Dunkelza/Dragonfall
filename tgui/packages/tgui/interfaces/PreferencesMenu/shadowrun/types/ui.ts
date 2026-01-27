/**
 * @fileoverview UI Types - Types used exclusively in the client-side UI
 *
 * These types represent:
 * - Calculated/derived data for display (DashboardData, DerivedStats)
 * - Validation results (client-side validation)
 * - Component props
 * - Branded ID types for type safety
 *
 * These types are NOT sent to the server - they're computed client-side.
 *
 * @module types/ui
 * @see {@link ./api.ts} for server data types
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
 *
 * The __brand property exists only at compile time and has no runtime cost.
 * This pattern prevents accidentally using the wrong ID type.
 *
 * @example
 * ```typescript
 * // This will cause a compile error:
 * const spellId: SpellId = 'fireball';
 * const augmentId: AugmentId = spellId; // Error: Type 'SpellId' is not assignable to type 'AugmentId'
 *
 * // Use asBrandedId at API boundaries:
 * const spellId = asBrandedId<SpellId>(serverData.spellId);
 * ```
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

/**
 * Unique identifier for a spell.
 * @see {@link ../types/api.ts#SpellMeta}
 */
export type SpellId = Brand<string, 'SpellId'>;

/**
 * Unique identifier for an adept power.
 * @see {@link ../types/api.ts#AdeptPowerMeta}
 */
export type AdeptPowerId = Brand<string, 'AdeptPowerId'>;

/**
 * Unique identifier for a complex form.
 * @see {@link ../types/api.ts#ComplexFormMeta}
 */
export type ComplexFormId = Brand<string, 'ComplexFormId'>;

/**
 * Unique identifier for an augment (cyberware/bioware).
 * @see {@link ../types/api.ts#AugmentMeta}
 */
export type AugmentId = Brand<string, 'AugmentId'>;

/**
 * Unique identifier for a skill.
 * @see {@link ../types/api.ts#SkillMeta}
 */
export type SkillId = Brand<string, 'SkillId'>;

/**
 * Unique identifier for a skill group.
 * @see {@link ../types/api.ts#SkillGroupMeta}
 */
export type SkillGroupId = Brand<string, 'SkillGroupId'>;

/**
 * Unique identifier for an attribute.
 * @see {@link ../types/api.ts#AttributeMeta}
 */
export type AttributeId = Brand<string, 'AttributeId'>;

/**
 * Unique identifier for a knowledge skill.
 * @see {@link ../types/api.ts#KnowledgeSkillMeta}
 */
export type KnowledgeSkillId = Brand<string, 'KnowledgeSkillId'>;

/**
 * Unique identifier for a language.
 * @see {@link ../types/api.ts#LanguageMeta}
 */
export type LanguageId = Brand<string, 'LanguageId'>;

/**
 * Unique identifier for a gear item.
 * @see {@link ../types/api.ts#GearItemMeta}
 */
export type GearId = Brand<string, 'GearId'>;

/**
 * Unique identifier for a drone.
 * @see {@link ../types/api.ts#DroneMeta}
 */
export type DroneId = Brand<string, 'DroneId'>;

/**
 * Unique identifier for a drone mod.
 * @see {@link ../types/api.ts#DroneModMeta}
 */
export type DroneModId = Brand<string, 'DroneModId'>;

/**
 * Unique identifier for a metatype/species.
 * @see {@link ../types/api.ts#MetatypeChoiceMeta}
 */
export type MetatypeId = Brand<string, 'MetatypeId'>;

/**
 * Unique identifier for a tradition.
 * @see {@link ../types/api.ts#TraditionMeta}
 */
export type TraditionId = Brand<string, 'TraditionId'>;

/**
 * Unique identifier for a mentor spirit.
 * @see {@link ../types/api.ts#MentorSpiritMeta}
 */
export type MentorSpiritId = Brand<string, 'MentorSpiritId'>;

/**
 * Unique identifier for a contact type.
 * @see {@link ../types/api.ts#ContactTypeMeta}
 */
export type ContactTypeId = Brand<string, 'ContactTypeId'>;

/**
 * Unique identifier for a lifestyle tier.
 * @see {@link ../types/api.ts#LifestyleMeta}
 */
export type LifestyleId = Brand<string, 'LifestyleId'>;

/**
 * Helper to cast a string to a branded type.
 *
 * Use sparingly - only at API boundaries where you receive string IDs from
 * the server or external sources.
 *
 * @typeParam T - The branded type to cast to
 * @param id - The string ID to brand
 * @returns The branded ID
 *
 * @example
 * ```typescript
 * // At API boundary when receiving data from server:
 * const spellId = asBrandedId<SpellId>('spell_fireball');
 * const augmentId = asBrandedId<AugmentId>('cyberarm_obvious');
 *
 * // Now TypeScript will catch mistakes:
 * lookupSpell(augmentId); // Error: Argument of type 'AugmentId' is not assignable to 'SpellId'
 * ```
 */
export function asBrandedId<T extends Brand<string, unknown>>(id: string): T {
  return id as T;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Common props passed to most chargen components.
 *
 * This standardized interface ensures consistent behavior across all
 * character generation UI panels.
 *
 * @example
 * ```typescript
 * const SkillsPanel = (props: ChargenComponentProps) => {
 *   const { chargenState, chargenConstData, act, isSaved } = props;
 *
 *   const handleSkillChange = (skillId: string, newRating: number) => {
 *     if (isSaved) return; // Prevent edits when saved
 *     act('update_skill', { skill_id: skillId, rating: newRating });
 *   };
 *
 *   return <div>...</div>;
 * };
 * ```
 */
export type ChargenComponentProps = {
  /** Action dispatcher for server communication. */
  act: (action: string, payload?: Record<string, unknown>) => void;
  /** Static catalog data from server (spells, augments, metatypes, etc.). */
  chargenConstData: ChargenConstData | null;
  /** Current character state (may be stale during optimistic updates). */
  chargenState: ChargenState | null;
  /** Unique identifier for this feature/preference. */
  featureId: string;
  /** Whether the character is saved/locked (disables editing). */
  isSaved: boolean;
  /** Optimistic update function for immediate UI feedback. */
  setPredictedValue: (value: ChargenState) => void;
  /** Current character state (alias for chargenState in some contexts). */
  value: ChargenState | null;
};

/**
 * Extended props for components that support embedded mode.
 *
 * Embedded mode renders the component as a section within another page
 * rather than as a full-page panel.
 */
export type EmbeddableChargenProps = ChargenComponentProps & {
  /** When true, renders in compact/embedded mode. */
  embedded?: boolean;
};

// ============================================================================
// CALCULATED/DERIVED DATA
// ============================================================================

/**
 * Dashboard data calculated from character state.
 *
 * This aggregated data is computed client-side from `ChargenState` and
 * `ChargenConstData`, providing summary statistics for the dashboard display.
 *
 * @remarks
 * All fields are computed values - do not try to persist these.
 * Recalculate whenever the source state changes.
 *
 * @example
 * ```typescript
 * const dashboard = calculateDashboardData(chargenState, chargenConstData);
 * console.log(`Nuyen: ${dashboard.nuyenSpent} / ${dashboard.nuyenTotal}`);
 * console.log(`Essence: ${dashboard.essenceRemaining.toFixed(2)}`);
 * ```
 */
export interface DashboardData {
  /** Remaining attribute points to spend. */
  attrRemaining: number;
  /** Total attribute points spent. */
  attrSpent: number;
  /** Total attribute points available from priority. */
  attrTotal: number;
  /** Nuyen spent on augments (cyberware/bioware). */
  augmentNuyenSpent: number;
  /** Nuyen spent on drones and mods. */
  droneNuyenSpent: number;
  /** Attribute metadata with metatype/augment adjustments applied. */
  effectiveAttributesMeta: AttributeMeta[];
  /** Remaining Essence after augments. */
  essenceRemaining: number;
  /** Total Essence spent on augments. */
  essenceSpent: number;
  /** Base Essence (typically 6.0). */
  essenceTotal: number;
  /** Nuyen spent on gear and equipment. */
  gearNuyenSpent: number;
  /** Whether character has Biocompatibility quality. */
  hasBiocompatibility: boolean;
  /** Current lifestyle tier name. */
  lifestyle: string;
  /** Monthly lifestyle cost in nuyen. */
  lifestyleCost: number;
  /** Magic or Resonance rating (0 for mundanes). */
  magicRating: number;
  /** Metatype priority letter selected. */
  metatypeLetter: string;
  /** Remaining nuyen to spend. */
  nuyenRemaining: number;
  /** Total nuyen spent across all categories. */
  nuyenSpent: number;
  /** Total nuyen available from priority. */
  nuyenTotal: number;
  /** Current priority selections. */
  priorities: PartialPrioritySelection;
  /** Resources priority rating (nuyen amount). */
  resources: number;
  /** Remaining skill points to spend. */
  skillRemaining: number;
  /** Total skill points spent. */
  skillSpent: number;
  /** Total skill points available from priority. */
  skillTotal: number;
  /** Remaining special attribute points (Edge, Magic, Resonance). */
  specialRemaining: number;
  /** Total special attribute points from metatype. */
  specialTotal: number;
}

/**
 * Derived statistics calculated from base attributes.
 *
 * These secondary stats are computed using SR5 formulas and displayed
 * in the character summary.
 *
 * @remarks
 * Formulas follow SR5 core rules:
 * - Physical Limit: ceil((STR×2 + BOD + REA) / 3)
 * - Mental Limit: ceil((LOG×2 + INT + WIL) / 3)
 * - Social Limit: ceil((CHA×2 + WIL + ESS) / 3)
 * - Physical CM: 8 + ceil(BOD / 2)
 * - Stun CM: 8 + ceil(WIL / 2)
 *
 * @example
 * ```typescript
 * const derived = calculateDerivedStats(attributes);
 * console.log(`Initiative: ${derived.initiative}`);
 * console.log(`Physical Limit: ${derived.physicalLimit}`);
 * ```
 */
export interface DerivedStats {
  /** Composure = WIL + CHA. Used for social resistance. */
  composure: number;
  /** Initiative = REA + INT. Number of initiative dice. */
  initiative: number;
  /** Judge Intentions = INT + CHA. For reading people. */
  judgeIntentions: number;
  /** Lift/Carry = STR + BOD. Encumbrance capacity. */
  liftCarry: number;
  /** Memory = LOG + WIL. For knowledge tests. */
  memory: number;
  /** Mental Limit = ceil((LOG×2 + INT + WIL) / 3). */
  mentalLimit: number;
  /** Physical Condition Monitor = 8 + ceil(BOD / 2). */
  physicalCM: number;
  /** Physical Limit = ceil((STR×2 + BOD + REA) / 3). */
  physicalLimit: number;
  /** Social Limit = ceil((CHA×2 + WIL + ESS) / 3). */
  socialLimit: number;
  /** Stun Condition Monitor = 8 + ceil(WIL / 2). */
  stunCM: number;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation severity levels.
 *
 * @remarks
 * - `'error'` - Prevents saving (e.g., overspent points, missing required selections)
 * - `'warning'` - Allowed but suboptimal (e.g., unspent points, low essence)
 * - `'info'` - Helpful suggestions (e.g., "Consider taking Biocompatibility")
 *
 * @example
 * ```typescript
 * const severity: ValidationSeverity = 'error';
 * const isBlocking = severity === 'error';
 * ```
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Fields that can have validation issues attached.
 *
 * Used for inline validation indicators next to specific inputs.
 * Supports both section-level fields and item-specific fields.
 *
 * @example
 * ```typescript
 * // Section-level
 * const field: ValidationField = 'attributes';
 *
 * // Item-specific using template literal types
 * const attrField: ValidationField = 'attribute_body';
 * const skillField: ValidationField = 'skill_firearms';
 * ```
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
 *
 * Used for "click to fix" functionality in validation messages.
 *
 * @example
 * ```typescript
 * const fix: FixAction = {
 *   type: 'reduce_attribute',
 *   targetId: 'body',
 *   amount: 2,
 *   label: 'Reduce Body by 2',
 * };
 * ```
 */
export interface FixAction {
  /** Amount to adjust (for numeric changes like attribute reduction). */
  amount?: number;
  /** Label for the fix action button. */
  label: string;
  /** Target ID (attribute id, skill id, augment id, etc.). */
  targetId?: string;
  /** Type of action to perform. */
  type:
    | 'reduce_attribute'
    | 'reduce_skill'
    | 'reduce_special'
    | 'remove_augment'
    | 'remove_gear'
    | 'other';
}

/**
 * A single validation issue found during character validation.
 *
 * @example
 * ```typescript
 * const issue: ValidationIssue = {
 *   severity: 'error',
 *   section: 'attributes',
 *   field: 'attribute_body',
 *   message: 'Body exceeds metatype maximum of 6',
 *   suggestion: 'Reduce Body to 6 or lower',
 *   fixAction: {
 *     type: 'reduce_attribute',
 *     targetId: 'body',
 *     amount: 2,
 *     label: 'Set Body to 6',
 *   },
 * };
 * ```
 */
export interface ValidationIssue {
  /** The specific field this issue relates to (for inline indicators). */
  field?: ValidationField;
  /** Optional actionable fix that can be applied automatically. */
  fixAction?: FixAction;
  /** Human-readable message describing the issue. */
  message: string;
  /** Prerequisites that are not met (for prerequisite errors). */
  missingPrereqs?: string[];
  /** Related items that triggered this validation (for cross-section issues). */
  relatedItems?: string[];
  /** The section this issue belongs to (for tab-level display). */
  section: string;
  /** Severity level. */
  severity: ValidationSeverity;
  /** Optional suggestion on how to fix the issue. */
  suggestion?: string;
}

/**
 * Result of validating a character sheet.
 *
 * @remarks
 * Use `canSave` to determine if the Save button should be enabled.
 * Use `isValid` to determine if the character is fully optimized.
 * Use `issuesBySection` to show per-tab error indicators.
 * Use `issuesByField` to show inline validation next to inputs.
 *
 * @example
 * ```typescript
 * const result = validateCharacter(state, constData);
 *
 * if (!result.canSave) {
 *   console.log(`Cannot save: ${result.errorCount} errors`);
 *   result.issues
 *     .filter(i => i.severity === 'error')
 *     .forEach(i => console.log(`- ${i.section}: ${i.message}`));
 * }
 *
 * // Show tab indicators
 * Object.entries(result.issuesBySection).forEach(([section, issues]) => {
 *   const errorCount = issues.filter(i => i.severity === 'error').length;
 *   if (errorCount > 0) {
 *     setTabBadge(section, errorCount);
 *   }
 * });
 * ```
 */
export interface ValidationResult {
  /** Whether the character can be saved (no error-level issues). */
  canSave: boolean;
  /** Number of error-level issues. */
  errorCount: number;
  /** Number of info-level issues. */
  infoCount: number;
  /** Whether the character is fully valid (no errors or warnings). */
  isValid: boolean;
  /** All validation issues. */
  issues: ValidationIssue[];
  /** Issues grouped by field for inline indicators. */
  issuesByField: Record<string, ValidationIssue[]>;
  /** Issues grouped by section for tab-level display. */
  issuesBySection: Record<string, ValidationIssue[]>;
  /** Number of warning-level issues. */
  warningCount: number;
}
