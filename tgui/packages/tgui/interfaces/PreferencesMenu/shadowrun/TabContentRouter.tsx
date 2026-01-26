/**
 * Tab Content Router for Shadowrun Character Sheet
 *
 * Renders the appropriate content based on the selected tab.
 * This component moves conditional rendering logic out of the main component
 * to reduce complexity.
 *
 * Uses React.lazy() for heavy tab components to enable code-splitting.
 */

import { lazy, memo, ReactNode, Suspense } from 'react';

import { Box, Icon, Stack } from '../../../components';
import { QuirksPage } from '../QuirksPage';
import { AttributeSelector } from './AttributeSelector';
import { CareerSection } from './CareerSection';
import {
  CollapsibleSection,
  MetatypeSelectorProps,
  PrioritySelector,
} from './index';
import {
  ChargenConstData,
  ChargenState,
  DashboardData,
  DerivedStats,
  ValidationResult,
} from './types';

// ============================================================================
// LAZY-LOADED COMPONENTS (Code-split for better initial load)
// ============================================================================

// Heavy components are lazy-loaded to reduce initial bundle size
const LazyAugmentsSection = lazy(() =>
  import('./AugmentsSection').then((m) => ({ default: m.AugmentsSection })),
);
const LazyContactsSelector = lazy(() =>
  import('./ContactsSelector').then((m) => ({ default: m.ContactsSelector })),
);
const LazyCoreTabContent = lazy(() =>
  import('./CoreTabContent').then((m) => ({ default: m.CoreTabContent })),
);
const LazyDroneSection = lazy(() =>
  import('./DroneSection').then((m) => ({ default: m.DroneSection })),
);
const LazyGearSection = lazy(() =>
  import('./GearSection').then((m) => ({ default: m.GearSection })),
);
const LazyKnowledgeSkillsSelector = lazy(() =>
  import('./KnowledgeSkillsSelector').then((m) => ({
    default: m.KnowledgeSkillsSelector,
  })),
);
const LazyMagicSelector = lazy(() =>
  import('./MagicSelector').then((m) => ({ default: m.MagicSelector })),
);
const LazySkillsSection = lazy(() =>
  import('./SkillsSection').then((m) => ({ default: m.SkillsSection })),
);

// ============================================================================
// TYPES AND CONSTANTS
// ============================================================================

// Tab enum - must match the one in ShadowrunPage.tsx
export enum ShadowrunTab {
  Augments = 'augments',
  Build = 'build',
  Connections = 'connections',
  Core = 'core',
  Drones = 'drones',
  Gear = 'gear',
  Magic = 'magic',
  Occupations = 'occupations',
  Qualities = 'qualities',
  Summary = 'summary',
}

// Tab group definitions for organized navigation
export type TabGroupId = 'character' | 'equipment' | 'social' | 'summary';

export type TabGroupDefinition = {
  icon: string;
  id: TabGroupId;
  name: string;
  tabs: ShadowrunTab[];
};

/**
 * Tab group configuration - organizes tabs into logical categories.
 * This provides a cleaner navigation experience for complex character sheets.
 */
export const TAB_GROUPS: TabGroupDefinition[] = [
  {
    id: 'character',
    name: 'Character',
    icon: 'user',
    tabs: [ShadowrunTab.Build, ShadowrunTab.Core, ShadowrunTab.Magic],
  },
  {
    id: 'equipment',
    name: 'Equipment',
    icon: 'toolbox',
    tabs: [ShadowrunTab.Augments, ShadowrunTab.Gear, ShadowrunTab.Drones],
  },
  {
    id: 'social',
    name: 'Social',
    icon: 'users',
    tabs: [
      ShadowrunTab.Connections,
      ShadowrunTab.Qualities,
      ShadowrunTab.Occupations,
    ],
  },
  {
    id: 'summary',
    name: 'Summary',
    icon: 'clipboard-list',
    tabs: [ShadowrunTab.Summary],
  },
];

/**
 * Get display metadata for a specific tab.
 */
export type TabDisplayInfo = {
  /** Accent color for the tab (hex color) */
  accentColor: string;
  hint: string;
  icon: string;
  label: string;
};

/**
 * Category-specific accent colors for tabs.
 * These provide visual cues about the type of content.
 */
export const TAB_COLORS = {
  // Character building - blue tones
  build: '#4a90d9',
  core: '#5c6bc0',
  magic: '#9c27b0',

  // Equipment - gold/orange tones
  augments: '#ff7043',
  gear: '#ffc107',
  drones: '#8d6e63',

  // Social - green/teal tones
  connections: '#26a69a',
  qualities: '#66bb6a',
  occupations: '#78909c',

  // Summary - neutral
  summary: '#9b8fc7',
} as const;

export const TAB_DISPLAY_INFO: Record<ShadowrunTab, TabDisplayInfo> = {
  [ShadowrunTab.Build]: {
    icon: 'sliders-h',
    label: 'Build',
    hint: 'Set your priority selections, allocate attribute and skill points.',
    accentColor: TAB_COLORS.build,
  },
  [ShadowrunTab.Core]: {
    icon: 'id-card',
    label: 'SIN',
    hint: 'Your System Identification Number - the digital identity that defines who you are in the Sixth World.',
    accentColor: TAB_COLORS.core,
  },
  [ShadowrunTab.Magic]: {
    icon: 'hat-wizard',
    label: 'Magic',
    hint: 'Configure magical traditions, spells, adept powers, and mentor spirits for awakened characters.',
    accentColor: TAB_COLORS.magic,
  },
  [ShadowrunTab.Augments]: {
    icon: 'microchip',
    label: 'Augments',
    hint: 'Cyberware, bioware, and other bodily augmentations. Trade essence for capabilities.',
    accentColor: TAB_COLORS.augments,
  },
  [ShadowrunTab.Gear]: {
    icon: 'shopping-cart',
    label: 'Gear',
    hint: 'Purchase starting equipment with your nuyen. Weapons, armor, electronics, and more.',
    accentColor: TAB_COLORS.gear,
  },
  [ShadowrunTab.Drones]: {
    icon: 'robot',
    label: 'Drones',
    hint: 'Purchase and customize drones for surveillance, combat, and utility operations.',
    accentColor: TAB_COLORS.drones,
  },
  [ShadowrunTab.Connections]: {
    icon: 'address-book',
    label: 'Connections',
    hint: 'Knowledge skills, languages, and contacts that represent your social network.',
    accentColor: TAB_COLORS.connections,
  },
  [ShadowrunTab.Qualities]: {
    icon: 'star',
    label: 'Qualities',
    hint: 'Positive and negative qualities that define your character edges and flaws.',
    accentColor: TAB_COLORS.qualities,
  },
  [ShadowrunTab.Occupations]: {
    icon: 'id-badge',
    label: 'Jobs',
    hint: 'Select your assignment/role for the run.',
    accentColor: TAB_COLORS.occupations,
  },
  [ShadowrunTab.Summary]: {
    icon: 'clipboard-list',
    label: 'Summary',
    hint: 'Complete overview of your character build with validation status.',
    accentColor: TAB_COLORS.summary,
  },
};

/**
 * Find which group a tab belongs to.
 */
export function getTabGroup(tab: ShadowrunTab): TabGroupDefinition | undefined {
  return TAB_GROUPS.find((group) => group.tabs.includes(tab));
}

// Data structure from preferences system
type PreferencesData = {
  active_slot: number;
  character_preferences: {
    misc: Record<string, unknown>;
    names?: Record<string, string>;
  };
};

type TabContentRouterProps = {
  MetatypeSelector: React.ComponentType<MetatypeSelectorProps>;
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  dashboardData: DashboardData | null;
  data: PreferencesData;
  derivedStats: DerivedStats | null;
  featureId: string;
  hasBiocompatibility: boolean;
  isEditingName: boolean;
  isSaved: boolean;
  multiNameInputOpen: boolean;
  nameDraft: string;
  nameKey: string;
  nameLocked: boolean;
  renderPreference: (preferenceId: string) => ReactNode;
  setIsEditingName: (v: boolean) => void;
  setMultiNameInputOpen: (v: boolean) => void;
  setNameDraft: (v: string) => void;
  setPredictedValue: (value: ChargenState) => void;
  tab: ShadowrunTab;
  validation: ValidationResult;
  value: ChargenState | null;
};

// Lazy Tab Loading Placeholder
const TabLoadingPlaceholder = () => (
  <Box
    style={{
      padding: '2rem',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.5)',
    }}
  >
    <Icon name="spinner" spin size={2} />
    <Box mt={1}>Loading...</Box>
  </Box>
);

export const TabContentRouter = memo((props: TabContentRouterProps) => {
  const {
    act,
    chargenConstData,
    chargenState,
    dashboardData,
    data,
    derivedStats,
    featureId,
    hasBiocompatibility,
    isEditingName,
    isSaved,
    MetatypeSelector,
    multiNameInputOpen,
    nameDraft,
    nameKey,
    nameLocked,
    renderPreference,
    setIsEditingName,
    setMultiNameInputOpen,
    setNameDraft,
    setPredictedValue,
    tab,
    validation,
    value,
  } = props;

  // Note: React.lazy() + Suspense handles code-splitting automatically.
  // Heavy components are loaded on-demand when their tab is first visited.

  switch (tab) {
    case ShadowrunTab.Build:
      return (
        <Suspense fallback={<TabLoadingPlaceholder />}>
          <CollapsibleSection
            title="Priority Selection"
            icon="list-ol"
            stateKey={`sr_priority_tab_${data.active_slot}`}
            defaultOpen
          >
            <PrioritySelector
              chargenState={chargenState}
              chargenConstData={chargenConstData}
              isSaved={isSaved}
              act={act}
              featureId={featureId}
              setPredictedValue={setPredictedValue}
              value={value}
              embedded
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Attributes"
            icon="fist-raised"
            stateKey={`sr_attributes_tab_${data.active_slot}`}
            defaultOpen
          >
            <AttributeSelector
              chargenState={chargenState}
              chargenConstData={chargenConstData}
              isSaved={isSaved}
              act={act}
              featureId={featureId}
              setPredictedValue={setPredictedValue}
              value={value}
              embedded
            />
          </CollapsibleSection>

          <LazySkillsSection
            chargenState={chargenState}
            chargenConstData={chargenConstData}
            isSaved={isSaved}
            act={act}
            featureId={featureId}
            setPredictedValue={setPredictedValue}
            value={value}
          />
        </Suspense>
      );

    case ShadowrunTab.Magic:
      return (
        <Suspense fallback={<TabLoadingPlaceholder />}>
          <LazyMagicSelector
            chargenState={chargenState}
            chargenConstData={chargenConstData}
            isSaved={isSaved}
            act={act}
            featureId={featureId}
            setPredictedValue={setPredictedValue}
            value={value}
            embedded
          />
        </Suspense>
      );

    case ShadowrunTab.Connections:
      return (
        <Suspense fallback={<TabLoadingPlaceholder />}>
          <LazyKnowledgeSkillsSelector
            chargenState={chargenState}
            chargenConstData={chargenConstData}
            isSaved={isSaved}
            act={act}
            featureId={featureId}
            setPredictedValue={setPredictedValue}
            value={value}
            embedded
          />

          <LazyContactsSelector
            chargenState={chargenState}
            chargenConstData={chargenConstData}
            isSaved={isSaved}
            act={act}
            featureId={featureId}
            setPredictedValue={setPredictedValue}
            value={value}
            embedded
          />
        </Suspense>
      );

    case ShadowrunTab.Core:
      return (
        <Suspense fallback={<TabLoadingPlaceholder />}>
          <LazyCoreTabContent
            act={act}
            chargenConstData={chargenConstData}
            chargenState={chargenState}
            dashboardData={dashboardData}
            data={data}
            derivedStats={derivedStats}
            featureId={featureId}
            isEditingName={isEditingName}
            isSaved={isSaved}
            MetatypeSelector={MetatypeSelector}
            multiNameInputOpen={multiNameInputOpen}
            nameDraft={nameDraft}
            nameKey={nameKey}
            nameLocked={nameLocked}
            renderPreference={renderPreference}
            setIsEditingName={setIsEditingName}
            setMultiNameInputOpen={setMultiNameInputOpen}
            setNameDraft={setNameDraft}
            setPredictedValue={setPredictedValue}
            value={value}
          />
        </Suspense>
      );

    case ShadowrunTab.Augments:
      return (
        <Suspense fallback={<TabLoadingPlaceholder />}>
          <Box className="PreferencesMenu__ShadowrunSheet__augmentsContent">
            <LazyAugmentsSection
              chargenState={chargenState}
              chargenConstData={chargenConstData}
              isSaved={isSaved}
              act={act}
              featureId={featureId}
              setPredictedValue={setPredictedValue}
              value={value}
              totalNuyen={dashboardData?.resources || 0}
              hasBiocompatibility={hasBiocompatibility}
            />
          </Box>
        </Suspense>
      );

    case ShadowrunTab.Gear:
      return (
        <Suspense fallback={<TabLoadingPlaceholder />}>
          <Box className="PreferencesMenu__ShadowrunSheet__gearContent">
            <LazyGearSection
              chargenState={chargenState}
              chargenConstData={chargenConstData}
              isSaved={isSaved}
              act={act}
              featureId={featureId}
              setPredictedValue={setPredictedValue}
              value={value}
              dashboardData={dashboardData}
            />
          </Box>
        </Suspense>
      );

    case ShadowrunTab.Drones:
      return (
        <Suspense fallback={<TabLoadingPlaceholder />}>
          <Box className="PreferencesMenu__ShadowrunSheet__dronesContent">
            <LazyDroneSection
              chargenState={chargenState}
              chargenConstData={chargenConstData}
              isSaved={isSaved}
              act={act}
              featureId={featureId}
              setPredictedValue={setPredictedValue}
              value={value}
              dashboardData={dashboardData}
            />
          </Box>
        </Suspense>
      );

    case ShadowrunTab.Occupations:
      return (
        <Box className="PreferencesMenu__ShadowrunSheet__careerContent">
          <CareerSection isSaved={isSaved} />
        </Box>
      );

    case ShadowrunTab.Qualities:
      return (
        <Box className="PreferencesMenu__ShadowrunSheet__qualitiesContent">
          <QuirksPage />
        </Box>
      );

    case ShadowrunTab.Summary:
      return <SummaryTabContent validation={validation} isSaved={isSaved} />;

    default:
      return null;
  }
});

// Summary Tab Content - extracted to reduce complexity
type SummaryTabContentProps = {
  isSaved: boolean;
  validation: ValidationResult;
};

const SummaryTabContent = (props: SummaryTabContentProps) => {
  const { validation, isSaved } = props;

  const statusColor =
    validation.errorCount > 0
      ? '#ff6b6b'
      : validation.warningCount > 0
        ? '#ffb74d'
        : '#4caf50';

  const statusBgColor =
    validation.errorCount > 0
      ? 'rgba(255, 107, 107, 0.15)'
      : validation.warningCount > 0
        ? 'rgba(255, 183, 77, 0.15)'
        : 'rgba(76, 175, 80, 0.15)';

  const statusBorderColor =
    validation.errorCount > 0
      ? 'rgba(255, 107, 107, 0.5)'
      : validation.warningCount > 0
        ? 'rgba(255, 183, 77, 0.5)'
        : 'rgba(76, 175, 80, 0.5)';

  const statusIcon =
    validation.errorCount > 0
      ? 'times-circle'
      : validation.warningCount > 0
        ? 'exclamation-triangle'
        : 'check-circle';

  const statusTitle =
    validation.errorCount > 0
      ? 'Character Has Errors'
      : validation.warningCount > 0
        ? 'Character Has Warnings'
        : 'Character Ready';

  const statusSubtitle =
    validation.errorCount > 0
      ? `${validation.errorCount} error(s) must be fixed before saving`
      : validation.warningCount > 0
        ? `${validation.warningCount} warning(s) - can still save`
        : isSaved
          ? 'Character sheet is locked and saved'
          : 'All requirements met - ready to save';

  return (
    <Box style={{ padding: '1rem' }}>
      {/* Validation Status Header */}
      <Box
        style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: statusBgColor,
          border: `2px solid ${statusBorderColor}`,
          borderRadius: '8px',
        }}
      >
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Icon
            name={statusIcon}
            size={2}
            style={{
              color: statusColor,
            }}
          />
          <Box>
            <Box
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: statusColor,
              }}
            >
              {statusTitle}
            </Box>
            <Box style={{ color: 'rgba(255,255,255,0.7)' }}>
              {statusSubtitle}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Issue List */}
      {validation.issues.length > 0 && (
        <Box
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            padding: '1rem',
          }}
        >
          <Box
            style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#9b8fc7',
            }}
          >
            <Icon name="list" mr={0.5} />
            Issues ({validation.issues.length})
          </Box>
          <Stack vertical>
            {validation.issues.map((issue, idx) => (
              <Stack.Item key={idx}>
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0',
                  }}
                >
                  <Icon
                    name={
                      issue.severity === 'error'
                        ? 'times-circle'
                        : 'exclamation-triangle'
                    }
                    style={{
                      color: issue.severity === 'error' ? '#ff6b6b' : '#ffb74d',
                    }}
                  />
                  <Box
                    style={{
                      color: issue.severity === 'error' ? '#ff6b6b' : '#ffb74d',
                    }}
                  >
                    {issue.message}
                  </Box>
                  <Box
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {issue.section}
                  </Box>
                </Box>
              </Stack.Item>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
