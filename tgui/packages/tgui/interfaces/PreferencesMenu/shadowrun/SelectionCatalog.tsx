/**
 * SelectionCatalog - Generic component for "browse catalog → add to selected" workflow
 *
 * This is a compound component pattern that provides a reusable structure for any
 * catalog-based selection interface (augments, gear, drones, spells, etc.)
 *
 * Usage:
 * @example
 * <SelectionCatalog<AugmentMeta>
 *   items={augments}
 *   selectedItems={selectedAugments}
 *   getItemId={(item) => item.id}
 *   categories={categories}
 *   renderItem={(item, { isSelected, onToggle }) => (
 *     <AugmentItem item={item} selected={isSelected} onClick={onToggle} />
 *   )}
 *   renderSummary={(selected) => <Box>Selected: {selected.length}</Box>}
 * />
 *
 * @example GearSection refactor pattern:
 * const { gearCatalog, gearCategories, gearByCategory } = useConstData();
 * const { chargenState, actions, isSaved } = useChargen();
 * const { nuyenRemaining } = useDashboardData();
 *
 * <SelectionCatalog<GearItemMeta, GearSelection>
 *   stateKey="sr_gear"
 *   categories={gearCategories.map(c => ({ id: c.id, name: c.name }))}
 *   itemsByCategory={gearByCategory}
 *   selectedItems={chargenState?.gear || []}
 *   getItemId={(item) => item.id}
 *   selectionToId={(sel) => sel.id}
 *   selectionToQuantity={(sel) => sel.quantity}
 *   getSubcategory={(item) => item.subcategory || 'General'}
 *   canAfford={(item) => nuyenRemaining >= item.cost}
 *   maxQuantity={(item) => item.stackable ? (item.max_quantity || 10) : 1}
 *   filterItem={(item, search) =>
 *     item.name.toLowerCase().includes(search) ||
 *     (item.desc || '').toLowerCase().includes(search)
 *   }
 *   disabled={isSaved}
 *   onAdd={(item) => actions.updateField('gear', [...gear, { id: item.id, quantity: 1 }])}
 *   onRemove={(item) => actions.updateField('gear', gear.filter(g => g.id !== item.id))}
 *   renderItem={(item, { isSelected, quantity, canAfford, onAdd, onRemove }) => (
 *     <CatalogItemCard
 *       name={item.name}
 *       description={item.desc}
 *       cost={item.cost}
 *       isSelected={isSelected}
 *       canAfford={canAfford}
 *       quantity={quantity}
 *       showQuantity={item.stackable}
 *       legality={item.legality}
 *       actions={
 *         <CatalogActionButtons
 *           canAdd={canAfford && (!isSelected || item.stackable)}
 *           canRemove={isSelected}
 *           stackable={item.stackable}
 *           onAdd={onAdd}
 *           onRemove={onRemove}
 *         />
 *       }
 *     />
 *   )}
 *   renderSummary={(selected) => (
 *     <Stack justify="space-between">
 *       <Stack.Item>{selected.length} items</Stack.Item>
 *       <Stack.Item>¥{totalCost.toLocaleString()}</Stack.Item>
 *     </Stack>
 *   )}
 * />
 */

import {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { useLocalState } from '../../../backend';
import { Box, Button, Icon, Input, Stack, Tabs } from '../../../components';

// ============================================================================
// CONTEXT & TYPES
// ============================================================================

/**
 * Category definition for tab navigation
 */
export type CatalogCategory = {
  /** Whether this category is disabled */
  disabled?: boolean;

  /** Optional icon name */
  icon?: string;
  /** Unique category ID */
  id: string;
  /** Display name */
  name: string;
};

/**
 * Render props for catalog items
 */
export type CatalogItemRenderProps<T> = {
  /** Whether the item can be afforded/added */
  canAfford: boolean;

  /** Whether the item is currently selected */
  isSelected: boolean;
  /** The item being rendered */
  item: T;
  /** Handler to add the item */
  onAdd: () => void;
  /** Handler to remove the item */
  onRemove: () => void;
  /** Handler to toggle selection */
  onToggle: () => void;
  /** Current quantity (for stackable items) */
  quantity: number;
};

/**
 * Props for the SelectionCatalog component
 */
export type SelectionCatalogProps<TItem, TSelection = TItem> = {
  /**
   * Function to check if an item can be afforded/added.
   * Return false to grey out the item.
   */
  canAfford?: (item: TItem) => boolean;

  /** Category tabs to display */
  categories: CatalogCategory[];
  /** Default category to show */
  defaultCategory?: string;
  /** Items disabled state (for locked sheets) */
  disabled?: boolean;
  /** Empty state content */
  emptyContent?: ReactNode;
  /**
   * Function to filter items based on search text.
   * Return true if item matches the search.
   */
  filterItem?: (item: TItem, searchText: string) => boolean;
  /** Get unique ID for an item */
  getItemId: (item: TItem) => string;
  /**
   * Group items by subcategory within a category.
   * Return subcategory name for each item.
   */
  getSubcategory?: (item: TItem) => string;
  /** Map of category ID -> items in that category */
  itemsByCategory: Record<string, TItem[]>;
  /**
   * Get maximum quantity for a stackable item.
   * Return 1 for non-stackable items.
   */
  maxQuantity?: (item: TItem) => number;
  /** Handler when an item is added */
  onAdd: (item: TItem) => void;
  /** Handler when an item is removed */
  onRemove: (item: TItem) => void;
  /**
   * Custom item renderer.
   * Receives the item and render props (isSelected, handlers, etc.)
   */
  renderItem: (item: TItem, props: CatalogItemRenderProps<TItem>) => ReactNode;
  /** Render the selected items summary at the bottom */
  renderSummary?: (selectedItems: TSelection[]) => ReactNode;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Current selected items */
  selectedItems: TSelection[];
  /** Get ID from a selection entry (defaults to treating selection as string) */
  selectionToId?: (selection: TSelection) => string;
  /** Get quantity from a selection entry */
  selectionToQuantity?: (selection: TSelection) => number;
  /** Whether to show search input */
  showSearch?: boolean;
  /**
   * Unique state key prefix for persisting UI state (active category, search, etc.)
   */
  stateKey: string;
};

/**
 * Internal context for compound components
 */
type SelectionCatalogContextValue<TItem> = {
  activeCategory: string;
  canAfford: (item: TItem) => boolean;
  disabled: boolean;
  getItemId: (item: TItem) => string;
  getQuantity: (itemId: string) => number;
  isSelected: (itemId: string) => boolean;
  onAdd: (item: TItem) => void;
  onRemove: (item: TItem) => void;
  searchText: string;
  setActiveCategory: (category: string) => void;
  setSearchText: (text: string) => void;
};

const SelectionCatalogContext =
  createContext<SelectionCatalogContextValue<unknown> | null>(null);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * A generic catalog selection component that provides:
 * - Category tabs for navigation
 * - Search/filter functionality
 * - Item listing with selection state
 * - Summary of selected items
 */
function SelectionCatalogInner<TItem, TSelection = TItem>(
  props: SelectionCatalogProps<TItem, TSelection>,
) {
  const {
    categories,
    itemsByCategory,
    renderItem,
    renderSummary,
    selectedItems,
    getItemId,
    selectionToId,
    selectionToQuantity,
    onAdd,
    onRemove,
    canAfford = () => true,
    filterItem,
    getSubcategory,
    maxQuantity,
    showSearch = true,
    searchPlaceholder = 'Search...',
    disabled = false,
    defaultCategory,
    stateKey,
    emptyContent,
  } = props;

  // UI state persistence
  const [activeCategory, setActiveCategory] = useLocalState<string>(
    `${stateKey}_category`,
    defaultCategory || categories[0]?.id || '',
  );
  const [searchText, setSearchText] = useLocalState<string>(
    `${stateKey}_search`,
    '',
  );

  // Selection lookup helpers
  const selectedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const sel of selectedItems) {
      const id = selectionToId
        ? selectionToId(sel)
        : typeof sel === 'string'
          ? sel
          : getItemId(sel as unknown as TItem);
      ids.add(id);
    }
    return ids;
  }, [selectedItems, selectionToId, getItemId]);

  const quantityById = useMemo(() => {
    const quantities = new Map<string, number>();
    for (const sel of selectedItems) {
      const id = selectionToId
        ? selectionToId(sel)
        : typeof sel === 'string'
          ? sel
          : getItemId(sel as unknown as TItem);
      const qty = selectionToQuantity ? selectionToQuantity(sel) : 1;
      quantities.set(id, (quantities.get(id) || 0) + qty);
    }
    return quantities;
  }, [selectedItems, selectionToId, selectionToQuantity, getItemId]);

  // Get items for current category
  const categoryItems = useMemo(() => {
    return itemsByCategory[activeCategory] || [];
  }, [itemsByCategory, activeCategory]);

  // Filter by search text
  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return categoryItems;
    const search = searchText.toLowerCase().trim();

    if (filterItem) {
      return categoryItems.filter((item) => filterItem(item, search));
    }

    // Default: check if any string property contains search text
    return categoryItems.filter((item) => {
      const itemAny = item as Record<string, unknown>;
      return Object.values(itemAny).some(
        (v) => typeof v === 'string' && v.toLowerCase().includes(search),
      );
    });
  }, [categoryItems, searchText, filterItem]);

  // Group by subcategory if needed
  const groupedItems = useMemo(() => {
    if (!getSubcategory) {
      return { General: filteredItems };
    }

    const groups: Record<string, TItem[]> = {};
    for (const item of filteredItems) {
      const sub = getSubcategory(item) || 'General';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(item);
    }
    return groups;
  }, [filteredItems, getSubcategory]);

  // Check functions
  const isSelected = useCallback(
    (itemId: string) => selectedIds.has(itemId),
    [selectedIds],
  );

  const getQuantity = useCallback(
    (itemId: string) => quantityById.get(itemId) || 0,
    [quantityById],
  );

  const checkCanAfford = useCallback(
    (item: TItem) => {
      if (disabled) return false;
      return canAfford(item);
    },
    [disabled, canAfford],
  );

  // Build context value
  const contextValue = useMemo(
    (): SelectionCatalogContextValue<TItem> => ({
      activeCategory,
      setActiveCategory,
      searchText,
      setSearchText,
      isSelected,
      getQuantity,
      canAfford: checkCanAfford,
      onAdd,
      onRemove,
      disabled,
      getItemId,
    }),
    [
      activeCategory,
      setActiveCategory,
      searchText,
      setSearchText,
      isSelected,
      getQuantity,
      checkCanAfford,
      onAdd,
      onRemove,
      disabled,
      getItemId,
    ],
  );

  return (
    <SelectionCatalogContext.Provider
      value={contextValue as SelectionCatalogContextValue<unknown>}
    >
      <Stack fill vertical>
        {/* Category Tabs */}
        <Stack.Item>
          <Tabs fluid>
            {categories.map((cat) => (
              <Tabs.Tab
                key={cat.id}
                icon={cat.icon}
                selected={activeCategory === cat.id}
                disabled={cat.disabled}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Tabs.Tab>
            ))}
          </Tabs>
        </Stack.Item>

        {/* Search Input */}
        {showSearch && (
          <Stack.Item>
            <Input
              placeholder={searchPlaceholder}
              value={searchText}
              onInput={(_, v) => setSearchText(v)}
              fluid
            />
          </Stack.Item>
        )}

        {/* Item List */}
        <Stack.Item
          grow
          style={{
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '0.5rem',
            borderRadius: '4px',
          }}
        >
          {Object.entries(groupedItems).map(([subcategory, items]) => (
            <Box key={subcategory} mb={1}>
              {/* Subcategory header (only if grouping) */}
              {getSubcategory && (
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
              )}
              {/* Items */}
              {items.map((item) => {
                const itemId = getItemId(item);
                const itemIsSelected = isSelected(itemId);
                const itemQuantity = getQuantity(itemId);
                const itemCanAfford = checkCanAfford(item);
                const itemMaxQty = maxQuantity ? maxQuantity(item) : 1;

                const handleToggle = () => {
                  if (disabled) return;
                  if (itemIsSelected) {
                    onRemove(item);
                  } else if (itemCanAfford) {
                    onAdd(item);
                  }
                };

                const handleAdd = () => {
                  if (disabled || !itemCanAfford) return;
                  if (itemQuantity >= itemMaxQty && itemMaxQty > 0) return;
                  onAdd(item);
                };

                const handleRemove = () => {
                  if (disabled) return;
                  onRemove(item);
                };

                return (
                  <Box key={itemId}>
                    {renderItem(item, {
                      item,
                      isSelected: itemIsSelected,
                      quantity: itemQuantity,
                      canAfford: itemCanAfford,
                      onToggle: handleToggle,
                      onAdd: handleAdd,
                      onRemove: handleRemove,
                    })}
                  </Box>
                );
              })}
            </Box>
          ))}
          {/* Empty state */}
          {filteredItems.length === 0 && (
            <Box
              style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                padding: '2rem',
              }}
            >
              {emptyContent || 'No items found matching your search.'}
            </Box>
          )}
        </Stack.Item>

        {/* Summary */}
        {renderSummary && (
          <Stack.Item>
            <Box
              style={{
                padding: '0.5rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
              }}
            >
              {renderSummary(selectedItems)}
            </Box>
          </Stack.Item>
        )}
      </Stack>
    </SelectionCatalogContext.Provider>
  );
}

// Memoized export
export const SelectionCatalog = memo(
  SelectionCatalogInner,
) as typeof SelectionCatalogInner;

// ============================================================================
// COMPOUND COMPONENTS
// ============================================================================

/**
 * Hook to access catalog context from compound components
 */
export function useSelectionCatalog<TItem>() {
  const ctx = useContext(SelectionCatalogContext);
  if (!ctx) {
    throw new Error(
      'useSelectionCatalog must be used within a SelectionCatalog',
    );
  }
  return ctx as SelectionCatalogContextValue<TItem>;
}

// ============================================================================
// COMMON ITEM RENDERERS
// ============================================================================

export type CatalogItemCardProps = {
  /** Optional action buttons to render on the right side */
  actions?: ReactNode;

  /** Whether item can be afforded */
  canAfford?: boolean;
  /** Item cost (displays with yen sign) */
  cost?: number;
  /** Item description */
  description?: string;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Icon name */
  icon?: string;
  /** Whether item is selected */
  isSelected?: boolean;
  /** Legality indicator (R/F) */
  legality?: string;
  /** Item name */
  name: string;
  /** Click handler */
  onClick?: () => void;
  /** Quantity (for stackable items) */
  quantity?: number;
  /** Whether to show quantity */
  showQuantity?: boolean;
  /** Optional tags/badges */
  tags?: ReactNode;
};

/**
 * Pre-styled card for catalog items.
 * Provides consistent styling across all catalog types.
 */
export const CatalogItemCard = memo((props: CatalogItemCardProps) => {
  const {
    name,
    description,
    cost,
    isSelected,
    canAfford = true,
    quantity,
    showQuantity,
    icon,
    legality,
    tags,
    actions,
    disabled,
    onClick,
  } = props;

  return (
    <Box
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
        cursor: disabled ? 'default' : 'pointer',
      }}
      onClick={!disabled ? onClick : undefined}
    >
      <Stack align="center">
        {/* Icon */}
        {icon && (
          <Stack.Item>
            <Icon name={icon} size={1.2} mr={0.5} />
          </Stack.Item>
        )}

        {/* Name & Description */}
        <Stack.Item grow>
          <Box>
            <Box
              as="span"
              style={{ fontWeight: 'bold', marginRight: '0.5rem' }}
            >
              {name}
            </Box>
            {legality && (
              <Box
                as="span"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.3rem',
                  background:
                    legality === 'F'
                      ? 'rgba(255, 0, 0, 0.3)'
                      : 'rgba(255, 165, 0, 0.3)',
                  borderRadius: '2px',
                  marginRight: '0.5rem',
                }}
              >
                {legality === 'F' ? 'Forbidden' : 'Restricted'}
              </Box>
            )}
            {tags}
            {isSelected && (
              <Box
                as="span"
                style={{
                  fontSize: '0.75rem',
                  color: '#4caf50',
                  marginLeft: '0.5rem',
                }}
              >
                <Icon name="check" mr={0.25} />
                {showQuantity && quantity ? `×${quantity}` : 'Selected'}
              </Box>
            )}
          </Box>
          {description && (
            <Box
              style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {description}
            </Box>
          )}
        </Stack.Item>

        {/* Cost */}
        {cost !== undefined && (
          <Stack.Item>
            <Box
              style={{
                color: '#ffd700',
                fontWeight: 'bold',
                marginRight: '0.5rem',
              }}
            >
              ¥{cost.toLocaleString()}
            </Box>
          </Stack.Item>
        )}

        {/* Actions */}
        {actions && <Stack.Item>{actions}</Stack.Item>}
      </Stack>
    </Box>
  );
});

// ============================================================================
// ACTION BUTTON HELPERS
// ============================================================================

export type CatalogActionButtonsProps = {
  canAdd?: boolean;
  canRemove?: boolean;
  disabled?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  stackable?: boolean;
};

/**
 * Standard add/remove buttons for catalog items
 */
export const CatalogActionButtons = memo((props: CatalogActionButtonsProps) => {
  const {
    onAdd,
    onRemove,
    canAdd = true,
    canRemove = false,
    disabled = false,
    stackable = false,
  } = props;

  if (stackable) {
    // Show +/- buttons for stackable items
    return (
      <Stack>
        {canRemove && (
          <Stack.Item>
            <Button
              icon="minus"
              color="bad"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
            />
          </Stack.Item>
        )}
        <Stack.Item>
          <Button
            icon="plus"
            color="good"
            disabled={disabled || !canAdd}
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.();
            }}
          />
        </Stack.Item>
      </Stack>
    );
  }

  // Single toggle button
  return (
    <Button
      icon={canRemove ? 'times' : 'plus'}
      color={canRemove ? 'bad' : 'good'}
      disabled={disabled || (!canRemove && !canAdd)}
      onClick={(e) => {
        e.stopPropagation();
        if (canRemove) {
          onRemove?.();
        } else {
          onAdd?.();
        }
      }}
    />
  );
});

// ============================================================================
// RESOURCE DISPLAY HELPERS
// ============================================================================

export type ResourceDisplayProps = {
  current: number;
  icon?: string;
  label: string;
  max: number;
  showRemaining?: boolean;
  unit?: string;
};

/**
 * Displays a resource (nuyen, essence, points) with color coding
 */
export const ResourceDisplay = memo((props: ResourceDisplayProps) => {
  const { label, current, max, icon, unit = '', showRemaining = true } = props;

  const remaining = max - current;
  const isOver = remaining < 0;
  const isExact = remaining === 0;

  return (
    <Box
      style={{
        fontSize: '0.9rem',
        color: isOver ? '#ff6b6b' : isExact ? '#4caf50' : '#9b8fc7',
      }}
    >
      {icon && <Icon name={icon} mr={0.5} />}
      {label}: <b>{current.toLocaleString()}</b>
      {unit}/{max.toLocaleString()}
      {unit}
      {showRemaining && remaining > 0 && (
        <Box as="span" style={{ opacity: '0.6', marginLeft: '0.3rem' }}>
          — {remaining.toLocaleString()}
          {unit} left
        </Box>
      )}
    </Box>
  );
});
