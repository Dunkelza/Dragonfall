/**
 * VirtualizedList Component
 *
 * A wrapper around react-window's List for rendering large lists efficiently.
 * Only renders items currently in view, dramatically improving performance for lists
 * with 100+ items (skills, gear, augments, etc.)
 *
 * Updated for react-window v2 API.
 *
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={filteredAugments}
 *   itemHeight={80}
 *   height={400}
 *   renderItem={(augment, index, style) => (
 *     <div style={style} key={augment.id}>
 *       <AugmentCard augment={augment} />
 *     </div>
 *   )}
 * />
 * ```
 */

import { CSSProperties, memo, ReactElement, ReactNode, useMemo } from 'react';
import { List, useDynamicRowHeight } from 'react-window';

import { Box } from '../../../components';

// ============================================================================
// TYPES
// ============================================================================

export type VirtualizedListProps<T> = {
  /** Additional class name for the container */
  className?: string;
  /** Empty state content when items array is empty */
  emptyContent?: ReactNode;
  /** Height of the list container in pixels */
  height: number;
  /** Height of each item in pixels (must be consistent for fixed-size lists) */
  itemHeight: number;
  /** Array of items to render */
  items: T[];
  /** Threshold for virtualization - lists smaller than this render normally */
  minItemsForVirtualization?: number;
  /** Number of items to render outside of the visible area (default: 3) */
  overscanCount?: number;
  /**
   * Render function for each item
   * @param item - The item to render
   * @param index - Index of the item in the array
   * @param style - Style object that MUST be applied to the outer element for positioning
   */
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  /** Width of the list (default: 100%) */
  width?: number | string;
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * VirtualizedList - Efficiently renders large lists using windowing
 *
 * Only items currently in the viewport (plus overscan) are rendered,
 * making it performant for lists with hundreds or thousands of items.
 */
function VirtualizedListInner<T>(props: VirtualizedListProps<T>) {
  const {
    items,
    itemHeight,
    height,
    width = '100%',
    overscanCount = 3,
    renderItem,
    emptyContent,
    className,
    minItemsForVirtualization = 20,
  } = props;

  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({
      items,
      renderItem,
    }),
    [items, renderItem],
  );

  // Empty state
  if (items.length === 0) {
    return (
      <Box className={className}>
        {emptyContent || (
          <Box
            style={{
              padding: '2rem',
              textAlign: 'center',
              opacity: '0.6',
              fontStyle: 'italic',
            }}
          >
            No items to display
          </Box>
        )}
      </Box>
    );
  }

  // For small lists, render normally without virtualization overhead
  if (items.length < minItemsForVirtualization) {
    return (
      <Box
        className={className}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          overflowY: 'auto',
          width: typeof width === 'number' ? `${width}px` : width,
        }}
      >
        {items.map((item, index) =>
          renderItem(item, index, {
            position: 'relative',
            height: itemHeight,
          }),
        )}
      </Box>
    );
  }

  // Row component for react-window v2
  const RowComponent = (rowProps: {
    ariaAttributes: {
      'aria-posinset': number;
      'aria-setsize': number;
      role: 'listitem';
    };
    index: number;
    style: CSSProperties;
  }): ReactElement | null => {
    const { index, style, ariaAttributes } = rowProps;
    const item = itemData.items[index];
    return (
      <div {...ariaAttributes} style={style}>
        {itemData.renderItem(item, index, { width: '100%', height: '100%' })}
      </div>
    );
  };

  // For large lists, use virtualization
  return (
    <Box
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: `${height}px`,
      }}
    >
      <List<Record<never, never>>
        rowCount={items.length}
        rowHeight={itemHeight}
        overscanCount={overscanCount}
        rowComponent={RowComponent}
        rowProps={{}}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const VirtualizedList = memo(
  VirtualizedListInner,
) as typeof VirtualizedListInner;

// ============================================================================
// VARIABLE SIZE LIST (for items with dynamic heights)
// ============================================================================

export type VariableSizeListProps<T> = {
  /** Additional class name for the container */
  className?: string;
  /** Empty state content when items array is empty */
  emptyContent?: ReactNode;
  /** Estimated average item height (used for scroll position calculation) */
  estimatedItemHeight: number;
  /**
   * Function to get the height of a specific item
   * @param item - The item
   * @param index - Index of the item
   * @returns Height in pixels for this item
   */
  getItemHeight: (item: T, index: number) => number;
  /** Height of the list container in pixels */
  height: number;
  /** Array of items to render */
  items: T[];
  /** Threshold for virtualization - lists smaller than this render normally */
  minItemsForVirtualization?: number;
  /** Number of items to render outside of the visible area (default: 3) */
  overscanCount?: number;
  /**
   * Render function for each item
   * @param item - The item to render
   * @param index - Index of the item in the array
   * @param style - Style object that MUST be applied to the outer element for positioning
   */
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  /** Width of the list (default: 100%) */
  width?: number | string;
};

/**
 * VariableSizeVirtualizedList - For lists where items have different heights
 *
 * Use this when items can expand/collapse or have variable content.
 * Uses react-window v2's dynamic row height feature.
 */
function VariableSizeVirtualizedListInner<T>(props: VariableSizeListProps<T>) {
  const {
    items,
    estimatedItemHeight,
    getItemHeight,
    height,
    width = '100%',
    overscanCount = 3,
    renderItem,
    emptyContent,
    className,
    minItemsForVirtualization = 20,
  } = props;

  // Use dynamic row height for variable sizing
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: estimatedItemHeight,
  });

  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({
      items,
      renderItem,
      getItemHeight,
    }),
    [items, renderItem, getItemHeight],
  );

  // Empty state
  if (items.length === 0) {
    return (
      <Box className={className}>
        {emptyContent || (
          <Box
            style={{
              padding: '2rem',
              textAlign: 'center',
              opacity: '0.6',
              fontStyle: 'italic',
            }}
          >
            No items to display
          </Box>
        )}
      </Box>
    );
  }

  // For small lists, render normally without virtualization overhead
  if (items.length < minItemsForVirtualization) {
    return (
      <Box
        className={className}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          overflowY: 'auto',
          width: typeof width === 'number' ? `${width}px` : width,
        }}
      >
        {items.map((item, index) =>
          renderItem(item, index, {
            position: 'relative',
            minHeight: getItemHeight(item, index),
          }),
        )}
      </Box>
    );
  }

  // Row component for react-window v2
  const RowComponent = (rowProps: {
    ariaAttributes: {
      'aria-posinset': number;
      'aria-setsize': number;
      role: 'listitem';
    };
    index: number;
    style: CSSProperties;
  }): ReactElement | null => {
    const { index, style, ariaAttributes } = rowProps;
    const item = itemData.items[index];
    return (
      <div
        {...ariaAttributes}
        style={style}
        data-row-index={index}
        className="virtualized-row"
      >
        {itemData.renderItem(item, index, { width: '100%' })}
      </div>
    );
  };

  // For large lists, use virtualization with dynamic height
  return (
    <Box
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: `${height}px`,
      }}
    >
      <List<Record<never, never>>
        rowCount={items.length}
        rowHeight={dynamicRowHeight}
        overscanCount={overscanCount}
        rowComponent={RowComponent}
        rowProps={{}}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const VariableSizeVirtualizedList = memo(
  VariableSizeVirtualizedListInner,
) as typeof VariableSizeVirtualizedListInner;

// ============================================================================
// GRID VARIANT (for card layouts)
// ============================================================================

export type VirtualizedGridProps<T> = {
  /** Additional class name for the container */
  className?: string;
  /** Number of columns in the grid */
  columnCount: number;
  /** Width of each column in pixels */
  columnWidth: number;
  /** Empty state content when items array is empty */
  emptyContent?: ReactNode;
  /** Height of the grid container in pixels */
  height: number;
  /** Array of items to render */
  items: T[];
  /** Threshold for virtualization */
  minItemsForVirtualization?: number;
  /**
   * Render function for each item
   * @param item - The item to render
   * @param index - Index of the item in the array
   * @param style - Style object for the cell
   */
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  /** Height of each row in pixels */
  rowHeight: number;
  /** Width of the grid (default: 100%) */
  width?: number | string;
};

/**
 * VirtualizedGrid - Efficiently renders large grids using windowing
 *
 * Useful for card-based layouts like augments, gear, or drone catalogs.
 * Calculates rows from items and renders them as a virtualized list.
 */
export function VirtualizedGrid<T>(props: VirtualizedGridProps<T>) {
  const {
    items,
    columnCount,
    columnWidth,
    rowHeight,
    height,
    width = '100%',
    renderItem,
    emptyContent,
    className,
    minItemsForVirtualization = 20,
  } = props;

  // Calculate number of rows
  const rowCount = Math.ceil(items.length / columnCount);

  // Empty state
  if (items.length === 0) {
    return (
      <Box className={className}>
        {emptyContent || (
          <Box
            style={{
              padding: '2rem',
              textAlign: 'center',
              opacity: '0.6',
              fontStyle: 'italic',
            }}
          >
            No items to display
          </Box>
        )}
      </Box>
    );
  }

  // For small grids, render normally
  if (items.length < minItemsForVirtualization) {
    return (
      <Box
        className={className}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columnCount}, ${columnWidth}px)`,
          gap: '0.5rem',
          maxHeight: `${height}px`,
          overflowY: 'auto',
          width: typeof width === 'number' ? `${width}px` : width,
        }}
      >
        {items.map((item, index) =>
          renderItem(item, index, {
            width: columnWidth,
            height: rowHeight - 8, // Account for gap
          }),
        )}
      </Box>
    );
  }

  // Render row containing multiple columns
  const renderRow = (rowIndex: number, style: CSSProperties) => {
    const startIndex = rowIndex * columnCount;
    const rowItems = items.slice(startIndex, startIndex + columnCount);

    return (
      <div
        key={rowIndex}
        style={{
          ...style,
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        {rowItems.map((item, colIndex) =>
          renderItem(item, startIndex + colIndex, {
            width: columnWidth,
            height: rowHeight - 8,
            flexShrink: 0,
          }),
        )}
      </div>
    );
  };

  // Create row data for the list
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <VirtualizedList
      className={className}
      items={rows}
      itemHeight={rowHeight}
      height={height}
      width={width}
      renderItem={(rowIndex, _, style) => renderRow(rowIndex, style)}
      minItemsForVirtualization={Math.ceil(
        minItemsForVirtualization / columnCount,
      )}
    />
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate optimal list height based on available viewport space
 * @param maxItems - Maximum number of items to show without scrolling
 * @param itemHeight - Height of each item
 * @param minHeight - Minimum height of the list
 * @param maxHeight - Maximum height of the list
 */
export function calculateListHeight(
  itemCount: number,
  itemHeight: number,
  maxItems: number = 8,
  minHeight: number = 200,
  maxHeight: number = 500,
): number {
  const naturalHeight = Math.min(itemCount, maxItems) * itemHeight;
  return Math.max(minHeight, Math.min(naturalHeight, maxHeight));
}

/**
 * Helper to create a stable style object for virtualized items
 * This helps prevent unnecessary re-renders
 */
export function createItemStyle(
  baseStyle: CSSProperties,
  additionalStyle?: CSSProperties,
): CSSProperties {
  return {
    ...baseStyle,
    ...additionalStyle,
    // Ensure proper box model
    boxSizing: 'border-box',
  };
}
