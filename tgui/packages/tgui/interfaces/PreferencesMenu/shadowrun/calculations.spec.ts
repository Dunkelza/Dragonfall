/**
 * Unit tests for Shadowrun Character Generation Calculation Functions
 *
 * Tests cover:
 * - Derived stats (limits, condition monitors, composure, etc.)
 * - Point calculations (attributes, skills, special)
 * - Essence calculations (augments with grades, biocompatibility)
 * - Nuyen calculations (augments, gear, drones, lifestyle)
 * - Completion percentage
 * - Character validation
 */

import {
  AttributeInputs,
  calculateAttributePointsSpent,
  calculateAugmentEssenceCost,
  calculateAugmentNuyenCost,
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
import { AttributeMeta, ChargenState, DashboardData } from './types';

// ============================================================================
// Derived Stats Tests
// ============================================================================

describe('Derived Stats Calculations', () => {
  describe('calculatePhysicalLimit', () => {
    test('minimum attributes (all 1s)', () => {
      // (1*2 + 1 + 1) / 3 = 4/3 = 1.33 -> ceil = 2
      expect(calculatePhysicalLimit(1, 1, 1)).toBe(2);
    });

    test('average human attributes (all 3s)', () => {
      // (3*2 + 3 + 3) / 3 = 12/3 = 4
      expect(calculatePhysicalLimit(3, 3, 3)).toBe(4);
    });

    test('high attributes (STR 6, BOD 5, REA 4)', () => {
      // (6*2 + 5 + 4) / 3 = 21/3 = 7
      expect(calculatePhysicalLimit(6, 5, 4)).toBe(7);
    });

    test('troll maximum (STR 10, BOD 9, REA 5)', () => {
      // (10*2 + 9 + 5) / 3 = 34/3 = 11.33 -> ceil = 12
      expect(calculatePhysicalLimit(10, 9, 5)).toBe(12);
    });

    test('uneven stats requiring ceiling', () => {
      // (5*2 + 4 + 3) / 3 = 17/3 = 5.67 -> ceil = 6
      expect(calculatePhysicalLimit(5, 4, 3)).toBe(6);
    });
  });

  describe('calculateMentalLimit', () => {
    test('minimum attributes (all 1s)', () => {
      // (1*2 + 1 + 1) / 3 = 4/3 = 1.33 -> ceil = 2
      expect(calculateMentalLimit(1, 1, 1)).toBe(2);
    });

    test('average human attributes (all 3s)', () => {
      // (3*2 + 3 + 3) / 3 = 12/3 = 4
      expect(calculateMentalLimit(3, 3, 3)).toBe(4);
    });

    test('high logic character (LOG 7, INT 5, WIL 4)', () => {
      // (7*2 + 5 + 4) / 3 = 23/3 = 7.67 -> ceil = 8
      expect(calculateMentalLimit(7, 5, 4)).toBe(8);
    });
  });

  describe('calculateSocialLimit', () => {
    test('minimum attributes with full essence', () => {
      // (1*2 + 1 + 6) / 3 = 9/3 = 3
      expect(calculateSocialLimit(1, 1, 6)).toBe(3);
    });

    test('average attributes with full essence', () => {
      // (3*2 + 3 + 6) / 3 = 15/3 = 5
      expect(calculateSocialLimit(3, 3, 6)).toBe(5);
    });

    test('high charisma with reduced essence', () => {
      // (8*2 + 4 + 3) / 3 = 23/3 = 7.67 -> ceil = 8
      expect(calculateSocialLimit(8, 4, 3.5)).toBe(8);
    });

    test('essence is floored before calculation', () => {
      // (5*2 + 5 + floor(2.9)) / 3 = (10 + 5 + 2) / 3 = 17/3 = 5.67 -> ceil = 6
      expect(calculateSocialLimit(5, 5, 2.9)).toBe(6);
    });
  });

  describe('calculatePhysicalCM', () => {
    test('minimum body (BOD 1)', () => {
      // 8 + ceil(1/2) = 8 + 1 = 9
      expect(calculatePhysicalCM(1)).toBe(9);
    });

    test('average body (BOD 3)', () => {
      // 8 + ceil(3/2) = 8 + 2 = 10
      expect(calculatePhysicalCM(3)).toBe(10);
    });

    test('high body (BOD 8)', () => {
      // 8 + ceil(8/2) = 8 + 4 = 12
      expect(calculatePhysicalCM(8)).toBe(12);
    });

    test('troll body (BOD 10)', () => {
      // 8 + ceil(10/2) = 8 + 5 = 13
      expect(calculatePhysicalCM(10)).toBe(13);
    });
  });

  describe('calculateStunCM', () => {
    test('minimum willpower (WIL 1)', () => {
      // 8 + ceil(1/2) = 8 + 1 = 9
      expect(calculateStunCM(1)).toBe(9);
    });

    test('average willpower (WIL 3)', () => {
      // 8 + ceil(3/2) = 8 + 2 = 10
      expect(calculateStunCM(3)).toBe(10);
    });

    test('high willpower (WIL 7)', () => {
      // 8 + ceil(7/2) = 8 + 4 = 12
      expect(calculateStunCM(7)).toBe(12);
    });
  });

  describe('calculateDerivedStats', () => {
    test('calculates all stats from attribute inputs', () => {
      const attrs: AttributeInputs = {
        body: 4,
        agility: 5,
        reaction: 3,
        strength: 4,
        willpower: 3,
        logic: 4,
        intuition: 4,
        charisma: 2,
        essence: 6,
      };

      const stats = calculateDerivedStats(attrs);

      expect(stats.composure).toBe(5); // CHA + WIL = 2 + 3
      expect(stats.judgeIntentions).toBe(6); // CHA + INT = 2 + 4
      expect(stats.memory).toBe(7); // LOG + WIL = 4 + 3
      expect(stats.liftCarry).toBe(8); // STR + BOD = 4 + 4
      expect(stats.initiative).toBe(7); // REA + INT = 3 + 4
      expect(stats.physicalLimit).toBe(5); // ceil((4*2 + 4 + 3) / 3) = ceil(15/3) = 5
      expect(stats.mentalLimit).toBe(5); // ceil((4*2 + 4 + 3) / 3) = ceil(15/3) = 5
      expect(stats.socialLimit).toBe(5); // ceil((2*2 + 3 + 6) / 3) = ceil(13/3) = 5
      expect(stats.physicalCM).toBe(10); // 8 + ceil(4/2) = 10
      expect(stats.stunCM).toBe(10); // 8 + ceil(3/2) = 10
    });

    test('defaults essence to 6 if not provided', () => {
      const attrs: AttributeInputs = {
        body: 3,
        agility: 3,
        reaction: 3,
        strength: 3,
        willpower: 3,
        logic: 3,
        intuition: 3,
        charisma: 3,
      };

      const stats = calculateDerivedStats(attrs);
      // Social limit with default essence 6: ceil((3*2 + 3 + 6) / 3) = ceil(15/3) = 5
      expect(stats.socialLimit).toBe(5);
    });
  });
});

// ============================================================================
// Point Calculations Tests
// ============================================================================

describe('Point Calculations', () => {
  describe('calculateAttributePointsSpent', () => {
    const mockAttributesMeta: AttributeMeta[] = [
      { id: 'body', name: 'Body', min: 1, max: 6 },
      { id: 'agility', name: 'Agility', min: 1, max: 6 },
      { id: 'strength', name: 'Strength', min: 1, max: 6 },
    ];

    test('returns 0 when all attributes at minimum', () => {
      const attributes = { body: 1, agility: 1, strength: 1 };
      const bounds = {
        body: [1, 6] as [number, number],
        agility: [1, 6] as [number, number],
        strength: [1, 6] as [number, number],
      };

      expect(
        calculateAttributePointsSpent(attributes, mockAttributesMeta, bounds),
      ).toBe(0);
    });

    test('counts points spent above minimum', () => {
      const attributes = { body: 4, agility: 3, strength: 2 };
      const bounds = {
        body: [1, 6] as [number, number],
        agility: [1, 6] as [number, number],
        strength: [1, 6] as [number, number],
      };

      // (4-1) + (3-1) + (2-1) = 3 + 2 + 1 = 6
      expect(
        calculateAttributePointsSpent(attributes, mockAttributesMeta, bounds),
      ).toBe(6);
    });

    test('respects metatype-specific minimums', () => {
      const attributes = { body: 4, agility: 3, strength: 4 };
      // Troll has higher minimums
      const trollBounds = {
        body: [3, 9] as [number, number],
        agility: [1, 5] as [number, number],
        strength: [3, 9] as [number, number],
      };

      // (4-3) + (3-1) + (4-3) = 1 + 2 + 1 = 4
      expect(
        calculateAttributePointsSpent(
          attributes,
          mockAttributesMeta,
          trollBounds,
        ),
      ).toBe(4);
    });

    test('handles missing attributes gracefully', () => {
      const attributes = { body: 3 }; // Missing agility and strength
      const bounds = {
        body: [1, 6] as [number, number],
        agility: [1, 6] as [number, number],
        strength: [1, 6] as [number, number],
      };

      // (3-1) + 0 + 0 = 2
      expect(
        calculateAttributePointsSpent(attributes, mockAttributesMeta, bounds),
      ).toBe(2);
    });
  });

  describe('calculateSkillPointsSpent', () => {
    test('returns 0 with no skills', () => {
      expect(calculateSkillPointsSpent({}, {})).toBe(0);
    });

    test('counts skill ratings', () => {
      const skills = { firearms: 4, stealth: 3, athletics: 2 };
      expect(calculateSkillPointsSpent(skills, {})).toBe(9);
    });

    test('includes specialization costs', () => {
      const skills = { firearms: 4, stealth: 3 };
      const specs = { firearms: 'Pistols', stealth: 'Sneaking' };
      // 4 + 3 + 2 (specializations) = 9
      expect(calculateSkillPointsSpent(skills, specs)).toBe(9);
    });
  });

  describe('calculateSpecialPointsSpent', () => {
    test('returns 0 with no special attributes', () => {
      expect(calculateSpecialPointsSpent({})).toBe(0);
    });

    test('sums positive special attribute values', () => {
      const special = { edge: 3, magic: 5 };
      expect(calculateSpecialPointsSpent(special)).toBe(8);
    });

    test('ignores negative values', () => {
      const special = { edge: 2, magic: -1 };
      expect(calculateSpecialPointsSpent(special)).toBe(2);
    });
  });
});

// ============================================================================
// Essence Calculations Tests
// ============================================================================

describe('Essence Calculations', () => {
  describe('calculateAugmentEssenceCost', () => {
    test('standard grade has no multiplier', () => {
      expect(calculateAugmentEssenceCost(1.0, 'standard', false)).toBe(1.0);
    });

    test('alphaware reduces essence cost by 20%', () => {
      // 1.0 * 0.8 = 0.8
      expect(calculateAugmentEssenceCost(1.0, 'alphaware', false)).toBeCloseTo(
        0.8,
      );
    });

    test('betaware reduces essence cost by 40%', () => {
      // 1.0 * 0.6 = 0.6
      expect(calculateAugmentEssenceCost(1.0, 'betaware', false)).toBeCloseTo(
        0.6,
      );
    });

    test('deltaware reduces essence cost by 50%', () => {
      // 1.0 * 0.5 = 0.5
      expect(calculateAugmentEssenceCost(1.0, 'deltaware', false)).toBeCloseTo(
        0.5,
      );
    });

    test('used grade increases essence cost by 25%', () => {
      // 1.0 * 1.25 = 1.25
      expect(calculateAugmentEssenceCost(1.0, 'used', false)).toBeCloseTo(1.25);
    });

    test('biocompatibility reduces essence cost by 10%', () => {
      // 1.0 * 1.0 * 0.9 = 0.9
      expect(calculateAugmentEssenceCost(1.0, 'standard', true)).toBeCloseTo(
        0.9,
      );
    });

    test('biocompatibility stacks with grade', () => {
      // 1.0 * 0.8 * 0.9 = 0.72
      expect(calculateAugmentEssenceCost(1.0, 'alphaware', true)).toBeCloseTo(
        0.72,
      );
    });
  });

  describe('calculateTotalEssenceSpent', () => {
    const mockCatalog = {
      cyberarm: { essence_cost: 1.0 },
      datajack: { essence_cost: 0.1 },
      wired_reflexes: { essence_cost: 2.0 },
    };

    test('returns 0 with no augments', () => {
      expect(calculateTotalEssenceSpent({}, mockCatalog, false)).toBe(0);
    });

    test('sums essence costs for multiple augments', () => {
      const augments = {
        cyberarm: { id: 'cyberarm', grade: 'standard' },
        datajack: { id: 'datajack', grade: 'standard' },
      };
      expect(
        calculateTotalEssenceSpent(augments, mockCatalog, false),
      ).toBeCloseTo(1.1);
    });

    test('applies grade multipliers correctly', () => {
      const augments = {
        cyberarm: { id: 'cyberarm', grade: 'alphaware' }, // 1.0 * 0.8 = 0.8
        datajack: { id: 'datajack', grade: 'standard' }, // 0.1
      };
      expect(
        calculateTotalEssenceSpent(augments, mockCatalog, false),
      ).toBeCloseTo(0.9);
    });
  });
});

// ============================================================================
// Nuyen Calculations Tests
// ============================================================================

describe('Nuyen Calculations', () => {
  describe('calculateAugmentNuyenCost', () => {
    test('standard grade has no cost multiplier', () => {
      expect(calculateAugmentNuyenCost(10000, 'standard', false)).toBe(10000);
    });

    test('alphaware doubles cost', () => {
      expect(calculateAugmentNuyenCost(10000, 'alphaware', false)).toBe(20000);
    });

    test('used grade reduces cost by 25%', () => {
      expect(calculateAugmentNuyenCost(10000, 'used', false)).toBe(7500);
    });

    test('cyberlimb upgrades add cost', () => {
      // Base 15000 + (2 agi + 1 str) * 5000 = 15000 + 15000 = 30000
      expect(
        calculateAugmentNuyenCost(15000, 'standard', true, 2, 1, 5000),
      ).toBe(30000);
    });

    test('cyberlimb upgrades with custom cost', () => {
      // Base 15000 + (3 + 3) * 10000 = 15000 + 60000 = 75000
      expect(
        calculateAugmentNuyenCost(15000, 'standard', true, 3, 3, 10000),
      ).toBe(75000);
    });
  });

  describe('calculateGearNuyenSpent', () => {
    const mockGearCatalog = {
      pistol: { cost: 300 },
      armor_jacket: { cost: 1000 },
      commlink: { cost: 500 },
    };

    test('returns 0 with no gear', () => {
      expect(calculateGearNuyenSpent([], mockGearCatalog)).toBe(0);
    });

    test('sums gear costs', () => {
      const gear = [
        { id: 'pistol', quantity: 1 },
        { id: 'armor_jacket', quantity: 1 },
      ];
      expect(calculateGearNuyenSpent(gear, mockGearCatalog)).toBe(1300);
    });

    test('multiplies by quantity', () => {
      const gear = [{ id: 'commlink', quantity: 3 }];
      expect(calculateGearNuyenSpent(gear, mockGearCatalog)).toBe(1500);
    });

    test('handles missing gear gracefully', () => {
      const gear = [
        { id: 'pistol', quantity: 1 },
        { id: 'nonexistent', quantity: 1 },
      ];
      expect(calculateGearNuyenSpent(gear, mockGearCatalog)).toBe(300);
    });
  });

  describe('calculateDroneNuyenSpent', () => {
    const mockDroneCatalog = {
      rotodrone: { cost: 5000 },
      crawler: { cost: 2000 },
    };

    const mockModCatalog = {
      armor_upgrade: { cost: 1000 },
      sensor_upgrade: { cost: 500 },
    };

    test('returns 0 with no drones', () => {
      expect(
        calculateDroneNuyenSpent(null, mockDroneCatalog, mockModCatalog),
      ).toBe(0);
      expect(
        calculateDroneNuyenSpent(undefined, mockDroneCatalog, mockModCatalog),
      ).toBe(0);
    });

    test('handles legacy array format', () => {
      const drones = ['rotodrone', 'crawler'];
      expect(
        calculateDroneNuyenSpent(drones, mockDroneCatalog, mockModCatalog),
      ).toBe(7000);
    });

    test('handles new object format', () => {
      const drones = {
        rotodrone: { mods: [] },
        crawler: { mods: [] },
      };
      expect(
        calculateDroneNuyenSpent(drones, mockDroneCatalog, mockModCatalog),
      ).toBe(7000);
    });

    test('includes mod costs', () => {
      const drones = {
        rotodrone: { mods: ['armor_upgrade', 'sensor_upgrade'] },
      };
      // 5000 + 1000 + 500 = 6500
      expect(
        calculateDroneNuyenSpent(drones, mockDroneCatalog, mockModCatalog),
      ).toBe(6500);
    });
  });

  describe('getLifestyleCost', () => {
    const mockLifestyles = [
      { id: 'street', name: 'Street', cost: 0 },
      { id: 'squatter', name: 'Squatter', cost: 500 },
      { id: 'low', name: 'Low', cost: 2000 },
      { id: 'middle', name: 'Middle', cost: 5000 },
      { id: 'high', name: 'High', cost: 10000 },
      { id: 'luxury', name: 'Luxury', cost: 100000 },
    ];

    test('returns correct cost for each lifestyle', () => {
      expect(getLifestyleCost('street', mockLifestyles)).toBe(0);
      expect(getLifestyleCost('squatter', mockLifestyles)).toBe(500);
      expect(getLifestyleCost('low', mockLifestyles)).toBe(2000);
      expect(getLifestyleCost('middle', mockLifestyles)).toBe(5000);
      expect(getLifestyleCost('high', mockLifestyles)).toBe(10000);
      expect(getLifestyleCost('luxury', mockLifestyles)).toBe(100000);
    });

    test('returns default cost for unknown lifestyle', () => {
      expect(getLifestyleCost('unknown', mockLifestyles, 2000)).toBe(2000);
    });
  });
});

// ============================================================================
// Completion Percentage Tests
// ============================================================================

describe('calculateCompletionPercent', () => {
  test('returns 0 with no points allocated', () => {
    expect(calculateCompletionPercent(24, 24, 46, 46, 7, 7, false)).toBe(0);
  });

  test('returns 100 when fully complete and saved', () => {
    expect(calculateCompletionPercent(24, 0, 46, 0, 7, 0, true)).toBe(100);
  });

  test('returns ~86 when all points spent but not saved', () => {
    const percent = calculateCompletionPercent(24, 0, 46, 0, 7, 0, false);
    expect(percent).toBe(86); // 33 + 33 + 20 = 86
  });

  test('returns 14 when only saved', () => {
    expect(calculateCompletionPercent(24, 24, 46, 46, 7, 7, true)).toBe(14);
  });

  test('handles partial allocation', () => {
    // 50% attributes: 16.5 points
    // 50% skills: 16.5 points
    // 50% special: 10 points
    // Total: 43
    const percent = calculateCompletionPercent(24, 12, 46, 23, 7, 3.5, false);
    expect(percent).toBe(43);
  });

  test('handles zero totals gracefully', () => {
    expect(calculateCompletionPercent(0, 0, 0, 0, 0, 0, false)).toBe(0);
    expect(calculateCompletionPercent(0, 0, 0, 0, 0, 0, true)).toBe(14);
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('validateChargenState', () => {
  const createMockDashboardData = (
    overrides?: Partial<DashboardData>,
  ): DashboardData => ({
    attrRemaining: 0,
    attrSpent: 24,
    attrTotal: 24,
    skillRemaining: 0,
    skillSpent: 46,
    skillTotal: 46,
    specialRemaining: 0,
    specialTotal: 7,
    resources: 50000,
    nuyenRemaining: 10000,
    nuyenSpent: 40000,
    nuyenTotal: 50000,
    augmentNuyenSpent: 20000,
    droneNuyenSpent: 0,
    gearNuyenSpent: 10000,
    lifestyleCost: 2000,
    lifestyle: 'low',
    magicRating: 0,
    metatypeLetter: 'E',
    priorities: {
      metatype: 'E',
      attributes: 'A',
      magic: 'E',
      skills: 'B',
      resources: 'C',
    },
    effectiveAttributesMeta: [],
    essenceRemaining: 5.0,
    essenceSpent: 1.0,
    essenceTotal: 6.0,
    hasBiocompatibility: false,
    ...overrides,
  });

  const createMockChargenState = (
    overrides?: Partial<ChargenState>,
  ): ChargenState => ({
    priorities: {
      metatype: 'E',
      attributes: 'A',
      magic: 'E',
      skills: 'B',
      resources: 'C',
    },
    attributes: {},
    skills: {},
    skill_groups: {},
    special: {},
    awakening: 'mundane',
    metatype_species: '/datum/species/human',
    knowledge_skills: {},
    languages: {},
    native_language: 'English',
    contacts: [],
    augments: {},
    karma_spent: 0,
    saved: false,
    selected_spells: [],
    selected_powers: {},
    selected_complex_forms: [],
    ...overrides,
  });

  test('returns invalid result when inputs are null', () => {
    const result = validateChargenState(null, null);
    expect(result.isValid).toBe(false);
    expect(result.canSave).toBe(false);
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  test('returns valid and canSave when all points spent', () => {
    const dashboard = createMockDashboardData();
    const state = createMockChargenState();

    const result = validateChargenState(dashboard, state);
    expect(result.isValid).toBe(true);
    expect(result.canSave).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  test('reports error for overspent attributes', () => {
    const dashboard = createMockDashboardData({ attrRemaining: -3 });
    const state = createMockChargenState();

    const result = validateChargenState(dashboard, state);
    expect(result.canSave).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.issues[0].message).toContain('Overspent 3 attribute');
  });

  test('reports warning for unspent attributes', () => {
    const dashboard = createMockDashboardData({ attrRemaining: 5 });
    const state = createMockChargenState();

    const result = validateChargenState(dashboard, state);
    expect(result.canSave).toBe(true);
    expect(result.warningCount).toBe(1);
    expect(result.issues[0].message).toContain('5 attribute point(s) unspent');
  });

  test('reports error for overspent skills', () => {
    const dashboard = createMockDashboardData({ skillRemaining: -2 });
    const state = createMockChargenState();

    const result = validateChargenState(dashboard, state);
    expect(result.canSave).toBe(false);
    expect(result.errorCount).toBe(1);
  });

  test('reports error for negative essence', () => {
    const dashboard = createMockDashboardData({ essenceRemaining: -0.5 });
    const state = createMockChargenState();

    const result = validateChargenState(dashboard, state);
    expect(result.canSave).toBe(false);
    expect(result.issues.some((i) => i.message.includes('Essence'))).toBe(true);
  });

  test('reports error for overspent nuyen', () => {
    const dashboard = createMockDashboardData({ nuyenRemaining: -5000 });
    const state = createMockChargenState();

    const result = validateChargenState(dashboard, state);
    expect(result.canSave).toBe(false);
    expect(result.issues.some((i) => i.message.includes('Overspent'))).toBe(
      true,
    );
  });

  test('warns mage without tradition', () => {
    const dashboard = createMockDashboardData();
    const state = createMockChargenState({
      awakening: 'mage',
      priorities: {
        metatype: 'E',
        attributes: 'B',
        magic: 'A',
        skills: 'C',
        resources: 'D',
      },
    });

    const result = validateChargenState(dashboard, state);
    expect(result.warningCount).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.message.includes('tradition'))).toBe(
      true,
    );
  });

  test('warns mage without spells', () => {
    const dashboard = createMockDashboardData();
    const state = createMockChargenState({
      awakening: 'mage',
      priorities: {
        metatype: 'E',
        attributes: 'B',
        magic: 'A',
        skills: 'C',
        resources: 'D',
      },
      tradition: 'hermetic',
      selected_spells: [],
    });

    const result = validateChargenState(dashboard, state);
    expect(result.issues.some((i) => i.message.includes('spells'))).toBe(true);
  });

  test('accumulates multiple errors', () => {
    const dashboard = createMockDashboardData({
      attrRemaining: -3,
      skillRemaining: -2,
      nuyenRemaining: -5000,
    });
    const state = createMockChargenState();

    const result = validateChargenState(dashboard, state);
    expect(result.errorCount).toBe(3);
    expect(result.canSave).toBe(false);
  });
});
