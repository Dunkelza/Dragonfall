/**
 * Skills Section Compound Component
 *
 * A compound component pattern for the Skills section that allows flexible composition
 * of skill-related UI components while sharing state through React context.
 *
 * Usage:
 * @example
 * <Skills>
 *   <Skills.Points />
 *   <Skills.Groups showMembers />
 *   <Skills.List attribute="combat" />
 * </Skills>
 *
 * Or use the full section:
 * <Skills.Section />
 */

import {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Dropdown, Icon, Stack, Tabs } from '../../../components';
import { useChargen } from './ChargenContext';
import { CollapsibleSection } from './components';
import { useConstData } from './ConstDataContext';
import { calculateBumpedValue } from './hooks';
import { SkillGroupMeta, SkillMeta } from './types';

// ============================================================================
// CONTEXT
// ============================================================================

type SkillsContextValue = {
  /** Whether any skill can be bumped down */
  canDecrease: (skillId: string) => boolean;
  /** Whether a group can be decreased */
  canDecreaseGroup: (groupId: string) => boolean;
  /** Whether any skill can be bumped up */
  canIncrease: (skillId: string) => boolean;
  /** Whether a group can be increased */
  canIncreaseGroup: (groupId: string) => boolean;
  /** Get effective skill value (considering group locks) */
  getEffectiveValue: (skillId: string) => number;
  /** Get group info for a skill if it's locked by a group */
  getGroupInfo: (
    skillId: string,
  ) => { groupId: string; groupName: string; rating: number } | null;
  /** Get current group rating */
  getGroupRating: (groupId: string) => number;
  /** Get current skill rating */
  getSkillRating: (skillId: string) => number;
  /** Get specialization for a skill */
  getSpecialization: (skillId: string) => string | undefined;
  /** Group points remaining */
  groupRemaining: number;
  /** Group points spent */
  groupSpent: number;
  /** Handle skill group rating change */
  handleBumpGroup: (groupId: string, delta: number) => void;
  /** Handle skill rating change */
  handleBumpSkill: (skillId: string, delta: number) => void;
  /** Set skill specialization */
  handleSetSpecialization: (skillId: string, specValue: string) => void;
  /** Whether the sheet is locked/saved */
  isSaved: boolean;
  /** Skill group metadata from server */
  skillGroupsMeta: SkillGroupMeta[];
  /** Skill ratings spent (without specializations) */
  skillRatingsSpent: number;
  /** Skill points remaining */
  skillRemaining: number;
  /** Skill points spent */
  skillSpent: number;
  /** Skills grouped by parent stat */
  skillsByStat: Record<string, SkillMeta[]>;
  /** Skill metadata from server */
  skillsMeta: SkillMeta[];
  /** Number of specializations */
  specializationCount: number;
  /** Total group points available */
  totalGroupPoints: number;
  /** Total skill points available */
  totalSkillPoints: number;
};

const SkillsContext = createContext<SkillsContextValue | null>(null);

/**
 * Hook to access skills context
 */
export function useSkills() {
  const ctx = useContext(SkillsContext);
  if (!ctx) {
    throw new Error(
      'useSkills must be used within a Skills compound component',
    );
  }
  return ctx;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export type SkillsProviderProps = {
  children: ReactNode;
};

/**
 * Skills compound component root.
 * Provides skill state and handlers to all child components.
 */
export const SkillsProvider = memo(({ children }: SkillsProviderProps) => {
  // Get data from contexts
  const { chargenState, isSaved, actions, featureId } = useChargen();
  const {
    skills: skillsMeta,
    skillGroups: skillGroupsMeta,
    priorityTables,
  } = useConstData();

  // Derive skill points from priority selection
  const skillLetter = chargenState?.priorities?.['skills'] || 'E';
  const totalSkillPoints = priorityTables?.skills?.[skillLetter] || 0;
  const totalGroupPoints = priorityTables?.skill_groups?.[skillLetter] || 0;

  // Current state
  const skills = chargenState?.skills || {};
  const skillGroups = chargenState?.skill_groups || {};
  const skillSpecializations = chargenState?.skill_specializations || {};

  // Calculate points spent
  const skillRatingsSpent = useMemo(
    () =>
      Object.values(skills).reduce<number>(
        (sum, v) => sum + (Number(v) || 0),
        0,
      ),
    [skills],
  );

  const specializationCount = Object.keys(skillSpecializations).length;
  const skillSpent = skillRatingsSpent + specializationCount;
  const skillRemaining = totalSkillPoints - skillSpent;

  const groupSpent = useMemo(
    () =>
      Object.values(skillGroups).reduce<number>(
        (sum, v) => sum + (Number(v) || 0),
        0,
      ),
    [skillGroups],
  );

  const groupRemaining = totalGroupPoints - groupSpent;

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

  // Getters
  const getSkillRating = useCallback(
    (skillId: string) => Number(skills[skillId]) || 0,
    [skills],
  );

  const getGroupRating = useCallback(
    (groupId: string) => Number(skillGroups[groupId]) || 0,
    [skillGroups],
  );

  const getGroupInfo = useCallback(
    (skillId: string) => groupInfoBySkillId.get(skillId) || null,
    [groupInfoBySkillId],
  );

  const getEffectiveValue = useCallback(
    (skillId: string) => {
      const groupInfo = groupInfoBySkillId.get(skillId);
      if (groupInfo) return groupInfo.rating;
      return Number(skills[skillId]) || 0;
    },
    [groupInfoBySkillId, skills],
  );

  const getSpecialization = useCallback(
    (skillId: string) => skillSpecializations[skillId],
    [skillSpecializations],
  );

  const canIncrease = useCallback(
    (skillId: string) => {
      if (isSaved) return false;
      if (groupInfoBySkillId.has(skillId)) return false;
      const current = Number(skills[skillId]) || 0;
      return current < 6 && skillSpent < totalSkillPoints;
    },
    [isSaved, groupInfoBySkillId, skills, skillSpent, totalSkillPoints],
  );

  const canDecrease = useCallback(
    (skillId: string) => {
      if (isSaved) return false;
      if (groupInfoBySkillId.has(skillId)) return false;
      const current = Number(skills[skillId]) || 0;
      return current > 0;
    },
    [isSaved, groupInfoBySkillId, skills],
  );

  const canIncreaseGroup = useCallback(
    (groupId: string) => {
      if (isSaved) return false;
      const current = Number(skillGroups[groupId]) || 0;
      return current < 6 && groupSpent < totalGroupPoints;
    },
    [isSaved, skillGroups, groupSpent, totalGroupPoints],
  );

  const canDecreaseGroup = useCallback(
    (groupId: string) => {
      if (isSaved) return false;
      const current = Number(skillGroups[groupId]) || 0;
      return current > 0;
    },
    [isSaved, skillGroups],
  );

  // Handlers
  const handleBumpSkill = useCallback(
    (skillId: string, delta: number) => {
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

      const newState = { ...chargenState!, skills: result.newValues };
      actions.updateState(newState);
      actions.sendAction('set_preference', {
        preference: featureId,
        value: newState,
      });
    },
    [
      isSaved,
      skills,
      groupInfoBySkillId,
      skillSpent,
      totalSkillPoints,
      chargenState,
      actions,
      featureId,
    ],
  );

  const handleBumpGroup = useCallback(
    (groupId: string, delta: number) => {
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

      const newState = { ...chargenState!, skill_groups: result.newValues };
      actions.updateState(newState);
      actions.sendAction('set_preference', {
        preference: featureId,
        value: newState,
      });
    },
    [
      isSaved,
      skillGroups,
      groupSpent,
      totalGroupPoints,
      chargenState,
      actions,
      featureId,
    ],
  );

  const handleSetSpecialization = useCallback(
    (skillId: string, specValue: string) => {
      if (isSaved) return;

      const newSpecs = { ...skillSpecializations };
      if (!specValue || specValue === '') {
        delete newSpecs[skillId];
      } else {
        newSpecs[skillId] = specValue;
      }

      const newState = {
        ...chargenState!,
        skill_specializations: newSpecs,
      };

      actions.updateState(newState);
      actions.sendAction('set_preference', {
        preference: featureId,
        value: newState,
      });
    },
    [isSaved, skillSpecializations, chargenState, actions, featureId],
  );

  // Build context value
  const contextValue = useMemo(
    (): SkillsContextValue => ({
      skillsMeta,
      skillGroupsMeta,
      skillsByStat,
      totalSkillPoints,
      totalGroupPoints,
      skillSpent,
      skillRemaining,
      skillRatingsSpent,
      specializationCount,
      groupSpent,
      groupRemaining,
      isSaved,
      getSkillRating,
      getGroupRating,
      getGroupInfo,
      getEffectiveValue,
      getSpecialization,
      canIncrease,
      canDecrease,
      canIncreaseGroup,
      canDecreaseGroup,
      handleBumpSkill,
      handleBumpGroup,
      handleSetSpecialization,
    }),
    [
      skillsMeta,
      skillGroupsMeta,
      skillsByStat,
      totalSkillPoints,
      totalGroupPoints,
      skillSpent,
      skillRemaining,
      skillRatingsSpent,
      specializationCount,
      groupSpent,
      groupRemaining,
      isSaved,
      getSkillRating,
      getGroupRating,
      getGroupInfo,
      getEffectiveValue,
      getSpecialization,
      canIncrease,
      canDecrease,
      canIncreaseGroup,
      canDecreaseGroup,
      handleBumpSkill,
      handleBumpGroup,
      handleSetSpecialization,
    ],
  );

  return (
    <SkillsContext.Provider value={contextValue}>
      {children}
    </SkillsContext.Provider>
  );
});

// ============================================================================
// COMPOUND COMPONENTS
// ============================================================================

/**
 * Displays skill and group point allocation summary
 */
export const SkillsPoints = memo(() => {
  const {
    skillSpent,
    totalSkillPoints,
    skillRemaining,
    skillRatingsSpent,
    specializationCount,
    groupSpent,
    totalGroupPoints,
    groupRemaining,
  } = useSkills();

  return (
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
  );
});

export type SkillsGroupsProps = {
  /** Whether to show group member skills */
  showMembers?: boolean;
};

/**
 * Displays skill groups with +/- controls
 */
export const SkillsGroups = memo(
  ({ showMembers: defaultShowMembers = false }: SkillsGroupsProps) => {
    const {
      skillGroupsMeta,
      skillsMeta,
      getGroupRating,
      canIncreaseGroup,
      canDecreaseGroup,
      handleBumpGroup,
    } = useSkills();

    const [showMembers, setShowMembers] = useLocalState(
      'sr_show_group_members',
      defaultShowMembers,
    );

    if (skillGroupsMeta.length === 0) {
      return null;
    }

    return (
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
              icon={showMembers ? 'eye-slash' : 'eye'}
              compact
              onClick={() => setShowMembers(!showMembers)}
              tooltip={showMembers ? 'Hide members' : 'Show members'}
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
            const currentValue = getGroupRating(group.id);
            const canIncrease = canIncreaseGroup(group.id);
            const canDecrease = canDecreaseGroup(group.id);
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
                      {showMembers && (
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
    );
  },
);

export type SkillsListProps = {
  /** Filter to a specific attribute (parent_stat_name) */
  attribute?: string;
};

/**
 * Displays individual skills with +/- controls and specialization dropdowns
 */
export const SkillsList = memo(({ attribute }: SkillsListProps) => {
  const {
    skillsMeta,
    skillsByStat,
    getEffectiveValue,
    getGroupInfo,
    getSpecialization,
    canIncrease,
    canDecrease,
    handleBumpSkill,
    handleSetSpecialization,
    skillRemaining,
    isSaved,
  } = useSkills();

  const [activeTab, setActiveTab] = useLocalState('sr_skills_tab', 'All');

  // If a specific attribute is requested, just show those skills
  const displaySkills = useMemo(() => {
    if (attribute) {
      return skillsByStat[attribute] || [];
    }
    if (activeTab === 'All') {
      return skillsMeta;
    }
    return skillsByStat[activeTab] || [];
  }, [attribute, activeTab, skillsMeta, skillsByStat]);

  const statTabs = Object.keys(skillsByStat).sort();

  return (
    <Box>
      {/* Only show tabs if not filtered to specific attribute */}
      {!attribute && (
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
      )}

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
        {displaySkills.map((skill: SkillMeta) => {
          const effectiveValue = getEffectiveValue(skill.id);
          const groupInfo = getGroupInfo(skill.id);
          const isLocked = !!groupInfo;
          const specialization = getSpecialization(skill.id);
          const canBumpUp = canIncrease(skill.id);
          const canBumpDown = canDecrease(skill.id);

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
                        <Icon name="lock" size={0.7} color="orange" ml={0.5} />
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
                    {/* Specialization dropdown */}
                    {effectiveValue >= 1 &&
                      skill.specializations &&
                      skill.specializations.length > 0 && (
                        <Box mt={0.25}>
                          <Dropdown
                            disabled={
                              isSaved ||
                              (skillRemaining <= 0 && !specialization)
                            }
                            width="10rem"
                            options={[
                              { value: '', displayText: '-- None --' },
                              ...skill.specializations.map((s: string) => ({
                                value: s,
                                displayText: s,
                              })),
                            ]}
                            selected={specialization || ''}
                            onSelected={(val: string) =>
                              handleSetSpecialization(skill.id, val)
                            }
                          />
                          {specialization ? (
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
                      disabled={!canBumpDown}
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
                      disabled={!canBumpUp}
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
  );
});

/**
 * Full Skills Section using compound components
 */
export const SkillsSectionCompound = memo(() => {
  return (
    <CollapsibleSection
      title="Skills"
      icon="book"
      stateKey="sr_skills_section"
      defaultOpen
    >
      <SkillsPoints />
      <SkillsGroups />
      <SkillsList />
    </CollapsibleSection>
  );
});

// ============================================================================
// ASSEMBLED COMPOUND COMPONENT
// ============================================================================

/**
 * Skills compound component namespace.
 * Use <Skills> as the root, and access sub-components via Skills.Points, etc.
 */
export const Skills = Object.assign(SkillsProvider, {
  Groups: SkillsGroups,
  List: SkillsList,
  Points: SkillsPoints,
  /** Full section with all sub-components */
  Section: SkillsSectionCompound,
});
