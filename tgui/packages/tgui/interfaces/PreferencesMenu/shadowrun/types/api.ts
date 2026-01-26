/**
 * API Types - Types for data exchanged with the server
 *
 * These types represent the data structures used for:
 * - Constant data loaded from the server (catalogs, metadata)
 * - State persisted to/from the server (ChargenState)
 * - Server-provided configuration (priority tables, metatype bounds)
 *
 * These types should match the server's data structures exactly.
 * Do NOT add UI-only fields here - use the UI types instead.
 */

import { PartialPrioritySelection } from '../constants';

// ============================================================================
// PERSISTED STATE (sent to/from server)
// ============================================================================

/**
 * Character generation state stored in preferences.
 * This is the data structure saved to and loaded from the server.
 */
export interface ChargenState {
  // Attributes (id -> rating)
  attributes: Record<string, number>;

  // Augments (augmentId -> { id, grade, optional upgrades })
  augments: Record<string, AugmentSelection>;

  // Awakening type
  awakening: AwakeningType;

  // SIN extended data
  birthplace?: string;

  // Character notes (all four records)
  character_notes?: CharacterNotes;

  // Contacts list
  contacts: Contact[];

  // Drones (droneId -> { mods })
  drones?: Record<string, DroneSelection>;

  // Starting gear
  gear?: GearSelection[];

  // Karma purchases (quality_id -> karma spent)
  karma_purchases?: Record<string, number>;

  // Total karma spent
  karma_spent: number;

  // Knowledge skills (id -> rating)
  knowledge_skills: Record<string, number>;

  // Languages (id -> rating)
  languages: Record<string, number>;

  // Lifestyle tier
  lifestyle?: string;

  // Mentor spirit selection
  mentor_spirit?: string;

  // Metatype species path
  metatype_species: string;

  // Native language (full proficiency)
  native_language: string;

  // Priority selections (may be partial during editing)
  priorities: PartialPrioritySelection;

  // Religion for SIN
  religion?: string;

  // Whether character is locked
  saved: boolean;

  // Selected complex forms for technomancers
  selected_complex_forms: string[];

  // Selected adept powers (id -> level)
  selected_powers: Record<string, number>;

  // Selected spells for mages
  selected_spells: string[];

  // SIN status
  sin_status?: string;

  // Skill groups (id -> rating)
  skill_groups: Record<string, number>;

  // Skill specializations (skill_id -> specialization name)
  skill_specializations?: Record<string, string>;

  // Active skills (id -> rating)
  skills: Record<string, number>;

  // Special attributes (edge, magic, resonance)
  special: Record<string, number>;

  // Tradition for mages
  tradition?: string;
}

/** Awakening type options */
export type AwakeningType =
  | 'mundane'
  | 'mage'
  | 'adept'
  | 'mystic_adept'
  | 'technomancer';

/** Contact entry */
export interface Contact {
  connection: number;
  loyalty: number;
  name: string;
  type_id: string;
}

/** Augment selection with optional cyberlimb upgrades and mods */
export interface AugmentSelection {
  /** Agility upgrade for cyberlimbs */
  agi_upgrade?: number;
  /** Augment grade (standard, alpha, beta, delta, used) */
  grade: string;
  /** Augment ID */
  id: string;
  /** Installed modifications (array of mod IDs) */
  mods?: string[];
  /** Strength upgrade for cyberlimbs */
  str_upgrade?: number;
}

/** Drone selection with mod list */
export interface DroneSelection {
  mods: string[];
}

/** Character notes (security, medical, general records) */
export interface CharacterNotes {
  exploitable_info: string;
  general: string;
  medical_record: string;
  security_record: string;
}

/** Gear selection with quantity */
export interface GearSelection {
  id: string;
  quantity?: number;
}

// ============================================================================
// CONSTANT DATA (loaded from server)
// ============================================================================

/**
 * Constant data provided by the server.
 * Contains catalogs, metadata, and configuration that doesn't change during a session.
 */
export interface ChargenConstData {
  adept_powers: AdeptPowerMeta[];
  attributes: AttributeMeta[];
  augment_catalog?: Record<string, AugmentMeta>;
  augment_categories?: Record<string, AugmentCategoryMeta>;
  /** Catalog of augment modifications by ID */
  augment_mod_catalog?: Record<string, AugmentModMeta>;
  /** Augment mod categories metadata */
  augment_mod_categories?: AugmentModCategoryMeta[];
  /** Augment mods organized by category */
  augment_mods_by_category?: Record<string, AugmentModMeta[]>;
  augments: AugmentMeta[];
  augments_by_category?: Record<string, AugmentMeta[]>;
  awakening_choices?: AwakeningChoiceMeta[];
  complex_forms: ComplexFormMeta[];
  contact_types: ContactTypeMeta[];
  cyberlimb_base_stats?: number;
  cyberlimb_max_upgrade?: number;
  cyberlimb_upgrade_cost?: number;
  cyberware_suites?: CyberwareSuiteMeta[];
  drone_catalog: Record<string, DroneMeta>;
  drone_categories: DroneCategoryMeta[];
  drone_mod_catalog: Record<string, DroneModMeta>;
  drone_mod_categories: DroneCategoryMeta[];
  drone_mods_by_category: Record<string, DroneModMeta[]>;
  drones_by_category: Record<string, DroneMeta[]>;
  edge_base?: number;
  gear_by_category?: Record<string, GearItemMeta[]>;
  gear_catalog: Record<string, GearItemMeta>;
  gear_categories?: GearCategoryMeta[];
  knowledge_skills: KnowledgeSkillMeta[];
  languages: LanguageMeta[];
  lifestyles: LifestyleMeta[];
  mentor_spirits: MentorSpiritMeta[];
  metatype_attribute_bounds: Record<string, Record<string, [number, number]>>;
  metatype_choices?: MetatypeChoiceMeta[];
  priority_display_names: Record<string, string>;
  priority_tables: PriorityTables;
  skill_groups: SkillGroupMeta[];
  skills: SkillMeta[];
  special_attributes?: AttributeMeta[];
  spells: SpellMeta[];
  traditions: TraditionMeta[];
}

/** Priority allocation tables from server */
export interface PriorityTables {
  attributes: Record<string, number>;
  magic: Record<string, number>;
  metatype: Record<string, string[]>;
  metatype_special?: Record<string, number>;
  resources: Record<string, number>;
  skill_groups?: Record<string, number>;
  skills: Record<string, number>;
}

// ============================================================================
// CATALOG METADATA (server-provided)
// ============================================================================

/** Attribute metadata */
export interface AttributeMeta {
  category?: string;
  id: string;
  max: number;
  min: number;
  name: string;
}

/** Skill metadata */
export interface SkillMeta {
  attribute: string;
  category: string;
  group?: string;
  id: string;
  name: string;
  parent_stat_name?: string;
  specializations?: string[];
}

/** Skill group metadata */
export interface SkillGroupMeta {
  id: string;
  name: string;
  skills: string[];
}

/** Tradition metadata */
export interface TraditionMeta {
  description?: string;
  drain_attribute: string;
  id: string;
  name: string;
}

/** Mentor spirit metadata */
export interface MentorSpiritMeta {
  advantage?: string;
  advantages: string;
  description?: string;
  disadvantage?: string;
  disadvantages: string;
  id: string;
  magician_advantage?: string;
  name: string;
}

/** Spell metadata */
export interface SpellMeta {
  category: string;
  desc?: string;
  description?: string;
  drain: string;
  duration: string;
  id: string;
  name: string;
  range: string;
  type: string;
}

/** Adept power metadata */
export interface AdeptPowerMeta {
  category?: string;
  desc?: string;
  description?: string;
  has_levels?: boolean;
  id: string;
  max_level: number;
  name: string;
  pp_cost: number;
}

/** Complex form metadata */
export interface ComplexFormMeta {
  category?: string;
  desc?: string;
  description?: string;
  duration: string;
  fading: string;
  id: string;
  name: string;
  target: string;
}

/** Knowledge skill metadata */
export interface KnowledgeSkillMeta {
  category: string;
  id: string;
  name: string;
}

/** Language metadata */
export interface LanguageMeta {
  desc?: string;
  description?: string;
  id: string;
  name: string;
}

/** Contact type metadata */
export interface ContactTypeMeta {
  archetype: string;
  id: string;
  name: string;
  profession: string;
  specialty?: string;
}

/** Augment metadata */
export interface AugmentMeta {
  availability: number;
  category: string;
  description?: string;
  essence_cost: number;
  id: string;
  is_cyberlimb?: boolean;
  name: string;
  nuyen_cost: number;
  slot: string;
}

/** Augment category metadata */
export interface AugmentCategoryMeta {
  description?: string;
  icon?: string;
  id?: string;
  name: string;
}

/** Cyberware suite metadata */
export interface CyberwareSuiteMeta {
  augments: string[];
  description?: string;
  discount?: number;
  icon?: string;
  id: string;
  name: string;
}

/** Awakening choice metadata */
export interface AwakeningChoiceMeta {
  id: string;
  name: string;
}

/** Metatype choice metadata */
export interface MetatypeChoiceMeta {
  id: string;
  min_priority: string;
  name: string;
}

/** Gear item metadata */
export interface GearItemMeta {
  availability: number;
  category: string;
  cost: number;
  desc?: string;
  description?: string;
  id: string;
  legality?: string;
  max_quantity?: number;
  name: string;
  sort?: number;
  stackable?: boolean;
  subcategory?: string;
}

/** Gear category metadata */
export interface GearCategoryMeta {
  id: string;
  name: string;
}

/** Drone metadata */
export interface DroneMeta {
  armor?: number;
  availability: number;
  body: number;
  category: string;
  cost: number;
  desc?: string;
  description?: string;
  device_rating?: number;
  handling: number;
  id: string;
  legality?: string;
  name: string;
  pilot: number;
  sensor: number;
  sort?: number;
  speed: number;
}

/** Drone modification metadata */
export interface DroneModMeta {
  allowed_categories?: string[];
  allowed_drones?: string[];
  availability: number;
  category?: string;
  cost: number;
  desc?: string;
  description?: string;
  icon?: string;
  id: string;
  legality?: string;
  max_per_drone?: number;
  name: string;
  sort?: number;
  stat_bonuses?: Record<string, number>;
}

/** Drone category metadata */
export interface DroneCategoryMeta {
  id: string;
  name: string;
  sort?: number;
}

/** Augment modification metadata - for upgrades like sensors, armor, concealment */
export interface AugmentModMeta {
  /** Specific augment IDs this mod can be applied to (empty = category-based) */
  allowed_augments?: string[];
  /** Augment categories this mod can be applied to (empty = all) */
  allowed_categories?: string[];
  /** Availability rating */
  availability: number;
  /** Mod category (capacity, concealment, sensors, armor, cosmetic, utility) */
  category?: string;
  /** Nuyen cost */
  cost: number;
  /** Only applicable to cyberlimbs */
  cyberlimb_only?: boolean;
  /** Short description */
  desc?: string;
  /** Long description */
  description?: string;
  /** Essence cost (some mods add essence cost) */
  essence_cost?: number;
  /** Icon name for display */
  icon?: string;
  /** Unique identifier */
  id: string;
  /** Legality rating (R = Restricted, F = Forbidden) */
  legality?: string;
  /** Maximum number of this mod per augment */
  max_per_augment?: number;
  /** Display name */
  name: string;
  /** Sort order for display */
  sort?: number;
  /** Stat bonuses provided (e.g., { sensor: 2 }) */
  stat_bonuses?: Record<string, number>;
}

/** Augment mod category metadata */
export interface AugmentModCategoryMeta {
  /** Description of the category */
  description?: string;
  /** Icon for display */
  icon?: string;
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Sort order */
  sort?: number;
}

/** Lifestyle tier metadata */
export interface LifestyleMeta {
  cost: number;
  description?: string;
  id: string;
  name: string;
}
