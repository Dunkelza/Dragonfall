/**
 * @file CatalogHelpers.tsx
 * @description Reusable helper components for catalog-style sections
 * (Augments, Gear, Drones, etc.) to reduce code duplication.
 *
 * These are lightweight styled components that can be composed
 * into the specialized rendering each section requires.
 */

import { memo, ReactNode } from 'react';

import { Box, Button, Icon, Input, Stack, Tabs } from '../../../components';

// ============================================================================
// RESOURCE BAR
// ============================================================================

export type ResourceBarProps = {
  /** Accent color for the bar (CSS color string) */
  accentColor: string;
  /** Current amount used/remaining */
  current: number;
  /** Danger color when resource is critical */
  dangerColor?: string;
  /** Threshold (0-1) for danger state */
  dangerThreshold?: number;
  /** Format function for the current value */
  formatValue?: (value: number) => string;
  /** Icon name for the resource */
  icon: string;
  /** Display label (e.g., "Essence", "Nuyen") */
  label: string;
  /** Maximum/total amount */
  max: number;
  /** Whether this shows "remaining" (default) or "used" */
  mode?: 'remaining' | 'used';
  /** Optional right-side content */
  rightContent?: ReactNode;
  /** Optional secondary label (e.g., "Remaining", "Spent") */
  secondaryLabel?: string;
  /** Warning color when resource is low */
  warningColor?: string;
  /** Threshold (0-1) for warning state */
  warningThreshold?: number;
};

/**
 * ResourceBar - Displays a resource with icon, value, and progress bar.
 * Used for nuyen remaining, essence remaining, etc.
 */
export const ResourceBar = memo((props: ResourceBarProps) => {
  const {
    current,
    max,
    label,
    icon,
    accentColor,
    warningColor = '#ff9800',
    dangerColor = '#ff6b6b',
    warningThreshold = 0.25,
    dangerThreshold = 0.1,
    formatValue = (v) => v.toLocaleString(),
    mode = 'remaining',
    secondaryLabel,
    rightContent,
  } = props;

  // Calculate percentage and status
  const percentage = max > 0 ? current / max : 1;
  const isWarning =
    percentage < warningThreshold && percentage >= dangerThreshold;
  const isDanger = percentage < dangerThreshold || current < 0;

  // Determine current color based on status
  const currentColor = isDanger
    ? dangerColor
    : isWarning
      ? warningColor
      : accentColor;

  // Get gradient for progress bar
  const getBarGradient = () => {
    const baseColor = currentColor;
    // Create a slightly darker end color
    return `linear-gradient(90deg, ${baseColor}, ${baseColor}dd)`;
  };

  return (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: `1px solid ${currentColor}`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: '4px',
        padding: '0.75rem',
        height: '100%',
      }}
    >
      <Stack align="center" mb={0.5}>
        <Stack.Item>
          <Icon name={icon} size={1.3} color={currentColor} />
        </Stack.Item>
        <Stack.Item grow>
          <Box style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            {label}
            {secondaryLabel && (
              <Box
                as="span"
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginLeft: '0.5rem',
                  fontWeight: 'normal',
                }}
              >
                {secondaryLabel}
              </Box>
            )}
          </Box>
        </Stack.Item>
        <Stack.Item>
          <Box
            style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: currentColor,
            }}
          >
            {formatValue(current)}
            <Box
              as="span"
              style={{
                fontSize: '0.7rem',
                opacity: '0.6',
                marginLeft: '0.25rem',
              }}
            >
              / {formatValue(max)}
            </Box>
          </Box>
        </Stack.Item>
        {rightContent && <Stack.Item ml={0.5}>{rightContent}</Stack.Item>}
      </Stack>
      {/* Progress Bar */}
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
            width: `${Math.max(0, Math.min(percentage * 100, 100))}%`,
            background: getBarGradient(),
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
    </Box>
  );
});

ResourceBar.displayName = 'ResourceBar';

// ============================================================================
// SEARCH INPUT
// ============================================================================

export type SearchInputProps = {
  /** Accent color for border */
  accentColor?: string;
  /** Additional buttons to render after the search input */
  additionalButtons?: ReactNode;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Current search value */
  value: string;
};

/**
 * SearchInput - Search input with icon and clear button.
 */
export const SearchInput = memo((props: SearchInputProps) => {
  const {
    value,
    onChange,
    placeholder = 'Search...',
    additionalButtons,
    disabled,
    accentColor,
  } = props;

  return (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        padding: '0.5rem',
      }}
    >
      <Stack align="center">
        <Stack.Item grow>
          <Input
            fluid
            placeholder={placeholder}
            value={value}
            onChange={(_, v) => onChange(v)}
            disabled={disabled}
          />
        </Stack.Item>
        <Stack.Item ml={0.5}>
          <Button
            icon="times"
            disabled={!value || disabled}
            onClick={() => onChange('')}
          >
            Clear
          </Button>
        </Stack.Item>
        {additionalButtons}
      </Stack>
    </Box>
  );
});

SearchInput.displayName = 'SearchInput';

// ============================================================================
// CATEGORY TABS
// ============================================================================

export type CategoryTabData = {
  /** Custom color for this category */
  color?: string;
  /** Number of items in category */
  count?: number;
  /** Icon name */
  icon?: string;
  /** Unique category identifier */
  id: string;
  /** Display name */
  name: string;
  /** Number of selected items in category */
  selectedCount?: number;
};

export type CategoryTabsProps = {
  /** Default accent color for tabs */
  accentColor?: string;
  /** Currently active category ID */
  activeCategory: string;
  /** Additional tabs to render at the end */
  additionalTabs?: ReactNode;
  /** List of categories to display */
  categories: CategoryTabData[];
  /** Callback when category changes */
  onCategoryChange: (categoryId: string) => void;
};

/**
 * CategoryTabs - Styled tabs for category selection.
 */
export const CategoryTabs = memo((props: CategoryTabsProps) => {
  const {
    categories,
    activeCategory,
    onCategoryChange,
    accentColor = '#9b8fc7',
    additionalTabs,
  } = props;

  return (
    <Tabs fluid>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const tabColor = cat.color || accentColor;
        const hasSelected = (cat.selectedCount || 0) > 0;

        return (
          <Tabs.Tab
            key={cat.id}
            icon={cat.icon}
            selected={isActive}
            onClick={() => onCategoryChange(cat.id)}
            style={isActive ? { boxShadow: `0 0 8px ${tabColor}` } : {}}
          >
            {cat.name}
            {hasSelected && (
              <Box
                as="span"
                ml={0.5}
                style={{
                  padding: '0 0.4rem',
                  background: `${tabColor}40`,
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                }}
              >
                {cat.selectedCount}
              </Box>
            )}
          </Tabs.Tab>
        );
      })}
      {additionalTabs}
    </Tabs>
  );
});

CategoryTabs.displayName = 'CategoryTabs';

// ============================================================================
// CATEGORY DESCRIPTION
// ============================================================================

export type CategoryDescriptionProps = {
  /** Icon/border accent color */
  accentColor?: string;
  /** Description text or node */
  children: ReactNode;
  /** Icon name */
  icon?: string;
};

/**
 * CategoryDescription - Styled description box for the active category.
 */
export const CategoryDescription = memo((props: CategoryDescriptionProps) => {
  const { icon = 'info-circle', accentColor = '#9b8fc7', children } = props;

  return (
    <Box
      style={{
        fontSize: '0.8rem',
        background: 'rgba(0, 0, 0, 0.2)',
        marginTop: '0.5rem',
        marginBottom: '0.75rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '4px',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <Icon name={icon} color={accentColor} mr={0.5} />
      {children}
    </Box>
  );
});

CategoryDescription.displayName = 'CategoryDescription';

// ============================================================================
// SECTION HEADER
// ============================================================================

export type SectionHeaderProps = {
  /** Accent color */
  accentColor?: string;
  /** Count to display in badge */
  count?: number;
  /** Icon name */
  icon: string;
  /** Additional content on the right */
  rightContent?: ReactNode;
  /** Subtitle text */
  subtitle?: string;
  /** Main title */
  title: string;
};

/**
 * SectionHeader - Styled header for catalog sections.
 */
export const SectionHeader = memo((props: SectionHeaderProps) => {
  const {
    title,
    subtitle,
    icon,
    accentColor = '#9b8fc7',
    count,
    rightContent,
  } = props;

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: `2px solid ${accentColor}`,
      }}
    >
      <Icon name={icon} size={1.3} color={accentColor} />
      <Box style={{ marginLeft: '0.5rem' }}>
        <Box style={{ fontSize: '1rem', fontWeight: 'bold' }}>{title}</Box>
        {subtitle && (
          <Box
            style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}
          >
            {subtitle}
          </Box>
        )}
      </Box>

      {/* Count Badge */}
      {count !== undefined && (
        <Box
          style={{
            marginLeft: 'auto',
            padding: '0.35rem 0.75rem',
            background: 'rgba(0, 0, 0, 0.4)',
            border: `1px solid ${count > 0 ? accentColor : 'rgba(255, 255, 255, 0.2)'}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Icon
            name="cog"
            color={count > 0 ? accentColor : 'rgba(255, 255, 255, 0.4)'}
            size={0.9}
          />
          <Box
            style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: count > 0 ? accentColor : 'rgba(255, 255, 255, 0.4)',
            }}
          >
            {count}
          </Box>
        </Box>
      )}

      {rightContent && (
        <Box style={{ marginLeft: count !== undefined ? '0.5rem' : 'auto' }}>
          {rightContent}
        </Box>
      )}
    </Box>
  );
});

SectionHeader.displayName = 'SectionHeader';

// ============================================================================
// EMPTY STATE
// ============================================================================

export type EmptyStateProps = {
  /** Icon name */
  icon?: string;
  /** Icon size */
  iconSize?: number;
  /** Main message */
  message: string;
  /** Optional secondary message */
  secondaryMessage?: string;
};

/**
 * EmptyState - Displays when a list has no items.
 */
export const EmptyState = memo((props: EmptyStateProps) => {
  const {
    icon = 'info-circle',
    iconSize = 2,
    message,
    secondaryMessage,
  } = props;

  return (
    <Box
      style={{
        textAlign: 'center',
        padding: '2rem',
        opacity: '0.6',
        fontStyle: 'italic',
      }}
    >
      <Icon name={icon} size={iconSize} />
      <Box mt={1}>{message}</Box>
      {secondaryMessage && (
        <Box mt={0.5} style={{ fontSize: '0.85rem' }}>
          {secondaryMessage}
        </Box>
      )}
    </Box>
  );
});

EmptyState.displayName = 'EmptyState';

// ============================================================================
// ITEM BADGE
// ============================================================================

export type ItemBadgeProps = {
  /** Background color (auto-generated from color if not provided) */
  backgroundColor?: string;
  /** Badge text */
  children: ReactNode;
  /** Badge color */
  color?: string;
  /** Icon name */
  icon?: string;
  /** Whether this is a "selected" badge */
  variant?: 'default' | 'selected' | 'warning' | 'danger';
};

/**
 * ItemBadge - Small badge for item properties (legality, selection status, etc.)
 */
export const ItemBadge = memo((props: ItemBadgeProps) => {
  const { children, color, backgroundColor, icon, variant = 'default' } = props;

  // Determine colors based on variant
  const variantColors = {
    default: {
      color: 'rgba(255, 255, 255, 0.8)',
      bg: 'rgba(255, 255, 255, 0.1)',
    },
    selected: { color: '#4caf50', bg: 'rgba(76, 175, 80, 0.2)' },
    warning: { color: '#ff9800', bg: 'rgba(255, 152, 0, 0.3)' },
    danger: { color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.3)' },
  };

  const resolvedColor = color || variantColors[variant].color;
  const resolvedBg = backgroundColor || variantColors[variant].bg;

  return (
    <Box
      as="span"
      style={{
        fontSize: '0.75rem',
        padding: '0.1rem 0.4rem',
        background: resolvedBg,
        borderRadius: '3px',
        color: resolvedColor,
        marginRight: '0.5rem',
      }}
    >
      {icon && <Icon name={icon} mr={0.25} />}
      {children}
    </Box>
  );
});

ItemBadge.displayName = 'ItemBadge';
