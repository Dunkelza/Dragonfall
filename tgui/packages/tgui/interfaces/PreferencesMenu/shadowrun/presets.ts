/**
 * Character Presets/Templates for SR5 Character Generation
 *
 * These presets provide COMPLETE pre-built characters.
 * Each preset includes:
 * - Priority assignments
 * - Full attribute allocations (spending all attribute points)
 * - Full skill allocations (spending all skill points)
 * - Special attribute allocations (Edge/Magic/Resonance)
 * - Awakening type and tradition (for magic users)
 * - Spells/Powers/Complex Forms (for awakened)
 *
 * NOTE: These presets use the exact nuyen from their resource priority.
 * They do NOT add extra nuyen - gear/augments must fit the budget.
 */

import type { PriorityLetter } from './constants';
import type {
  AugmentSelection,
  AwakeningType,
  ChargenState,
  Contact,
  DroneSelection,
  GearSelection,
} from './types/api';

export interface CharacterPreset {
  /** Adept powers for adepts (power_id -> level) */
  adeptPowers?: Record<string, number>;
  /** Attribute point allocations (attribute_id -> rating) */
  attributes: Record<string, number>;
  /** Augments (augment_id -> selection) */
  augments?: Record<string, AugmentSelection>;
  /** Awakening type */
  awakening: AwakeningType;
  /** Complex forms for technomancers */
  complexForms?: string[];

  /** Contacts (connection, loyalty, name, type_id) */
  contacts?: Contact[];

  description: string;

  /** Drones (drone_id -> selection with mods) */
  drones?: Record<string, DroneSelection>;

  /** Gear selections */
  gear?: GearSelection[];

  icon: string;

  id: string;

  /** Knowledge skills (id -> rating) */
  knowledgeSkills?: Record<string, number>;

  /** Languages (language_id -> rating, 1-6) */
  languages?: Record<string, number>;

  /** Lifestyle tier */
  lifestyle?: string;

  /** Mentor spirit */
  mentorSpirit?: string;

  /** Metatype species path */
  metatype: string;

  name: string;

  /** Native language (full proficiency) */
  nativeLanguage?: string;

  playstyle: string;

  /** Priority assignments for each category */
  priorities: {
    attributes: PriorityLetter;
    magic: PriorityLetter;
    metatype: PriorityLetter;
    resources: PriorityLetter;
    skills: PriorityLetter;
  };

  /** Skill group allocations (group_id -> rating) */
  skillGroups?: Record<string, number>;

  /** Skill specializations (skill_id -> specialization name) */
  skillSpecializations?: Record<string, string>;

  /** Active skill allocations (skill_id -> rating) */
  skills: Record<string, number>;

  /** Special attribute allocations (edge/magic/resonance -> bonus points spent) */
  special: Record<string, number>;

  /** Selected spells for mages (spell IDs) */
  spells?: string[];

  /** Tradition for mages */
  tradition?: string;
}

// =============================================================================
// PRIORITY POINT VALUES (for reference when building presets)
// =============================================================================
// Attributes: A=24, B=20, C=16, D=14, E=12
// Skills: A=46, B=36, C=28, D=22, E=18
// Skill Groups: A=10, B=5, C=2, D=0, E=0
// Resources: A=450000, B=275000, C=140000, D=50000, E=6000
// Metatype Special: A=7, B=4, C=3, D=1, E=0
// Magic (Mage): A=6, B=4, C=3, D=2, E=0 (mundane)

/**
 * Predefined character archetypes - COMPLETE BUILDS
 */
export const CHARACTER_PRESETS: CharacterPreset[] = [
  // === COMBAT ARCHETYPES ===
  {
    id: 'street_samurai',
    name: 'Street Samurai',
    description:
      'Cybernetically enhanced combat specialist. Fast, deadly, and hard to kill.',
    icon: 'sword',
    playstyle:
      'Lead the charge in combat. Use your wired reflexes and cyberware to outgun opponents.',
    priorities: {
      metatype: 'D',
      attributes: 'B',
      magic: 'E',
      skills: 'C',
      resources: 'A',
    },
    metatype: '/datum/species/human',
    awakening: 'mundane',
    // Priority B = 20 points, human base 1s
    // Body 5, Agi 6, Rea 5, Str 3, Wil 3, Log 1, Int 4, Cha 1 = 4+5+4+2+2+0+3+0 = 20
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
    // Priority D metatype = 1 special point, all to Edge
    special: {
      edge: 1,
    },
    // Priority C = 28 skill points (5+4+4+3+3+3+3+2=27 skills + 1 spec = 28)
    skills: {
      '/datum/rpg_skill/automatics': 5,
      '/datum/rpg_skill/pistols': 4,
      '/datum/rpg_skill/blades': 4,
      '/datum/rpg_skill/gymnastics': 3,
      '/datum/rpg_skill/sneaking': 3,
      '/datum/rpg_skill/fine_motor': 3,
      '/datum/rpg_skill/bloodsport': 3,
      '/datum/rpg_skill/perception': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/automatics': 'Assault Rifles',
    },
    // Priority C = 2 skill group points
    skillGroups: {
      close_combat: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/security_procedures': 3,
      '/datum/rpg_knowledge_skill/underworld': 2,
    },
    // CHA 1 = 3 contact points (C+L per contact)
    contacts: [
      {
        type_id: '/datum/sr_contact/arms_dealer',
        name: 'Iron Mike',
        connection: 2,
        loyalty: 1,
      },
    ],
    // Bioware: Synaptic Booster R2 (1.0 Ess, ¥95k), Muscle Aug R2 (0.4 Ess, ¥14k),
    // Muscle Toner R2 (0.4 Ess, ¥16k), Bone Lacing Aluminum (1.0 Ess, ¥18k)
    // Total: 2.8 Essence, ¥143,000
    augments: {
      '/datum/augment_item/bioware/synaptic_booster/rating2': {
        id: '/datum/augment_item/bioware/synaptic_booster/rating2',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/muscle_augmentation/rating2': {
        id: '/datum/augment_item/bioware/muscle_augmentation/rating2',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/muscle_toner/rating2': {
        id: '/datum/augment_item/bioware/muscle_toner/rating2',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/bone_lacing/aluminum': {
        id: '/datum/augment_item/bioware/bone_lacing/aluminum',
        grade: 'standard',
      },
    },
    // Gear: AR (¥1,250), Heavy Pistol (¥725), Katana (¥1,000), Armor Jacket (¥1,000), Helmet (¥250)
    // Total Gear: ¥4,225
    gear: [
      { id: '/datum/sr_gear/weapon/assault_rifle/ak' },
      { id: '/datum/sr_gear/weapon/heavy_pistol' },
      { id: '/datum/sr_gear/weapon/melee/katana' },
      { id: '/datum/sr_gear/armor/jacket' },
      { id: '/datum/sr_gear/armor/helmet' },
    ],
    lifestyle: 'middle',
  },

  {
    id: 'tank',
    name: 'Tank / Bruiser',
    description:
      'Heavy muscle with focus on taking and dealing massive damage in melee.',
    icon: 'shield-alt',
    playstyle:
      'Soak damage and protect teammates. Excels at melee combat and intimidation.',
    priorities: {
      metatype: 'B',
      attributes: 'A',
      magic: 'E',
      skills: 'C',
      resources: 'D',
    },
    metatype: '/datum/species/ork',
    awakening: 'mundane',
    // Priority A = 24 points, ork has higher body/str base
    attributes: {
      '/datum/rpg_stat/body': 8,
      '/datum/rpg_stat/agility': 4,
      '/datum/rpg_stat/reaction': 4,
      '/datum/rpg_stat/strength': 7,
      '/datum/rpg_stat/willpower': 4,
      '/datum/rpg_stat/logic': 2,
      '/datum/rpg_stat/intuition': 3,
      '/datum/rpg_stat/charisma': 2,
    },
    // Priority B metatype = 4 special points
    special: {
      edge: 4,
    },
    // Priority C = 28 skill points (6+5+4+3+3+3+2+1=27 +1spec=28)
    skills: {
      '/datum/rpg_skill/clubs': 6,
      '/datum/rpg_skill/bloodsport': 5,
      '/datum/rpg_skill/intimidation': 4,
      '/datum/rpg_skill/gymnastics': 3,
      '/datum/rpg_skill/perception': 3,
      '/datum/rpg_skill/pistols': 3,
      '/datum/rpg_skill/throwing_weapons': 2,
      '/datum/rpg_skill/sneaking': 1,
    },
    skillSpecializations: {
      '/datum/rpg_skill/clubs': 'Hammers',
    },
    // Priority C = 2 skill group points
    skillGroups: {
      close_combat: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/underworld': 3,
      '/datum/rpg_knowledge_skill/gang_identification': 2,
    },
    // Ork knows Or'zet as secondary language
    languages: {
      '/datum/rpg_language/orzet': 4,
    },
    // CHA 2 = 6 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/gang_leader',
        name: 'Big Tusk',
        connection: 2,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/bartender',
        name: 'One-Eye Jack',
        connection: 1,
        loyalty: 1,
      },
    ],
    // Bioware: Bone Lacing Calcium (0.5 Ess, ¥8k), Muscle Aug R1 (0.2 Ess, ¥7k)
    // Total: 0.7 Essence, ¥15,000
    augments: {
      '/datum/augment_item/bioware/bone_lacing': {
        id: '/datum/augment_item/bioware/bone_lacing',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/muscle_augmentation': {
        id: '/datum/augment_item/bioware/muscle_augmentation',
        grade: 'standard',
      },
    },
    // Gear: Shotgun (¥950), Combat Knife (¥300), Armor Jacket (¥1,000), Helmet (¥250)
    // Total Gear: ¥2,500
    gear: [
      { id: '/datum/sr_gear/weapon/shotgun' },
      { id: '/datum/sr_gear/weapon/melee/combat_knife' },
      { id: '/datum/sr_gear/armor/jacket' },
      { id: '/datum/sr_gear/armor/helmet' },
    ],
    lifestyle: 'low',
  },

  {
    id: 'gunslinger',
    name: 'Gunslinger',
    description: 'Ranged combat expert with lightning-fast reflexes.',
    icon: 'crosshairs',
    playstyle: 'Specialize in firearms. Focus on accuracy and quick draws.',
    priorities: {
      metatype: 'D',
      attributes: 'A',
      magic: 'E',
      skills: 'B',
      resources: 'C',
    },
    metatype: '/datum/species/human',
    awakening: 'mundane',
    // Priority A = 24 points
    attributes: {
      '/datum/rpg_stat/body': 4,
      '/datum/rpg_stat/agility': 6,
      '/datum/rpg_stat/reaction': 6,
      '/datum/rpg_stat/strength': 3,
      '/datum/rpg_stat/willpower': 3,
      '/datum/rpg_stat/logic': 3,
      '/datum/rpg_stat/intuition': 5,
      '/datum/rpg_stat/charisma': 2,
    },
    // Priority D metatype = 1 special point
    special: {
      edge: 1,
    },
    // Priority B = 36 skill points (6+5+4+4+4+4+3+3+3=36, -1 for spec = need 35)
    skills: {
      '/datum/rpg_skill/pistols': 6,
      '/datum/rpg_skill/automatics': 5,
      '/datum/rpg_skill/longarms': 4,
      '/datum/rpg_skill/perception': 4,
      '/datum/rpg_skill/sneaking': 4,
      '/datum/rpg_skill/gymnastics': 4,
      '/datum/rpg_skill/fine_motor': 3,
      '/datum/rpg_skill/bloodsport': 3,
      '/datum/rpg_skill/intimidation': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/pistols': 'Semi-Automatics',
    },
    // Priority B = 5 skill group points
    skillGroups: {
      firearms: 3,
      stealth: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/military': 4,
      '/datum/rpg_knowledge_skill/security_procedures': 2,
    },
    // CHA 2 = 6 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/arms_dealer',
        name: 'Brass',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/bartender',
        name: 'Whiskey',
        connection: 1,
        loyalty: 1,
      },
    ],
    // Bioware: Synaptic Booster R1 (0.5 Ess, ¥47.5k), Muscle Toner R2 (0.4 Ess, ¥16k)
    // Total: 0.9 Essence, ¥63,500
    augments: {
      '/datum/augment_item/bioware/synaptic_booster': {
        id: '/datum/augment_item/bioware/synaptic_booster',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/muscle_toner/rating2': {
        id: '/datum/augment_item/bioware/muscle_toner/rating2',
        grade: 'standard',
      },
    },
    // Gear: 2x Heavy Pistol (¥1,450), Armored Clothing (¥450)
    // Total Gear: ¥1,900
    gear: [
      { id: '/datum/sr_gear/weapon/heavy_pistol' },
      { id: '/datum/sr_gear/weapon/heavy_pistol/ruger' },
      { id: '/datum/sr_gear/armor/clothing' },
    ],
    lifestyle: 'middle',
  },

  // === MAGIC ARCHETYPES ===
  {
    id: 'combat_mage',
    name: 'Combat Mage',
    description:
      'Hermetic spellcaster specializing in offensive magic and battlefield control.',
    icon: 'fire',
    playstyle:
      'Rain destruction from afar. Manage drain carefully and use spirits.',
    priorities: {
      metatype: 'D',
      attributes: 'C',
      magic: 'A',
      skills: 'B',
      resources: 'E',
    },
    metatype: '/datum/species/human',
    awakening: 'mage',
    // Priority C = 16 points, human base 1s
    // Body 3, Agi 2, Rea 2, Str 1, Wil 5, Log 5, Int 4, Cha 2 = 2+1+1+0+4+4+3+1 = 16
    attributes: {
      '/datum/rpg_stat/body': 3,
      '/datum/rpg_stat/agility': 2,
      '/datum/rpg_stat/reaction': 2,
      '/datum/rpg_stat/strength': 1,
      '/datum/rpg_stat/willpower': 5,
      '/datum/rpg_stat/logic': 5,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 2,
    },
    // Priority D = 1 special point
    special: {
      edge: 1,
    },
    // Priority B = 36 skill points (6+5+4+4+4+4+3+3+2=35 +1spec=36)
    skills: {
      '/datum/rpg_skill/spellcasting': 6,
      '/datum/rpg_skill/summoning': 5,
      '/datum/rpg_skill/counterspelling': 4,
      '/datum/rpg_skill/assensing': 4,
      '/datum/rpg_skill/perception': 4,
      '/datum/rpg_skill/arcana': 4,
      '/datum/rpg_skill/sneaking': 3,
      '/datum/rpg_skill/pistols': 3,
      '/datum/rpg_skill/gymnastics': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/spellcasting': 'Combat Spells',
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/magic_theory': 4,
      '/datum/rpg_knowledge_skill/parazoology': 3,
    },
    tradition: '/datum/sr_tradition/hermetic',
    // Dragonslayer: +2 Combat skill, +2 Combat spells - perfect for combat mage
    mentorSpirit: '/datum/sr_mentor_spirit/dragonslayer',
    spells: [
      '/datum/sr_spell/manabolt',
      '/datum/sr_spell/powerbolt',
      '/datum/sr_spell/stunbolt',
      '/datum/sr_spell/armor',
      '/datum/sr_spell/detect_life',
      '/datum/sr_spell/invisibility',
    ],
    // CHA 2 = 6 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/talismonger',
        name: 'Madame Laveau',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/bartender',
        name: 'Smoky',
        connection: 1,
        loyalty: 1,
      },
    ],
    // Resources E = ¥6,000 - Light Pistol (¥320), Armored Clothing (¥450), Commlink (¥100)
    // Total Gear: ¥870
    gear: [
      { id: '/datum/sr_gear/weapon/light_pistol' },
      { id: '/datum/sr_gear/armor/clothing' },
      { id: '/datum/sr_gear/electronics/commlink' },
    ],
    lifestyle: 'low',
  },

  {
    id: 'shaman',
    name: 'Shaman',
    description:
      'Spirit-focused magician with healing and support capabilities.',
    icon: 'leaf',
    playstyle: 'Summon spirits, heal allies, and provide magical support.',
    priorities: {
      metatype: 'D',
      attributes: 'C',
      magic: 'A',
      skills: 'B',
      resources: 'E',
    },
    metatype: '/datum/species/human',
    awakening: 'mage',
    // Priority C = 16 points, human base 1s
    // Body 3, Agi 1, Rea 2, Str 1, Wil 5, Log 3, Int 5, Cha 4 = 2+0+1+0+4+2+4+3 = 16
    attributes: {
      '/datum/rpg_stat/body': 3,
      '/datum/rpg_stat/agility': 1,
      '/datum/rpg_stat/reaction': 2,
      '/datum/rpg_stat/strength': 1,
      '/datum/rpg_stat/willpower': 5,
      '/datum/rpg_stat/logic': 3,
      '/datum/rpg_stat/intuition': 5,
      '/datum/rpg_stat/charisma': 4,
    },
    // Priority D metatype = 1 special point
    special: {
      edge: 1,
    },
    // Priority B = 36 skill points (6+5+4+4+4+4+3+3+2=35 +1spec=36)
    skills: {
      '/datum/rpg_skill/summoning': 6,
      '/datum/rpg_skill/spellcasting': 5,
      '/datum/rpg_skill/binding': 4,
      '/datum/rpg_skill/counterspelling': 4,
      '/datum/rpg_skill/assensing': 4,
      '/datum/rpg_skill/perception': 4,
      '/datum/rpg_skill/arcana': 3,
      '/datum/rpg_skill/negotiation': 3,
      '/datum/rpg_skill/sneaking': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/summoning': 'Spirits of Beasts',
    },
    // Priority B = 5 skill group points
    skillGroups: {
      influence: 3,
      outdoors: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/magic_theory': 3,
      '/datum/rpg_knowledge_skill/parazoology': 4,
    },
    tradition: '/datum/sr_tradition/shamanic',
    // Bear: +2 health spells, +2 plant spirits - ideal for healing shaman
    mentorSpirit: '/datum/sr_mentor_spirit/bear',
    spells: [
      '/datum/sr_spell/heal',
      '/datum/sr_spell/stabilize',
      '/datum/sr_spell/detect_life',
      '/datum/sr_spell/detect_magic',
      '/datum/sr_spell/armor',
      '/datum/sr_spell/stunbolt',
    ],
    // CHA 4 = 12 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/talismonger',
        name: 'Running Deer',
        connection: 3,
        loyalty: 3,
      },
      {
        type_id: '/datum/sr_contact/fixer',
        name: 'Shadow',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/bartender',
        name: 'Mama Rose',
        connection: 1,
        loyalty: 1,
      },
    ],
    // Resources E = ¥6,000 - Holdout Pistol (¥120), Armored Clothing (¥450), Medkit (¥200), Commlink (¥100)
    // Total Gear: ¥870
    gear: [
      { id: '/datum/sr_gear/weapon/holdout_pistol' },
      { id: '/datum/sr_gear/armor/clothing' },
      { id: '/datum/sr_gear/medical/medkit' },
      { id: '/datum/sr_gear/electronics/commlink' },
    ],
    lifestyle: 'low',
  },

  {
    id: 'adept',
    name: 'Physical Adept',
    description:
      'Mystic warrior channeling magic through body. No cyberware needed.',
    icon: 'fist-raised',
    playstyle:
      'Use adept powers to enhance combat. Mix martial arts with magical abilities.',
    priorities: {
      metatype: 'C',
      attributes: 'A',
      magic: 'B',
      skills: 'D',
      resources: 'E',
    },
    metatype: '/datum/species/elf',
    awakening: 'adept',
    // Priority A = 24 points
    attributes: {
      '/datum/rpg_stat/body': 4,
      '/datum/rpg_stat/agility': 6,
      '/datum/rpg_stat/reaction': 5,
      '/datum/rpg_stat/strength': 5,
      '/datum/rpg_stat/willpower': 4,
      '/datum/rpg_stat/logic': 2,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 3,
    },
    // Priority C metatype = 3 special points
    special: {
      edge: 1,
      magic: 2,
    },
    // Priority D = 22 skill points (5+4+4+3+3+2=21 +1spec=22)
    skills: {
      '/datum/rpg_skill/bloodsport': 5,
      '/datum/rpg_skill/blades': 4,
      '/datum/rpg_skill/gymnastics': 4,
      '/datum/rpg_skill/sneaking': 3,
      '/datum/rpg_skill/perception': 3,
      '/datum/rpg_skill/throwing_weapons': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/bloodsport': 'Martial Arts',
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/combat_biking': 4,
      '/datum/rpg_knowledge_skill/underworld': 2,
    },
    // Elf knows Sperethiel as secondary language
    languages: {
      '/datum/rpg_language/sperethiel': 4,
    },
    adeptPowers: {
      '/datum/sr_adept_power/improved_reflexes': 1,
      '/datum/sr_adept_power/killing_hands': 1,
      '/datum/sr_adept_power/mystic_armor': 1,
      '/datum/sr_adept_power/improved_ability': 1,
    },
    // Wolf: +2 Tracking, +2 Combat spells - pack hunter mentality for martial artist
    mentorSpirit: '/datum/sr_mentor_spirit/wolf',
    // CHA 3 = 9 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/fixer',
        name: 'Silk',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/bartender',
        name: 'Old Chen',
        connection: 2,
        loyalty: 2,
      },
    ],
    // Resources E = ¥6,000 - Katana (¥1,000), Armored Clothing (¥450), Combat Knife (¥300)
    // Total Gear: ¥1,750 (melee focus for martial artist)
    gear: [
      { id: '/datum/sr_gear/weapon/melee/katana' },
      { id: '/datum/sr_gear/armor/clothing' },
      { id: '/datum/sr_gear/weapon/melee/combat_knife' },
    ],
    lifestyle: 'squatter',
  },

  {
    id: 'mystic_adept',
    name: 'Mystic Adept',
    description:
      'Hybrid caster combining adept powers with limited spellcasting.',
    icon: 'yin-yang',
    playstyle:
      'Versatile combat magic user. Balance adept abilities and spells.',
    priorities: {
      metatype: 'D',
      attributes: 'B',
      magic: 'A',
      skills: 'C',
      resources: 'E',
    },
    metatype: '/datum/species/human',
    awakening: 'mystic_adept',
    // Priority B = 20 points, human base 1s
    // Body 3, Agi 4, Rea 4, Str 3, Wil 4, Log 3, Int 4, Cha 3 = 2+3+3+2+3+2+3+2 = 20
    attributes: {
      '/datum/rpg_stat/body': 3,
      '/datum/rpg_stat/agility': 4,
      '/datum/rpg_stat/reaction': 4,
      '/datum/rpg_stat/strength': 3,
      '/datum/rpg_stat/willpower': 4,
      '/datum/rpg_stat/logic': 3,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 3,
    },
    // Priority D metatype = 1 special point
    special: {
      edge: 1,
    },
    // Priority C = 28 skill points (5+5+3+3+3+3+3+3=28, -1 for spec = need 27)
    skills: {
      '/datum/rpg_skill/spellcasting': 5,
      '/datum/rpg_skill/bloodsport': 5,
      '/datum/rpg_skill/counterspelling': 3,
      '/datum/rpg_skill/assensing': 3,
      '/datum/rpg_skill/sneaking': 3,
      '/datum/rpg_skill/perception': 3,
      '/datum/rpg_skill/gymnastics': 3,
      '/datum/rpg_skill/arcana': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/spellcasting': 'Combat Spells',
    },
    // Priority C = 2 skill group points
    skillGroups: {
      close_combat: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/magic_theory': 3,
      '/datum/rpg_knowledge_skill/combat_biking': 3,
    },
    tradition: '/datum/sr_tradition/hermetic',
    spells: [
      '/datum/sr_spell/manabolt',
      '/datum/sr_spell/armor',
      '/datum/sr_spell/detect_life',
    ],
    adeptPowers: {
      '/datum/sr_adept_power/improved_reflexes': 1,
      '/datum/sr_adept_power/killing_hands': 1,
    },
    // Wise Warrior: +2 Combat skill, +2 Detection spells - balance of martial arts and magic
    mentorSpirit: '/datum/sr_mentor_spirit/wise_warrior',
    // CHA 3 = 9 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/talismonger',
        name: 'Mystic Mike',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/fixer',
        name: 'Needle',
        connection: 2,
        loyalty: 2,
      },
    ],
    // Resources E = ¥6,000 - Combat Knife (¥300), Light Pistol (¥320), Armored Clothing (¥450)
    // Total Gear: ¥1,070
    gear: [
      { id: '/datum/sr_gear/weapon/melee/combat_knife' },
      { id: '/datum/sr_gear/weapon/light_pistol' },
      { id: '/datum/sr_gear/armor/clothing' },
    ],
    lifestyle: 'squatter',
  },

  // === TECH ARCHETYPES ===
  {
    id: 'decker',
    name: 'Decker',
    description:
      'Elite hacker specializing in Matrix operations and electronic warfare.',
    icon: 'laptop-code',
    playstyle:
      'Control the Matrix. Hack security, gather intel, and disable systems.',
    priorities: {
      metatype: 'D',
      attributes: 'C',
      magic: 'E',
      skills: 'B',
      resources: 'A',
    },
    metatype: '/datum/species/human',
    awakening: 'mundane',
    // Priority C = 16 points, human base 1s
    // Body 2, Agi 2, Rea 3, Str 1, Wil 3, Log 6, Int 4, Cha 1 = 1+1+2+0+2+5+3+2 = 16
    attributes: {
      '/datum/rpg_stat/body': 2,
      '/datum/rpg_stat/agility': 2,
      '/datum/rpg_stat/reaction': 3,
      '/datum/rpg_stat/strength': 1,
      '/datum/rpg_stat/willpower': 3,
      '/datum/rpg_stat/logic': 6,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 3,
    },
    // Priority D metatype = 1 special point
    special: {
      edge: 1,
    },
    // Priority B = 36 skill points (6+5+5+5+4+3+3+3+2=36, -1 for spec = need 35)
    skills: {
      '/datum/rpg_skill/hacking': 6,
      '/datum/rpg_skill/cybercombat': 5,
      '/datum/rpg_skill/electronic_warfare': 5,
      '/datum/rpg_skill/computer': 5,
      '/datum/rpg_skill/software': 4,
      '/datum/rpg_skill/hardware': 3,
      '/datum/rpg_skill/perception': 3,
      '/datum/rpg_skill/pistols': 3,
      '/datum/rpg_skill/sneaking': 1,
    },
    skillSpecializations: {
      '/datum/rpg_skill/hacking': 'Hosts',
    },
    // Priority B = 5 skill group points
    skillGroups: {
      cracking: 3,
      electronics: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/matrix_theory': 4,
      '/datum/rpg_knowledge_skill/security_procedures': 3,
    },
    // CHA 3 = 9 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/decker_contact',
        name: 'Zero Cool',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/fixer',
        name: 'Socket',
        connection: 2,
        loyalty: 2,
      },
    ],
    // Bioware: Cerebral Booster R2 (0.4 Ess, ¥31.5k), Mnemonic Enhancer R2 (0.4 Ess, ¥31.5k)
    // Total: 0.8 Essence, ¥63,000 (Leaving budget for cyberdeck)
    augments: {
      '/datum/augment_item/bioware/cerebral_booster/rating2': {
        id: '/datum/augment_item/bioware/cerebral_booster/rating2',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/mnemonic_enhancer/rating2': {
        id: '/datum/augment_item/bioware/mnemonic_enhancer/rating2',
        grade: 'standard',
      },
    },
    // Gear: Cyberdeck (¥49,500), Light Pistol (¥320), Armored Clothing (¥450), Commlink (¥1,000)
    // Total Gear: ¥51,270
    gear: [
      { id: '/datum/sr_gear/electronics/cyberdeck' },
      { id: '/datum/sr_gear/weapon/light_pistol' },
      { id: '/datum/sr_gear/armor/clothing' },
      { id: '/datum/sr_gear/electronics/commlink/renraku' },
    ],
    lifestyle: 'middle',
  },

  {
    id: 'technomancer',
    name: 'Technomancer',
    description:
      'Awakened Matrix user with innate ability to interface with technology.',
    icon: 'microchip',
    playstyle:
      'Use Resonance to manipulate the Matrix without a deck. Compile sprites.',
    priorities: {
      metatype: 'D',
      attributes: 'C',
      magic: 'A',
      skills: 'B',
      resources: 'E',
    },
    metatype: '/datum/species/human',
    awakening: 'technomancer',
    // Priority C = 16 points, human base 1s
    // Body 2, Agi 2, Rea 2, Str 1, Wil 4, Log 5, Int 5, Cha 3 = 1+1+1+0+3+4+4+2 = 16
    attributes: {
      '/datum/rpg_stat/body': 2,
      '/datum/rpg_stat/agility': 2,
      '/datum/rpg_stat/reaction': 2,
      '/datum/rpg_stat/strength': 1,
      '/datum/rpg_stat/willpower': 4,
      '/datum/rpg_stat/logic': 5,
      '/datum/rpg_stat/intuition': 5,
      '/datum/rpg_stat/charisma': 3,
    },
    // Priority D metatype = 1 special point
    special: {
      edge: 1,
    },
    // Priority B = 36 skill points (5+5+4+4+4+4+4+3+2=35 +1spec=36)
    skills: {
      '/datum/rpg_skill/hacking': 5,
      '/datum/rpg_skill/compiling': 5,
      '/datum/rpg_skill/registering': 4,
      '/datum/rpg_skill/software': 4,
      '/datum/rpg_skill/computer': 4,
      '/datum/rpg_skill/electronic_warfare': 4,
      '/datum/rpg_skill/perception': 4,
      '/datum/rpg_skill/sneaking': 3,
      '/datum/rpg_skill/pistols': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/compiling': 'Machine Sprites',
    },
    // Priority B = 5 skill group points
    skillGroups: {
      cracking: 3,
      electronics: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/matrix_theory': 4,
      '/datum/rpg_knowledge_skill/sprawl_life': 3,
    },
    complexForms: [
      '/datum/sr_complex_form/puppeteer',
      '/datum/sr_complex_form/cleaner',
      '/datum/sr_complex_form/diffusion_of_attack',
      '/datum/sr_complex_form/resonance_spike',
      '/datum/sr_complex_form/static_veil',
      '/datum/sr_complex_form/transcendent_grid',
    ],
    // CHA 3 = 9 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/decker',
        name: 'Glitch',
        connection: 3,
        loyalty: 3,
      },
      {
        type_id: '/datum/sr_contact/bartender',
        name: 'Static',
        connection: 2,
        loyalty: 1,
      },
    ],
    // Resources E = ¥6,000 - Light Pistol (¥320), Armored Clothing (¥450), Commlink (¥100)
    // Total Gear: ¥870 (Technomancers don't need cyberdecks)
    gear: [
      { id: '/datum/sr_gear/weapon/light_pistol' },
      { id: '/datum/sr_gear/armor/clothing' },
      { id: '/datum/sr_gear/electronics/commlink' },
    ],
    lifestyle: 'low',
  },

  {
    id: 'rigger',
    name: 'Rigger',
    description:
      'Drone operator and vehicle specialist. Control the battlefield remotely.',
    icon: 'robot',
    playstyle:
      'Deploy drones for recon and combat. Jump into vehicles for pursuits.',
    priorities: {
      metatype: 'D',
      attributes: 'C',
      magic: 'E',
      skills: 'B',
      resources: 'A',
    },
    metatype: '/datum/species/human',
    awakening: 'mundane',
    // Priority C = 16 points, human base 1s
    // Body 2, Agi 2, Rea 4, Str 1, Wil 3, Log 5, Int 4, Cha 2 = 1+1+3+0+2+4+3+1 = 16
    attributes: {
      '/datum/rpg_stat/body': 2,
      '/datum/rpg_stat/agility': 2,
      '/datum/rpg_stat/reaction': 4,
      '/datum/rpg_stat/strength': 1,
      '/datum/rpg_stat/willpower': 3,
      '/datum/rpg_stat/logic': 5,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 2,
    },
    // Priority D metatype = 1 special point
    special: {
      edge: 1,
    },
    // Priority B = 36 skill points (6+4+5+4+4+4+3+3+2=35 +1spec=36)
    skills: {
      '/datum/rpg_skill/pilot_ground': 6,
      '/datum/rpg_skill/pilot_aircraft': 4,
      '/datum/rpg_skill/gunnery': 5,
      '/datum/rpg_skill/electronic_warfare': 4,
      '/datum/rpg_skill/hardware': 4,
      '/datum/rpg_skill/perception': 4,
      '/datum/rpg_skill/sneaking': 3,
      '/datum/rpg_skill/automatics': 3,
      '/datum/rpg_skill/navigation': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/pilot_ground': 'Remote Operation',
    },
    // Priority B = 5 skill group points
    skillGroups: {
      electronics: 3,
      engineering: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/engineering': 4,
      '/datum/rpg_knowledge_skill/military': 3,
    },
    // CHA 2 = 6 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/vehicle_dealer',
        name: 'Gearhead',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/mechanic',
        name: 'Wrench',
        connection: 1,
        loyalty: 1,
      },
    ],
    // Bioware: Cerebral Booster R2 (0.4 Ess, ¥31.5k), Mnemonic Enhancer R1 (0.2 Ess, ¥15.75k)
    // Total: 0.6 Essence, ¥47,250 (Leaving budget for drones/vehicle)
    augments: {
      '/datum/augment_item/bioware/cerebral_booster/rating2': {
        id: '/datum/augment_item/bioware/cerebral_booster/rating2',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/mnemonic_enhancer': {
        id: '/datum/augment_item/bioware/mnemonic_enhancer',
        grade: 'standard',
      },
    },
    // Gear: SMG (¥830), Armored Clothing (¥450), Toolkit (¥500), Commlink (¥1,000)
    // Total Gear: ¥2,780
    gear: [
      { id: '/datum/sr_gear/weapon/smg' },
      { id: '/datum/sr_gear/armor/clothing' },
      { id: '/datum/sr_gear/tools/toolkit' },
      { id: '/datum/sr_gear/electronics/commlink/renraku' },
    ],
    // Drones: Roto-Drone (¥5,000), Doberman (¥5,000), 2x Fly-Spy (¥4,000), Crawler (¥4,000)
    // Total Drones: ¥18,000
    drones: {
      '/datum/sr_drone/small/rotodrone': { mods: [] },
      '/datum/sr_drone/medium/doberman': { mods: [] },
      '/datum/sr_drone/micro/flyspy': { mods: [] },
      '/datum/sr_drone/small/crawler': { mods: [] },
    },
    lifestyle: 'middle',
  },

  // === SOCIAL ARCHETYPES ===
  {
    id: 'face',
    name: 'Face',
    description:
      'Social expert and team negotiator. Talks the team in and out of trouble.',
    icon: 'comments',
    playstyle: 'Lead social encounters. Negotiate deals and manipulate NPCs.',
    priorities: {
      metatype: 'C',
      attributes: 'B',
      magic: 'E',
      skills: 'A',
      resources: 'D',
    },
    metatype: '/datum/species/elf',
    awakening: 'mundane',
    // Priority B = 20 points
    attributes: {
      '/datum/rpg_stat/body': 3,
      '/datum/rpg_stat/agility': 4,
      '/datum/rpg_stat/reaction': 3,
      '/datum/rpg_stat/strength': 2,
      '/datum/rpg_stat/willpower': 4,
      '/datum/rpg_stat/logic': 4,
      '/datum/rpg_stat/intuition': 5,
      '/datum/rpg_stat/charisma': 6,
    },
    // Priority C metatype = 3 special points
    special: {
      edge: 3,
    },
    // Priority A = 46 skill points (6+6+5+5+4+4+4+4+4+4=46, -1 for spec = need 45)
    skills: {
      '/datum/rpg_skill/negotiation': 6,
      '/datum/rpg_skill/con': 6,
      '/datum/rpg_skill/etiquette': 5,
      '/datum/rpg_skill/leadership': 5,
      '/datum/rpg_skill/impersonation': 4,
      '/datum/rpg_skill/performance': 4,
      '/datum/rpg_skill/perception': 4,
      '/datum/rpg_skill/pistols': 4,
      '/datum/rpg_skill/sneaking': 4,
      '/datum/rpg_skill/disguise': 3,
    },
    skillSpecializations: {
      '/datum/rpg_skill/negotiation': 'Bargaining',
    },
    // Priority A = 10 skill group points
    skillGroups: {
      influence: 5,
      acting: 3,
      stealth: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/corporate_politics': 4,
      '/datum/rpg_knowledge_skill/law': 3,
      '/datum/rpg_knowledge_skill/underworld': 2,
    },
    // Elf knows Sperethiel + Japanese for social dealings
    languages: {
      '/datum/rpg_language/sperethiel': 4,
      '/datum/rpg_language/japanese': 3,
    },
    // CHA 6 = 18 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/fixer_high',
        name: 'Mr. Johnson',
        connection: 4,
        loyalty: 3,
      },
      {
        type_id: '/datum/sr_contact/corporate_insider',
        name: 'Alexandra Chen',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/lawyer',
        name: 'Marcus Wright',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/bartender',
        name: 'Velvet',
        connection: 1,
        loyalty: 1,
      },
    ],
    // Bioware: Tailored Pheromones R2 (0.4 Ess, ¥31.5k)
    // Total: 0.4 Essence, ¥31,500
    augments: {
      '/datum/augment_item/bioware/tailored_pheromones/rating2': {
        id: '/datum/augment_item/bioware/tailored_pheromones/rating2',
        grade: 'standard',
      },
    },
    // Gear: Light Pistol (¥320), Armored Clothing (¥450), Commlink (¥3,000)
    // Total Gear: ¥3,770
    gear: [
      { id: '/datum/sr_gear/weapon/light_pistol' },
      { id: '/datum/sr_gear/armor/clothing' },
      { id: '/datum/sr_gear/electronics/commlink/transys' },
    ],
    lifestyle: 'middle',
  },

  {
    id: 'infiltrator',
    name: 'Infiltrator',
    description:
      'Stealth specialist excelling at bypassing security and gathering intel.',
    icon: 'user-secret',
    playstyle:
      'Get in unseen. Specialize in stealth, lockpicking, and security bypass.',
    priorities: {
      metatype: 'D',
      attributes: 'B',
      magic: 'E',
      skills: 'A',
      resources: 'C',
    },
    metatype: '/datum/species/elf',
    awakening: 'mundane',
    // Priority B = 20 points, elf base (Agi 2, Cha 3)
    // Body 3, Agi 6, Rea 5, Str 3, Wil 3, Log 4, Int 5, Cha 3 = 2+4+4+2+2+3+4+0 = 21 - need to reduce 1
    // Body 3, Agi 6, Rea 4, Str 3, Wil 3, Log 4, Int 5, Cha 3 = 2+4+3+2+2+3+4+0 = 20
    attributes: {
      '/datum/rpg_stat/body': 3,
      '/datum/rpg_stat/agility': 6,
      '/datum/rpg_stat/reaction': 4,
      '/datum/rpg_stat/strength': 3,
      '/datum/rpg_stat/willpower': 3,
      '/datum/rpg_stat/logic': 4,
      '/datum/rpg_stat/intuition': 5,
      '/datum/rpg_stat/charisma': 3,
    },
    // Priority D metatype = 1 special point
    special: {
      edge: 1,
    },
    // Priority A = 46 skill points (6+6+5+5+5+4+4+4+4+3=46, -1 for spec = need 45)
    skills: {
      '/datum/rpg_skill/sneaking': 6,
      '/datum/rpg_skill/locksmith': 6,
      '/datum/rpg_skill/gymnastics': 5,
      '/datum/rpg_skill/perception': 5,
      '/datum/rpg_skill/fine_motor': 5,
      '/datum/rpg_skill/disguise': 4,
      '/datum/rpg_skill/escape_artist': 4,
      '/datum/rpg_skill/pistols': 4,
      '/datum/rpg_skill/electronic_warfare': 4,
      '/datum/rpg_skill/blades': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/sneaking': 'Urban',
    },
    // Priority A = 10 skill group points
    skillGroups: {
      stealth: 5,
      athletics: 3,
      electronics: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/security_procedures': 4,
      '/datum/rpg_knowledge_skill/engineering': 3,
    },
    // Elf knows Sperethiel as secondary language
    languages: {
      '/datum/rpg_language/sperethiel': 4,
    },
    // CHA 3 = 9 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/forger',
        name: 'Inkwell',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/smuggler',
        name: 'Ghost',
        connection: 2,
        loyalty: 2,
      },
    ],
    // Bioware: Muscle Toner R2 (0.4 Ess, ¥16k), Enhanced Articulation (0.3 Ess, ¥12k)
    // Total: 0.7 Essence, ¥28,000
    augments: {
      '/datum/augment_item/bioware/muscle_toner/rating2': {
        id: '/datum/augment_item/bioware/muscle_toner/rating2',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/enhanced_articulation': {
        id: '/datum/augment_item/bioware/enhanced_articulation',
        grade: 'standard',
      },
    },
    // Gear: Light Pistol (¥320), Combat Knife (¥300), Lockpicks (¥250), Autopicker (¥500), Armored Clothing (¥450)
    // Total Gear: ¥1,820
    gear: [
      { id: '/datum/sr_gear/weapon/light_pistol' },
      { id: '/datum/sr_gear/weapon/melee/combat_knife' },
      { id: '/datum/sr_gear/tools/lockpicks' },
      { id: '/datum/sr_gear/tools/autopicker' },
      { id: '/datum/sr_gear/armor/clothing' },
    ],
    lifestyle: 'middle',
  },

  // === SPECIALIST ARCHETYPES ===
  {
    id: 'medic',
    name: 'Street Doc / Medic',
    description:
      'Combat medic keeping the team alive through biotech and first aid.',
    icon: 'medkit',
    playstyle: 'Patch up teammates mid-combat. Carry medical supplies.',
    priorities: {
      metatype: 'D',
      attributes: 'C',
      magic: 'E',
      skills: 'A',
      resources: 'B',
    },
    metatype: '/datum/species/human',
    awakening: 'mundane',
    // Priority C = 16 points, human base 1s
    // Body 2, Agi 2, Rea 2, Str 1, Wil 4, Log 6, Int 4, Cha 2 = 1+1+1+0+3+5+3+1 = 16
    attributes: {
      '/datum/rpg_stat/body': 2,
      '/datum/rpg_stat/agility': 2,
      '/datum/rpg_stat/reaction': 2,
      '/datum/rpg_stat/strength': 1,
      '/datum/rpg_stat/willpower': 4,
      '/datum/rpg_stat/logic': 6,
      '/datum/rpg_stat/intuition': 4,
      '/datum/rpg_stat/charisma': 2,
    },
    // Priority D metatype = 1 special point
    special: {
      edge: 1,
    },
    // Priority A = 46 skill points (6+6+5+4+4+4+4+4+3+3+3=46, -1 for spec = need 45)
    skills: {
      '/datum/rpg_skill/first_aid': 6,
      '/datum/rpg_skill/medicine': 6,
      '/datum/rpg_skill/biotech': 5,
      '/datum/rpg_skill/chemistry': 4,
      '/datum/rpg_skill/perception': 4,
      '/datum/rpg_skill/pistols': 4,
      '/datum/rpg_skill/sneaking': 4,
      '/datum/rpg_skill/negotiation': 4,
      '/datum/rpg_skill/gymnastics': 3,
      '/datum/rpg_skill/computer': 3,
      '/datum/rpg_skill/anatomy': 2,
    },
    skillSpecializations: {
      '/datum/rpg_skill/first_aid': 'Gunshot Wounds',
    },
    // Priority A = 10 skill group points
    skillGroups: {
      biotech: 5,
      athletics: 3,
      influence: 2,
    },
    knowledgeSkills: {
      '/datum/rpg_knowledge_skill/medicine_knowledge': 5,
      '/datum/rpg_knowledge_skill/chemistry': 3,
    },
    // CHA 2 = 6 contact points
    contacts: [
      {
        type_id: '/datum/sr_contact/street_doc',
        name: 'Dr. Bones',
        connection: 3,
        loyalty: 2,
      },
      {
        type_id: '/datum/sr_contact/taxi_driver',
        name: 'Fast Eddie',
        connection: 1,
        loyalty: 1,
      },
    ],
    // Bioware: Platelet Factories (0.2 Ess, ¥17k), Enhanced Articulation (0.3 Ess, ¥12k)
    // Total: 0.5 Essence, ¥29,000
    augments: {
      '/datum/augment_item/bioware/platelet_factories': {
        id: '/datum/augment_item/bioware/platelet_factories',
        grade: 'standard',
      },
      '/datum/augment_item/bioware/enhanced_articulation': {
        id: '/datum/augment_item/bioware/enhanced_articulation',
        grade: 'standard',
      },
    },
    // Gear: Light Pistol (¥320), Medkit (¥200), Trauma Patches x3 (¥1,500), Armor Vest (¥500)
    // Total Gear: ¥2,520
    gear: [
      { id: '/datum/sr_gear/weapon/light_pistol' },
      { id: '/datum/sr_gear/medical/medkit' },
      { id: '/datum/sr_gear/medical/medkit/trauma', quantity: 3 },
      { id: '/datum/sr_gear/armor/vest' },
    ],
    lifestyle: 'middle',
  },
];

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): CharacterPreset | undefined {
  return CHARACTER_PRESETS.find((p) => p.id === id);
}

/**
 * Group presets by category for UI display
 */
export function getPresetsByCategory(): Record<string, CharacterPreset[]> {
  return {
    Combat: CHARACTER_PRESETS.filter((p) =>
      ['street_samurai', 'tank', 'gunslinger'].includes(p.id),
    ),
    Magic: CHARACTER_PRESETS.filter((p) =>
      ['combat_mage', 'shaman', 'adept', 'mystic_adept'].includes(p.id),
    ),
    Tech: CHARACTER_PRESETS.filter((p) =>
      ['decker', 'technomancer', 'rigger'].includes(p.id),
    ),
    Social: CHARACTER_PRESETS.filter((p) =>
      ['face', 'infiltrator'].includes(p.id),
    ),
    Specialist: CHARACTER_PRESETS.filter((p) => ['medic'].includes(p.id)),
  };
}

/**
 * Convert a CharacterPreset to a partial ChargenState
 * This applies all the preset's allocations to create a ready-to-use character
 */
export function presetToChargenState(
  preset: CharacterPreset,
): Partial<ChargenState> {
  const state: Partial<ChargenState> = {
    // Priorities
    priorities: preset.priorities,

    // Metatype and awakening
    metatype_species: preset.metatype,
    awakening: preset.awakening,

    // Attributes
    attributes: preset.attributes,

    // Special attributes
    special: preset.special,

    // Skills
    skills: preset.skills,
    skill_groups: preset.skillGroups || {},
    skill_specializations: preset.skillSpecializations || {},

    // Knowledge
    knowledge_skills: preset.knowledgeSkills || {},

    // Magic
    tradition: preset.tradition,
    mentor_spirit: preset.mentorSpirit,
    selected_spells: preset.spells || [],
    selected_powers: preset.adeptPowers || {},
    selected_complex_forms: preset.complexForms || [],

    // Augments
    augments: preset.augments || {},

    // Gear
    gear: preset.gear || [],

    // Drones
    drones: preset.drones || {},

    // Lifestyle
    lifestyle: preset.lifestyle,

    // Reset karma
    karma_spent: 0,
    karma_purchases: {},

    // Contacts from preset or empty
    contacts: preset.contacts || [],

    // Languages from preset or default to English
    languages: preset.languages || {},
    native_language: preset.nativeLanguage || '/datum/rpg_language/english',
  };

  return state;
}
