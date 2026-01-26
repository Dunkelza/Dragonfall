/**
 * Attribute Selector component for SR5 character generation
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Button, Icon, Stack } from '../../../components';
import { getAttributeDescription } from './components';
import { AttributeMeta, EmbeddableChargenProps } from './types';

export type AttributeSelectorProps = EmbeddableChargenProps;

// Extended AttributeMeta with metatype-adjusted bounds
type EffectiveAttributeMeta = AttributeMeta & {
  max: number;
  min: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getValueColor = (current: number, min: number): string => {
  if (current === min) return '#888';
  if (current >= min + 4) return '#4caf50';
  if (current >= min + 2) return '#8bc34a';
  return '#fff';
};

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
  const effectiveAttributesMeta: EffectiveAttributeMeta[] = attributesMeta.map(
    (a: AttributeMeta) => {
      const range = metatypeBounds[a.id];
      if (Array.isArray(range) && range.length >= 2) {
        return { ...a, min: range[0], max: range[1] };
      }
      return { ...a, min: a.min ?? 1, max: a.max ?? 6 };
    },
  );

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

  const handleBumpAttribute = (attrId: string, delta: number) => {
    if (isSaved) return;

    const attrMeta = effectiveAttributesMeta.find(
      (a: EffectiveAttributeMeta) => a.id === attrId,
    );
    if (!attrMeta) return;

    const current = attributes[attrId] ?? attrMeta.min;
    const nextValue = clamp(current + delta, attrMeta.min, attrMeta.max);

    const nextAttrs = { ...attributes, [attrId]: nextValue };
    const newState = { ...chargenState!, attributes: nextAttrs };

    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  return (
    <Box
      style={{
        background: embedded ? 'transparent' : 'rgba(0, 0, 0, 0.25)',
        border: embedded ? 'none' : '2px solid rgba(100, 149, 237, 0.4)',
        padding: embedded ? '0' : '0.5rem',
        marginTop: embedded ? '0' : '0.5rem',
      }}
    >
      {!embedded && (
        <Stack
          align="center"
          style={{
            borderBottom: '1px solid rgba(100, 149, 237, 0.3)',
            paddingBottom: '0.3rem',
            marginBottom: '0.4rem',
          }}
        >
          <Stack.Item grow>
            <Box bold style={{ color: '#6495ed', fontSize: '0.9rem' }}>
              <Icon name="user" mr={0.5} />
              Attributes
            </Box>
          </Stack.Item>
          <Stack.Item>
            <Box
              style={{
                fontSize: '0.75rem',
                color: remainingPoints > 0 ? '#ffeb3b' : '#4caf50',
              }}
            >
              {remainingPoints}/{totalPoints}
            </Box>
          </Stack.Item>
        </Stack>
      )}
      {embedded && (
        <Box
          mb={0.5}
          style={{
            fontSize: '0.85rem',
            color: remainingPoints > 0 ? '#ffeb3b' : '#4caf50',
            fontWeight: 'bold',
          }}
        >
          Points: {remainingPoints}/{totalPoints} remaining
        </Box>
      )}
      {effectiveAttributesMeta.map((attr: EffectiveAttributeMeta) => {
        const current = attributes[attr.id] ?? attr.min;
        const valueColor = getValueColor(current, attr.min);
        const canDecrease = !isSaved && current > attr.min;
        const canIncrease =
          !isSaved && current < attr.max && remainingPoints > 0;

        return (
          <Stack
            key={attr.id}
            align="center"
            style={{
              padding: '0.15rem 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
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
                <Box
                  style={{
                    fontSize: '0.75rem',
                    cursor: 'help',
                    borderBottom: '1px dotted rgba(255,255,255,0.2)',
                  }}
                >
                  {attr.name}
                </Box>
              </Tooltip>
            </Stack.Item>
            <Stack.Item>
              {isSaved ? (
                <Box
                  bold
                  style={{
                    color: valueColor,
                    fontSize: '0.85rem',
                    minWidth: '1.5rem',
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
                      compact
                      disabled={!canDecrease}
                      onClick={() => handleBumpAttribute(attr.id, -1)}
                      style={{
                        minWidth: '1.2rem',
                        padding: '0.1rem',
                        fontSize: '0.7rem',
                      }}
                    />
                  </Stack.Item>
                  <Stack.Item>
                    <Tooltip
                      content={`Range: ${attr.min} - ${attr.max}`}
                      position="top"
                    >
                      <Box
                        bold
                        style={{
                          color: valueColor,
                          fontSize: '0.85rem',
                          minWidth: '1.5rem',
                          textAlign: 'center',
                          cursor: 'help',
                        }}
                      >
                        {current}
                      </Box>
                    </Tooltip>
                  </Stack.Item>
                  <Stack.Item>
                    <Button
                      icon="plus"
                      compact
                      disabled={!canIncrease}
                      onClick={() => handleBumpAttribute(attr.id, 1)}
                      style={{
                        minWidth: '1.2rem',
                        padding: '0.1rem',
                        fontSize: '0.7rem',
                      }}
                    />
                  </Stack.Item>
                </Stack>
              )}
            </Stack.Item>
          </Stack>
        );
      })}
    </Box>
  );
});
