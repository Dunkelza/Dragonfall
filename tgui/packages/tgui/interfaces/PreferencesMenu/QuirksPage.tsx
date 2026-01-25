import { useEffect } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useBackend, useLocalState } from '../../backend';
import {
  Box,
  Button,
  Icon,
  Input,
  ProgressBar,
  Stack,
  Tabs,
} from '../../components';
import { PreferencesMenuData, Quirk } from './data';
import { ServerPreferencesFetcher } from './ServerPreferencesFetcher';

// SR5 limits karma gained from negative qualities
const MAX_KARMA_FROM_NEGATIVES = 25;

// Quality card component with cyberpunk styling
const QualityCard = (props: {
  disabled?: boolean;
  isSelected: boolean;
  onClick: () => void;
  quality: Quirk & { failTooltip?: string };
  qualityKey: string;
}) => {
  const { quality, qualityKey, isSelected, onClick, disabled } = props;
  // Server sends: negative values = positive qualities (cost karma), positive values = negative qualities (give karma)
  const isPositive = quality.value < 0;
  const isNegative = quality.value > 0;

  const borderColor = isSelected
    ? isPositive
      ? '#4caf50'
      : isNegative
        ? '#f44336'
        : '#9b8fc7'
    : 'rgba(255, 255, 255, 0.1)';

  const valueColor = isPositive ? '#4caf50' : isNegative ? '#f44336' : '#888';

  const card = (
    <Box
      style={{
        padding: '0.75rem',
        marginBottom: '0.5rem',
        background: isSelected
          ? `rgba(${isPositive ? '76, 175, 80' : isNegative ? '244, 67, 54' : '155, 143, 199'}, 0.15)`
          : 'rgba(0, 0, 0, 0.25)',
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !isSelected ? '0.5' : '1',
        transition: 'all 0.2s ease',
      }}
      onClick={disabled ? undefined : onClick}
    >
      <Stack align="center">
        {/* Icon */}
        <Stack.Item>
          <Box
            style={{
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
            }}
          >
            <Icon
              name={quality.icon || 'question'}
              size={1.5}
              color={isSelected ? borderColor : '#888'}
            />
          </Box>
        </Stack.Item>

        {/* Name and Description */}
        <Stack.Item grow ml={0.75}>
          <Box style={{ fontSize: '0.95rem', fontWeight: '600' }}>
            {quality.name}
          </Box>
          <Box
            style={{
              fontSize: '0.8rem',
              opacity: '0.7',
              maxHeight: '2.4em',
              overflow: 'hidden',
            }}
          >
            {quality.description}
          </Box>
        </Stack.Item>

        {/* Karma Value */}
        <Stack.Item>
          <Box
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: valueColor,
              minWidth: '3rem',
              textAlign: 'right',
            }}
          >
            {quality.value > 0 ? '-' : '+'}
            {Math.abs(quality.value)}
          </Box>
        </Stack.Item>

        {/* Selection indicator */}
        <Stack.Item ml={0.5}>
          <Icon
            name={isSelected ? 'check-circle' : 'circle'}
            size={1.2}
            color={isSelected ? borderColor : 'rgba(255, 255, 255, 0.3)'}
          />
        </Stack.Item>
      </Stack>
    </Box>
  );

  if (quality.failTooltip) {
    return (
      <Tooltip key={qualityKey} content={quality.failTooltip}>
        {card}
      </Tooltip>
    );
  }

  return card;
};

// Karma display panel
const KarmaPanel = (props: {
  karmaBalance: number;
  karmaFromNegatives: number;
  karmaFromPositives: number;
  maxNegatives: number;
}) => {
  const { karmaBalance, karmaFromPositives, karmaFromNegatives, maxNegatives } =
    props;

  return (
    <Box
      style={{
        background:
          'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 30, 0.5))',
        border: `2px solid ${karmaBalance >= 0 ? '#9b8fc7' : '#f44336'}`,
        borderRadius: '4px',
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <Stack fill>
        {/* Karma Balance */}
        <Stack.Item grow basis={0}>
          <Stack align="center">
            <Stack.Item>
              <Icon name="yin-yang" size={1.8} color="#9b8fc7" />
            </Stack.Item>
            <Stack.Item grow ml={0.75}>
              <Box style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                Karma Balance
              </Box>
              <Box style={{ fontSize: '0.75rem', opacity: '0.7' }}>
                Available for spending
              </Box>
            </Stack.Item>
            <Stack.Item>
              <Box
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color:
                    karmaBalance > 0
                      ? '#4caf50'
                      : karmaBalance < 0
                        ? '#f44336'
                        : '#9b8fc7',
                }}
              >
                {karmaBalance >= 0 ? '+' : ''}
                {karmaBalance}
              </Box>
            </Stack.Item>
          </Stack>
        </Stack.Item>

        {/* Divider */}
        <Stack.Item>
          <Box
            style={{
              width: '1px',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.2)',
              margin: '0 1rem',
            }}
          />
        </Stack.Item>

        {/* Negative Karma Limit */}
        <Stack.Item grow basis={0}>
          <Box style={{ marginBottom: '0.5rem' }}>
            <Stack align="center">
              <Stack.Item grow>
                <Box style={{ fontSize: '0.85rem', opacity: '0.8' }}>
                  <Icon name="minus-circle" color="#f44336" mr={0.5} />
                  Karma from Negatives
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Box
                  style={{
                    fontWeight: 'bold',
                    color:
                      karmaFromNegatives >= maxNegatives
                        ? '#f44336'
                        : '#4caf50',
                  }}
                >
                  {karmaFromNegatives} / {maxNegatives}
                </Box>
              </Stack.Item>
            </Stack>
          </Box>
          <ProgressBar
            value={karmaFromNegatives / maxNegatives}
            color={
              karmaFromNegatives >= maxNegatives
                ? 'bad'
                : karmaFromNegatives >= maxNegatives * 0.8
                  ? 'average'
                  : 'good'
            }
          />
          {karmaFromNegatives > maxNegatives && (
            <Box
              style={{
                fontSize: '0.7rem',
                color: '#f44336',
                marginTop: '0.25rem',
              }}
            >
              <Icon name="exclamation-triangle" mr={0.25} />
              Excess karma not counted!
            </Box>
          )}
        </Stack.Item>

        {/* Divider */}
        <Stack.Item>
          <Box
            style={{
              width: '1px',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.2)',
              margin: '0 1rem',
            }}
          />
        </Stack.Item>

        {/* Positive Karma Spent */}
        <Stack.Item grow basis={0}>
          <Stack align="center">
            <Stack.Item grow>
              <Box style={{ fontSize: '0.85rem', opacity: '0.8' }}>
                <Icon name="plus-circle" color="#4caf50" mr={0.5} />
                Karma Spent on Positives
              </Box>
            </Stack.Item>
            <Stack.Item>
              <Box
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#4caf50',
                }}
              >
                {karmaFromPositives}
              </Box>
            </Stack.Item>
          </Stack>
        </Stack.Item>
      </Stack>
    </Box>
  );
};

// Props for chargen context (metatype and awakening status)
type QuirksPageProps = {
  awakening?: string;
  metatype?: string;
};

export const QuirksPage = (props: QuirksPageProps = {}) => {
  const { act, data } = useBackend<PreferencesMenuData>();

  // Get chargen context from props or from preferences data
  const chargenState =
    (data.character_preferences?.secondary_features?.[
      'shadowrun_chargen'
    ] as any) || {};
  const metatype = props.metatype || chargenState.metatype_species || '';
  const awakening = props.awakening || chargenState.awakening || 'mundane';

  const [selectedQuirks, setSelectedQuirks] = useLocalState(
    `selectedQuirks_${data.active_slot}`,
    data.selected_quirks,
  );
  // Sync local state with server data when it changes (e.g., on sheet reopen)
  useEffect(() => {
    const serverQuirks = data.selected_quirks || [];
    const localQuirks = selectedQuirks || [];

    // Only sync if the server data differs from local state
    // This prevents overwriting optimistic updates while allowing
    // proper sync on sheet open/reopen
    const serverSet = new Set(serverQuirks);
    const localSet = new Set(localQuirks);

    const serverHasExtra = serverQuirks.some((q) => !localSet.has(q));
    const localHasExtra = localQuirks.some((q) => !serverSet.has(q));

    if (serverHasExtra || localHasExtra) {
      // Server has different data than our local state, sync to server
      setSelectedQuirks(serverQuirks);
    }
  }, [data.selected_quirks]);

  const [filterText, setFilterText] = useLocalState('sr_quality_filter', '');
  const [activeTab, setActiveTab] = useLocalState<
    'all' | 'positive' | 'negative'
  >('sr_quality_tab', 'all');

  return (
    <ServerPreferencesFetcher
      render={(serverData) => {
        if (!serverData) {
          return (
            <Box
              style={{
                padding: '2rem',
                textAlign: 'center',
                opacity: '0.6',
              }}
            >
              <Icon name="spinner" spin size={2} />
              <Box mt={1}>Loading qualities...</Box>
            </Box>
          );
        }

        if (!serverData.quirks) {
          return (
            <Box
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#f44336',
              }}
            >
              <Icon name="exclamation-triangle" size={2} />
              <Box mt={1}>
                Missing quirks data. Check server preference middleware.
              </Box>
            </Box>
          );
        }

        const { quirk_blacklist: quirkBlacklist, quirk_info: quirkInfo } =
          serverData.quirks;

        // Sort qualities by value (positive qualities first - they have negative values)
        const allQualities = Object.entries(quirkInfo);
        allQualities.sort(([_, a], [__, b]) => {
          if (a.value === b.value) {
            return a.name > b.name ? 1 : -1;
          }
          return a.value - b.value; // Ascending: negative values (positive qualities) first
        });

        // Filter by search and tab
        const filteredQualities = allQualities.filter(([key, quality]) => {
          // Search filter
          if (filterText) {
            const search = filterText.toLowerCase();
            if (
              !quality.name.toLowerCase().includes(search) &&
              !quality.description.toLowerCase().includes(search)
            ) {
              return false;
            }
          }

          // Tab filter (server sends negative values for positive qualities, positive for negative)
          if (activeTab === 'positive' && quality.value >= 0) return false;
          if (activeTab === 'negative' && quality.value <= 0) return false;

          return true;
        });

        // Calculate karma (server: negative value = costs karma, positive value = gives karma)
        let karmaFromPositives = 0;
        let karmaFromNegatives = 0;

        for (const selectedQuirkName of selectedQuirks) {
          const selectedQuirk = quirkInfo[selectedQuirkName];
          if (!selectedQuirk) continue;

          if (selectedQuirk.value < 0) {
            // Positive qualities cost karma (have negative values)
            karmaFromPositives += Math.abs(selectedQuirk.value);
          } else if (selectedQuirk.value > 0) {
            // Negative qualities give karma (have positive values)
            karmaFromNegatives += selectedQuirk.value;
          }
        }

        const effectiveNegatives = Math.min(
          karmaFromNegatives,
          MAX_KARMA_FROM_NEGATIVES,
        );
        const karmaBalance = effectiveNegatives - karmaFromPositives;

        // Validation functions
        const getReasonToNotAdd = (quirkName: string) => {
          const quirk = quirkInfo[quirkName] as any;
          if (!quirk) return 'Unknown quality.';

          // Check prerequisites (SR5 quality requirements)
          const prereqs = quirk.prerequisites || {};

          // Check allowed metatypes
          if (
            prereqs.allowed_metatypes &&
            prereqs.allowed_metatypes.length > 0
          ) {
            if (!prereqs.allowed_metatypes.includes(metatype)) {
              return 'Requires a specific metatype.';
            }
          }

          // Check forbidden metatypes
          if (
            prereqs.forbidden_metatypes &&
            prereqs.forbidden_metatypes.length > 0
          ) {
            if (prereqs.forbidden_metatypes.includes(metatype)) {
              return 'Not available for your metatype.';
            }
          }

          // Check required awakening types
          if (
            prereqs.required_awakening &&
            prereqs.required_awakening.length > 0
          ) {
            if (!prereqs.required_awakening.includes(awakening)) {
              const required = prereqs.required_awakening.join(' or ');
              return `Requires: ${required}`;
            }
          }

          // Check forbidden awakening types
          if (
            prereqs.forbidden_awakening &&
            prereqs.forbidden_awakening.length > 0
          ) {
            if (prereqs.forbidden_awakening.includes(awakening)) {
              return 'Not compatible with your awakening type.';
            }
          }

          // Check required quirks (other qualities that must be taken first)
          if (prereqs.required_quirks && prereqs.required_quirks.length > 0) {
            const selectedNames = selectedQuirks
              .map((k) => quirkInfo[k]?.name)
              .filter(Boolean);
            for (const requiredQuirk of prereqs.required_quirks) {
              if (!selectedNames.includes(requiredQuirk)) {
                return `Requires: ${requiredQuirk}`;
              }
            }
          }

          // Check incompatible quirks (from prerequisite data)
          if (
            prereqs.incompatible_quirks &&
            prereqs.incompatible_quirks.length > 0
          ) {
            const selectedNames = selectedQuirks
              .map((k) => quirkInfo[k]?.name)
              .filter(Boolean);
            for (const incompatible of prereqs.incompatible_quirks) {
              if (selectedNames.includes(incompatible)) {
                return `Incompatible with ${incompatible}`;
              }
            }
          }

          // Check negative karma limit (positive values are negative qualities)
          if (quirk.value > 0) {
            const additional = quirk.value;
            if (karmaFromNegatives + additional > MAX_KARMA_FROM_NEGATIVES) {
              return `Exceeds ${MAX_KARMA_FROM_NEGATIVES} karma limit from negatives!`;
            }
          }

          // Check blacklist (legacy system)
          const selectedNames = selectedQuirks
            .map((k) => quirkInfo[k]?.name)
            .filter(Boolean);

          for (const blacklist of quirkBlacklist) {
            if (!blacklist.includes(quirk.name)) continue;
            for (const incompatible of blacklist) {
              if (
                incompatible !== quirk.name &&
                selectedNames.includes(incompatible)
              ) {
                return `Incompatible with ${incompatible}`;
              }
            }
          }

          return undefined;
        };

        const handleToggleQuality = (quirkName: string, quirk: Quirk) => {
          const isSelected = selectedQuirks.includes(quirkName);

          if (isSelected) {
            // Remove
            setSelectedQuirks(selectedQuirks.filter((q) => q !== quirkName));
            act('remove_quirk', { quirk: quirk.name });
          } else {
            // Add
            if (getReasonToNotAdd(quirkName)) return;
            setSelectedQuirks([...selectedQuirks, quirkName]);
            act('give_quirk', { quirk: quirk.name });
          }
        };

        const selectedCount = selectedQuirks.length;
        const positiveCount = selectedQuirks.filter(
          (k) => quirkInfo[k]?.value > 0,
        ).length;
        const negativeCount = selectedQuirks.filter(
          (k) => quirkInfo[k]?.value < 0,
        ).length;

        return (
          <Box
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* Karma Panel */}
            <KarmaPanel
              karmaBalance={karmaBalance}
              karmaFromPositives={karmaFromPositives}
              karmaFromNegatives={karmaFromNegatives}
              maxNegatives={MAX_KARMA_FROM_NEGATIVES}
            />

            {/* Controls */}
            <Stack align="center" mb={0.75}>
              <Stack.Item grow>
                <Input
                  fluid
                  placeholder="Search qualities..."
                  value={filterText}
                  onChange={(_, v) => setFilterText(v)}
                />
              </Stack.Item>
              <Stack.Item ml={0.5}>
                <Button
                  icon="times"
                  disabled={!filterText}
                  onClick={() => setFilterText('')}
                />
              </Stack.Item>
              <Stack.Item ml={0.5}>
                <Button
                  icon="trash"
                  color="bad"
                  disabled={selectedCount === 0}
                  onClick={() => {
                    for (const quirkName of selectedQuirks) {
                      const quirk = quirkInfo[quirkName];
                      if (quirk) {
                        act('remove_quirk', { quirk: quirk.name });
                      }
                    }
                    setSelectedQuirks([]);
                  }}
                  tooltip="Remove all qualities"
                >
                  Clear All
                </Button>
              </Stack.Item>
            </Stack>

            {/* Tabs */}
            <Tabs fluid mb={0.5}>
              <Tabs.Tab
                selected={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
              >
                <Icon name="list" mr={0.5} />
                All ({allQualities.length})
              </Tabs.Tab>
              <Tabs.Tab
                selected={activeTab === 'positive'}
                onClick={() => setActiveTab('positive')}
              >
                <Icon name="plus-circle" color="#4caf50" mr={0.5} />
                Positive ({positiveCount} selected)
              </Tabs.Tab>
              <Tabs.Tab
                selected={activeTab === 'negative'}
                onClick={() => setActiveTab('negative')}
              >
                <Icon name="minus-circle" color="#f44336" mr={0.5} />
                Negative ({negativeCount} selected)
              </Tabs.Tab>
            </Tabs>

            {/* Info Banner */}
            <Box
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(155, 143, 199, 0.1)',
                border: '1px solid rgba(155, 143, 199, 0.3)',
                borderRadius: '4px',
                marginBottom: '0.75rem',
                fontSize: '0.8rem',
              }}
            >
              <Icon name="info-circle" color="#9b8fc7" mr={0.5} />
              <b>Positive qualities</b> cost karma. <b>Negative qualities</b>{' '}
              give karma (max {MAX_KARMA_FROM_NEGATIVES}). Click to toggle.
            </Box>

            {/* Quality List */}
            <Box
              style={{
                flexGrow: '1',
                overflowY: 'auto',
                paddingRight: '0.5rem',
              }}
            >
              {filteredQualities.length === 0 ? (
                <Box
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    opacity: '0.5',
                    fontStyle: 'italic',
                  }}
                >
                  <Icon name="search" size={2} />
                  <Box mt={1}>No qualities match your search.</Box>
                </Box>
              ) : (
                filteredQualities.map(([quirkKey, quirk]) => {
                  const isSelected = selectedQuirks.includes(quirkKey);
                  const reason = isSelected
                    ? undefined
                    : getReasonToNotAdd(quirkKey);

                  return (
                    <QualityCard
                      key={quirkKey}
                      qualityKey={quirkKey}
                      quality={{ ...quirk, failTooltip: reason }}
                      isSelected={isSelected}
                      disabled={!!reason}
                      onClick={() => handleToggleQuality(quirkKey, quirk)}
                    />
                  );
                })
              )}
            </Box>

            {/* Selected Summary */}
            {selectedCount > 0 && (
              <Box
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
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
                  <Icon name="check-double" mr={0.5} />
                  Selected Qualities ({selectedCount})
                </Box>
                <Stack wrap>
                  {selectedQuirks.map((quirkKey) => {
                    const quirk = quirkInfo[quirkKey];
                    if (!quirk) return null;
                    // Server: negative value = positive quality, positive value = negative quality
                    const isPositive = quirk.value < 0;
                    return (
                      <Stack.Item key={quirkKey} mb={0.25} mr={0.25}>
                        <Button
                          compact
                          icon="times"
                          color={isPositive ? 'green' : 'red'}
                          onClick={() => handleToggleQuality(quirkKey, quirk)}
                        >
                          {quirk.name} ({quirk.value < 0 ? '' : '+'}
                          {quirk.value})
                        </Button>
                      </Stack.Item>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Box>
        );
      }}
    />
  );
};
