/**
 * E2E Test Fixtures for SR5 Character Generation
 *
 * These fixtures provide realistic mock data for testing the chargen workflow.
 * They mirror the server data structures expected by ShadowrunPage and its components.
 */

import type { PriorityLetter } from '../constants';
import type { ChargenState } from '../types/api';

// =============================================================================
// MOCK SERVER DATA FIXTURES
// =============================================================================

/**
 * Mock priority table data (mirrors server priority_table)
 */
export const mockPriorityTable = {
  metatype: {
    A: { special: 7, metatypes: ['human', 'elf', 'dwarf', 'ork', 'troll'] },
    B: { special: 4, metatypes: ['human', 'elf', 'dwarf', 'ork', 'troll'] },
    C: { special: 3, metatypes: ['human', 'elf', 'dwarf', 'ork'] },
    D: { special: 1, metatypes: ['human', 'elf'] },
    E: { special: 0, metatypes: ['human'] },
  },
  attributes: {
    A: { points: 24 },
    B: { points: 20 },
    C: { points: 16 },
    D: { points: 14 },
    E: { points: 12 },
  },
  magic: {
    A: { rating: 6, type: 'full' },
    B: { rating: 4, type: 'full' },
    C: { rating: 3, type: 'aspected' },
    D: { rating: 2, type: 'adept' },
    E: { rating: 0, type: 'mundane' },
  },
  skills: {
    A: { points: 46, groups: 10 },
    B: { points: 36, groups: 5 },
    C: { points: 28, groups: 2 },
    D: { points: 22, groups: 0 },
    E: { points: 18, groups: 0 },
  },
  resources: {
    A: { nuyen: 450000 },
    B: { nuyen: 275000 },
    C: { nuyen: 140000 },
    D: { nuyen: 50000 },
    E: { nuyen: 6000 },
  },
};

/**
 * Mock attribute metadata
 */
export const mockAttributesMeta = [
  {
    id: '/datum/rpg_stat/body',
    name: 'Body',
    abbreviation: 'BOD',
    category: 'physical',
  },
  {
    id: '/datum/rpg_stat/agility',
    name: 'Agility',
    abbreviation: 'AGI',
    category: 'physical',
  },
  {
    id: '/datum/rpg_stat/reaction',
    name: 'Reaction',
    abbreviation: 'REA',
    category: 'physical',
  },
  {
    id: '/datum/rpg_stat/strength',
    name: 'Strength',
    abbreviation: 'STR',
    category: 'physical',
  },
  {
    id: '/datum/rpg_stat/willpower',
    name: 'Willpower',
    abbreviation: 'WIL',
    category: 'mental',
  },
  {
    id: '/datum/rpg_stat/logic',
    name: 'Logic',
    abbreviation: 'LOG',
    category: 'mental',
  },
  {
    id: '/datum/rpg_stat/intuition',
    name: 'Intuition',
    abbreviation: 'INT',
    category: 'mental',
  },
  {
    id: '/datum/rpg_stat/charisma',
    name: 'Charisma',
    abbreviation: 'CHA',
    category: 'mental',
  },
];

/**
 * Mock metatype data
 */
export const mockMetatypes = {
  '/datum/species/human': {
    id: '/datum/species/human',
    name: 'Human',
    attribute_minimums: {
      body: 1,
      agility: 1,
      reaction: 1,
      strength: 1,
      willpower: 1,
      logic: 1,
      intuition: 1,
      charisma: 1,
    },
    attribute_maximums: {
      body: 6,
      agility: 6,
      reaction: 6,
      strength: 6,
      willpower: 6,
      logic: 6,
      intuition: 6,
      charisma: 6,
    },
    base_edge: 2,
    edge_max: 7,
  },
  '/datum/species/elf': {
    id: '/datum/species/elf',
    name: 'Elf',
    attribute_minimums: {
      body: 1,
      agility: 2,
      reaction: 1,
      strength: 1,
      willpower: 1,
      logic: 1,
      intuition: 1,
      charisma: 3,
    },
    attribute_maximums: {
      body: 6,
      agility: 7,
      reaction: 6,
      strength: 6,
      willpower: 6,
      logic: 6,
      intuition: 6,
      charisma: 8,
    },
    base_edge: 1,
    edge_max: 6,
  },
  '/datum/species/dwarf': {
    id: '/datum/species/dwarf',
    name: 'Dwarf',
    attribute_minimums: {
      body: 3,
      agility: 1,
      reaction: 1,
      strength: 3,
      willpower: 2,
      logic: 1,
      intuition: 1,
      charisma: 1,
    },
    attribute_maximums: {
      body: 8,
      agility: 6,
      reaction: 5,
      strength: 8,
      willpower: 7,
      logic: 6,
      intuition: 6,
      charisma: 6,
    },
    base_edge: 1,
    edge_max: 6,
  },
  '/datum/species/ork': {
    id: '/datum/species/ork',
    name: 'Ork',
    attribute_minimums: {
      body: 4,
      agility: 1,
      reaction: 1,
      strength: 3,
      willpower: 1,
      logic: 1,
      intuition: 1,
      charisma: 1,
    },
    attribute_maximums: {
      body: 9,
      agility: 6,
      reaction: 6,
      strength: 8,
      willpower: 6,
      logic: 5,
      intuition: 6,
      charisma: 5,
    },
    base_edge: 1,
    edge_max: 6,
  },
  '/datum/species/troll': {
    id: '/datum/species/troll',
    name: 'Troll',
    attribute_minimums: {
      body: 5,
      agility: 1,
      reaction: 1,
      strength: 5,
      willpower: 1,
      logic: 1,
      intuition: 1,
      charisma: 1,
    },
    attribute_maximums: {
      body: 10,
      agility: 5,
      reaction: 6,
      strength: 10,
      willpower: 6,
      logic: 5,
      intuition: 6,
      charisma: 4,
    },
    base_edge: 1,
    edge_max: 6,
  },
};

/**
 * Mock skills catalog
 */
export const mockSkillsCatalog = [
  {
    id: 'automatics',
    name: 'Automatics',
    category: 'combat',
    group: 'firearms',
    default: true,
  },
  {
    id: 'blades',
    name: 'Blades',
    category: 'combat',
    group: 'close_combat',
    default: true,
  },
  {
    id: 'clubs',
    name: 'Clubs',
    category: 'combat',
    group: 'close_combat',
    default: true,
  },
  {
    id: 'longarms',
    name: 'Longarms',
    category: 'combat',
    group: 'firearms',
    default: true,
  },
  {
    id: 'pistols',
    name: 'Pistols',
    category: 'combat',
    group: 'firearms',
    default: true,
  },
  {
    id: 'unarmed_combat',
    name: 'Unarmed Combat',
    category: 'combat',
    group: 'close_combat',
    default: true,
  },
  {
    id: 'sneaking',
    name: 'Sneaking',
    category: 'physical',
    group: 'stealth',
    default: true,
  },
  {
    id: 'palming',
    name: 'Palming',
    category: 'physical',
    group: 'stealth',
    default: false,
  },
  {
    id: 'perception',
    name: 'Perception',
    category: 'physical',
    group: null,
    default: true,
  },
  {
    id: 'con',
    name: 'Con',
    category: 'social',
    group: 'acting',
    default: true,
  },
  {
    id: 'etiquette',
    name: 'Etiquette',
    category: 'social',
    group: 'influence',
    default: true,
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    category: 'social',
    group: 'influence',
    default: true,
  },
  {
    id: 'computer',
    name: 'Computer',
    category: 'technical',
    group: 'electronics',
    default: true,
  },
  {
    id: 'hacking',
    name: 'Hacking',
    category: 'technical',
    group: 'cracking',
    default: false,
  },
  {
    id: 'spellcasting',
    name: 'Spellcasting',
    category: 'magical',
    group: 'sorcery',
    default: false,
  },
  {
    id: 'summoning',
    name: 'Summoning',
    category: 'magical',
    group: 'conjuring',
    default: false,
  },
];

/**
 * Mock spells catalog
 */
export const mockSpellsCatalog = [
  {
    id: 'manabolt',
    name: 'Manabolt',
    category: 'combat',
    type: 'mana',
    range: 'los',
    damage: 'p',
    drain: 3,
  },
  {
    id: 'powerbolt',
    name: 'Powerbolt',
    category: 'combat',
    type: 'physical',
    range: 'los',
    damage: 'p',
    drain: 5,
  },
  {
    id: 'fireball',
    name: 'Fireball',
    category: 'combat',
    type: 'physical',
    range: 'los_a',
    damage: 'p',
    drain: 6,
  },
  {
    id: 'heal',
    name: 'Heal',
    category: 'health',
    type: 'mana',
    range: 'touch',
    drain: 4,
  },
  {
    id: 'increase_reflexes',
    name: 'Increase Reflexes',
    category: 'health',
    type: 'physical',
    range: 'touch',
    drain: 5,
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    category: 'illusion',
    type: 'mana',
    range: 'los',
    drain: 3,
  },
  {
    id: 'physical_mask',
    name: 'Physical Mask',
    category: 'illusion',
    type: 'physical',
    range: 'touch',
    drain: 4,
  },
  {
    id: 'armor',
    name: 'Armor',
    category: 'manipulation',
    type: 'physical',
    range: 'los',
    drain: 4,
  },
  {
    id: 'levitate',
    name: 'Levitate',
    category: 'manipulation',
    type: 'physical',
    range: 'los',
    drain: 5,
  },
  {
    id: 'detect_life',
    name: 'Detect Life',
    category: 'detection',
    type: 'mana',
    range: 'touch',
    drain: 2,
  },
];

/**
 * Mock augments catalog
 */
export const mockAugmentsCatalog = {
  wired_reflexes_1: {
    id: 'wired_reflexes_1',
    name: 'Wired Reflexes 1',
    essence: 2.0,
    cost: 39000,
    category: 'cyberware',
  },
  wired_reflexes_2: {
    id: 'wired_reflexes_2',
    name: 'Wired Reflexes 2',
    essence: 3.0,
    cost: 149000,
    category: 'cyberware',
  },
  smartlink: {
    id: 'smartlink',
    name: 'Smartlink',
    essence: 0.2,
    cost: 4000,
    category: 'cyberware',
  },
  cybereyes_1: {
    id: 'cybereyes_1',
    name: 'Cybereyes Rating 1',
    essence: 0.2,
    cost: 4000,
    category: 'cyberware',
  },
  muscle_replacement_1: {
    id: 'muscle_replacement_1',
    name: 'Muscle Replacement 1',
    essence: 1.0,
    cost: 25000,
    category: 'cyberware',
  },
  bone_lacing_aluminum: {
    id: 'bone_lacing_aluminum',
    name: 'Bone Lacing (Aluminum)',
    essence: 1.0,
    cost: 18000,
    category: 'cyberware',
  },
  datajack: {
    id: 'datajack',
    name: 'Datajack',
    essence: 0.1,
    cost: 1000,
    category: 'cyberware',
  },
};

/**
 * Mock gear catalog
 */
export const mockGearCatalog = {
  ares_predator: {
    id: 'ares_predator',
    name: 'Ares Predator V',
    cost: 725,
    category: 'weapons',
  },
  ak97: { id: 'ak97', name: 'AK-97', cost: 950, category: 'weapons' },
  combat_knife: {
    id: 'combat_knife',
    name: 'Combat Knife',
    cost: 300,
    category: 'weapons',
  },
  armor_jacket: {
    id: 'armor_jacket',
    name: 'Armor Jacket',
    cost: 1000,
    category: 'armor',
  },
  helmet: { id: 'helmet', name: 'Helmet', cost: 100, category: 'armor' },
  commlink_meta: {
    id: 'commlink_meta',
    name: 'Meta Link Commlink',
    cost: 100,
    category: 'electronics',
  },
  commlink_sony: {
    id: 'commlink_sony',
    name: 'Sony Angel Commlink',
    cost: 200,
    category: 'electronics',
  },
  medkit_3: {
    id: 'medkit_3',
    name: 'Medkit Rating 3',
    cost: 750,
    category: 'medical',
  },
};

// =============================================================================
// CHARGEN STATE FACTORIES
// =============================================================================

/**
 * Creates a fresh, empty chargen state
 */
export function createEmptyChargenState(): ChargenState {
  return {
    priorities: {},
    metatype_species: '/datum/species/human',
    awakening: 'mundane',
    attributes: {},
    special: {},
    skills: {},
    skill_groups: {},
    skill_specializations: {},
    tradition: undefined,
    mentor_spirit: undefined,
    selected_spells: [],
    selected_powers: {},
    selected_complex_forms: [],
    augments: {},
    gear: [],
    drones: {},
    lifestyle: 'low',
    knowledge_skills: {},
    languages: {},
    native_language: 'english',
    contacts: [],
    sin_status: 'national',
    birthplace: 'Seattle',
    religion: 'none',
    character_notes: { background: '', personality: '', goals: '' },
    karma_spent: 0,
    karma_purchases: {},
    saved: false,
  };
}

/**
 * Creates a chargen state with priorities assigned
 */
export function createStateWithPriorities(
  priorities: Record<string, PriorityLetter>,
): ChargenState {
  return {
    ...createEmptyChargenState(),
    priorities,
  };
}

/**
 * Creates a complete street samurai build for testing
 */
export function createStreetSamuraiState(): ChargenState {
  return {
    ...createEmptyChargenState(),
    priorities: {
      metatype: 'D',
      attributes: 'B',
      magic: 'E',
      skills: 'C',
      resources: 'A',
    },
    metatype_species: '/datum/species/human',
    awakening: 'mundane',
    attributes: {
      '/datum/rpg_stat/body': 5,
      '/datum/rpg_stat/agility': 6,
      '/datum/rpg_stat/reaction': 5,
      '/datum/rpg_stat/strength': 3,
      '/datum/rpg_stat/willpower': 3,
      '/datum/rpg_stat/logic': 1,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 1,
    },
    special: { edge: 1 },
    skills: {
      automatics: 6,
      pistols: 4,
      sneaking: 4,
      perception: 4,
      blades: 3,
      unarmed_combat: 3,
      etiquette: 2,
      negotiation: 2,
    },
    augments: {
      wired_reflexes_2: { grade: 'standard', rating: 1 },
      smartlink: { grade: 'standard', rating: 1 },
    },
    gear: [
      { id: 'ares_predator', quantity: 1 },
      { id: 'ak97', quantity: 1 },
      { id: 'armor_jacket', quantity: 1 },
      { id: 'commlink_sony', quantity: 1 },
    ],
    lifestyle: 'middle',
    saved: false,
  };
}

/**
 * Creates a complete mage build for testing
 */
export function createMageState(): ChargenState {
  return {
    ...createEmptyChargenState(),
    priorities: {
      metatype: 'E',
      attributes: 'B',
      magic: 'A',
      skills: 'C',
      resources: 'D',
    },
    metatype_species: '/datum/species/human',
    awakening: 'mage',
    attributes: {
      '/datum/rpg_stat/body': 2,
      '/datum/rpg_stat/agility': 3,
      '/datum/rpg_stat/reaction': 3,
      '/datum/rpg_stat/strength': 1,
      '/datum/rpg_stat/willpower': 5,
      '/datum/rpg_stat/logic': 5,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 3,
    },
    special: { magic: 0 }, // Starts at 6 from Priority A
    tradition: 'hermetic',
    selected_spells: [
      'manabolt',
      'heal',
      'invisibility',
      'armor',
      'detect_life',
    ],
    skills: {
      spellcasting: 6,
      summoning: 5,
      perception: 4,
      assensing: 4,
      con: 3,
      etiquette: 3,
      arcana: 3,
    },
    lifestyle: 'low',
    saved: false,
  };
}

/**
 * Creates a complete decker build for testing
 */
export function createDeckerState(): ChargenState {
  return {
    ...createEmptyChargenState(),
    priorities: {
      metatype: 'D',
      attributes: 'C',
      magic: 'E',
      skills: 'B',
      resources: 'A',
    },
    metatype_species: '/datum/species/human',
    awakening: 'mundane',
    attributes: {
      '/datum/rpg_stat/body': 2,
      '/datum/rpg_stat/agility': 3,
      '/datum/rpg_stat/reaction': 3,
      '/datum/rpg_stat/strength': 1,
      '/datum/rpg_stat/willpower': 3,
      '/datum/rpg_stat/logic': 6,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 2,
    },
    special: { edge: 1 }, // Priority D gives 1 special point
    skills: {
      computer: 6,
      hacking: 6,
      cybercombat: 5,
      software: 5,
      hardware: 4,
      perception: 3,
      pistols: 3,
      sneaking: 2,
      etiquette: 2,
    },
    augments: {
      datajack: { grade: 'standard', rating: 1 },
      cybereyes_1: { grade: 'alphaware', rating: 1 },
    },
    lifestyle: 'middle',
    saved: false,
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Checks if all priorities are assigned (one letter per category, no duplicates)
 */
export function arePrioritiesComplete(
  priorities: Record<string, PriorityLetter | undefined>,
): boolean {
  const categories = ['metatype', 'attributes', 'magic', 'skills', 'resources'];
  const usedLetters = new Set<string>();

  for (const category of categories) {
    const letter = priorities[category];
    if (!letter) return false;
    if (usedLetters.has(letter)) return false;
    usedLetters.add(letter);
  }

  return usedLetters.size === 5;
}

/**
 * Counts total attribute points spent
 */
export function countAttributePointsSpent(
  attributes: Record<string, number>,
  metatypeId: string,
): number {
  const metatype = mockMetatypes[metatypeId as keyof typeof mockMetatypes];
  if (!metatype) return 0;

  let spent = 0;
  for (const attr of mockAttributesMeta) {
    const current = attributes[attr.id] || 1;
    const min = 1; // Simplified, would use metatype.attribute_minimums
    spent += Math.max(0, current - min);
  }
  return spent;
}

/**
 * Counts total skill points spent
 */
export function countSkillPointsSpent(skills: Record<string, number>): number {
  return Object.values(skills).reduce((sum, rating) => sum + rating, 0);
}

/**
 * Calculates total essence spent on augments
 */
export function countEssenceSpent(
  augments: Record<string, { grade: string; rating: number }>,
): number {
  const gradeMultipliers: Record<string, number> = {
    used: 1.25,
    standard: 1.0,
    alphaware: 0.8,
    betaware: 0.6,
    deltaware: 0.5,
  };

  let total = 0;
  for (const [augmentId, selection] of Object.entries(augments)) {
    const augment =
      mockAugmentsCatalog[augmentId as keyof typeof mockAugmentsCatalog];
    if (augment) {
      const multiplier = gradeMultipliers[selection.grade] || 1.0;
      total += augment.essence * multiplier;
    }
  }
  return total;
}

/**
 * Calculates total nuyen spent on gear
 */
export function countNuyenSpent(
  gear: Array<{ id: string; quantity: number }>,
  augments: Record<string, { grade: string; rating: number }>,
): number {
  const gradeMultipliers: Record<string, number> = {
    used: 0.75,
    standard: 1.0,
    alphaware: 2.0,
    betaware: 4.0,
    deltaware: 10.0,
  };

  let total = 0;

  // Gear costs
  for (const item of gear) {
    const gearItem = mockGearCatalog[item.id as keyof typeof mockGearCatalog];
    if (gearItem) {
      total += gearItem.cost * item.quantity;
    }
  }

  // Augment costs
  for (const [augmentId, selection] of Object.entries(augments)) {
    const augment =
      mockAugmentsCatalog[augmentId as keyof typeof mockAugmentsCatalog];
    if (augment) {
      const multiplier = gradeMultipliers[selection.grade] || 1.0;
      total += augment.cost * multiplier;
    }
  }

  return total;
}
