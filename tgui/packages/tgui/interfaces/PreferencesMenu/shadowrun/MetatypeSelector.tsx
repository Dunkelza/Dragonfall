/**
 * Metatype Selector Component
 *
 * Allows selection of metatype (Human, Elf, Dwarf, Ork, Troll) and
 * awakening status (Mundane, Mage, Adept, etc.) based on priority selections.
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Dropdown, Icon, Stack } from '../../../components';
import { AWAKENING, AWAKENING_DISPLAY_NAMES } from './constants';
import { ChargenConstData, ChargenState } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type MetatypeSelectorProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  value: ChargenState | null;
};

// ============================================================================
// HELPERS
// ============================================================================

const PRIORITY_RANKS: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
};

const priorityRank = (letter: string): number => PRIORITY_RANKS[letter] || 1;

// ============================================================================
// COMPONENT
// ============================================================================

export const MetatypeSelector = memo((props: MetatypeSelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    value,
  } = props;

  if (!chargenState || !chargenConstData) {
    return null;
  }

  const metatypeChoices = chargenConstData.metatype_choices || [
    { id: '/datum/species/human', name: 'Human', min_priority: 'E' },
  ];
  const awakeningChoices = chargenConstData.awakening_choices || [
    { id: AWAKENING.MUNDANE, name: AWAKENING_DISPLAY_NAMES.mundane },
    { id: AWAKENING.MAGE, name: AWAKENING_DISPLAY_NAMES.mage },
    { id: AWAKENING.ADEPT, name: AWAKENING_DISPLAY_NAMES.adept },
  ];

  const metatypeLetter = chargenState.priorities?.['metatype'] || 'E';
  const magicLetter = chargenState.priorities?.['magic'] || 'E';
  const metatypeSpecies =
    chargenState.metatype_species || '/datum/species/human';
  const awakening = chargenState.awakening || AWAKENING.MUNDANE;

  const allowedMetatypes = metatypeChoices.filter((c) =>
    metatypeLetter === 'E'
      ? c.id === '/datum/species/human'
      : priorityRank(metatypeLetter) >= priorityRank(c.min_priority),
  );

  const currentMetatypeName =
    metatypeChoices.find((c) => c.id === metatypeSpecies)?.name || 'Human';

  const magicRating =
    chargenConstData.priority_tables?.magic?.[magicLetter] || 0;
  const magicDisabled = magicLetter === 'E' || magicRating <= 0;

  const currentAwakeningName =
    awakeningChoices.find((c) => c.id === awakening)?.name ||
    AWAKENING_DISPLAY_NAMES[
      awakening as keyof typeof AWAKENING_DISPLAY_NAMES
    ] ||
    'Mundane';

  const handleSetMetatype = (newSpecies: string) => {
    if (isSaved) {
      return;
    }

    // Reset attributes to minimum values for the new metatype
    // This ensures the player sees correct bounds immediately
    const newMetatypeBounds =
      chargenConstData?.metatype_attribute_bounds?.[newSpecies] || {};
    const attributesMeta = chargenConstData?.attributes || [];
    const resetAttributes: Record<string, number> = {};
    attributesMeta.forEach((a) => {
      const range = newMetatypeBounds[a.id];
      const newMin =
        Array.isArray(range) && range.length >= 2 ? range[0] : a.min;
      resetAttributes[a.id] = newMin;
    });

    // Update the chargen state with reset attributes
    const newState = {
      ...value!,
      metatype_species: newSpecies,
      attributes: resetAttributes,
    };

    // Optimistic update for immediate UI feedback
    setPredictedValue(newState);

    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleSetAwakening = (newAwakening: string) => {
    if (isSaved) {
      return;
    }

    const newState = {
      ...value!,
      awakening: newAwakening as ChargenState['awakening'],
      special:
        newAwakening === AWAKENING.MUNDANE
          ? { ...chargenState.special }
          : chargenState.special,
    };

    // Optimistic update for immediate UI feedback
    setPredictedValue(newState);

    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__metatypeSelector">
      <Box className="PreferencesMenu__ShadowrunSheet__metatypeSelector__header">
        <Icon
          name="dna"
          className="PreferencesMenu__ShadowrunSheet__metatypeSelector__header__icon"
        />
        <Box className="PreferencesMenu__ShadowrunSheet__metatypeSelector__header__title">
          Metatype & Awakening
        </Box>
        <Box className="PreferencesMenu__ShadowrunSheet__metatypeSelector__header__priority">
          Meta: {metatypeLetter} | Magic: {magicLetter}
        </Box>
      </Box>

      <Stack vertical>
        {/* Metatype Selection */}
        <Stack.Item>
          <Stack align="center">
            <Stack.Item grow>
              <Tooltip
                content="Your metatype (ork, elf, dwarf, troll, or human). Available options depend on your Metatype priority (A-E). Higher priority unlocks more metatypes."
                position="bottom"
              >
                <Box
                  as="span"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.25)',
                    cursor: 'help',
                  }}
                >
                  Metatype
                </Box>
              </Tooltip>
              {metatypeLetter === 'E' && (
                <Box as="span" color="grey" ml={0.5}>
                  (Priority E: Human only)
                </Box>
              )}
            </Stack.Item>
            <Stack.Item width="14em">
              {isSaved ? (
                <Box className="PreferencesMenu__ShadowrunSheet__metatypeSelector__locked">
                  <Icon name="lock" mr={0.5} />
                  {currentMetatypeName}
                </Box>
              ) : (
                <Dropdown
                  width="100%"
                  selected={metatypeSpecies}
                  displayText={currentMetatypeName}
                  disabled={isSaved}
                  options={allowedMetatypes.map((c) => ({
                    value: c.id,
                    displayText: c.name,
                  }))}
                  onSelected={handleSetMetatype}
                />
              )}
            </Stack.Item>
          </Stack>
        </Stack.Item>

        {/* Awakening Selection */}
        <Stack.Item mt={0.5}>
          <Stack align="center">
            <Stack.Item grow>
              <Tooltip
                content="Your magical awakening status. Requires Magic priority higher than E to choose Mage or Adept."
                position="bottom"
              >
                <Box
                  as="span"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.25)',
                    cursor: 'help',
                  }}
                >
                  Awakening
                </Box>
              </Tooltip>
              {magicDisabled && (
                <Box as="span" color="grey" ml={0.5}>
                  (Magic priority E: Mundane only)
                </Box>
              )}
            </Stack.Item>
            <Stack.Item width="14em">
              {isSaved ? (
                <Box className="PreferencesMenu__ShadowrunSheet__metatypeSelector__locked">
                  <Icon name="lock" mr={0.5} />
                  {currentAwakeningName}
                </Box>
              ) : (
                <Dropdown
                  width="100%"
                  selected={awakening}
                  displayText={currentAwakeningName}
                  disabled={isSaved || magicDisabled}
                  options={
                    magicDisabled
                      ? [
                          {
                            value: AWAKENING.MUNDANE,
                            displayText: AWAKENING_DISPLAY_NAMES.mundane,
                          },
                        ]
                      : awakeningChoices.map((c) => ({
                          value: c.id,
                          displayText: c.name,
                        }))
                  }
                  onSelected={handleSetAwakening}
                />
              )}
            </Stack.Item>
          </Stack>
        </Stack.Item>

        {/* Magic Rating Display */}
        {!magicDisabled && (
          <Stack.Item mt={0.5}>
            <Box color="grey">
              <Icon name="hat-wizard" mr={0.5} />
              Magic Rating: <b>{magicRating}</b> (from Magic priority{' '}
              {magicLetter})
            </Box>
          </Stack.Item>
        )}
      </Stack>
    </Box>
  );
});
