/**
 * Skeleton Loading Components
 *
 * Content placeholder skeletons displayed during lazy-loading of heavy tab components.
 * These match the visual structure of each tab to reduce layout shift and improve
 * perceived loading performance.
 */

import { memo, ReactNode } from 'react';

import { Box, Stack } from '../../../components';

// ============================================================================
// BASE SKELETON PRIMITIVES
// ============================================================================

type SkeletonLineProps = {
  /** Height of the skeleton line (CSS value, default: '1rem') */
  height?: string;
  /** Border radius (CSS value, default: '4px') */
  radius?: string;
  /** Custom inline style overrides */
  style?: React.CSSProperties;
  /** Width of the skeleton line (CSS value, default: '100%') */
  width?: string;
};

/**
 * A single animated skeleton line, used for text placeholders.
 */
export const SkeletonLine = memo(
  ({
    width = '100%',
    height = '1rem',
    radius = '4px',
    style,
  }: SkeletonLineProps) => (
    <Box
      className="Shadowrun__skeleton Shadowrun__skeleton--shimmer"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  ),
);

type SkeletonBoxProps = {
  /** Optional children to overlay */
  children?: ReactNode;
  /** Height of the box (CSS value, default: '80px') */
  height?: string;
  /** Border radius (CSS value, default: '8px') */
  radius?: string;
  /** Custom inline style overrides */
  style?: React.CSSProperties;
  /** Width of the box (CSS value, default: '100%') */
  width?: string;
};

/**
 * A skeleton box for card/container placeholders.
 */
export const SkeletonBox = memo(
  ({
    width = '100%',
    height = '80px',
    radius = '8px',
    children,
    style,
  }: SkeletonBoxProps) => (
    <Box
      className="Shadowrun__skeleton Shadowrun__skeleton--shimmer"
      style={{
        width,
        height,
        borderRadius: radius,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </Box>
  ),
);

type SkeletonCardProps = {
  /** Accent color for the left border */
  accentColor?: string;
  /** Height of the card (default: '70px') */
  height?: string;
  /** Whether to show a secondary line (default: true) */
  showSecondLine?: boolean;
};

/**
 * A styled card skeleton matching the common item card pattern.
 */
export const SkeletonCard = memo(
  ({
    accentColor = 'rgba(255,255,255,0.2)',
    height = '70px',
    showSecondLine = true,
  }: SkeletonCardProps) => (
    <Box
      className="Shadowrun__skeleton-card"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: '4px',
        padding: '0.75rem',
        height,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <SkeletonLine width="60%" height="0.9rem" />
      {showSecondLine && <SkeletonLine width="40%" height="0.7rem" />}
    </Box>
  ),
);

// ============================================================================
// SECTION SKELETON PATTERNS
// ============================================================================

type SkeletonSectionHeaderProps = {
  accentColor?: string;
};

/**
 * A skeleton for section headers (icon + title + underline).
 */
export const SkeletonSectionHeader = memo(
  ({ accentColor = 'rgba(255,255,255,0.3)' }: SkeletonSectionHeaderProps) => (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '0.75rem',
        paddingBottom: '0.5rem',
        borderBottom: `2px solid ${accentColor}`,
        gap: '0.5rem',
      }}
    >
      <SkeletonBox width="1.2rem" height="1.2rem" radius="4px" />
      <SkeletonLine width="120px" height="1rem" />
    </Box>
  ),
);

/**
 * A skeleton for horizontal tab bars.
 */
export const SkeletonTabs = memo(({ count = 4 }: { count?: number }) => (
  <Box
    style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1rem',
      overflowX: 'hidden',
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBox
        key={i}
        width={`${60 + Math.random() * 40}px`}
        height="2rem"
        radius="4px"
      />
    ))}
  </Box>
));

/**
 * A skeleton for a resource/stat bar (e.g., essence, nuyen).
 */
export const SkeletonStatBar = memo(
  ({
    label = true,
    accentColor = 'rgba(255,255,255,0.3)',
  }: {
    accentColor?: string;
    label?: boolean;
  }) => (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      {label && (
        <Box
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <SkeletonLine width="80px" height="0.8rem" />
          <SkeletonLine width="60px" height="0.8rem" />
        </Box>
      )}
      <Box
        style={{
          height: '8px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <Box
          className="Shadowrun__skeleton--shimmer"
          style={{
            height: '100%',
            width: '60%',
            background: accentColor,
            borderRadius: '4px',
          }}
        />
      </Box>
    </Box>
  ),
);

// ============================================================================
// TAB-SPECIFIC SKELETON LOADERS
// ============================================================================

/**
 * Skeleton loader for the Gear tab.
 * Shows: Budget bar → Category tabs → Search → Item list
 */
export const GearSkeleton = memo(() => (
  <Box style={{ padding: '0.5rem' }}>
    {/* Budget bar */}
    <SkeletonStatBar accentColor="rgba(255, 215, 0, 0.4)" />

    {/* Category tabs */}
    <SkeletonTabs count={6} />

    {/* Search bar */}
    <Box style={{ marginBottom: '1rem' }}>
      <SkeletonBox width="100%" height="2.5rem" radius="4px" />
    </Box>

    {/* Item list */}
    <Stack vertical>
      {Array.from({ length: 6 }).map((_, i) => (
        <Stack.Item key={i}>
          <SkeletonCard
            accentColor="rgba(255, 149, 0, 0.4)"
            height="65px"
            showSecondLine
          />
        </Stack.Item>
      ))}
    </Stack>
  </Box>
));

/**
 * Skeleton loader for the Augments tab.
 * Shows: Essence bar → Category tabs → Search → Item list
 */
export const AugmentsSkeleton = memo(() => (
  <Box style={{ padding: '0.5rem' }}>
    {/* Essence bar */}
    <SkeletonStatBar accentColor="rgba(155, 143, 199, 0.5)" />

    {/* Category tabs */}
    <SkeletonTabs count={4} />

    {/* Search bar */}
    <Box style={{ marginBottom: '1rem' }}>
      <SkeletonBox width="100%" height="2.5rem" radius="4px" />
    </Box>

    {/* Item list */}
    <Stack vertical>
      {Array.from({ length: 5 }).map((_, i) => (
        <Stack.Item key={i}>
          <SkeletonCard
            accentColor="rgba(255, 107, 107, 0.4)"
            height="75px"
            showSecondLine
          />
        </Stack.Item>
      ))}
    </Stack>
  </Box>
));

/**
 * Skeleton loader for the Drones tab.
 * Shows: Budget bar → Category tabs → Item grid
 */
export const DronesSkeleton = memo(() => (
  <Box style={{ padding: '0.5rem' }}>
    {/* Budget bar */}
    <SkeletonStatBar accentColor="rgba(255, 215, 0, 0.4)" />

    {/* Category tabs */}
    <SkeletonTabs count={5} />

    {/* Drone cards grid */}
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '0.75rem',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard
          key={i}
          accentColor="rgba(141, 110, 99, 0.4)"
          height="90px"
          showSecondLine
        />
      ))}
    </Box>
  </Box>
));

/**
 * Skeleton loader for the Magic tab.
 * Shows: Awakening header → Tradition selector → Spells section
 */
export const MagicSkeleton = memo(() => (
  <Box style={{ padding: '0.5rem' }}>
    {/* Awakening status header */}
    <Box
      style={{
        background: 'rgba(155, 89, 182, 0.15)',
        border: '1px solid rgba(155, 89, 182, 0.3)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <SkeletonBox width="2.5rem" height="2.5rem" radius="50%" />
        <Box style={{ flex: 1 }}>
          <SkeletonLine width="120px" height="1rem" />
          <Box mt={0.5}>
            <SkeletonLine width="200px" height="0.75rem" />
          </Box>
        </Box>
      </Box>
    </Box>

    {/* Tradition/Mentor cards */}
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem',
      }}
    >
      <SkeletonBox height="100px" radius="8px" />
      <SkeletonBox height="100px" radius="8px" />
    </Box>

    {/* Category tabs */}
    <SkeletonTabs count={4} />

    {/* Spell/Power list */}
    <Stack vertical>
      {Array.from({ length: 5 }).map((_, i) => (
        <Stack.Item key={i}>
          <SkeletonCard
            accentColor="rgba(155, 89, 182, 0.4)"
            height="60px"
            showSecondLine
          />
        </Stack.Item>
      ))}
    </Stack>
  </Box>
));

/**
 * Skeleton loader for the Core (SIN) tab.
 * Shows: Metatype selector → Identity section → Stats
 */
export const CoreSkeleton = memo(() => (
  <Box style={{ padding: '0.5rem' }}>
    {/* Metatype section header */}
    <SkeletonSectionHeader accentColor="rgba(92, 107, 192, 0.5)" />

    {/* Metatype/Awakening dropdowns */}
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <SkeletonBox height="2.5rem" radius="4px" />
      <SkeletonBox height="2.5rem" radius="4px" />
    </Box>

    {/* Identity section */}
    <SkeletonSectionHeader accentColor="rgba(0, 212, 255, 0.5)" />
    <Stack vertical>
      {Array.from({ length: 3 }).map((_, i) => (
        <Stack.Item key={i}>
          <Box
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '0.75rem',
            }}
          >
            <SkeletonLine width="80px" height="0.9rem" />
            <SkeletonBox width="200px" height="2rem" radius="4px" />
          </Box>
        </Stack.Item>
      ))}
    </Stack>

    {/* Derived stats section */}
    <Box mt={1.5}>
      <SkeletonSectionHeader accentColor="rgba(155, 89, 182, 0.5)" />
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBox key={i} height="3rem" radius="4px" />
        ))}
      </Box>
    </Box>
  </Box>
));

/**
 * Skeleton loader for the Skills tab section.
 */
export const SkillsSkeleton = memo(() => (
  <Box>
    {/* Section header */}
    <SkeletonSectionHeader accentColor="rgba(3, 252, 161, 0.5)" />

    {/* Points remaining bar */}
    <SkeletonStatBar accentColor="rgba(3, 252, 161, 0.4)" />

    {/* Skill list */}
    <Stack vertical>
      {Array.from({ length: 8 }).map((_, i) => (
        <Stack.Item key={i}>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              marginBottom: '0.25rem',
            }}
          >
            <SkeletonLine width="120px" height="0.9rem" />
            <Box style={{ display: 'flex', gap: '0.5rem' }}>
              <SkeletonBox width="2rem" height="2rem" radius="4px" />
              <SkeletonLine width="40px" height="2rem" />
              <SkeletonBox width="2rem" height="2rem" radius="4px" />
            </Box>
          </Box>
        </Stack.Item>
      ))}
    </Stack>
  </Box>
));

/**
 * Skeleton loader for the Connections (Contacts) tab.
 */
export const ConnectionsSkeleton = memo(() => (
  <Box style={{ padding: '0.5rem' }}>
    {/* Section header */}
    <SkeletonSectionHeader accentColor="rgba(38, 166, 154, 0.5)" />

    {/* Add contact button placeholder */}
    <Box style={{ marginBottom: '1rem' }}>
      <SkeletonBox width="150px" height="2.5rem" radius="4px" />
    </Box>

    {/* Contact cards */}
    <Stack vertical>
      {Array.from({ length: 4 }).map((_, i) => (
        <Stack.Item key={i}>
          <SkeletonCard
            accentColor="rgba(38, 166, 154, 0.4)"
            height="80px"
            showSecondLine
          />
        </Stack.Item>
      ))}
    </Stack>
  </Box>
));

/**
 * Generic fallback skeleton for any tab.
 * Used when no specific skeleton is defined.
 */
export const GenericTabSkeleton = memo(() => (
  <Box style={{ padding: '1.5rem' }}>
    <SkeletonSectionHeader />
    <Box mb={1}>
      <SkeletonLine width="80%" height="1rem" />
    </Box>
    <Box mb={1}>
      <SkeletonLine width="60%" height="1rem" />
    </Box>
    <Box mb={1.5}>
      <SkeletonLine width="70%" height="1rem" />
    </Box>

    <Stack vertical>
      {Array.from({ length: 4 }).map((_, i) => (
        <Stack.Item key={i}>
          <SkeletonCard height="60px" />
        </Stack.Item>
      ))}
    </Stack>
  </Box>
));
