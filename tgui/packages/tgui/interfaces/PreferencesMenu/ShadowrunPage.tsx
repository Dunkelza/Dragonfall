import { useEffect, useMemo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useBackend, useLocalState } from '../../backend';
import {
  Box,
  Button,
  Dropdown,
  Icon,
  Input,
  LabeledList,
  Stack,
  Tabs,
} from '../../components';
import { CharacterPreview } from './CharacterPreview';
import { PreferencesMenuData, ServerData } from './data';
import { createSetPreference } from './data';
import { JobsPage } from './JobsPage';
import { MultiNameInput } from './names';
import features from './preferences/features';
import { FeatureValueInput } from './preferences/features/base';
import { Gender, GENDERS } from './preferences/gender';
import { QuirksPage } from './QuirksPage';
import { ServerPreferencesFetcher } from './ServerPreferencesFetcher';

enum ShadowrunTab {
  Augments = 'augments',
  Core = 'core',
  Occupations = 'occupations',
  Qualities = 'qualities',
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

type DashboardTileProps = {
  colorType?: 'physical' | 'mental' | 'special' | 'resources';
  icon: string;
  label: string;
  status?: 'good' | 'bad' | 'warn' | 'neutral';
  subtext?: string;
  tooltip?: string;
  value: string | number;
};

const DashboardTile = (props: DashboardTileProps) => {
  const { icon, label, value, subtext, colorType, status, tooltip } = props;

  const classNames = [
    'PreferencesMenu__ShadowrunSheet__dashboardTile',
    colorType
      ? `PreferencesMenu__ShadowrunSheet__dashboardTile--${colorType}`
      : '',
    status === 'bad'
      ? 'PreferencesMenu__ShadowrunSheet__dashboardTile--bad'
      : '',
    status === 'good'
      ? 'PreferencesMenu__ShadowrunSheet__dashboardTile--good'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <Box className={classNames}>
      <Box className="PreferencesMenu__ShadowrunSheet__dashboardTile__icon">
        <Icon name={icon} />
      </Box>
      <Box className="PreferencesMenu__ShadowrunSheet__dashboardTile__value">
        {value}
      </Box>
      <Box className="PreferencesMenu__ShadowrunSheet__dashboardTile__label">
        {label}
      </Box>
      {subtext && (
        <Box className="PreferencesMenu__ShadowrunSheet__dashboardTile__subtext">
          {subtext}
        </Box>
      )}
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="bottom">
        {content}
      </Tooltip>
    );
  }

  return content;
};

type ValidationBadgeProps = {
  status: 'good' | 'bad' | 'warn' | 'none';
};

const ValidationBadge = (props: ValidationBadgeProps) => {
  const { status } = props;

  if (status === 'none') {
    return null;
  }

  const icon =
    status === 'good'
      ? 'check'
      : status === 'bad'
        ? 'exclamation'
        : 'exclamation-triangle';

  return (
    <Box
      as="span"
      className={`PreferencesMenu__ShadowrunSheet__validationBadge PreferencesMenu__ShadowrunSheet__validationBadge--${status}`}
    >
      <Icon name={icon} />
    </Box>
  );
};

type ProgressBarProps = {
  max: number;
  value: number;
};

const ProgressBar = (props: ProgressBarProps) => {
  const { value, max } = props;
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const fillClass =
    percent >= 80
      ? 'PreferencesMenu__ShadowrunSheet__progressBar__fill--good'
      : percent >= 40
        ? 'PreferencesMenu__ShadowrunSheet__progressBar__fill--average'
        : 'PreferencesMenu__ShadowrunSheet__progressBar__fill--bad';

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__progressBar">
      <Box
        className={`PreferencesMenu__ShadowrunSheet__progressBar__fill ${fillClass}`}
        style={{ width: `${percent}%` }}
      />
    </Box>
  );
};

type CollapsibleSectionProps = {
  badge?: 'good' | 'bad' | 'warn' | 'none';
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  stateKey: string;
  title: string;
};

const CollapsibleSection = (props: CollapsibleSectionProps) => {
  const { title, icon, badge, defaultOpen = true, children, stateKey } = props;
  const [isOpen, setIsOpen] = useLocalState(stateKey, defaultOpen);

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__collapsible">
      <Box
        className="PreferencesMenu__ShadowrunSheet__collapsible__header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Box
          className={`PreferencesMenu__ShadowrunSheet__collapsible__header__icon ${isOpen ? 'PreferencesMenu__ShadowrunSheet__collapsible__header__icon--open' : ''}`}
        >
          <Icon name="chevron-right" />
        </Box>
        <Box className="PreferencesMenu__ShadowrunSheet__collapsible__header__title">
          {icon && <Icon name={icon} mr={0.5} />}
          {title}
        </Box>
        {badge && badge !== 'none' && (
          <Box className="PreferencesMenu__ShadowrunSheet__collapsible__header__badge">
            <ValidationBadge status={badge} />
          </Box>
        )}
      </Box>
      <Box
        className={`PreferencesMenu__ShadowrunSheet__collapsible__content ${!isOpen ? 'PreferencesMenu__ShadowrunSheet__collapsible__content--closed' : ''}`}
      >
        {children}
      </Box>
    </Box>
  );
};

// Metatype Selector Component - moved from chargen to biometrics
type MetatypeSelectorProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  dashboardData: any;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: any) => void;
  value: any;
};

const MetatypeSelector = (props: MetatypeSelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    dashboardData,
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
    { id: 'mundane', name: 'Mundane' },
    { id: 'mage', name: 'Mage' },
    { id: 'adept', name: 'Adept' },
  ];

  const metatypeLetter = chargenState.priorities?.['metatype'] || 'E';
  const magicLetter = chargenState.priorities?.['magic'] || 'E';
  const metatypeSpecies =
    chargenState.metatype_species || '/datum/species/human';
  const awakening = chargenState.awakening || 'mundane';

  const priorityRank = (letter: string) =>
    (({ A: 5, B: 4, C: 3, D: 2, E: 1 }) as Record<string, number>)[letter] || 1;

  const allowedMetatypes = metatypeChoices.filter((c: any) =>
    metatypeLetter === 'E'
      ? c.id === '/datum/species/human'
      : priorityRank(metatypeLetter) >= priorityRank(c.min_priority),
  );

  const currentMetatypeName =
    metatypeChoices.find((c: any) => c.id === metatypeSpecies)?.name || 'Human';

  const magicRating =
    chargenConstData.priority_tables?.magic?.[magicLetter] || 0;
  const magicDisabled = magicLetter === 'E' || magicRating <= 0;

  const currentAwakeningName =
    awakeningChoices.find((c: any) => c.id === awakening)?.name || 'Mundane';

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
    attributesMeta.forEach((a: any) => {
      const range = newMetatypeBounds[a.id];
      const newMin =
        Array.isArray(range) && range.length >= 2 ? range[0] : a.min;
      resetAttributes[a.id] = newMin;
    });

    // Update the chargen state with reset attributes
    const newState = {
      ...value,
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
      ...value,
      awakening: newAwakening,
      special:
        newAwakening === 'mundane'
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
                  options={allowedMetatypes.map((c: any) => ({
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
                      ? [{ value: 'mundane', displayText: 'Mundane' }]
                      : awakeningChoices.map((c: any) => ({
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
};

// Priority Selector Component - for sidebar
type PrioritySelectorProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: any) => void;
  value: any;
};

const priorityLetters = ['A', 'B', 'C', 'D', 'E'] as const;
type PriorityLetter = (typeof priorityLetters)[number];

const priorityCategories = [
  'metatype',
  'attributes',
  'magic',
  'skills',
  'resources',
] as const;
type PriorityCategory = (typeof priorityCategories)[number];

const PrioritySelector = (props: PrioritySelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    value,
  } = props;

  const priorities = chargenState?.priorities || {};
  const displayNames = chargenConstData?.priority_display_names || {};

  const getLetterColor = (letter: string) => {
    switch (letter) {
      case 'A':
        return '#4caf50';
      case 'B':
        return '#8bc34a';
      case 'C':
        return '#ffeb3b';
      case 'D':
        return '#ff9800';
      default:
        return '#f44336';
    }
  };

  const handleSetPriority = (category: string, newLetter: PriorityLetter) => {
    // Swap priorities: find which category currently has the newLetter
    // and give it the old letter from the category being changed
    const oldLetter = priorities[category];
    const newPriorities = { ...priorities };

    // Find the category that currently has the letter we want
    for (const [otherCat, otherLetter] of Object.entries(priorities)) {
      if (otherCat !== category && otherLetter === newLetter) {
        // Swap: give the other category our old letter
        newPriorities[otherCat] = oldLetter;
        break;
      }
    }

    // Set our new letter
    newPriorities[category] = newLetter;

    const newState = {
      ...chargenState,
      priorities: newPriorities,
    };
    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  return (
    <Box
      className="PreferencesMenu__ShadowrunSheet__prioritySelector"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '2px solid rgba(202, 165, 61, 0.4)',
        padding: '0.5rem',
        marginTop: '0.5rem',
      }}
    >
      <Box
        bold
        style={{
          color: '#caa53d',
          borderBottom: '1px solid rgba(202, 165, 61, 0.3)',
          paddingBottom: '0.3rem',
          marginBottom: '0.4rem',
          fontSize: '0.9rem',
        }}
      >
        <Icon name="layer-group" mr={0.5} />
        Priorities
      </Box>
      {priorityCategories.map((category) => {
        const display = displayNames[category] || category;
        const currentLetter = (priorities[category] as PriorityLetter) || 'E';
        const letterColor = getLetterColor(currentLetter);

        return (
          <Stack
            key={category}
            align="center"
            style={{
              padding: '0.2rem 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Stack.Item grow>
              <Box style={{ fontSize: '0.85rem' }}>{display}</Box>
            </Stack.Item>
            <Stack.Item>
              {isSaved ? (
                <Box
                  bold
                  style={{
                    color: letterColor,
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.1rem 0.4rem',
                    minWidth: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                  }}
                >
                  {currentLetter}
                </Box>
              ) : (
                <Dropdown
                  width="3.5rem"
                  selected={currentLetter}
                  options={priorityLetters.map((l) => {
                    // Find if another category has this letter
                    const usedBy = Object.entries(priorities).find(
                      ([cat, letter]) => cat !== category && letter === l,
                    );
                    const usedByName = usedBy
                      ? displayNames[usedBy[0]] || usedBy[0]
                      : null;
                    return {
                      value: l,
                      displayText: usedByName ? `${l} ⟷ ${usedByName}` : l,
                    };
                  })}
                  onSelected={(v) =>
                    handleSetPriority(category, v as PriorityLetter)
                  }
                />
              )}
            </Stack.Item>
          </Stack>
        );
      })}
    </Box>
  );
};

// ============================================================================
// ATTRIBUTE SELECTOR (Sidebar)
// ============================================================================

// Attribute descriptions for tooltips
const ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
  // Physical attributes
  body: 'Body (BOD) measures physical health, resilience, and resistance to damage. Used for resisting toxins, diseases, and physical trauma.',
  agility:
    'Agility (AGI) represents coordination, balance, and fine motor control. Governs most combat skills, stealth, and physical manipulation.',
  reaction:
    'Reaction (REA) determines reflexes and response time. Critical for initiative, defense, and vehicle handling.',
  strength:
    'Strength (STR) measures raw physical power. Affects melee damage, carrying capacity, and climbing.',
  // Mental attributes
  willpower:
    'Willpower (WIL) reflects mental fortitude and resistance to mental attacks. Used for resisting magic and intimidation.',
  logic:
    'Logic (LOG) represents analytical thinking and memory. Key for technical skills, hacking, and medicine.',
  intuition:
    'Intuition (INT) measures gut instincts and situational awareness. Important for perception, navigation, and street smarts.',
  charisma:
    'Charisma (CHA) determines social influence and force of personality. Governs social skills and leadership.',
};

const getAttributeDescription = (
  attrId: string,
  attrName: string,
  min: number,
  max: number,
): string => {
  const baseId = attrId.split('/').pop()?.toLowerCase() || attrId.toLowerCase();
  const desc = ATTRIBUTE_DESCRIPTIONS[baseId];
  if (desc) {
    return `${desc} Range: ${min}-${max}.`;
  }
  return `${attrName}. Range: ${min}-${max}.`;
};

type AttributeSelectorProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: any) => void;
  value: any;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const AttributeSelector = (props: AttributeSelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    value,
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
  const effectiveAttributesMeta = attributesMeta.map((a: any) => {
    const range = metatypeBounds[a.id];
    if (Array.isArray(range) && range.length >= 2) {
      return { ...a, min: range[0], max: range[1] };
    }
    return a;
  });

  // Calculate totals
  const attrLetter = priorities['attributes'] || 'E';
  const totalPoints = priorityTables?.attributes?.[attrLetter] || 0;
  const spentPoints = effectiveAttributesMeta.reduce((sum: number, a: any) => {
    const current = attributes[a.id] ?? a.min;
    return sum + Math.max(0, current - a.min);
  }, 0);
  const remainingPoints = totalPoints - spentPoints;

  const handleBumpAttribute = (attrId: string, delta: number) => {
    if (isSaved) return;

    const attrMeta = effectiveAttributesMeta.find((a: any) => a.id === attrId);
    if (!attrMeta) return;

    const current = attributes[attrId] ?? attrMeta.min;
    const nextValue = clamp(current + delta, attrMeta.min, attrMeta.max);

    const nextAttrs = { ...attributes, [attrId]: nextValue };
    const newState = { ...chargenState, attributes: nextAttrs };

    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  const getValueColor = (current: number, min: number) => {
    if (current === min) return '#888';
    if (current >= min + 4) return '#4caf50';
    if (current >= min + 2) return '#8bc34a';
    return '#fff';
  };

  return (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '2px solid rgba(100, 149, 237, 0.4)',
        padding: '0.5rem',
        marginTop: '0.5rem',
      }}
    >
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
      {effectiveAttributesMeta.map((attr: any) => {
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
};

// ============================================================================
// SPECIAL SELECTOR (Sidebar)
// ============================================================================

type SpecialSelectorProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  featureId: string;
  isSaved: boolean;
  karmaBalance: number;
  setPredictedValue: (value: any) => void;
  value: any;
};

const SpecialSelector = (props: SpecialSelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    karmaBalance,
    act,
    featureId,
    setPredictedValue,
    value,
  } = props;

  const specialAttributesMeta = chargenConstData?.special_attributes || [];
  const priorityTables = chargenConstData?.priority_tables;
  const priorities = chargenState?.priorities || {};
  const special = chargenState?.special || {};
  const awakening = chargenState?.awakening || 'mundane';

  const metatypeLetter = priorities['metatype'] || 'E';
  const magicLetter = priorities['magic'] || 'E';

  const totalPoints = priorityTables?.metatype_special?.[metatypeLetter] || 0;
  const magicBase = priorityTables?.magic?.[magicLetter] || 0;
  const edgeBase = chargenConstData?.edge_base ?? 2; // Edge base from server data

  const isAwakened = awakening !== 'mundane';

  // Find edge and magic IDs
  const edgeMeta = specialAttributesMeta.find((s: any) =>
    s.id?.toLowerCase().includes('edge'),
  );
  const magicMeta = specialAttributesMeta.find((s: any) =>
    s.id?.toLowerCase().includes('magic'),
  );

  const edgeId = edgeMeta?.id || 'edge';
  const magicId = magicMeta?.id || 'magic';

  const spentPoints = Object.values(special).reduce<number>(
    (sum, v) => sum + Math.max(0, Number(v) || 0),
    0,
  );
  const remainingPoints = totalPoints - spentPoints;

  const handleBumpSpecial = (specialId: string, delta: number) => {
    if (isSaved) return;

    const meta = specialAttributesMeta.find((s: any) => s.id === specialId);
    if (!meta) return;

    const isMagic = specialId === magicId;
    if (isMagic && !isAwakened) return;

    const currentBonus = special[specialId] ?? 0;
    const base = isMagic ? magicBase : edgeBase;
    const maxBonusFromStat = Math.max(0, meta.max - base);
    const poolRemainingIfRemoveCurrent =
      totalPoints - (spentPoints - currentBonus);
    const maxBonusFromPool = Math.max(0, poolRemainingIfRemoveCurrent);
    const nextBonus = clamp(
      currentBonus + delta,
      0,
      Math.min(maxBonusFromStat, maxBonusFromPool),
    );

    const newState = {
      ...chargenState,
      special: { ...special, [specialId]: nextBonus },
    };

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
                awakening === 'technomancer'
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
                {awakening === 'technomancer' ? 'Resonance' : 'Magic'} (Base:{' '}
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
};

// ============================================================================
// MAGIC SELECTOR (Traditions, Spells, Adept Powers)
// ============================================================================

type MagicSelectorProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: any) => void;
  value: any;
};

const MagicSelector = (props: MagicSelectorProps) => {
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

  const awakening = chargenState.awakening || 'mundane';
  const isAwakened = awakening !== 'mundane';
  const isTechnomancer = awakening === 'technomancer';
  const isMage = awakening === 'mage' || awakening === 'mystic_adept';
  const isAdept = awakening === 'adept' || awakening === 'mystic_adept';

  // Don't render anything for mundanes
  if (!isAwakened) {
    return null;
  }

  // Get traditions list
  const traditions = chargenConstData.traditions || [];
  const selectedTradition = chargenState.tradition || '';
  const currentTradition = traditions.find(
    (t: any) => t.id === selectedTradition,
  );

  // Get spells list (for mages)
  const spells = chargenConstData.spells || [];
  const selectedSpells = chargenState.selected_spells || [];
  const magicRating =
    chargenState.special?.['/datum/rpg_stat/magic'] ||
    chargenConstData.priority_tables?.magic?.[
      chargenState.priorities?.['magic']
    ] ||
    0;
  const maxSpells = magicRating * 2;

  // Get adept powers (for adepts)
  const adeptPowers = chargenConstData.adept_powers || [];
  const selectedPowers = chargenState.selected_powers || {};
  const maxPP = magicRating; // Power Points = Magic Rating
  const spentPP = Object.entries(selectedPowers).reduce(
    (sum, [powerId, level]) => {
      const power = adeptPowers.find((p: any) => p.id === powerId);
      if (!power) return sum;
      const lvl = Number(level) || 1;
      return sum + power.pp_cost * lvl;
    },
    0,
  );

  // Get complex forms (for technomancers)
  const complexForms = chargenConstData.complex_forms || [];
  const selectedForms = chargenState.selected_complex_forms || [];
  const resonance =
    chargenState.special?.['/datum/rpg_stat/resonance'] || magicRating;
  const maxForms = resonance * 2;

  const handleSetTradition = (newTradition: string) => {
    if (isSaved) return;

    const newState = {
      ...value,
      tradition: newTradition,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleToggleSpell = (spellId: string) => {
    if (isSaved) return;

    const currentSpells = [...selectedSpells];
    const idx = currentSpells.indexOf(spellId);
    if (idx >= 0) {
      currentSpells.splice(idx, 1);
    } else if (currentSpells.length < maxSpells) {
      currentSpells.push(spellId);
    }

    const newState = {
      ...value,
      selected_spells: currentSpells,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleToggleForm = (formId: string) => {
    if (isSaved) return;

    const currentForms = [...selectedForms];
    const idx = currentForms.indexOf(formId);
    if (idx >= 0) {
      currentForms.splice(idx, 1);
    } else if (currentForms.length < maxForms) {
      currentForms.push(formId);
    }

    const newState = {
      ...value,
      selected_complex_forms: currentForms,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleBumpPower = (powerId: string, delta: number) => {
    if (isSaved) return;

    const power = adeptPowers.find((p: any) => p.id === powerId);
    if (!power) return;

    const currentLevel = Number(selectedPowers[powerId]) || 0;
    const newLevel = Math.max(0, currentLevel + delta);
    const maxLevel = power.has_levels ? power.max_levels : 1;

    // Check PP cost
    const costDelta = delta * power.pp_cost;
    if (delta > 0 && spentPP + costDelta > maxPP) return;
    if (newLevel > maxLevel) return;

    const newPowers = { ...selectedPowers };
    if (newLevel <= 0) {
      delete newPowers[powerId];
    } else {
      newPowers[powerId] = newLevel;
    }

    const newState = {
      ...value,
      selected_powers: newPowers,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  // Group spells by category
  const spellsByCategory = spells.reduce(
    (acc: Record<string, any[]>, spell: any) => {
      const cat = spell.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(spell);
      return acc;
    },
    {},
  );

  // Group complex forms by category
  const formsByCategory = complexForms.reduce(
    (acc: Record<string, any[]>, form: any) => {
      const cat = form.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(form);
      return acc;
    },
    {},
  );

  // Group adept powers by category
  const powersByCategory = adeptPowers.reduce(
    (acc: Record<string, any[]>, power: any) => {
      const cat = power.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(power);
      return acc;
    },
    {},
  );

  const [spellCategory, setSpellCategory] = useLocalState(
    'sr_magic_spell_cat',
    'combat',
  );
  const [formCategory, setFormCategory] = useLocalState(
    'sr_magic_form_cat',
    'attack',
  );
  const [powerCategory, setPowerCategory] = useLocalState(
    'sr_magic_power_cat',
    'physical',
  );

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__magicSelector">
      <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header">
        <Icon
          name={isTechnomancer ? 'wifi' : 'magic'}
          className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__icon"
        />
        <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__title">
          {isTechnomancer ? 'Resonance' : 'Magic'}
        </Box>
      </Box>

      {/* Tradition Selector (for magical awakened) */}
      {!isTechnomancer && (
        <Box mt={0.5}>
          <Stack align="center" justify="space-between">
            <Stack.Item>
              <Tooltip
                content="Your magical tradition determines how you perceive and interact with the astral plane, and what attribute you use to resist drain."
                position="right"
              >
                <Box
                  style={{
                    fontSize: '0.75rem',
                    cursor: 'help',
                    borderBottom: '1px dotted rgba(255,255,255,0.2)',
                  }}
                >
                  Tradition
                </Box>
              </Tooltip>
            </Stack.Item>
            <Stack.Item width="10em">
              {isSaved ? (
                <Box
                  style={{
                    fontSize: '0.75rem',
                    color: '#ba55d3',
                    textAlign: 'right',
                  }}
                >
                  <Icon name="lock" mr={0.5} />
                  {currentTradition?.name || 'None'}
                </Box>
              ) : (
                <Dropdown
                  width="100%"
                  selected={selectedTradition}
                  displayText={currentTradition?.name || 'Select...'}
                  options={traditions.map((t: any) => ({
                    value: t.id,
                    displayText: t.name,
                  }))}
                  onSelected={handleSetTradition}
                />
              )}
            </Stack.Item>
          </Stack>
          {currentTradition && (
            <Box
              mt={0.3}
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Drain: {currentTradition.drain_attribute}
            </Box>
          )}
        </Box>
      )}

      {/* Spells (for mages/mystic adepts) */}
      {isMage && (
        <CollapsibleSection
          title={`Spells (${selectedSpells.length}/${maxSpells})`}
          icon="book-open"
          stateKey="sr_magic_spells"
          defaultOpen={false}
        >
          <Tabs fluid>
            {Object.keys(spellsByCategory).map((cat) => (
              <Tabs.Tab
                key={cat}
                selected={spellCategory === cat}
                onClick={() => setSpellCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Tabs.Tab>
            ))}
          </Tabs>
          <Box
            style={{
              maxHeight: '12rem',
              overflowY: 'auto',
              marginTop: '0.25rem',
            }}
          >
            {(spellsByCategory[spellCategory] || []).map((spell: any) => {
              const isSelected = selectedSpells.includes(spell.id);
              return (
                <Tooltip key={spell.id} content={spell.desc} position="right">
                  <Box
                    className={`PreferencesMenu__ShadowrunSheet__spellItem ${isSelected ? 'PreferencesMenu__ShadowrunSheet__spellItem--selected' : ''}`}
                    onClick={() => handleToggleSpell(spell.id)}
                    style={{
                      cursor: isSaved ? 'not-allowed' : 'pointer',
                      opacity: isSaved ? '0.6' : '1',
                    }}
                  >
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box style={{ fontSize: '0.75rem' }}>{spell.name}</Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            fontSize: '0.65rem',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          F{spell.drain > 0 ? '+' : ''}
                          {spell.drain}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        {isSelected && (
                          <Icon name="check" color="good" size={0.8} />
                        )}
                      </Stack.Item>
                    </Stack>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </CollapsibleSection>
      )}

      {/* Adept Powers (for adepts/mystic adepts) */}
      {isAdept && (
        <CollapsibleSection
          title={`Powers (${spentPP.toFixed(1)}/${maxPP} PP)`}
          icon="fist-raised"
          stateKey="sr_magic_powers"
          defaultOpen={false}
        >
          <Tabs fluid>
            {Object.keys(powersByCategory).map((cat) => (
              <Tabs.Tab
                key={cat}
                selected={powerCategory === cat}
                onClick={() => setPowerCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Tabs.Tab>
            ))}
          </Tabs>
          <Box
            style={{
              maxHeight: '12rem',
              overflowY: 'auto',
              marginTop: '0.25rem',
            }}
          >
            {(powersByCategory[powerCategory] || []).map((power: any) => {
              const currentLevel = Number(selectedPowers[power.id]) || 0;
              const isActive = currentLevel > 0;
              const canIncrease =
                !isSaved &&
                spentPP + power.pp_cost <= maxPP &&
                (!power.has_levels || currentLevel < power.max_levels);
              const canDecrease = !isSaved && currentLevel > 0;

              return (
                <Tooltip key={power.id} content={power.desc} position="right">
                  <Box
                    className={`PreferencesMenu__ShadowrunSheet__powerItem ${isActive ? 'PreferencesMenu__ShadowrunSheet__powerItem--active' : ''}`}
                    style={{ opacity: isSaved ? '0.6' : '1' }}
                  >
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box style={{ fontSize: '0.75rem' }}>
                          {power.name}
                          {power.has_levels && currentLevel > 0 && (
                            <Box as="span" color="label" ml={0.5}>
                              [{currentLevel}]
                            </Box>
                          )}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            fontSize: '0.65rem',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {power.pp_cost} PP
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="minus"
                          compact
                          disabled={!canDecrease}
                          onClick={() => handleBumpPower(power.id, -1)}
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                        <Button
                          icon="plus"
                          compact
                          disabled={!canIncrease}
                          onClick={() => handleBumpPower(power.id, 1)}
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                      </Stack.Item>
                    </Stack>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </CollapsibleSection>
      )}

      {/* Complex Forms (for technomancers) */}
      {isTechnomancer && (
        <CollapsibleSection
          title={`Complex Forms (${selectedForms.length}/${maxForms})`}
          icon="code"
          stateKey="sr_matrix_forms"
          defaultOpen={false}
        >
          <Tabs fluid>
            {Object.keys(formsByCategory).map((cat) => (
              <Tabs.Tab
                key={cat}
                selected={formCategory === cat}
                onClick={() => setFormCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Tabs.Tab>
            ))}
          </Tabs>
          <Box
            style={{
              maxHeight: '12rem',
              overflowY: 'auto',
              marginTop: '0.25rem',
            }}
          >
            {(formsByCategory[formCategory] || []).map((form: any) => {
              const isSelected = selectedForms.includes(form.id);
              return (
                <Tooltip key={form.id} content={form.desc} position="right">
                  <Box
                    className={`PreferencesMenu__ShadowrunSheet__spellItem ${isSelected ? 'PreferencesMenu__ShadowrunSheet__spellItem--selected' : ''}`}
                    onClick={() => handleToggleForm(form.id)}
                    style={{
                      cursor: isSaved ? 'not-allowed' : 'pointer',
                      opacity: isSaved ? '0.6' : '1',
                    }}
                  >
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box style={{ fontSize: '0.75rem' }}>{form.name}</Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            fontSize: '0.65rem',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          L{form.fading > 0 ? '+' : ''}
                          {form.fading}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        {isSelected && (
                          <Icon name="check" color="good" size={0.8} />
                        )}
                      </Stack.Item>
                    </Stack>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </CollapsibleSection>
      )}
    </Box>
  );
};

// ============================================================================
// SKILLS SECTION (Main Sheet)
// ============================================================================

type SkillsSectionProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: any) => void;
  value: any;
};

const SkillsSection = (props: SkillsSectionProps) => {
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

  const skillsMeta = chargenConstData.skills || [];
  const skillGroupsMeta = chargenConstData.skill_groups || [];
  const priorityTables = chargenConstData.priority_tables;

  const skillLetter = chargenState.priorities?.['skills'] || 'E';
  const totalSkillPoints = priorityTables?.skills?.[skillLetter] || 0;
  const totalGroupPoints = priorityTables?.skill_groups?.[skillLetter] || 0;

  const skills = chargenState.skills || {};
  const skillGroups = chargenState.skill_groups || {};

  const skillSpent = Object.values(skills).reduce<number>(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );
  const groupSpent = Object.values(skillGroups).reduce<number>(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );

  const skillRemaining = totalSkillPoints - skillSpent;
  const groupRemaining = totalGroupPoints - groupSpent;

  // Group skills by parent stat
  const skillsByStat = skillsMeta.reduce(
    (acc: Record<string, any[]>, skill: any) => {
      const stat = skill.parent_stat_name || 'Other';
      if (!acc[stat]) acc[stat] = [];
      acc[stat].push(skill);
      return acc;
    },
    {},
  );

  // Build map of which skills are locked by groups
  const groupInfoBySkillId = new Map<
    string,
    { groupId: string; groupName: string; rating: number }
  >();
  skillGroupsMeta.forEach((g: any) => {
    const rating = Number(skillGroups[g.id] || 0);
    if (rating > 0) {
      (g.skills || []).forEach((skillId: string) => {
        groupInfoBySkillId.set(skillId, {
          groupId: g.id,
          groupName: g.name,
          rating,
        });
      });
    }
  });

  const [activeTab, setActiveTab] = useLocalState('sr_skills_tab', 'All');
  const [showGroupMembers, setShowGroupMembers] = useLocalState(
    'sr_show_group_members',
    false,
  );

  const handleBumpSkill = (skillId: string, delta: number) => {
    if (isSaved) return;

    // Check if locked by group
    if (groupInfoBySkillId.has(skillId)) return;

    const current = Number(skills[skillId]) || 0;
    const newValue = Math.max(0, Math.min(6, current + delta));

    // Check points
    const costDelta = newValue - current;
    if (costDelta > 0 && skillSpent + costDelta > totalSkillPoints) return;

    const newSkills = { ...skills };
    if (newValue <= 0) {
      delete newSkills[skillId];
    } else {
      newSkills[skillId] = newValue;
    }

    const newState = {
      ...value,
      skills: newSkills,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleBumpGroup = (groupId: string, delta: number) => {
    if (isSaved) return;

    const current = Number(skillGroups[groupId]) || 0;
    const newValue = Math.max(0, Math.min(6, current + delta));

    // Check points
    const costDelta = newValue - current;
    if (costDelta > 0 && groupSpent + costDelta > totalGroupPoints) return;

    const newGroups = { ...skillGroups };
    if (newValue <= 0) {
      delete newGroups[groupId];
    } else {
      newGroups[groupId] = newValue;
    }

    const newState = {
      ...value,
      skill_groups: newGroups,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const statTabs = Object.keys(skillsByStat).sort();

  return (
    <CollapsibleSection
      title="Skills"
      icon="book"
      stateKey="sr_skills_section"
      defaultOpen
    >
      {/* Points Summary */}
      <Stack mb={0.5}>
        <Stack.Item grow>
          <Box
            style={{
              fontSize: '0.9rem',
              color:
                skillRemaining < 0
                  ? '#ff6b6b'
                  : skillRemaining === 0
                    ? '#4caf50'
                    : '#9b8fc7',
            }}
          >
            <Icon name="book" mr={0.5} />
            Skills: <b>{skillSpent}</b>/{totalSkillPoints}
            {skillRemaining > 0 && (
              <Box as="span" style={{ opacity: '0.6', marginLeft: '0.3rem' }}>
                ({skillRemaining} left)
              </Box>
            )}
          </Box>
        </Stack.Item>
        {totalGroupPoints > 0 && (
          <Stack.Item>
            <Box
              style={{
                fontSize: '0.9rem',
                color:
                  groupRemaining < 0
                    ? '#ff6b6b'
                    : groupRemaining === 0
                      ? '#4caf50'
                      : '#9b8fc7',
              }}
            >
              Groups: <b>{groupSpent}</b>/{totalGroupPoints}
            </Box>
          </Stack.Item>
        )}
      </Stack>

      {/* Skill Groups */}
      {skillGroupsMeta.length > 0 && (
        <Box mb={1}>
          <Stack align="center" mb={0.25}>
            <Stack.Item grow>
              <Box
                bold
                style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}
              >
                Skill Groups
              </Box>
            </Stack.Item>
            <Stack.Item>
              <Button
                icon={showGroupMembers ? 'eye-slash' : 'eye'}
                compact
                onClick={() => setShowGroupMembers(!showGroupMembers)}
                tooltip={showGroupMembers ? 'Hide members' : 'Show members'}
              />
            </Stack.Item>
          </Stack>
          <Box
            style={{
              maxHeight: '12rem',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.2)',
              padding: '0.4rem',
              borderRadius: '2px',
            }}
          >
            {skillGroupsMeta.map((group: any) => {
              const currentValue = Number(skillGroups[group.id]) || 0;
              const canIncrease =
                !isSaved && currentValue < 6 && groupSpent < totalGroupPoints;
              const canDecrease = !isSaved && currentValue > 0;
              const memberNames = (group.skills || [])
                .map((sid: string) => {
                  const s = skillsMeta.find((sk: any) => sk.id === sid);
                  return s?.name || sid;
                })
                .join(', ');

              return (
                <Box key={group.id} mb={0.25}>
                  <Tooltip content={`Members: ${memberNames}`} position="right">
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box style={{ fontSize: '0.9rem' }}>{group.name}</Box>
                        {showGroupMembers && (
                          <Box
                            style={{
                              fontSize: '0.75rem',
                              color: 'rgba(255,255,255,0.5)',
                              marginLeft: '0.5rem',
                            }}
                          >
                            {memberNames}
                          </Box>
                        )}
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="minus"
                          compact
                          disabled={!canDecrease}
                          onClick={() => handleBumpGroup(group.id, -1)}
                          style={{
                            minWidth: '1.5rem',
                            padding: '0.2rem',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            minWidth: '2rem',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: currentValue > 0 ? '#4caf50' : '#666',
                          }}
                        >
                          {currentValue}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="plus"
                          compact
                          disabled={!canIncrease}
                          onClick={() => handleBumpGroup(group.id, 1)}
                          style={{
                            minWidth: '1.5rem',
                            padding: '0.2rem',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Stack.Item>
                    </Stack>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Individual Skills */}
      <Box>
        <Tabs fluid>
          <Tabs.Tab
            selected={activeTab === 'All'}
            onClick={() => setActiveTab('All')}
          >
            All
          </Tabs.Tab>
          {statTabs.map((stat) => (
            <Tabs.Tab
              key={stat}
              selected={activeTab === stat}
              onClick={() => setActiveTab(stat)}
            >
              {stat}
            </Tabs.Tab>
          ))}
        </Tabs>

        <Box
          style={{
            maxHeight: '20rem',
            overflowY: 'auto',
            marginTop: '0.25rem',
            background: 'rgba(0,0,0,0.15)',
            padding: '0.4rem',
            borderRadius: '2px',
          }}
        >
          {(activeTab === 'All'
            ? skillsMeta
            : skillsByStat[activeTab] || []
          ).map((skill: any) => {
            const currentValue = Number(skills[skill.id]) || 0;
            const groupInfo = groupInfoBySkillId.get(skill.id);
            const isLocked = !!groupInfo;
            const effectiveValue = isLocked ? groupInfo!.rating : currentValue;
            const canIncrease =
              !isSaved &&
              !isLocked &&
              currentValue < 6 &&
              skillSpent < totalSkillPoints;
            const canDecrease = !isSaved && !isLocked && currentValue > 0;

            return (
              <Tooltip
                key={skill.id}
                content={
                  isLocked
                    ? `Locked by ${groupInfo!.groupName} group at rating ${groupInfo!.rating}`
                    : `${skill.name} (${skill.parent_stat_name})`
                }
                position="right"
              >
                <Box
                  style={{
                    padding: '0.35rem 0',
                    opacity: isSaved ? '0.6' : '1',
                    borderLeft: isLocked
                      ? '3px solid #ff9800'
                      : '3px solid transparent',
                    paddingLeft: '0.4rem',
                    marginBottom: '0.1rem',
                  }}
                >
                  <Stack align="center">
                    <Stack.Item grow>
                      <Box style={{ fontSize: '0.9rem' }}>
                        {skill.name}
                        {isLocked && (
                          <Icon
                            name="lock"
                            size={0.7}
                            color="orange"
                            ml={0.5}
                          />
                        )}
                      </Box>
                      <Box
                        style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {skill.parent_stat_name}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="minus"
                        compact
                        disabled={!canDecrease}
                        onClick={() => handleBumpSkill(skill.id, -1)}
                        style={{
                          minWidth: '1.5rem',
                          padding: '0.2rem',
                          fontSize: '0.75rem',
                        }}
                      />
                    </Stack.Item>
                    <Stack.Item>
                      <Box
                        style={{
                          minWidth: '2rem',
                          textAlign: 'center',
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          color: isLocked
                            ? '#ff9800'
                            : effectiveValue > 0
                              ? '#4caf50'
                              : '#666',
                        }}
                      >
                        {effectiveValue}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="plus"
                        compact
                        disabled={!canIncrease}
                        onClick={() => handleBumpSkill(skill.id, 1)}
                        style={{
                          minWidth: '1.5rem',
                          padding: '0.2rem',
                          fontSize: '0.75rem',
                        }}
                      />
                    </Stack.Item>
                  </Stack>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </CollapsibleSection>
  );
};

// ============================================================================
// KNOWLEDGE SKILLS SELECTOR
// ============================================================================

type KnowledgeSkillsSelectorProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: any) => void;
  value: any;
};

const KnowledgeSkillsSelector = (props: KnowledgeSkillsSelectorProps) => {
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

  // Get INT value for free knowledge skill points
  const getAttrValue = (name: string) => {
    const attrs = chargenConstData.attributes || [];
    const meta = attrs.find(
      (a: any) =>
        a.name?.toLowerCase() === name.toLowerCase() ||
        a.id?.toLowerCase().includes(name.toLowerCase()),
    );
    if (!meta) return 1;
    return chargenState.attributes?.[meta.id] ?? meta.min ?? 1;
  };

  const intuition = getAttrValue('intuition');
  const logic = getAttrValue('logic');
  const freeKnowledgePoints = (intuition + logic) * 2;

  const knowledgeSkills = chargenConstData.knowledge_skills || [];
  const selectedKnowledge = chargenState.knowledge_skills || {};
  const knowledgeSpent = Object.values(selectedKnowledge).reduce<number>(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );

  const languages = chargenConstData.languages || [];
  const selectedLanguages = chargenState.languages || {};
  const nativeLanguage = chargenState.native_language || '';

  // Calculate language points spent (excluding native language which is free)
  const languageSpent = Object.entries(selectedLanguages).reduce<number>(
    (sum, [langId, rating]) => {
      if (langId === nativeLanguage) return sum; // Native is free
      return sum + (Number(rating) || 0);
    },
    0,
  );

  // Total spent includes both knowledge skills and languages
  const spentPoints = knowledgeSpent + languageSpent;

  // Group knowledge skills by category
  const knowledgeByCategory = knowledgeSkills.reduce(
    (acc: Record<string, any[]>, skill: any) => {
      const cat = skill.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    },
    {},
  );

  const [knowledgeCategory, setKnowledgeCategory] = useLocalState(
    'sr_knowledge_cat',
    'academic',
  );

  const handleBumpKnowledge = (skillId: string, delta: number) => {
    if (isSaved) return;

    const current = Number(selectedKnowledge[skillId]) || 0;
    const newValue = Math.max(0, Math.min(6, current + delta));

    // Check points
    const costDelta = newValue - current;
    if (costDelta > 0 && spentPoints + costDelta > freeKnowledgePoints) return;

    const newKnowledge = { ...selectedKnowledge };
    if (newValue <= 0) {
      delete newKnowledge[skillId];
    } else {
      newKnowledge[skillId] = newValue;
    }

    const newState = {
      ...value,
      knowledge_skills: newKnowledge,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleSetNativeLanguage = (langId: string) => {
    if (isSaved) return;

    const newState = {
      ...value,
      native_language: langId,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleBumpLanguage = (langId: string, delta: number) => {
    if (isSaved) return;

    // Native language is always at N (not rated)
    if (langId === nativeLanguage) return;

    const current = Number(selectedLanguages[langId]) || 0;
    const newValue = Math.max(0, Math.min(6, current + delta));

    // Check if we have enough points
    const costDelta = newValue - current;
    if (costDelta > 0 && spentPoints + costDelta > freeKnowledgePoints) return;

    const newLanguages = { ...selectedLanguages };
    if (newValue <= 0) {
      delete newLanguages[langId];
    } else {
      newLanguages[langId] = newValue;
    }

    const newState = {
      ...value,
      languages: newLanguages,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const nativeLang = languages.find((l: any) => l.id === nativeLanguage);

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__knowledgeSelector">
      <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header">
        <Icon
          name="brain"
          className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__icon"
        />
        <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__title">
          Knowledge ({spentPoints}/{freeKnowledgePoints})
        </Box>
      </Box>

      {/* Native Language */}
      <Box mt={0.5}>
        <Stack align="center" justify="space-between">
          <Stack.Item>
            <Tooltip
              content="Your native language. You speak this at native fluency (N)."
              position="right"
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  cursor: 'help',
                  borderBottom: '1px dotted rgba(255,255,255,0.2)',
                }}
              >
                Native Language
              </Box>
            </Tooltip>
          </Stack.Item>
          <Stack.Item width="10em">
            {isSaved ? (
              <Box
                style={{
                  fontSize: '0.9rem',
                  color: '#4caf50',
                  textAlign: 'right',
                }}
              >
                <Icon name="lock" mr={0.5} />
                {nativeLang?.name || 'None'}
              </Box>
            ) : (
              <Dropdown
                width="100%"
                selected={nativeLanguage}
                displayText={nativeLang?.name || 'Select...'}
                options={languages.map((l: any) => ({
                  value: l.id,
                  displayText: l.name,
                }))}
                onSelected={handleSetNativeLanguage}
              />
            )}
          </Stack.Item>
        </Stack>
      </Box>

      {/* Knowledge Skills */}
      <CollapsibleSection
        title="Knowledge Skills"
        icon="graduation-cap"
        stateKey="sr_knowledge_skills"
        defaultOpen={false}
      >
        <Tabs fluid>
          {Object.keys(knowledgeByCategory).map((cat) => (
            <Tabs.Tab
              key={cat}
              selected={knowledgeCategory === cat}
              onClick={() => setKnowledgeCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Tabs.Tab>
          ))}
        </Tabs>
        <Box
          style={{
            maxHeight: '12rem',
            overflowY: 'auto',
            marginTop: '0.25rem',
          }}
        >
          {(knowledgeByCategory[knowledgeCategory] || []).map((skill: any) => {
            const currentValue = Number(selectedKnowledge[skill.id]) || 0;
            const canIncrease =
              !isSaved && currentValue < 6 && spentPoints < freeKnowledgePoints;
            const canDecrease = !isSaved && currentValue > 0;

            return (
              <Tooltip key={skill.id} content={skill.desc} position="right">
                <Box
                  className="PreferencesMenu__ShadowrunSheet__knowledgeItem"
                  style={{
                    opacity: isSaved ? '0.6' : '1',
                    padding: '0.35rem 0',
                  }}
                >
                  <Stack align="center">
                    <Stack.Item grow>
                      <Box style={{ fontSize: '0.9rem' }}>{skill.name}</Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="minus"
                        compact
                        disabled={!canDecrease}
                        onClick={() => handleBumpKnowledge(skill.id, -1)}
                        style={{
                          minWidth: '1.5rem',
                          padding: '0.2rem',
                          fontSize: '0.75rem',
                        }}
                      />
                    </Stack.Item>
                    <Stack.Item>
                      <Box
                        style={{
                          minWidth: '2rem',
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: currentValue > 0 ? '#4caf50' : '#666',
                        }}
                      >
                        {currentValue}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="plus"
                        compact
                        disabled={!canIncrease}
                        onClick={() => handleBumpKnowledge(skill.id, 1)}
                        style={{
                          minWidth: '1.5rem',
                          padding: '0.2rem',
                          fontSize: '0.75rem',
                        }}
                      />
                    </Stack.Item>
                  </Stack>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </CollapsibleSection>

      {/* Additional Languages - costs knowledge points */}
      <CollapsibleSection
        title={`Languages (${languageSpent} pts)`}
        icon="language"
        stateKey="sr_languages"
        defaultOpen={false}
      >
        <Box
          style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.5rem',
            fontStyle: 'italic',
          }}
        >
          Rating 3+ to understand, 6 to speak fluently
        </Box>
        <Box
          style={{
            maxHeight: '12rem',
            overflowY: 'auto',
          }}
        >
          {languages
            .filter((l: any) => l.id !== nativeLanguage)
            .map((lang: any) => {
              const currentValue = Number(selectedLanguages[lang.id]) || 0;
              // Languages are free - only check max rating
              const canIncrease = !isSaved && currentValue < 6;
              const canDecrease = !isSaved && currentValue > 0;

              return (
                <Tooltip key={lang.id} content={lang.desc} position="right">
                  <Box
                    className="PreferencesMenu__ShadowrunSheet__knowledgeItem"
                    style={{
                      opacity: isSaved ? '0.6' : '1',
                      padding: '0.35rem 0',
                    }}
                  >
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box style={{ fontSize: '0.9rem' }}>{lang.name}</Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="minus"
                          compact
                          disabled={!canDecrease}
                          onClick={() => handleBumpLanguage(lang.id, -1)}
                          style={{
                            minWidth: '1.5rem',
                            padding: '0.2rem',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            minWidth: '2rem',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: currentValue > 0 ? '#4caf50' : '#666',
                          }}
                        >
                          {currentValue}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="plus"
                          compact
                          disabled={!canIncrease}
                          onClick={() => handleBumpLanguage(lang.id, 1)}
                          style={{
                            minWidth: '1.5rem',
                            padding: '0.2rem',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Stack.Item>
                    </Stack>
                  </Box>
                </Tooltip>
              );
            })}
        </Box>
      </CollapsibleSection>
    </Box>
  );
};

// ============================================================================
// CONTACTS SELECTOR
// ============================================================================

type ContactsSelectorProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: any) => void;
  value: any;
};

const ContactsSelector = (props: ContactsSelectorProps) => {
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

  // Get CHA for contact points calculation
  const getAttrValue = (name: string) => {
    const attrs = chargenConstData.attributes || [];
    const meta = attrs.find(
      (a: any) =>
        a.name?.toLowerCase() === name.toLowerCase() ||
        a.id?.toLowerCase().includes(name.toLowerCase()),
    );
    if (!meta) return 1;
    return chargenState.attributes?.[meta.id] ?? meta.min ?? 1;
  };

  const charisma = getAttrValue('charisma');
  const maxContactPoints = charisma * 3;

  const contactTypes = chargenConstData.contact_types || [];
  const contacts = chargenState.contacts || [];

  // Calculate spent points
  const spentPoints = contacts.reduce(
    (sum: number, c: any) => sum + (c.connection || 1) + (c.loyalty || 1),
    0,
  );

  // Group contact types by archetype
  const typesByArchetype = contactTypes.reduce(
    (acc: Record<string, any[]>, ct: any) => {
      const arch = ct.archetype || 'general';
      if (!acc[arch]) acc[arch] = [];
      acc[arch].push(ct);
      return acc;
    },
    {},
  );

  const [selectedArchetype, setSelectedArchetype] = useLocalState(
    'sr_contact_arch',
    'fixer',
  );

  const handleAddContact = (typeId: string) => {
    if (isSaved) return;

    // Default connection 1, loyalty 1 = 2 points
    if (spentPoints + 2 > maxContactPoints) return;

    const contactType = contactTypes.find((ct: any) => ct.id === typeId);
    const newContact = {
      type_id: typeId,
      connection: 1,
      loyalty: 1,
      name: contactType?.name || 'Contact',
    };

    const newContacts = [...contacts, newContact];
    const newState = {
      ...value,
      contacts: newContacts,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleRemoveContact = (index: number) => {
    if (isSaved) return;

    const newContacts = contacts.filter((_: any, i: number) => i !== index);
    const newState = {
      ...value,
      contacts: newContacts,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleUpdateContact = (
    index: number,
    field: 'connection' | 'loyalty' | 'name',
    delta: number | string,
  ) => {
    if (isSaved) return;

    const contact = contacts[index];
    if (!contact) return;

    const newContacts = [...contacts];
    if (field === 'name') {
      newContacts[index] = { ...contact, name: delta };
    } else {
      const currentValue = contact[field] || 1;
      const maxValue = field === 'connection' ? 12 : 6;
      const newValue = Math.max(
        1,
        Math.min(maxValue, currentValue + (delta as number)),
      );
      const costDelta = delta as number;
      if (costDelta > 0 && spentPoints + costDelta > maxContactPoints) return;
      newContacts[index] = { ...contact, [field]: newValue };
    }

    const newState = {
      ...value,
      contacts: newContacts,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__contactsSelector">
      <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header">
        <Icon
          name="users"
          className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__icon"
        />
        <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__title">
          Contacts ({spentPoints}/{maxContactPoints})
        </Box>
      </Box>

      {/* Current Contacts */}
      {contacts.length > 0 && (
        <Box mt={0.5}>
          {contacts.map((contact: any, index: number) => {
            const contactType = contactTypes.find(
              (ct: any) => ct.id === contact.type_id,
            );
            return (
              <Box
                key={index}
                className="PreferencesMenu__ShadowrunSheet__contactItem"
                style={{
                  marginBottom: '0.25rem',
                  opacity: isSaved ? '0.6' : '1',
                }}
              >
                <Stack vertical>
                  <Stack.Item>
                    <Stack align="center">
                      <Stack.Item grow>
                        <Input
                          placeholder="Contact name"
                          value={contact.name || ''}
                          disabled={isSaved}
                          width="100%"
                          onChange={(_, v) =>
                            handleUpdateContact(index, 'name', v)
                          }
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="times"
                          color="bad"
                          compact
                          disabled={isSaved}
                          onClick={() => handleRemoveContact(index)}
                          style={{ minWidth: '1.2rem', fontSize: '0.6rem' }}
                        />
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                  <Stack.Item>
                    <Box
                      style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {contactType?.profession || 'Contact'}
                    </Box>
                  </Stack.Item>
                  <Stack.Item>
                    <Stack align="center">
                      <Stack.Item>
                        <Tooltip content="Connection: How useful/powerful (1-12)">
                          <Box
                            as="span"
                            style={{
                              fontSize: '0.7rem',
                              cursor: 'help',
                            }}
                          >
                            C:
                          </Box>
                        </Tooltip>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="minus"
                          compact
                          disabled={isSaved || contact.connection <= 1}
                          onClick={() =>
                            handleUpdateContact(index, 'connection', -1)
                          }
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            minWidth: '1rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          {contact.connection || 1}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="plus"
                          compact
                          disabled={
                            isSaved ||
                            contact.connection >= 12 ||
                            spentPoints >= maxContactPoints
                          }
                          onClick={() =>
                            handleUpdateContact(index, 'connection', 1)
                          }
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item ml={1}>
                        <Tooltip content="Loyalty: How much they like you (1-6)">
                          <Box
                            as="span"
                            style={{
                              fontSize: '0.7rem',
                              cursor: 'help',
                            }}
                          >
                            L:
                          </Box>
                        </Tooltip>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="minus"
                          compact
                          disabled={isSaved || contact.loyalty <= 1}
                          onClick={() =>
                            handleUpdateContact(index, 'loyalty', -1)
                          }
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            minWidth: '1rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          {contact.loyalty || 1}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="plus"
                          compact
                          disabled={
                            isSaved ||
                            contact.loyalty >= 6 ||
                            spentPoints >= maxContactPoints
                          }
                          onClick={() =>
                            handleUpdateContact(index, 'loyalty', 1)
                          }
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Add New Contact */}
      <CollapsibleSection
        title="Add Contact"
        icon="user-plus"
        stateKey="sr_add_contact"
        defaultOpen={contacts.length === 0}
      >
        <Tabs fluid>
          {Object.keys(typesByArchetype).map((arch) => (
            <Tabs.Tab
              key={arch}
              selected={selectedArchetype === arch}
              onClick={() => setSelectedArchetype(arch)}
            >
              {arch.charAt(0).toUpperCase() + arch.slice(1)}
            </Tabs.Tab>
          ))}
        </Tabs>
        <Box
          style={{
            maxHeight: '8rem',
            overflowY: 'auto',
            marginTop: '0.25rem',
          }}
        >
          {(typesByArchetype[selectedArchetype] || []).map((ct: any) => (
            <Tooltip key={ct.id} content={ct.specialty} position="right">
              <Box
                className="PreferencesMenu__ShadowrunSheet__contactTypeItem"
                onClick={() => handleAddContact(ct.id)}
                style={{
                  cursor:
                    isSaved || spentPoints + 2 > maxContactPoints
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    isSaved || spentPoints + 2 > maxContactPoints ? '0.5' : '1',
                }}
              >
                <Stack align="center">
                  <Stack.Item grow>
                    <Box style={{ fontSize: '0.75rem' }}>{ct.name}</Box>
                    <Box
                      style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {ct.profession}
                    </Box>
                  </Stack.Item>
                  <Stack.Item>
                    <Icon name="plus" size={0.8} />
                  </Stack.Item>
                </Stack>
              </Box>
            </Tooltip>
          ))}
        </Box>
      </CollapsibleSection>
    </Box>
  );
};

// ============================================================================
// AUGMENTS SECTION (Cyberware, Bioware, etc.)
// ============================================================================

// Augment grade definitions - affects essence cost multiplier and availability
const AUGMENT_GRADES: Record<
  string,
  {
    color: string;
    costMultiplier: number;
    description: string;
    essenceMultiplier: number;
    name: string;
  }
> = {
  used: {
    name: 'Used',
    essenceMultiplier: 1.25,
    costMultiplier: 0.75,
    description: 'Second-hand cyberware. Higher essence cost, lower price.',
    color: '#888',
  },
  standard: {
    name: 'Standard',
    essenceMultiplier: 1.0,
    costMultiplier: 1.0,
    description: 'Factory-new augmentation at base stats.',
    color: '#9b8fc7',
  },
  alphaware: {
    name: 'Alphaware',
    essenceMultiplier: 0.8,
    costMultiplier: 2.0,
    description: 'Higher quality, 20% less essence cost.',
    color: '#4fc3f7',
  },
  betaware: {
    name: 'Betaware',
    essenceMultiplier: 0.6,
    costMultiplier: 4.0,
    description: 'Premium grade, 40% less essence cost.',
    color: '#81c784',
  },
  deltaware: {
    name: 'Deltaware',
    essenceMultiplier: 0.5,
    costMultiplier: 10.0,
    description: 'Top-tier quality, 50% less essence cost. Very rare.',
    color: '#ffb74d',
  },
};

// Format nuyen with commas
const formatNuyen = (amount: number) => {
  return '¥' + amount.toLocaleString();
};

type AugmentsSectionProps = {
  act: any;
  chargenConstData: any;
  chargenState: any;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: any) => void;
  totalNuyen: number;
  value: any; // Total nuyen from resources priority
};

const AugmentsSection = (props: AugmentsSectionProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    value,
    totalNuyen,
  } = props;

  const essenceBase = 6.0;
  // selectedAugments is now: { [augmentId]: { id, grade } }
  const selectedAugments = chargenState?.augments || {};

  // Filter text for searching augments
  const [filterText, setFilterText] = useLocalState('sr_augment_filter', '');

  // Calculate essence cost from selected augments with grade multipliers
  const essenceCost = Object.entries(selectedAugments).reduce(
    (total, [augmentId, augmentData]: [string, any]) => {
      if (!augmentData) return total;
      const baseCost =
        chargenConstData?.augments?.[augmentId]?.essence_cost || 0;
      const grade = augmentData.grade || 'standard';
      const multiplier = AUGMENT_GRADES[grade]?.essenceMultiplier || 1.0;
      return total + baseCost * multiplier;
    },
    0,
  );

  // Calculate nuyen cost from selected augments with grade multipliers
  const nuyenCost = Object.entries(selectedAugments).reduce(
    (total, [augmentId, augmentData]: [string, any]) => {
      if (!augmentData) return total;
      const baseCost = chargenConstData?.augments?.[augmentId]?.nuyen_cost || 0;
      const grade = augmentData.grade || 'standard';
      const multiplier = AUGMENT_GRADES[grade]?.costMultiplier || 1.0;
      return total + baseCost * multiplier;
    },
    0,
  );

  const essenceRemaining = essenceBase - essenceCost;
  const nuyenRemaining = totalNuyen - nuyenCost;

  // Count selected augments
  const selectedCount = Object.keys(selectedAugments).length;

  // Get available augment categories from server data
  const augmentCategories = chargenConstData?.augment_categories || {
    cyberware: {
      name: 'Cyberware',
      icon: 'microchip',
      description:
        'Cybernetic augmentations that enhance the body with technology.',
    },
    bioware: {
      name: 'Bioware',
      icon: 'dna',
      description: 'Biological enhancements grown from organic materials.',
    },
    bodyparts: {
      name: 'Cyberlimbs',
      icon: 'hand',
      description: 'Replacement limbs with enhanced capabilities.',
    },
  };

  const [activeCategory, setActiveCategory] = useLocalState(
    'sr_augment_category',
    'cyberware',
  );

  // Get augments for the current category
  const categoryAugments: any[] =
    chargenConstData?.augments_by_category?.[activeCategory] || [];

  // Filter augments by search text
  const filteredAugments = categoryAugments.filter((aug) => {
    if (!filterText) return true;
    const search = filterText.toLowerCase();
    return (
      aug.name?.toLowerCase().includes(search) ||
      aug.description?.toLowerCase().includes(search) ||
      aug.slot?.toLowerCase().includes(search)
    );
  });

  const handleToggleAugment = (
    augmentId: string,
    grade: string = 'standard',
  ) => {
    if (isSaved) return;

    const newAugments = { ...selectedAugments };
    const isCurrentlySelected = !!newAugments[augmentId];

    if (isCurrentlySelected) {
      // Deselect
      delete newAugments[augmentId];
    } else {
      // Select with grade
      const augmentData = chargenConstData?.augments?.[augmentId];
      const baseEssence = augmentData?.essence_cost || 0;
      const baseNuyen = augmentData?.nuyen_cost || 0;
      const gradeData = AUGMENT_GRADES[grade];
      const essenceMultiplier = gradeData?.essenceMultiplier || 1.0;
      const costMultiplier = gradeData?.costMultiplier || 1.0;
      const newEssenceCost = baseEssence * essenceMultiplier;
      const newNuyenCost = baseNuyen * costMultiplier;

      if (essenceRemaining < newEssenceCost) {
        return; // Not enough essence
      }

      if (nuyenRemaining < newNuyenCost) {
        return; // Not enough nuyen
      }

      newAugments[augmentId] = { id: augmentId, grade };
    }

    const newState = {
      ...value,
      augments: newAugments,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleChangeGrade = (augmentId: string, newGrade: string) => {
    if (isSaved) return;
    if (!selectedAugments[augmentId]) return;

    const augmentData = chargenConstData?.augments?.[augmentId];
    const baseEssence = augmentData?.essence_cost || 0;
    const baseNuyen = augmentData?.nuyen_cost || 0;
    const oldGrade = selectedAugments[augmentId].grade || 'standard';
    const oldEssenceMultiplier =
      AUGMENT_GRADES[oldGrade]?.essenceMultiplier || 1.0;
    const newEssenceMultiplier =
      AUGMENT_GRADES[newGrade]?.essenceMultiplier || 1.0;
    const oldCostMultiplier = AUGMENT_GRADES[oldGrade]?.costMultiplier || 1.0;
    const newCostMultiplier = AUGMENT_GRADES[newGrade]?.costMultiplier || 1.0;
    const deltaEssence =
      baseEssence * (newEssenceMultiplier - oldEssenceMultiplier);
    const deltaNuyen = baseNuyen * (newCostMultiplier - oldCostMultiplier);

    if (essenceRemaining < deltaEssence) {
      return; // Not enough essence for upgrade
    }

    if (nuyenRemaining < deltaNuyen) {
      return; // Not enough nuyen for upgrade
    }

    const newAugments = {
      ...selectedAugments,
      [augmentId]: { id: augmentId, grade: newGrade },
    };

    const newState = {
      ...value,
      augments: newAugments,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleClearAll = () => {
    if (isSaved) return;

    const newState = {
      ...value,
      augments: {},
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__augmentsSection">
      {/* Essence and Nuyen Display */}
      <Stack fill mb={1}>
        {/* Essence Display */}
        <Stack.Item grow basis={0}>
          <Box
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 30, 0.5))',
              border: `2px solid ${essenceRemaining < 1 ? '#ff6b6b' : essenceRemaining < 3 ? '#ff9800' : '#9b8fc7'}`,
              borderRadius: '4px',
              padding: '1rem',
              height: '100%',
            }}
          >
            <Stack align="center">
              <Stack.Item>
                <Icon
                  name="heart"
                  size={1.8}
                  color={
                    essenceRemaining < 1
                      ? '#ff6b6b'
                      : essenceRemaining < 3
                        ? '#ff9800'
                        : '#9b8fc7'
                  }
                />
              </Stack.Item>
              <Stack.Item grow>
                <Box style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  Essence
                </Box>
                <Box style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                  Augmentations reduce Essence permanently.
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Stack vertical align="center">
                  <Stack.Item>
                    <Box
                      style={{
                        fontSize: '2.2rem',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        color:
                          essenceRemaining < 1
                            ? '#ff6b6b'
                            : essenceRemaining < 3
                              ? '#ff9800'
                              : '#9b8fc7',
                      }}
                    >
                      {essenceRemaining.toFixed(2)}
                    </Box>
                  </Stack.Item>
                  <Stack.Item>
                    <Box style={{ fontSize: '0.7rem', opacity: '0.5' }}>
                      of {essenceBase.toFixed(1)} ESS
                    </Box>
                  </Stack.Item>
                </Stack>
              </Stack.Item>
            </Stack>
          </Box>
        </Stack.Item>

        {/* Nuyen Display */}
        <Stack.Item grow basis={0} ml={1}>
          <Box
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 30, 0.5))',
              border: `2px solid ${nuyenRemaining < 1000 ? '#ff6b6b' : nuyenRemaining < totalNuyen * 0.25 ? '#ff9800' : '#ffd700'}`,
              borderRadius: '4px',
              padding: '1rem',
              height: '100%',
            }}
          >
            <Stack align="center">
              <Stack.Item>
                <Icon
                  name="yen-sign"
                  size={1.8}
                  color={
                    nuyenRemaining < 1000
                      ? '#ff6b6b'
                      : nuyenRemaining < totalNuyen * 0.25
                        ? '#ff9800'
                        : '#ffd700'
                  }
                />
              </Stack.Item>
              <Stack.Item grow>
                <Box style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  Nuyen
                </Box>
                <Box style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                  Resources remaining for purchases.
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Stack vertical align="center">
                  <Stack.Item>
                    <Box
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        color:
                          nuyenRemaining < 1000
                            ? '#ff6b6b'
                            : nuyenRemaining < totalNuyen * 0.25
                              ? '#ff9800'
                              : '#ffd700',
                      }}
                    >
                      {formatNuyen(nuyenRemaining)}
                    </Box>
                  </Stack.Item>
                  <Stack.Item>
                    <Box style={{ fontSize: '0.7rem', opacity: '0.5' }}>
                      of {formatNuyen(totalNuyen)}
                    </Box>
                  </Stack.Item>
                </Stack>
              </Stack.Item>
            </Stack>
          </Box>
        </Stack.Item>

        {/* Selected Count */}
        <Stack.Item ml={1}>
          <Box
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 30, 0.5))',
              border: '2px solid rgba(155, 143, 199, 0.5)',
              borderRadius: '4px',
              padding: '1rem',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box style={{ textAlign: 'center' }}>
              <Box style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {selectedCount}
              </Box>
              <Box style={{ fontSize: '0.7rem', opacity: '0.6' }}>Augments</Box>
            </Box>
          </Box>
        </Stack.Item>
      </Stack>

      {/* Controls Row */}
      <Stack align="center" mb={0.5}>
        <Stack.Item grow>
          <Input
            fluid
            placeholder="Search augments..."
            value={filterText}
            onChange={(_, v) => setFilterText(v)}
          />
        </Stack.Item>
        <Stack.Item ml={0.5}>
          <Button
            icon="times"
            disabled={!filterText}
            onClick={() => setFilterText('')}
          >
            Clear
          </Button>
        </Stack.Item>
        <Stack.Item ml={0.5}>
          <Button
            icon="trash"
            color="bad"
            disabled={isSaved || selectedCount === 0}
            onClick={handleClearAll}
            tooltip="Remove all selected augments"
          >
            Clear All
          </Button>
        </Stack.Item>
      </Stack>

      {/* Category Tabs */}
      <Tabs fluid>
        {Object.entries(augmentCategories).map(
          ([catId, catData]: [string, any]) => {
            // Count selected in this category
            const catCount = categoryAugments.filter(
              (aug) => selectedAugments[aug.id],
            ).length;
            return (
              <Tabs.Tab
                key={catId}
                icon={catData.icon}
                selected={activeCategory === catId}
                onClick={() => setActiveCategory(catId)}
              >
                {catData.name}
                {catCount > 0 && (
                  <Box
                    as="span"
                    ml={0.5}
                    style={{
                      background: 'rgba(155, 143, 199, 0.4)',
                      padding: '0 0.4rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {catCount}
                  </Box>
                )}
              </Tabs.Tab>
            );
          },
        )}
      </Tabs>

      {/* Category Description */}
      <Box
        style={{
          fontSize: '0.85rem',
          fontStyle: 'italic',
          opacity: '0.7',
          marginTop: '0.5rem',
          marginBottom: '0.75rem',
          paddingLeft: '0.5rem',
          borderLeft: '3px solid rgba(155, 143, 199, 0.5)',
        }}
      >
        {augmentCategories[activeCategory]?.description ||
          'Select augmentations for this category.'}
      </Box>

      {/* Grade Legend */}
      <Box
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          fontSize: '0.75rem',
        }}
      >
        {Object.entries(AUGMENT_GRADES).map(([gradeId, gradeData]) => (
          <Tooltip key={gradeId} content={gradeData.description}>
            <Box
              style={{
                padding: '0.2rem 0.5rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${gradeData.color}`,
                borderRadius: '3px',
                color: gradeData.color,
              }}
            >
              {gradeData.name} ({(gradeData.essenceMultiplier * 100).toFixed(0)}
              % ESS)
            </Box>
          </Tooltip>
        ))}
      </Box>

      {/* Augment List */}
      <Box
        style={{
          maxHeight: '28rem',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.15)',
          padding: '0.5rem',
          borderRadius: '4px',
        }}
      >
        {filteredAugments.length === 0 ? (
          <Box
            style={{
              textAlign: 'center',
              padding: '2rem',
              opacity: '0.6',
              fontStyle: 'italic',
            }}
          >
            <Icon name="info-circle" size={2} />
            <Box mt={1}>
              {categoryAugments.length === 0
                ? 'Augmentation options will be available once server data is loaded.'
                : 'No augments match your search.'}
            </Box>
          </Box>
        ) : (
          filteredAugments.map((augment: any) => {
            const isSelected = !!selectedAugments[augment.id];
            const currentGrade =
              selectedAugments[augment.id]?.grade || 'standard';
            const gradeData =
              AUGMENT_GRADES[currentGrade] || AUGMENT_GRADES.standard;
            const baseEssence = augment.essence_cost || 0;
            const baseNuyen = augment.nuyen_cost || 0;
            const effectiveEssence = baseEssence * gradeData.essenceMultiplier;
            const effectiveNuyen = baseNuyen * gradeData.costMultiplier;
            const canAffordEssence =
              essenceRemaining >= effectiveEssence || isSelected;
            const canAffordNuyen =
              nuyenRemaining >= effectiveNuyen || isSelected;
            const canAfford = canAffordEssence && canAffordNuyen;

            const tooltipText = isSelected
              ? 'Click to remove'
              : !canAffordEssence
                ? 'Not enough Essence'
                : !canAffordNuyen
                  ? 'Not enough Nuyen'
                  : 'Click to add';

            return (
              <Box
                key={augment.id}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: isSelected
                    ? 'rgba(155, 143, 199, 0.15)'
                    : 'rgba(0, 0, 0, 0.25)',
                  border: `1px solid ${isSelected ? gradeData.color : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '4px',
                  opacity: isSaved ? '0.6' : canAfford ? '1' : '0.5',
                }}
              >
                <Stack align="center">
                  {/* Selection Checkbox */}
                  <Stack.Item>
                    <Button
                      icon={isSelected ? 'check-square' : 'square'}
                      color={isSelected ? 'good' : 'transparent'}
                      disabled={isSaved || (!isSelected && !canAfford)}
                      onClick={() =>
                        handleToggleAugment(augment.id, currentGrade)
                      }
                      tooltip={tooltipText}
                    />
                  </Stack.Item>

                  {/* Augment Info */}
                  <Stack.Item grow>
                    <Box style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                      {augment.name}
                      {augment.slot && (
                        <Box
                          as="span"
                          ml={0.5}
                          style={{ fontSize: '0.75rem', opacity: '0.6' }}
                        >
                          [{augment.slot}]
                        </Box>
                      )}
                    </Box>
                    <Box style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                      {augment.description}
                    </Box>
                  </Stack.Item>

                  {/* Grade Selector (only when selected) */}
                  {isSelected && (
                    <Stack.Item>
                      <Dropdown
                        width="7rem"
                        disabled={isSaved}
                        selected={currentGrade}
                        options={Object.entries(AUGMENT_GRADES).map(
                          ([gId, gData]) => ({
                            value: gId,
                            displayText: gData.name,
                          }),
                        )}
                        onSelected={(val) => handleChangeGrade(augment.id, val)}
                      />
                    </Stack.Item>
                  )}

                  {/* Cost Display */}
                  <Stack.Item ml={0.5}>
                    <Stack vertical align="flex-end">
                      <Stack.Item>
                        <Tooltip
                          content={`Base: ${baseEssence.toFixed(2)} ESS × ${gradeData.name} (${(gradeData.essenceMultiplier * 100).toFixed(0)}%)`}
                        >
                          <Box
                            style={{
                              fontSize: '0.85rem',
                              color: isSelected ? gradeData.color : '#ff9800',
                              fontWeight: 'bold',
                              textAlign: 'right',
                            }}
                          >
                            -{effectiveEssence.toFixed(2)} ESS
                          </Box>
                        </Tooltip>
                      </Stack.Item>
                      <Stack.Item>
                        <Tooltip
                          content={`Base: ${formatNuyen(baseNuyen)} × ${gradeData.name} (${(gradeData.costMultiplier * 100).toFixed(0)}%)`}
                        >
                          <Box
                            style={{
                              fontSize: '0.75rem',
                              color: '#ffd700',
                              fontWeight: 'bold',
                              textAlign: 'right',
                            }}
                          >
                            {formatNuyen(effectiveNuyen)}
                          </Box>
                        </Tooltip>
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                </Stack>
              </Box>
            );
          })
        )}
      </Box>

      {/* Selected Augments Summary */}
      {selectedCount > 0 && (
        <Box
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(155, 143, 199, 0.1)',
            border: '1px solid rgba(155, 143, 199, 0.3)',
            borderRadius: '4px',
          }}
        >
          <Box
            style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <Icon name="list" mr={0.5} />
            Selected Augments ({selectedCount})
          </Box>
          <Box style={{ fontSize: '0.8rem' }}>
            {Object.entries(selectedAugments).map(
              ([augId, augData]: [string, any]) => {
                const augMeta = chargenConstData?.augments?.[augId];
                const grade =
                  AUGMENT_GRADES[augData.grade] || AUGMENT_GRADES.standard;
                const essenceCost =
                  (augMeta?.essence_cost || 0) * grade.essenceMultiplier;
                const nuyenCostItem =
                  (augMeta?.nuyen_cost || 0) * grade.costMultiplier;
                return (
                  <Stack key={augId} align="center" mb={0.25}>
                    <Stack.Item grow>
                      <Box as="span" style={{ color: grade.color }}>
                        [{grade.name}]
                      </Box>{' '}
                      {augMeta?.name || augId}
                    </Stack.Item>
                    <Stack.Item>
                      <Box style={{ color: '#ffd700', fontSize: '0.75rem' }}>
                        {formatNuyen(nuyenCostItem)}
                      </Box>
                    </Stack.Item>
                    <Stack.Item ml={0.5}>
                      <Box style={{ color: '#ff9800' }}>
                        -{essenceCost.toFixed(2)} ESS
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        icon="times"
                        color="transparent"
                        disabled={isSaved}
                        onClick={() => handleToggleAugment(augId)}
                        tooltip="Remove"
                      />
                    </Stack.Item>
                  </Stack>
                );
              },
            )}
          </Box>
        </Box>
      )}

      {/* Info Section */}
      <Box
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderLeft: '3px solid #ff9800',
          fontSize: '0.8rem',
          borderRadius: '0 4px 4px 0',
        }}
      >
        <Icon name="exclamation-triangle" color="#ff9800" mr={0.5} />
        <b>Note:</b> Augmentations reduce Essence. If Essence drops to 0, the
        character dies. Magic users lose 1 Magic for each full point of Essence
        lost. Higher grade augments cost more nuyen but use less Essence.
      </Box>
    </Box>
  );
};

// Wrapper component to fetch server data
export const ShadowrunPage = () => {
  return (
    <ServerPreferencesFetcher
      render={(serverData) => <ShadowrunPageInner serverData={serverData} />}
    />
  );
};

// Inner component that receives serverData
const ShadowrunPageInner = (props: { serverData: ServerData | undefined }) => {
  const { serverData } = props;
  const { act, data } = useBackend<PreferencesMenuData>();

  // Calculate karma balance from selected quirks
  const karmaBalance = useMemo(() => {
    const selectedQuirks = data.selected_quirks || [];
    const quirkInfo = (serverData?.quirks as any)?.quirks || {};
    let balance = 0;
    for (const quirkName of selectedQuirks) {
      const quirk = quirkInfo[quirkName];
      if (quirk && typeof quirk.value === 'number') {
        balance += quirk.value;
      }
    }
    return balance;
  }, [data.selected_quirks, serverData?.quirks]);

  // Extract chargen constant data from server preferences
  const chargenConstData = useMemo(() => {
    return (serverData?.['shadowrun_chargen'] as any) || null;
  }, [serverData]);

  const HintedLabel = (props: { hint?: string; text: string }) => {
    const { text, hint } = props;
    if (!hint) {
      return <Box as="span">{text}</Box>;
    }

    return (
      <Tooltip content={hint} position="bottom-start">
        <Box
          as="span"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'help',
          }}
        >
          {text}
        </Box>
      </Tooltip>
    );
  };

  const FIELD_HINTS: Record<string, string> = {
    Name: "Your runner's street name or legal alias. Use Alternate Names for additional identities.",
    Gender: 'Sets pronouns/body defaults where applicable.',
    Age: "Cosmetic: your runner's listed age.",
    SIN: 'Your System Identification Number (legit or forged). This is what Matrix records show.',
    Biometrics:
      'Physical characteristics: metatype features, skin/eyes/hair. These do not spend build points.',
    SINTab:
      'Your System Identification Number - the digital identity that defines who you are in the Sixth World. Configure name, personal data, and legal status.',
    JobsTab:
      'Select your assignment/role for the run. Determines your starting position and gear.',
    Religion:
      'Your spiritual beliefs or lack thereof. May affect roleplay interactions.',
    Birthplace: 'Where you were born or claim to be from on your SIN.',
    SINStatus:
      'Whether your SIN is legitimate, criminal, or forged. Affects how corps and law enforcement view you.',
  };

  // Defensive fallback: if server doesn't provide name_to_use, default to real_name
  const nameKey = data.name_to_use || 'real_name';
  const nameValue = data.character_preferences?.names?.[nameKey] || '';
  const nameLocked = !!data.name_locked;

  const [isEditingName, setIsEditingName] = useLocalState(
    `shadowrun_sheet_isEditingName_${data.active_slot}_${nameKey}`,
    false,
  );
  const [nameDraft, setNameDraft] = useLocalState(
    `shadowrun_sheet_nameDraft_${data.active_slot}_${nameKey}`,
    nameValue,
  );

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(nameValue);
    }
  }, [data.active_slot, nameKey, isEditingName, nameValue]);

  // BYOND focus/blur behavior can be inconsistent; ensure name edits reach the server
  // even if the user closes the window without "committing" the input.
  useEffect(() => {
    if (!isEditingName || nameLocked) {
      return;
    }

    const trimmedDraft = (nameDraft ?? '').trim();
    const trimmedServer = (nameValue ?? '').trim();
    if (!trimmedDraft || trimmedDraft === trimmedServer) {
      return;
    }

    const timeout = setTimeout(() => {
      act('set_preference', {
        preference: nameKey,
        value: trimmedDraft,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [act, nameKey, isEditingName, nameDraft, nameValue, nameLocked]);

  const [tab, setTab] = useLocalState<ShadowrunTab>(
    `shadowrun_sheet_tab_${data.active_slot}`,
    ShadowrunTab.Core,
  );

  const [multiNameInputOpen, setMultiNameInputOpen] = useLocalState(
    `shadowrun_sheet_multiNameInputOpen_${data.active_slot}`,
    false,
  );

  const prefMap = data.character_preferences?.secondary_features || {};
  const featureId = 'shadowrun_chargen';
  const feature = features[featureId];
  const serverValue = prefMap[featureId];

  // Use the same optimistic state key that FeatureValueInput uses
  // This ensures we see the same value as the chargen component
  const [predictedValue, setPredictedValue] = useLocalState<any>(
    `${featureId}_predictedValue_${data.active_slot}`,
    serverValue,
  );

  // Sync predictedValue with serverValue when server state changes
  // This ensures we pick up changes from the server (e.g., after save/load)
  useEffect(() => {
    // Only sync if server has a value and it's different from predicted
    if (serverValue !== undefined) {
      const serverSaved =
        serverValue &&
        typeof serverValue === 'object' &&
        (serverValue as any).saved;
      const predictedSaved =
        predictedValue &&
        typeof predictedValue === 'object' &&
        (predictedValue as any).saved;

      // If server says saved but we don't, sync to server
      // If server says not saved but we do (after reset on server), sync to server
      if (serverSaved !== predictedSaved) {
        setPredictedValue(serverValue);
      }
    }
  }, [serverValue]);

  // Use predictedValue if available, otherwise fall back to server value
  const value = predictedValue ?? serverValue;

  const isSaved = Boolean(
    value && typeof value === 'object' && (value as any).saved,
  );

  // Extract chargen state for dashboard and metatype selector
  const chargenState = useMemo(() => {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const v = value as any;
    return {
      priorities: v.priorities || {},
      attributes: v.attributes || {},
      skills: v.skills || {},
      skill_groups: v.skill_groups || {},
      special: v.special || {},
      awakening: v.awakening || 'mundane',
      metatype_species: v.metatype_species || '/datum/species/human',
      saved: v.saved || false,
      // Magic system
      tradition: v.tradition || '',
      selected_spells: v.selected_spells || [],
      selected_powers: v.selected_powers || {},
      selected_complex_forms: v.selected_complex_forms || [],
      // Knowledge system
      knowledge_skills: v.knowledge_skills || {},
      languages: v.languages || {},
      native_language: v.native_language || '',
      // Contacts system
      contacts: v.contacts || [],
      // SIN extended data
      sin_status: v.sin_status || 'legitimate',
      birthplace: v.birthplace || 'seattle',
      religion: v.religion || 'none',
      // Augments
      augments: v.augments || {},
      // Karma system
      karma_spent: v.karma_spent || 0,
      karma_purchases: v.karma_purchases || {},
    };
  }, [value]);

  // Calculate point totals for dashboard
  const dashboardData = useMemo(() => {
    if (!chargenState || !chargenConstData) {
      return null;
    }

    const priorityTables = chargenConstData.priority_tables;
    if (!priorityTables) {
      return null;
    }

    const priorities = chargenState.priorities;
    const attrLetter = priorities['attributes'] || 'E';
    const skillLetter = priorities['skills'] || 'E';
    const magicLetter = priorities['magic'] || 'E';
    const resourcesLetter = priorities['resources'] || 'E';
    const metatypeLetter = priorities['metatype'] || 'E';

    const totalAttrPoints = priorityTables.attributes?.[attrLetter] || 0;
    const totalSkillPoints = priorityTables.skills?.[skillLetter] || 0;
    const totalSpecialPoints =
      priorityTables.metatype_special?.[metatypeLetter] || 0;
    const resourcesAmount = priorityTables.resources?.[resourcesLetter] || 0;
    const magicRating = priorityTables.magic?.[magicLetter] || 0;

    // Calculate spent points
    const attributesMeta = chargenConstData.attributes || [];
    const metatypeBounds =
      chargenConstData.metatype_attribute_bounds?.[
        chargenState.metatype_species
      ] || {};

    const effectiveAttributesMeta = attributesMeta.map((a: any) => {
      const range = metatypeBounds[a.id];
      if (Array.isArray(range) && range.length >= 2) {
        return { ...a, min: range[0], max: range[1] };
      }
      return a;
    });

    const attrSpent = effectiveAttributesMeta.reduce((sum: number, a: any) => {
      const current = chargenState.attributes[a.id] ?? a.min;
      return sum + Math.max(0, current - a.min);
    }, 0);

    const skillSpent = Object.values(chargenState.skills || {}).reduce<number>(
      (sum, v) => sum + (Number(v) || 0),
      0,
    );

    const specialSpent = Object.values(
      chargenState.special || {},
    ).reduce<number>((sum, v) => sum + Math.max(0, Number(v) || 0), 0);

    return {
      attrRemaining: totalAttrPoints - attrSpent,
      attrTotal: totalAttrPoints,
      skillRemaining: totalSkillPoints - skillSpent,
      skillTotal: totalSkillPoints,
      specialRemaining: totalSpecialPoints - specialSpent,
      specialTotal: totalSpecialPoints,
      resources: resourcesAmount,
      magicRating,
      metatypeLetter,
      priorities,
      effectiveAttributesMeta,
    };
  }, [chargenState, chargenConstData]);

  // Calculate derived stats for display
  const derivedStats = useMemo(() => {
    if (!dashboardData || !chargenState) {
      return null;
    }

    const getAttrValue = (name: string) => {
      const meta = dashboardData.effectiveAttributesMeta.find(
        (a: any) =>
          a.name?.toLowerCase() === name.toLowerCase() ||
          a.id?.toLowerCase().includes(name.toLowerCase()),
      );
      if (!meta) {
        return 1;
      }
      return chargenState.attributes[meta.id] ?? meta.min ?? 1;
    };

    const body = getAttrValue('body');
    const agility = getAttrValue('agility');
    const reaction = getAttrValue('reaction');
    const strength = getAttrValue('strength');
    const willpower = getAttrValue('willpower');
    const logic = getAttrValue('logic');
    const intuition = getAttrValue('intuition');
    const charisma = getAttrValue('charisma');

    // SR5 Limits calculation (rounded up)
    const physicalLimit = Math.ceil((strength * 2 + body + reaction) / 3);
    const mentalLimit = Math.ceil((logic * 2 + intuition + willpower) / 3);
    const socialLimit = Math.ceil(
      (charisma * 2 +
        willpower +
        Math.floor(chargenState.special?.['/datum/rpg_stat/essence'] ?? 6)) /
        3,
    );

    // SR5 Condition Monitors
    const physicalCM = 8 + Math.ceil(body / 2);
    const stunCM = 8 + Math.ceil(willpower / 2);

    return {
      composure: charisma + willpower,
      judgeIntentions: charisma + intuition,
      memory: logic + willpower,
      liftCarry: strength + body,
      initiative: reaction + intuition,
      // Limits
      physicalLimit,
      mentalLimit,
      socialLimit,
      // Condition Monitors
      physicalCM,
      stunCM,
    };
  }, [dashboardData, chargenState]);

  // Calculate completion percentage
  const completionPercent = useMemo(() => {
    if (!dashboardData) {
      return 0;
    }

    let points = 0;

    // Attributes: give points for spending all
    if (dashboardData.attrTotal > 0) {
      const spent = dashboardData.attrTotal - dashboardData.attrRemaining;
      points += (spent / dashboardData.attrTotal) * 33;
    }

    // Skills: give points for spending all
    if (dashboardData.skillTotal > 0) {
      const spent = dashboardData.skillTotal - dashboardData.skillRemaining;
      points += (spent / dashboardData.skillTotal) * 33;
    }

    // Special: give points for spending all
    if (dashboardData.specialTotal > 0) {
      const spent = dashboardData.specialTotal - dashboardData.specialRemaining;
      points += (spent / dashboardData.specialTotal) * 20;
    }

    // Saved: bonus points
    if (isSaved) {
      points += 14;
    }

    return Math.min(100, Math.round(points));
  }, [dashboardData, isSaved]);

  // Check if allocation is invalid (overspent)
  const isAllocationInvalid = useMemo(() => {
    if (!dashboardData) return false;
    return (
      dashboardData.attrRemaining < 0 ||
      dashboardData.skillRemaining < 0 ||
      dashboardData.specialRemaining < 0
    );
  }, [dashboardData]);

  // Save sheet handler
  const onSaveSheet = () => {
    if (isSaved || isAllocationInvalid) return;

    const nextValue = {
      ...(value as object),
      saved: true,
    };

    setPredictedValue(nextValue);
    act('set_preference', {
      preference: featureId,
      value: nextValue,
    });
  };

  // Reset all handler
  const onResetAll = () => {
    const nextValue = {
      priorities: {},
      attributes: {},
      skills: {},
      skill_groups: {},
      special: {},
      awakening: 'mundane',
      metatype_species: '/datum/species/human',
      saved: false,
      knowledge_skills: {},
      languages: {},
      native_language: '',
      contacts: [],
      selected_spells: [],
      selected_powers: {},
      selected_complex_forms: [],
      augments: {},
      // SIN data
      sin_status: 'legitimate',
      birthplace: 'seattle',
      religion: 'none',
      // Karma tracking
      karma_spent: 0,
    };

    setPredictedValue(nextValue);
    act('set_preference', {
      preference: featureId,
      value: nextValue,
    });
  };

  const nonContextualPrefs = Object.fromEntries(
    Object.entries(data.character_preferences?.non_contextual || {}).filter(
      ([key]) => key !== 'random_body',
    ),
  );

  const allPrefs = {
    ...(data.character_preferences?.misc || {}),
    ...(data.character_preferences?.clothing || {}),
    ...(data.character_preferences?.features || {}),
    ...(data.character_preferences?.secondary_features || {}),
    ...nonContextualPrefs,
    ...(data.character_preferences?.supplemental_features || {}),
  } as Record<string, unknown>;

  const renderPreference = (preferenceId: string) => {
    if (preferenceId === 'random_body') {
      return null;
    }
    const feature = features[preferenceId];
    const prefValue = allPrefs[preferenceId];

    if (prefValue === undefined) {
      return null;
    }

    if (!feature) {
      return (
        <LabeledList.Item key={preferenceId} label={preferenceId}>
          <Box color="bad">Feature is not recognized.</Box>
        </LabeledList.Item>
      );
    }

    return (
      <LabeledList.Item key={preferenceId} label={feature.name}>
        <FeatureValueInput
          act={act}
          feature={feature}
          featureId={preferenceId}
          value={prefValue}
        />
      </LabeledList.Item>
    );
  };

  if (!feature) {
    return <Box>Feature {featureId} is not recognized.</Box>;
  }

  if (value === undefined) {
    return (
      <Box>
        Shadowrun character creation is not available for this character.
      </Box>
    );
  }

  return (
    <Box
      p={1}
      style={{
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(0, 255, 145, 0.25)',
        boxShadow: 'inset 0 0 0 1px rgba(0, 255, 145, 0.08)',
      }}
    >
      <Stack vertical fill>
        {multiNameInputOpen && (
          <MultiNameInput
            handleClose={() => setMultiNameInputOpen(false)}
            handleRandomizeName={(preference) =>
              act('randomize_name', {
                preference,
              })
            }
            handleUpdateName={(nameType, value) =>
              act('set_preference', {
                preference: nameType,
                value,
              })
            }
            names={data.character_preferences.names}
          />
        )}

        <Stack.Item>
          <Stack>
            <Stack.Item>
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '6px',
                }}
              >
                <CharacterPreview
                  height="320px"
                  id={data.character_preview_view}
                />
                <Dropdown
                  width="220px"
                  mt={0.5}
                  position="relative"
                  selected={data.preview_selection}
                  options={data.preview_options}
                  onSelected={(value) =>
                    act('update_preview', {
                      updated_preview: value,
                    })
                  }
                />

                {/* Priority Selector in left sidebar */}
                <PrioritySelector
                  chargenState={chargenState}
                  chargenConstData={chargenConstData}
                  isSaved={isSaved}
                  act={act}
                  featureId={featureId}
                  setPredictedValue={setPredictedValue}
                  value={value}
                />

                {/* Attribute Selector in left sidebar */}
                <AttributeSelector
                  chargenState={chargenState}
                  chargenConstData={chargenConstData}
                  isSaved={isSaved}
                  act={act}
                  featureId={featureId}
                  setPredictedValue={setPredictedValue}
                  value={value}
                />

                {/* Special Selector in left sidebar */}
                <SpecialSelector
                  chargenState={chargenState}
                  chargenConstData={chargenConstData}
                  isSaved={isSaved}
                  karmaBalance={karmaBalance}
                  act={act}
                  featureId={featureId}
                  setPredictedValue={setPredictedValue}
                  value={value}
                />

                {/* Magic Selector (traditions, spells, powers) */}
                <MagicSelector
                  chargenState={chargenState}
                  chargenConstData={chargenConstData}
                  isSaved={isSaved}
                  act={act}
                  featureId={featureId}
                  setPredictedValue={setPredictedValue}
                  value={value}
                />

                {/* Knowledge Skills Selector */}
                <KnowledgeSkillsSelector
                  chargenState={chargenState}
                  chargenConstData={chargenConstData}
                  isSaved={isSaved}
                  act={act}
                  featureId={featureId}
                  setPredictedValue={setPredictedValue}
                  value={value}
                />

                {/* Contacts Selector */}
                <ContactsSelector
                  chargenState={chargenState}
                  chargenConstData={chargenConstData}
                  isSaved={isSaved}
                  act={act}
                  featureId={featureId}
                  setPredictedValue={setPredictedValue}
                  value={value}
                />
              </Box>
            </Stack.Item>

            <Stack.Item grow>
              <Box
                className="PreferencesMenu__ShadowrunSheet"
                style={{
                  background: 'rgba(0, 0, 0, 0.15)',
                  padding: '8px',
                }}
              >
                <Stack vertical>
                  {/* Enhanced Header Banner */}
                  <Stack.Item>
                    <Box className="PreferencesMenu__ShadowrunSheet__header">
                      <Box className="PreferencesMenu__ShadowrunSheet__header__title">
                        RUNNER DOSSIER
                      </Box>
                      <Box className="PreferencesMenu__ShadowrunSheet__header__subtitle">
                        {nameDraft || 'Unknown Runner'}
                      </Box>
                      <Box className="PreferencesMenu__ShadowrunSheet__header__hint">
                        {isSaved ? (
                          <Box as="span" color="good">
                            <Icon name="check-circle" mr={0.5} />
                            Sheet saved and ready
                          </Box>
                        ) : (
                          'Configure your runner using the tabs below'
                        )}
                      </Box>
                    </Box>
                  </Stack.Item>

                  {/* Dashboard Tiles */}
                  {dashboardData && (
                    <Stack.Item>
                      <Box className="PreferencesMenu__ShadowrunSheet__dashboard">
                        <DashboardTile
                          icon="chart-bar"
                          label="Attributes"
                          value={dashboardData.attrRemaining}
                          subtext={`of ${dashboardData.attrTotal}`}
                          colorType="physical"
                          status={
                            dashboardData.attrRemaining < 0
                              ? 'bad'
                              : dashboardData.attrRemaining === 0
                                ? 'good'
                                : 'neutral'
                          }
                          tooltip={`${dashboardData.attrTotal - dashboardData.attrRemaining} spent, ${dashboardData.attrRemaining} remaining`}
                        />
                        <DashboardTile
                          icon="tasks"
                          label="Skills"
                          value={dashboardData.skillRemaining}
                          subtext={`of ${dashboardData.skillTotal}`}
                          colorType="mental"
                          status={
                            dashboardData.skillRemaining < 0
                              ? 'bad'
                              : dashboardData.skillRemaining === 0
                                ? 'good'
                                : 'neutral'
                          }
                          tooltip={`${dashboardData.skillTotal - dashboardData.skillRemaining} spent, ${dashboardData.skillRemaining} remaining`}
                        />
                        <DashboardTile
                          icon="star"
                          label="Special"
                          value={dashboardData.specialRemaining}
                          subtext={`of ${dashboardData.specialTotal}`}
                          colorType="special"
                          status={
                            dashboardData.specialRemaining < 0
                              ? 'bad'
                              : dashboardData.specialRemaining === 0
                                ? 'good'
                                : 'neutral'
                          }
                          tooltip={`${dashboardData.specialTotal - dashboardData.specialRemaining} spent, ${dashboardData.specialRemaining} remaining`}
                        />
                        <DashboardTile
                          icon="coins"
                          label="Resources"
                          value={`¥${dashboardData.resources}`}
                          colorType="resources"
                          tooltip="Starting nuyen from Resources priority"
                        />
                      </Box>

                      {/* Progress Bar */}
                      <Box mb={1}>
                        <Stack align="center">
                          <Stack.Item grow>
                            <ProgressBar value={completionPercent} max={100} />
                          </Stack.Item>
                          <Stack.Item ml={1}>
                            <Box
                              color={
                                completionPercent >= 80
                                  ? 'good'
                                  : completionPercent >= 40
                                    ? 'average'
                                    : 'grey'
                              }
                              bold
                            >
                              {completionPercent}%
                            </Box>
                          </Stack.Item>
                        </Stack>
                      </Box>
                    </Stack.Item>
                  )}

                  {/* Save/Reset Actions */}
                  <Stack.Item>
                    <Box
                      style={{
                        background: isSaved
                          ? 'linear-gradient(135deg, rgba(0, 80, 0, 0.3), rgba(0, 40, 0, 0.4))'
                          : 'linear-gradient(135deg, rgba(60, 50, 20, 0.3), rgba(40, 30, 10, 0.4))',
                        borderLeft: isSaved
                          ? '3px solid rgba(0, 255, 0, 0.6)'
                          : '3px solid rgba(202, 165, 61, 0.6)',
                        padding: '0.5rem 0.75rem',
                        marginBottom: '0.5rem',
                        borderRadius: '2px',
                      }}
                    >
                      <Stack align="center">
                        <Stack.Item grow>
                          <Box
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 'bold',
                              color: isSaved ? '#6bff6b' : '#caa53d',
                            }}
                          >
                            <Icon
                              name={isSaved ? 'check-circle' : 'edit'}
                              mr={0.5}
                            />
                            {isSaved ? 'Sheet Saved' : 'Editing Sheet'}
                          </Box>
                          <Box style={{ fontSize: '0.75rem', opacity: '0.7' }}>
                            {isSaved
                              ? 'Character locked. Reset All to make changes.'
                              : 'Allocate points, then save to lock your character.'}
                          </Box>
                        </Stack.Item>
                        <Stack.Item>
                          <Stack>
                            <Stack.Item>
                              <Button
                                color="bad"
                                icon="undo"
                                onClick={onResetAll}
                                tooltip="Reset all selections and unlock editing"
                              >
                                Reset All
                              </Button>
                            </Stack.Item>
                            <Stack.Item ml={0.5}>
                              {!isSaved ? (
                                <Button
                                  color="good"
                                  icon="save"
                                  disabled={isAllocationInvalid}
                                  onClick={onSaveSheet}
                                  tooltip={
                                    isAllocationInvalid
                                      ? 'Fix allocation errors (overspending) before saving'
                                      : 'Save and lock character sheet'
                                  }
                                >
                                  Save Sheet
                                </Button>
                              ) : (
                                <Button color="good" icon="check" disabled>
                                  Saved
                                </Button>
                              )}
                            </Stack.Item>
                          </Stack>
                        </Stack.Item>
                      </Stack>
                    </Box>
                  </Stack.Item>

                  {/* Tabs with Validation Badges */}
                  <Stack.Item>
                    <Tabs
                      fluid
                      className="PreferencesMenu__ShadowrunSheet__tabs"
                    >
                      <Tabs.Tab
                        icon="id-card"
                        selected={tab === ShadowrunTab.Core}
                        onClick={() => setTab(ShadowrunTab.Core)}
                      >
                        <HintedLabel text="SIN" hint={FIELD_HINTS.SINTab} />
                        {dashboardData && (
                          <ValidationBadge
                            status={
                              dashboardData.attrRemaining < 0 ||
                              dashboardData.skillRemaining < 0 ||
                              dashboardData.specialRemaining < 0
                                ? 'bad'
                                : isSaved
                                  ? 'good'
                                  : dashboardData.attrRemaining === 0 &&
                                      dashboardData.skillRemaining === 0
                                    ? 'warn'
                                    : 'none'
                            }
                          />
                        )}
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="microchip"
                        selected={tab === ShadowrunTab.Augments}
                        onClick={() => setTab(ShadowrunTab.Augments)}
                      >
                        Augments
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="id-badge"
                        selected={tab === ShadowrunTab.Occupations}
                        onClick={() => setTab(ShadowrunTab.Occupations)}
                      >
                        <HintedLabel text="Jobs" hint={FIELD_HINTS.JobsTab} />
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="star"
                        selected={tab === ShadowrunTab.Qualities}
                        onClick={() => setTab(ShadowrunTab.Qualities)}
                      >
                        <HintedLabel
                          text="Qualities"
                          hint="Positive and negative qualities that define your character's edges and flaws. Positive qualities cost karma, negative ones give karma."
                        />
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                    </Tabs>
                  </Stack.Item>

                  {/* Tab Content with Animation */}
                  <Box className="PreferencesMenu__ShadowrunSheet__tabContent">
                    {tab === ShadowrunTab.Core ? (
                      <>
                        {/* SIN Section - Collapsible */}
                        <CollapsibleSection
                          title="SIN (Identity)"
                          icon="id-card"
                          stateKey={`sr_sin_${data.active_slot}`}
                          defaultOpen
                        >
                          <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
                            <LabeledList>
                              <LabeledList.Item label="Name:">
                                <Box style={{ maxWidth: '28rem' }}>
                                  <Stack align="center">
                                    <Stack.Item grow>
                                      <Input
                                        placeholder="Enter name"
                                        value={nameDraft}
                                        disabled={nameLocked}
                                        onInput={(_, v) => {
                                          if (nameLocked) return;
                                          setIsEditingName(true);
                                          setNameDraft(v);
                                        }}
                                        onChange={(_, v) => {
                                          if (nameLocked) return;
                                          act('set_preference', {
                                            preference: nameKey,
                                            value: (v ?? '').trim(),
                                          });
                                          setIsEditingName(false);
                                        }}
                                      />
                                    </Stack.Item>
                                    <Stack.Item>
                                      <Button
                                        icon="id-card"
                                        tooltip={
                                          nameLocked
                                            ? 'Names locked during round'
                                            : 'Alternate names'
                                        }
                                        tooltipPosition="bottom"
                                        disabled={nameLocked}
                                        onClick={() =>
                                          setMultiNameInputOpen(true)
                                        }
                                      />
                                    </Stack.Item>
                                  </Stack>
                                </Box>
                              </LabeledList.Item>

                              <LabeledList.Item label="Gender:">
                                <Box style={{ maxWidth: '16rem' }}>
                                  <Dropdown
                                    width="100%"
                                    selected={
                                      data.character_preferences.misc.gender
                                    }
                                    displayText={
                                      GENDERS[
                                        (data.character_preferences.misc
                                          .gender as Gender) || Gender.Male
                                      ]?.text || 'Gender'
                                    }
                                    options={Object.entries(GENDERS).map(
                                      ([value, { text }]) => ({
                                        value,
                                        displayText: text,
                                      }),
                                    )}
                                    onSelected={createSetPreference(
                                      act,
                                      'gender',
                                    )}
                                  />
                                </Box>
                              </LabeledList.Item>

                              {renderPreference('employer')}

                              {renderPreference('age')}

                              {renderPreference('dominant_hand')}
                            </LabeledList>
                          </Box>

                          {/* Extended SIN Information */}
                          <Box
                            style={{
                              marginTop: '1rem',
                              paddingTop: '0.75rem',
                              borderTop: '1px solid rgba(155, 143, 199, 0.25)',
                            }}
                          >
                            <Box
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                color: '#9b8fc7',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <Icon name="file-alt" mr={0.5} />
                              Extended SIN Data
                            </Box>
                            <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
                              <LabeledList>
                                <LabeledList.Item label="SIN Status:">
                                  <Box style={{ maxWidth: '16rem' }}>
                                    <Tooltip
                                      content={FIELD_HINTS.SINStatus}
                                      position="bottom"
                                    >
                                      <Dropdown
                                        width="100%"
                                        disabled={isSaved}
                                        selected={
                                          chargenState?.sin_status ||
                                          'legitimate'
                                        }
                                        options={[
                                          {
                                            value: 'legitimate',
                                            displayText: 'Legitimate SIN',
                                          },
                                          {
                                            value: 'criminal',
                                            displayText: 'Criminal SIN',
                                          },
                                          {
                                            value: 'corporate',
                                            displayText: 'Corporate SIN',
                                          },
                                          {
                                            value: 'sinless',
                                            displayText: 'SINless',
                                          },
                                          {
                                            value: 'fake_low',
                                            displayText:
                                              'Fake SIN (Rating 1-2)',
                                          },
                                          {
                                            value: 'fake_mid',
                                            displayText:
                                              'Fake SIN (Rating 3-4)',
                                          },
                                          {
                                            value: 'fake_high',
                                            displayText:
                                              'Fake SIN (Rating 5-6)',
                                          },
                                        ]}
                                        onSelected={(val) => {
                                          if (isSaved) return;
                                          const newState = {
                                            ...value,
                                            sin_status: val,
                                          };
                                          setPredictedValue(newState);
                                          act('set_preference', {
                                            preference: featureId,
                                            value: newState,
                                          });
                                        }}
                                      />
                                    </Tooltip>
                                  </Box>
                                </LabeledList.Item>

                                <LabeledList.Item label="Birthplace:">
                                  <Box style={{ maxWidth: '16rem' }}>
                                    <Tooltip
                                      content={FIELD_HINTS.Birthplace}
                                      position="bottom"
                                    >
                                      <Dropdown
                                        width="100%"
                                        disabled={isSaved}
                                        selected={
                                          chargenState?.birthplace || 'seattle'
                                        }
                                        options={[
                                          {
                                            value: 'seattle',
                                            displayText: 'Seattle Metroplex',
                                          },
                                          {
                                            value: 'ucas',
                                            displayText: 'UCAS (Other)',
                                          },
                                          {
                                            value: 'cas',
                                            displayText:
                                              'Confederation of American States',
                                          },
                                          {
                                            value: 'native_nations',
                                            displayText:
                                              'Native American Nations',
                                          },
                                          {
                                            value: 'aztlan',
                                            displayText: 'Aztlan',
                                          },
                                          {
                                            value: 'tir',
                                            displayText:
                                              'Tír Tairngire / Tír na nÓg',
                                          },
                                          {
                                            value: 'japan',
                                            displayText: 'Japan',
                                          },
                                          {
                                            value: 'europe',
                                            displayText: 'European Nations',
                                          },
                                          {
                                            value: 'other',
                                            displayText: 'Other / Unknown',
                                          },
                                        ]}
                                        onSelected={(val) => {
                                          if (isSaved) return;
                                          const newState = {
                                            ...value,
                                            birthplace: val,
                                          };
                                          setPredictedValue(newState);
                                          act('set_preference', {
                                            preference: featureId,
                                            value: newState,
                                          });
                                        }}
                                      />
                                    </Tooltip>
                                  </Box>
                                </LabeledList.Item>

                                <LabeledList.Item label="Religion:">
                                  <Box style={{ maxWidth: '16rem' }}>
                                    <Tooltip
                                      content={FIELD_HINTS.Religion}
                                      position="bottom"
                                    >
                                      <Dropdown
                                        width="100%"
                                        disabled={isSaved}
                                        selected={
                                          chargenState?.religion || 'none'
                                        }
                                        options={[
                                          {
                                            value: 'none',
                                            displayText: 'None / Atheist',
                                          },
                                          {
                                            value: 'christian',
                                            displayText: 'Christianity',
                                          },
                                          {
                                            value: 'islam',
                                            displayText: 'Islam',
                                          },
                                          {
                                            value: 'buddhist',
                                            displayText: 'Buddhism',
                                          },
                                          {
                                            value: 'hindu',
                                            displayText: 'Hinduism',
                                          },
                                          {
                                            value: 'shinto',
                                            displayText: 'Shinto',
                                          },
                                          {
                                            value: 'jewish',
                                            displayText: 'Judaism',
                                          },
                                          {
                                            value: 'neo_pagan',
                                            displayText: 'Neo-Paganism',
                                          },
                                          {
                                            value: 'shamanic',
                                            displayText: 'Shamanic Tradition',
                                          },
                                          {
                                            value: 'hermetic',
                                            displayText: 'Hermetic Philosophy',
                                          },
                                          {
                                            value: 'druidic',
                                            displayText: 'Druidism',
                                          },
                                          {
                                            value: 'aztec',
                                            displayText: 'Aztec Tradition',
                                          },
                                          {
                                            value: 'other',
                                            displayText: 'Other',
                                          },
                                        ]}
                                        onSelected={(val) => {
                                          if (isSaved) return;
                                          const newState = {
                                            ...value,
                                            religion: val,
                                          };
                                          setPredictedValue(newState);
                                          act('set_preference', {
                                            preference: featureId,
                                            value: newState,
                                          });
                                        }}
                                      />
                                    </Tooltip>
                                  </Box>
                                </LabeledList.Item>
                              </LabeledList>
                            </Box>
                          </Box>
                        </CollapsibleSection>

                        {/* Biometrics Section with Metatype - Collapsible */}
                        <CollapsibleSection
                          title="Biometrics & Metatype"
                          icon="dna"
                          stateKey={`sr_bio_${data.active_slot}`}
                          defaultOpen
                        >
                          {/* Metatype Selector */}
                          <MetatypeSelector
                            chargenState={chargenState}
                            chargenConstData={chargenConstData}
                            dashboardData={dashboardData}
                            isSaved={isSaved}
                            act={act}
                            featureId={featureId}
                            setPredictedValue={setPredictedValue}
                            value={value}
                          />

                          {/* Two-column Biometrics Grid */}
                          <Box className="PreferencesMenu__ShadowrunSheet__biometricsGrid">
                            <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn">
                              <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn__title">
                                <Icon name="palette" mr={0.5} />
                                Physical Appearance
                              </Box>
                              <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
                                <LabeledList>
                                  {renderPreference('skin_tone')}
                                  {renderPreference('eye_color')}
                                  {renderPreference('heterochromatic')}
                                  {renderPreference('sclera_color')}
                                </LabeledList>
                              </Box>
                            </Box>

                            <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn">
                              <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn__title">
                                <Icon name="cut" mr={0.5} />
                                Hair Styles
                              </Box>
                              <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
                                <LabeledList>
                                  {renderPreference('hairstyle_name')}
                                  {renderPreference('hair_color')}
                                  {renderPreference('hair_gradient')}
                                  {renderPreference('hair_gradient_color')}
                                </LabeledList>
                              </Box>
                            </Box>

                            <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn">
                              <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn__title">
                                <Icon name="user" mr={0.5} />
                                Facial Hair
                              </Box>
                              <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
                                <LabeledList>
                                  {renderPreference('facial_style_name')}
                                  {renderPreference('facial_hair_color')}
                                  {renderPreference('facial_hair_gradient')}
                                  {renderPreference(
                                    'facial_hair_gradient_color',
                                  )}
                                </LabeledList>
                              </Box>
                            </Box>

                            <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn">
                              <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn__title">
                                <Icon name="tshirt" mr={0.5} />
                                Undergarments
                              </Box>
                              <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
                                <LabeledList>
                                  {renderPreference('underwear')}
                                  {renderPreference('underwear_color')}
                                  {renderPreference('undershirt')}
                                  {renderPreference('socks')}
                                </LabeledList>
                              </Box>
                            </Box>
                          </Box>
                        </CollapsibleSection>

                        {/* Derived Stats Panel */}
                        {derivedStats && (
                          <Box className="PreferencesMenu__ShadowrunSheet__derivedStats">
                            <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__title">
                              <Icon name="calculator" mr={0.5} />
                              Derived Statistics
                            </Box>
                            <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__grid">
                              <Tooltip
                                content="Charisma + Willpower: Staying calm under pressure"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Composure
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.composure}
                                  </Box>
                                </Box>
                              </Tooltip>
                              <Tooltip
                                content="Charisma + Intuition: Reading people's intentions"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Judge Intentions
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.judgeIntentions}
                                  </Box>
                                </Box>
                              </Tooltip>
                              <Tooltip
                                content="Logic + Willpower: Recalling information"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Memory
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.memory}
                                  </Box>
                                </Box>
                              </Tooltip>
                              <Tooltip
                                content="Strength + Body: Physical carrying capacity"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Lift/Carry
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.liftCarry}
                                  </Box>
                                </Box>
                              </Tooltip>
                              <Tooltip
                                content="Reaction + Intuition: Acting first in combat"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Initiative
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.initiative}
                                  </Box>
                                </Box>
                              </Tooltip>
                            </Box>
                            {/* Limits Section */}
                            <Box
                              className="PreferencesMenu__ShadowrunSheet__derivedStats__title"
                              mt={1}
                            >
                              <Icon name="shield-alt" mr={0.5} />
                              Limits
                            </Box>
                            <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__grid">
                              <Tooltip
                                content="(STR×2 + BOD + REA) ÷ 3: Max hits on physical tests"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Physical
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.physicalLimit}
                                  </Box>
                                </Box>
                              </Tooltip>
                              <Tooltip
                                content="(LOG×2 + INT + WIL) ÷ 3: Max hits on mental tests"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Mental
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.mentalLimit}
                                  </Box>
                                </Box>
                              </Tooltip>
                              <Tooltip
                                content="(CHA×2 + WIL + ESS) ÷ 3: Max hits on social tests"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Social
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.socialLimit}
                                  </Box>
                                </Box>
                              </Tooltip>
                            </Box>
                            {/* Condition Monitors Section */}
                            <Box
                              className="PreferencesMenu__ShadowrunSheet__derivedStats__title"
                              mt={1}
                            >
                              <Icon name="heart" mr={0.5} />
                              Condition Monitors
                            </Box>
                            <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__grid">
                              <Tooltip
                                content="8 + (BOD ÷ 2): Physical damage boxes"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Physical CM
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.physicalCM}
                                  </Box>
                                </Box>
                              </Tooltip>
                              <Tooltip
                                content="8 + (WIL ÷ 2): Stun damage boxes"
                                position="bottom"
                              >
                                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                                    Stun CM
                                  </Box>
                                  <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                                    {derivedStats.stunCM}
                                  </Box>
                                </Box>
                              </Tooltip>
                            </Box>
                          </Box>
                        )}

                        {/* Skills Section - Integrated into main sheet */}
                        <SkillsSection
                          chargenState={chargenState}
                          chargenConstData={chargenConstData}
                          isSaved={isSaved}
                          act={act}
                          featureId={featureId}
                          setPredictedValue={setPredictedValue}
                          value={value}
                        />
                      </>
                    ) : null}
                    {tab === ShadowrunTab.Augments ? (
                      <Box className="PreferencesMenu__ShadowrunSheet__augmentsContent">
                        <AugmentsSection
                          chargenState={chargenState}
                          chargenConstData={chargenConstData}
                          isSaved={isSaved}
                          act={act}
                          featureId={featureId}
                          setPredictedValue={setPredictedValue}
                          value={value}
                          totalNuyen={dashboardData?.resources || 0}
                        />
                      </Box>
                    ) : null}
                    {tab === ShadowrunTab.Occupations ? (
                      <Box className="PreferencesMenu__ShadowrunSheet__jobsContent">
                        <JobsPage />
                      </Box>
                    ) : null}
                    {tab === ShadowrunTab.Qualities ? (
                      <Box className="PreferencesMenu__ShadowrunSheet__qualitiesContent">
                        <QuirksPage />
                      </Box>
                    ) : null}
                  </Box>
                </Stack>
              </Box>
            </Stack.Item>
          </Stack>
        </Stack.Item>
      </Stack>
    </Box>
  );
};
