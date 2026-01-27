/**
 * Shared UI components for Shadowrun character generation
 */

import { memo, useEffect, useRef, useState } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Icon } from '../../../components';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clamps a value between a minimum and maximum
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

// ============================================================================
// ANIMATED NUMBER COMPONENT
// ============================================================================

export type AnimatedNumberProps = {
  /** Number of decimal places to show */
  decimals?: number;
  /** Duration of animation in milliseconds */
  duration?: number;
  /** Format function for the display value */
  format?: (value: number) => string;
  /** Optional prefix (e.g., "¥" for nuyen) */
  prefix?: string;
  /** Optional suffix (e.g., " pts") */
  suffix?: string;
  /** The value to display */
  value: number;
};

/**
 * Animated number display that smoothly transitions between values.
 * Uses CSS transitions for the visual effect and requestAnimationFrame
 * for counting animation.
 *
 * @example
 * <AnimatedNumber value={skillPoints} suffix=" pts" />
 * <AnimatedNumber value={nuyen} prefix="¥" format={(n) => n.toLocaleString()} />
 */
export const AnimatedNumber = memo((props: AnimatedNumberProps) => {
  const {
    value,
    duration = 300,
    decimals = 0,
    prefix = '',
    suffix = '',
    format,
  } = props;

  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Don't animate on initial mount
    if (previousValue.current === value) return;

    const startValue = previousValue.current;
    const endValue = value;
    const diff = endValue - startValue;
    const startTime = performance.now();

    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + diff * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        previousValue.current = endValue;
      }
    };

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Determine color flash based on direction
  const isIncreasing = value > previousValue.current;
  const isDecreasing = value < previousValue.current;

  // Format the display value
  const formattedValue = format
    ? format(displayValue)
    : decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toString();

  return (
    <span
      className={`AnimatedNumber ${isAnimating ? 'AnimatedNumber--animating' : ''} ${
        isAnimating && isIncreasing
          ? 'AnimatedNumber--increasing'
          : isAnimating && isDecreasing
            ? 'AnimatedNumber--decreasing'
            : ''
      }`}
      style={{
        transition: 'color 0.15s ease-out',
        color: isAnimating
          ? isIncreasing
            ? '#4caf50'
            : isDecreasing
              ? '#ff6b6b'
              : undefined
          : undefined,
      }}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
});

// ============================================================================
// ANIMATED RESOURCE INDICATOR
// ============================================================================

export type AnimatedResourceProps = {
  /** Whether to show color coding based on remaining */
  colorCode?: boolean;
  /** Format function for values */
  format?: (value: number) => string;
  /** Icon name */
  icon?: string;
  /** Resource label */
  label: string;
  /** Maximum/total value */
  max: number;
  /** Amount remaining (calculated as max - spent) */
  remaining?: number;
  /** Whether to show remaining amount */
  showRemaining?: boolean;
  /** Amount spent/used */
  spent: number;
  /** Unit suffix (e.g., " pts", " ¥") */
  unit?: string;
};

/**
 * Resource indicator with animated values.
 * Shows spent/max with optional remaining and color coding.
 */
export const AnimatedResource = memo((props: AnimatedResourceProps) => {
  const {
    label,
    spent,
    max,
    remaining = max - spent,
    icon,
    unit = '',
    showRemaining = true,
    colorCode = true,
    format = (n) => n.toLocaleString(),
  } = props;

  const isOver = remaining < 0;
  const isExact = remaining === 0;

  const color = colorCode
    ? isOver
      ? '#ff6b6b'
      : isExact
        ? '#4caf50'
        : '#9b8fc7'
    : undefined;

  return (
    <Box
      style={{
        fontSize: '0.9rem',
        color,
      }}
    >
      {icon && <Icon name={icon} mr={0.5} />}
      {label}:{' '}
      <b>
        <AnimatedNumber value={spent} format={format} />
      </b>
      /{format(max)}
      {unit}
      {showRemaining && remaining > 0 && (
        <Box as="span" style={{ opacity: '0.6', marginLeft: '0.3rem' }}>
          — <AnimatedNumber value={remaining} format={format} />
          {unit} left
        </Box>
      )}
    </Box>
  );
});

// ============================================================================
// DASHBOARD TILE
// ============================================================================

// Color constants for dashboard tiles (matching AugmentsSection)
const TILE_COLORS = {
  essence: { primary: '#26c6da', dim: 'rgba(38, 198, 218, 0.15)' },
  karma: { primary: '#ffc107', dim: 'rgba(255, 193, 7, 0.15)' },
  nuyen: { primary: '#ffd700', dim: 'rgba(255, 215, 0, 0.15)' },
  warning: { primary: '#ff9800', dim: 'rgba(255, 152, 0, 0.15)' },
  danger: { primary: '#ff6b6b', dim: 'rgba(255, 107, 107, 0.15)' },
  success: { primary: '#4caf50', dim: 'rgba(76, 175, 80, 0.15)' },
} as const;

export type DashboardTileProps = {
  colorType?: 'physical' | 'mental' | 'special' | 'resources';
  icon: string;
  label: string;
  /** Current value for progress calculation */
  progressCurrent?: number;
  /** Maximum value for progress calculation */
  progressMax?: number;
  /** Whether to show progress bar */
  showProgress?: boolean;
  status?: 'good' | 'bad' | 'warn' | 'neutral';
  subtext?: string;
  tooltip?: string;
  value: string | number;
};

export const DashboardTile = (props: DashboardTileProps) => {
  const {
    icon,
    label,
    value,
    subtext,
    colorType,
    status,
    tooltip,
    showProgress = false,
    progressCurrent = 0,
    progressMax = 100,
  } = props;

  // Calculate progress percentage
  const progressPercent =
    progressMax > 0
      ? Math.max(0, Math.min((progressCurrent / progressMax) * 100, 100))
      : 0;

  // Determine color based on status and colorType
  const getProgressColor = () => {
    if (status === 'bad') return TILE_COLORS.danger.primary;
    if (status === 'warn') return TILE_COLORS.warning.primary;
    if (colorType === 'special') return TILE_COLORS.essence.primary;
    if (colorType === 'resources') return TILE_COLORS.nuyen.primary;
    if (colorType === 'mental') return TILE_COLORS.karma.primary;
    return TILE_COLORS.success.primary;
  };

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
    status === 'warn'
      ? 'PreferencesMenu__ShadowrunSheet__dashboardTile--warn'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const progressColor = getProgressColor();

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
      {showProgress && (
        <Box
          className="PreferencesMenu__ShadowrunSheet__dashboardTile__progressBar"
          style={{
            marginTop: '0.4rem',
            height: '4px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${progressColor}, ${progressColor}aa)`,
              transition: 'width 0.3s ease, background 0.3s ease',
              boxShadow: `0 0 4px ${progressColor}66`,
            }}
          />
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

// ============================================================================
// VALIDATION BADGE
// ============================================================================

export type ValidationBadgeProps = {
  status: 'good' | 'bad' | 'warn' | 'info' | 'none';
};

export const ValidationBadge = (props: ValidationBadgeProps) => {
  const { status } = props;

  if (status === 'none') {
    return null;
  }

  const icon =
    status === 'good'
      ? 'check'
      : status === 'bad'
        ? 'exclamation'
        : status === 'info'
          ? 'info-circle'
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

// ============================================================================
// INLINE FIELD VALIDATION
// ============================================================================

import type {
  ValidationField,
  ValidationIssue,
  ValidationSeverity,
} from './types';

export type FieldValidationProps = {
  /** Compact mode (icon only, hover for details) */
  compact?: boolean;
  /** The field to show validation for */
  field: ValidationField;
  /** Issues for this specific field (pass from issuesByField) */
  issues?: ValidationIssue[];
  /** Show only the most severe issue */
  showOnlyMostSevere?: boolean;
};

/**
 * Inline validation indicator for a specific field.
 * Shows validation status next to any input/selector.
 *
 * @example
 * <Stack align="center">
 *   <SkillInput skillId="firearms" />
 *   <FieldValidation
 *     field="skill_firearms"
 *     issues={validation.issuesByField['skill_firearms']}
 *   />
 * </Stack>
 */
export const FieldValidation = memo((props: FieldValidationProps) => {
  const {
    field,
    issues = [],
    showOnlyMostSevere = true,
    compact = false,
  } = props;

  if (issues.length === 0) {
    return null;
  }

  // Sort by severity: error > warning > info
  const severityOrder: Record<ValidationSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };

  const sortedIssues = [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  const displayIssues = showOnlyMostSevere ? [sortedIssues[0]] : sortedIssues;

  const mostSeverity = sortedIssues[0].severity;

  const iconName =
    mostSeverity === 'error'
      ? 'times-circle'
      : mostSeverity === 'warning'
        ? 'exclamation-triangle'
        : 'info-circle';

  const color =
    mostSeverity === 'error'
      ? '#ff6b6b'
      : mostSeverity === 'warning'
        ? '#ffc107'
        : '#64b5f6';

  if (compact) {
    // Compact mode: just icon with tooltip
    const tooltipContent = displayIssues.map((i) => i.message).join('\n');

    return (
      <Tooltip content={tooltipContent} position="right">
        <Box as="span" style={{ color, marginLeft: '0.25rem' }}>
          <Icon name={iconName} />
        </Box>
      </Tooltip>
    );
  }

  // Full mode: show messages
  return (
    <Box
      style={{
        marginTop: '0.25rem',
        fontSize: '0.8rem',
      }}
    >
      {displayIssues.map((issue, index) => (
        <Box
          key={`${field}-${index}`}
          style={{
            color,
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '0.15rem',
          }}
        >
          <Icon
            name={iconName}
            style={{ marginRight: '0.3rem', marginTop: '0.1rem' }}
          />
          <Box>
            {issue.message}
            {issue.suggestion && (
              <Box style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                {issue.suggestion}
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
});

// ============================================================================
// VALIDATION SUMMARY PANEL
// ============================================================================

export type ValidationSummaryProps = {
  /** Filter to show only certain sections */
  filterSections?: string[];
  /** Callback when clicking an issue (for navigation) */
  onIssueClick?: (issue: ValidationIssue) => void;
  /** Show info-level issues */
  showInfo?: boolean;
  /** The validation result */
  validation: ValidationResult;
};

/**
 * Summary panel showing all validation issues.
 * Can be filtered by section and supports click-to-navigate.
 */
export const ValidationSummary = memo((props: ValidationSummaryProps) => {
  const { validation, filterSections, showInfo = true, onIssueClick } = props;

  let issues = validation.issues;

  // Filter by sections if specified
  if (filterSections && filterSections.length > 0) {
    issues = issues.filter((i) => filterSections.includes(i.section));
  }

  // Optionally hide info-level issues
  if (!showInfo) {
    issues = issues.filter((i) => i.severity !== 'info');
  }

  if (issues.length === 0) {
    return (
      <Box
        style={{
          padding: '1rem',
          textAlign: 'center',
          color: '#4caf50',
        }}
      >
        <Icon name="check-circle" size={1.5} />
        <Box mt={0.5}>No validation issues</Box>
      </Box>
    );
  }

  // Group by severity
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  return (
    <Box style={{ padding: '0.5rem' }}>
      {/* Errors */}
      {errors.length > 0 && (
        <ValidationIssueGroup
          title="Errors"
          icon="times-circle"
          color="#ff6b6b"
          issues={errors}
          onIssueClick={onIssueClick}
        />
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <ValidationIssueGroup
          title="Warnings"
          icon="exclamation-triangle"
          color="#ffc107"
          issues={warnings}
          onIssueClick={onIssueClick}
        />
      )}

      {/* Info */}
      {showInfo && infos.length > 0 && (
        <ValidationIssueGroup
          title="Suggestions"
          icon="info-circle"
          color="#64b5f6"
          issues={infos}
          onIssueClick={onIssueClick}
        />
      )}
    </Box>
  );
});

type ValidationIssueGroupProps = {
  color: string;
  icon: string;
  issues: ValidationIssue[];
  onIssueClick?: (issue: ValidationIssue) => void;
  title: string;
};

const ValidationIssueGroup = memo((props: ValidationIssueGroupProps) => {
  const { title, icon, color, issues, onIssueClick } = props;

  return (
    <Box mb={0.5}>
      <Box
        style={{
          color,
          fontWeight: 'bold',
          fontSize: '0.85rem',
          marginBottom: '0.25rem',
        }}
      >
        <Icon name={icon} mr={0.3} />
        {title} ({issues.length})
      </Box>
      {issues.map((issue, index) => (
        <Box
          key={`${issue.section}-${index}`}
          style={{
            padding: '0.3rem 0.5rem',
            marginBottom: '0.15rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '3px',
            borderLeft: `3px solid ${color}`,
            cursor: onIssueClick ? 'pointer' : undefined,
          }}
          onClick={() => onIssueClick?.(issue)}
        >
          <Box style={{ fontSize: '0.85rem' }}>{issue.message}</Box>
          {issue.suggestion && (
            <Box
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginTop: '0.1rem',
              }}
            >
              💡 {issue.suggestion}
            </Box>
          )}
          {issue.relatedItems && issue.relatedItems.length > 0 && (
            <Box
              style={{
                fontSize: '0.7rem',
                opacity: 0.6,
                marginTop: '0.1rem',
              }}
            >
              Related: {issue.relatedItems.join(', ')}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
});

// ============================================================================
// PROGRESS BAR
// ============================================================================

export type ProgressBarProps = {
  max: number;
  value: number;
};

export const ProgressBar = (props: ProgressBarProps) => {
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

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

export type CollapsibleSectionProps = {
  badge?: 'good' | 'bad' | 'warn' | 'none';
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  stateKey: string;
  title: string;
};

export const CollapsibleSection = (props: CollapsibleSectionProps) => {
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

// ============================================================================
// HINTED LABEL
// ============================================================================

export type HintedLabelProps = {
  hint: string;
  text: string;
};

export const HintedLabel = (props: HintedLabelProps) => {
  const { text, hint } = props;

  return (
    <Tooltip content={hint} position="bottom">
      <Box as="span" style={{ cursor: 'help' }}>
        {text}
      </Box>
    </Tooltip>
  );
};

// ============================================================================
// FIELD HINTS
// ============================================================================

export const FIELD_HINTS = {
  SINTab:
    'System Identification Number - Your legal identity in the Sixth World. Contains personal information and determines your legal status.',
  AugmentsTab:
    'Cybernetic and biological enhancements. Higher grades cost more but reduce essence loss.',
  JobsTab:
    'Your starting occupation determines your role and access aboard the station.',
  LifestyleSection:
    'Your lifestyle determines your standard of living, from Street (survival mode) to Luxury (corporate elite).',
  GenderField:
    'Gender identity for your character. Affects pronouns and some social interactions.',
  EmployerField:
    'Your corporate or organizational affiliation. May affect job availability and social standing.',
  AgeField: 'Character age. Different metatypes have different lifespans.',
  DominantHandField:
    'Your dominant hand. Some equipment and actions may reference this.',
  SINStatusField:
    'Your SIN status determines your legal standing. Fake SINs provide anonymity but risk exposure.',
  BirthplaceField:
    'Where your character was born. Affects cultural background and potential contacts.',
  ReligionField:
    'Religious affiliation, if any. May affect roleplay and certain social interactions.',
};

// ============================================================================
// ATTRIBUTE DESCRIPTIONS
// ============================================================================

export const ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
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

export const getAttributeDescription = (
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

// ============================================================================
// GROUPED TABS
// ============================================================================

import { Tabs } from '../../../components';
import {
  getTabGroup,
  ShadowrunTab,
  TAB_DISPLAY_INFO,
  TAB_GROUPS,
  type TabGroupDefinition,
} from './TabContentRouter';
import type { ValidationResult } from './types';

export type GroupedTabsProps = {
  currentTab: ShadowrunTab;
  isSaved: boolean;
  onTabChange: (tab: ShadowrunTab) => void;
  validation: ValidationResult;
};

/**
 * Grouped tab navigation with visual hierarchy.
 * Groups tabs into logical categories (Character, Equipment, Social, Summary).
 * Applies category-specific accent colors to tabs.
 */
export const GroupedTabs = (props: GroupedTabsProps) => {
  const { currentTab, onTabChange, validation, isSaved } = props;
  const currentGroup = getTabGroup(currentTab);

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__groupedTabs">
      {/* Group Headers */}
      <Box className="PreferencesMenu__ShadowrunSheet__tabGroups">
        {TAB_GROUPS.map((group) => (
          <GroupHeader
            key={group.id}
            group={group}
            isActive={currentGroup?.id === group.id}
            onSelect={() => onTabChange(group.tabs[0])}
          />
        ))}
      </Box>

      {/* Active Group's Tabs */}
      {currentGroup && (
        <Tabs fluid className="PreferencesMenu__ShadowrunSheet__tabs">
          {currentGroup.tabs.map((tab) => {
            const info = TAB_DISPLAY_INFO[tab];
            const hasError = validation.issues.some(
              (i) => getTabSection(tab) === i.section && i.severity === 'error',
            );
            const hasWarning = validation.issues.some(
              (i) => getTabSection(tab) === i.section,
            );
            const isSelected = currentTab === tab;

            return (
              <Tabs.Tab
                key={tab}
                icon={info.icon}
                selected={isSelected}
                onClick={() => onTabChange(tab)}
                rightSlot={
                  <ValidationBadge
                    status={
                      hasError
                        ? 'bad'
                        : isSaved
                          ? 'good'
                          : hasWarning
                            ? 'warn'
                            : 'none'
                    }
                  />
                }
                style={
                  isSelected
                    ? {
                        borderColor: info.accentColor,
                        borderBottomWidth: '3px',
                      }
                    : undefined
                }
              >
                <span
                  style={
                    isSelected
                      ? { color: info.accentColor }
                      : { transition: 'color 0.15s ease' }
                  }
                >
                  <HintedLabel text={info.label} hint={info.hint} />
                </span>
              </Tabs.Tab>
            );
          })}
        </Tabs>
      )}
    </Box>
  );
};

/**
 * Header button for a tab group.
 */
type GroupHeaderProps = {
  group: TabGroupDefinition;
  isActive: boolean;
  onSelect: () => void;
};

const GroupHeader = (props: GroupHeaderProps) => {
  const { group, isActive, onSelect } = props;

  return (
    <Box
      className={`PreferencesMenu__ShadowrunSheet__groupHeader ${
        isActive ? 'PreferencesMenu__ShadowrunSheet__groupHeader--active' : ''
      }`}
      onClick={onSelect}
    >
      <Icon name={group.icon} mr={0.5} />
      {group.name}
    </Box>
  );
};

/**
 * Map tabs to their validation sections.
 */
function getTabSection(tab: ShadowrunTab): string | null {
  switch (tab) {
    case ShadowrunTab.Build:
      return 'attributes'; // Also covers skills, special
    case ShadowrunTab.Magic:
      return 'magic';
    case ShadowrunTab.Augments:
      return 'augments';
    default:
      return null;
  }
}

// ============================================================================
// BREADCRUMB NAVIGATION
// ============================================================================

export type BreadcrumbSegment = {
  icon?: string;
  label: string;
  onClick?: () => void;
};

export type BreadcrumbNavProps = {
  segments: BreadcrumbSegment[];
};

/**
 * Breadcrumb navigation showing the current location path.
 * Displays: "Group > Tab > Section" with clickable segments.
 *
 * @example
 * <BreadcrumbNav segments={[
 *   { label: 'Character', icon: 'user', onClick: () => setGroup('character') },
 *   { label: 'Build', icon: 'sliders-h', onClick: () => setTab('build') },
 *   { label: 'Skills', icon: 'book' },
 * ]} />
 */
export const BreadcrumbNav = (props: BreadcrumbNavProps) => {
  const { segments } = props;

  if (segments.length === 0) {
    return null;
  }

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__breadcrumb">
      {segments.map((segment, index) => (
        <span
          key={index}
          className="PreferencesMenu__ShadowrunSheet__breadcrumb__segment"
        >
          {index > 0 && (
            <Icon
              name="chevron-right"
              size={0.8}
              className="PreferencesMenu__ShadowrunSheet__breadcrumb__separator"
            />
          )}
          <span
            className={`PreferencesMenu__ShadowrunSheet__breadcrumb__item ${
              segment.onClick
                ? 'PreferencesMenu__ShadowrunSheet__breadcrumb__item--clickable'
                : ''
            }`}
            onClick={segment.onClick ? () => segment.onClick?.() : undefined}
          >
            {segment.icon && <Icon name={segment.icon} mr={0.3} />}
            {segment.label}
          </span>
        </span>
      ))}
    </Box>
  );
};

export type CurrentLocationProps = {
  currentTab: ShadowrunTab;
  onGroupClick?: (groupId: string) => void;
  onTabClick?: (tab: ShadowrunTab) => void;
  subSection?: string;
};

/**
 * Pre-built breadcrumb showing current tab location.
 * Automatically builds the path from group → tab → subsection.
 */
export const CurrentLocation = (props: CurrentLocationProps) => {
  const { currentTab, subSection, onGroupClick, onTabClick } = props;
  const group = getTabGroup(currentTab);
  const tabInfo = TAB_DISPLAY_INFO[currentTab];

  const segments: BreadcrumbSegment[] = [];

  // Add group
  if (group) {
    segments.push({
      label: group.name,
      icon: group.icon,
      onClick: onGroupClick ? () => onGroupClick(group.id) : undefined,
    });
  }

  // Add tab
  if (tabInfo) {
    segments.push({
      label: tabInfo.label,
      icon: tabInfo.icon,
      onClick: onTabClick ? () => onTabClick(currentTab) : undefined,
    });
  }

  // Add subsection if provided
  if (subSection) {
    segments.push({
      label: subSection,
    });
  }

  return <BreadcrumbNav segments={segments} />;
};

// ============================================================================
// UNDO/REDO CONTROLS COMPONENT
// ============================================================================

export type UndoRedoControlsProps = {
  /** Whether redo is available */
  canRedo: boolean;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether to show compact version (icons only) */
  compact?: boolean;
  /** Number of redo steps available */
  futureCount?: number;
  /** Number of undo steps available */
  historyCount?: number;
  /** Label for the last change (undo tooltip) */
  lastChangeLabel?: string;
  /** Label for the next redo (redo tooltip) */
  nextRedoLabel?: string;
  /** Called when redo button is clicked */
  onRedo: () => void;
  /** Called when undo button is clicked */
  onUndo: () => void;
  /** Whether the character is saved (disable undo/redo when saved) */
  saved?: boolean;
};

/**
 * Undo/Redo control buttons with tooltips and keyboard shortcut hints.
 *
 * @example
 * // Full version with labels
 * <UndoRedoControls
 *   canUndo={undoRedo.canUndo}
 *   canRedo={undoRedo.canRedo}
 *   onUndo={actions.undo}
 *   onRedo={actions.redo}
 *   lastChangeLabel={undoRedo.lastChangeLabel}
 *   nextRedoLabel={undoRedo.nextRedoLabel}
 * />
 *
 * // Compact version (icons only)
 * <UndoRedoControls compact {...undoRedoProps} />
 */
export const UndoRedoControls = memo((props: UndoRedoControlsProps) => {
  const {
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    lastChangeLabel,
    nextRedoLabel,
    historyCount = 0,
    futureCount = 0,
    compact = false,
    saved = false,
  } = props;

  // Build tooltip content
  const undoTooltip = canUndo
    ? `Undo${lastChangeLabel ? `: ${lastChangeLabel}` : ''} (Ctrl+Z)${historyCount > 1 ? ` [${historyCount} more]` : ''}`
    : 'Nothing to undo';

  const redoTooltip = canRedo
    ? `Redo${nextRedoLabel ? `: ${nextRedoLabel}` : ''} (Ctrl+Y)${futureCount > 1 ? ` [${futureCount} more]` : ''}`
    : 'Nothing to redo';

  // Disable when saved
  const undoDisabled = !canUndo || saved;
  const redoDisabled = !canRedo || saved;

  if (compact) {
    return (
      <Box inline className="PreferencesMenu__ShadowrunSheet__undoredo">
        <Tooltip content={undoTooltip}>
          <Box
            as="span"
            className={`PreferencesMenu__ShadowrunSheet__undoredo__btn ${
              undoDisabled
                ? 'PreferencesMenu__ShadowrunSheet__undoredo__btn--disabled'
                : ''
            }`}
            onClick={undoDisabled ? undefined : onUndo}
          >
            <Icon name="undo" />
          </Box>
        </Tooltip>
        <Tooltip content={redoTooltip}>
          <Box
            as="span"
            className={`PreferencesMenu__ShadowrunSheet__undoredo__btn ${
              redoDisabled
                ? 'PreferencesMenu__ShadowrunSheet__undoredo__btn--disabled'
                : ''
            }`}
            onClick={redoDisabled ? undefined : onRedo}
          >
            <Icon name="redo" />
          </Box>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box className="PreferencesMenu__ShadowrunSheet__undoredo">
      <Tooltip content={undoTooltip}>
        <Box
          as="button"
          className={`PreferencesMenu__ShadowrunSheet__undoredo__button ${
            undoDisabled
              ? 'PreferencesMenu__ShadowrunSheet__undoredo__button--disabled'
              : ''
          }`}
          onClick={undoDisabled ? undefined : onUndo}
          disabled={undoDisabled}
        >
          <Icon name="undo" mr={0.5} />
          Undo
          {historyCount > 0 && (
            <Box as="span" ml={0.5} opacity={0.7}>
              ({historyCount})
            </Box>
          )}
        </Box>
      </Tooltip>
      <Tooltip content={redoTooltip}>
        <Box
          as="button"
          className={`PreferencesMenu__ShadowrunSheet__undoredo__button ${
            redoDisabled
              ? 'PreferencesMenu__ShadowrunSheet__undoredo__button--disabled'
              : ''
          }`}
          onClick={redoDisabled ? undefined : onRedo}
          disabled={redoDisabled}
        >
          <Icon name="redo" mr={0.5} />
          Redo
          {futureCount > 0 && (
            <Box as="span" ml={0.5} opacity={0.7}>
              ({futureCount})
            </Box>
          )}
        </Box>
      </Tooltip>
    </Box>
  );
});

UndoRedoControls.displayName = 'UndoRedoControls';
