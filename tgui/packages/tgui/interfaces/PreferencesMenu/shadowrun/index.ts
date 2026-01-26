/**
 * Shadowrun Character Generation Components
 *
 * This module exports all the components used for SR5 character generation.
 */

// Types
export * from './types';

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
export { AUGMENT_GRADES, AugmentsSection } from './AugmentsSection';
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
