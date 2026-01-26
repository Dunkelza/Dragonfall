/**
 * Skills Section Component (Active Skills and Skill Groups)
 *
 * Handles skill point allocation and skill group management.
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Dropdown, Icon, Stack, Tabs } from '../../../components';
import { CollapsibleSection } from './components';
import {
  ChargenConstData,
  ChargenState,
  SkillGroupMeta,
  SkillMeta,
} from './types';

type SkillsSectionProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  value: ChargenState | null;
};

export const SkillsSection = memo((props: SkillsSectionProps) => {
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
  const skillSpecializations = chargenState.skill_specializations || {};

  // SR5: Skill ratings cost 1 point per rating, specializations cost 1 point each
  const skillRatingsSpent = Object.values(skills).reduce<number>(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );
  const specializationCount = Object.keys(skillSpecializations).length;
  const skillSpent = skillRatingsSpent + specializationCount;

  const groupSpent = Object.values(skillGroups).reduce<number>(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );

  const skillRemaining = totalSkillPoints - skillSpent;
  const groupRemaining = totalGroupPoints - groupSpent;

  // Group skills by parent stat
  const skillsByStat = skillsMeta.reduce(
    (acc: Record<string, SkillMeta[]>, skill: SkillMeta) => {
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
  skillGroupsMeta.forEach((g: SkillGroupMeta) => {
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
      ...value!,
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
      ...value!,
      skill_groups: newGroups,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleSetSpecialization = (skillId: string, specValue: string) => {
    if (isSaved) return;

    const newSpecs = { ...skillSpecializations };
    if (!specValue || specValue === '') {
      delete newSpecs[skillId];
    } else {
      newSpecs[skillId] = specValue;
    }

    const newState = {
      ...value!,
      skill_specializations: newSpecs,
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
            {specializationCount > 0 && (
              <Box as="span" style={{ opacity: '0.7', marginLeft: '0.3rem' }}>
                ({skillRatingsSpent} ratings + {specializationCount} spec
                {specializationCount !== 1 ? 's' : ''})
              </Box>
            )}
            {skillRemaining > 0 && (
              <Box as="span" style={{ opacity: '0.6', marginLeft: '0.3rem' }}>
                — {skillRemaining} left
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
            {skillGroupsMeta.map((group: SkillGroupMeta) => {
              const currentValue = Number(skillGroups[group.id]) || 0;
              const canIncrease =
                !isSaved && currentValue < 6 && groupSpent < totalGroupPoints;
              const canDecrease = !isSaved && currentValue > 0;
              const memberNames = (group.skills || [])
                .map((sid: string) => {
                  const s = skillsMeta.find((sk: SkillMeta) => sk.id === sid);
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
          ).map((skill: SkillMeta) => {
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
                      {/* Specialization dropdown - only show when skill rating >= 1 */}
                      {effectiveValue >= 1 &&
                        skill.specializations &&
                        skill.specializations.length > 0 && (
                          <Box mt={0.25}>
                            <Dropdown
                              disabled={
                                isSaved ||
                                // Can't add a new spec if no points left (but can remove or change existing)
                                (skillRemaining <= 0 &&
                                  !skillSpecializations[skill.id])
                              }
                              width="10rem"
                              options={[
                                { value: '', displayText: '-- None --' },
                                ...skill.specializations.map((s: string) => ({
                                  value: s,
                                  displayText: s,
                                })),
                              ]}
                              selected={skillSpecializations[skill.id] || ''}
                              onSelected={(val: string) =>
                                handleSetSpecialization(skill.id, val)
                              }
                            />
                            {skillSpecializations[skill.id] ? (
                              <Box
                                as="span"
                                ml={0.5}
                                style={{
                                  fontSize: '0.7rem',
                                  color: '#4caf50',
                                }}
                              >
                                +2 dice (1 pt)
                              </Box>
                            ) : (
                              skillRemaining > 0 && (
                                <Box
                                  as="span"
                                  ml={0.5}
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'rgba(255,255,255,0.4)',
                                  }}
                                >
                                  (1 pt)
                                </Box>
                              )
                            )}
                          </Box>
                        )}
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
});
