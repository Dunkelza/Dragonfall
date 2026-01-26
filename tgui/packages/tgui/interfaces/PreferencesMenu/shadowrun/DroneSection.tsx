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

  // Get drones for current category
  const categoryDrones = useMemo(() => {
    const drones = dronesByCategory[selectedCategory] || [];
    return [...drones].sort(
      (a: DroneMeta, b: DroneMeta) => (a.sort || 0) - (b.sort || 0),
    );
  }, [dronesByCategory, selectedCategory]);

  // Calculate total drone cost (including mods)
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
        padding: '0.15rem 0.35rem',
        marginRight: '0.25rem',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '3px',
        fontSize: '0.75rem',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}:</span>{' '}
      <span style={{ fontWeight: 'bold', color: color || '#fff' }}>
        {val + (bonus || 0)}
        {bonus !== undefined && bonus !== 0 && (
          <span style={{ color: bonus > 0 ? '#4caf50' : '#ff6b6b' }}>
            {' '}
            ({bonus > 0 ? '+' : ''}
            {bonus})
          </span>
        )}
      </span>
    </Box>
  );

  return (
    <Box style={{ marginTop: '1rem' }}>
      {/* Header */}
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <Box style={{ fontWeight: 'bold', fontSize: '1rem' }}>
          <Icon name="robot" mr={0.5} />
          Drones
        </Box>
        <Box style={{ color: '#ffd700', fontWeight: 'bold' }}>
          ¥{totalDroneCost.toLocaleString()} spent on drones
        </Box>
      </Box>

      {/* Category Tabs */}
      <Tabs fluid mb={0.5}>
        {droneCategories
          .sort(
            (a: DroneCategoryMeta, b: DroneCategoryMeta) =>
              (a.sort || 0) - (b.sort || 0),
          )
          .map((cat: DroneCategoryMeta) => (
            <Tabs.Tab
              key={cat.id}
              selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Tabs.Tab>
          ))}
      </Tabs>

      {/* Drone List */}
      <Box
        style={{
          maxHeight: '350px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          padding: '0.5rem',
        }}
      >
        {categoryDrones.map((drone: DroneMeta) => {
          const isSelected = !!selectedDrones[drone.id];
          const modCost = isSelected
            ? (selectedDrones[drone.id]?.mods || []).reduce((sum, modId) => {
                const mod = droneModCatalog[modId];
                return sum + (mod?.cost || 0);
              }, 0)
            : 0;
          const canAfford =
            drone.cost <=
            nuyenRemaining + (isSelected ? drone.cost + modCost : 0);
          const droneBonuses = isSelected ? getDroneStatBonuses(drone.id) : {};
          const droneModCount = selectedDrones[drone.id]?.mods?.length || 0;

          return (
            <Box
              key={drone.id}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: isSelected
                  ? 'rgba(155, 143, 199, 0.2)'
                  : 'rgba(0, 0, 0, 0.3)',
                border: isSelected
                  ? '1px solid rgba(155, 143, 199, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                opacity: !canAfford && !isSelected ? '0.5' : '1',
              }}
            >
              <Stack justify="space-between" align="flex-start">
                <Stack.Item grow>
                  <Box
                    style={{
                      fontWeight: 'bold',
                      color: isSelected ? '#9b8fc7' : '#fff',
                      marginBottom: '0.25rem',
                    }}
                  >
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
                          marginLeft: '0.5rem',
                          padding: '0.1rem 0.3rem',
                          background:
                            drone.legality === 'F'
                              ? 'rgba(255, 0, 0, 0.3)'
                              : 'rgba(255, 165, 0, 0.3)',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          color: drone.legality === 'F' ? '#ff6b6b' : '#ffb74d',
                        }}
                      >
                        {drone.legality === 'F' ? 'Forbidden' : 'Restricted'}
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
                    {drone.desc}
                  </Box>
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
                  {/* Show mods count badge if drone has mods */}
                  {isSelected && droneModCount > 0 && (
                    <Box
                      style={{
                        marginTop: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#4caf50',
                      }}
                    >
                      <Icon name="cog" mr={0.25} />
                      {droneModCount} mod{droneModCount !== 1 ? 's' : ''}{' '}
                      installed
                    </Box>
                  )}
                </Stack.Item>
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
                        color: canAfford || isSelected ? '#ffd700' : '#ff6b6b',
                      }}
                    >
                      ¥{drone.cost.toLocaleString()}
                      {isSelected && modCost > 0 && (
                        <Box
                          as="span"
                          style={{ color: '#4caf50', fontSize: '0.8rem' }}
                        >
                          {' '}
                          +¥{modCost.toLocaleString()}
                        </Box>
                      )}
                    </Box>
                    <Box
                      style={{
                        fontSize: '0.7rem',
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
                            color="transparent"
                            disabled={isSaved}
                            onClick={() => setCustomizingDroneId(drone.id)}
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
          );
        })}
        {categoryDrones.length === 0 && (
          <Box
            style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '2rem',
            }}
          >
            No drones in this category.
          </Box>
        )}
      </Box>

      {/* Selected drones summary */}
      {selectedDroneCount > 0 && (
        <Box
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
          }}
        >
          <Box style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
            <Icon name="helicopter" mr={0.5} />
            Selected Drones ({selectedDroneCount})
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
                      padding: '0.25rem 0.5rem',
                      margin: '0.1rem',
                      background: 'rgba(155, 143, 199, 0.2)',
                      border: '1px solid rgba(155, 143, 199, 0.4)',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {drone.name}
                    {modCount > 0 && (
                      <Box
                        as="span"
                        ml={0.25}
                        style={{ color: '#4caf50', fontSize: '0.75rem' }}
                      >
                        ({modCount})
                      </Box>
                    )}
                    <Button
                      icon="cog"
                      ml={0.25}
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
            background: 'rgba(0, 0, 0, 0.8)',
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
                          fontSize: '1.3rem',
                          fontWeight: 'bold',
                          color: '#9b8fc7',
                        }}
                      >
                        <Icon name="cog" mr={0.5} />
                        Customize: {drone.name}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="times"
                        color="transparent"
                        onClick={() => setCustomizingDroneId(null)}
                      />
                    </Stack.Item>
                  </Stack>

                  {/* Current Stats with bonuses */}
                  <Box
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    <Box style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
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
                        const mod = droneModCatalog[modId];
                        if (!mod) return null;
                        return (
                          <Stack key={modId} align="center" mb={0.25}>
                            <Stack.Item grow>
                              <Box style={{ fontSize: '0.9rem' }}>
                                <Icon name={mod.icon} mr={0.5} />
                                {mod.name}
                              </Box>
                            </Stack.Item>
                            <Stack.Item>
                              <Box
                                style={{ color: '#ffd700', fontSize: '0.8rem' }}
                              >
                                ¥{(mod.cost || 0).toLocaleString()}
                              </Box>
                            </Stack.Item>
                            <Stack.Item>
                              <Button
                                icon="times"
                                compact
                                color="bad"
                                disabled={isSaved}
                                onClick={() =>
                                  handleRemoveMod(customizingDroneId, modId)
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
                    {droneModCategories
                      .sort(
                        (a: DroneCategoryMeta, b: DroneCategoryMeta) =>
                          (a.sort || 0) - (b.sort || 0),
                      )
                      .map((cat: DroneCategoryMeta) => (
                        <Tabs.Tab
                          key={cat.id}
                          selected={selectedModCategory === cat.id}
                          onClick={() => setSelectedModCategory(cat.id)}
                        >
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
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              background: isInstalled
                                ? 'rgba(76, 175, 80, 0.15)'
                                : 'rgba(0, 0, 0, 0.3)',
                              border: isInstalled
                                ? '1px solid rgba(76, 175, 80, 0.5)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              opacity: !isAllowedForDrone
                                ? '0.4'
                                : !canAffordMod && !isInstalled
                                  ? '0.6'
                                  : '1',
                            }}
                          >
                            <Stack align="center">
                              <Stack.Item>
                                <Icon
                                  name={mod.icon}
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
                                  {!isAllowedForDrone && (
                                    <Box
                                      as="span"
                                      ml={0.5}
                                      style={{
                                        fontSize: '0.7rem',
                                        color: '#ff6b6b',
                                      }}
                                    >
                                      (Incompatible)
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
                                    ¥{(mod.cost || 0).toLocaleString()}
                                  </Box>
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
                  <Box style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Button
                      icon="check"
                      color="good"
                      onClick={() => setCustomizingDroneId(null)}
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
