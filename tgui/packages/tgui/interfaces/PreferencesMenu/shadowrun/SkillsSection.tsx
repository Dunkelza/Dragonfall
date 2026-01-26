/**
 * Skills Section Component (Active Skills and Skill Groups)
 *
 * Visual overhaul with:
 * - Gradient container with teal accent
 * - Dashboard header with skill/group points display
 * - Category tabs with icons and glow effects
 * - Styled skill cards with attribute badges
 * - Enhanced skill group display with member info
 * - Specialization interface with visual feedback
 */

import { memo, useMemo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Dropdown, Icon, Stack, Tabs } from '../../../components';
import { CollapsibleSection } from './components';
import { calculateBumpedValue } from './hooks';
import {
  ChargenConstData,
  ChargenState,
  SkillGroupMeta,
  SkillMeta,
} from './types';

// ============================================================================
// ACCENT COLORS
// ============================================================================

const SKILL_ACCENT = '#03fca1'; // Teal - main section accent
const SKILL_ACCENT_DIM = 'rgba(3, 252, 161, 0.3)';
const GROUP_ACCENT = '#ffd700'; // Gold for skill groups
const SPEC_ACCENT = '#9b59b6'; // Purple for specializations

// Attribute color mapping
const ATTR_COLORS: Record<string, string> = {
  body: '#ff6b6b',
  agility: '#ff9800',
  reaction: '#ffeb3b',
  strength: '#e91e63',
  willpower: '#9b59b6',
  logic: '#2196f3',
  intuition: '#00bcd4',
  charisma: '#4caf50',
};

// Get color for an attribute
const getAttrColor = (attrName: string): string => {
  const key = attrName.toLowerCase().replace(/\s/g, '');
  return ATTR_COLORS[key] || '#888888';
};

// Get skill value color based on rating
const getSkillValueColor = (value: number, isLocked: boolean): string => {
  if (isLocked) return '#ffd700';
  if (value === 0) return 'rgba(255, 255, 255, 0.3)';
  if (value >= 6) return '#4caf50';
  if (value >= 4) return '#8bc34a';
  if (value >= 2) return '#ffffff';
  return 'rgba(255, 255, 255, 0.7)';
};

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

  // Progress percentages
  const skillPercent =
    totalSkillPoints > 0 ? (skillSpent / totalSkillPoints) * 100 : 0;
  const groupPercent =
    totalGroupPoints > 0 ? (groupSpent / totalGroupPoints) * 100 : 0;

  // Group skills by parent stat
  const skillsByStat = useMemo(() => {
    return skillsMeta.reduce(
      (acc: Record<string, SkillMeta[]>, skill: SkillMeta) => {
        const stat = skill.parent_stat_name || 'Other';
        if (!acc[stat]) acc[stat] = [];
        acc[stat].push(skill);
        return acc;
      },
      {},
    );
  }, [skillsMeta]);

  // Build map of which skills are locked by groups
  const groupInfoBySkillId = useMemo(() => {
    const map = new Map<
      string,
      { groupId: string; groupName: string; rating: number }
    >();
    skillGroupsMeta.forEach((g: SkillGroupMeta) => {
      const rating = Number(skillGroups[g.id] || 0);
      if (rating > 0) {
        (g.skills || []).forEach((skillId: string) => {
          map.set(skillId, {
            groupId: g.id,
            groupName: g.name,
            rating,
          });
        });
      }
    });
    return map;
  }, [skillGroupsMeta, skillGroups]);

  const [activeTab, setActiveTab] = useLocalState('sr_skills_tab', 'All');
  const [showGroupMembers, setShowGroupMembers] = useLocalState(
    'sr_show_group_members',
    false,
  );

  const handleBumpSkill = (skillId: string, delta: number) => {
    if (isSaved) return;

    const result = calculateBumpedValue(skillId, delta, {
      currentValues: skills,
      getMax: () => 6,
      canBump: (id) => !groupInfoBySkillId.has(id),
      validatePoints: (_id, curr, next) => {
        const costDelta = next - curr;
        return costDelta <= 0 || skillSpent + costDelta <= totalSkillPoints;
      },
    });

    if (!result.success) return;

    const newState = { ...value!, skills: result.newValues };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  const handleBumpGroup = (groupId: string, delta: number) => {
    if (isSaved) return;

    const result = calculateBumpedValue(groupId, delta, {
      currentValues: skillGroups,
      getMax: () => 6,
      validatePoints: (_id, curr, next) => {
        const costDelta = next - curr;
        return costDelta <= 0 || groupSpent + costDelta <= totalGroupPoints;
      },
    });

    if (!result.success) return;

    const newState = { ...value!, skill_groups: result.newValues };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
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

  // Get icon for stat
  const getStatIcon = (stat: string): string => {
    const icons: Record<string, string> = {
      Body: 'heart',
      Agility: 'running',
      Reaction: 'bolt',
      Strength: 'dumbbell',
      Willpower: 'brain',
      Logic: 'microchip',
      Intuition: 'eye',
      Charisma: 'comments',
    };
    return icons[stat] || 'book';
  };

  return (
    <CollapsibleSection
      title="Skills"
      icon="book"
      stateKey="sr_skills_section"
      defaultOpen
    >
      {/* Skills Dashboard Header */}
      <Box
        style={{
          background: `linear-gradient(135deg, rgba(3, 252, 161, 0.1), rgba(0, 0, 0, 0.3))`,
          border: `1px solid ${SKILL_ACCENT_DIM}`,
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <Stack>
          {/* Skill Points */}
          <Stack.Item grow basis="50%">
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <Icon name="book" color={SKILL_ACCENT} size={1.1} />
              <Box style={{ fontWeight: 'bold' }}>Skill Points</Box>
              <Box
                style={{
                  marginLeft: 'auto',
                  padding: '0.15rem 0.5rem',
                  background:
                    skillRemaining > 0
                      ? 'rgba(255, 193, 7, 0.2)'
                      : 'rgba(76, 175, 80, 0.2)',
                  border: `1px solid ${skillRemaining > 0 ? 'rgba(255, 193, 7, 0.5)' : 'rgba(76, 175, 80, 0.5)'}`,
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  color: skillRemaining > 0 ? '#ffc107' : '#4caf50',
                }}
              >
                {skillRemaining}/{totalSkillPoints}
              </Box>
            </Box>
            {/* Skill Progress Bar */}
            <Box
              style={{
                height: '6px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  height: '100%',
                  width: `${Math.min(skillPercent, 100)}%`,
                  background:
                    skillRemaining > 0
                      ? `linear-gradient(90deg, ${SKILL_ACCENT}, #ffc107)`
                      : `linear-gradient(90deg, ${SKILL_ACCENT}, #4caf50)`,
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
            {/* Breakdown */}
            <Box
              style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '0.25rem',
              }}
            >
              {skillRatingsSpent} ratings
              {specializationCount > 0 &&
                ` + ${specializationCount} spec${specializationCount !== 1 ? 's' : ''}`}
            </Box>
          </Stack.Item>

          {/* Divider */}
          {totalGroupPoints > 0 && (
            <Stack.Item>
              <Box
                style={{
                  width: '1px',
                  height: '50px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  margin: '0 0.75rem',
                }}
              />
            </Stack.Item>
          )}

          {/* Group Points */}
          {totalGroupPoints > 0 && (
            <Stack.Item grow basis="50%">
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <Icon name="layer-group" color={GROUP_ACCENT} size={1.1} />
                <Box style={{ fontWeight: 'bold' }}>Group Points</Box>
                <Box
                  style={{
                    marginLeft: 'auto',
                    padding: '0.15rem 0.5rem',
                    background:
                      groupRemaining > 0
                        ? 'rgba(255, 193, 7, 0.2)'
                        : 'rgba(76, 175, 80, 0.2)',
                    border: `1px solid ${groupRemaining > 0 ? 'rgba(255, 193, 7, 0.5)' : 'rgba(76, 175, 80, 0.5)'}`,
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: groupRemaining > 0 ? '#ffc107' : '#4caf50',
                  }}
                >
                  {groupRemaining}/{totalGroupPoints}
                </Box>
              </Box>
              {/* Group Progress Bar */}
              <Box
                style={{
                  height: '6px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    height: '100%',
                    width: `${Math.min(groupPercent, 100)}%`,
                    background:
                      groupRemaining > 0
                        ? `linear-gradient(90deg, ${GROUP_ACCENT}, #ffc107)`
                        : `linear-gradient(90deg, ${GROUP_ACCENT}, #4caf50)`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '0.25rem',
                }}
              >
                {groupSpent} invested in groups
              </Box>
            </Stack.Item>
          )}
        </Stack>
      </Box>

      {/* Skill Groups Section */}
      {skillGroupsMeta.length > 0 && (
        <Box mb={1}>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              paddingBottom: '0.35rem',
              borderBottom: `1px solid ${GROUP_ACCENT}`,
            }}
          >
            <Icon name="layer-group" color={GROUP_ACCENT} />
            <Box
              style={{
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: GROUP_ACCENT,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Skill Groups
            </Box>
            <Button
              icon={showGroupMembers ? 'eye-slash' : 'eye'}
              compact
              onClick={() => setShowGroupMembers(!showGroupMembers)}
              tooltip={showGroupMembers ? 'Hide members' : 'Show members'}
              style={{
                marginLeft: 'auto',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </Box>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.5rem',
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
                <Box
                  key={group.id}
                  style={{
                    background:
                      currentValue > 0
                        ? 'rgba(255, 215, 0, 0.1)'
                        : 'rgba(0, 0, 0, 0.2)',
                    border: `1px solid ${currentValue > 0 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '4px',
                    padding: '0.5rem',
                  }}
                >
                  <Tooltip content={`Members: ${memberNames}`} position="top">
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: currentValue > 0 ? 'bold' : 'normal',
                            color: currentValue > 0 ? GROUP_ACCENT : 'inherit',
                          }}
                        >
                          {group.name}
                          {currentValue > 0 && (
                            <Icon
                              name="lock"
                              size={0.7}
                              color={GROUP_ACCENT}
                              ml={0.5}
                            />
                          )}
                        </Box>
                        {showGroupMembers && (
                          <Box
                            style={{
                              fontSize: '0.7rem',
                              color: 'rgba(255, 255, 255, 0.4)',
                              marginTop: '0.25rem',
                            }}
                          >
                            {memberNames}
                          </Box>
                        )}
                      </Stack.Item>
                      <Stack.Item>
                        <Stack align="center">
                          <Stack.Item>
                            <Button
                              icon="minus"
                              disabled={!canDecrease}
                              onClick={() => handleBumpGroup(group.id, -1)}
                              style={{
                                minWidth: '1.4rem',
                                height: '1.4rem',
                                padding: '0',
                                fontSize: '0.7rem',
                                background: canDecrease
                                  ? 'rgba(255, 107, 107, 0.2)'
                                  : 'transparent',
                                border: `1px solid ${canDecrease ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                              }}
                            />
                          </Stack.Item>
                          <Stack.Item>
                            <Box
                              style={{
                                minWidth: '1.8rem',
                                textAlign: 'center',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                color:
                                  currentValue > 0
                                    ? GROUP_ACCENT
                                    : 'rgba(255, 255, 255, 0.3)',
                              }}
                            >
                              {currentValue}
                            </Box>
                          </Stack.Item>
                          <Stack.Item>
                            <Button
                              icon="plus"
                              disabled={!canIncrease}
                              onClick={() => handleBumpGroup(group.id, 1)}
                              style={{
                                minWidth: '1.4rem',
                                height: '1.4rem',
                                padding: '0',
                                fontSize: '0.7rem',
                                background: canIncrease
                                  ? 'rgba(76, 175, 80, 0.2)'
                                  : 'transparent',
                                border: `1px solid ${canIncrease ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                              }}
                            />
                          </Stack.Item>
                        </Stack>
                      </Stack.Item>
                    </Stack>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Individual Skills Section */}
      <Box>
        {/* Category Tabs */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            paddingBottom: '0.35rem',
            borderBottom: `1px solid ${SKILL_ACCENT}`,
          }}
        >
          <Icon name="book-open" color={SKILL_ACCENT} />
          <Box
            style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: SKILL_ACCENT,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Active Skills
          </Box>
        </Box>

        <Tabs fluid>
          <Tabs.Tab
            selected={activeTab === 'All'}
            onClick={() => setActiveTab('All')}
          >
            <Icon name="list" mr={0.5} />
            All ({skillsMeta.length})
          </Tabs.Tab>
          {statTabs.map((stat) => (
            <Tabs.Tab
              key={stat}
              selected={activeTab === stat}
              onClick={() => setActiveTab(stat)}
              style={
                activeTab === stat
                  ? {
                      boxShadow: `0 0 8px ${getAttrColor(stat)}`,
                    }
                  : {}
              }
            >
              <Icon
                name={getStatIcon(stat)}
                mr={0.5}
                color={activeTab === stat ? getAttrColor(stat) : undefined}
              />
              {stat} ({skillsByStat[stat]?.length || 0})
            </Tabs.Tab>
          ))}
        </Tabs>

        {/* Skills List */}
        <Box
          style={{
            maxHeight: '24rem',
            overflowY: 'auto',
            marginTop: '0.5rem',
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: '4px',
            padding: '0.5rem',
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
            const valueColor = getSkillValueColor(effectiveValue, isLocked);
            const attrColor = getAttrColor(skill.parent_stat_name || '');
            const hasSpec = !!skillSpecializations[skill.id];

            return (
              <Box
                key={skill.id}
                style={{
                  background: isLocked
                    ? 'rgba(255, 215, 0, 0.08)'
                    : effectiveValue > 0
                      ? 'rgba(3, 252, 161, 0.05)'
                      : 'transparent',
                  border: `1px solid ${isLocked ? 'rgba(255, 215, 0, 0.2)' : effectiveValue > 0 ? 'rgba(3, 252, 161, 0.15)' : 'rgba(255, 255, 255, 0.05)'}`,
                  borderLeft: `3px solid ${isLocked ? GROUP_ACCENT : attrColor}`,
                  borderRadius: '4px',
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.35rem',
                  opacity: isSaved ? '0.7' : '1',
                }}
              >
                <Stack align="center">
                  <Stack.Item grow>
                    <Box
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {/* Attribute Badge */}
                      <Box
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          color: attrColor,
                          background: `rgba(${attrColor === '#ff6b6b' ? '255,107,107' : attrColor === '#ff9800' ? '255,152,0' : attrColor === '#9b59b6' ? '155,89,182' : '136,136,136'}, 0.15)`,
                          padding: '0.1rem 0.3rem',
                          borderRadius: '2px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {(skill.parent_stat_name || 'N/A').substring(0, 3)}
                      </Box>
                      {/* Skill Name */}
                      <Tooltip
                        content={
                          isLocked
                            ? `Locked by ${groupInfo!.groupName} group at rating ${groupInfo!.rating}`
                            : `${skill.name} — linked to ${skill.parent_stat_name}`
                        }
                        position="right"
                      >
                        <Box
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: effectiveValue > 0 ? '500' : 'normal',
                            cursor: 'help',
                          }}
                        >
                          {skill.name}
                          {isLocked && (
                            <Icon
                              name="lock"
                              size={0.7}
                              color={GROUP_ACCENT}
                              ml={0.5}
                            />
                          )}
                          {hasSpec && (
                            <Icon
                              name="star"
                              size={0.7}
                              color={SPEC_ACCENT}
                              ml={0.5}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    </Box>

                    {/* Specialization dropdown */}
                    {effectiveValue >= 1 &&
                      skill.specializations &&
                      skill.specializations.length > 0 && (
                        <Box
                          mt={0.35}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Dropdown
                            disabled={
                              isSaved ||
                              (skillRemaining <= 0 &&
                                !skillSpecializations[skill.id])
                            }
                            width="9rem"
                            options={[
                              { value: '', displayText: '— No Spec —' },
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
                          {hasSpec ? (
                            <Box
                              style={{
                                fontSize: '0.7rem',
                                color: SPEC_ACCENT,
                                fontWeight: 'bold',
                              }}
                            >
                              +2 dice
                            </Box>
                          ) : (
                            skillRemaining > 0 && (
                              <Box
                                style={{
                                  fontSize: '0.65rem',
                                  color: 'rgba(255, 255, 255, 0.4)',
                                }}
                              >
                                1 pt for +2 dice
                              </Box>
                            )
                          )}
                        </Box>
                      )}
                  </Stack.Item>

                  {/* Controls */}
                  <Stack.Item>
                    <Stack align="center">
                      <Stack.Item>
                        <Button
                          icon="minus"
                          disabled={!canDecrease}
                          onClick={() => handleBumpSkill(skill.id, -1)}
                          style={{
                            minWidth: '1.5rem',
                            height: '1.5rem',
                            padding: '0',
                            fontSize: '0.75rem',
                            background: canDecrease
                              ? 'rgba(255, 107, 107, 0.2)'
                              : 'rgba(0, 0, 0, 0.2)',
                            border: `1px solid ${canDecrease ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                            color: canDecrease
                              ? '#ff6b6b'
                              : 'rgba(255, 255, 255, 0.3)',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Tooltip
                          content={`Rating: ${effectiveValue}/6`}
                          position="top"
                        >
                          <Box
                            style={{
                              minWidth: '2.2rem',
                              textAlign: 'center',
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: valueColor,
                              cursor: 'help',
                              textShadow:
                                effectiveValue > 0
                                  ? `0 0 6px ${valueColor}`
                                  : 'none',
                            }}
                          >
                            {effectiveValue}
                          </Box>
                        </Tooltip>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="plus"
                          disabled={!canIncrease}
                          onClick={() => handleBumpSkill(skill.id, 1)}
                          style={{
                            minWidth: '1.5rem',
                            height: '1.5rem',
                            padding: '0',
                            fontSize: '0.75rem',
                            background: canIncrease
                              ? 'rgba(76, 175, 80, 0.2)'
                              : 'rgba(0, 0, 0, 0.2)',
                            border: `1px solid ${canIncrease ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                            color: canIncrease
                              ? '#4caf50'
                              : 'rgba(255, 255, 255, 0.3)',
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
      </Box>
    </CollapsibleSection>
  );
});
