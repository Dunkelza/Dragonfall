/**
 * AugmentsSection Component
 *
 * Handles augmentation (cyberware, bioware, etc.) selection for Shadowrun character generation.
 */

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
import {
  AugmentMeta,
  AugmentSelection,
  ChargenConstData,
  ChargenState,
  CyberwareSuiteMeta,
} from './types';

// ============================================================================
// AUGMENTS SECTION
// ============================================================================

// Augment grade definitions - affects essence cost multiplier and availability
export const AUGMENT_GRADES: Record<
  string,
  {
    color: string;
    costMultiplier: number;
    description: string;
    essenceMultiplier: number;
    name: string;
  }
> = {
  used: {
    name: 'Used',
    essenceMultiplier: 1.25,
    costMultiplier: 0.75,
    description: 'Second-hand cyberware. Higher essence cost, lower price.',
    color: '#888',
  },
  standard: {
    name: 'Standard',
    essenceMultiplier: 1.0,
    costMultiplier: 1.0,
    description: 'Factory-new augmentation at base stats.',
    color: '#9b8fc7',
  },
  alphaware: {
    name: 'Alphaware',
    essenceMultiplier: 0.8,
    costMultiplier: 2.0,
    description: 'Higher quality, 20% less essence cost.',
    color: '#4fc3f7',
  },
  betaware: {
    name: 'Betaware',
    essenceMultiplier: 0.6,
    costMultiplier: 4.0,
    description: 'Premium grade, 40% less essence cost.',
    color: '#81c784',
  },
  deltaware: {
    name: 'Deltaware',
    essenceMultiplier: 0.5,
    costMultiplier: 10.0,
    description: 'Top-tier quality, 50% less essence cost. Very rare.',
    color: '#ffb74d',
  },
};

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

export const AugmentsSection = (props: AugmentsSectionProps) => {
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

  // Calculate essence cost from selected augments with grade multipliers
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
      return total + baseCost * gradeMultiplier * biocompMultiplier;
    },
    0,
  );

  // Cyberlimb upgrade cost per stat point
  const cyberlimbUpgradeCostPerPoint =
    chargenConstData?.cyberlimb_upgrade_cost || 5000;

  // Calculate nuyen cost from selected augments with grade multipliers
  // Also includes cyberlimb stat upgrade costs
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

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__augmentsSection">
      {/* Essence and Nuyen Display */}
      <Stack fill mb={1}>
        {/* Essence Display */}
        <Stack.Item grow basis={0}>
          <Box
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 30, 0.5))',
              border: `2px solid ${essenceRemaining < 1 ? '#ff6b6b' : essenceRemaining < 3 ? '#ff9800' : '#9b8fc7'}`,
              borderRadius: '4px',
              padding: '1rem',
              height: '100%',
            }}
          >
            <Stack align="center">
              <Stack.Item>
                <Icon
                  name="heart"
                  size={1.8}
                  color={
                    essenceRemaining < 1
                      ? '#ff6b6b'
                      : essenceRemaining < 3
                        ? '#ff9800'
                        : '#9b8fc7'
                  }
                />
              </Stack.Item>
              <Stack.Item grow>
                <Box style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  Essence
                </Box>
                <Box style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                  Augmentations reduce Essence permanently.
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Stack vertical align="center">
                  <Stack.Item>
                    <Box
                      style={{
                        fontSize: '2.2rem',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        color:
                          essenceRemaining < 1
                            ? '#ff6b6b'
                            : essenceRemaining < 3
                              ? '#ff9800'
                              : '#9b8fc7',
                      }}
                    >
                      {essenceRemaining.toFixed(2)}
                    </Box>
                  </Stack.Item>
                  <Stack.Item>
                    <Box style={{ fontSize: '0.7rem', opacity: '0.5' }}>
                      of {essenceBase.toFixed(1)} ESS
                    </Box>
                  </Stack.Item>
                </Stack>
              </Stack.Item>
            </Stack>
          </Box>
        </Stack.Item>

        {/* Nuyen Display */}
        <Stack.Item grow basis={0} ml={1}>
          <Box
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 30, 0.5))',
              border: `2px solid ${nuyenRemaining < 1000 ? '#ff6b6b' : nuyenRemaining < totalNuyen * 0.25 ? '#ff9800' : '#ffd700'}`,
              borderRadius: '4px',
              padding: '1rem',
              height: '100%',
            }}
          >
            <Stack align="center">
              <Stack.Item>
                <Icon
                  name="yen-sign"
                  size={1.8}
                  color={
                    nuyenRemaining < 1000
                      ? '#ff6b6b'
                      : nuyenRemaining < totalNuyen * 0.25
                        ? '#ff9800'
                        : '#ffd700'
                  }
                />
              </Stack.Item>
              <Stack.Item grow>
                <Box style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  Nuyen
                </Box>
                <Box style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                  Resources remaining for purchases.
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Stack vertical align="center">
                  <Stack.Item>
                    <Box
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        color:
                          nuyenRemaining < 1000
                            ? '#ff6b6b'
                            : nuyenRemaining < totalNuyen * 0.25
                              ? '#ff9800'
                              : '#ffd700',
                      }}
                    >
                      {formatNuyen(nuyenRemaining)}
                    </Box>
                  </Stack.Item>
                  <Stack.Item>
                    <Box style={{ fontSize: '0.7rem', opacity: '0.5' }}>
                      of {formatNuyen(totalNuyen)}
                    </Box>
                  </Stack.Item>
                </Stack>
              </Stack.Item>
            </Stack>
          </Box>
        </Stack.Item>

        {/* Selected Count */}
        <Stack.Item ml={1}>
          <Box
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 30, 0.5))',
              border: '2px solid rgba(155, 143, 199, 0.5)',
              borderRadius: '4px',
              padding: '1rem',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box style={{ textAlign: 'center' }}>
              <Box style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {selectedCount}
              </Box>
              <Box style={{ fontSize: '0.7rem', opacity: '0.6' }}>Augments</Box>
            </Box>
          </Box>
        </Stack.Item>
      </Stack>

      {/* Controls Row */}
      <Stack align="center" mb={0.5}>
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
            return (
              <Tabs.Tab
                key={catId}
                icon={catData.icon}
                selected={activeCategory === catId}
                onClick={() => setActiveCategory(catId)}
              >
                {catData.name}
                {catCount > 0 && (
                  <Box
                    as="span"
                    ml={0.5}
                    style={{
                      background: 'rgba(155, 143, 199, 0.4)',
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
              {(cyberwareSuites.length * 10).toFixed(0)}% OFF
            </Box>
          </Tabs.Tab>
        )}
      </Tabs>

      {/* Category Description */}
      <Box
        style={{
          fontSize: '0.85rem',
          fontStyle: 'italic',
          opacity: '0.7',
          marginTop: '0.5rem',
          marginBottom: '0.75rem',
          paddingLeft: '0.5rem',
          borderLeft: `3px solid ${activeCategory === 'suites' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(155, 143, 199, 0.5)'}`,
        }}
      >
        {activeCategory === 'suites'
          ? 'Pre-built augmentation packages with a 10% discount. Perfect for quick character builds!'
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
            gap: '0.5rem',
            marginBottom: '0.75rem',
            fontSize: '0.75rem',
          }}
        >
          {Object.entries(AUGMENT_GRADES).map(([gradeId, gradeData]) => (
            <Tooltip key={gradeId} content={gradeData.description}>
              <Box
                style={{
                  padding: '0.2rem 0.5rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${gradeData.color}`,
                  borderRadius: '3px',
                  color: gradeData.color,
                }}
              >
                {gradeData.name} (
                {(gradeData.essenceMultiplier * 100).toFixed(0)}% ESS)
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

              const tooltipText = isSelected
                ? 'Click to remove'
                : !canAffordEssence
                  ? 'Not enough Essence'
                  : !canAffordNuyen
                    ? 'Not enough Nuyen'
                    : 'Click to add';

              return (
                <Box
                  key={augment.id}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: isSelected
                      ? 'rgba(155, 143, 199, 0.15)'
                      : 'rgba(0, 0, 0, 0.25)',
                    border: `1px solid ${isSelected ? gradeData.color : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '4px',
                    opacity: isSaved ? '0.6' : canAfford ? '1' : '0.5',
                  }}
                >
                  <Stack align="center">
                    {/* Selection Checkbox */}
                    <Stack.Item>
                      <Button
                        icon={isSelected ? 'check-square' : 'square'}
                        color={isSelected ? 'good' : 'transparent'}
                        disabled={isSaved || (!isSelected && !canAfford)}
                        onClick={() =>
                          handleToggleAugment(augment.id, currentGrade)
                        }
                        tooltip={tooltipText}
                      />
                    </Stack.Item>

                    {/* Augment Info */}
                    <Stack.Item grow>
                      <Box style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                        {augment.name}
                        {augment.slot && (
                          <Box
                            as="span"
                            ml={0.5}
                            style={{ fontSize: '0.75rem', opacity: '0.6' }}
                          >
                            [{augment.slot}]
                          </Box>
                        )}
                      </Box>
                      <Box style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                        {augment.description}
                      </Box>
                    </Stack.Item>

                    {/* Grade Selector (only when selected) */}
                    {isSelected && (
                      <Stack.Item>
                        <Dropdown
                          width="7rem"
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
                      </Stack.Item>
                    )}

                    {/* Cyberlimb Stat Upgrades (only for cyberlimbs when selected) */}
                    {isSelected && augment.is_cyberlimb && (
                      <Stack.Item>
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
                      </Stack.Item>
                    )}

                    {/* Cost Display */}
                    <Stack.Item ml={0.5}>
                      <Stack vertical align="flex-end">
                        <Stack.Item>
                          <Tooltip
                            content={`Base: ${baseEssence.toFixed(2)} ESS × ${gradeData.name} (${(gradeData.essenceMultiplier * 100).toFixed(0)}%)`}
                          >
                            <Box
                              style={{
                                fontSize: '0.85rem',
                                color: isSelected ? gradeData.color : '#ff9800',
                                fontWeight: 'bold',
                                textAlign: 'right',
                              }}
                            >
                              -{effectiveEssence.toFixed(2)} ESS
                            </Box>
                          </Tooltip>
                        </Stack.Item>
                        <Stack.Item>
                          <Tooltip
                            content={`Base: ${formatNuyen(baseNuyen)} × ${gradeData.name} (${(gradeData.costMultiplier * 100).toFixed(0)}%)`}
                          >
                            <Box
                              style={{
                                fontSize: '0.75rem',
                                color: '#ffd700',
                                fontWeight: 'bold',
                                textAlign: 'right',
                              }}
                            >
                              {formatNuyen(effectiveNuyen)}
                            </Box>
                          </Tooltip>
                        </Stack.Item>
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
            background: 'rgba(155, 143, 199, 0.1)',
            border: '1px solid rgba(155, 143, 199, 0.3)',
            borderRadius: '4px',
          }}
        >
          <Box
            style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <Icon name="list" mr={0.5} />
            Selected Augments ({selectedCount})
          </Box>
          <Box style={{ fontSize: '0.8rem' }}>
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
                  <Stack key={augId} align="center" mb={0.25}>
                    <Stack.Item grow>
                      <Box as="span" style={{ color: grade.color }}>
                        [{grade.name}]
                      </Box>{' '}
                      {augMeta?.name || augId}
                    </Stack.Item>
                    <Stack.Item>
                      <Box style={{ color: '#ffd700', fontSize: '0.75rem' }}>
                        {formatNuyen(nuyenCostItem)}
                      </Box>
                    </Stack.Item>
                    <Stack.Item ml={0.5}>
                      <Box style={{ color: '#ff9800' }}>
                        -{essenceCost.toFixed(2)} ESS
                        {hasBiocompatibility && (
                          <Box
                            as="span"
                            style={{
                              fontSize: '0.7rem',
                              color: '#4caf50',
                              marginLeft: '4px',
                            }}
                          >
                            (Bio)
                          </Box>
                        )}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="times"
                        color="transparent"
                        disabled={isSaved}
                        onClick={() => handleToggleAugment(augId)}
                        tooltip="Remove"
                      />
                    </Stack.Item>
                  </Stack>
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
    </Box>
  );
};
