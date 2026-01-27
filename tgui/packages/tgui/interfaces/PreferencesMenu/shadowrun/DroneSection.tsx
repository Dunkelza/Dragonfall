/**
 * DroneSection Component
 *
 * Handles drone selection and customization for Shadowrun character generation.
 */

import { memo, useMemo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Icon, Stack, Tabs } from '../../../components';
import {
  ChargenConstData,
  ChargenState,
  DashboardData,
  DroneCategoryMeta,
  DroneMeta,
  DroneModMeta,
} from './types';
import { useCachedComputation } from './useDeferredComputation';
import { VirtualizedList } from './VirtualizedList';

// === ACCENT COLORS ===
const ACCENT_BLUE = '#4fc3f7';
const ACCENT_BLUE_DIM = 'rgba(79, 195, 247, 0.15)';
const ACCENT_BLUE_BORDER = 'rgba(79, 195, 247, 0.4)';
const NUYEN_GOLD = '#ffd700';
const SUCCESS_GREEN = '#4caf50';
const DANGER_RED = '#ff6b6b';
const RESTRICTED_ORANGE = '#ffb74d';
const FORBIDDEN_RED = '#dc3545';

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  small: 'helicopter',
  medium: 'plane',
  large: 'shuttle-space',
  vehicle: 'car',
  anthro: 'robot',
  default: 'robot',
};

// DRONE SECTION
// ============================================================================

type DroneSectionProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  dashboardData: DashboardData | null;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: unknown) => void;
  value: unknown;
};

export const DroneSection = memo((props: DroneSectionProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    value,
    dashboardData,
  } = props;

  const [selectedCategory, setSelectedCategory] = useLocalState<string>(
    'sr_drone_category',
    'small',
  );

  // State for customizing a specific drone
  const [customizingDroneId, setCustomizingDroneId] = useLocalState<
    string | null
  >('sr_customizing_drone', null);

  const [selectedModCategory, setSelectedModCategory] = useLocalState<string>(
    'sr_mod_category',
    'armor',
  );

  const droneCategories = chargenConstData?.drone_categories || [];
  const dronesByCategory = chargenConstData?.drones_by_category || {};
  const droneCatalog = chargenConstData?.drone_catalog || {};
  const droneModCatalog = chargenConstData?.drone_mod_catalog || {};
  const droneModsByCategory = chargenConstData?.drone_mods_by_category || {};
  const droneModCategories = chargenConstData?.drone_mod_categories || [];

  // selectedDrones is now: { [droneId]: { mods: string[] } }
  // But we need to handle legacy format (string[]) for backwards compatibility
  const rawDrones = chargenState?.drones;
  const selectedDrones: Record<string, { mods: string[] }> = useMemo(() => {
    if (!rawDrones) return {};
    // Check if it's the new format (object) or old format (array)
    if (Array.isArray(rawDrones)) {
      // Convert legacy array format to new object format
      const converted: Record<string, { mods: string[] }> = {};
      for (const droneId of rawDrones) {
        converted[droneId] = { mods: [] };
      }
      return converted;
    }
    return rawDrones;
  }, [rawDrones]);

  const nuyenRemaining = dashboardData?.nuyenRemaining || 0;

  // Get drones for current category (cached across tab switches)
  const categoryDrones = useCachedComputation(
    `drones-category-${selectedCategory}`,
    () => {
      const drones = dronesByCategory[selectedCategory] || [];
      return [...drones].sort(
        (a: DroneMeta, b: DroneMeta) => (a.sort || 0) - (b.sort || 0),
      );
    },
    [dronesByCategory, selectedCategory],
  );

  // Calculate total drone cost (including mods) - uses useMemo since it depends on selection state
  const totalDroneCost = useMemo(() => {
    let total = 0;
    for (const droneId of Object.keys(selectedDrones)) {
      const drone = droneCatalog[droneId];
      if (drone) {
        total += drone.cost || 0;
      }
      // Add mod costs
      const droneData = selectedDrones[droneId];
      for (const modId of droneData?.mods || []) {
        const mod = droneModCatalog[modId];
        if (mod) {
          total += mod.cost || 0;
        }
      }
    }
    return total;
  }, [selectedDrones, droneCatalog, droneModCatalog]);

  // Helper to get count of selected drones
  const selectedDroneCount = Object.keys(selectedDrones).length;

  const handleAddDrone = (droneId: string) => {
    if (isSaved) return;
    const drone = droneCatalog[droneId];
    if (!drone) return;

    // Check if already selected
    if (selectedDrones[droneId]) return;

    // Check if can afford
    if (drone.cost > nuyenRemaining) return;

    const newDrones = { ...selectedDrones, [droneId]: { mods: [] } };
    const newState = { ...value!, drones: newDrones };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  const handleRemoveDrone = (droneId: string) => {
    if (isSaved) return;
    const newDrones = { ...selectedDrones };
    delete newDrones[droneId];
    const newState = { ...value!, drones: newDrones };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
    // Close customization if we're customizing this drone
    if (customizingDroneId === droneId) {
      setCustomizingDroneId(null);
    }
  };

  const handleAddMod = (droneId: string, modId: string) => {
    if (isSaved) return;
    if (!selectedDrones[droneId]) return;
    const mod = droneModCatalog[modId];
    if (!mod) return;

    // Check if can afford
    if ((mod.cost || 0) > nuyenRemaining) return;

    // Check if mod is already applied
    if ((selectedDrones[droneId].mods || []).includes(modId)) return;

    // Check max per drone
    const currentCount = (selectedDrones[droneId].mods || []).filter(
      (m) => m === modId,
    ).length;
    if (currentCount >= (mod.max_per_drone || 1)) return;

    // Check if mod is allowed for this drone's category
    const drone = droneCatalog[droneId];
    if (
      mod.allowed_categories &&
      mod.allowed_categories.length > 0 &&
      !mod.allowed_categories.includes(drone?.category)
    ) {
      return;
    }

    const newMods = [...(selectedDrones[droneId].mods || []), modId];
    const newDrones = {
      ...selectedDrones,
      [droneId]: { ...selectedDrones[droneId], mods: newMods },
    };
    const newState = { ...value!, drones: newDrones };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  const handleRemoveMod = (droneId: string, modId: string) => {
    if (isSaved) return;
    if (!selectedDrones[droneId]) return;

    const newMods = (selectedDrones[droneId].mods || []).filter(
      (m) => m !== modId,
    );
    const newDrones = {
      ...selectedDrones,
      [droneId]: { ...selectedDrones[droneId], mods: newMods },
    };
    const newState = { ...value!, drones: newDrones };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  // Calculate stat bonuses from mods for a drone
  const getDroneStatBonuses = (droneId: string) => {
    const droneData = selectedDrones[droneId];
    if (!droneData?.mods) return {};
    const bonuses: Record<string, number> = {};
    for (const modId of droneData.mods) {
      const mod = droneModCatalog[modId];
      if (mod?.stat_bonuses) {
        for (const [stat, bonus] of Object.entries(mod.stat_bonuses)) {
          bonuses[stat] = (bonuses[stat] || 0) + (bonus as number);
        }
      }
    }
    return bonuses;
  };

  // Stat display helper
  const StatPill = ({
    label,
    val,
    bonus,
    color,
  }: {
    bonus?: number;
    color?: string;
    label: string;
    val: number;
  }) => (
    <Box
      as="span"
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.4rem',
        marginRight: '0.3rem',
        marginBottom: '0.2rem',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '4px',
        fontSize: '0.75rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>
        {label}
      </span>{' '}
      <span style={{ fontWeight: 'bold', color: color || '#fff' }}>
        {val + (bonus || 0)}
        {bonus !== undefined && bonus !== 0 && (
          <span
            style={{
              color: bonus > 0 ? SUCCESS_GREEN : DANGER_RED,
              fontSize: '0.7rem',
            }}
          >
            {' '}
            ({bonus > 0 ? '+' : ''}
            {bonus})
          </span>
        )}
      </span>
    </Box>
  );

  // Get category icon
  const getCategoryIcon = (categoryId: string) => {
    return CATEGORY_ICONS[categoryId] || CATEGORY_ICONS.default;
  };

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${ACCENT_BLUE_DIM}, rgba(0, 0, 0, 0.4))`,
        borderRadius: '8px',
        border: `1px solid ${ACCENT_BLUE_BORDER}`,
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
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
          background: `linear-gradient(135deg, transparent 50%, ${ACCENT_BLUE_DIM} 50%)`,
          opacity: '0.5',
        }}
      />

      {/* Header */}
      <Box style={{ marginBottom: '1rem' }}>
        <Stack align="center" justify="space-between">
          <Stack.Item>
            <Box
              style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: ACCENT_BLUE,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon name="robot" />
              Drone Bay
              {selectedDroneCount > 0 && (
                <Box
                  as="span"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.5rem',
                    background: ACCENT_BLUE_DIM,
                    border: `1px solid ${ACCENT_BLUE_BORDER}`,
                    borderRadius: '10px',
                    marginLeft: '0.5rem',
                  }}
                >
                  {selectedDroneCount} drone
                  {selectedDroneCount !== 1 ? 's' : ''}
                </Box>
              )}
            </Box>
          </Stack.Item>
        </Stack>
      </Box>

      {/* Nuyen Display Card */}
      <Box
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderLeft: `3px solid ${NUYEN_GOLD}`,
        }}
      >
        <Stack align="center" justify="space-between">
          <Stack.Item>
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon
                name="yen-sign"
                style={{
                  color: NUYEN_GOLD,
                  fontSize: '1.2rem',
                }}
              />
              <Box>
                <Box
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Nuyen Remaining
                </Box>
                <Box
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    color: nuyenRemaining < 0 ? DANGER_RED : NUYEN_GOLD,
                  }}
                >
                  ¥{nuyenRemaining.toLocaleString()}
                </Box>
              </Box>
            </Box>
          </Stack.Item>
          <Stack.Item>
            <Box
              style={{
                textAlign: 'right',
              }}
            >
              <Box
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Drone Fleet Cost
              </Box>
              <Box
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: ACCENT_BLUE,
                }}
              >
                ¥{totalDroneCost.toLocaleString()}
              </Box>
            </Box>
          </Stack.Item>
        </Stack>
      </Box>

      {/* Category Tabs */}
      <Box style={{ marginBottom: '0.75rem' }}>
        <Tabs fluid>
          {droneCategories
            .sort(
              (a: DroneCategoryMeta, b: DroneCategoryMeta) =>
                (a.sort || 0) - (b.sort || 0),
            )
            .map((cat: DroneCategoryMeta) => {
              const isActive = selectedCategory === cat.id;
              const selectedInCategory = Object.keys(selectedDrones).filter(
                (droneId) => {
                  const drone = droneCatalog[droneId];
                  return drone?.category === cat.id;
                },
              ).length;

              return (
                <Tabs.Tab
                  key={cat.id}
                  selected={isActive}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    ...(isActive && {
                      background: ACCENT_BLUE_DIM,
                      borderBottom: `2px solid ${ACCENT_BLUE}`,
                      boxShadow: `0 2px 8px ${ACCENT_BLUE_DIM}`,
                    }),
                  }}
                >
                  <Icon name={getCategoryIcon(cat.id)} mr={0.5} />
                  {cat.name}
                  {selectedInCategory > 0 && (
                    <Box
                      as="span"
                      style={{
                        marginLeft: '0.25rem',
                        padding: '0.1rem 0.35rem',
                        background: SUCCESS_GREEN,
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {selectedInCategory}
                    </Box>
                  )}
                </Tabs.Tab>
              );
            })}
        </Tabs>
      </Box>

      {/* Drone List */}
      <Box
        style={{
          flexGrow: '1',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
          padding: '0.5rem',
        }}
      >
        {categoryDrones.length === 0 ? (
          <Box
            style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              padding: '3rem',
            }}
          >
            <Icon
              name="robot"
              size={2}
              style={{
                marginBottom: '1rem',
                opacity: '0.5',
              }}
            />
            <Box>No drones in this category.</Box>
          </Box>
        ) : (
          <VirtualizedList
            items={categoryDrones}
            itemHeight={180}
            height={450}
            minItemsForVirtualization={15}
            renderItem={(drone: DroneMeta, _index, style) => {
              const isSelected = !!selectedDrones[drone.id];
              const modCost = isSelected
                ? (selectedDrones[drone.id]?.mods || []).reduce(
                    (sum, modId) => {
                      const mod = droneModCatalog[modId];
                      return sum + (mod?.cost || 0);
                    },
                    0,
                  )
                : 0;
              const canAfford =
                drone.cost <=
                nuyenRemaining + (isSelected ? drone.cost + modCost : 0);
              const droneBonuses = isSelected
                ? getDroneStatBonuses(drone.id)
                : {};
              const droneModCount = selectedDrones[drone.id]?.mods?.length || 0;

              return (
                <Box
                  key={drone.id}
                  style={{
                    ...style,
                    paddingRight: '0.5rem',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <Box
                    style={{
                      padding: '0.75rem',
                      height: '100%',
                      boxSizing: 'border-box',
                      background: isSelected
                        ? 'rgba(79, 195, 247, 0.1)'
                        : 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${isSelected ? ACCENT_BLUE : 'transparent'}`,
                      opacity: !canAfford && !isSelected ? '0.5' : '1',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                    }}
                  >
                    <Stack justify="space-between" align="flex-start">
                      <Stack.Item grow>
                        {/* Drone Name and Legality */}
                        <Box
                          style={{
                            fontWeight: 'bold',
                            color: isSelected ? ACCENT_BLUE : '#fff',
                            marginBottom: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Icon
                            name={getCategoryIcon(drone.category)}
                            style={{ opacity: '0.7' }}
                          />
                          <Tooltip
                            content={
                              drone.desc ||
                              `${drone.name} - ¥${drone.cost?.toLocaleString()}`
                            }
                            position="right"
                          >
                            <span>{drone.name}</span>
                          </Tooltip>
                          {drone.legality && (
                            <Box
                              as="span"
                              style={{
                                padding: '0.1rem 0.4rem',
                                background:
                                  drone.legality === 'F'
                                    ? 'rgba(220, 53, 69, 0.3)'
                                    : 'rgba(255, 140, 0, 0.3)',
                                border: `1px solid ${drone.legality === 'F' ? FORBIDDEN_RED : RESTRICTED_ORANGE}`,
                                borderRadius: '3px',
                                fontSize: '0.7rem',
                                color:
                                  drone.legality === 'F'
                                    ? FORBIDDEN_RED
                                    : RESTRICTED_ORANGE,
                              }}
                            >
                              <Icon
                                name={
                                  drone.legality === 'F'
                                    ? 'ban'
                                    : 'exclamation-triangle'
                                }
                                mr={0.25}
                              />
                              {drone.legality === 'F'
                                ? 'Forbidden'
                                : 'Restricted'}
                            </Box>
                          )}
                          {isSelected && (
                            <Box
                              as="span"
                              style={{
                                padding: '0.1rem 0.4rem',
                                background: 'rgba(76, 175, 80, 0.2)',
                                border: `1px solid ${SUCCESS_GREEN}`,
                                borderRadius: '3px',
                                fontSize: '0.7rem',
                                color: SUCCESS_GREEN,
                              }}
                            >
                              <Icon name="check" mr={0.25} />
                              Owned
                            </Box>
                          )}
                        </Box>

                        {/* Description */}
                        {drone.desc && (
                          <Box
                            style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem',
                              lineHeight: '1.3',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {drone.desc.length > 80
                              ? `${drone.desc.substring(0, 80)}...`
                              : drone.desc}
                          </Box>
                        )}

                        {/* Stats Row 1 */}
                        <Box style={{ marginBottom: '0.25rem' }}>
                          <StatPill
                            label="BOD"
                            val={drone.body}
                            bonus={droneBonuses.body}
                            color="#ff6b6b"
                          />
                          <StatPill
                            label="HND"
                            val={drone.handling}
                            bonus={droneBonuses.handling}
                            color="#4fc3f7"
                          />
                          <StatPill
                            label="SPD"
                            val={drone.speed}
                            bonus={droneBonuses.speed}
                            color="#81c784"
                          />
                          <StatPill
                            label="ARM"
                            val={drone.armor ?? 0}
                            bonus={droneBonuses.armor}
                            color="#ffb74d"
                          />
                        </Box>

                        {/* Stats Row 2 */}
                        <Box>
                          <StatPill
                            label="Pilot"
                            val={drone.pilot}
                            bonus={droneBonuses.pilot}
                            color="#ce93d8"
                          />
                          <StatPill
                            label="Sensor"
                            val={drone.sensor}
                            bonus={droneBonuses.sensor}
                            color="#90caf9"
                          />
                          <StatPill
                            label="Device"
                            val={drone.device_rating ?? 0}
                            color="#fff176"
                          />
                        </Box>

                        {/* Mods installed badge */}
                        {isSelected && droneModCount > 0 && (
                          <Box
                            style={{
                              marginTop: '0.5rem',
                              fontSize: '0.8rem',
                              color: SUCCESS_GREEN,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Icon name="cog" />
                            {droneModCount} mod{droneModCount !== 1 ? 's' : ''}{' '}
                            installed
                          </Box>
                        )}
                      </Stack.Item>

                      {/* Price and Actions */}
                      <Stack.Item>
                        <Box
                          style={{ textAlign: 'right', marginBottom: '0.5rem' }}
                        >
                          <Box
                            style={{
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              color:
                                canAfford || isSelected
                                  ? NUYEN_GOLD
                                  : DANGER_RED,
                            }}
                          >
                            ¥{drone.cost.toLocaleString()}
                            {isSelected && modCost > 0 && (
                              <Box
                                as="span"
                                style={{
                                  color: SUCCESS_GREEN,
                                  fontSize: '0.85rem',
                                  marginLeft: '0.25rem',
                                }}
                              >
                                +¥{modCost.toLocaleString()}
                              </Box>
                            )}
                          </Box>
                          <Box
                            style={{
                              fontSize: '0.75rem',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            Avail: {drone.availability}
                          </Box>
                        </Box>

                        <Stack vertical>
                          {isSelected ? (
                            <>
                              <Stack.Item>
                                <Button
                                  fluid
                                  icon="cog"
                                  disabled={isSaved}
                                  onClick={() =>
                                    setCustomizingDroneId(drone.id)
                                  }
                                  style={{
                                    background: ACCENT_BLUE_DIM,
                                    border: `1px solid ${ACCENT_BLUE_BORDER}`,
                                  }}
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
                                  onClick={() => handleRemoveDrone(drone.id)}
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
                                onClick={() => handleAddDrone(drone.id)}
                              >
                                Add
                              </Button>
                            </Stack.Item>
                          )}
                        </Stack>
                      </Stack.Item>
                    </Stack>
                  </Box>
                </Box>
              );
            }}
            emptyContent={
              <Box
                style={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.4)',
                  padding: '3rem',
                }}
              >
                <Icon name="robot" size={2} />
                <Box mt={1}>No drones in this category.</Box>
              </Box>
            }
          />
        )}
      </Box>

      {/* Selected Drones Summary */}
      {selectedDroneCount > 0 && (
        <Box
          style={{
            marginTop: '0.75rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            padding: '0.75rem',
            borderLeft: `3px solid ${ACCENT_BLUE}`,
          }}
        >
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <Box
              style={{
                fontWeight: 'bold',
                color: ACCENT_BLUE,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon name="helicopter" />
              Drone Fleet
            </Box>
            <Box
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {selectedDroneCount} drone{selectedDroneCount !== 1 ? 's' : ''}
            </Box>
          </Box>

          <Stack wrap="wrap">
            {Object.keys(selectedDrones).map((droneId: string) => {
              const drone = droneCatalog[droneId];
              const droneData = selectedDrones[droneId];
              const modCount = droneData?.mods?.length || 0;
              if (!drone) return null;
              return (
                <Stack.Item key={droneId}>
                  <Box
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.3rem 0.6rem',
                      margin: '0.15rem',
                      background: 'rgba(79, 195, 247, 0.15)',
                      border: `1px solid ${ACCENT_BLUE_BORDER}`,
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Icon
                      name={getCategoryIcon(drone.category)}
                      mr={0.5}
                      style={{ opacity: '0.7' }}
                    />
                    {drone.name}
                    {modCount > 0 && (
                      <Box
                        as="span"
                        ml={0.5}
                        style={{
                          color: SUCCESS_GREEN,
                          fontSize: '0.75rem',
                          background: 'rgba(76, 175, 80, 0.2)',
                          padding: '0.1rem 0.3rem',
                          borderRadius: '3px',
                        }}
                      >
                        <Icon name="cog" mr={0.25} />
                        {modCount}
                      </Box>
                    )}
                    <Button
                      icon="cog"
                      ml={0.5}
                      compact
                      color="transparent"
                      disabled={isSaved}
                      onClick={() => setCustomizingDroneId(droneId)}
                      tooltip="Customize"
                    />
                    <Button
                      icon="times"
                      compact
                      color="transparent"
                      disabled={isSaved}
                      onClick={() => handleRemoveDrone(droneId)}
                    />
                  </Box>
                </Stack.Item>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Drone Customization Modal */}
      {customizingDroneId && selectedDrones[customizingDroneId] && (
        <Box
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setCustomizingDroneId(null)}
        >
          <Box
            style={{
              background: `linear-gradient(135deg, rgba(79, 195, 247, 0.1), rgba(0, 0, 0, 0.6))`,
              border: `2px solid ${ACCENT_BLUE_BORDER}`,
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: `0 0 30px ${ACCENT_BLUE_DIM}`,
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {(() => {
              const drone = droneCatalog[customizingDroneId];
              const droneData = selectedDrones[customizingDroneId];
              const installedMods = droneData?.mods || [];
              const droneBonuses = getDroneStatBonuses(customizingDroneId);

              if (!drone) return null;

              return (
                <>
                  {/* Header */}
                  <Stack justify="space-between" align="center" mb={1}>
                    <Stack.Item>
                      <Box
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 'bold',
                          color: ACCENT_BLUE,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Icon name="cog" />
                        Customize: {drone.name}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="times"
                        color="transparent"
                        onClick={() => setCustomizingDroneId(null)}
                        style={{
                          fontSize: '1.2rem',
                        }}
                      />
                    </Stack.Item>
                  </Stack>

                  {/* Current Stats with bonuses */}
                  <Box
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '1rem',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      borderLeft: `3px solid ${ACCENT_BLUE}`,
                    }}
                  >
                    <Box
                      style={{
                        fontWeight: 'bold',
                        marginBottom: '0.75rem',
                        color: ACCENT_BLUE,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Icon name="chart-bar" />
                      Current Stats
                    </Box>
                    <Box>
                      <StatPill
                        label="BOD"
                        val={drone.body}
                        bonus={droneBonuses.body}
                        color="#ff6b6b"
                      />
                      <StatPill
                        label="HND"
                        val={drone.handling}
                        bonus={droneBonuses.handling}
                        color="#4fc3f7"
                      />
                      <StatPill
                        label="SPD"
                        val={drone.speed}
                        bonus={droneBonuses.speed}
                        color="#81c784"
                      />
                      <StatPill
                        label="ARM"
                        val={drone.armor ?? 0}
                        bonus={droneBonuses.armor}
                        color="#ffb74d"
                      />
                      <StatPill
                        label="Pilot"
                        val={drone.pilot}
                        bonus={droneBonuses.pilot}
                        color="#ce93d8"
                      />
                      <StatPill
                        label="Sensor"
                        val={drone.sensor}
                        bonus={droneBonuses.sensor}
                        color="#90caf9"
                      />
                    </Box>
                  </Box>

                  {/* Installed Mods */}
                  {installedMods.length > 0 && (
                    <Box
                      style={{
                        background: 'rgba(76, 175, 80, 0.1)',
                        border: `1px solid rgba(76, 175, 80, 0.3)`,
                        borderLeft: `3px solid ${SUCCESS_GREEN}`,
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        marginBottom: '1rem',
                      }}
                    >
                      <Box
                        style={{
                          fontWeight: 'bold',
                          marginBottom: '0.75rem',
                          color: SUCCESS_GREEN,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Icon name="check-circle" />
                        Installed Mods ({installedMods.length})
                      </Box>
                      {installedMods.map((modId: string) => {
                        const mod = droneModCatalog[modId];
                        if (!mod) return null;
                        return (
                          <Box
                            key={modId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.4rem 0.5rem',
                              marginBottom: '0.25rem',
                              background: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '4px',
                            }}
                          >
                            <Box
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <Icon
                                name={mod.icon}
                                style={{ color: SUCCESS_GREEN }}
                              />
                              <span>{mod.name}</span>
                            </Box>
                            <Box
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <Box
                                style={{
                                  color: NUYEN_GOLD,
                                  fontSize: '0.85rem',
                                }}
                              >
                                ¥{(mod.cost || 0).toLocaleString()}
                              </Box>
                              <Button
                                icon="times"
                                compact
                                color="bad"
                                disabled={isSaved}
                                onClick={() =>
                                  handleRemoveMod(customizingDroneId, modId)
                                }
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  {/* Mod Category Tabs */}
                  <Box style={{ marginBottom: '0.75rem' }}>
                    <Tabs fluid>
                      {droneModCategories
                        .sort(
                          (a: DroneCategoryMeta, b: DroneCategoryMeta) =>
                            (a.sort || 0) - (b.sort || 0),
                        )
                        .map((cat: DroneCategoryMeta) => {
                          const isActive = selectedModCategory === cat.id;
                          return (
                            <Tabs.Tab
                              key={cat.id}
                              selected={isActive}
                              onClick={() => setSelectedModCategory(cat.id)}
                              style={{
                                ...(isActive && {
                                  background: ACCENT_BLUE_DIM,
                                  borderBottom: `2px solid ${ACCENT_BLUE}`,
                                }),
                              }}
                            >
                              {cat.name}
                            </Tabs.Tab>
                          );
                        })}
                    </Tabs>
                  </Box>

                  {/* Available Mods */}
                  <Box
                    style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '0.5rem',
                      borderRadius: '6px',
                    }}
                  >
                    {(droneModsByCategory[selectedModCategory] || [])
                      .sort(
                        (a: DroneModMeta, b: DroneModMeta) =>
                          (a.sort || 0) - (b.sort || 0),
                      )
                      .map((mod: DroneModMeta) => {
                        const isInstalled = installedMods.includes(mod.id);
                        const canAffordMod = (mod.cost || 0) <= nuyenRemaining;
                        const isAllowedForDrone =
                          !mod.allowed_categories?.length ||
                          mod.allowed_categories.includes(drone.category);

                        return (
                          <Box
                            key={mod.id}
                            style={{
                              padding: '0.6rem 0.75rem',
                              marginBottom: '0.5rem',
                              background: isInstalled
                                ? 'rgba(76, 175, 80, 0.1)'
                                : 'rgba(0, 0, 0, 0.25)',
                              borderRadius: '6px',
                              borderLeft: `3px solid ${isInstalled ? SUCCESS_GREEN : 'transparent'}`,
                              opacity: !isAllowedForDrone
                                ? '0.4'
                                : !canAffordMod && !isInstalled
                                  ? '0.6'
                                  : '1',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Stack align="center">
                              <Stack.Item>
                                <Icon
                                  name={mod.icon}
                                  size={1.2}
                                  color={
                                    isInstalled ? SUCCESS_GREEN : ACCENT_BLUE
                                  }
                                />
                              </Stack.Item>
                              <Stack.Item grow>
                                <Box
                                  style={{
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span
                                    style={{
                                      color: isInstalled
                                        ? SUCCESS_GREEN
                                        : 'rgba(255, 255, 255, 0.9)',
                                    }}
                                  >
                                    {mod.name}
                                  </span>
                                  {mod.legality && (
                                    <Box
                                      as="span"
                                      style={{
                                        fontSize: '0.65rem',
                                        padding: '0.1rem 0.3rem',
                                        background:
                                          mod.legality === 'F'
                                            ? 'rgba(220, 53, 69, 0.3)'
                                            : 'rgba(255, 140, 0, 0.3)',
                                        border: `1px solid ${mod.legality === 'F' ? FORBIDDEN_RED : RESTRICTED_ORANGE}`,
                                        borderRadius: '3px',
                                        color:
                                          mod.legality === 'F'
                                            ? FORBIDDEN_RED
                                            : RESTRICTED_ORANGE,
                                      }}
                                    >
                                      {mod.legality}
                                    </Box>
                                  )}
                                  {!isAllowedForDrone && (
                                    <Box
                                      as="span"
                                      style={{
                                        fontSize: '0.7rem',
                                        color: DANGER_RED,
                                      }}
                                    >
                                      (Incompatible)
                                    </Box>
                                  )}
                                </Box>
                                <Box
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    marginTop: '0.2rem',
                                  }}
                                >
                                  {mod.desc}
                                </Box>
                                {mod.stat_bonuses &&
                                  Object.keys(mod.stat_bonuses).length > 0 && (
                                    <Box
                                      style={{
                                        fontSize: '0.7rem',
                                        marginTop: '0.35rem',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem',
                                      }}
                                    >
                                      {Object.entries(mod.stat_bonuses).map(
                                        ([stat, bonus]: [string, any]) => (
                                          <Box
                                            key={stat}
                                            as="span"
                                            style={{
                                              padding: '0.1rem 0.3rem',
                                              background:
                                                bonus > 0
                                                  ? 'rgba(76, 175, 80, 0.2)'
                                                  : 'rgba(255, 107, 107, 0.2)',
                                              borderRadius: '3px',
                                              color:
                                                bonus > 0
                                                  ? SUCCESS_GREEN
                                                  : DANGER_RED,
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
                                      color: NUYEN_GOLD,
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    ¥{(mod.cost || 0).toLocaleString()}
                                  </Box>
                                  <Box
                                    style={{
                                      fontSize: '0.7rem',
                                      color: 'rgba(255, 255, 255, 0.5)',
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
                                        customizingDroneId,
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
                                      isSaved ||
                                      !canAffordMod ||
                                      !isAllowedForDrone
                                    }
                                    onClick={() =>
                                      handleAddMod(customizingDroneId, mod.id)
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
                  </Box>

                  {/* Close Button */}
                  <Box
                    style={{
                      marginTop: '1.25rem',
                      textAlign: 'center',
                    }}
                  >
                    <Button
                      icon="check"
                      onClick={() => setCustomizingDroneId(null)}
                      style={{
                        padding: '0.5rem 2rem',
                        background: `linear-gradient(135deg, ${ACCENT_BLUE}, #3d9fd1)`,
                        border: 'none',
                        fontWeight: 'bold',
                      }}
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
