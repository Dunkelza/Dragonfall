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
import { ServerPreferencesFetcher } from './ServerPreferencesFetcher';

enum ShadowrunTab {
  Core = 'core',
  Occupations = 'occupations',
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
    const newPriorities = { ...priorities, [category]: newLetter };
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
                  options={priorityLetters.map((l) => ({
                    value: l,
                    displayText: l,
                  }))}
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
  setPredictedValue: (value: any) => void;
  value: any;
};

const SpecialSelector = (props: SpecialSelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
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
  const edgeBase = 1; // Edge always starts at 1

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
    ShadowrunTab:
      'Configure your priority selection, attributes, skills, and awakened abilities. Must save before deploying.',
    JobsTab:
      'Select your assignment/role for the run. Determines your starting position and gear.',
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
  const [predictedValue, setPredictedValue] = useLocalState(
    `${featureId}_predictedValue_${data.active_slot}`,
    serverValue,
  );

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

    return {
      composure: charisma + willpower,
      judgeIntentions: charisma + intuition,
      memory: logic + willpower,
      liftCarry: strength + body,
      initiative: reaction + intuition,
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

                  {/* Tabs with Validation Badges */}
                  <Stack.Item>
                    <Tabs
                      fluid
                      className="PreferencesMenu__ShadowrunSheet__tabs"
                    >
                      <Tabs.Tab
                        icon="clipboard"
                        selected={tab === ShadowrunTab.Core}
                        onClick={() => setTab(ShadowrunTab.Core)}
                      >
                        <HintedLabel
                          text="Shadowrun"
                          hint={FIELD_HINTS.ShadowrunTab}
                        />
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
                        icon="id-badge"
                        selected={tab === ShadowrunTab.Occupations}
                        onClick={() => setTab(ShadowrunTab.Occupations)}
                      >
                        <HintedLabel text="Jobs" hint={FIELD_HINTS.JobsTab} />
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
                            </LabeledList>
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
                          </Box>
                        )}
                      </>
                    ) : null}
                    {tab === ShadowrunTab.Occupations ? (
                      <Box className="PreferencesMenu__ShadowrunSheet__jobsContent">
                        <JobsPage />
                      </Box>
                    ) : null}
                  </Box>
                </Stack>
              </Box>
            </Stack.Item>
          </Stack>
        </Stack.Item>

        <Stack.Item>
          {tab === ShadowrunTab.Core ? (
            <Box mt={1}>
              <FeatureValueInput
                act={act}
                feature={feature}
                featureId={featureId}
                value={value}
              />
            </Box>
          ) : null}
        </Stack.Item>
      </Stack>
    </Box>
  );
};
