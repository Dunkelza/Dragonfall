/**
 * Types Index - Re-exports all types for backwards compatibility
 *
 * This file maintains the existing import structure:
 *   import { ChargenState, DashboardData } from './types';
 *
 * Types are now organized into:
 *   - api.ts: Server data types (ChargenState, ChargenConstData, *Meta types)
 *   - ui.ts: Client-only types (DashboardData, Validation*, DerivedStats)
 *
 * For new code, prefer importing from the specific file:
 *   import { ChargenState } from './types/api';
 *   import { DashboardData } from './types/ui';
 */

// API Types (server data)
export type {
  AdeptPowerMeta,
  AttributeMeta,
  AugmentCategoryMeta,
  AugmentMeta,
  AugmentModCategoryMeta,
  AugmentModMeta,
  AugmentSelection,
  AwakeningChoiceMeta,
  AwakeningType,
  CharacterNotes,
  ChargenConstData,
  ChargenState,
  ComplexFormMeta,
  Contact,
  ContactTypeMeta,
  CyberwareSuiteMeta,
  DroneCategoryMeta,
  DroneMeta,
  DroneModMeta,
  DroneSelection,
  GearCategoryMeta,
  GearItemMeta,
  GearSelection,
  KnowledgeSkillMeta,
  LanguageMeta,
  LifestyleMeta,
  MentorSpiritMeta,
  MetatypeChoiceMeta,
  PriorityTables,
  SkillGroupMeta,
  SkillMeta,
  SpellMeta,
  TraditionMeta,
} from './api';

// UI Types (client-only)
export type {
  AdeptPowerId,
  AttributeId,
  AugmentId,
  ChargenComponentProps,
  ComplexFormId,
  ContactTypeId,
  DashboardData,
  DerivedStats,
  DroneId,
  DroneModId,
  EmbeddableChargenProps,
  FixAction,
  GearId,
  KnowledgeSkillId,
  LanguageId,
  LifestyleId,
  MentorSpiritId,
  MetatypeId,
  SkillGroupId,
  SkillId,
  SpellId,
  TraditionId,
  ValidationField,
  ValidationIssue,
  ValidationResult,
  ValidationSeverity,
} from './ui';

// Re-export the helper function
export { asBrandedId } from './ui';
