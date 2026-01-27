/**
 * Gear Section Component
 *
 * Handles gear selection and purchasing during character generation.
 */

import { memo, useMemo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Icon, Input, Stack, Tabs } from '../../../components';
import {
  ChargenConstData,
  ChargenState,
  DashboardData,
  GearCategoryMeta,
  GearItemMeta,
  GearSelection,
} from './types';
import { VirtualizedList } from './VirtualizedList';

// === ACCENT COLORS ===
const ACCENT_ORANGE = '#ff9500';
const ACCENT_ORANGE_DIM = 'rgba(255, 149, 0, 0.15)';
const ACCENT_ORANGE_BORDER = 'rgba(255, 149, 0, 0.4)';
const NUYEN_GOLD = '#ffd700';
const NUYEN_GOLD_DIM = 'rgba(255, 215, 0, 0.15)';
const SUCCESS_GREEN = '#4caf50';
const DANGER_RED = '#ff6b6b';
const RESTRICTED_ORANGE = '#ff8c00';
const FORBIDDEN_RED = '#dc3545';

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  weapons: 'crosshairs',
  armor: 'shield-halved',
  electronics: 'microchip',
  gear: 'toolbox',
  vehicles: 'car',
  lifestyle: 'house',
  magical: 'hat-wizard',
  matrix: 'network-wired',
  biotech: 'syringe',
  default: 'box',
};

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

  // Flatten items for virtualization: interleave headers and items
  type FlatListItem =
    | { count: number; subcategory: string; type: 'header' }
    | { item: GearItemMeta; type: 'item' };

  const flattenedItems = useMemo<FlatListItem[]>(() => {
    const result: FlatListItem[] = [];
    for (const [subcategory, items] of Object.entries(groupedItems)) {
      result.push({ type: 'header', subcategory, count: items.length });
      for (const item of items) {
        result.push({ type: 'item', item });
      }
    }
    return result;
  }, [groupedItems]);

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

  // Calculate total item count (considering quantities)
  const totalItemCount = useMemo(() => {
    return selectedGear.reduce(
      (total: number, g: GearSelection) => total + (g.quantity || 1),
      0,
    );
  }, [selectedGear]);

  // Get the current category info
  const currentCategory = gearCategories.find(
    (c: GearCategoryMeta) => c.id === selectedCategory,
  );

  // Get category icon
  const getCategoryIcon = (categoryId: string) => {
    return CATEGORY_ICONS[categoryId] || CATEGORY_ICONS.default;
  };

  // Get nuyen status
  const nuyenStatus =
    nuyenRemaining < 0
      ? 'overspent'
      : nuyenRemaining === 0
        ? 'spent'
        : 'available';

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${ACCENT_ORANGE_DIM}, rgba(0, 0, 0, 0.4))`,
        borderRadius: '8px',
        border: `1px solid ${ACCENT_ORANGE_BORDER}`,
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
          background: `linear-gradient(135deg, transparent 50%, ${ACCENT_ORANGE_DIM} 50%)`,
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
                color: ACCENT_ORANGE,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon name="shopping-cart" />
              Gear Shop
              {totalItemCount > 0 && (
                <Box
                  as="span"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.5rem',
                    background: ACCENT_ORANGE_DIM,
                    border: `1px solid ${ACCENT_ORANGE_BORDER}`,
                    borderRadius: '10px',
                    marginLeft: '0.5rem',
                  }}
                >
                  {totalItemCount} item{totalItemCount !== 1 ? 's' : ''}
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
          borderLeft: `3px solid ${nuyenStatus === 'overspent' ? DANGER_RED : NUYEN_GOLD}`,
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
                    color:
                      nuyenStatus === 'overspent' ? DANGER_RED : NUYEN_GOLD,
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
                Total Spent
              </Box>
              <Box
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: ACCENT_ORANGE,
                }}
              >
                ¥{totalGearCost.toLocaleString()}
              </Box>
            </Box>
          </Stack.Item>
        </Stack>
        {/* Spending progress bar */}
        <Box
          style={{
            marginTop: '0.5rem',
            height: '4px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              width: `${Math.min(100, (totalGearCost / (totalGearCost + Math.max(0, nuyenRemaining))) * 100 || 0)}%`,
              height: '100%',
              background:
                nuyenStatus === 'overspent'
                  ? `linear-gradient(90deg, ${DANGER_RED}, #ff8888)`
                  : `linear-gradient(90deg, ${NUYEN_GOLD}, ${ACCENT_ORANGE})`,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Box>

      {/* Category Tabs */}
      <Box
        style={{
          marginBottom: '0.75rem',
        }}
      >
        <Tabs fluid>
          {gearCategories.map((cat: GearCategoryMeta) => {
            const isActive = selectedCategory === cat.id;
            const itemCount = (gearByCategory[cat.id] || []).length;
            const selectedInCategory = selectedGear.filter(
              (g: GearSelection) => {
                const gearData = gearCatalog[g.id];
                return gearData?.category === cat.id;
              },
            ).length;

            return (
              <Tabs.Tab
                key={cat.id}
                selected={isActive}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  ...(isActive && {
                    background: ACCENT_ORANGE_DIM,
                    borderBottom: `2px solid ${ACCENT_ORANGE}`,
                    boxShadow: `0 2px 8px ${ACCENT_ORANGE_DIM}`,
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

      {/* Search Bar */}
      <Box
        style={{
          marginBottom: '0.75rem',
        }}
      >
        <Box
          style={{
            position: 'relative',
          }}
        >
          <Icon
            name="search"
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.4)',
              zIndex: 1,
            }}
          />
          <Input
            placeholder="Search gear..."
            value={searchFilter}
            onInput={(_, v) => setSearchFilter(v)}
            fluid
            style={{
              paddingLeft: '2rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${ACCENT_ORANGE_BORDER}`,
              borderRadius: '4px',
            }}
          />
          {searchFilter && (
            <Button
              icon="times"
              style={{
                position: 'absolute',
                right: '0.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              onClick={() => setSearchFilter('')}
            />
          )}
        </Box>
      </Box>

      {/* Category Info Header */}
      {currentCategory && (
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            padding: '0.5rem 0.75rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Icon
            name={getCategoryIcon(selectedCategory)}
            style={{ color: ACCENT_ORANGE }}
          />
          <Box style={{ fontWeight: 'bold' }}>{currentCategory.name}</Box>
          <Box
            style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginLeft: 'auto',
            }}
          >
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </Box>
        </Box>
      )}

      {/* Gear List - Virtualized for performance */}
      <Box
        style={{
          flexGrow: '1',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
          padding: '0.5rem',
        }}
      >
        {filteredItems.length === 0 ? (
          <Box
            style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              padding: '3rem',
            }}
          >
            <Icon
              name="search"
              size={2}
              style={{
                marginBottom: '1rem',
                opacity: 0.5,
              }}
            />
            <Box>No gear found matching your search.</Box>
          </Box>
        ) : (
          <VirtualizedList
            items={flattenedItems}
            itemHeight={70}
            height={450}
            minItemsForVirtualization={30}
            renderItem={(listItem, index, style) => {
              if (listItem.type === 'header') {
                // Subcategory Header
                return (
                  <Box
                    key={`header-${listItem.subcategory}`}
                    style={{
                      ...style,
                      fontWeight: 'bold',
                      color: ACCENT_ORANGE,
                      borderBottom: `1px solid ${ACCENT_ORANGE_BORDER}`,
                      paddingBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      height: 'auto',
                      minHeight: 32,
                    }}
                  >
                    <Icon name="folder-open" size={0.8} />
                    {listItem.subcategory}
                    <Box
                      as="span"
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontWeight: 'normal',
                      }}
                    >
                      ({listItem.count})
                    </Box>
                  </Box>
                );
              }

              // Gear Item
              const item = listItem.item;
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
                    ...style,
                    padding: '0.6rem 0.75rem',
                    marginBottom: '0.35rem',
                    background: isSelected
                      ? 'rgba(76, 175, 80, 0.1)'
                      : 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${isSelected ? SUCCESS_GREEN : 'transparent'}`,
                    opacity: canAfford || isSelected ? '1' : '0.5',
                    boxSizing: 'border-box',
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
                              color: isSelected
                                ? SUCCESS_GREEN
                                : 'rgba(255, 255, 255, 0.9)',
                            }}
                          >
                            {item.name}
                          </Box>
                        </Tooltip>

                        {/* Legality Badge */}
                        {item.legality && (
                          <Box
                            as="span"
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.4rem',
                              background:
                                item.legality === 'F'
                                  ? 'rgba(220, 53, 69, 0.3)'
                                  : 'rgba(255, 140, 0, 0.3)',
                              border: `1px solid ${item.legality === 'F' ? FORBIDDEN_RED : RESTRICTED_ORANGE}`,
                              borderRadius: '3px',
                              marginRight: '0.5rem',
                              color:
                                item.legality === 'F'
                                  ? FORBIDDEN_RED
                                  : RESTRICTED_ORANGE,
                            }}
                          >
                            <Icon
                              name={
                                item.legality === 'F'
                                  ? 'ban'
                                  : 'exclamation-triangle'
                              }
                              mr={0.25}
                            />
                            {item.legality === 'F' ? 'Forbidden' : 'Restricted'}
                          </Box>
                        )}

                        {/* Selected/Quantity Badge */}
                        {isSelected && (
                          <Box
                            as="span"
                            style={{
                              fontSize: '0.75rem',
                              color: SUCCESS_GREEN,
                              background: 'rgba(76, 175, 80, 0.2)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '3px',
                            }}
                          >
                            <Icon name="check" mr={0.25} />
                            {item.stackable ? `×${quantity}` : 'Owned'}
                          </Box>
                        )}
                      </Box>

                      {/* Description - truncated for virtualization */}
                      {item.desc && (
                        <Box
                          style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            marginTop: '0.25rem',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.desc.length > 60
                            ? `${item.desc.substring(0, 60)}...`
                            : item.desc}
                        </Box>
                      )}
                    </Stack.Item>

                    {/* Price */}
                    <Stack.Item>
                      <Box
                        style={{
                          color: NUYEN_GOLD,
                          fontWeight: 'bold',
                          marginRight: '0.75rem',
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ¥{item.cost.toLocaleString()}
                      </Box>
                    </Stack.Item>

                    {/* Action Buttons */}
                    <Stack.Item>
                      <Stack>
                        {isSelected && (
                          <Stack.Item>
                            <Button
                              icon="minus"
                              color="bad"
                              disabled={isSaved}
                              onClick={() => handleRemoveGear(item.id)}
                              style={{
                                padding: '0.3rem 0.5rem',
                              }}
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
                            style={{
                              padding: '0.3rem 0.5rem',
                            }}
                          />
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </Box>
              );
            }}
          />
        )}
      </Box>

      {/* Shopping Cart Summary */}
      {selectedGear.length > 0 && (
        <Box
          style={{
            marginTop: '0.75rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            padding: '0.75rem',
            borderLeft: `3px solid ${ACCENT_ORANGE}`,
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
                color: ACCENT_ORANGE,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon name="shopping-bag" />
              Shopping Cart
            </Box>
            <Box
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {totalItemCount} item{totalItemCount !== 1 ? 's' : ''}
            </Box>
          </Box>

          {/* Selected items mini-list */}
          <Box
            style={{
              maxHeight: '100px',
              overflow: 'auto',
              marginBottom: '0.5rem',
            }}
          >
            {selectedGear.slice(0, 5).map((g: GearSelection) => {
              const gearData = gearCatalog[g.id];
              if (!gearData) return null;
              return (
                <Box
                  key={g.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    padding: '0.2rem 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Box
                    style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                    }}
                  >
                    {gearData.name}
                    {(g.quantity || 1) > 1 && (
                      <Box
                        as="span"
                        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {' '}
                        ×{g.quantity || 1}
                      </Box>
                    )}
                  </Box>
                  <Box style={{ color: NUYEN_GOLD, fontWeight: 'bold' }}>
                    ¥{(gearData.cost * (g.quantity || 1)).toLocaleString()}
                  </Box>
                </Box>
              );
            })}
            {selectedGear.length > 5 && (
              <Box
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textAlign: 'center',
                  padding: '0.25rem',
                }}
              >
                +{selectedGear.length - 5} more items...
              </Box>
            )}
          </Box>

          {/* Total */}
          <Box
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: `1px solid ${ACCENT_ORANGE_BORDER}`,
              paddingTop: '0.5rem',
            }}
          >
            <Box style={{ fontWeight: 'bold' }}>Total</Box>
            <Box
              style={{
                fontWeight: 'bold',
                fontSize: '1.1rem',
                color: NUYEN_GOLD,
              }}
            >
              ¥{totalGearCost.toLocaleString()}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
});
