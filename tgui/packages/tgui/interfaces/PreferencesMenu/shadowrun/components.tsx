/**
 * Shared UI components for Shadowrun character generation
 */

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
// DASHBOARD TILE
// ============================================================================

export type DashboardTileProps = {
  colorType?: 'physical' | 'mental' | 'special' | 'resources';
  icon: string;
  label: string;
  status?: 'good' | 'bad' | 'warn' | 'neutral';
  subtext?: string;
  tooltip?: string;
  value: string | number;
};

export const DashboardTile = (props: DashboardTileProps) => {
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

// ============================================================================
// VALIDATION BADGE
// ============================================================================

export type ValidationBadgeProps = {
  status: 'good' | 'bad' | 'warn' | 'none';
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
