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

    // Update the chargen state
    const newState = {
      ...value,
      metatype_species: newSpecies,
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
      <LabeledList.Item
        key={preferenceId}
        label={
          <HintedLabel
            text={feature.name}
            hint={`Preference: ${feature.name}`}
          />
        }
      >
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
                              <LabeledList.Item
                                label={
                                  <HintedLabel
                                    text="Name:"
                                    hint={FIELD_HINTS.Name}
                                  />
                                }
                              >
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

                              <LabeledList.Item
                                label={
                                  <HintedLabel
                                    text="Gender:"
                                    hint={FIELD_HINTS.Gender}
                                  />
                                }
                              >
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
                                    tooltip={FIELD_HINTS.Gender}
                                    tooltipPosition="bottom"
                                    onSelected={createSetPreference(
                                      act,
                                      'gender',
                                    )}
                                  />
                                </Box>
                              </LabeledList.Item>

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
                          {/* Metatype Selector - Moved here from chargen */}
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

          {tab === ShadowrunTab.Occupations ? (
            isSaved ? (
              <Box color="good" p={1}>
                <Icon name="lock" mr={0.5} />
                Sheet saved. Job selection is locked until you use Reset All in
                the Shadowrun tab.
              </Box>
            ) : (
              <JobsPage />
            )
          ) : null}
        </Stack.Item>
      </Stack>
    </Box>
  );
};
