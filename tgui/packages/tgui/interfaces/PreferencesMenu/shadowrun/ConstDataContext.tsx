/**
 * ConstData Context - Provides server constant data via React Context
 *
 * This eliminates prop drilling by caching chargen constant data (catalogs,
 * priority tables, etc.) and making it available to any component in the tree.
 *
 * The constant data is loaded once from the server and doesn't change during
 * a session, so it's ideal for context caching.
 *
 * Usage:
 * 1. Wrap your component tree with <ConstDataProvider>
 * 2. Use useConstData() hook in any child component to access catalog data
 *
 * @example
 * // In parent:
 * <ConstDataProvider data={chargenConstData}>
 *   <YourComponents />
 * </ConstDataProvider>
 *
 * // In any child:
 * const { augmentCatalog, spells, traditions } = useConstData();
 */

import { createContext, memo, ReactNode, useContext, useMemo } from 'react';

import {
  AdeptPowerMeta,
  AugmentCategoryMeta,
  AugmentMeta,
  ChargenConstData,
  ComplexFormMeta,
  ContactTypeMeta,
  DroneCategoryMeta,
  DroneMeta,
  DroneModMeta,
  GearCategoryMeta,
  GearItemMeta,
  KnowledgeSkillMeta,
  LanguageMeta,
  LifestyleMeta,
  MentorSpiritMeta,
  PriorityTables,
  SkillGroupMeta,
  SkillMeta,
  SpellMeta,
  TraditionMeta,
} from './types';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Structured access to constant data with helper methods.
 */
export type ConstDataContextValue = {
  // Lists
  adeptPowers: AdeptPowerMeta[];

  // Catalogs (keyed by ID for fast lookup)
  augmentCatalog: Record<string, AugmentMeta>;

  augmentCategories: AugmentCategoryMeta[];
  augments: AugmentMeta[];
  // Grouped data
  augmentsByCategory: Record<string, AugmentMeta[]>;
  complexForms: ComplexFormMeta[];

  contactTypes: ContactTypeMeta[];
  // Cyberlimb configuration
  cyberlimbBaseStats: number;
  cyberlimbMaxUpgrade: number;
  cyberlimbUpgradeCost: number;
  droneCatalog: Record<string, DroneMeta>;
  droneCategories: DroneCategoryMeta[];
  droneModCatalog: Record<string, DroneModMeta>;
  droneModsByCategory: Record<string, DroneModMeta[]>;
  dronesByCategory: Record<string, DroneMeta[]>;
  gearByCategory: Record<string, GearItemMeta[]>;
  mentorSpirits: MentorSpiritMeta[];
  skillGroups: SkillGroupMeta[];
  skills: SkillMeta[];
  spells: SpellMeta[];
  traditions: TraditionMeta[];

  // Priority tables
  priorityTables: PriorityTables | null;

  gearCategories: GearCategoryMeta[];
  languages: LanguageMeta[];
  knowledgeSkills: KnowledgeSkillMeta[];
  /** Whether data is loaded */
  isLoaded: boolean;

  // Metatype bounds
  metatypeAttributeBounds: Record<string, Record<string, [number, number]>>;

  lifestyles: LifestyleMeta[];
  /** Raw constant data from server */
  raw: ChargenConstData | null;
  gearCatalog: Record<string, GearItemMeta>;

  // Helper methods
  getAugment: (id: string) => AugmentMeta | undefined;
  getDrone: (id: string) => DroneMeta | undefined;
  getDroneMod: (id: string) => DroneModMeta | undefined;
  getGear: (id: string) => GearItemMeta | undefined;
  getSkill: (id: string) => SkillMeta | undefined;
  getSpell: (id: string) => SpellMeta | undefined;
  getTradition: (id: string) => TraditionMeta | undefined;
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ConstDataContext = createContext<ConstDataContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export type ConstDataProviderProps = {
  children: ReactNode;
  data: ChargenConstData | null;
};

/**
 * Provider component that supplies constant data to descendants.
 */
export const ConstDataProvider = memo((props: ConstDataProviderProps) => {
  const { children, data } = props;

  // Build structured context value
  const contextValue = useMemo((): ConstDataContextValue => {
    if (!data) {
      return createEmptyContext();
    }

    // Extract and index catalogs
    const augmentCatalog = data.augment_catalog || {};
    const droneCatalog = data.drone_catalog || {};
    const droneModCatalog = data.drone_mod_catalog || {};
    const gearCatalog = data.gear_catalog || {};

    // Build skill lookup
    const skillsById = new Map<string, SkillMeta>();
    for (const skill of data.skills || []) {
      skillsById.set(skill.id, skill);
    }

    // Build spell lookup
    const spellsById = new Map<string, SpellMeta>();
    for (const spell of data.spells || []) {
      spellsById.set(spell.id, spell);
    }

    // Build tradition lookup
    const traditionsById = new Map<string, TraditionMeta>();
    for (const tradition of data.traditions || []) {
      traditionsById.set(tradition.id, tradition);
    }

    return {
      raw: data,
      isLoaded: true,

      // Catalogs
      augmentCatalog,
      droneCatalog,
      droneModCatalog,
      gearCatalog,

      // Lists
      adeptPowers: data.adept_powers || [],
      augmentCategories: Object.values(data.augment_categories || {}),
      augments: data.augments || [],
      complexForms: data.complex_forms || [],
      contactTypes: data.contact_types || [],
      droneCategories: data.drone_categories || [],
      gearCategories: data.gear_categories || [],
      knowledgeSkills: data.knowledge_skills || [],
      languages: data.languages || [],
      lifestyles: data.lifestyles || [],
      mentorSpirits: data.mentor_spirits || [],
      skillGroups: data.skill_groups || [],
      skills: data.skills || [],
      spells: data.spells || [],
      traditions: data.traditions || [],

      // Priority tables
      priorityTables: data.priority_tables || null,

      // Grouped data
      augmentsByCategory: data.augments_by_category || {},
      dronesByCategory: data.drones_by_category || {},
      droneModsByCategory: data.drone_mods_by_category || {},
      gearByCategory: data.gear_by_category || {},

      // Metatype bounds
      metatypeAttributeBounds: data.metatype_attribute_bounds || {},

      // Cyberlimb config
      cyberlimbBaseStats: data.cyberlimb_base_stats ?? 3,
      cyberlimbMaxUpgrade: data.cyberlimb_max_upgrade ?? 3,
      cyberlimbUpgradeCost: data.cyberlimb_upgrade_cost ?? 5000,

      // Helper methods
      getAugment: (id: string) => augmentCatalog[id],
      getDrone: (id: string) => droneCatalog[id],
      getDroneMod: (id: string) => droneModCatalog[id],
      getGear: (id: string) => gearCatalog[id],
      getSkill: (id: string) => skillsById.get(id),
      getSpell: (id: string) => spellsById.get(id),
      getTradition: (id: string) => traditionsById.get(id),
    };
  }, [data]);

  return (
    <ConstDataContext.Provider value={contextValue}>
      {children}
    </ConstDataContext.Provider>
  );
});

ConstDataProvider.displayName = 'ConstDataProvider';

/**
 * Create an empty context value for when data is not loaded.
 */
function createEmptyContext(): ConstDataContextValue {
  const emptyFn = () => undefined;
  return {
    raw: null,
    isLoaded: false,
    augmentCatalog: {},
    droneCatalog: {},
    droneModCatalog: {},
    gearCatalog: {},
    adeptPowers: [],
    augmentCategories: [],
    augments: [],
    complexForms: [],
    contactTypes: [],
    droneCategories: [],
    gearCategories: [],
    knowledgeSkills: [],
    languages: [],
    lifestyles: [],
    mentorSpirits: [],
    skillGroups: [],
    skills: [],
    spells: [],
    traditions: [],
    priorityTables: null,
    augmentsByCategory: {},
    dronesByCategory: {},
    droneModsByCategory: {},
    gearByCategory: {},
    metatypeAttributeBounds: {},
    cyberlimbBaseStats: 3,
    cyberlimbMaxUpgrade: 3,
    cyberlimbUpgradeCost: 5000,
    getAugment: emptyFn,
    getDrone: emptyFn,
    getDroneMod: emptyFn,
    getGear: emptyFn,
    getSkill: emptyFn,
    getSpell: emptyFn,
    getTradition: emptyFn,
  };
}

// ============================================================================
// CONSUMER HOOKS
// ============================================================================

/**
 * Hook to access full constant data context.
 * Must be used within a ConstDataProvider.
 *
 * @throws Error if used outside of ConstDataProvider
 *
 * @example
 * const { augmentCatalog, getAugment, isLoaded } = useConstData();
 *
 * if (!isLoaded) return <Loading />;
 * const augment = getAugment('cyberarm_obvious');
 */
export function useConstData(): ConstDataContextValue {
  const context = useContext(ConstDataContext);

  if (!context) {
    throw new Error('useConstData must be used within a ConstDataProvider');
  }

  return context;
}

/**
 * Hook to access only the augment catalog.
 *
 * @example
 * const { catalog, getAugment, byCategory } = useAugmentCatalog();
 */
export function useAugmentCatalog() {
  const { augmentCatalog, augmentsByCategory, getAugment } = useConstData();
  return {
    catalog: augmentCatalog,
    byCategory: augmentsByCategory,
    getAugment,
  };
}

/**
 * Hook to access only the drone catalog.
 *
 * @example
 * const { catalog, getDrone, modCatalog } = useDroneCatalog();
 */
export function useDroneCatalog() {
  const {
    droneCatalog,
    dronesByCategory,
    getDrone,
    droneModCatalog,
    droneModsByCategory,
    getDroneMod,
  } = useConstData();
  return {
    catalog: droneCatalog,
    byCategory: dronesByCategory,
    getDrone,
    modCatalog: droneModCatalog,
    modsByCategory: droneModsByCategory,
    getDroneMod,
  };
}

/**
 * Hook to access only the gear catalog.
 *
 * @example
 * const { catalog, getGear, byCategory } = useGearCatalog();
 */
export function useGearCatalog() {
  const { gearCatalog, gearByCategory, getGear } = useConstData();
  return {
    catalog: gearCatalog,
    byCategory: gearByCategory,
    getGear,
  };
}

/**
 * Hook to access magic-related data.
 *
 * @example
 * const { spells, traditions, mentorSpirits } = useMagicData();
 */
export function useMagicData() {
  const {
    adeptPowers,
    complexForms,
    mentorSpirits,
    spells,
    traditions,
    getSpell,
    getTradition,
  } = useConstData();
  return {
    adeptPowers,
    complexForms,
    mentorSpirits,
    spells,
    traditions,
    getSpell,
    getTradition,
  };
}

/**
 * Hook to access skill-related data.
 *
 * @example
 * const { skills, skillGroups, knowledgeSkills } = useSkillData();
 */
export function useSkillData() {
  const { skills, skillGroups, knowledgeSkills, languages, getSkill } =
    useConstData();
  return {
    skills,
    skillGroups,
    knowledgeSkills,
    languages,
    getSkill,
  };
}

/**
 * Hook to access priority tables.
 *
 * @example
 * const priorityTables = usePriorityTables();
 * const attrPoints = priorityTables?.attributes['A']; // 24
 */
export function usePriorityTables(): PriorityTables | null {
  const { priorityTables } = useConstData();
  return priorityTables;
}
