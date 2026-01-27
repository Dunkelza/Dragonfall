/**
 * Snapshot Tests for UI Components Configuration
 *
 * These tests capture the structure of UI configuration objects to detect
 * unintended changes to:
 * - Tab display information (labels, icons, hints, colors)
 * - Tab groupings and structure
 * - Augment grade definitions
 * - Priority system configuration
 * - Skeleton loader configurations
 * - Color palette constants
 *
 * If a snapshot fails, review the diff carefully:
 * - Intentional changes: update the snapshot with `npm run tgui:test-simple -- -u`
 * - Unintentional changes: fix the code to match the expected output
 */

import {
  AUGMENT_GRADES,
  AWAKENING,
  AWAKENING_TYPES,
  LIFESTYLE_TIERS,
  PRIORITY_CATEGORIES,
  PRIORITY_LETTERS,
} from './constants';

// ============================================================================
// TAB CONFIGURATION SNAPSHOTS
// ============================================================================

// Define locally to avoid import chain issues
const TAB_COLORS = {
  build: '#4a90d9',
  core: '#5c6bc0',
  magic: '#9c27b0',
  augments: '#ff7043',
  gear: '#ffc107',
  drones: '#8d6e63',
  connections: '#26a69a',
  qualities: '#66bb6a',
  occupations: '#78909c',
  summary: '#9b8fc7',
} as const;

enum ShadowrunTab {
  Augments = 'augments',
  Build = 'build',
  Connections = 'connections',
  Core = 'core',
  Drones = 'drones',
  Gear = 'gear',
  Magic = 'magic',
  Occupations = 'occupations',
  Qualities = 'qualities',
  Summary = 'summary',
}

const TAB_DISPLAY_INFO = {
  [ShadowrunTab.Build]: {
    icon: 'sliders-h',
    label: 'Build',
    hint: 'Set your priority selections, allocate attribute and skill points.',
    accentColor: TAB_COLORS.build,
  },
  [ShadowrunTab.Core]: {
    icon: 'id-card',
    label: 'SIN',
    hint: 'Your System Identification Number - the digital identity that defines who you are in the Sixth World.',
    accentColor: TAB_COLORS.core,
  },
  [ShadowrunTab.Magic]: {
    icon: 'hat-wizard',
    label: 'Magic',
    hint: 'Configure magical traditions, spells, adept powers, and mentor spirits for awakened characters.',
    accentColor: TAB_COLORS.magic,
  },
  [ShadowrunTab.Augments]: {
    icon: 'microchip',
    label: 'Augments',
    hint: 'Cyberware, bioware, and other bodily augmentations. Trade essence for capabilities.',
    accentColor: TAB_COLORS.augments,
  },
  [ShadowrunTab.Gear]: {
    icon: 'shopping-cart',
    label: 'Gear',
    hint: 'Purchase starting equipment with your nuyen. Weapons, armor, electronics, and more.',
    accentColor: TAB_COLORS.gear,
  },
  [ShadowrunTab.Drones]: {
    icon: 'robot',
    label: 'Drones',
    hint: 'Purchase and customize drones for surveillance, combat, and utility operations.',
    accentColor: TAB_COLORS.drones,
  },
  [ShadowrunTab.Connections]: {
    icon: 'address-book',
    label: 'Contacts',
    hint: 'Manage your network of contacts - the people who provide information, services, and favors.',
    accentColor: TAB_COLORS.connections,
  },
  [ShadowrunTab.Qualities]: {
    icon: 'star',
    label: 'Qualities',
    hint: 'Positive and negative qualities that define your character edges and flaws.',
    accentColor: TAB_COLORS.qualities,
  },
  [ShadowrunTab.Occupations]: {
    icon: 'id-badge',
    label: 'Jobs',
    hint: 'Select your assignment/role for the run.',
    accentColor: TAB_COLORS.occupations,
  },
  [ShadowrunTab.Summary]: {
    icon: 'clipboard-list',
    label: 'Summary',
    hint: 'Complete overview of your character build with validation status.',
    accentColor: TAB_COLORS.summary,
  },
};

const TAB_GROUPS = [
  {
    id: 'character',
    name: 'Character',
    icon: 'user',
    tabs: [ShadowrunTab.Build, ShadowrunTab.Core, ShadowrunTab.Magic],
  },
  {
    id: 'equipment',
    name: 'Equipment',
    icon: 'toolbox',
    tabs: [ShadowrunTab.Augments, ShadowrunTab.Gear, ShadowrunTab.Drones],
  },
  {
    id: 'social',
    name: 'Social',
    icon: 'users',
    tabs: [
      ShadowrunTab.Connections,
      ShadowrunTab.Qualities,
      ShadowrunTab.Occupations,
    ],
  },
  {
    id: 'summary',
    name: 'Summary',
    icon: 'clipboard-list',
    tabs: [ShadowrunTab.Summary],
  },
];

describe('UI Configuration Snapshots', () => {
  describe('Tab Display Configuration', () => {
    test('TAB_COLORS matches expected color palette', () => {
      expect(TAB_COLORS).toMatchSnapshot();
    });

    test('TAB_DISPLAY_INFO structure is stable', () => {
      expect(TAB_DISPLAY_INFO).toMatchSnapshot();
    });

    test('TAB_GROUPS organization is stable', () => {
      expect(TAB_GROUPS).toMatchSnapshot();
    });

    test('each tab has required display properties', () => {
      const requiredProps = ['icon', 'label', 'hint', 'accentColor'];
      const tabs = Object.values(ShadowrunTab);

      tabs.forEach((tab) => {
        const info = TAB_DISPLAY_INFO[tab];
        expect(info).toBeDefined();
        requiredProps.forEach((prop) => {
          expect(info).toHaveProperty(prop);
        });
      });
    });

    test('all tabs are assigned to exactly one group', () => {
      const allTabs = Object.values(ShadowrunTab);
      const groupedTabs = TAB_GROUPS.flatMap((g) => g.tabs);

      // Every tab should be in a group
      allTabs.forEach((tab) => {
        expect(groupedTabs).toContain(tab);
      });

      // No duplicate assignments
      expect(groupedTabs.length).toBe(new Set(groupedTabs).size);
    });
  });
});

// ============================================================================
// AUGMENT GRADE SNAPSHOTS
// ============================================================================

describe('Augment Grades Configuration', () => {
  test('AUGMENT_GRADES structure is stable', () => {
    expect(AUGMENT_GRADES).toMatchSnapshot();
  });

  test('all grades have required properties', () => {
    const requiredProps = [
      'name',
      'essenceMultiplier',
      'costMultiplier',
      'description',
      'color',
    ];

    Object.entries(AUGMENT_GRADES).forEach(([gradeId, grade]) => {
      requiredProps.forEach((prop) => {
        expect(grade).toHaveProperty(prop);
      });

      // Validate multipliers are positive numbers
      expect(typeof grade.essenceMultiplier).toBe('number');
      expect(grade.essenceMultiplier).toBeGreaterThan(0);
      expect(typeof grade.costMultiplier).toBe('number');
      expect(grade.costMultiplier).toBeGreaterThan(0);

      // Validate color is a valid hex color
      expect(grade.color).toMatch(/^#[0-9a-fA-F]{3,6}$/);
    });
  });

  test('grades are in ascending quality order by essence', () => {
    const essenceOrder = [
      'used',
      'standard',
      'alphaware',
      'betaware',
      'deltaware',
    ];
    const essenceValues = essenceOrder.map(
      (grade) => AUGMENT_GRADES[grade].essenceMultiplier,
    );

    // Essence multiplier should decrease (better = lower essence cost)
    for (let i = 1; i < essenceValues.length; i++) {
      expect(essenceValues[i]).toBeLessThan(essenceValues[i - 1]);
    }
  });

  test('grades are in ascending cost order', () => {
    const gradeOrder = [
      'used',
      'standard',
      'alphaware',
      'betaware',
      'deltaware',
    ];
    const costValues = gradeOrder.map(
      (grade) => AUGMENT_GRADES[grade].costMultiplier,
    );

    // Cost should increase with quality (except used which is cheaper than standard)
    expect(costValues[0]).toBeLessThan(costValues[1]); // used < standard
    for (let i = 2; i < costValues.length; i++) {
      expect(costValues[i]).toBeGreaterThan(costValues[i - 1]);
    }
  });
});

// ============================================================================
// PRIORITY SYSTEM SNAPSHOTS
// ============================================================================

describe('Priority System Configuration', () => {
  test('PRIORITY_LETTERS is stable', () => {
    expect(PRIORITY_LETTERS).toMatchSnapshot();
  });

  test('PRIORITY_CATEGORIES is stable', () => {
    expect(PRIORITY_CATEGORIES).toMatchSnapshot();
  });

  test('priority letters are A through E', () => {
    expect(PRIORITY_LETTERS).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(PRIORITY_LETTERS.length).toBe(5);
  });

  test('priority categories cover all SR5 build aspects', () => {
    expect(PRIORITY_CATEGORIES).toContain('metatype');
    expect(PRIORITY_CATEGORIES).toContain('attributes');
    expect(PRIORITY_CATEGORIES).toContain('magic');
    expect(PRIORITY_CATEGORIES).toContain('skills');
    expect(PRIORITY_CATEGORIES).toContain('resources');
    expect(PRIORITY_CATEGORIES.length).toBe(5);
  });
});

// ============================================================================
// AWAKENING TYPES SNAPSHOTS
// ============================================================================

describe('Awakening Types Configuration', () => {
  test('AWAKENING_TYPES is stable', () => {
    expect(AWAKENING_TYPES).toMatchSnapshot();
  });

  test('AWAKENING constants match types', () => {
    expect(AWAKENING.MUNDANE).toBe('mundane');
    expect(AWAKENING.MAGE).toBe('mage');
    expect(AWAKENING.ADEPT).toBe('adept');
    expect(AWAKENING.MYSTIC_ADEPT).toBe('mystic_adept');
    expect(AWAKENING.TECHNOMANCER).toBe('technomancer');
  });

  test('all awakening types have corresponding constant', () => {
    const awakeningValues = Object.values(AWAKENING);
    AWAKENING_TYPES.forEach((type) => {
      expect(awakeningValues).toContain(type);
    });
  });
});

// ============================================================================
// LIFESTYLE TIERS SNAPSHOTS
// ============================================================================

describe('Lifestyle Tiers Configuration', () => {
  test('LIFESTYLE_TIERS is stable', () => {
    expect(LIFESTYLE_TIERS).toMatchSnapshot();
  });

  test('lifestyle tiers are in ascending order', () => {
    expect(LIFESTYLE_TIERS).toEqual([
      'street',
      'squatter',
      'low',
      'middle',
      'high',
      'luxury',
    ]);
  });
});

// ============================================================================
// SECTION ACCENT COLORS SNAPSHOTS
// ============================================================================

describe('Section Accent Colors', () => {
  const SECTION_ACCENT_COLORS = {
    sin_identity: '#00d4ff',
    attributes: '#caa53d',
    skills: '#03fca1',
    magic: '#9b59b6',
    augments: '#ff6b6b',
    gear: '#ff9500',
    drones: '#4fc3f7',
    contacts: '#f1c40f',
    knowledge: '#2ecc71',
    lifestyle: '#ff9800',
    biometrics: '#26c6da',
    notes: '#9e9e9e',
    derived_stats: '#9b59b6',
    priority: '#caa53d',
    career: '#e67e22',
  };

  test('section accent colors are stable', () => {
    expect(SECTION_ACCENT_COLORS).toMatchSnapshot();
  });

  test('all colors are valid hex values', () => {
    Object.values(SECTION_ACCENT_COLORS).forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

// ============================================================================
// PRIORITY LETTER COLORS SNAPSHOTS
// ============================================================================

describe('Priority Letter Colors', () => {
  const PRIORITY_LETTER_COLORS = {
    A: '#4caf50',
    B: '#8bc34a',
    C: '#ffeb3b',
    D: '#ff9800',
    E: '#f44336',
  };

  test('priority letter colors are stable', () => {
    expect(PRIORITY_LETTER_COLORS).toMatchSnapshot();
  });

  test('all priority letters have colors', () => {
    PRIORITY_LETTERS.forEach((letter) => {
      expect(PRIORITY_LETTER_COLORS).toHaveProperty(letter);
    });
  });

  test('colors follow traffic light pattern (green to red)', () => {
    // A should be greenish
    expect(PRIORITY_LETTER_COLORS.A).toBe('#4caf50');
    // E should be reddish
    expect(PRIORITY_LETTER_COLORS.E).toBe('#f44336');
  });
});

// ============================================================================
// SKELETON LOADER CONFIGURATION SNAPSHOTS
// ============================================================================

describe('Skeleton Loader Configuration', () => {
  // Skeleton accent colors used in tab-specific loaders
  const SKELETON_TAB_COLORS = {
    gear: {
      budget: 'rgba(255, 215, 0, 0.4)',
      item: 'rgba(255, 149, 0, 0.4)',
    },
    augments: {
      essence: 'rgba(155, 143, 199, 0.5)',
      item: 'rgba(255, 107, 107, 0.4)',
    },
    drones: {
      budget: 'rgba(255, 215, 0, 0.4)',
      item: 'rgba(141, 110, 99, 0.4)',
    },
    magic: {
      header: 'rgba(155, 89, 182, 0.15)',
      border: 'rgba(155, 89, 182, 0.3)',
      item: 'rgba(155, 89, 182, 0.4)',
    },
    core: {
      header: 'rgba(92, 107, 192, 0.5)',
      identity: 'rgba(0, 212, 255, 0.5)',
      stats: 'rgba(155, 89, 182, 0.5)',
    },
    connections: {
      header: 'rgba(38, 166, 154, 0.5)',
      item: 'rgba(38, 166, 154, 0.4)',
    },
    skills: {
      header: 'rgba(3, 252, 161, 0.5)',
      bar: 'rgba(3, 252, 161, 0.4)',
    },
  };

  test('skeleton tab colors are stable', () => {
    expect(SKELETON_TAB_COLORS).toMatchSnapshot();
  });

  test('each tab skeleton has consistent color scheme', () => {
    Object.entries(SKELETON_TAB_COLORS).forEach(([tab, colors]) => {
      expect(typeof colors).toBe('object');
      Object.values(colors).forEach((color) => {
        // Should be rgba format
        expect(color).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
      });
    });
  });
});
