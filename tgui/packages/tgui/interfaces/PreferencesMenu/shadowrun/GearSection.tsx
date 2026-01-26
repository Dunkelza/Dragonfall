/**
 * Gear Section Component
 *
 * Handles gear selection and purchasing during character generation.
 */

import { memo, useMemo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import {
  Box,
  Button,
  Icon,
  Input,
  Section,
  Stack,
  Tabs,
} from '../../../components';
import {
  ChargenConstData,
  ChargenState,
  DashboardData,
  GearCategoryMeta,
  GearItemMeta,
  GearSelection,
} from './types';

type GearSectionProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  dashboardData: DashboardData | null;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  value: ChargenState | null;
};

export const GearSection = memo((props: GearSectionProps) => {
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
    'sr_gear_category',
    'weapons',
  );
  const [searchFilter, setSearchFilter] = useLocalState<string>(
    'sr_gear_search',
    '',
  );

  const gearCategories = chargenConstData?.gear_categories || [];
  const gearByCategory = chargenConstData?.gear_by_category || {};
  const gearCatalog = chargenConstData?.gear_catalog || {};
  const selectedGear = chargenState?.gear || [];

  const nuyenRemaining = dashboardData?.nuyenRemaining || 0;

  // Get items for current category
  const categoryItems = useMemo(() => {
    const items = gearByCategory[selectedCategory] || [];
    // Sort by subcategory, then by sort order
    return [...items].sort((a: GearItemMeta, b: GearItemMeta) => {
      if (a.subcategory !== b.subcategory) {
        return (a.subcategory || '').localeCompare(b.subcategory || '');
      }
      return (a.sort || 0) - (b.sort || 0);
    });
  }, [gearByCategory, selectedCategory]);

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return categoryItems;
    const filter = searchFilter.toLowerCase();
    return categoryItems.filter(
      (item: GearItemMeta) =>
        item.name?.toLowerCase().includes(filter) ||
        item.desc?.toLowerCase().includes(filter) ||
        item.subcategory?.toLowerCase().includes(filter),
    );
  }, [categoryItems, searchFilter]);

  // Group items by subcategory
  const groupedItems = useMemo(() => {
    const groups: Record<string, GearItemMeta[]> = {};
    for (const item of filteredItems) {
      const sub = item.subcategory || 'General';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(item);
    }
    return groups;
  }, [filteredItems]);

  // Check if an item is selected
  const isItemSelected = (itemId: string) => {
    return selectedGear.some((g: GearSelection) => g.id === itemId);
  };

  // Get quantity of selected item
  const getItemQuantity = (itemId: string) => {
    const entry = selectedGear.find((g: GearSelection) => g.id === itemId);
    return entry?.quantity || 0;
  };

  // Handle adding gear
  const handleAddGear = (itemId: string) => {
    if (isSaved) return;

    const gearData = gearCatalog[itemId];
    if (!gearData) return;

    // Check if we can afford it
    if (nuyenRemaining < gearData.cost) return;

    const newGear = [...selectedGear];

    // If stackable, increment quantity
    if (gearData.stackable) {
      const existing = newGear.find((g: GearSelection) => g.id === itemId);
      if (existing) {
        if ((existing.quantity || 0) >= (gearData.max_quantity || 1)) return;
        existing.quantity = (existing.quantity || 0) + 1;
      } else {
        newGear.push({ id: itemId, quantity: 1 });
      }
    } else {
      // Non-stackable: just add if not already present
      if (!isItemSelected(itemId)) {
        newGear.push({ id: itemId, quantity: 1 });
      }
    }

    const newState = { ...value!, gear: newGear };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  // Handle removing gear
  const handleRemoveGear = (itemId: string) => {
    if (isSaved) return;

    const gearData = gearCatalog[itemId];
    if (!gearData) return;

    let newGear = [...selectedGear];

    if (gearData.stackable) {
      const existing = newGear.find((g: GearSelection) => g.id === itemId);
      if (existing) {
        existing.quantity = (existing.quantity || 0) - 1;
        if ((existing.quantity || 0) <= 0) {
          newGear = newGear.filter((g: GearSelection) => g.id !== itemId);
        }
      }
    } else {
      newGear = newGear.filter((g: GearSelection) => g.id !== itemId);
    }

    const newState = { ...value!, gear: newGear };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  // Calculate total gear cost
  const totalGearCost = useMemo(() => {
    return selectedGear.reduce((total: number, g: GearSelection) => {
      const gearData = gearCatalog[g.id];
      return total + (gearData?.cost || 0) * (g.quantity || 1);
    }, 0);
  }, [selectedGear, gearCatalog]);

  return (
    <Stack fill vertical>
      {/* Category tabs and nuyen display */}
      <Stack.Item>
        <Stack align="center">
          <Stack.Item grow>
            <Tabs fluid>
              {gearCategories.map((cat: GearCategoryMeta) => (
                <Tabs.Tab
                  key={cat.id}
                  selected={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Tabs.Tab>
              ))}
            </Tabs>
          </Stack.Item>
          <Stack.Item>
            <Box
              style={{
                padding: '0.5rem 1rem',
                background:
                  nuyenRemaining < 0
                    ? 'rgba(255, 0, 0, 0.2)'
                    : 'rgba(255, 215, 0, 0.1)',
                borderRadius: '4px',
                fontWeight: 'bold',
                color: nuyenRemaining < 0 ? '#ff6b6b' : '#ffd700',
              }}
            >
              <Icon name="yen-sign" mr={0.5} />
              {nuyenRemaining.toLocaleString()} remaining
            </Box>
          </Stack.Item>
        </Stack>
      </Stack.Item>

      {/* Search bar */}
      <Stack.Item>
        <Input
          placeholder="Search gear..."
          value={searchFilter}
          onInput={(_, v) => setSearchFilter(v)}
          fluid
        />
      </Stack.Item>

      {/* Gear list */}
      <Stack.Item grow>
        <Section
          fill
          scrollable
          title={
            gearCategories.find(
              (c: GearCategoryMeta) => c.id === selectedCategory,
            )?.name || 'Gear'
          }
        >
          {Object.entries(groupedItems).map(([subcategory, items]) => (
            <Box key={subcategory} mb={1}>
              <Box
                style={{
                  fontWeight: 'bold',
                  color: '#9b8fc7',
                  borderBottom: '1px solid rgba(155, 143, 199, 0.3)',
                  marginBottom: '0.5rem',
                  paddingBottom: '0.25rem',
                }}
              >
                {subcategory}
              </Box>
              {items.map((item: GearItemMeta) => {
                const isSelected = isItemSelected(item.id);
                const quantity = getItemQuantity(item.id);
                const canAfford = nuyenRemaining >= item.cost || isSelected;
                const canAddMore =
                  item.stackable &&
                  isSelected &&
                  quantity < (item.max_quantity || 1) &&
                  nuyenRemaining >= item.cost;

                return (
                  <Box
                    key={item.id}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.25rem',
                      background: isSelected
                        ? 'rgba(155, 143, 199, 0.15)'
                        : 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                      border: isSelected
                        ? '1px solid rgba(155, 143, 199, 0.4)'
                        : '1px solid transparent',
                      opacity: canAfford || isSelected ? '1' : '0.5',
                    }}
                  >
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box>
                          <Tooltip
                            content={item.desc || item.name}
                            position="right"
                          >
                            <Box
                              as="span"
                              style={{
                                fontWeight: 'bold',
                                marginRight: '0.5rem',
                              }}
                            >
                              {item.name}
                            </Box>
                          </Tooltip>
                          {item.legality && (
                            <Box
                              as="span"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.1rem 0.3rem',
                                background:
                                  item.legality === 'F'
                                    ? 'rgba(255, 0, 0, 0.3)'
                                    : 'rgba(255, 165, 0, 0.3)',
                                borderRadius: '2px',
                                marginRight: '0.5rem',
                              }}
                            >
                              {item.legality === 'F'
                                ? 'Forbidden'
                                : 'Restricted'}
                            </Box>
                          )}
                          {isSelected && (
                            <Box
                              as="span"
                              style={{
                                fontSize: '0.75rem',
                                color: '#4caf50',
                              }}
                            >
                              <Icon name="check" mr={0.25} />
                              {item.stackable ? `×${quantity}` : 'Owned'}
                            </Box>
                          )}
                        </Box>
                        <Box
                          style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                          }}
                        >
                          {item.desc}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            color: '#ffd700',
                            fontWeight: 'bold',
                            marginRight: '0.5rem',
                          }}
                        >
                          ¥{item.cost.toLocaleString()}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Stack>
                          {isSelected && (
                            <Stack.Item>
                              <Button
                                icon="minus"
                                color="bad"
                                disabled={isSaved}
                                onClick={() => handleRemoveGear(item.id)}
                              />
                            </Stack.Item>
                          )}
                          <Stack.Item>
                            <Button
                              icon="plus"
                              color="good"
                              disabled={
                                isSaved ||
                                (!canAfford && !isSelected) ||
                                (isSelected && !item.stackable) ||
                                (isSelected && !canAddMore)
                              }
                              onClick={() => handleAddGear(item.id)}
                            />
                          </Stack.Item>
                        </Stack>
                      </Stack.Item>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          ))}
          {filteredItems.length === 0 && (
            <Box
              style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                padding: '2rem',
              }}
            >
              No gear found matching your search.
            </Box>
          )}
        </Section>
      </Stack.Item>

      {/* Selected gear summary */}
      <Stack.Item>
        <Box
          style={{
            padding: '0.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
          }}
        >
          <Stack justify="space-between" align="center">
            <Stack.Item>
              <Box style={{ fontWeight: 'bold' }}>
                <Icon name="shopping-bag" mr={0.5} />
                {selectedGear.length} item
                {selectedGear.length !== 1 ? 's' : ''} selected
              </Box>
            </Stack.Item>
            <Stack.Item>
              <Box style={{ fontWeight: 'bold', color: '#ffd700' }}>
                Total: ¥{totalGearCost.toLocaleString()}
              </Box>
            </Stack.Item>
          </Stack>
        </Box>
      </Stack.Item>
    </Stack>
  );
});
