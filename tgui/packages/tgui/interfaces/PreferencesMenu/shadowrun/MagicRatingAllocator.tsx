/**
 * Magic Rating Allocator Component
 *
 * Standalone component for allocating Magic or Resonance points from the metatype special pool.
 * Designed to be embedded in the Magic tab.
 *
 * - For mages/mystic adepts/adepts: Shows "Magic" rating
 * - For technomancers: Shows "Resonance" rating
 * - For mundanes: Shows nothing (returns null)
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Button, Icon, Stack } from '../../../components';
import {
  AWAKENING,
  isAwakened as checkAwakened,
  isTechnomancer as checkTechnomancer,
} from './constants';
import { calculateBumpedValue } from './hooks';
import { AttributeMeta, ChargenConstData, ChargenState } from './types';

// === ACCENT COLORS ===
// Magic: Purple theme
const MAGIC_COLOR = '#ba55d3';
const MAGIC_COLOR_DIM = 'rgba(186, 85, 211, 0.15)';

// Resonance: Cyan theme
const RESONANCE_COLOR = '#00bcd4';
const RESONANCE_COLOR_DIM = 'rgba(0, 188, 212, 0.15)';

const SUCCESS_GREEN = '#4caf50';
const WARNING_YELLOW = '#ffeb3b';

type MagicRatingAllocatorProps = {
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

export const MagicRatingAllocator = memo((props: MagicRatingAllocatorProps) => {
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

  const awakening = chargenState.awakening || AWAKENING.MUNDANE;
  const isAwakened = checkAwakened(awakening);

  // Don't render for mundane characters
  if (!isAwakened) {
    return null;
  }

  const isTechno = checkTechnomancer(awakening);
  const specialAttributesMeta = chargenConstData.special_attributes || [];
  const priorityTables = chargenConstData.priority_tables;
  const priorities = chargenState.priorities || {};
  const special = chargenState.special || {};

  const metatypeLetter = priorities['metatype'] || 'E';
  const magicLetter = priorities['magic'] || 'E';

  const totalPoints = priorityTables?.metatype_special?.[metatypeLetter] || 0;
  const magicBase = priorityTables?.magic?.[magicLetter] || 0;

  const magicMeta = specialAttributesMeta.find((s: AttributeMeta) =>
    s.id?.toLowerCase().includes('magic'),
  );

  const magicId = magicMeta?.id || 'magic';

  const spentPoints = Object.values(special).reduce<number>(
    (sum, v) => sum + Math.max(0, Number(v) || 0),
    0,
  );
  const remainingPoints = totalPoints - spentPoints;

  // Build metadata map for special attributes
  const specialMetaMap = new Map(
    specialAttributesMeta.map((s: AttributeMeta) => [s.id, s]),
  );

  const handleBumpMagic = (delta: number) => {
    if (isSaved) return;

    const meta = specialMetaMap.get(magicId);
    if (!meta) return;

    const currentBonus = special[magicId] ?? 0;
    const maxBonusFromStat = Math.max(0, meta.max - magicBase);
    const poolRemainingIfRemoveCurrent =
      totalPoints - (spentPoints - currentBonus);
    const maxBonusFromPool = Math.max(0, poolRemainingIfRemoveCurrent);
    const effectiveMax = Math.min(maxBonusFromStat, maxBonusFromPool);

    const result = calculateBumpedValue(magicId, delta, {
      currentValues: special,
      getMax: () => effectiveMax,
      deleteOnZero: false,
    });

    if (!result.success) return;

    const newState = { ...chargenState, special: result.newValues };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  const magicBonus = special[magicId] ?? 0;
  const magicTotal = magicBase + magicBonus;

  const canDecreaseMagic = !isSaved && magicBonus > 0;
  const canIncreaseMagic =
    !isSaved &&
    magicBonus < (magicMeta?.max ?? 6) - magicBase &&
    remainingPoints > 0;

  // Determine theming based on awakening type
  const attrColor = isTechno ? RESONANCE_COLOR : MAGIC_COLOR;
  const attrColorDim = isTechno ? RESONANCE_COLOR_DIM : MAGIC_COLOR_DIM;
  const attrName = isTechno ? 'Resonance' : 'Magic';
  const attrIcon = isTechno ? 'wifi' : 'hat-wizard';
  const tooltipContent = isTechno
    ? `Resonance determines your connection to the Matrix and ability to compile sprites and use complex forms. Higher Resonance means stronger technomancer abilities. Base: ${magicBase}`
    : `Magic rating determines your mystical power for casting spells, summoning spirits, or using adept powers. Also affects your ability to resist drain. Base: ${magicBase}`;

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
        <Icon name={attrIcon} style={{ color: attrColor, fontSize: '1rem' }} />
        <Box style={{ fontWeight: 'bold', color: attrColor }}>{attrName}</Box>
        {isSaved ? (
          <Box
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: attrColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Icon name="lock" style={{ fontSize: '0.7rem' }} />
            {magicTotal}
          </Box>
        ) : (
          <Box
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Button
              icon="minus"
              compact
              disabled={!canDecreaseMagic}
              onClick={() => handleBumpMagic(-1)}
              style={{ padding: '0.15rem 0.3rem' }}
            />
            <Box
              style={{
                minWidth: '1.5rem',
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: magicBonus > 0 ? attrColor : '#666',
              }}
            >
              {magicTotal}
            </Box>
            <Button
              icon="plus"
              compact
              disabled={!canIncreaseMagic}
              onClick={() => handleBumpMagic(1)}
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
        borderLeft: `3px solid ${attrColor}`,
        borderRadius: '4px',
        padding: '0.5rem 0.75rem',
      }}
    >
      <Stack align="center" justify="space-between">
        <Stack.Item grow>
          <Tooltip content={tooltipContent} position="right">
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'help',
              }}
            >
              <Icon
                name={attrIcon}
                style={{ color: attrColor, fontSize: '1.1rem' }}
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
                  {attrName}
                </Box>
                <Box
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Base: {magicBase}
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
                color: attrColor,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Icon name="lock" style={{ fontSize: '0.7rem' }} />
              {magicTotal}
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
                disabled={!canDecreaseMagic}
                onClick={() => handleBumpMagic(-1)}
                style={{ padding: '0.15rem 0.3rem' }}
              />
              <Tooltip
                content={`Range: ${magicBase} - ${magicMeta?.max ?? 6}`}
                position="top"
              >
                <Box
                  style={{
                    minWidth: '2rem',
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: magicBonus > 0 ? attrColor : '#666',
                    cursor: 'help',
                  }}
                >
                  {magicTotal}
                </Box>
              </Tooltip>
              <Button
                icon="plus"
                compact
                disabled={!canIncreaseMagic}
                onClick={() => handleBumpMagic(1)}
                style={{ padding: '0.15rem 0.3rem' }}
              />
            </Box>
          )}
        </Stack.Item>
      </Stack>
    </Box>
  );
});
