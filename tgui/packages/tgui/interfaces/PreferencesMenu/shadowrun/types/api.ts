/**
 * @fileoverview API Types - Types for data exchanged with the server
 *
 * These types represent the data structures used for:
 * - Constant data loaded from the server (catalogs, metadata)
 * - State persisted to/from the server (ChargenState)
 * - Server-provided configuration (priority tables, metatype bounds)
 *
 * These types should match the server's data structures exactly.
 * Do NOT add UI-only fields here - use the UI types instead.
 *
 * @module types/api
 * @see {@link ./ui.ts} for client-side only types
 */

import { PartialPrioritySelection } from '../constants';

// ============================================================================
// PERSISTED STATE (sent to/from server)
// ============================================================================

/**
 * Character generation state stored in preferences.
 *
 * This is the primary data structure for a Shadowrun character, persisted
 * to the server when the player saves. It contains all character choices
 * made during character generation.
 *
 * @remarks
 * - The `saved` flag indicates whether the character is locked and ready to play
 * - All ID fields (skill IDs, augment IDs, etc.) use the server's canonical IDs
 * - Partial selections are allowed during editing; validation runs before save
 *
 * @example
 * ```typescript
 * const newCharacter: ChargenState = {
 *   priorities: { metatype: 'B', attributes: 'A', skills: 'C', magic: 'D', resources: 'E' },
 *   metatype_species: 'elf',
 *   awakening: 'mage',
 *   attributes: { body: 3, agility: 5, reaction: 4, strength: 2, willpower: 4, logic: 5, intuition: 4, charisma: 3 },
 *   skills: { spellcasting: 6, summoning: 4, assensing: 3 },
 *   // ... other fields
 *   saved: false,
 * };
 * ```
 *
 * @see {@link ChargenConstData} for static catalog data
 */
export interface ChargenState {
  /**
   * Physical and mental attributes mapped by attribute ID.
   * @example `{ body: 3, agility: 5, willpower: 4 }`
   */
  attributes: Record<string, number>;

  /**
   * Installed augmentations (cyberware/bioware) mapped by augment ID.
   * @see {@link AugmentSelection} for the selection structure
   */
  augments: Record<string, AugmentSelection>;

  /**
   * Character's awakening type determining magical/technomantic abilities.
   * @see {@link AwakeningType} for valid values
   */
  awakening: AwakeningType;

  /**
   * Character's place of birth for SIN records.
   * @example "Seattle, UCAS"
   */
  birthplace?: string;

  /**
   * Character background notes and records.
   * @see {@link CharacterNotes} for the notes structure
   */
  character_notes?: CharacterNotes;

  /**
   * List of contacts the character knows.
   * @see {@link Contact} for the contact structure
   */
  contacts: Contact[];

  /**
   * Owned drones and their modifications.
   * @see {@link DroneSelection} for the selection structure
   */
  drones?: Record<string, DroneSelection>;

  /**
   * Starting gear and equipment.
   * @see {@link GearSelection} for the selection structure
   */
  gear?: GearSelection[];

  /**
   * Karma spent on qualities and other purchases.
   * Maps quality ID to karma amount spent.
   */
  karma_purchases?: Record<string, number>;

  /** Total karma spent across all purchases. */
  karma_spent: number;

  /**
   * Knowledge skills mapped by skill ID to rating (1-6).
   * @example `{ seattle_area: 3, corporate_politics: 4 }`
   */
  knowledge_skills: Record<string, number>;

  /**
   * Languages known, mapped by language ID to proficiency rating.
   * Rating scale: 1 (Basic) to 6 (Native-like)
   * @example `{ english: 6, japanese: 3, sperethiel: 2 }`
   */
  languages: Record<string, number>;

  /**
   * Selected lifestyle tier determining living conditions.
   * @see {@link LifestyleMeta} for lifestyle options
   */
  lifestyle?: string;

  /** Selected mentor spirit ID for awakened characters. */
  mentor_spirit?: string;

  /**
   * Metatype/species identifier.
   * @example "human", "elf", "dwarf", "ork", "troll"
   */
  metatype_species: string;

  /**
   * Character's native language (always at full proficiency).
   * This language doesn't cost language points.
   */
  native_language: string;

  /**
   * URL to character's bodyshot portrait image.
   *
   * Must be hosted on catbox.moe, be a .png or .jpg file, and under 6MB.
   * @example "https://files.catbox.moe/abc123.png"
   */
  portrait_bodyshot?: string;

  /**
   * URL to character's headshot portrait image.
   *
   * Must be hosted on catbox.moe, be a .png or .jpg file, and under 6MB.
   * @example "https://files.catbox.moe/xyz789.jpg"
   */
  portrait_headshot?: string;

  /**
   * Priority selections for the A-E priority system.
   * May be partial during character creation.
   * @see {@link PartialPrioritySelection}
   */
  priorities: PartialPrioritySelection;

  /** Character's religious affiliation for SIN records. */
  religion?: string;

  /**
   * Whether the character sheet is saved and locked.
   * When true, the character cannot be edited and can join rounds.
   */
  saved: boolean;

  /** Selected complex form IDs for technomancers. */
  selected_complex_forms: string[];

  /**
   * Selected adept powers mapped by power ID to level purchased.
   * @example `{ improved_reflexes: 2, combat_sense: 1 }`
   */
  selected_powers: Record<string, number>;

  /** Selected spell IDs for mages and mystic adepts. */
  selected_spells: string[];

  /** SIN status (real, fake rating, etc.). */
  sin_status?: string;

  /**
   * Skill groups purchased, mapped by group ID to rating.
   * @example `{ athletics: 2, stealth: 3 }`
   */
  skill_groups: Record<string, number>;

  /**
   * Skill specializations, mapped by skill ID to specialization name.
   * @example `{ firearms: "Pistols", negotiation: "Diplomacy" }`
   */
  skill_specializations?: Record<string, string>;

  /**
   * Active skills mapped by skill ID to rating (1-6).
   * @example `{ firearms: 5, stealth: 4, perception: 3 }`
   */
  skills: Record<string, number>;

  /**
   * Special attributes (Edge, Magic, Resonance).
   * @example `{ edge: 3, magic: 4 }` or `{ edge: 2, resonance: 5 }`
   */
  special: Record<string, number>;

  /** Selected tradition ID for mages and mystic adepts. */
  tradition?: string;
}

/**
 * Valid awakening type values for character creation.
 *
 * Determines what magical or technomantic abilities a character can access:
 * - `mundane`: No magical abilities
 * - `mage`: Full spellcaster with spells and summoning
 * - `adept`: Physical adept with adept powers
 * - `mystic_adept`: Hybrid with both spells and limited adept powers
 * - `technomancer`: Matrix specialist with complex forms and sprites
 *
 * @see {@link ChargenState.awakening}
 */
export type AwakeningType =
  | 'mundane'
  | 'mage'
  | 'adept'
  | 'mystic_adept'
  | 'technomancer';

/**
 * A contact in the character's network.
 *
 * Contacts provide services, information, and favors based on their
 * Connection (influence/resources) and Loyalty (willingness to help).
 *
 * @example
 * ```typescript
 * const fixer: Contact = {
 *   name: "Fast Eddie",
 *   type_id: "fixer",
 *   connection: 4,
 *   loyalty: 3,
 * };
 * ```
 */
export interface Contact {
  /** Connection rating (1-6): The contact's influence and resources. */
  connection: number;
  /** Loyalty rating (1-6): How far the contact will go to help. */
  loyalty: number;
  /** Contact's name. */
  name: string;
  /** Contact archetype/profession ID. @see {@link ContactTypeMeta} */
  type_id: string;
}

/**
 * An installed augmentation with its grade and optional upgrades.
 *
 * @remarks
 * Cyberlimbs have additional properties for stat upgrades.
 * The grade affects both essence cost and nuyen cost.
 *
 * @example
 * ```typescript
 * const cyberarm: AugmentSelection = {
 *   id: 'cyberarm_obvious',
 *   grade: 'alphaware',
 *   str_upgrade: 2,
 *   agi_upgrade: 1,
 *   mods: ['hand_razors', 'armor_2'],
 * };
 * ```
 *
 * @see {@link AugmentMeta} for augment catalog data
 */
export interface AugmentSelection {
  /** Agility upgrade level for cyberlimbs (0-3). */
  agi_upgrade?: number;
  /**
   * Augment grade affecting essence and cost.
   * @see AUGMENT_GRADES in constants.ts
   */
  grade: string;
  /** Augment identifier matching catalog entry. */
  id: string;
  /** List of installed modification IDs. */
  mods?: string[];
  /** Strength upgrade level for cyberlimbs (0-3). */
  str_upgrade?: number;
}

/**
 * A drone with its installed modifications.
 *
 * @example
 * ```typescript
 * const roto: DroneSelection = {
 *   mods: ['weapon_mount_standard', 'armor_upgrade_2'],
 * };
 * ```
 */
export interface DroneSelection {
  /** List of installed drone mod IDs. */
  mods: string[];
}

/**
 * Character background notes organized by category.
 *
 * These are freeform text fields for roleplay and background information.
 */
export interface CharacterNotes {
  /** Information that could be used against the character. */
  exploitable_info: string;
  /** General character background and history. */
  general: string;
  /** Medical history, conditions, allergies. */
  medical_record: string;
  /** Criminal record, wanted status, legal issues. */
  security_record: string;
}

/**
 * A gear item selection with optional quantity.
 *
 * @example
 * ```typescript
 * const ammo: GearSelection = { id: 'apds_rounds', quantity: 100 };
 * const commlink: GearSelection = { id: 'hermes_ikon' }; // quantity defaults to 1
 * ```
 */
export interface GearSelection {
  /** Gear item ID matching catalog entry. */
  id: string;
  /** Quantity owned (defaults to 1 if not specified). */
  quantity?: number;
}

// ============================================================================
// CONSTANT DATA (loaded from server)
// ============================================================================

/**
 * Constant data provided by the server for character generation.
 *
 * This interface contains all catalog data, metadata, and configuration
 * that is loaded once when the chargen UI opens. This data does not change
 * during a session.
 *
 * @remarks
 * - All arrays are indexed catalogs for displaying options
 * - `*_catalog` fields provide O(1) lookup by ID
 * - `*_by_category` fields group items for categorical display
 *
 * @example
 * ```typescript
 * // Access a spell by ID
 * const fireball = constData.spells.find(s => s.id === 'fireball');
 *
 * // Get all combat spells
 * const combatSpells = constData.spells.filter(s => s.category === 'combat');
 *
 * // Look up gear by ID
 * const gun = constData.gear_catalog['ares_predator'];
 * ```
 *
 * @see {@link ChargenState} for the mutable character data
 */
export interface ChargenConstData {
  /** Available adept powers for adepts and mystic adepts. */
  adept_powers: AdeptPowerMeta[];

  /** Physical and mental attribute definitions. */
  attributes: AttributeMeta[];

  /** Augment catalog for O(1) lookup by ID. */
  augment_catalog?: Record<string, AugmentMeta>;

  /** Augment category definitions with icons and descriptions. */
  augment_categories?: Record<string, AugmentCategoryMeta>;

  /** Augment modification catalog for O(1) lookup. */
  augment_mod_catalog?: Record<string, AugmentModMeta>;

  /** Categories for augment modifications. */
  augment_mod_categories?: AugmentModCategoryMeta[];

  /** Augment mods organized by category for display. */
  augment_mods_by_category?: Record<string, AugmentModMeta[]>;

  /** All available augmentations (cyberware/bioware). */
  augments: AugmentMeta[];

  /** Augments organized by category for display. */
  augments_by_category?: Record<string, AugmentMeta[]>;

  /** Available awakening type choices. */
  awakening_choices?: AwakeningChoiceMeta[];

  /** Available complex forms for technomancers. */
  complex_forms: ComplexFormMeta[];

  /** Contact archetypes/professions. */
  contact_types: ContactTypeMeta[];

  /** Base attribute value for cyberlimbs (typically 3). */
  cyberlimb_base_stats?: number;

  /** Maximum upgrade per stat for cyberlimbs (typically 3). */
  cyberlimb_max_upgrade?: number;

  /** Nuyen cost per +1 upgrade to cyberlimb stats. */
  cyberlimb_upgrade_cost?: number;

  /** Pre-built cyberware suite packages. */
  cyberware_suites?: CyberwareSuiteMeta[];

  /** Drone catalog for O(1) lookup by ID. */
  drone_catalog: Record<string, DroneMeta>;

  /** Drone category definitions. */
  drone_categories: DroneCategoryMeta[];

  /** Drone modification catalog for O(1) lookup. */
  drone_mod_catalog: Record<string, DroneModMeta>;

  /** Drone mod category definitions. */
  drone_mod_categories: DroneCategoryMeta[];

  /** Drone mods organized by category for display. */
  drone_mods_by_category: Record<string, DroneModMeta[]>;

  /** Drones organized by category for display. */
  drones_by_category: Record<string, DroneMeta[]>;

  /** Base Edge attribute value (typically 1-2 depending on metatype). */
  edge_base?: number;

  /** Gear items organized by category for display. */
  gear_by_category?: Record<string, GearItemMeta[]>;

  /** Gear catalog for O(1) lookup by ID. */
  gear_catalog: Record<string, GearItemMeta>;

  /** Gear category definitions. */
  gear_categories?: GearCategoryMeta[];

  /** Available knowledge skills. */
  knowledge_skills: KnowledgeSkillMeta[];

  /** Available languages. */
  languages: LanguageMeta[];

  /** Lifestyle tier options. */
  lifestyles: LifestyleMeta[];

  /** Mentor spirit options for awakened characters. */
  mentor_spirits: MentorSpiritMeta[];

  /**
   * Attribute bounds per metatype.
   * Maps metatype ID → attribute ID → [min, max].
   * @example `{ human: { body: [1, 6], agility: [1, 6] }, troll: { body: [5, 10] } }`
   */
  metatype_attribute_bounds: Record<string, Record<string, [number, number]>>;

  /** Available metatype/species choices. */
  metatype_choices?: MetatypeChoiceMeta[];

  /** Human-readable names for priority categories. */
  priority_display_names: Record<string, string>;

  /** Priority allocation tables defining points/options per letter. */
  priority_tables: PriorityTables;

  /** Available skill groups. */
  skill_groups: SkillGroupMeta[];

  /** Active skill definitions. */
  skills: SkillMeta[];

  /** Special attribute definitions (Edge, Magic, Resonance). */
  special_attributes?: AttributeMeta[];

  /** Available spells for mages and mystic adepts. */
  spells: SpellMeta[];

  /** Magical tradition options. */
  traditions: TraditionMeta[];
}

/**
 * Priority allocation tables from the server.
 *
 * These define what resources are available at each priority letter (A-E).
 * The priority system is the core of SR5 character generation.
 *
 * @example
 * ```typescript
 * // Priority A in attributes gives 24 points
 * const attrPoints = priorityTables.attributes['A']; // 24
 *
 * // Priority B in metatype allows elf, ork, or dwarf
 * const metatypes = priorityTables.metatype['B']; // ['elf', 'ork', 'dwarf']
 * ```
 */
export interface PriorityTables {
  /** Attribute points per priority letter. */
  attributes: Record<string, number>;
  /** Magic/Resonance rating per priority letter. */
  magic: Record<string, number>;
  /** Available metatypes per priority letter. */
  metatype: Record<string, string[]>;
  /** Special attribute points per priority letter. */
  metatype_special?: Record<string, number>;
  /** Starting nuyen per priority letter. */
  resources: Record<string, number>;
  /** Skill group points per priority letter. */
  skill_groups?: Record<string, number>;
  /** Skill points per priority letter. */
  skills: Record<string, number>;
}

// ============================================================================
// CATALOG METADATA (server-provided)
// ============================================================================

/**
 * Attribute definition from the server.
 *
 * Defines a physical or mental attribute with its valid range.
 */
export interface AttributeMeta {
  /** Category: 'physical' or 'mental'. */
  category?: string;
  /** Unique identifier (e.g., 'body', 'agility'). */
  id: string;
  /** Maximum value for this attribute (metatype-adjusted). */
  max: number;
  /** Minimum value for this attribute (metatype-adjusted). */
  min: number;
  /** Display name (e.g., 'Body', 'Agility'). */
  name: string;
}

/**
 * Active skill definition from the server.
 *
 * Skills are the core abilities characters use to accomplish tasks.
 */
export interface SkillMeta {
  /** Linked attribute ID for skill tests. */
  attribute: string;
  /** Skill category (e.g., 'combat', 'social', 'technical'). */
  category: string;
  /** Skill group this skill belongs to, if any. */
  group?: string;
  /** Unique skill identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Display name of the linked attribute. */
  parent_stat_name?: string;
  /** Available specializations for this skill. */
  specializations?: string[];
}

/**
 * Skill group definition from the server.
 *
 * Skill groups allow purchasing multiple related skills at once.
 */
export interface SkillGroupMeta {
  /** Unique group identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** List of skill IDs in this group. */
  skills: string[];
}

/**
 * Magical tradition definition.
 *
 * Traditions define how a mage or mystic adept interacts with magic,
 * including their drain attribute and thematic elements.
 */
export interface TraditionMeta {
  /** Flavor text describing the tradition. */
  description?: string;
  /** Attribute used for drain resistance (e.g., 'charisma', 'willpower'). */
  drain_attribute: string;
  /** Unique tradition identifier. */
  id: string;
  /** Display name (e.g., 'Hermetic', 'Shamanic'). */
  name: string;
}

/**
 * Mentor spirit definition.
 *
 * Mentor spirits provide guidance and bonuses to awakened characters.
 */
export interface MentorSpiritMeta {
  /** @deprecated Use `advantages` instead. */
  advantage?: string;
  /** Benefits provided by this mentor spirit. */
  advantages: string;
  /** Flavor text describing the spirit. */
  description?: string;
  /** @deprecated Use `disadvantages` instead. */
  disadvantage?: string;
  /** Drawbacks or obligations from this mentor spirit. */
  disadvantages: string;
  /** Unique mentor spirit identifier. */
  id: string;
  /** Specific bonus for magicians following this spirit. */
  magician_advantage?: string;
  /** Display name (e.g., 'Bear', 'Raven', 'Wolf'). */
  name: string;
}

/**
 * Spell definition for mages and mystic adepts.
 *
 * Spells are magical effects that consume drain to cast.
 */
export interface SpellMeta {
  /** Spell category (e.g., 'combat', 'detection', 'health', 'illusion', 'manipulation'). */
  category: string;
  /** @deprecated Use `description` instead. */
  desc?: string;
  /** Full description of the spell's effects. */
  description?: string;
  /** Drain code (e.g., 'F-3', 'F+1'). */
  drain: string;
  /** Duration type ('I' = Instant, 'S' = Sustained, 'P' = Permanent). */
  duration: string;
  /** Unique spell identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Range category ('T' = Touch, 'LOS' = Line of Sight, 'LOS(A)' = Area). */
  range: string;
  /** Spell type ('P' = Physical, 'M' = Mana). */
  type: string;
}

/**
 * Adept power definition for adepts and mystic adepts.
 *
 * Adept powers cost Power Points (PP) and provide permanent abilities.
 */
export interface AdeptPowerMeta {
  /** Power category for display grouping. */
  category?: string;
  /** @deprecated Use `description` instead. */
  desc?: string;
  /** Full description of the power's effects. */
  description?: string;
  /** Whether this power can be purchased at multiple levels. */
  has_levels?: boolean;
  /** Unique power identifier. */
  id: string;
  /** Maximum level this power can be purchased at. */
  max_level: number;
  /** Display name. */
  name: string;
  /** Power Point cost per level. */
  pp_cost: number;
}

/**
 * Complex form definition for technomancers.
 *
 * Complex forms are matrix abilities that cause Fading when used.
 */
export interface ComplexFormMeta {
  /** Form category for display grouping. */
  category?: string;
  /** @deprecated Use `description` instead. */
  desc?: string;
  /** Full description of the form's effects. */
  description?: string;
  /** Duration type ('I' = Instant, 'S' = Sustained, 'P' = Permanent). */
  duration: string;
  /** Fading code (e.g., 'L-2', 'L+1'). */
  fading: string;
  /** Unique form identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Target type (e.g., 'Persona', 'Device', 'File', 'Sprite'). */
  target: string;
}

/**
 * Knowledge skill definition.
 *
 * Knowledge skills represent learned information and expertise.
 */
export interface KnowledgeSkillMeta {
  /** Category (e.g., 'academic', 'street', 'professional', 'interests'). */
  category: string;
  /** Unique skill identifier. */
  id: string;
  /** Display name. */
  name: string;
}

/**
 * Language definition.
 */
export interface LanguageMeta {
  /** @deprecated Use `description` instead. */
  desc?: string;
  /** Description or notes about the language. */
  description?: string;
  /** Unique language identifier. */
  id: string;
  /** Display name (e.g., 'English', 'Japanese', 'Sperethiel'). */
  name: string;
}

/**
 * Contact archetype/profession definition.
 *
 * Defines the types of contacts characters can have.
 */
export interface ContactTypeMeta {
  /** Contact archetype (e.g., 'Fixer', 'Street Doc', 'Bartender'). */
  archetype: string;
  /** Unique type identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Profession description. */
  profession: string;
  /** Specialty or focus area. */
  specialty?: string;
}

/**
 * Augmentation (cyberware/bioware) definition.
 *
 * Augments enhance characters at the cost of Essence.
 */
export interface AugmentMeta {
  /** Base availability rating. */
  availability: number;
  /** Category (e.g., 'headware', 'bodyware', 'cyberlimb'). */
  category: string;
  /** Description of the augment's effects. */
  description?: string;
  /** Base Essence cost before grade modifier. */
  essence_cost: number;
  /** Unique augment identifier. */
  id: string;
  /** Whether this augment is a cyberlimb (allows stat upgrades). */
  is_cyberlimb?: boolean;
  /** Display name. */
  name: string;
  /** Base nuyen cost before grade modifier. */
  nuyen_cost: number;
  /** Body slot used (e.g., 'head', 'torso', 'arm'). */
  slot: string;
}

/**
 * Augment category definition.
 */
export interface AugmentCategoryMeta {
  /** Category description. */
  description?: string;
  /** Icon name for display. */
  icon?: string;
  /** Unique category identifier. */
  id?: string;
  /** Display name. */
  name: string;
}

/**
 * Pre-built cyberware suite/package.
 *
 * Suites bundle multiple augments at a discounted price.
 */
export interface CyberwareSuiteMeta {
  /** List of augment IDs included in this suite. */
  augments: string[];
  /** Suite description. */
  description?: string;
  /** Discount percentage (e.g., 0.1 = 10% off). */
  discount?: number;
  /** Icon for display. */
  icon?: string;
  /** Unique suite identifier. */
  id: string;
  /** Display name. */
  name: string;
}

/**
 * Awakening choice option.
 */
export interface AwakeningChoiceMeta {
  /** Unique identifier matching AwakeningType. */
  id: string;
  /** Display name. */
  name: string;
}

/**
 * Metatype choice option.
 */
export interface MetatypeChoiceMeta {
  /** Unique metatype identifier. */
  id: string;
  /** Minimum priority letter required to select this metatype. */
  min_priority: string;
  /** Display name (e.g., 'Human', 'Elf', 'Troll'). */
  name: string;
}

/**
 * Gear item definition.
 *
 * Gear includes equipment, weapons, armor, and miscellaneous items.
 */
export interface GearItemMeta {
  /** Base availability rating. */
  availability: number;
  /** Category (e.g., 'weapons', 'armor', 'electronics'). */
  category: string;
  /** Base nuyen cost. */
  cost: number;
  /** @deprecated Use `description` instead. */
  desc?: string;
  /** Full description of the item. */
  description?: string;
  /** Unique item identifier. */
  id: string;
  /** Legality rating ('R' = Restricted, 'F' = Forbidden). */
  legality?: string;
  /** Maximum quantity that can be purchased. */
  max_quantity?: number;
  /** Display name. */
  name: string;
  /** Sort order for display. */
  sort?: number;
  /** Whether multiple can be stacked in inventory. */
  stackable?: boolean;
  /** Subcategory for finer grouping. */
  subcategory?: string;
}

/**
 * Gear category definition.
 */
export interface GearCategoryMeta {
  /** Unique category identifier. */
  id: string;
  /** Display name. */
  name: string;
}

/**
 * Drone definition.
 *
 * Drones are autonomous or remote-controlled vehicles and robots.
 */
export interface DroneMeta {
  /** Armor rating for damage resistance. */
  armor?: number;
  /** Base availability rating. */
  availability: number;
  /** Body attribute for structural integrity. */
  body: number;
  /** Category (e.g., 'aerial', 'ground', 'aquatic', 'anthroform'). */
  category: string;
  /** Base nuyen cost. */
  cost: number;
  /** @deprecated Use `description` instead. */
  desc?: string;
  /** Full description. */
  description?: string;
  /** Device rating for Matrix stats. */
  device_rating?: number;
  /** Handling rating for piloting tests. */
  handling: number;
  /** Unique drone identifier. */
  id: string;
  /** Legality rating ('R' = Restricted, 'F' = Forbidden). */
  legality?: string;
  /** Display name. */
  name: string;
  /** Pilot rating for autonomous operation. */
  pilot: number;
  /** Sensor rating for perception. */
  sensor: number;
  /** Sort order for display. */
  sort?: number;
  /** Speed rating. */
  speed: number;
}

/**
 * Drone modification definition.
 *
 * Mods enhance drone capabilities at additional cost.
 */
export interface DroneModMeta {
  /** Drone categories this mod can be applied to (empty = all). */
  allowed_categories?: string[];
  /** Specific drone IDs this mod can be applied to. */
  allowed_drones?: string[];
  /** Base availability rating. */
  availability: number;
  /** Mod category for grouping. */
  category?: string;
  /** Base nuyen cost. */
  cost: number;
  /** @deprecated Use `description` instead. */
  desc?: string;
  /** Full description. */
  description?: string;
  /** Icon name for display. */
  icon?: string;
  /** Unique mod identifier. */
  id: string;
  /** Legality rating ('R' = Restricted, 'F' = Forbidden). */
  legality?: string;
  /** Maximum number of this mod per drone. */
  max_per_drone?: number;
  /** Display name. */
  name: string;
  /** Sort order for display. */
  sort?: number;
  /** Stat bonuses provided (e.g., `{ sensor: 2 }`). */
  stat_bonuses?: Record<string, number>;
}

/**
 * Drone category definition.
 */
export interface DroneCategoryMeta {
  /** Unique category identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Sort order for display. */
  sort?: number;
}

/**
 * Augment modification definition.
 *
 * Mods upgrade augments with sensors, armor, concealment, and other features.
 *
 * @example
 * ```typescript
 * const sensorMod: AugmentModMeta = {
 *   id: 'sensor_package_2',
 *   name: 'Sensor Package (Rating 2)',
 *   category: 'sensors',
 *   cost: 2000,
 *   availability: 4,
 *   stat_bonuses: { sensor: 2 },
 *   allowed_categories: ['headware', 'eyeware'],
 * };
 * ```
 */
export interface AugmentModMeta {
  /** Specific augment IDs this mod can be applied to (empty = category-based). */
  allowed_augments?: string[];
  /** Augment categories this mod can be applied to (empty = all). */
  allowed_categories?: string[];
  /** Availability rating. */
  availability: number;
  /** Mod category ('capacity', 'concealment', 'sensors', 'armor', 'cosmetic', 'utility'). */
  category?: string;
  /** Nuyen cost. */
  cost: number;
  /** Whether this mod only applies to cyberlimbs. */
  cyberlimb_only?: boolean;
  /** @deprecated Use `description` instead. */
  desc?: string;
  /** Full description. */
  description?: string;
  /** Additional Essence cost (some mods add essence cost). */
  essence_cost?: number;
  /** Icon name for display. */
  icon?: string;
  /** Unique identifier. */
  id: string;
  /** Legality rating ('R' = Restricted, 'F' = Forbidden). */
  legality?: string;
  /** Maximum number of this mod per augment. */
  max_per_augment?: number;
  /** Display name. */
  name: string;
  /** Sort order for display. */
  sort?: number;
  /** Stat bonuses provided (e.g., `{ sensor: 2 }`). */
  stat_bonuses?: Record<string, number>;
}

/**
 * Augment mod category definition.
 */
export interface AugmentModCategoryMeta {
  /** Description of the category. */
  description?: string;
  /** Icon for display. */
  icon?: string;
  /** Unique identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Sort order. */
  sort?: number;
}

/**
 * Lifestyle tier definition.
 *
 * Lifestyles represent living standards and monthly expenses.
 *
 * @see {@link LifestyleTier} for the tier identifiers.
 */
export interface LifestyleMeta {
  /** Monthly nuyen cost. */
  cost: number;
  /** Description of living conditions. */
  description?: string;
  /** Unique lifestyle identifier. */
  id: string;
  /** Display name (e.g., 'Street', 'Low', 'Middle', 'High', 'Luxury'). */
  name: string;
}
