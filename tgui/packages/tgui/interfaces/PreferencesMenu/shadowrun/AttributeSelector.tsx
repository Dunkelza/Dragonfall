/**
 * Attribute Selector component for SR5 character generation
 *
 * Visual overhaul with:
 * - Gradient container with gold accent
 * - Category grouping (Physical/Mental/Special)
 * - Styled attribute cards with left border accents
 * - Points remaining status badge
 * - Enhanced +/- buttons with visual feedback
 */

import { memo, useMemo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Button, Icon, Stack } from '../../../components';
import { getAttributeDescription } from './components';
import { calculateBumpedValue } from './hooks';
import { AttributeMeta, EmbeddableChargenProps } from './types';

export type AttributeSelectorProps = EmbeddableChargenProps;

// ============================================================================
// ACCENT COLORS
// ============================================================================

const ATTR_ACCENT = '#caa53d'; // Gold - main section accent
const ATTR_ACCENT_DIM = 'rgba(202, 165, 61, 0.3)';

// Category-specific accents
const CATEGORY_COLORS: Record<string, { color: string; icon: string }> = {
  physical: { color: '#ff6b6b', icon: 'dumbbell' },
  mental: { color: '#9b59b6', icon: 'brain' },
  special: { color: '#03fca1', icon: 'star' },
};

// Map attribute IDs to categories
const ATTR_CATEGORIES: Record<string, string> = {
  body: 'physical',
  agility: 'physical',
  reaction: 'physical',
  strength: 'physical',
  willpower: 'mental',
  logic: 'mental',
  intuition: 'mental',
  charisma: 'mental',
  edge: 'special',
  essence: 'special',
  magic: 'special',
  resonance: 'special',
};

// Extended AttributeMeta with metatype-adjusted bounds
type EffectiveAttributeMeta = AttributeMeta & {
  max: number;
  min: number;
};

// Get category from attribute ID
const getAttrCategory = (attrId: string): string => {
  const baseId = attrId.split('/').pop()?.toLowerCase() || attrId.toLowerCase();
  return ATTR_CATEGORIES[baseId] || 'physical';
};

// Get short attribute name (3 letters)
const getShortName = (attrId: string): string => {
  const baseId = attrId.split('/').pop()?.toLowerCase() || '';
  const shorts: Record<string, string> = {
    body: 'BOD',
    agility: 'AGI',
    reaction: 'REA',
    strength: 'STR',
    willpower: 'WIL',
    logic: 'LOG',
    intuition: 'INT',
    charisma: 'CHA',
    edge: 'EDG',
    essence: 'ESS',
    magic: 'MAG',
    resonance: 'RES',
  };
  return shorts[baseId] || baseId.substring(0, 3).toUpperCase();
};

// Value color based on investment level
const getValueColor = (current: number, min: number, max: number): string => {
  if (current === min) return 'rgba(255, 255, 255, 0.4)';
  const progress = (current - min) / (max - min);
  if (progress >= 0.8) return '#4caf50'; // Near max
  if (progress >= 0.5) return '#8bc34a'; // Good
  if (progress >= 0.25) return '#ffd700'; // Moderate
  return '#ffffff'; // Low investment
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AttributeSelector = memo((props: AttributeSelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    embedded,
  } = props;

  const attributesMeta = chargenConstData?.attributes || [];
  const metatypeBounds =
    chargenConstData?.metatype_attribute_bounds?.[
      chargenState?.metatype_species || '/datum/species/human'
    ] || {};
  const priorityTables = chargenConstData?.priority_tables;
  const priorities = chargenState?.priorities || {};
  const attributes = chargenState?.attributes || {};

  // Calculate effective attribute meta with metatype bounds
  const effectiveAttributesMeta: EffectiveAttributeMeta[] = useMemo(
    () =>
      attributesMeta.map((a: AttributeMeta) => {
        const range = metatypeBounds[a.id];
        if (Array.isArray(range) && range.length >= 2) {
          return { ...a, min: range[0], max: range[1] };
        }
        return { ...a, min: a.min ?? 1, max: a.max ?? 6 };
      }),
    [attributesMeta, metatypeBounds],
  );

  // Group attributes by category
  const attributesByCategory = useMemo(() => {
    const groups: Record<string, EffectiveAttributeMeta[]> = {
      physical: [],
      mental: [],
      special: [],
    };

    effectiveAttributesMeta.forEach((attr) => {
      const category = getAttrCategory(attr.id);
      if (groups[category]) {
        groups[category].push(attr);
      } else {
        groups.physical.push(attr);
      }
    });

    return groups;
  }, [effectiveAttributesMeta]);

  // Calculate totals
  const attrLetter = priorities['attributes'] || 'E';
  const totalPoints = priorityTables?.attributes?.[attrLetter] || 0;
  const spentPoints = effectiveAttributesMeta.reduce(
    (sum: number, a: EffectiveAttributeMeta) => {
      const current = attributes[a.id] ?? a.min;
      return sum + Math.max(0, current - a.min);
    },
    0,
  );
  const remainingPoints = totalPoints - spentPoints;
  const pointsPercentUsed =
    totalPoints > 0 ? (spentPoints / totalPoints) * 100 : 0;

  // Build a map of attribute bounds for quick lookup
  const attrBoundsMap = new Map(
    effectiveAttributesMeta.map((a: EffectiveAttributeMeta) => [
      a.id,
      { min: a.min, max: a.max },
    ]),
  );

  const handleBumpAttribute = (attrId: string, delta: number) => {
    if (isSaved) return;

    const bounds = attrBoundsMap.get(attrId);
    if (!bounds) return;

    const result = calculateBumpedValue(attrId, delta, {
      currentValues: attributes,
      getMin: () => bounds.min,
      getMax: () => bounds.max,
      deleteOnZero: false,
    });

    if (!result.success) return;

    const newState = { ...chargenState!, attributes: result.newValues };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  // Render a single attribute card
  const renderAttributeCard = (attr: EffectiveAttributeMeta) => {
    const current = attributes[attr.id] ?? attr.min;
    const category = getAttrCategory(attr.id);
    const categoryInfo = CATEGORY_COLORS[category] || CATEGORY_COLORS.physical;
    const valueColor = getValueColor(current, attr.min, attr.max);
    const shortName = getShortName(attr.id);
    const canDecrease = !isSaved && current > attr.min;
    const canIncrease = !isSaved && current < attr.max && remainingPoints > 0;

    // Calculate fill percentage for mini bar
    const fillPercent = ((current - attr.min) / (attr.max - attr.min)) * 100;

    return (
      <Box
        key={attr.id}
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderLeft: `3px solid ${categoryInfo.color}`,
          borderRadius: '4px',
          padding: '0.5rem 0.75rem',
          marginBottom: '0.5rem',
        }}
      >
        <Stack align="center">
          {/* Attribute Name and Short */}
          <Stack.Item grow>
            <Tooltip
              content={getAttributeDescription(
                attr.id,
                attr.name,
                attr.min,
                attr.max,
              )}
              position="right"
            >
              <Box style={{ cursor: 'help' }}>
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Box
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: categoryInfo.color,
                      background: `rgba(${category === 'physical' ? '255,107,107' : category === 'mental' ? '155,89,182' : '3,252,161'}, 0.15)`,
                      padding: '0.15rem 0.35rem',
                      borderRadius: '3px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {shortName}
                  </Box>
                  <Box style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    {attr.name}
                  </Box>
                </Box>
                {/* Mini progress bar */}
                <Box
                  style={{
                    marginTop: '0.35rem',
                    height: '3px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    style={{
                      height: '100%',
                      width: `${fillPercent}%`,
                      background: `linear-gradient(90deg, ${categoryInfo.color}, ${valueColor})`,
                      transition: 'width 0.2s ease',
                    }}
                  />
                </Box>
              </Box>
            </Tooltip>
          </Stack.Item>

          {/* Value and Controls */}
          <Stack.Item>
            {isSaved ? (
              <Box
                style={{
                  color: valueColor,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  minWidth: '2rem',
                  textAlign: 'center',
                }}
              >
                {current}
              </Box>
            ) : (
              <Stack align="center">
                <Stack.Item>
                  <Button
                    icon="minus"
                    disabled={!canDecrease}
                    onClick={() => handleBumpAttribute(attr.id, -1)}
                    style={{
                      minWidth: '1.5rem',
                      height: '1.5rem',
                      padding: '0',
                      fontSize: '0.75rem',
                      background: canDecrease
                        ? 'rgba(255, 107, 107, 0.2)'
                        : 'rgba(0, 0, 0, 0.3)',
                      border: `1px solid ${canDecrease ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: canDecrease
                        ? '#ff6b6b'
                        : 'rgba(255, 255, 255, 0.3)',
                    }}
                  />
                </Stack.Item>
                <Stack.Item>
                  <Tooltip
                    content={`Range: ${attr.min} - ${attr.max}`}
                    position="top"
                  >
                    <Box
                      style={{
                        color: valueColor,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        minWidth: '2.5rem',
                        textAlign: 'center',
                        cursor: 'help',
                        textShadow:
                          current > attr.min ? `0 0 8px ${valueColor}` : 'none',
                      }}
                    >
                      {current}
                    </Box>
                  </Tooltip>
                </Stack.Item>
                <Stack.Item>
                  <Button
                    icon="plus"
                    disabled={!canIncrease}
                    onClick={() => handleBumpAttribute(attr.id, 1)}
                    style={{
                      minWidth: '1.5rem',
                      height: '1.5rem',
                      padding: '0',
                      fontSize: '0.75rem',
                      background: canIncrease
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(0, 0, 0, 0.3)',
                      border: `1px solid ${canIncrease ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: canIncrease
                        ? '#4caf50'
                        : 'rgba(255, 255, 255, 0.3)',
                    }}
                  />
                </Stack.Item>
              </Stack>
            )}
          </Stack.Item>
        </Stack>
      </Box>
    );
  };

  // Render a category section
  const renderCategory = (
    categoryId: string,
    attrs: EffectiveAttributeMeta[],
  ) => {
    if (attrs.length === 0) return null;

    const categoryInfo =
      CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.physical;
    const categoryName =
      categoryId.charAt(0).toUpperCase() + categoryId.slice(1);

    return (
      <Box key={categoryId} style={{ marginBottom: '1rem' }}>
        {/* Category Header */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            paddingBottom: '0.35rem',
            borderBottom: `1px solid ${categoryInfo.color}`,
          }}
        >
          <Icon name={categoryInfo.icon} color={categoryInfo.color} size={1} />
          <Box
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: categoryInfo.color,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {categoryName}
          </Box>
          <Box
            style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            {attrs.length} attributes
          </Box>
        </Box>

        {/* Attribute Cards */}
        {attrs.map(renderAttributeCard)}
      </Box>
    );
  };

  return (
    <Box
      style={{
        background: embedded
          ? 'transparent'
          : `linear-gradient(135deg, rgba(202, 165, 61, 0.1), rgba(0, 0, 0, 0.4))`,
        border: embedded ? 'none' : `1px solid ${ATTR_ACCENT_DIM}`,
        borderRadius: embedded ? '0' : '8px',
        padding: embedded ? '0' : '1rem',
        marginTop: embedded ? '0' : '0.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative corner accent */}
      {!embedded && (
        <Box
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '60px',
            height: '60px',
            background: `linear-gradient(135deg, transparent 50%, ${ATTR_ACCENT_DIM} 50%)`,
            opacity: '0.5',
          }}
        />
      )}

      {/* Header with Points Badge */}
      {!embedded && (
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: `2px solid ${ATTR_ACCENT}`,
          }}
        >
          <Icon name="user" size={1.2} color={ATTR_ACCENT} />
          <Box
            style={{
              marginLeft: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Attributes
          </Box>

          {/* Points Badge */}
          <Box
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Box
              style={{
                padding: '0.25rem 0.75rem',
                background:
                  remainingPoints > 0
                    ? 'rgba(255, 193, 7, 0.2)'
                    : 'rgba(76, 175, 80, 0.2)',
                border: `1px solid ${remainingPoints > 0 ? 'rgba(255, 193, 7, 0.5)' : 'rgba(76, 175, 80, 0.5)'}`,
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: remainingPoints > 0 ? '#ffc107' : '#4caf50',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Icon
                name={
                  remainingPoints > 0 ? 'exclamation-circle' : 'check-circle'
                }
                size={0.9}
              />
              {remainingPoints}/{totalPoints} pts
            </Box>
          </Box>
        </Box>
      )}

      {/* Embedded mode header */}
      {embedded && (
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.75rem',
            padding: '0.5rem',
            background:
              remainingPoints > 0
                ? 'rgba(255, 193, 7, 0.15)'
                : 'rgba(76, 175, 80, 0.15)',
            border: `1px solid ${remainingPoints > 0 ? 'rgba(255, 193, 7, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
            borderRadius: '4px',
          }}
        >
          <Icon
            name={remainingPoints > 0 ? 'exclamation-circle' : 'check-circle'}
            color={remainingPoints > 0 ? '#ffc107' : '#4caf50'}
            mr={0.5}
          />
          <Box
            style={{
              fontWeight: 'bold',
              color: remainingPoints > 0 ? '#ffc107' : '#4caf50',
            }}
          >
            {remainingPoints}/{totalPoints} Attribute Points Remaining
          </Box>
          {/* Mini progress bar */}
          <Box
            style={{
              marginLeft: 'auto',
              width: '100px',
              height: '6px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                height: '100%',
                width: `${pointsPercentUsed}%`,
                background:
                  remainingPoints > 0
                    ? 'linear-gradient(90deg, #ffc107, #ff9800)'
                    : 'linear-gradient(90deg, #4caf50, #8bc34a)',
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>
      )}

      {/* Category Sections */}
      {renderCategory('physical', attributesByCategory.physical)}
      {renderCategory('mental', attributesByCategory.mental)}
      {renderCategory('special', attributesByCategory.special)}
    </Box>
  );
});
