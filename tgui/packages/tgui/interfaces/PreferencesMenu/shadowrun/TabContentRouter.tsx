/**
 * Tab Content Router for Shadowrun Character Sheet
 *
 * Renders the appropriate content based on the selected tab.
 * This component moves conditional rendering logic out of the main component
 * to reduce complexity.
 */

import { memo, ReactNode, useEffect, useState } from 'react';

import { Box, Icon, Stack } from '../../../components';
import { JobsPage } from '../JobsPage';
import { QuirksPage } from '../QuirksPage';
import { AttributeSelector } from './AttributeSelector';
import {
  AugmentsSection,
  CollapsibleSection,
  ContactsSelector,
  CoreTabContent,
  DroneSection,
  GearSection,
  KnowledgeSkillsSelector,
  MagicSelector,
  PrioritySelector,
  SkillsSection,
} from './index';
import {
  ChargenConstData,
  ChargenState,
  DashboardData,
  DerivedStats,
  ValidationResult,
} from './types';

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

// MetatypeSelector component prop type
type MetatypeSelectorProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  value: ChargenState | null;
};

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

// Heavy tabs that benefit from lazy loading (>500 lines)
const HEAVY_TABS = new Set([
  ShadowrunTab.Augments,
  ShadowrunTab.Core,
  ShadowrunTab.Drones,
  ShadowrunTab.Magic,
  ShadowrunTab.Build,
  ShadowrunTab.Connections,
]);

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

  // Track which tabs have been visited for lazy loading
  const [visitedTabs, setVisitedTabs] = useState<Set<ShadowrunTab>>(
    () => new Set([tab]),
  );

  // Mark current tab as visited
  useEffect(() => {
    if (!visitedTabs.has(tab)) {
      setVisitedTabs((prev) => new Set([...prev, tab]));
    }
  }, [tab, visitedTabs]);

  // For heavy tabs, show placeholder if not yet visited
  // (This allows deferred rendering on first visit via requestAnimationFrame)
  const [isReady, setIsReady] = useState(!HEAVY_TABS.has(tab));
  useEffect(() => {
    if (HEAVY_TABS.has(tab) && !isReady) {
      // Defer heavy tab rendering to next frame for smoother tab switching
      const timer = requestAnimationFrame(() => setIsReady(true));
      return () => cancelAnimationFrame(timer);
    }
    return undefined;
  }, [tab, isReady]);

  // Reset ready state when tab changes
  useEffect(() => {
    if (HEAVY_TABS.has(tab)) {
      setIsReady(false);
    } else {
      setIsReady(true);
    }
  }, [tab]);

  // Show loading placeholder for heavy tabs on first render frame
  if (!isReady && HEAVY_TABS.has(tab)) {
    return <TabLoadingPlaceholder />;
  }

  switch (tab) {
    case ShadowrunTab.Build:
      return (
        <>
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

          <SkillsSection
            chargenState={chargenState}
            chargenConstData={chargenConstData}
            isSaved={isSaved}
            act={act}
            featureId={featureId}
            setPredictedValue={setPredictedValue}
            value={value}
          />
        </>
      );

    case ShadowrunTab.Magic:
      return (
        <MagicSelector
          chargenState={chargenState}
          chargenConstData={chargenConstData}
          isSaved={isSaved}
          act={act}
          featureId={featureId}
          setPredictedValue={setPredictedValue}
          value={value}
          embedded
        />
      );

    case ShadowrunTab.Connections:
      return (
        <>
          <KnowledgeSkillsSelector
            chargenState={chargenState}
            chargenConstData={chargenConstData}
            isSaved={isSaved}
            act={act}
            featureId={featureId}
            setPredictedValue={setPredictedValue}
            value={value}
            embedded
          />

          <ContactsSelector
            chargenState={chargenState}
            chargenConstData={chargenConstData}
            isSaved={isSaved}
            act={act}
            featureId={featureId}
            setPredictedValue={setPredictedValue}
            value={value}
            embedded
          />
        </>
      );

    case ShadowrunTab.Core:
      return (
        <CoreTabContent
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
      );

    case ShadowrunTab.Augments:
      return (
        <Box className="PreferencesMenu__ShadowrunSheet__augmentsContent">
          <AugmentsSection
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
      );

    case ShadowrunTab.Gear:
      return (
        <Box className="PreferencesMenu__ShadowrunSheet__gearContent">
          <GearSection
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
      );

    case ShadowrunTab.Drones:
      return (
        <Box className="PreferencesMenu__ShadowrunSheet__dronesContent">
          <DroneSection
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
      );

    case ShadowrunTab.Occupations:
      return (
        <Box className="PreferencesMenu__ShadowrunSheet__jobsContent">
          <JobsPage />
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
