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

  return (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '2px solid rgba(186, 85, 211, 0.4)',
        padding: '0.5rem',
        marginTop: '0.5rem',
      }}
    >
      <Stack
        align="center"
        style={{
          borderBottom: '1px solid rgba(186, 85, 211, 0.3)',
          paddingBottom: '0.3rem',
          marginBottom: '0.4rem',
        }}
      >
        <Stack.Item grow>
          <Box bold style={{ color: '#ba55d3', fontSize: '0.9rem' }}>
            <Icon name="star" mr={0.5} />
            Special
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

      {/* Edge */}
      <Stack
        align="center"
        style={{
          padding: '0.15rem 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Stack.Item grow>
          <Tooltip
            content="Edge represents luck and fate. Spend Edge points during play to push your limits, reroll failures, or survive deadly situations. Higher Edge means more chances to defy the odds."
            position="right"
          >
            <Box
              style={{
                fontSize: '0.75rem',
                cursor: 'help',
                borderBottom: '1px dotted rgba(255,255,255,0.2)',
              }}
            >
              Edge (Base: {edgeBase})
            </Box>
          </Tooltip>
        </Stack.Item>
        <Stack.Item>
          {isSaved ? (
            <Box
              bold
              style={{
                color: edgeBonus > 0 ? '#ba55d3' : '#888',
                fontSize: '0.85rem',
                minWidth: '1.5rem',
                textAlign: 'center',
              }}
            >
              {edgeTotal}
            </Box>
          ) : (
            <Stack align="center">
              <Stack.Item>
                <Button
                  icon="minus"
                  compact
                  disabled={!canDecreaseEdge}
                  onClick={() => handleBumpSpecial(edgeId, -1)}
                  style={{
                    minWidth: '1.2rem',
                    padding: '0.1rem',
                    fontSize: '0.7rem',
                  }}
                />
              </Stack.Item>
              <Stack.Item>
                <Tooltip
                  content={`Range: ${edgeBase} - ${edgeMeta?.max ?? 6}`}
                  position="top"
                >
                  <Box
                    bold
                    style={{
                      color: edgeBonus > 0 ? '#ba55d3' : '#888',
                      fontSize: '0.85rem',
                      minWidth: '1.5rem',
                      textAlign: 'center',
                      cursor: 'help',
                    }}
                  >
                    {edgeTotal}
                  </Box>
                </Tooltip>
              </Stack.Item>
              <Stack.Item>
                <Button
                  icon="plus"
                  compact
                  disabled={!canIncreaseEdge}
                  onClick={() => handleBumpSpecial(edgeId, 1)}
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

      {/* Magic/Resonance (only if awakened) */}
      {isAwakened && (
        <Stack
          align="center"
          style={{
            padding: '0.15rem 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Stack.Item grow>
            <Tooltip
              content={
                checkTechnomancer(awakening)
                  ? `Resonance determines your connection to the Matrix and ability to compile sprites and use complex forms. Higher Resonance means stronger technomancer abilities. Base: ${magicBase}`
                  : `Magic rating determines your mystical power for casting spells, summoning spirits, or using adept powers. Also affects your ability to resist drain. Base: ${magicBase}`
              }
              position="right"
            >
              <Box
                style={{
                  fontSize: '0.75rem',
                  cursor: 'help',
                  borderBottom: '1px dotted rgba(255,255,255,0.2)',
                }}
              >
                {checkTechnomancer(awakening) ? 'Resonance' : 'Magic'} (Base:{' '}
                {magicBase})
              </Box>
            </Tooltip>
          </Stack.Item>
          <Stack.Item>
            {isSaved ? (
              <Box
                bold
                style={{
                  color: magicBonus > 0 ? '#ba55d3' : '#888',
                  fontSize: '0.85rem',
                  minWidth: '1.5rem',
                  textAlign: 'center',
                }}
              >
                {magicTotal}
              </Box>
            ) : (
              <Stack align="center">
                <Stack.Item>
                  <Button
                    icon="minus"
                    compact
                    disabled={!canDecreaseMagic}
                    onClick={() => handleBumpSpecial(magicId, -1)}
                    style={{
                      minWidth: '1.2rem',
                      padding: '0.1rem',
                      fontSize: '0.7rem',
                    }}
                  />
                </Stack.Item>
                <Stack.Item>
                  <Tooltip
                    content={`Range: ${magicBase} - ${magicMeta?.max ?? 6}`}
                    position="top"
                  >
                    <Box
                      bold
                      style={{
                        color: magicBonus > 0 ? '#ba55d3' : '#888',
                        fontSize: '0.85rem',
                        minWidth: '1.5rem',
                        textAlign: 'center',
                        cursor: 'help',
                      }}
                    >
                      {magicTotal}
                    </Box>
                  </Tooltip>
                </Stack.Item>
                <Stack.Item>
                  <Button
                    icon="plus"
                    compact
                    disabled={!canIncreaseMagic}
                    onClick={() => handleBumpSpecial(magicId, 1)}
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
      )}

      {/* Essence (read-only, starts at 6, reduced by cyberware) */}
      <Stack mt={0.5} align="center" justify="space-between">
        <Stack.Item>
          <Tooltip
            content="Essence: reduced by cyberware/bioware"
            position="right"
          >
            <Box
              bold
              style={{
                fontSize: '0.8rem',
                color: '#00bcd4',
                cursor: 'help',
              }}
            >
              Essence
            </Box>
          </Tooltip>
        </Stack.Item>
        <Stack.Item>
          <Box
            bold
            style={{
              color: '#00bcd4',
              fontSize: '0.85rem',
              minWidth: '1.5rem',
              textAlign: 'center',
            }}
          >
            6.00
          </Box>
        </Stack.Item>
      </Stack>

      {/* Karma */}
      <Stack mt={0.5} align="center" justify="space-between">
        <Stack.Item>
          <Tooltip
            content="Karma: earned from Qualities (negative quirks give karma, positive quirks cost karma)"
            position="right"
          >
            <Box
              bold
              style={{
                fontSize: '0.8rem',
                color: '#ffd700',
                cursor: 'help',
              }}
            >
              Karma
            </Box>
          </Tooltip>
        </Stack.Item>
        <Stack.Item>
          <Box
            bold
            style={{
              color: karmaBalance >= 0 ? '#4caf50' : '#f44336',
              fontSize: '0.85rem',
              minWidth: '1.5rem',
              textAlign: 'center',
            }}
          >
            {karmaBalance >= 0 ? `+${karmaBalance}` : karmaBalance}
          </Box>
        </Stack.Item>
      </Stack>

      {/* Status */}
      <Box
        mt={0.3}
        style={{
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
        }}
      >
        {isAwakened
          ? `${awakening.charAt(0).toUpperCase() + awakening.slice(1)}`
          : 'Mundane'}
      </Box>
    </Box>
  );
});
