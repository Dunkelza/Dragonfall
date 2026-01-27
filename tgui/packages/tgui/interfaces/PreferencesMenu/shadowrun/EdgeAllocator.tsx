/**
 * Edge Allocator Component
 *
 * Standalone component for allocating Edge points from the metatype special pool.
 * Designed to be embedded in the Core or Build tab.
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Button, Icon, Stack } from '../../../components';
import { calculateBumpedValue } from './hooks';
import { AttributeMeta, ChargenConstData, ChargenState } from './types';

// === ACCENT COLORS ===
const EDGE_COLOR = '#ffd700';
const EDGE_COLOR_DIM = 'rgba(255, 215, 0, 0.15)';
const SUCCESS_GREEN = '#4caf50';
const WARNING_YELLOW = '#ffeb3b';

type EdgeAllocatorProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  /** If true, shows a compact inline version */
  compact?: boolean;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  /** If true, shows the remaining special points pool */
  showPoolInfo?: boolean;
};

export const EdgeAllocator = memo((props: EdgeAllocatorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    compact = false,
    showPoolInfo = true,
  } = props;

  if (!chargenState || !chargenConstData) {
    return null;
  }

  const specialAttributesMeta = chargenConstData.special_attributes || [];
  const priorityTables = chargenConstData.priority_tables;
  const priorities = chargenState.priorities || {};
  const special = chargenState.special || {};

  const metatypeLetter = priorities['metatype'] || 'E';

  const totalPoints = priorityTables?.metatype_special?.[metatypeLetter] || 0;
  const edgeBase = chargenConstData.edge_base ?? 2;

  const edgeMeta = specialAttributesMeta.find((s: AttributeMeta) =>
    s.id?.toLowerCase().includes('edge'),
  );

  const edgeId = edgeMeta?.id || 'edge';

  const spentPoints = Object.values(special).reduce<number>(
    (sum, v) => sum + Math.max(0, Number(v) || 0),
    0,
  );
  const remainingPoints = totalPoints - spentPoints;

  // Build metadata map for special attributes
  const specialMetaMap = new Map(
    specialAttributesMeta.map((s: AttributeMeta) => [s.id, s]),
  );

  const handleBumpEdge = (delta: number) => {
    if (isSaved) return;

    const meta = specialMetaMap.get(edgeId);
    if (!meta) return;

    const currentBonus = special[edgeId] ?? 0;
    const maxBonusFromStat = Math.max(0, meta.max - edgeBase);
    const poolRemainingIfRemoveCurrent =
      totalPoints - (spentPoints - currentBonus);
    const maxBonusFromPool = Math.max(0, poolRemainingIfRemoveCurrent);
    const effectiveMax = Math.min(maxBonusFromStat, maxBonusFromPool);

    const result = calculateBumpedValue(edgeId, delta, {
      currentValues: special,
      getMax: () => effectiveMax,
      deleteOnZero: false,
    });

    if (!result.success) return;

    const newState = { ...chargenState, special: result.newValues };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  const edgeBonus = special[edgeId] ?? 0;
  const edgeTotal = edgeBase + edgeBonus;

  const canDecreaseEdge = !isSaved && edgeBonus > 0;
  const canIncreaseEdge =
    !isSaved &&
    edgeBonus < (edgeMeta?.max ?? 6) - edgeBase &&
    remainingPoints > 0;

  // Compact version - just the controls
  if (compact) {
    return (
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Icon name="bolt" style={{ color: EDGE_COLOR, fontSize: '1rem' }} />
        <Box style={{ fontWeight: 'bold', color: EDGE_COLOR }}>Edge</Box>
        {isSaved ? (
          <Box
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: EDGE_COLOR,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Icon name="lock" style={{ fontSize: '0.7rem' }} />
            {edgeTotal}
          </Box>
        ) : (
          <Box
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Button
              icon="minus"
              compact
              disabled={!canDecreaseEdge}
              onClick={() => handleBumpEdge(-1)}
              style={{ padding: '0.15rem 0.3rem' }}
            />
            <Box
              style={{
                minWidth: '1.5rem',
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: edgeBonus > 0 ? EDGE_COLOR : '#666',
              }}
            >
              {edgeTotal}
            </Box>
            <Button
              icon="plus"
              compact
              disabled={!canIncreaseEdge}
              onClick={() => handleBumpEdge(1)}
              style={{ padding: '0.15rem 0.3rem' }}
            />
          </Box>
        )}
        {showPoolInfo && (
          <Box
            style={{
              marginLeft: 'auto',
              fontSize: '0.75rem',
              color: remainingPoints > 0 ? WARNING_YELLOW : SUCCESS_GREEN,
            }}
          >
            ({remainingPoints} pts left)
          </Box>
        )}
      </Box>
    );
  }

  // Full version - styled card (matches AttributeSelector card pattern)
  return (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: `3px solid ${EDGE_COLOR}`,
        borderRadius: '4px',
        padding: '0.5rem 0.75rem',
      }}
    >
      <Stack align="center" justify="space-between">
        <Stack.Item grow>
          <Tooltip
            content="Edge represents luck and fate. Spend Edge points during play to push your limits, reroll failures, or survive deadly situations. Higher Edge means more chances to defy the odds."
            position="right"
          >
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'help',
              }}
            >
              <Icon
                name="bolt"
                style={{ color: EDGE_COLOR, fontSize: '1.1rem' }}
              />
              <Box>
                <Box
                  style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Edge
                </Box>
                <Box
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Base: {edgeBase}
                </Box>
              </Box>
            </Box>
          </Tooltip>
        </Stack.Item>
        <Stack.Item>
          {showPoolInfo && (
            <Box
              style={{
                marginRight: '0.75rem',
                padding: '0.2rem 0.5rem',
                background:
                  remainingPoints > 0
                    ? 'rgba(255, 235, 59, 0.2)'
                    : 'rgba(76, 175, 80, 0.2)',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: remainingPoints > 0 ? WARNING_YELLOW : SUCCESS_GREEN,
              }}
            >
              {remainingPoints}/{totalPoints} pts
            </Box>
          )}
        </Stack.Item>
        <Stack.Item>
          {isSaved ? (
            <Box
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: EDGE_COLOR,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Icon name="lock" style={{ fontSize: '0.7rem' }} />
              {edgeTotal}
            </Box>
          ) : (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Button
                icon="minus"
                compact
                disabled={!canDecreaseEdge}
                onClick={() => handleBumpEdge(-1)}
                style={{ padding: '0.15rem 0.3rem' }}
              />
              <Tooltip
                content={`Range: ${edgeBase} - ${edgeMeta?.max ?? 6}`}
                position="top"
              >
                <Box
                  style={{
                    minWidth: '2rem',
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: edgeBonus > 0 ? EDGE_COLOR : '#666',
                    cursor: 'help',
                  }}
                >
                  {edgeTotal}
                </Box>
              </Tooltip>
              <Button
                icon="plus"
                compact
                disabled={!canIncreaseEdge}
                onClick={() => handleBumpEdge(1)}
                style={{ padding: '0.15rem 0.3rem' }}
              />
            </Box>
          )}
        </Stack.Item>
      </Stack>
    </Box>
  );
});
