/**
 * Shared types for Shadowrun character generation components
 */

// Common props passed to most chargen components
export type ChargenComponentProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  value: ChargenState | null;
};

// Extended props for components that need embedded mode
export type EmbeddableChargenProps = ChargenComponentProps & {
  embedded?: boolean;
};

// Extended props for components that need dashboard data
export type DashboardChargenProps = ChargenComponentProps & {
  dashboardData: DashboardData | null;
};

// Chargen state stored in preferences
export interface ChargenState {
  // Attributes (id -> rating)
  attributes: Record<string, number>;

  // Augments (augmentId -> { id, grade })
  augments: Record<string, AugmentSelection>;

  // Magic
  awakening: 'mundane' | 'mage' | 'adept' | 'mystic_adept' | 'technomancer';
  birthplace?: string;
  // Character notes
  character_notes?: CharacterNotes;

  // Contacts
  contacts: Contact[];

  // Drones
  drones?: Record<string, DroneSelection>;
  // Starting gear
  gear?: GearSelection[];
  karma_purchases?: Record<string, number>;
  // Karma system
  karma_spent: number;
  // Knowledge & Languages
  knowledge_skills: Record<string, number>;
  languages: Record<string, number>;

  // Lifestyle
  lifestyle?: string;

  mentor_spirit?: string;
  // Metatype
  metatype_species: string;
  native_language: string;

  // Priority selection
  priorities: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>;

  religion?: string;
  // Lock state
  saved: boolean;
  selected_complex_forms: string[];

  selected_powers: Record<string, number>;

  selected_spells: string[];
  // SIN Extended Data
  sin_status?: string;

  skill_groups: Record<string, number>;

  skill_specializations?: Record<string, string>;

  // Skills
  skills: Record<string, number>;

  // Special attributes
  special: Record<string, number>;

  tradition?: string;
}

export interface Contact {
  connection: number;
  loyalty: number;
  name: string;
  type_id: string;
}

export interface AugmentSelection {
  agi_upgrade?: number;
  grade: string;
  id: string;
  str_upgrade?: number;
}

export interface DroneSelection {
  mods: string[];
}

export interface CharacterNotes {
  exploitable_info: string;
  general: string;
  medical_record: string;
  security_record: string;
}

// Constant data from server
export interface ChargenConstData {
  adept_powers: AdeptPowerMeta[];
  attributes: AttributeMeta[];
  augment_catalog?: Record<string, AugmentMeta>;
  augment_categories?: Record<string, AugmentCategoryMeta>;
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

export interface AugmentCategoryMeta {
  description?: string;
  icon?: string;
  id?: string;
  name: string;
}

export interface CyberwareSuiteMeta {
  augments: string[];
  description?: string;
  discount?: number;
  icon?: string;
  id: string;
  name: string;
}

export interface AwakeningChoiceMeta {
  id: string;
  name: string;
}

export interface MetatypeChoiceMeta {
  id: string;
  min_priority: string;
  name: string;
}

export interface AttributeMeta {
  category?: string;
  id: string;
  max: number;
  min: number;
  name: string;
}

export interface PriorityTables {
  attributes: Record<string, number>;
  magic: Record<string, number>;
  metatype: Record<string, string[]>;
  metatype_special?: Record<string, number>;
  resources: Record<string, number>;
  skill_groups?: Record<string, number>;
  skills: Record<string, number>;
}

export interface SkillMeta {
  attribute: string;
  category: string;
  group?: string;
  id: string;
  name: string;
  parent_stat_name?: string;
  specializations?: string[];
}

export interface SkillGroupMeta {
  id: string;
  name: string;
  skills: string[];
}

export interface TraditionMeta {
  description?: string;
  drain_attribute: string;
  id: string;
  name: string;
}

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

export interface KnowledgeSkillMeta {
  category: string;
  id: string;
  name: string;
}

export interface LanguageMeta {
  desc?: string;
  description?: string;
  id: string;
  name: string;
}

export interface ContactTypeMeta {
  archetype: string;
  id: string;
  name: string;
  profession: string;
  specialty?: string;
}

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

export interface GearCategoryMeta {
  id: string;
  name: string;
}

export interface GearSelection {
  id: string;
  quantity?: number;
}

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

export interface DroneCategoryMeta {
  id: string;
  name: string;
  sort?: number;
}

export interface LifestyleMeta {
  cost: number;
  description?: string;
  id: string;
  name: string;
}

// Dashboard calculated data
export interface DashboardData {
  attrRemaining: number;
  attrSpent: number;
  attrTotal: number;
  augmentNuyenSpent: number;
  effectiveAttributesMeta: AttributeMeta[];
  essenceRemaining: number;
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
  priorities: Record<string, string>;
  resources: number;
  skillRemaining: number;
  skillSpent: number;
  skillTotal: number;
  specialRemaining: number;
  specialTotal: number;
}

// Validation types
export interface ValidationIssue {
  message: string;
  section: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  canSave: boolean;
  errorCount: number;
  isValid: boolean;
  issues: ValidationIssue[];
  warningCount: number;
}

// Derived statistics calculated from attributes
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

// Priority types
export const PRIORITY_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
export type PriorityLetter = (typeof PRIORITY_LETTERS)[number];

export const PRIORITY_CATEGORIES = [
  'metatype',
  'attributes',
  'magic',
  'skills',
  'resources',
] as const;
export type PriorityCategory = (typeof PRIORITY_CATEGORIES)[number];

// Augment grades
export const AUGMENT_GRADES = [
  { id: 'used', name: 'Used', essenceMult: 1.25, costMult: 0.75 },
  { id: 'standard', name: 'Standard', essenceMult: 1.0, costMult: 1.0 },
  { id: 'alphaware', name: 'Alphaware', essenceMult: 0.8, costMult: 2.0 },
  { id: 'betaware', name: 'Betaware', essenceMult: 0.6, costMult: 4.0 },
  { id: 'deltaware', name: 'Deltaware', essenceMult: 0.5, costMult: 10.0 },
] as const;
