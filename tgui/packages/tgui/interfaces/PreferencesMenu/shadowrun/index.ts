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
  AWAKENING,
  AWAKENING_DISPLAY_NAMES,
  AWAKENING_TYPES,
  type AwakeningType,
  BASE_ESSENCE,
  CYBERLIMB_BASE_STATS,
  CYBERLIMB_MAX_UPGRADE,
  DEFAULT_CYBERLIMB_UPGRADE_COST,
  DEFAULT_LIFESTYLE_COST,
  isAdeptUser,
  isAwakened,
  isMagicUser,
  isPrioritySelectionComplete,
  isTechnomancer,
  LIFESTYLE_TIERS,
  type LifestyleTier,
  type PartialPrioritySelection,
  PRIORITY_CATEGORIES,
  PRIORITY_LETTERS,
  type PriorityCategory,
  type PriorityLetter,
  type PrioritySelection,
  toPrioritySelection,
} from './constants';

// Pure Calculation Functions (for testing and reuse)
export {
  type AttributeInputs,
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
  type BumpHandlerConfig,
  type BumpResult,
  calculateBumpedValue,
  createBumpHandler,
  type EssenceCalculationData,
  type NuyenCalculationData,
  type PointAllocationData,
  useChargenValidation,
  useCompletionPercent,
  useDashboardData,
  useDerivedStats,
  useEssenceCalculation,
  useNuyenCalculation,
  usePointAllocation,
} from './hooks';

// Local Draft Storage
export {
  type LocalDraftStorageConfig,
  type LocalDraftStorageResult,
  useAutoSaveDraft,
  useLocalDraftStorage,
} from './useLocalDraftStorage';

// Common UI Components
export {
  AnimatedNumber,
  type AnimatedNumberProps,
  AnimatedResource,
  type AnimatedResourceProps,
  BreadcrumbNav,
  type BreadcrumbNavProps,
  type BreadcrumbSegment,
  clamp,
  CollapsibleSection,
  CurrentLocation,
  type CurrentLocationProps,
  DashboardTile,
  FIELD_HINTS,
  FieldValidation,
  type FieldValidationProps,
  getAttributeDescription,
  GroupedTabs,
  type GroupedTabsProps,
  HintedLabel,
  ProgressBar,
  UndoRedoControls,
  type UndoRedoControlsProps,
  ValidationBadge,
  ValidationSummary,
  type ValidationSummaryProps,
} from './components';

// Selectors
export { AttributeSelector } from './AttributeSelector';
export { AugmentsSection } from './AugmentsSection';
export { CareerSection, type CareerSectionProps } from './CareerSection';
export { ContactsSelector } from './ContactsSelector';
export { CoreTabContent, type CoreTabContentProps } from './CoreTabContent';
export { DroneSection } from './DroneSection';
export { EdgeAllocator } from './EdgeAllocator';
export { GearSection } from './GearSection';
export { KnowledgeSkillsSelector } from './KnowledgeSkillsSelector';
export { MagicRatingAllocator } from './MagicRatingAllocator';
export { MagicSelector } from './MagicSelector';
export {
  MetatypeSelector,
  type MetatypeSelectorProps,
} from './MetatypeSelector';
export {
  CHARACTER_PRESETS,
  type CharacterPreset,
  getPresetById,
  getPresetsByCategory,
  presetToChargenState,
} from './presets';
export { PresetSelector } from './PresetSelector';
export { PrioritySelector } from './PrioritySelector';
export { getSectionTab, SaveResetBar } from './SaveResetBar';
export { SkillsSection } from './SkillsSection';
export { SpecialSelector } from './SpecialSelector';

// Tab Navigation
export {
  getTabGroup,
  ShadowrunTab,
  TAB_COLORS,
  TAB_DISPLAY_INFO,
  TAB_GROUPS,
  TabContentRouter,
  type TabDisplayInfo,
  type TabGroupDefinition,
  type TabGroupId,
} from './TabContentRouter';

// Context Providers
export {
  type ChargenActions,
  type ChargenContextValue,
  ChargenProvider,
  type ChargenProviderProps,
  type UndoRedoState,
  useChargen,
  useChargenActions,
  useChargenState,
} from './ChargenContext';
export {
  type ConstDataContextValue,
  ConstDataProvider,
  type ConstDataProviderProps,
  useAugmentCatalog,
  useConstData,
  useDroneCatalog,
  useGearCatalog,
  useMagicData,
  usePriorityTables,
  useSkillData,
} from './ConstDataContext';

// Update Queue (batching)
export {
  type UpdateQueueConfig,
  type UpdateQueueResult,
  useAttributeUpdateQueue,
  useOptimisticUpdateQueue,
  useSkillUpdateQueue,
} from './useUpdateQueue';

// Undo/Redo
export {
  type HistoryEntry,
  type UndoRedoState as UndoRedoHookState,
  type UndoRedoOptions,
  useChargenUndoRedo,
  useUndoRedo,
} from './useUndoRedo';

// Persistence (centralized save/load/sync)
export {
  type ChargenPersistenceConfig,
  type ChargenPersistenceResult,
  createFieldUpdater,
  DEFAULT_CHARGEN_STATE,
  type PersistenceOptions,
  type SyncStatus,
  useChargenPersistence,
  useChargenPersistenceFromContext,
} from './useChargenPersistence';

// Generic Selection Components
export {
  CatalogActionButtons,
  type CatalogActionButtonsProps,
  type CatalogCategory,
  CatalogItemCard,
  type CatalogItemCardProps,
  type CatalogItemRenderProps,
  ResourceDisplay,
  type ResourceDisplayProps,
  SelectionCatalog,
  type SelectionCatalogProps,
  useSelectionCatalog,
} from './SelectionCatalog';

// Compound Components
export {
  Skills,
  SkillsGroups,
  SkillsList,
  type SkillsListProps,
  SkillsPoints,
  SkillsProvider,
  type SkillsProviderProps,
  SkillsSectionCompound,
  useSkills,
} from './SkillsCompound';

// Deferred Computation (performance optimization)
export {
  ComputationCacheProvider,
  TabContext,
  type TabContextValue,
  useCachedComputation,
  useComputationCache,
  useDeferredComputation,
  useDeferredComputationWithDefault,
  useTabContext,
  useTabVisitState,
} from './useDeferredComputation';

// Skeleton Loaders (loading placeholders for lazy-loaded tabs)
export {
  AugmentsSkeleton,
  ConnectionsSkeleton,
  CoreSkeleton,
  DronesSkeleton,
  GearSkeleton,
  GenericTabSkeleton,
  MagicSkeleton,
  SkeletonBox,
  SkeletonCard,
  SkeletonLine,
  SkeletonSectionHeader,
  SkillsSkeleton,
  SkeletonStatBar,
  SkeletonTabs,
} from './SkeletonLoaders';
