/**
 * Knowledge Skills Selector Component
 *
 * Handles knowledge skill and language allocation.
 */

import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Dropdown, Icon, Stack, Tabs } from '../../../components';
import { CollapsibleSection } from './components';
import {
  AttributeMeta,
  ChargenConstData,
  ChargenState,
  KnowledgeSkillMeta,
  LanguageMeta,
} from './types';

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

export const KnowledgeSkillsSelector = (
  props: KnowledgeSkillsSelectorProps,
) => {
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
    (acc: Record<string, KnowledgeSkillMeta[]>, skill: KnowledgeSkillMeta) => {
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
      ...value!,
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
      ...value!,
      languages: newLanguages,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const nativeLang = languages.find(
    (l: LanguageMeta) => l.id === nativeLanguage,
  );

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__knowledgeSelector">
      {!embedded && (
        <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header">
          <Icon
            name="brain"
            className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__icon"
          />
          <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__title">
            Knowledge ({spentPoints}/{freeKnowledgePoints})
          </Box>
        </Box>
      )}
      {embedded && (
        <Box
          mb={0.75}
          style={{
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: spentPoints < freeKnowledgePoints ? '#ffeb3b' : '#4caf50',
          }}
        >
          <Icon name="brain" mr={0.5} />
          Knowledge Points: {spentPoints}/{freeKnowledgePoints}
        </Box>
      )}

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
          {(knowledgeByCategory[knowledgeCategory] || []).map(
            (skill: KnowledgeSkillMeta) => {
              const currentValue = Number(selectedKnowledge[skill.id]) || 0;
              const canIncrease =
                !isSaved &&
                currentValue < 6 &&
                spentPoints < freeKnowledgePoints;
              const canDecrease = !isSaved && currentValue > 0;

              return (
                <Tooltip key={skill.id} content={skill.name} position="right">
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
            },
          )}
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
            .filter((l: LanguageMeta) => l.id !== nativeLanguage)
            .map((lang: LanguageMeta) => {
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
