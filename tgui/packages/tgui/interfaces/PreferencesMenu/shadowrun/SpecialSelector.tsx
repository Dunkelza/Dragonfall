/**
 * Special Selector Component (Edge, Magic/Resonance, Essence, Karma)
 *
 * Handles allocation of special attribute points from the metatype priority.
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
// Primary accent (purple gradient for overall container)
const ACCENT_PURPLE = '#9b59b6';
const ACCENT_PURPLE_DIM = 'rgba(155, 89, 182, 0.15)';
const ACCENT_PURPLE_BORDER = 'rgba(155, 89, 182, 0.4)';

// Edge: Gold theme
const EDGE_COLOR = '#ffd700';
const EDGE_COLOR_DIM = 'rgba(255, 215, 0, 0.15)';

// Magic: Purple theme
const MAGIC_COLOR = '#ba55d3';
const MAGIC_COLOR_DIM = 'rgba(186, 85, 211, 0.15)';

// Resonance: Cyan theme
const RESONANCE_COLOR = '#00bcd4';
const RESONANCE_COLOR_DIM = 'rgba(0, 188, 212, 0.15)';

// Essence: Teal
const ESSENCE_COLOR = '#26c6da';
const ESSENCE_COLOR_DIM = 'rgba(38, 198, 218, 0.15)';

// Karma: Gold
const KARMA_COLOR = '#ffc107';
const KARMA_COLOR_DIM = 'rgba(255, 193, 7, 0.15)';

// Status colors
const SUCCESS_GREEN = '#4caf50';
const WARNING_YELLOW = '#ffeb3b';

type SpecialSelectorProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  featureId: string;
  isSaved: boolean;
  karmaBalance: number;
  setPredictedValue: (value: ChargenState) => void;
};

export const SpecialSelector = memo((props: SpecialSelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    karmaBalance,
    act,
    featureId,
    setPredictedValue,
  } = props;

  const specialAttributesMeta = chargenConstData?.special_attributes || [];
  const priorityTables = chargenConstData?.priority_tables;
  const priorities = chargenState?.priorities || {};
  const special = chargenState?.special || {};
  const awakening = chargenState?.awakening || AWAKENING.MUNDANE;

  const metatypeLetter = priorities['metatype'] || 'E';
  const magicLetter = priorities['magic'] || 'E';

  const totalPoints = priorityTables?.metatype_special?.[metatypeLetter] || 0;
  const magicBase = priorityTables?.magic?.[magicLetter] || 0;
  const edgeBase = chargenConstData?.edge_base ?? 2;

  const isAwakened = checkAwakened(awakening);

  const edgeMeta = specialAttributesMeta.find((s: AttributeMeta) =>
    s.id?.toLowerCase().includes('edge'),
  );
  const magicMeta = specialAttributesMeta.find((s: AttributeMeta) =>
    s.id?.toLowerCase().includes('magic'),
  );

  const edgeId = edgeMeta?.id || 'edge';
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

  const handleBumpSpecial = (specialId: string, delta: number) => {
    if (isSaved) return;

    const meta = specialMetaMap.get(specialId);
    if (!meta) return;

    const isMagic = specialId === magicId;
    if (isMagic && !isAwakened) return;

    const currentBonus = special[specialId] ?? 0;
    const base = isMagic ? magicBase : edgeBase;
    const maxBonusFromStat = Math.max(0, meta.max - base);
    const poolRemainingIfRemoveCurrent =
      totalPoints - (spentPoints - currentBonus);
    const maxBonusFromPool = Math.max(0, poolRemainingIfRemoveCurrent);
    const effectiveMax = Math.min(maxBonusFromStat, maxBonusFromPool);

    const result = calculateBumpedValue(specialId, delta, {
      currentValues: special,
      getMax: () => effectiveMax,
      deleteOnZero: false,
    });

    if (!result.success) return;

    const newState = { ...chargenState!, special: result.newValues };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  const edgeBonus = special[edgeId] ?? 0;
  const magicBonus = special[magicId] ?? 0;
  const edgeTotal = edgeBase + edgeBonus;
  const magicTotal = magicBase + magicBonus;

  const canDecreaseEdge = !isSaved && edgeBonus > 0;
  const canIncreaseEdge =
    !isSaved &&
    edgeBonus < (edgeMeta?.max ?? 6) - edgeBase &&
    remainingPoints > 0;
  const canDecreaseMagic = !isSaved && magicBonus > 0;
  const canIncreaseMagic =
    !isSaved &&
    isAwakened &&
    magicBonus < (magicMeta?.max ?? 6) - magicBase &&
    remainingPoints > 0;

  // Determine magic attribute color based on awakening type
  const isTechno = checkTechnomancer(awakening);
  const magicAttrColor = isTechno ? RESONANCE_COLOR : MAGIC_COLOR;
  const magicAttrColorDim = isTechno ? RESONANCE_COLOR_DIM : MAGIC_COLOR_DIM;
  const magicAttrName = isTechno ? 'Resonance' : 'Magic';
  const magicAttrIcon = isTechno ? 'wifi' : 'hat-wizard';

  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${ACCENT_PURPLE_DIM}, rgba(0, 0, 0, 0.4))`,
        borderRadius: '8px',
        border: `1px solid ${ACCENT_PURPLE_BORDER}`,
        padding: '0.75rem',
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
          width: '60px',
          height: '60px',
          background: `linear-gradient(135deg, transparent 50%, ${ACCENT_PURPLE_DIM} 50%)`,
          opacity: '0.5',
        }}
      />

      {/* Header */}
      <Stack
        align="center"
        style={{
          borderBottom: `1px solid ${ACCENT_PURPLE_BORDER}`,
          paddingBottom: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <Stack.Item grow>
          <Box
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: ACCENT_PURPLE,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Icon name="star" />
            Special Attributes
          </Box>
        </Stack.Item>
        <Stack.Item>
          <Box
            style={{
              padding: '0.2rem 0.5rem',
              background:
                remainingPoints > 0
                  ? 'rgba(255, 235, 59, 0.2)'
                  : 'rgba(76, 175, 80, 0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: remainingPoints > 0 ? WARNING_YELLOW : SUCCESS_GREEN,
            }}
          >
            <Icon name="coins" mr={0.5} />
            {remainingPoints}/{totalPoints} pts
          </Box>
        </Stack.Item>
      </Stack>

      {/* Edge Card */}
      <Box
        style={{
          background: EDGE_COLOR_DIM,
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          marginBottom: '0.5rem',
          borderLeft: `3px solid ${EDGE_COLOR}`,
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
                  onClick={() => handleBumpSpecial(edgeId, -1)}
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
                  onClick={() => handleBumpSpecial(edgeId, 1)}
                  style={{ padding: '0.15rem 0.3rem' }}
                />
              </Box>
            )}
          </Stack.Item>
        </Stack>
      </Box>

      {/* Magic/Resonance Card (only if awakened) */}
      {isAwakened && (
        <Box
          style={{
            background: magicAttrColorDim,
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            marginBottom: '0.5rem',
            borderLeft: `3px solid ${magicAttrColor}`,
          }}
        >
          <Stack align="center" justify="space-between">
            <Stack.Item grow>
              <Tooltip
                content={
                  isTechno
                    ? `Resonance determines your connection to the Matrix and ability to compile sprites and use complex forms. Higher Resonance means stronger technomancer abilities. Base: ${magicBase}`
                    : `Magic rating determines your mystical power for casting spells, summoning spirits, or using adept powers. Also affects your ability to resist drain. Base: ${magicBase}`
                }
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
                    name={magicAttrIcon}
                    style={{ color: magicAttrColor, fontSize: '1.1rem' }}
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
                      {magicAttrName}
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
              {isSaved ? (
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: magicAttrColor,
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
                    onClick={() => handleBumpSpecial(magicId, -1)}
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
                        color: magicBonus > 0 ? magicAttrColor : '#666',
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
                    onClick={() => handleBumpSpecial(magicId, 1)}
                    style={{ padding: '0.15rem 0.3rem' }}
                  />
                </Box>
              )}
            </Stack.Item>
          </Stack>
        </Box>
      )}

      {/* Essence Card (read-only) */}
      <Box
        style={{
          background: ESSENCE_COLOR_DIM,
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          marginBottom: '0.5rem',
          borderLeft: `3px solid ${ESSENCE_COLOR}`,
        }}
      >
        <Stack align="center" justify="space-between">
          <Stack.Item>
            <Tooltip
              content="Essence represents your soul and humanity. Starts at 6.00 and is reduced by cyberware and bioware implants. Essence cannot be restored once lost."
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
                  name="heart"
                  style={{ color: ESSENCE_COLOR, fontSize: '1.1rem' }}
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
                    Essence
                  </Box>
                  <Box
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontStyle: 'italic',
                    }}
                  >
                    Reduced by augments
                  </Box>
                </Box>
              </Box>
            </Tooltip>
          </Stack.Item>
          <Stack.Item>
            <Box
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: ESSENCE_COLOR,
              }}
            >
              6.00
            </Box>
          </Stack.Item>
        </Stack>
      </Box>

      {/* Karma Card */}
      <Box
        style={{
          background: KARMA_COLOR_DIM,
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          borderLeft: `3px solid ${KARMA_COLOR}`,
        }}
      >
        <Stack align="center" justify="space-between">
          <Stack.Item>
            <Tooltip
              content="Karma: earned from Qualities. Negative quirks give karma, positive quirks cost karma. Your balance must be zero or positive to save."
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
                  name="yin-yang"
                  style={{ color: KARMA_COLOR, fontSize: '1.1rem' }}
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
                    Karma Balance
                  </Box>
                  <Box
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontStyle: 'italic',
                    }}
                  >
                    From Qualities
                  </Box>
                </Box>
              </Box>
            </Tooltip>
          </Stack.Item>
          <Stack.Item>
            <Box
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: karmaBalance >= 0 ? SUCCESS_GREEN : '#f44336',
              }}
            >
              {karmaBalance >= 0 ? `+${karmaBalance}` : karmaBalance}
            </Box>
          </Stack.Item>
        </Stack>
      </Box>

      {/* Awakening Status Badge */}
      <Box
        style={{
          marginTop: '0.5rem',
          textAlign: 'center',
        }}
      >
        <Box
          as="span"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            background: isAwakened
              ? magicAttrColorDim
              : 'rgba(128, 128, 128, 0.2)',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: isAwakened ? magicAttrColor : 'rgba(255, 255, 255, 0.5)',
            border: `1px solid ${isAwakened ? magicAttrColor : 'rgba(128, 128, 128, 0.3)'}`,
          }}
        >
          <Icon
            name={isAwakened ? (isTechno ? 'wifi' : 'magic') : 'user'}
            style={{ fontSize: '0.7rem' }}
          />
          {isAwakened
            ? awakening.charAt(0).toUpperCase() + awakening.slice(1)
            : 'Mundane'}
        </Box>
      </Box>
    </Box>
  );
});
