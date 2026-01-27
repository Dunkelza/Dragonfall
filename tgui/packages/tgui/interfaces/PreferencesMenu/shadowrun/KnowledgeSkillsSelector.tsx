/**
 * Knowledge Skills Selector Component
 *
 * Handles knowledge skill and language allocation.
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Dropdown, Icon, Stack, Tabs } from '../../../components';
import { calculateBumpedValue } from './hooks';
import {
  AttributeMeta,
  ChargenConstData,
  ChargenState,
  KnowledgeSkillMeta,
  LanguageMeta,
} from './types';

// === ACCENT COLORS ===
const ACCENT_GREEN = '#2ecc71';
const ACCENT_GREEN_DIM = 'rgba(46, 204, 113, 0.15)';
const ACCENT_GREEN_BORDER = 'rgba(46, 204, 113, 0.4)';
const LANGUAGE_COLOR = '#9b59b6';
const LANGUAGE_COLOR_DIM = 'rgba(155, 89, 182, 0.15)';
const SUCCESS_GREEN = '#4caf50';
const WARNING_YELLOW = '#f1c40f';

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  academic: 'graduation-cap',
  professional: 'briefcase',
  street: 'road',
  interests: 'star',
  other: 'folder',
  default: 'book',
};

type KnowledgeSkillsSelectorProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  embedded?: boolean;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  value: ChargenState | null;
};

export const KnowledgeSkillsSelector = memo(
  (props: KnowledgeSkillsSelectorProps) => {
    const {
      chargenState,
      chargenConstData,
      isSaved,
      act,
      featureId,
      setPredictedValue,
      value,
      embedded,
    } = props;

    if (!chargenState || !chargenConstData) {
      return null;
    }

    // Get INT value for free knowledge skill points
    const getAttrValue = (name: string) => {
      const attrs = chargenConstData.attributes || [];
      const meta = attrs.find(
        (a: AttributeMeta) =>
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
      (
        acc: Record<string, KnowledgeSkillMeta[]>,
        skill: KnowledgeSkillMeta,
      ) => {
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

    // Points remaining
    const pointsRemaining = freeKnowledgePoints - spentPoints;

    // Get category icon
    const getCategoryIcon = (cat: string) => {
      return CATEGORY_ICONS[cat] || CATEGORY_ICONS.default;
    };

    // Count skills in each category
    const getSkillCountInCategory = (cat: string) => {
      return (knowledgeByCategory[cat] || []).filter(
        (skill: KnowledgeSkillMeta) =>
          (Number(selectedKnowledge[skill.id]) || 0) > 0,
      ).length;
    };

    const handleBumpKnowledge = (skillId: string, delta: number) => {
      if (isSaved) return;

      const result = calculateBumpedValue(skillId, delta, {
        currentValues: selectedKnowledge,
        getMax: () => 6,
        validatePoints: (_id, curr, next) => {
          const costDelta = next - curr;
          return (
            costDelta <= 0 || spentPoints + costDelta <= freeKnowledgePoints
          );
        },
      });

      if (!result.success) return;

      const newState = { ...value!, knowledge_skills: result.newValues };
      setPredictedValue(newState);
      act('set_preference', { preference: featureId, value: newState });
    };

    const handleSetNativeLanguage = (langId: string) => {
      if (isSaved) return;

      const newState = {
        ...value!,
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

      const result = calculateBumpedValue(langId, delta, {
        currentValues: selectedLanguages,
        getMax: () => 6,
        canBump: (id) => id !== nativeLanguage,
        validatePoints: (_id, curr, next) => {
          const costDelta = next - curr;
          return (
            costDelta <= 0 || spentPoints + costDelta <= freeKnowledgePoints
          );
        },
      });

      if (!result.success) return;

      const newState = { ...value!, languages: result.newValues };
      setPredictedValue(newState);
      act('set_preference', { preference: featureId, value: newState });
    };

    const nativeLang = languages.find(
      (l: LanguageMeta) => l.id === nativeLanguage,
    );

    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${ACCENT_GREEN_DIM}, rgba(0, 0, 0, 0.4))`,
          borderRadius: '8px',
          border: `1px solid ${ACCENT_GREEN_BORDER}`,
          padding: '1rem',
          position: 'relative',
        }}
      >
        {/* Decorative corner accent */}
        <Box
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '80px',
            height: '80px',
            background: `linear-gradient(135deg, transparent 50%, ${ACCENT_GREEN_DIM} 50%)`,
            opacity: '0.5',
          }}
        />

        {/* Header */}
        {!embedded && (
          <Box style={{ marginBottom: '1rem' }}>
            <Stack align="center" justify="space-between">
              <Stack.Item>
                <Box
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: ACCENT_GREEN,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Icon name="brain" />
                  Knowledge & Languages
                </Box>
              </Stack.Item>
            </Stack>
          </Box>
        )}

        {embedded && (
          <Box
            mb={0.75}
            style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: pointsRemaining > 0 ? WARNING_YELLOW : SUCCESS_GREEN,
            }}
          >
            <Icon name="brain" mr={0.5} />
            Knowledge Points: {spentPoints}/{freeKnowledgePoints}
          </Box>
        )}

        {/* Points Display Card */}
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderLeft: `3px solid ${pointsRemaining <= 0 ? SUCCESS_GREEN : ACCENT_GREEN}`,
          }}
        >
          <Stack align="center" justify="space-between">
            <Stack.Item>
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon
                  name="lightbulb"
                  style={{
                    color: ACCENT_GREEN,
                    fontSize: '1.2rem',
                  }}
                />
                <Box>
                  <Box
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Knowledge Points
                  </Box>
                  <Box
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                      color: ACCENT_GREEN,
                    }}
                  >
                    {pointsRemaining} / {freeKnowledgePoints}
                  </Box>
                </Box>
              </Box>
            </Stack.Item>
            <Stack.Item>
              <Box style={{ textAlign: 'right' }}>
                <Box
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  (INT + LOG) × 2
                </Box>
                <Box
                  style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  INT: {intuition} | LOG: {logic}
                </Box>
              </Box>
            </Stack.Item>
          </Stack>
          {/* Progress bar */}
          <Box
            style={{
              marginTop: '0.5rem',
              height: '4px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                width: `${Math.min(100, (spentPoints / freeKnowledgePoints) * 100)}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${ACCENT_GREEN}, #27ae60)`,
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>

        {/* Native Language */}
        <Box
          style={{
            background: LANGUAGE_COLOR_DIM,
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderLeft: `3px solid ${LANGUAGE_COLOR}`,
          }}
        >
          <Stack align="center" justify="space-between">
            <Stack.Item>
              <Tooltip
                content="Your native language. You speak this at native fluency (N)."
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
                    name="comment"
                    style={{ color: LANGUAGE_COLOR, fontSize: '1rem' }}
                  />
                  <Box>
                    <Box
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Native Language
                    </Box>
                    <Box
                      style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: LANGUAGE_COLOR,
                      }}
                    >
                      {nativeLang?.name || 'Not Selected'}
                    </Box>
                  </Box>
                </Box>
              </Tooltip>
            </Stack.Item>
            <Stack.Item style={{ minWidth: '10rem' }}>
              {isSaved ? (
                <Box
                  style={{
                    fontSize: '0.9rem',
                    color: SUCCESS_GREEN,
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
                  options={languages.map((l: LanguageMeta) => ({
                    value: l.id,
                    displayText: l.name,
                  }))}
                  onSelected={handleSetNativeLanguage}
                />
              )}
            </Stack.Item>
          </Stack>
        </Box>

        {/* Scrollable content area */}
        <Box
          style={{
            flexGrow: '1',
            overflow: 'auto',
          }}
        >
          {/* Knowledge Skills */}
          <Box
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
              borderLeft: `3px solid ${ACCENT_GREEN}`,
            }}
          >
            <Box
              style={{
                fontWeight: 'bold',
                color: ACCENT_GREEN,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon name="graduation-cap" />
              Knowledge Skills
              <Box
                as="span"
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: 'normal',
                }}
              >
                ({knowledgeSpent} pts)
              </Box>
            </Box>

            {/* Category Tabs */}
            <Box style={{ marginBottom: '0.5rem' }}>
              <Tabs fluid>
                {Object.keys(knowledgeByCategory).map((cat) => {
                  const isActive = knowledgeCategory === cat;
                  const skillCount = getSkillCountInCategory(cat);
                  return (
                    <Tabs.Tab
                      key={cat}
                      selected={isActive}
                      onClick={() => setKnowledgeCategory(cat)}
                      style={{
                        ...(isActive && {
                          background: ACCENT_GREEN_DIM,
                          borderBottom: `2px solid ${ACCENT_GREEN}`,
                        }),
                      }}
                    >
                      <Icon name={getCategoryIcon(cat)} mr={0.5} />
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      {skillCount > 0 && (
                        <Box
                          as="span"
                          style={{
                            marginLeft: '0.25rem',
                            padding: '0.1rem 0.35rem',
                            background: SUCCESS_GREEN,
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {skillCount}
                        </Box>
                      )}
                    </Tabs.Tab>
                  );
                })}
              </Tabs>
            </Box>

            {/* Skills List */}
            <Box
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                padding: '0.5rem',
              }}
            >
              {(knowledgeByCategory[knowledgeCategory] || []).map(
                (skill: KnowledgeSkillMeta) => {
                  const currentValue = Number(selectedKnowledge[skill.id]) || 0;
                  const canIncrease =
                    !isSaved &&
                    currentValue < 6 &&
                    spentPoints < freeKnowledgePoints;
                  const canDecrease = !isSaved && currentValue > 0;

                  return (
                    <Box
                      key={skill.id}
                      style={{
                        padding: '0.4rem 0.5rem',
                        marginBottom: '0.25rem',
                        background:
                          currentValue > 0
                            ? 'rgba(46, 204, 113, 0.1)'
                            : 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '4px',
                        borderLeft: `3px solid ${currentValue > 0 ? ACCENT_GREEN : 'transparent'}`,
                        opacity: isSaved ? '0.6' : '1',
                      }}
                    >
                      <Stack align="center">
                        <Stack.Item grow>
                          <Tooltip content={skill.name} position="right">
                            <Box
                              style={{
                                fontSize: '0.9rem',
                                color:
                                  currentValue > 0
                                    ? '#fff'
                                    : 'rgba(255, 255, 255, 0.7)',
                              }}
                            >
                              {skill.name}
                            </Box>
                          </Tooltip>
                        </Stack.Item>
                        <Stack.Item>
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
                              disabled={!canDecrease}
                              onClick={() => handleBumpKnowledge(skill.id, -1)}
                              style={{ padding: '0.15rem 0.3rem' }}
                            />
                            <Box
                              style={{
                                minWidth: '1.5rem',
                                textAlign: 'center',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color: currentValue > 0 ? ACCENT_GREEN : '#666',
                              }}
                            >
                              {currentValue}
                            </Box>
                            <Button
                              icon="plus"
                              compact
                              disabled={!canIncrease}
                              onClick={() => handleBumpKnowledge(skill.id, 1)}
                              style={{ padding: '0.15rem 0.3rem' }}
                            />
                          </Box>
                        </Stack.Item>
                      </Stack>
                    </Box>
                  );
                },
              )}
            </Box>
          </Box>

          {/* Additional Languages */}
          <Box
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              padding: '0.75rem',
              borderLeft: `3px solid ${LANGUAGE_COLOR}`,
            }}
          >
            <Box
              style={{
                fontWeight: 'bold',
                color: LANGUAGE_COLOR,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon name="language" />
              Additional Languages
              <Box
                as="span"
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: 'normal',
                }}
              >
                ({languageSpent} pts)
              </Box>
            </Box>

            <Box
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem',
                fontStyle: 'italic',
              }}
            >
              Rating 3+ to understand, 6 to speak fluently
            </Box>

            <Box
              style={{
                maxHeight: '150px',
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                padding: '0.5rem',
              }}
            >
              {languages
                .filter((l: LanguageMeta) => l.id !== nativeLanguage)
                .map((lang: LanguageMeta) => {
                  const currentValue = Number(selectedLanguages[lang.id]) || 0;
                  const canIncrease =
                    !isSaved &&
                    currentValue < 6 &&
                    spentPoints < freeKnowledgePoints;
                  const canDecrease = !isSaved && currentValue > 0;

                  return (
                    <Box
                      key={lang.id}
                      style={{
                        padding: '0.4rem 0.5rem',
                        marginBottom: '0.25rem',
                        background:
                          currentValue > 0
                            ? 'rgba(155, 89, 182, 0.1)'
                            : 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '4px',
                        borderLeft: `3px solid ${currentValue > 0 ? LANGUAGE_COLOR : 'transparent'}`,
                        opacity: isSaved ? '0.6' : '1',
                      }}
                    >
                      <Stack align="center">
                        <Stack.Item grow>
                          <Tooltip content={lang.desc} position="right">
                            <Box
                              style={{
                                fontSize: '0.9rem',
                                color:
                                  currentValue > 0
                                    ? '#fff'
                                    : 'rgba(255, 255, 255, 0.7)',
                              }}
                            >
                              {lang.name}
                            </Box>
                          </Tooltip>
                        </Stack.Item>
                        <Stack.Item>
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
                              disabled={!canDecrease}
                              onClick={() => handleBumpLanguage(lang.id, -1)}
                              style={{ padding: '0.15rem 0.3rem' }}
                            />
                            <Box
                              style={{
                                minWidth: '1.5rem',
                                textAlign: 'center',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color:
                                  currentValue > 0 ? LANGUAGE_COLOR : '#666',
                              }}
                            >
                              {currentValue}
                            </Box>
                            <Button
                              icon="plus"
                              compact
                              disabled={!canIncrease}
                              onClick={() => handleBumpLanguage(lang.id, 1)}
                              style={{ padding: '0.15rem 0.3rem' }}
                            />
                          </Box>
                        </Stack.Item>
                      </Stack>
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
);
