/**
 * CareerSection Component
 *
 * Shadowrun-styled career/occupations selector.
 * Simplified implementation focusing on reliability and visual consistency.
 */

import { sortBy } from 'common/collections';
import { FC, ReactNode, useCallback, useMemo } from 'react';

import { useBackend, useLocalState } from '../../../backend';
import { Box, Button, Dropdown, Icon, Stack } from '../../../components';
import {
  createSetPreference,
  Job,
  JoblessRole,
  JobPriority,
  PreferencesMenuData,
} from '../data';
import { ServerPreferencesFetcher } from '../ServerPreferencesFetcher';

// ============================================================================
// CONSTANTS
// ============================================================================

// Career section accent colors
const CAREER_ACCENT = '#e67e22';
const CAREER_ACCENT_DIM = 'rgba(230, 126, 34, 0.15)';
const CAREER_ACCENT_BORDER = 'rgba(230, 126, 34, 0.4)';

const DEPARTMENTS: Record<
  string,
  { color: string; icon: string; name: string }
> = {
  'Arcology Command': {
    name: 'Arcology Command',
    icon: 'crown',
    color: '#4fc3f7',
  },
  'Renraku Facilities': {
    name: 'Renraku Facilities',
    icon: 'building',
    color: '#f1a839',
  },
  'Lone Star': {
    name: 'Lone Star Security',
    icon: 'shield-alt',
    color: '#ef5350',
  },
  DocWagon: {
    name: 'DocWagon Medical',
    icon: 'plus-square',
    color: '#26a69a',
  },
  Science: {
    name: 'R&D Division',
    icon: 'flask',
    color: '#ab47bc',
  },
  'Shiawase Logistics': {
    name: 'Shiawase Logistics',
    icon: 'boxes',
    color: '#8d6e63',
  },
  Civilian: {
    name: 'Civilian Staff',
    icon: 'users',
    color: '#78909c',
  },
  Independent: {
    name: 'Independent',
    icon: 'user-secret',
    color: '#66bb6a',
  },
  Silicon: {
    name: 'Silicon Personnel',
    icon: 'robot',
    color: '#ec407a',
  },
};

const CORPORATE_DEPTS = [
  'Arcology Command',
  'Renraku Facilities',
  'Science',
  'Shiawase Logistics',
];

const INDEPENDENT_DEPTS = [
  'Lone Star',
  'DocWagon',
  'Civilian',
  'Independent',
  'Silicon',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const sortJobs = (entries: [string, Job][], head?: string) =>
  sortBy<[string, Job]>(
    ([key]) => (key === head ? -1 : 1),
    ([key]) => key,
  )(entries);

// ============================================================================
// PRIORITY BUTTON - Simple circular button for priority selection
// ============================================================================

type PriorityButtonProps = {
  active: boolean;
  color: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
};

const PriorityButton: FC<PriorityButtonProps> = ({
  active,
  color,
  disabled,
  label,
  onClick,
}) => (
  <Button
    circular
    color={active ? color : 'dark'}
    disabled={disabled}
    onClick={onClick}
    tooltip={label}
    tooltipPosition="bottom"
    style={{
      width: '22px',
      height: '22px',
      minWidth: '22px',
      border: active
        ? '2px solid rgba(255,255,255,0.8)'
        : '1px solid rgba(255,255,255,0.3)',
      opacity: disabled ? '0.4' : '1',
      boxShadow: active ? '0 0 6px rgba(255,255,255,0.3)' : 'none',
    }}
  />
);

// ============================================================================
// PRIORITY SELECTOR - Group of priority buttons
// ============================================================================

type PrioritySelectorProps = {
  disabled?: boolean;
  isOverflow: boolean;
  jobName: string;
  priority: JobPriority | null;
};

const PrioritySelector: FC<PrioritySelectorProps> = ({
  disabled,
  isOverflow,
  jobName,
  priority,
}) => {
  const { act } = useBackend<PreferencesMenuData>();

  const handleChange = useCallback(
    (newPriority: JobPriority | null) => {
      act('set_job_preference', { job: jobName, level: newPriority });
    },
    [act, jobName],
  );

  if (isOverflow) {
    return (
      <Stack>
        <Stack.Item>
          <PriorityButton
            label="Off"
            color="grey"
            active={!priority}
            disabled={disabled}
            onClick={() => handleChange(null)}
          />
        </Stack.Item>
        <Stack.Item>
          <PriorityButton
            label="On"
            color="green"
            active={!!priority}
            disabled={disabled}
            onClick={() => handleChange(JobPriority.High)}
          />
        </Stack.Item>
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Item>
        <PriorityButton
          label="Off"
          color="grey"
          active={!priority}
          disabled={disabled}
          onClick={() => handleChange(null)}
        />
      </Stack.Item>
      <Stack.Item>
        <PriorityButton
          label="Low"
          color="red"
          active={priority === JobPriority.Low}
          disabled={disabled}
          onClick={() => handleChange(JobPriority.Low)}
        />
      </Stack.Item>
      <Stack.Item>
        <PriorityButton
          label="Medium"
          color="yellow"
          active={priority === JobPriority.Medium}
          disabled={disabled}
          onClick={() => handleChange(JobPriority.Medium)}
        />
      </Stack.Item>
      <Stack.Item>
        <PriorityButton
          label="High"
          color="green"
          active={priority === JobPriority.High}
          disabled={disabled}
          onClick={() => handleChange(JobPriority.High)}
        />
      </Stack.Item>
    </Stack>
  );
};

// ============================================================================
// JOB TITLE DROPDOWN - Handles alt title selection
// ============================================================================

type JobTitleDropdownProps = {
  altTitles: string[];
  jobName: string;
  selectedTitle: string;
};

const JobTitleDropdown: FC<JobTitleDropdownProps> = ({
  altTitles,
  jobName,
  selectedTitle,
}) => {
  const { act } = useBackend<PreferencesMenuData>();

  const handleSelect = useCallback(
    (value: string) => {
      act('set_job_title', { job: jobName, new_title: value });
    },
    [act, jobName],
  );

  return (
    <Dropdown
      width="auto"
      options={altTitles}
      displayText={selectedTitle}
      onSelected={handleSelect}
    />
  );
};

// ============================================================================
// JOB ROW - Individual job entry
// ============================================================================

type JobRowProps = {
  departmentColor: string;
  departmentHead?: string;
  job: Job;
  jobName: string;
};

const JobRow: FC<JobRowProps> = ({
  departmentColor,
  departmentHead,
  job,
  jobName,
}) => {
  const { data } = useBackend<PreferencesMenuData>();

  const isHead = jobName === departmentHead;
  const isOverflow = data.overflow_role === jobName;
  const priority = data.job_preferences[jobName] || null;

  // Employer compatibility check
  const selectedEmployer = data.character_preferences?.misc?.employer;
  const jobEmployers = job.employers || [];
  const isEmployerCompatible =
    !selectedEmployer ||
    selectedEmployer === 'None' ||
    jobEmployers.includes(selectedEmployer);

  // Alt titles
  const altTitles = useMemo(() => {
    if (!Array.isArray(job.alt_titles)) return null;
    const filtered = job.alt_titles.filter(
      (t) => typeof t === 'string' && t.length > 0,
    );
    return filtered.length > 0 ? filtered : null;
  }, [job.alt_titles]);

  const selectedAltTitle = useMemo(() => {
    if (!altTitles) return jobName;
    const saved = data.job_alt_titles[jobName];
    return altTitles.includes(saved) ? saved : altTitles[0];
  }, [altTitles, data.job_alt_titles, jobName]);

  // Availability checks
  const experienceNeeded = data.job_required_experience?.[jobName] || null;
  const daysLeft = data.job_days_left?.[jobName] || 0;
  const isBanned = data.job_bans?.includes(jobName) || false;

  const isUnavailable =
    !isEmployerCompatible || !!experienceNeeded || daysLeft > 0 || isBanned;

  // Build status message
  let statusMessage: ReactNode = null;
  if (!isEmployerCompatible) {
    statusMessage = (
      <Box color="label" italic>
        Wrong Employer
      </Box>
    );
  } else if (isBanned) {
    statusMessage = (
      <Box color="bad" italic>
        Banned
      </Box>
    );
  } else if (daysLeft > 0) {
    statusMessage = (
      <Box color="label" italic>
        {daysLeft} day{daysLeft === 1 ? '' : 's'} left
      </Box>
    );
  } else if (experienceNeeded) {
    const hoursNeeded = Math.ceil(experienceNeeded.required_playtime / 60);
    statusMessage = (
      <Box color="label" italic>
        {hoursNeeded}h as {experienceNeeded.experience_type}
      </Box>
    );
  }

  return (
    <Box
      style={{
        padding: '0.6rem 0.75rem',
        marginBottom: '0.35rem',
        background: isHead
          ? `linear-gradient(135deg, ${departmentColor}40, ${departmentColor}20)`
          : 'rgba(0, 0, 0, 0.3)',
        border: isHead
          ? `2px solid ${departmentColor}`
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: isHead
          ? `4px solid ${departmentColor}`
          : `3px solid ${departmentColor}60`,
        borderRadius: '6px',
        opacity: isUnavailable ? '0.5' : '1',
        transition: 'all 0.2s ease',
      }}
    >
      <Stack align="center">
        {/* Job Name / Alt Title Dropdown */}
        <Stack.Item grow>
          <Box
            style={{
              fontWeight: isHead ? 'bold' : 'normal',
              fontSize: isHead ? '0.95rem' : '0.85rem',
              color: isHead ? departmentColor : '#fff',
            }}
          >
            {altTitles ? (
              <JobTitleDropdown
                altTitles={altTitles}
                jobName={jobName}
                selectedTitle={selectedAltTitle}
              />
            ) : (
              <span title={job.description}>{jobName}</span>
            )}
          </Box>
          {job.description && altTitles && (
            <Box
              style={{
                fontSize: '0.7rem',
                opacity: '0.6',
                marginTop: '0.1rem',
              }}
            >
              {job.description}
            </Box>
          )}
        </Stack.Item>

        {/* Right side: Status or Priority buttons */}
        <Stack.Item>
          {statusMessage || (
            <PrioritySelector
              priority={priority}
              isOverflow={isOverflow}
              jobName={jobName}
              disabled={isUnavailable}
            />
          )}
        </Stack.Item>
      </Stack>
    </Box>
  );
};

// ============================================================================
// DEPARTMENT SECTION - Collapsible group of jobs
// ============================================================================

type DepartmentSectionProps = {
  departmentId: string;
};

const DepartmentSection: FC<DepartmentSectionProps> = ({ departmentId }) => {
  const [isOpen, setIsOpen] = useLocalState(
    `sr_career_dept_${departmentId}`,
    true,
  );

  const deptInfo = DEPARTMENTS[departmentId] || {
    name: departmentId,
    icon: 'briefcase',
    color: '#9e9e9e',
  };

  return (
    <ServerPreferencesFetcher
      render={(serverData) => {
        if (!serverData?.jobs) return null;

        const { departments, jobs } = serverData.jobs;
        const department = departments[departmentId];
        if (!department) return null;

        const jobsForDept = sortJobs(
          Object.entries(jobs).filter(
            ([, job]) => job.department === departmentId,
          ),
          department.head,
        );

        if (jobsForDept.length === 0) return null;

        return (
          <Box mb={1}>
            {/* Department Header */}
            <Box
              onClick={() => setIsOpen(!isOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.6rem 0.75rem',
                background: `linear-gradient(135deg, ${deptInfo.color}20, rgba(0, 0, 0, 0.4))`,
                borderLeft: `4px solid ${deptInfo.color}`,
                borderRadius: isOpen ? '6px 6px 0 0' : '6px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Box
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: `${deptInfo.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.5rem',
                }}
              >
                <Icon
                  name={deptInfo.icon}
                  style={{ color: deptInfo.color, fontSize: '0.9rem' }}
                />
              </Box>
              <Box
                style={{
                  fontWeight: 'bold',
                  flex: '1',
                  color: deptInfo.color,
                }}
              >
                {deptInfo.name}
              </Box>
              <Box
                style={{
                  fontSize: '0.75rem',
                  opacity: '0.6',
                  marginRight: '0.5rem',
                }}
              >
                {jobsForDept.length} position{jobsForDept.length !== 1 && 's'}
              </Box>
              <Icon
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                style={{ color: deptInfo.color }}
              />
            </Box>

            {/* Jobs List */}
            {isOpen && (
              <Box
                style={{
                  padding: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '0 0 6px 6px',
                  borderLeft: `4px solid ${deptInfo.color}40`,
                }}
              >
                {jobsForDept.map(([name, job]) => (
                  <JobRow
                    key={name}
                    jobName={name}
                    job={job}
                    departmentColor={deptInfo.color}
                    departmentHead={department.head}
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      }}
    />
  );
};

// ============================================================================
// FALLBACK ROLE SELECTOR
// ============================================================================

const FallbackRoleSelector: FC = () => {
  const { act, data } = useBackend<PreferencesMenuData>();
  const selected = data.character_preferences?.misc?.joblessrole;

  const options = useMemo(
    () => [
      {
        displayText: `Deploy as ${data.overflow_role} if unavailable`,
        value: JoblessRole.BeOverflow,
      },
      {
        displayText: 'Deploy as random assignment if unavailable',
        value: JoblessRole.BeRandomJob,
      },
      {
        displayText: 'Return to decker terminal if unavailable',
        value: JoblessRole.ReturnToLobby,
      },
    ],
    [data.overflow_role],
  );

  const selectedOption =
    options.find((opt) => opt.value === selected) || options[0];

  const handleSelect = useCallback(
    (value: number) => {
      createSetPreference(act, 'joblessrole')(value);
    },
    [act],
  );

  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${CAREER_ACCENT_DIM}, rgba(0, 0, 0, 0.3))`,
        border: `1px solid ${CAREER_ACCENT_BORDER}`,
        borderRadius: '6px',
        padding: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      <Stack align="center">
        <Stack.Item>
          <Icon name="random" size={1.2} color={CAREER_ACCENT} />
        </Stack.Item>
        <Stack.Item grow>
          <Box style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Fallback Assignment
          </Box>
          <Box style={{ fontSize: '0.8rem', opacity: '0.7' }}>
            What happens if your preferred job is unavailable?
          </Box>
        </Stack.Item>
        <Stack.Item basis="40%">
          <Dropdown
            width="100%"
            options={options}
            displayText={selectedOption.displayText}
            onSelected={handleSelect}
          />
        </Stack.Item>
      </Stack>
    </Box>
  );
};

// ============================================================================
// PRIORITY LEGEND
// ============================================================================

const PriorityLegend: FC = () => {
  const items = [
    { color: '#78909c', label: 'Off', icon: 'times' },
    { color: '#ef5350', label: 'Low', icon: 'arrow-down' },
    { color: '#fdd835', label: 'Medium', icon: 'minus' },
    { color: '#66bb6a', label: 'High', icon: 'arrow-up' },
  ];

  return (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: '6px',
        padding: '0.6rem 1rem',
        marginBottom: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Stack justify="center" align="center">
        <Stack.Item>
          <Box
            style={{
              fontSize: '0.75rem',
              opacity: '0.6',
              marginRight: '1rem',
            }}
          >
            Priority:
          </Box>
        </Stack.Item>
        {items.map(({ color, label, icon }) => (
          <Stack.Item key={label}>
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '1.25rem',
                padding: '0.25rem 0.5rem',
                background: `${color}20`,
                borderRadius: '4px',
                border: `1px solid ${color}40`,
              }}
            >
              <Box
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.4rem',
                  boxShadow: `0 0 6px ${color}66`,
                }}
              >
                <Icon
                  name={icon}
                  style={{ color: '#fff', fontSize: '0.6rem' }}
                />
              </Box>
              <Box style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                {label}
              </Box>
            </Box>
          </Stack.Item>
        ))}
      </Stack>
    </Box>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export type CareerSectionProps = {
  isSaved?: boolean;
};

export const CareerSection: FC<CareerSectionProps> = () => {
  const [activeTab, setActiveTab] = useLocalState<'corporate' | 'independent'>(
    'sr_career_active_tab',
    'corporate',
  );

  const departments =
    activeTab === 'corporate' ? CORPORATE_DEPTS : INDEPENDENT_DEPTS;

  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${CAREER_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
        borderRadius: '8px',
        border: `1px solid ${CAREER_ACCENT_BORDER}`,
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
          background: `linear-gradient(135deg, transparent 50%, ${CAREER_ACCENT_DIM} 50%)`,
          opacity: '0.5',
        }}
      />

      {/* Header */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: `2px solid ${CAREER_ACCENT}`,
        }}
      >
        <Icon
          name="id-badge"
          style={{ color: CAREER_ACCENT, fontSize: '1.3rem' }}
        />
        <Box
          style={{
            marginLeft: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: CAREER_ACCENT,
          }}
        >
          Career Selection
        </Box>
        <Box style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: '0.7' }}>
          Select your preferred assignments
        </Box>
      </Box>

      {/* Fallback Role */}
      <FallbackRoleSelector />

      {/* Legend */}
      <PriorityLegend />

      {/* Tab Buttons */}
      <Box
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <Box
          onClick={() => setActiveTab('corporate')}
          style={{
            flex: '1',
            padding: '0.6rem 1rem',
            background:
              activeTab === 'corporate'
                ? `linear-gradient(135deg, ${CAREER_ACCENT}40, ${CAREER_ACCENT}20)`
                : 'rgba(0, 0, 0, 0.3)',
            border:
              activeTab === 'corporate'
                ? `2px solid ${CAREER_ACCENT}`
                : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: activeTab === 'corporate' ? 'bold' : 'normal',
            color: activeTab === 'corporate' ? CAREER_ACCENT : '#fff',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon name="building" style={{ marginRight: '0.5rem' }} />
          Corporate Divisions
        </Box>
        <Box
          onClick={() => setActiveTab('independent')}
          style={{
            flex: '1',
            padding: '0.6rem 1rem',
            background:
              activeTab === 'independent'
                ? `linear-gradient(135deg, ${CAREER_ACCENT}40, ${CAREER_ACCENT}20)`
                : 'rgba(0, 0, 0, 0.3)',
            border:
              activeTab === 'independent'
                ? `2px solid ${CAREER_ACCENT}`
                : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: activeTab === 'independent' ? 'bold' : 'normal',
            color: activeTab === 'independent' ? CAREER_ACCENT : '#fff',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon name="users" style={{ marginRight: '0.5rem' }} />
          External Services
        </Box>
      </Box>

      {/* Department List */}
      <Box
        style={{
          maxHeight: '500px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
          padding: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {departments.map((deptId) => (
          <DepartmentSection key={deptId} departmentId={deptId} />
        ))}
      </Box>
    </Box>
  );
};

export default CareerSection;
