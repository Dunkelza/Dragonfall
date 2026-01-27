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
  BIRTHPLACE,
  DEFAULT_AWAKENING,
  DEFAULT_BIRTHPLACE,
  DEFAULT_LIFESTYLE,
  DEFAULT_METATYPE,
  DEFAULT_RELIGION,
  DEFAULT_SIN_STATUS,
  isAdeptUser,
  isAwakened,
  isMagicUser,
  isPrioritySelectionComplete,
  isTechnomancer,
  LIFESTYLE,
  LIFESTYLE_TIERS,
  type LifestyleTier,
  type PartialPrioritySelection,
  PRIORITY_CATEGORIES,
  PRIORITY_LETTERS,
  type PriorityCategory,
  type PriorityLetter,
  type PrioritySelection,
  RELIGION,
  SIN_STATUS,
  SIN_STATUS_TYPES,
  type SinStatusType,
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
  formatPortraitUrl,
  getLifestyleCost,
  PORTRAIT_ALLOWED_EXTENSIONS,
  PORTRAIT_MAX_SIZE_BYTES,
  PORTRAIT_REQUIRED_HOST,
  type PortraitValidationResult,
  validateChargenState,
  validatePortraitSize,
  validatePortraitUrl,
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

// Chargen Handlers Hook
export {
  type ActionResult,
  type AddOptions,
  type BumpOptions,
  type ChargenHandlersConfig,
  type ChargenHandlersResult,
  useChargenHandlers,
} from './useChargenHandlers';

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
  BumpControls,
  type BumpControlsProps,
  type BumpFactoryConfig,
  type BumpFactoryResult,
  type BumpHandlerOptions,
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
  useBumpFactory,
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
  PortraitsSection,
  type PortraitsSectionProps,
  type PortraitType,
  PortraitUpload,
  type PortraitUploadProps,
} from './PortraitUpload';
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

// Catalog Helper Components (shared building blocks)
export {
  CategoryDescription,
  type CategoryDescriptionProps,
  type CategoryTabData,
  CategoryTabs,
  type CategoryTabsProps,
  EmptyState,
  type EmptyStateProps,
  ItemBadge,
  type ItemBadgeProps,
  ResourceBar,
  type ResourceBarProps,
  SearchInput,
  type SearchInputProps,
  SectionHeader,
  type SectionHeaderProps,
} from './CatalogHelpers';

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
  SkeletonStatBar,
  SkeletonTabs,
  SkillsSkeleton,
} from './SkeletonLoaders';
