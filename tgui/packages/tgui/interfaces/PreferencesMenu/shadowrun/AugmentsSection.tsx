/**
 * AugmentsSection Component
 *
 * Handles augmentation (cyberware, bioware, etc.) selection for Shadowrun character generation.
 *
 * Visual overhaul with:
 * - Red/chrome accent theme for augmentations
 * - Essence bar with gradient fill
 * - Category tabs with glow effects
 * - Augment cards with grade-colored borders
 * - Cyberlimb stat customization
 * - Mod installation modal
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import {
  Box,
  Button,
  Dropdown,
  Icon,
  Input,
  Stack,
  Tabs,
} from '../../../components';
import { AUGMENT_GRADES } from './constants';
import {
  AugmentMeta,
  AugmentModCategoryMeta,
  AugmentModMeta,
  AugmentSelection,
  ChargenConstData,
  ChargenState,
  CyberwareSuiteMeta,
} from './types';

// ============================================================================
// ACCENT COLORS
// ============================================================================

const AUGMENT_ACCENT = '#ff6b6b'; // Red - main augment accent
const AUGMENT_ACCENT_DIM = 'rgba(255, 107, 107, 0.3)';
const ESSENCE_COLOR = '#9b8fc7'; // Purple for essence
const NUYEN_COLOR = '#ffd700'; // Gold for nuyen
const CYBERWARE_COLOR = '#4fc3f7'; // Cyan for cyberware
const BIOWARE_COLOR = '#4caf50'; // Green for bioware
const CYBERLIMB_COLOR = '#ff9800'; // Orange for cyberlimbs

// Category color mapping
const CATEGORY_COLORS: Record<string, { color: string; icon: string }> = {
  cyberware: { color: CYBERWARE_COLOR, icon: 'microchip' },
  bioware: { color: BIOWARE_COLOR, icon: 'dna' },
  bodyparts: { color: CYBERLIMB_COLOR, icon: 'hand' },
  suites: { color: '#4caf50', icon: 'box-open' },
};

// ============================================================================
// AUGMENTS SECTION
// ============================================================================

// Format nuyen with commas
const formatNuyen = (amount: number) => {
  return '¥' + amount.toLocaleString();
};

type AugmentsSectionProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  featureId: string;
  hasBiocompatibility: boolean;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  totalNuyen: number;
  value: ChargenState | null;
};

// Biocompatibility quality reduces essence cost by 10%
const BIOCOMPATIBILITY_ESSENCE_REDUCTION = 0.9;

export const AugmentsSection = memo((props: AugmentsSectionProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    value,
    hasBiocompatibility,
    totalNuyen,
  } = props;

  const essenceBase = 6.0;
  // selectedAugments is now: { [augmentId]: { id, grade } }
  const selectedAugments = chargenState?.augments || {};

  // Filter text for searching augments
  const [filterText, setFilterText] = useLocalState('sr_augment_filter', '');

  // Get augment mod data from server (moved up for use in calculations)
  const augmentModCatalog = chargenConstData?.augment_mod_catalog || {};

  // Calculate essence cost from selected augments with grade multipliers and mod modifiers
  const essenceCost = Object.entries(selectedAugments).reduce(
    (total, [augmentId, augmentData]: [string, any]) => {
      if (!augmentData) return total;
      const baseCost =
        chargenConstData?.augments?.[augmentId]?.essence_cost || 0;
      const grade = augmentData.grade || 'standard';
      const gradeMultiplier = AUGMENT_GRADES[grade]?.essenceMultiplier || 1.0;
      // Apply biocompatibility reduction (10% less essence cost)
      const biocompMultiplier = hasBiocompatibility
        ? BIOCOMPATIBILITY_ESSENCE_REDUCTION
        : 1.0;
      let essenceCostForAugment =
        baseCost * gradeMultiplier * biocompMultiplier;

      // Add/subtract mod essence cost modifiers
      for (const modId of augmentData?.mods || []) {
        const mod = augmentModCatalog[modId];
        if (mod?.essence_cost) {
          essenceCostForAugment += mod.essence_cost;
        }
      }

      return total + Math.max(0, essenceCostForAugment);
    },
    0,
  );

  // Cyberlimb upgrade cost per stat point
  const cyberlimbUpgradeCostPerPoint =
    chargenConstData?.cyberlimb_upgrade_cost || 5000;

  // Calculate nuyen cost from selected augments with grade multipliers
  // Also includes cyberlimb stat upgrade costs and mod costs
  const nuyenCost = Object.entries(selectedAugments).reduce(
    (total, [augmentId, augmentData]: [string, any]) => {
      if (!augmentData) return total;
      const baseCost = chargenConstData?.augments?.[augmentId]?.nuyen_cost || 0;
      const grade = augmentData.grade || 'standard';
      const multiplier = AUGMENT_GRADES[grade]?.costMultiplier || 1.0;
      let cost = baseCost * multiplier;

      // Add cyberlimb upgrade costs
      const isCyberlimb =
        chargenConstData?.augments?.[augmentId]?.is_cyberlimb || false;
      if (isCyberlimb) {
        const agiUpgrade = augmentData.agi_upgrade || 0;
        const strUpgrade = augmentData.str_upgrade || 0;
        cost += (agiUpgrade + strUpgrade) * cyberlimbUpgradeCostPerPoint;
      }

      // Add mod costs
      for (const modId of augmentData?.mods || []) {
        const mod = augmentModCatalog[modId];
        if (mod) {
          cost += mod.cost || 0;
        }
      }

      return total + cost;
    },
    0,
  );

  const essenceRemaining = essenceBase - essenceCost;
  const nuyenRemaining = totalNuyen - nuyenCost;

  // Count selected augments
  const selectedCount = Object.keys(selectedAugments).length;

  // Get available augment categories from server data
  const augmentCategories = chargenConstData?.augment_categories || {
    cyberware: {
      name: 'Cyberware',
      icon: 'microchip',
      description:
        'Cybernetic augmentations that enhance the body with technology.',
    },
    bioware: {
      name: 'Bioware',
      icon: 'dna',
      description: 'Biological enhancements grown from organic materials.',
    },
    bodyparts: {
      name: 'Cyberlimbs',
      icon: 'hand',
      description: 'Replacement limbs with enhanced capabilities.',
    },
  };

  const [activeCategory, setActiveCategory] = useLocalState(
    'sr_augment_category',
    'cyberware',
  );

  // State for customizing a specific augment (mod installation)
  const [customizingAugmentId, setCustomizingAugmentId] = useLocalState<
    string | null
  >('sr_customizing_augment', null);

  const [selectedModCategory, setSelectedModCategory] = useLocalState<string>(
    'sr_augment_mod_category',
    'concealment',
  );

  // Get additional augment mod data from server
  const augmentModsByCategory =
    chargenConstData?.augment_mods_by_category || {};
  const augmentModCategories = chargenConstData?.augment_mod_categories || [];

  // Get cyberware suites from server data
  const cyberwareSuites = chargenConstData?.cyberware_suites || [];

  // Get augments for the current category
  const categoryAugments: AugmentMeta[] =
    activeCategory === 'suites'
      ? []
      : chargenConstData?.augments_by_category?.[activeCategory] || [];

  // Filter augments by search text
  const filteredAugments = categoryAugments.filter((aug) => {
    if (!filterText) return true;
    const search = filterText.toLowerCase();
    return (
      aug.name?.toLowerCase().includes(search) ||
      aug.description?.toLowerCase().includes(search) ||
      aug.slot?.toLowerCase().includes(search)
    );
  });

  const handleToggleAugment = (
    augmentId: string,
    grade: string = 'standard',
  ) => {
    if (isSaved) return;

    const newAugments = { ...selectedAugments };
    const isCurrentlySelected = !!newAugments[augmentId];

    if (isCurrentlySelected) {
      // Deselect
      delete newAugments[augmentId];
    } else {
      // Select with grade
      const augmentData = chargenConstData?.augments?.[augmentId];
      const baseEssence = augmentData?.essence_cost || 0;
      const baseNuyen = augmentData?.nuyen_cost || 0;
      const gradeData = AUGMENT_GRADES[grade];
      const essenceMultiplier = gradeData?.essenceMultiplier || 1.0;
      const costMultiplier = gradeData?.costMultiplier || 1.0;
      const newEssenceCost = baseEssence * essenceMultiplier;
      const newNuyenCost = baseNuyen * costMultiplier;

      if (essenceRemaining < newEssenceCost) {
        return; // Not enough essence
      }

      if (nuyenRemaining < newNuyenCost) {
        return; // Not enough nuyen
      }

      newAugments[augmentId] = { id: augmentId, grade };
    }

    const newState = {
      ...value!,
      augments: newAugments,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleChangeGrade = (augmentId: string, newGrade: string) => {
    if (isSaved) return;
    if (!selectedAugments[augmentId]) return;

    const augmentData = chargenConstData?.augments?.[augmentId];
    const baseEssence = augmentData?.essence_cost || 0;
    const baseNuyen = augmentData?.nuyen_cost || 0;
    const oldGrade = selectedAugments[augmentId].grade || 'standard';
    const oldEssenceMultiplier =
      AUGMENT_GRADES[oldGrade]?.essenceMultiplier || 1.0;
    const newEssenceMultiplier =
      AUGMENT_GRADES[newGrade]?.essenceMultiplier || 1.0;
    const oldCostMultiplier = AUGMENT_GRADES[oldGrade]?.costMultiplier || 1.0;
    const newCostMultiplier = AUGMENT_GRADES[newGrade]?.costMultiplier || 1.0;
    const deltaEssence =
      baseEssence * (newEssenceMultiplier - oldEssenceMultiplier);
    const deltaNuyen = baseNuyen * (newCostMultiplier - oldCostMultiplier);

    if (essenceRemaining < deltaEssence) {
      return; // Not enough essence for upgrade
    }

    if (nuyenRemaining < deltaNuyen) {
      return; // Not enough nuyen for upgrade
    }

    const newAugments = {
      ...selectedAugments,
      [augmentId]: { id: augmentId, grade: newGrade },
    };

    const newState = {
      ...value!,
      augments: newAugments,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  // Cyberlimb customization constants
  const CYBERLIMB_UPGRADE_COST =
    chargenConstData?.cyberlimb_upgrade_cost || 5000;
  const CYBERLIMB_BASE_STATS = chargenConstData?.cyberlimb_base_stats || 3;
  const CYBERLIMB_MAX_UPGRADE = chargenConstData?.cyberlimb_max_upgrade || 3;

  // Handler for changing cyberlimb stat upgrades
  const handleChangeCyberlimbUpgrade = (
    augmentId: string,
    stat: 'agi' | 'str',
    newValue: number,
  ) => {
    if (isSaved) return;
    if (!selectedAugments[augmentId]) return;

    const current = selectedAugments[augmentId];
    const currentUpgrade =
      stat === 'agi' ? current.agi_upgrade || 0 : current.str_upgrade || 0;

    const delta = newValue - currentUpgrade;
    const costChange = delta * CYBERLIMB_UPGRADE_COST;

    // Check if we can afford the upgrade
    if (nuyenRemaining < costChange) return;

    const newAugments = {
      ...selectedAugments,
      [augmentId]: {
        ...current,
        [stat === 'agi' ? 'agi_upgrade' : 'str_upgrade']: Math.max(
          0,
          Math.min(CYBERLIMB_MAX_UPGRADE, newValue),
        ),
      },
    };

    const newState = { ...value!, augments: newAugments };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  const handleClearAll = () => {
    if (isSaved) return;

    const newState = {
      ...value!,
      augments: {},
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  // Handler for adding a mod to an augment
  const handleAddMod = (augmentId: string, modId: string) => {
    if (isSaved) return;
    if (!selectedAugments[augmentId]) return;
    const mod = augmentModCatalog[modId];
    if (!mod) return;

    // Check if can afford
    if ((mod.cost || 0) > nuyenRemaining) return;

    const currentAugment = selectedAugments[augmentId];
    const currentMods = currentAugment.mods || [];

    // Check if mod is already applied
    if (currentMods.includes(modId)) return;

    // Check max per augment
    const currentCount = currentMods.filter((m: string) => m === modId).length;
    if (currentCount >= (mod.max_per_augment || 1)) return;

    // Check if mod is allowed for this augment's category
    const augmentMeta = chargenConstData?.augments?.[augmentId];
    if (
      mod.allowed_categories &&
      mod.allowed_categories.length > 0 &&
      !mod.allowed_categories.includes(augmentMeta?.category)
    ) {
      return;
    }

    // Check if mod is cyberlimb-only
    if (mod.cyberlimb_only && !augmentMeta?.is_cyberlimb) {
      return;
    }

    const newMods = [...currentMods, modId];
    const newAugments = {
      ...selectedAugments,
      [augmentId]: { ...currentAugment, mods: newMods },
    };
    const newState = { ...value!, augments: newAugments };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  // Handler for removing a mod from an augment
  const handleRemoveMod = (augmentId: string, modId: string) => {
    if (isSaved) return;
    if (!selectedAugments[augmentId]) return;

    const currentAugment = selectedAugments[augmentId];
    const newMods = (currentAugment.mods || []).filter(
      (m: string) => m !== modId,
    );
    const newAugments = {
      ...selectedAugments,
      [augmentId]: { ...currentAugment, mods: newMods },
    };
    const newState = { ...value!, augments: newAugments };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  // Calculate stat bonuses from mods for an augment
  const getAugmentModBonuses = (augmentId: string) => {
    const augmentData = selectedAugments[augmentId];
    if (!augmentData?.mods) return {};
    const bonuses: Record<string, number> = {};
    for (const modId of augmentData.mods) {
      const mod = augmentModCatalog[modId];
      if (mod?.stat_bonuses) {
        for (const [stat, bonus] of Object.entries(mod.stat_bonuses)) {
          bonuses[stat] = (bonuses[stat] || 0) + (bonus as number);
        }
      }
    }
    return bonuses;
  };

  // Handler for applying a cyberware suite
  const handleApplySuite = (suite: CyberwareSuiteMeta) => {
    if (isSaved) return;

    // Calculate total essence and nuyen cost for the suite with discount
    let totalEssence = 0;
    let totalNuyen = 0;
    const augmentsToAdd: Record<string, AugmentSelection> = {};

    for (const augmentId of suite.augments || []) {
      const augmentData = chargenConstData?.augments?.[augmentId];
      if (!augmentData) continue;

      const baseEssence = augmentData.essence_cost || 0;
      const baseNuyen = augmentData.nuyen_cost || 0;
      const biocompMult = hasBiocompatibility
        ? BIOCOMPATIBILITY_ESSENCE_REDUCTION
        : 1.0;

      totalEssence += baseEssence * biocompMult;
      // Apply suite discount to nuyen cost
      totalNuyen += baseNuyen * (1 - (suite.discount || 0));

      augmentsToAdd[augmentId] = { id: augmentId, grade: 'standard' };
    }

    // Check if we can afford the suite
    if (essenceRemaining < totalEssence) return;
    if (nuyenRemaining < totalNuyen) return;

    // Merge with existing augments (suite augments override existing)
    const newAugments = { ...selectedAugments, ...augmentsToAdd };

    const newState = {
      ...value!,
      augments: newAugments,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  // Calculate essence percentage for progress bar
  const essencePercent = (essenceRemaining / essenceBase) * 100;
  const nuyenPercent =
    totalNuyen > 0 ? (nuyenRemaining / totalNuyen) * 100 : 100;

  // Get category color
  const getCategoryColor = (catId: string) =>
    CATEGORY_COLORS[catId]?.color || AUGMENT_ACCENT;

  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${AUGMENT_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
        border: `1px solid ${AUGMENT_ACCENT_DIM}`,
        borderRadius: '8px',
        padding: '1rem',
        position: 'relative',
      }}
    >
      {/* Decorative corner accent */}
      <Box
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '80px',
          height: '80px',
          background: `linear-gradient(135deg, transparent 50%, ${AUGMENT_ACCENT_DIM} 50%)`,
          opacity: '0.5',
        }}
      />

      {/* Header */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: `2px solid ${AUGMENT_ACCENT}`,
        }}
      >
        <Icon name="microchip" size={1.3} color={AUGMENT_ACCENT} />
        <Box style={{ marginLeft: '0.5rem' }}>
          <Box style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            Augmentations
          </Box>
          <Box
            style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Cyberware, Bioware & Cyberlimbs
          </Box>
        </Box>

        {/* Augment Count Badge */}
        <Box
          style={{
            marginLeft: 'auto',
            padding: '0.35rem 0.75rem',
            background: 'rgba(0, 0, 0, 0.4)',
            border: `1px solid ${selectedCount > 0 ? AUGMENT_ACCENT : 'rgba(255, 255, 255, 0.2)'}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Icon
            name="cog"
            color={
              selectedCount > 0 ? AUGMENT_ACCENT : 'rgba(255, 255, 255, 0.4)'
            }
            size={0.9}
          />
          <Box
            style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color:
                selectedCount > 0 ? AUGMENT_ACCENT : 'rgba(255, 255, 255, 0.4)',
            }}
          >
            {selectedCount}
          </Box>
        </Box>
      </Box>

      {/* Essence and Nuyen Display */}
      <Stack fill mb={1}>
        {/* Essence Display */}
        <Stack.Item grow basis={0}>
          <Box
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${essenceRemaining < 1 ? '#ff6b6b' : essenceRemaining < 3 ? '#ff9800' : ESSENCE_COLOR}`,
              borderLeft: `3px solid ${ESSENCE_COLOR}`,
              borderRadius: '4px',
              padding: '0.75rem',
              height: '100%',
            }}
          >
            <Stack align="center" mb={0.5}>
              <Stack.Item>
                <Icon
                  name="heart"
                  size={1.3}
                  color={
                    essenceRemaining < 1
                      ? '#ff6b6b'
                      : essenceRemaining < 3
                        ? '#ff9800'
                        : ESSENCE_COLOR
                  }
                />
              </Stack.Item>
              <Stack.Item grow>
                <Box style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Essence
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Box
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color:
                      essenceRemaining < 1
                        ? '#ff6b6b'
                        : essenceRemaining < 3
                          ? '#ff9800'
                          : ESSENCE_COLOR,
                  }}
                >
                  {essenceRemaining.toFixed(2)}
                  <Box
                    as="span"
                    style={{
                      fontSize: '0.7rem',
                      opacity: '0.6',
                      marginLeft: '0.25rem',
                    }}
                  >
                    / {essenceBase.toFixed(1)}
                  </Box>
                </Box>
              </Stack.Item>
            </Stack>
            {/* Essence Progress Bar */}
            <Box
              style={{
                height: '6px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  height: '100%',
                  width: `${Math.max(0, Math.min(essencePercent, 100))}%`,
                  background:
                    essenceRemaining < 1
                      ? 'linear-gradient(90deg, #ff6b6b, #ff4444)'
                      : essenceRemaining < 3
                        ? 'linear-gradient(90deg, #ff9800, #ff6b00)'
                        : `linear-gradient(90deg, ${ESSENCE_COLOR}, #7b6fa7)`,
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>
        </Stack.Item>

        {/* Nuyen Display */}
        <Stack.Item grow basis={0} ml={0.5}>
          <Box
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${nuyenRemaining < 1000 ? '#ff6b6b' : nuyenRemaining < totalNuyen * 0.25 ? '#ff9800' : NUYEN_COLOR}`,
              borderLeft: `3px solid ${NUYEN_COLOR}`,
              borderRadius: '4px',
              padding: '0.75rem',
              height: '100%',
            }}
          >
            <Stack align="center" mb={0.5}>
              <Stack.Item>
                <Icon
                  name="yen-sign"
                  size={1.3}
                  color={
                    nuyenRemaining < 1000
                      ? '#ff6b6b'
                      : nuyenRemaining < totalNuyen * 0.25
                        ? '#ff9800'
                        : NUYEN_COLOR
                  }
                />
              </Stack.Item>
              <Stack.Item grow>
                <Box style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Nuyen
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Box
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color:
                      nuyenRemaining < 1000
                        ? '#ff6b6b'
                        : nuyenRemaining < totalNuyen * 0.25
                          ? '#ff9800'
                          : NUYEN_COLOR,
                  }}
                >
                  {formatNuyen(nuyenRemaining)}
                </Box>
              </Stack.Item>
            </Stack>
            {/* Nuyen Progress Bar */}
            <Box
              style={{
                height: '6px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  height: '100%',
                  width: `${Math.max(0, Math.min(nuyenPercent, 100))}%`,
                  background:
                    nuyenRemaining < 1000
                      ? 'linear-gradient(90deg, #ff6b6b, #ff4444)'
                      : nuyenRemaining < totalNuyen * 0.25
                        ? 'linear-gradient(90deg, #ff9800, #ff6b00)'
                        : `linear-gradient(90deg, ${NUYEN_COLOR}, #b8860b)`,
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>
        </Stack.Item>
      </Stack>

      {/* Controls Row */}
      <Box
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          padding: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <Stack align="center">
          <Stack.Item grow>
            <Input
              fluid
              placeholder="Search augments..."
              value={filterText}
              onChange={(_, v) => setFilterText(v)}
            />
          </Stack.Item>
          <Stack.Item ml={0.5}>
            <Button
              icon="times"
              disabled={!filterText}
              onClick={() => setFilterText('')}
            >
              Clear
            </Button>
          </Stack.Item>
          <Stack.Item ml={0.5}>
            <Button
              icon="trash"
              color="bad"
              disabled={isSaved || selectedCount === 0}
              onClick={handleClearAll}
              tooltip="Remove all selected augments"
            >
              Clear All
            </Button>
          </Stack.Item>
        </Stack>
      </Box>

      {/* Category Tabs */}
      <Tabs fluid>
        {Object.entries(augmentCategories).map(
          ([catId, catData]: [string, { icon?: string; name: string }]) => {
            // Count selected in this category
            const catAugments =
              chargenConstData?.augments_by_category?.[catId] || [];
            const catCount = catAugments.filter(
              (aug: AugmentMeta) => selectedAugments[aug.id],
            ).length;
            const catColor = getCategoryColor(catId);
            return (
              <Tabs.Tab
                key={catId}
                icon={catData.icon}
                selected={activeCategory === catId}
                onClick={() => setActiveCategory(catId)}
                style={
                  activeCategory === catId
                    ? { boxShadow: `0 0 8px ${catColor}` }
                    : {}
                }
              >
                {catData.name}
                {catCount > 0 && (
                  <Box
                    as="span"
                    ml={0.5}
                    style={{
                      background: `rgba(${catColor === CYBERWARE_COLOR ? '79,195,247' : catColor === BIOWARE_COLOR ? '76,175,80' : '255,152,0'}, 0.4)`,
                      padding: '0 0.4rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {catCount}
                  </Box>
                )}
              </Tabs.Tab>
            );
          },
        )}
        {/* Suites Tab */}
        {cyberwareSuites.length > 0 && (
          <Tabs.Tab
            icon="box-open"
            selected={activeCategory === 'suites'}
            onClick={() => setActiveCategory('suites')}
            style={
              activeCategory === 'suites'
                ? { boxShadow: '0 0 8px #4caf50' }
                : {}
            }
          >
            Suites
            <Box
              as="span"
              ml={0.5}
              style={{
                background: 'rgba(76, 175, 80, 0.4)',
                padding: '0 0.4rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#4caf50',
              }}
            >
              SAVE
            </Box>
          </Tabs.Tab>
        )}
      </Tabs>

      {/* Category Description */}
      <Box
        style={{
          fontSize: '0.8rem',
          background: 'rgba(0, 0, 0, 0.2)',
          marginTop: '0.5rem',
          marginBottom: '0.75rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '4px',
          borderLeft: `3px solid ${getCategoryColor(activeCategory)}`,
        }}
      >
        <Icon
          name={CATEGORY_COLORS[activeCategory]?.icon || 'cog'}
          color={getCategoryColor(activeCategory)}
          mr={0.5}
        />
        {activeCategory === 'suites'
          ? 'Pre-built augmentation packages with discounts. Perfect for quick character builds!'
          : augmentCategories[activeCategory]?.description ||
            'Select augmentations for this category.'}
      </Box>

      {/* Suites View */}
      {activeCategory === 'suites' && (
        <Box
          style={{
            maxHeight: '28rem',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '0.5rem',
            borderRadius: '4px',
          }}
        >
          {cyberwareSuites.map((suite: CyberwareSuiteMeta) => {
            // Calculate suite totals
            let totalEssence = 0;
            let totalNuyenBase = 0;
            let allAugmentsAvailable = true;
            const suiteAugments: AugmentMeta[] = [];

            for (const augmentId of suite.augments || []) {
              const augmentData = chargenConstData?.augments?.[augmentId];
              if (!augmentData) {
                allAugmentsAvailable = false;
                continue;
              }
              suiteAugments.push(augmentData);
              const biocompMult = hasBiocompatibility
                ? BIOCOMPATIBILITY_ESSENCE_REDUCTION
                : 1.0;
              totalEssence += (augmentData.essence_cost || 0) * biocompMult;
              totalNuyenBase += augmentData.nuyen_cost || 0;
            }

            const discountedNuyen =
              totalNuyenBase * (1 - (suite.discount || 0));
            const savings = totalNuyenBase - discountedNuyen;
            const canAffordEssence = essenceRemaining >= totalEssence;
            const canAffordNuyen = nuyenRemaining >= discountedNuyen;
            const canAfford =
              canAffordEssence && canAffordNuyen && allAugmentsAvailable;

            // Check if all augments from suite are already selected
            const allSelected = (suite.augments || []).every(
              (augId: string) => selectedAugments[augId],
            );

            return (
              <Box
                key={suite.id}
                style={{
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  background: allSelected
                    ? 'rgba(76, 175, 80, 0.15)'
                    : 'rgba(0, 0, 0, 0.25)',
                  border: `2px solid ${allSelected ? '#4caf50' : 'rgba(76, 175, 80, 0.3)'}`,
                  borderRadius: '6px',
                  opacity: isSaved || !canAfford ? '0.6' : '1',
                }}
              >
                <Stack align="flex-start">
                  {/* Suite Icon */}
                  <Stack.Item>
                    <Box
                      style={{
                        width: '3rem',
                        height: '3rem',
                        background: 'rgba(76, 175, 80, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        name={suite.icon || 'box-open'}
                        size={1.5}
                        color="#4caf50"
                      />
                    </Box>
                  </Stack.Item>

                  {/* Suite Info */}
                  <Stack.Item grow>
                    <Box
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#4caf50',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {suite.name}
                    </Box>
                    <Box
                      style={{
                        fontSize: '0.85rem',
                        opacity: '0.8',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {suite.description}
                    </Box>

                    {/* Included Augments */}
                    <Box
                      style={{
                        fontSize: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.2)',
                        padding: '0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      <Box
                        style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}
                      >
                        <Icon name="list" mr={0.5} />
                        Includes ({suiteAugments.length} augments):
                      </Box>
                      {suiteAugments.map((aug) => (
                        <Box
                          key={aug.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.15rem 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <span>
                            {selectedAugments[aug.id] && (
                              <Icon name="check" color="#4caf50" mr={0.5} />
                            )}
                            {aug.name}
                          </span>
                          <span style={{ color: '#ffd700' }}>
                            {formatNuyen(aug.nuyen_cost || 0)}
                          </span>
                        </Box>
                      ))}
                    </Box>
                  </Stack.Item>

                  {/* Cost and Apply Button */}
                  <Stack.Item>
                    <Stack vertical align="flex-end">
                      <Stack.Item>
                        <Box
                          style={{
                            fontSize: '0.75rem',
                            textDecoration: 'line-through',
                            opacity: '0.5',
                          }}
                        >
                          {formatNuyen(totalNuyenBase)}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: '#4caf50',
                          }}
                        >
                          {formatNuyen(discountedNuyen)}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            fontSize: '0.7rem',
                            color: '#4caf50',
                          }}
                        >
                          Save {formatNuyen(savings)} (
                          {((suite.discount || 0) * 100).toFixed(0)}% off)
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Box style={{ fontSize: '0.85rem', color: '#ff9800' }}>
                          -{totalEssence.toFixed(2)} ESS
                        </Box>
                      </Stack.Item>
                      <Stack.Item mt={0.5}>
                        {allSelected ? (
                          <Button icon="check" color="good" disabled>
                            Applied
                          </Button>
                        ) : (
                          <Button
                            icon="plus"
                            color="good"
                            disabled={isSaved || !canAfford}
                            onClick={() => handleApplySuite(suite)}
                            tooltip={
                              !canAffordEssence
                                ? 'Not enough Essence'
                                : !canAffordNuyen
                                  ? 'Not enough Nuyen'
                                  : !allAugmentsAvailable
                                    ? 'Some augments unavailable'
                                    : 'Apply this suite'
                            }
                          >
                            Apply Suite
                          </Button>
                        )}
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Grade Legend - only show for non-suites */}
      {activeCategory !== 'suites' && (
        <Box
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
            marginBottom: '0.75rem',
            padding: '0.5rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
          }}
        >
          <Box
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginRight: '0.5rem',
              alignSelf: 'center',
            }}
          >
            <Icon name="layer-group" mr={0.25} />
            Grades:
          </Box>
          {Object.entries(AUGMENT_GRADES).map(([gradeId, gradeData]) => (
            <Tooltip key={gradeId} content={gradeData.description}>
              <Box
                style={{
                  padding: '0.15rem 0.4rem',
                  background: `rgba(${gradeData.color === '#888' ? '136,136,136' : gradeData.color === '#fff' ? '255,255,255' : gradeData.color === '#4fc3f7' ? '79,195,247' : gradeData.color === '#4caf50' ? '76,175,80' : '233,30,99'}, 0.15)`,
                  border: `1px solid ${gradeData.color}`,
                  borderRadius: '3px',
                  color: gradeData.color,
                  fontSize: '0.7rem',
                  cursor: 'help',
                }}
              >
                {gradeData.name}
                <Box
                  as="span"
                  style={{ opacity: '0.7', marginLeft: '0.25rem' }}
                >
                  {(gradeData.essenceMultiplier * 100).toFixed(0)}%
                </Box>
              </Box>
            </Tooltip>
          ))}
        </Box>
      )}

      {/* Augment List - only show for non-suites */}
      {activeCategory !== 'suites' && (
        <Box
          style={{
            maxHeight: '28rem',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '0.5rem',
            borderRadius: '4px',
          }}
        >
          {filteredAugments.length === 0 ? (
            <Box
              style={{
                textAlign: 'center',
                padding: '2rem',
                opacity: '0.6',
                fontStyle: 'italic',
              }}
            >
              <Icon name="info-circle" size={2} />
              <Box mt={1}>
                {categoryAugments.length === 0
                  ? 'Augmentation options will be available once server data is loaded.'
                  : 'No augments match your search.'}
              </Box>
            </Box>
          ) : (
            filteredAugments.map((augment: AugmentMeta) => {
              const isSelected = !!selectedAugments[augment.id];
              const currentGrade =
                selectedAugments[augment.id]?.grade || 'standard';
              const gradeData =
                AUGMENT_GRADES[currentGrade] || AUGMENT_GRADES.standard;
              const baseEssence = augment.essence_cost || 0;
              const baseNuyen = augment.nuyen_cost || 0;
              // Apply biocompatibility reduction (10% less essence cost)
              const biocompMult = hasBiocompatibility
                ? BIOCOMPATIBILITY_ESSENCE_REDUCTION
                : 1.0;
              const effectiveEssence =
                baseEssence * gradeData.essenceMultiplier * biocompMult;
              const effectiveNuyen = baseNuyen * gradeData.costMultiplier;
              const canAffordEssence =
                essenceRemaining >= effectiveEssence || isSelected;
              const canAffordNuyen =
                nuyenRemaining >= effectiveNuyen || isSelected;
              const canAfford = canAffordEssence && canAffordNuyen;

              // Determine card accent color based on category and grade
              const cardAccent = isSelected
                ? gradeData.color
                : getCategoryColor(activeCategory);

              return (
                <Box
                  key={augment.id}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: isSelected
                      ? `rgba(${gradeData.color === '#888' ? '136,136,136' : gradeData.color === '#fff' ? '255,255,255' : gradeData.color === '#4fc3f7' ? '79,195,247' : gradeData.color === '#4caf50' ? '76,175,80' : '233,30,99'}, 0.1)`
                      : 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${isSelected ? gradeData.color : 'rgba(255, 255, 255, 0.1)'}`,
                    borderLeft: `3px solid ${cardAccent}`,
                    borderRadius: '4px',
                    opacity: !canAfford && !isSelected ? '0.5' : '1',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Stack justify="space-between" align="flex-start">
                    <Stack.Item grow>
                      {/* Augment Name & Description */}
                      <Box
                        style={{
                          fontWeight: 'bold',
                          color: isSelected ? gradeData.color : '#fff',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <Tooltip
                          content={
                            augment.description ||
                            `${augment.name} - ${formatNuyen(effectiveNuyen)}`
                          }
                          position="right"
                        >
                          <span>{augment.name}</span>
                        </Tooltip>
                        {augment.slot && (
                          <Box
                            as="span"
                            ml={0.5}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.1rem 0.3rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '3px',
                              color: 'rgba(255, 255, 255, 0.6)',
                            }}
                          >
                            {augment.slot}
                          </Box>
                        )}
                      </Box>
                      <Box
                        style={{
                          fontSize: '0.8rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {augment.description}
                      </Box>

                      {/* Grade Selector Row (when selected) */}
                      {isSelected && (
                        <Box style={{ marginBottom: '0.25rem' }}>
                          <Dropdown
                            width="8rem"
                            disabled={isSaved}
                            selected={currentGrade}
                            options={Object.entries(AUGMENT_GRADES).map(
                              ([gId, gData]) => ({
                                value: gId,
                                displayText: gData.name,
                              }),
                            )}
                            onSelected={(val) =>
                              handleChangeGrade(augment.id, val)
                            }
                          />
                        </Box>
                      )}

                      {/* Cyberlimb Stats (when selected and is cyberlimb) */}
                      {isSelected && augment.is_cyberlimb && (
                        <Box
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            padding: '0.25rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '4px',
                          }}
                        >
                          <Tooltip content="Agility upgrade: +1 AGI costs ¥5,000">
                            <Box
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Box
                                style={{ fontSize: '0.7rem', color: '#4fc3f7' }}
                              >
                                AGI
                              </Box>
                              <Box
                                style={{ fontWeight: 'bold', color: '#4fc3f7' }}
                              >
                                {CYBERLIMB_BASE_STATS +
                                  (selectedAugments[augment.id]?.agi_upgrade ||
                                    0)}
                              </Box>
                              <Stack vertical style={{ gap: '0' }}>
                                <Button
                                  compact
                                  icon="plus"
                                  disabled={
                                    isSaved ||
                                    (selectedAugments[augment.id]
                                      ?.agi_upgrade || 0) >=
                                      CYBERLIMB_MAX_UPGRADE ||
                                    nuyenRemaining < CYBERLIMB_UPGRADE_COST
                                  }
                                  onClick={() =>
                                    handleChangeCyberlimbUpgrade(
                                      augment.id,
                                      'agi',
                                      (selectedAugments[augment.id]
                                        ?.agi_upgrade || 0) + 1,
                                    )
                                  }
                                />
                                <Button
                                  compact
                                  icon="minus"
                                  disabled={
                                    isSaved ||
                                    (selectedAugments[augment.id]
                                      ?.agi_upgrade || 0) <= 0
                                  }
                                  onClick={() =>
                                    handleChangeCyberlimbUpgrade(
                                      augment.id,
                                      'agi',
                                      (selectedAugments[augment.id]
                                        ?.agi_upgrade || 0) - 1,
                                    )
                                  }
                                />
                              </Stack>
                            </Box>
                          </Tooltip>
                          <Tooltip content="Strength upgrade: +1 STR costs ¥5,000">
                            <Box
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Box
                                style={{ fontSize: '0.7rem', color: '#ff6b6b' }}
                              >
                                STR
                              </Box>
                              <Box
                                style={{ fontWeight: 'bold', color: '#ff6b6b' }}
                              >
                                {CYBERLIMB_BASE_STATS +
                                  (selectedAugments[augment.id]?.str_upgrade ||
                                    0)}
                              </Box>
                              <Stack vertical style={{ gap: '0' }}>
                                <Button
                                  compact
                                  icon="plus"
                                  disabled={
                                    isSaved ||
                                    (selectedAugments[augment.id]
                                      ?.str_upgrade || 0) >=
                                      CYBERLIMB_MAX_UPGRADE ||
                                    nuyenRemaining < CYBERLIMB_UPGRADE_COST
                                  }
                                  onClick={() =>
                                    handleChangeCyberlimbUpgrade(
                                      augment.id,
                                      'str',
                                      (selectedAugments[augment.id]
                                        ?.str_upgrade || 0) + 1,
                                    )
                                  }
                                />
                                <Button
                                  compact
                                  icon="minus"
                                  disabled={
                                    isSaved ||
                                    (selectedAugments[augment.id]
                                      ?.str_upgrade || 0) <= 0
                                  }
                                  onClick={() =>
                                    handleChangeCyberlimbUpgrade(
                                      augment.id,
                                      'str',
                                      (selectedAugments[augment.id]
                                        ?.str_upgrade || 0) - 1,
                                    )
                                  }
                                />
                              </Stack>
                            </Box>
                          </Tooltip>
                        </Box>
                      )}

                      {/* Show mods count badge if augment has mods */}
                      {isSelected &&
                        (selectedAugments[augment.id]?.mods?.length || 0) >
                          0 && (
                          <Box
                            style={{
                              marginTop: '0.25rem',
                              fontSize: '0.75rem',
                              color: '#4caf50',
                            }}
                          >
                            <Icon name="cog" mr={0.25} />
                            {selectedAugments[augment.id]?.mods?.length} mod
                            {(selectedAugments[augment.id]?.mods?.length ||
                              0) !== 1
                              ? 's'
                              : ''}{' '}
                            installed
                          </Box>
                        )}
                    </Stack.Item>

                    {/* Cost & Buttons Column */}
                    <Stack.Item>
                      <Box
                        style={{
                          textAlign: 'right',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <Box
                          style={{
                            fontWeight: 'bold',
                            color:
                              canAfford || isSelected ? '#ffd700' : '#ff6b6b',
                          }}
                        >
                          {formatNuyen(effectiveNuyen)}
                        </Box>
                        <Tooltip
                          content={`Base: ${baseEssence.toFixed(2)} ESS × ${gradeData.name} (${(gradeData.essenceMultiplier * 100).toFixed(0)}%)`}
                        >
                          <Box
                            style={{
                              fontSize: '0.8rem',
                              color: isSelected ? gradeData.color : '#ff9800',
                              fontWeight: 'bold',
                            }}
                          >
                            -{effectiveEssence.toFixed(2)} ESS
                          </Box>
                        </Tooltip>
                        <Box
                          style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          Avail: {augment.availability || '-'}
                        </Box>
                      </Box>
                      <Stack vertical>
                        {isSelected ? (
                          <>
                            <Stack.Item>
                              <Button
                                fluid
                                icon="cog"
                                color="transparent"
                                disabled={isSaved}
                                onClick={() =>
                                  setCustomizingAugmentId(augment.id)
                                }
                              >
                                Customize
                              </Button>
                            </Stack.Item>
                            <Stack.Item>
                              <Button
                                fluid
                                icon="trash"
                                color="bad"
                                disabled={isSaved}
                                onClick={() => handleToggleAugment(augment.id)}
                              >
                                Remove
                              </Button>
                            </Stack.Item>
                          </>
                        ) : (
                          <Stack.Item>
                            <Button
                              fluid
                              icon="plus"
                              color="good"
                              disabled={isSaved || !canAfford}
                              onClick={() =>
                                handleToggleAugment(augment.id, 'standard')
                              }
                            >
                              Add
                            </Button>
                          </Stack.Item>
                        )}
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </Box>
              );
            })
          )}
        </Box>
      )}

      {/* Selected Augments Summary */}
      {selectedCount > 0 && (
        <Box
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: `rgba(255, 107, 107, 0.1)`,
            border: `1px solid ${AUGMENT_ACCENT_DIM}`,
            borderLeft: `3px solid ${AUGMENT_ACCENT}`,
            borderRadius: '4px',
          }}
        >
          <Box
            style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: AUGMENT_ACCENT,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Icon name="list-check" />
            Selected Augments
            <Box
              as="span"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
              }}
            >
              {selectedCount}
            </Box>
          </Box>
          <Box
            style={{
              fontSize: '0.8rem',
              maxHeight: '10rem',
              overflowY: 'auto',
            }}
          >
            {Object.entries(selectedAugments).map(
              ([augId, augData]: [string, any]) => {
                const augMeta = chargenConstData?.augments?.[augId];
                const grade =
                  AUGMENT_GRADES[augData.grade] || AUGMENT_GRADES.standard;
                // Apply biocompatibility reduction (10% less essence cost)
                const biocompMult = hasBiocompatibility
                  ? BIOCOMPATIBILITY_ESSENCE_REDUCTION
                  : 1.0;
                const essenceCost =
                  (augMeta?.essence_cost || 0) *
                  grade.essenceMultiplier *
                  biocompMult;
                const nuyenCostItem =
                  (augMeta?.nuyen_cost || 0) * grade.costMultiplier;
                return (
                  <Box
                    key={augId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.25rem 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <Box style={{ flexGrow: '1' }}>
                      <Box
                        as="span"
                        style={{
                          color: grade.color,
                          fontSize: '0.7rem',
                          marginRight: '0.35rem',
                        }}
                      >
                        [{grade.name}]
                      </Box>
                      {augMeta?.name || augId}
                    </Box>
                    <Box
                      style={{
                        color: NUYEN_COLOR,
                        fontSize: '0.75rem',
                        marginRight: '0.5rem',
                      }}
                    >
                      {formatNuyen(nuyenCostItem)}
                    </Box>
                    <Box
                      style={{
                        color: ESSENCE_COLOR,
                        fontSize: '0.75rem',
                        marginRight: '0.5rem',
                      }}
                    >
                      -{essenceCost.toFixed(2)}
                      {hasBiocompatibility && (
                        <Box
                          as="span"
                          style={{
                            fontSize: '0.6rem',
                            color: '#4caf50',
                            marginLeft: '2px',
                          }}
                        >
                          ✓
                        </Box>
                      )}
                    </Box>
                    <Button
                      icon="times"
                      compact
                      color="transparent"
                      disabled={isSaved}
                      onClick={() => handleToggleAugment(augId)}
                      tooltip="Remove"
                      style={{
                        minWidth: '1.2rem',
                        height: '1.2rem',
                        padding: '0',
                      }}
                    />
                  </Box>
                );
              },
            )}
          </Box>
        </Box>
      )}

      {/* Info Section */}
      <Box
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderLeft: '3px solid #ff9800',
          fontSize: '0.8rem',
          borderRadius: '0 4px 4px 0',
        }}
      >
        <Icon name="exclamation-triangle" color="#ff9800" mr={0.5} />
        <b>Note:</b> Augmentations reduce Essence. If Essence drops to 0, the
        character dies. Magic users lose 1 Magic for each full point of Essence
        lost. Higher grade augments cost more nuyen but use less Essence.
      </Box>

      {/* Augment Customization Modal */}
      {customizingAugmentId && selectedAugments[customizingAugmentId] && (
        <Box
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setCustomizingAugmentId(null)}
        >
          <Box
            style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              border: '2px solid rgba(155, 143, 199, 0.5)',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {(() => {
              const augmentMeta =
                chargenConstData?.augments?.[customizingAugmentId];
              const augmentData = selectedAugments[customizingAugmentId];
              const installedMods = augmentData?.mods || [];
              const augmentBonuses = getAugmentModBonuses(customizingAugmentId);

              if (!augmentMeta) return null;

              // Calculate mod cost for this augment
              const modCost = installedMods.reduce(
                (sum: number, modId: string) => {
                  const mod = augmentModCatalog[modId];
                  return sum + (mod?.cost || 0);
                },
                0,
              );

              return (
                <>
                  {/* Header */}
                  <Stack justify="space-between" align="center" mb={1}>
                    <Stack.Item>
                      <Box
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: 'bold',
                          color: '#9b8fc7',
                        }}
                      >
                        <Icon name="cog" mr={0.5} />
                        Customize: {augmentMeta.name}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="times"
                        color="transparent"
                        onClick={() => setCustomizingAugmentId(null)}
                      />
                    </Stack.Item>
                  </Stack>

                  {/* Augment Info */}
                  <Box
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    <Box
                      style={{
                        fontSize: '0.85rem',
                        opacity: '0.8',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {augmentMeta.description}
                    </Box>
                    <Stack>
                      <Stack.Item>
                        <Box style={{ color: '#ffd700', fontWeight: 'bold' }}>
                          Base: {formatNuyen(augmentMeta.nuyen_cost || 0)}
                        </Box>
                      </Stack.Item>
                      {modCost > 0 && (
                        <Stack.Item>
                          <Box style={{ color: '#4caf50', fontWeight: 'bold' }}>
                            +{formatNuyen(modCost)} (mods)
                          </Box>
                        </Stack.Item>
                      )}
                      <Stack.Item>
                        <Box style={{ color: '#ff9800' }}>
                          -{(augmentMeta.essence_cost || 0).toFixed(2)} ESS
                        </Box>
                      </Stack.Item>
                    </Stack>
                    {/* Show stat bonuses from mods */}
                    {Object.keys(augmentBonuses).length > 0 && (
                      <Box style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                        <Box
                          as="span"
                          style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                          Mod bonuses:{' '}
                        </Box>
                        {Object.entries(augmentBonuses).map(([stat, bonus]) => (
                          <Box
                            key={stat}
                            as="span"
                            mr={0.5}
                            style={{ color: bonus > 0 ? '#4caf50' : '#ff6b6b' }}
                          >
                            {stat.toUpperCase()}: {bonus > 0 ? '+' : ''}
                            {bonus}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Installed Mods */}
                  {installedMods.length > 0 && (
                    <Box
                      style={{
                        background: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                      }}
                    >
                      <Box
                        style={{
                          fontWeight: 'bold',
                          marginBottom: '0.5rem',
                          color: '#4caf50',
                        }}
                      >
                        <Icon name="check-circle" mr={0.5} />
                        Installed Mods ({installedMods.length})
                      </Box>
                      {installedMods.map((modId: string) => {
                        const mod = augmentModCatalog[modId];
                        if (!mod) return null;
                        return (
                          <Stack key={modId} align="center" mb={0.25}>
                            <Stack.Item grow>
                              <Box style={{ fontSize: '0.9rem' }}>
                                <Icon name={mod.icon || 'cog'} mr={0.5} />
                                {mod.name}
                              </Box>
                            </Stack.Item>
                            <Stack.Item>
                              <Box
                                style={{ color: '#ffd700', fontSize: '0.8rem' }}
                              >
                                {formatNuyen(mod.cost || 0)}
                              </Box>
                            </Stack.Item>
                            <Stack.Item>
                              <Button
                                icon="times"
                                compact
                                color="bad"
                                disabled={isSaved}
                                onClick={() =>
                                  handleRemoveMod(customizingAugmentId, modId)
                                }
                              />
                            </Stack.Item>
                          </Stack>
                        );
                      })}
                    </Box>
                  )}

                  {/* Mod Category Tabs */}
                  <Tabs fluid mb={0.5}>
                    {augmentModCategories
                      .sort(
                        (
                          a: AugmentModCategoryMeta,
                          b: AugmentModCategoryMeta,
                        ) => (a.sort || 0) - (b.sort || 0),
                      )
                      .map((cat: AugmentModCategoryMeta) => (
                        <Tabs.Tab
                          key={cat.id}
                          selected={selectedModCategory === cat.id}
                          onClick={() => setSelectedModCategory(cat.id)}
                        >
                          <Icon name={cat.icon || 'cog'} mr={0.25} />
                          {cat.name}
                        </Tabs.Tab>
                      ))}
                  </Tabs>

                  {/* Available Mods */}
                  <Box
                    style={{
                      maxHeight: '250px',
                      overflowY: 'auto',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    {(augmentModsByCategory[selectedModCategory] || [])
                      .sort(
                        (a: AugmentModMeta, b: AugmentModMeta) =>
                          (a.sort || 0) - (b.sort || 0),
                      )
                      .map((mod: AugmentModMeta) => {
                        const isInstalled = installedMods.includes(mod.id);
                        const canAffordMod = (mod.cost || 0) <= nuyenRemaining;
                        const isAllowedForCategory =
                          !mod.allowed_categories?.length ||
                          mod.allowed_categories.includes(augmentMeta.category);
                        const isCyberlimbCompatible =
                          !mod.cyberlimb_only || augmentMeta.is_cyberlimb;
                        const isAllowed =
                          isAllowedForCategory && isCyberlimbCompatible;

                        return (
                          <Box
                            key={mod.id}
                            style={{
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              background: isInstalled
                                ? 'rgba(76, 175, 80, 0.15)'
                                : 'rgba(0, 0, 0, 0.3)',
                              border: isInstalled
                                ? '1px solid rgba(76, 175, 80, 0.5)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              opacity: !isAllowed
                                ? '0.4'
                                : !canAffordMod && !isInstalled
                                  ? '0.6'
                                  : '1',
                            }}
                          >
                            <Stack align="center">
                              <Stack.Item>
                                <Icon
                                  name={mod.icon || 'cog'}
                                  size={1.2}
                                  color={isInstalled ? '#4caf50' : '#9b8fc7'}
                                />
                              </Stack.Item>
                              <Stack.Item grow>
                                <Box
                                  style={{
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  {mod.name}
                                  {mod.legality && (
                                    <Box
                                      as="span"
                                      ml={0.5}
                                      style={{
                                        fontSize: '0.65rem',
                                        padding: '0.1rem 0.25rem',
                                        background:
                                          mod.legality === 'F'
                                            ? 'rgba(255, 0, 0, 0.3)'
                                            : 'rgba(255, 165, 0, 0.3)',
                                        borderRadius: '2px',
                                        color:
                                          mod.legality === 'F'
                                            ? '#ff6b6b'
                                            : '#ffb74d',
                                      }}
                                    >
                                      {mod.legality}
                                    </Box>
                                  )}
                                  {!isAllowed && (
                                    <Box
                                      as="span"
                                      ml={0.5}
                                      style={{
                                        fontSize: '0.7rem',
                                        color: '#ff6b6b',
                                      }}
                                    >
                                      (
                                      {mod.cyberlimb_only
                                        ? 'Cyberlimb only'
                                        : 'Incompatible'}
                                      )
                                    </Box>
                                  )}
                                </Box>
                                <Box
                                  style={{
                                    fontSize: '0.75rem',
                                    opacity: '0.7',
                                  }}
                                >
                                  {mod.desc}
                                </Box>
                                {mod.stat_bonuses &&
                                  Object.keys(mod.stat_bonuses).length > 0 && (
                                    <Box
                                      style={{
                                        fontSize: '0.7rem',
                                        marginTop: '0.25rem',
                                      }}
                                    >
                                      {Object.entries(mod.stat_bonuses).map(
                                        ([stat, bonus]: [string, any]) => (
                                          <Box
                                            key={stat}
                                            as="span"
                                            mr={0.5}
                                            style={{
                                              color:
                                                bonus > 0
                                                  ? '#4caf50'
                                                  : '#ff6b6b',
                                            }}
                                          >
                                            {stat.toUpperCase()}:{' '}
                                            {bonus > 0 ? '+' : ''}
                                            {bonus}
                                          </Box>
                                        ),
                                      )}
                                    </Box>
                                  )}
                              </Stack.Item>
                              <Stack.Item>
                                <Box style={{ textAlign: 'right' }}>
                                  <Box
                                    style={{
                                      color: '#ffd700',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {formatNuyen(mod.cost || 0)}
                                  </Box>
                                  {mod.essence_cost !== undefined &&
                                    mod.essence_cost !== 0 && (
                                      <Box
                                        style={{
                                          fontSize: '0.7rem',
                                          color:
                                            mod.essence_cost < 0
                                              ? '#4caf50'
                                              : '#ff9800',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {mod.essence_cost > 0 ? '+' : ''}
                                        {mod.essence_cost.toFixed(2)} ESS
                                      </Box>
                                    )}
                                  <Box
                                    style={{
                                      fontSize: '0.7rem',
                                      opacity: '0.6',
                                    }}
                                  >
                                    Avail: {mod.availability}
                                  </Box>
                                </Box>
                              </Stack.Item>
                              <Stack.Item ml={0.5}>
                                {isInstalled ? (
                                  <Button
                                    icon="times"
                                    color="bad"
                                    disabled={isSaved}
                                    onClick={() =>
                                      handleRemoveMod(
                                        customizingAugmentId,
                                        mod.id,
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                ) : (
                                  <Button
                                    icon="plus"
                                    color="good"
                                    disabled={
                                      isSaved || !canAffordMod || !isAllowed
                                    }
                                    onClick={() =>
                                      handleAddMod(customizingAugmentId, mod.id)
                                    }
                                  >
                                    Install
                                  </Button>
                                )}
                              </Stack.Item>
                            </Stack>
                          </Box>
                        );
                      })}
                    {(augmentModsByCategory[selectedModCategory] || [])
                      .length === 0 && (
                      <Box
                        style={{
                          textAlign: 'center',
                          padding: '1.5rem',
                          opacity: '0.6',
                        }}
                      >
                        No mods available in this category.
                      </Box>
                    )}
                  </Box>

                  {/* Close Button */}
                  <Box style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Button
                      icon="check"
                      color="good"
                      onClick={() => setCustomizingAugmentId(null)}
                    >
                      Done
                    </Button>
                  </Box>
                </>
              );
            })()}
          </Box>
        </Box>
      )}
    </Box>
  );
});
