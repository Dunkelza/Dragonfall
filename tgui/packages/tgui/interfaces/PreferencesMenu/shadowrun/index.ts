/**
 * Shadowrun Character Generation Components
 *
 * This module exports all the components used for SR5 character generation.
 */

// Types
export * from './types';

// Constants (pure data, no React dependencies)
export {
  AUGMENT_GRADES,
  type AugmentGradeData,
  AWAKENING_TYPES,
  type AwakeningType,
  BASE_ESSENCE,
  CYBERLIMB_BASE_STATS,
  CYBERLIMB_MAX_UPGRADE,
  DEFAULT_CYBERLIMB_UPGRADE_COST,
  DEFAULT_LIFESTYLE_COST,
  LIFESTYLE_TIERS,
  type LifestyleTier,
  PRIORITY_LETTERS,
  type PriorityLetter,
} from './constants';

// Pure Calculation Functions (for testing and reuse)
export {
  type AttributeInputs,
  type DerivedStats as DerivedStatsCalc,
  calculateAttributePointsSpent,
  calculateAugmentEssenceCost,
  calculateAugmentNuyenCost,
  calculateAugmentNuyenSpent,
  calculateCompletionPercent,
  calculateDerivedStats,
  calculateDroneNuyenSpent,
  calculateGearNuyenSpent,
  calculateMentalLimit,
  calculatePhysicalCM,
  calculatePhysicalLimit,
  calculateSkillPointsSpent,
  calculateSocialLimit,
  calculateSpecialPointsSpent,
  calculateStunCM,
  calculateTotalEssenceSpent,
  getLifestyleCost,
  validateChargenState,
} from './calculations';

// Custom Hooks
export {
  type DerivedStats,
  useChargenValidation,
  useCompletionPercent,
  useDashboardData,
  useDerivedStats,
} from './hooks';

// Common UI Components
export {
  clamp,
  CollapsibleSection,
  DashboardTile,
  FIELD_HINTS,
  getAttributeDescription,
  HintedLabel,
  ProgressBar,
  ValidationBadge,
} from './components';

// Selectors
export { AttributeSelector } from './AttributeSelector';
export { AugmentsSection } from './AugmentsSection';
export { ContactsSelector } from './ContactsSelector';
export { CoreTabContent, type CoreTabContentProps } from './CoreTabContent';
export { DroneSection } from './DroneSection';
export { GearSection } from './GearSection';
export { KnowledgeSkillsSelector } from './KnowledgeSkillsSelector';
export { MagicSelector } from './MagicSelector';
export {
  MetatypeSelector,
  type MetatypeSelectorProps,
} from './MetatypeSelector';
export { PrioritySelector } from './PrioritySelector';
export { SaveResetBar } from './SaveResetBar';
export { SkillsSection } from './SkillsSection';
export { SpecialSelector } from './SpecialSelector';
export { ShadowrunTab, TabContentRouter } from './TabContentRouter';
