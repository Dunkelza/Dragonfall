/**
 * @file Shadowrun Component Storybook
 * Visual documentation for all Shadowrun 5e character generation components.
 *
 * This storybook covers:
 * - AnimatedNumber / AnimatedResource — Animated value displays
 * - DashboardTile — Status tiles with icons and progress bars
 * - ValidationBadge / FieldValidation / ValidationSummary — Validation feedback
 * - ProgressBar — Animated progress indicators
 * - CollapsibleSection — Expandable content containers
 * - HintedLabel / BreadcrumbNav — Navigation and tooltips
 * - UndoRedoControls — Undo/redo button UI
 * - GroupedTabs — Tab navigation with groups
 * - Skeleton Loaders — Loading placeholders
 */

import { useState } from 'react';

import { Box, Section, Stack, Tabs } from '../components';
import {
  AnimatedNumber,
  AnimatedResource,
  BreadcrumbNav,
  CollapsibleSection,
  DashboardTile,
  FieldValidation,
  HintedLabel,
  ProgressBar,
  UndoRedoControls,
  ValidationBadge,
  ValidationSummary,
} from '../interfaces/PreferencesMenu/shadowrun/components';
import {
  AugmentsSkeleton,
  ConnectionsSkeleton,
  CoreSkeleton,
  DronesSkeleton,
  GearSkeleton,
  MagicSkeleton,
  SkeletonBox,
  SkeletonCard,
  SkeletonLine,
  SkeletonSectionHeader,
  SkeletonStatBar,
  SkeletonTabs,
} from '../interfaces/PreferencesMenu/shadowrun/SkeletonLoaders';
import type {
  ValidationIssue,
  ValidationResult,
} from '../interfaces/PreferencesMenu/shadowrun/types';

export const meta = {
  title: 'Shadowrun Components',
  render: () => <Story />,
};

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const ACCENT_COLORS = {
  gold: '#caa53d',
  teal: '#03fca1',
  purple: '#9b59b6',
  cyan: '#00d4ff',
  magenta: '#ff2d95',
  orange: '#ff9500',
  red: '#ff6b6b',
  green: '#4caf50',
  yellow: '#ffc107',
};

// ============================================================================
// MOCK DATA
// ============================================================================

const mockValidationIssues: ValidationIssue[] = [
  {
    severity: 'error',
    section: 'attributes',
    field: 'attributes',
    message: 'Attribute points overspent by 3',
    suggestion: 'Remove 3 points from Body or Agility',
  },
  {
    severity: 'warning',
    section: 'skills',
    field: 'skills',
    message: 'No social skills selected',
    suggestion: 'Consider adding Negotiation or Etiquette',
  },
  {
    severity: 'info',
    section: 'gear',
    field: 'gear',
    message: '¥5,000 nuyen remaining',
    suggestion: 'Consider purchasing additional gear or contacts',
  },
];

const mockValidationResult: ValidationResult = {
  isValid: false,
  issues: mockValidationIssues,
  summary: {
    errors: 1,
    warnings: 1,
    info: 1,
  },
  issuesByField: {
    attributes: [mockValidationIssues[0]],
    skills: [mockValidationIssues[1]],
    gear: [mockValidationIssues[2]],
  },
  issuesBySection: {
    attributes: [mockValidationIssues[0]],
    skills: [mockValidationIssues[1]],
    gear: [mockValidationIssues[2]],
  },
};

// ============================================================================
// STORY COMPONENT
// ============================================================================

const Story = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(100);
  const [spentValue, setSpentValue] = useState(5);

  const sections = [
    'Animated Numbers',
    'Dashboard Tiles',
    'Validation',
    'Progress & Sections',
    'Navigation',
    'Undo/Redo',
    'Skeleton Loaders',
  ];

  return (
    <Box>
      <Section title="Shadowrun UI Components" fill>
        {/* Section Navigation */}
        <Tabs fluid mb={2}>
          {sections.map((label, i) => (
            <Tabs.Tab
              key={label}
              selected={currentSection === i}
              onClick={() => setCurrentSection(i)}
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs>

        {/* Section Content */}
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          {currentSection === 0 && (
            <AnimatedNumbersSection
              value={animatedValue}
              onValueChange={setAnimatedValue}
              spent={spentValue}
              onSpentChange={setSpentValue}
            />
          )}
          {currentSection === 1 && <DashboardTilesSection />}
          {currentSection === 2 && <ValidationSection />}
          {currentSection === 3 && <ProgressSection />}
          {currentSection === 4 && <NavigationSection />}
          {currentSection === 5 && <UndoRedoSection />}
          {currentSection === 6 && <SkeletonSection />}
        </Box>
      </Section>
    </Box>
  );
};

// ============================================================================
// ANIMATED NUMBERS SECTION
// ============================================================================

type AnimatedNumbersSectionProps = {
  onSpentChange: (v: number) => void;
  onValueChange: (v: number) => void;
  spent: number;
  value: number;
};

const AnimatedNumbersSection = ({
  value,
  onValueChange,
  spent,
  onSpentChange,
}: AnimatedNumbersSectionProps) => (
  <Stack vertical>
    <Box bold mb={1} style={{ color: ACCENT_COLORS.gold }}>
      AnimatedNumber
    </Box>
    <Box mb={1} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Smoothly animates between values with color flash on change.
    </Box>

    <Stack mb={2}>
      <Stack.Item>
        <Box
          as="button"
          onClick={() => onValueChange(value - 10)}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 107, 107, 0.3)',
            border: '1px solid rgba(255, 107, 107, 0.5)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          -10
        </Box>
      </Stack.Item>
      <Stack.Item grow={1}>
        <Box
          style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 'bold',
          }}
        >
          <AnimatedNumber value={value} />
        </Box>
      </Stack.Item>
      <Stack.Item>
        <Box
          as="button"
          onClick={() => onValueChange(value + 10)}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(76, 175, 80, 0.3)',
            border: '1px solid rgba(76, 175, 80, 0.5)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          +10
        </Box>
      </Stack.Item>
    </Stack>

    {/* Variants */}
    <Box mb={2}>
      <Box bold mb={0.5}>
        Variants:
      </Box>
      <Stack>
        <Stack.Item basis="25%">
          <Box style={{ fontSize: '0.8rem', opacity: 0.7 }}>With prefix:</Box>
          <Box style={{ fontSize: '1.2rem' }}>
            <AnimatedNumber value={value} prefix="¥" />
          </Box>
        </Stack.Item>
        <Stack.Item basis="25%">
          <Box style={{ fontSize: '0.8rem', opacity: 0.7 }}>With suffix:</Box>
          <Box style={{ fontSize: '1.2rem' }}>
            <AnimatedNumber value={value} suffix=" pts" />
          </Box>
        </Stack.Item>
        <Stack.Item basis="25%">
          <Box style={{ fontSize: '0.8rem', opacity: 0.7 }}>Decimals:</Box>
          <Box style={{ fontSize: '1.2rem' }}>
            <AnimatedNumber value={value / 3} decimals={2} />
          </Box>
        </Stack.Item>
        <Stack.Item basis="25%">
          <Box style={{ fontSize: '0.8rem', opacity: 0.7 }}>Formatted:</Box>
          <Box style={{ fontSize: '1.2rem' }}>
            <AnimatedNumber
              value={value * 1000}
              format={(n) => n.toLocaleString()}
            />
          </Box>
        </Stack.Item>
      </Stack>
    </Box>

    {/* AnimatedResource */}
    <Box bold mb={1} mt={2} style={{ color: ACCENT_COLORS.teal }}>
      AnimatedResource
    </Box>
    <Box mb={1} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Resource indicator showing spent/max with color-coded remaining.
    </Box>

    <Stack mb={1}>
      <Stack.Item>
        <Box
          as="button"
          onClick={() => onSpentChange(Math.max(0, spent - 1))}
          style={{
            padding: '0.25rem 0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          -
        </Box>
      </Stack.Item>
      <Stack.Item grow={1}>
        <AnimatedResource
          label="Attribute Points"
          icon="chart-bar"
          spent={spent}
          max={10}
          unit=" pts"
        />
      </Stack.Item>
      <Stack.Item>
        <Box
          as="button"
          onClick={() => onSpentChange(spent + 1)}
          style={{
            padding: '0.25rem 0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          +
        </Box>
      </Stack.Item>
    </Stack>

    <Box style={{ fontSize: '0.8rem', opacity: 0.6 }}>
      ↑ Adjust spent points to see color coding (green at max, red when
      overspent)
    </Box>
  </Stack>
);

// ============================================================================
// DASHBOARD TILES SECTION
// ============================================================================

const DashboardTilesSection = () => (
  <Stack vertical>
    <Box bold mb={1} style={{ color: ACCENT_COLORS.gold }}>
      DashboardTile
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Status tiles with icons, values, and optional progress bars.
    </Box>

    {/* Color Types */}
    <Box mb={1} bold>
      Color Types:
    </Box>
    <Stack mb={2} wrap="wrap">
      <Stack.Item basis="24%" mb={1}>
        <DashboardTile
          icon="running"
          label="Physical"
          value="5"
          colorType="physical"
          subtext="Physical Limit"
        />
      </Stack.Item>
      <Stack.Item basis="24%" mb={1}>
        <DashboardTile
          icon="brain"
          label="Mental"
          value="6"
          colorType="mental"
          subtext="Mental Limit"
        />
      </Stack.Item>
      <Stack.Item basis="24%" mb={1}>
        <DashboardTile
          icon="magic"
          label="Special"
          value="4"
          colorType="special"
          subtext="Magic Rating"
        />
      </Stack.Item>
      <Stack.Item basis="24%" mb={1}>
        <DashboardTile
          icon="coins"
          label="Resources"
          value="¥50K"
          colorType="resources"
          subtext="Starting Nuyen"
        />
      </Stack.Item>
    </Stack>

    {/* Status States */}
    <Box mb={1} bold>
      Status States:
    </Box>
    <Stack mb={2} wrap="wrap">
      <Stack.Item basis="24%" mb={1}>
        <DashboardTile
          icon="check"
          label="Good"
          value="OK"
          status="good"
          subtext="All valid"
        />
      </Stack.Item>
      <Stack.Item basis="24%" mb={1}>
        <DashboardTile
          icon="exclamation-triangle"
          label="Warning"
          value="!"
          status="warn"
          subtext="Review needed"
        />
      </Stack.Item>
      <Stack.Item basis="24%" mb={1}>
        <DashboardTile
          icon="times"
          label="Error"
          value="X"
          status="bad"
          subtext="Invalid state"
        />
      </Stack.Item>
      <Stack.Item basis="24%" mb={1}>
        <DashboardTile
          icon="info-circle"
          label="Neutral"
          value="—"
          status="neutral"
          subtext="No status"
        />
      </Stack.Item>
    </Stack>

    {/* With Progress */}
    <Box mb={1} bold>
      With Progress Bar:
    </Box>
    <Stack wrap="wrap">
      <Stack.Item basis="32%" mb={1}>
        <DashboardTile
          icon="heart"
          label="Essence"
          value="4.5"
          colorType="special"
          showProgress
          progressCurrent={4.5}
          progressMax={6}
          tooltip="Essence remaining after augmentations"
        />
      </Stack.Item>
      <Stack.Item basis="32%" mb={1}>
        <DashboardTile
          icon="star"
          label="Karma"
          value="15"
          colorType="mental"
          showProgress
          progressCurrent={15}
          progressMax={25}
        />
      </Stack.Item>
      <Stack.Item basis="32%" mb={1}>
        <DashboardTile
          icon="bolt"
          label="Edge"
          value="3"
          colorType="physical"
          showProgress
          progressCurrent={3}
          progressMax={6}
        />
      </Stack.Item>
    </Stack>
  </Stack>
);

// ============================================================================
// VALIDATION SECTION
// ============================================================================

const ValidationSection = () => (
  <Stack vertical>
    <Box bold mb={1} style={{ color: ACCENT_COLORS.gold }}>
      ValidationBadge
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Small status indicators for validation state.
    </Box>

    <Stack mb={2}>
      <Stack.Item mr={2}>
        <Stack align="center">
          <ValidationBadge status="good" />
          <Box ml={0.5}>Good</Box>
        </Stack>
      </Stack.Item>
      <Stack.Item mr={2}>
        <Stack align="center">
          <ValidationBadge status="warn" />
          <Box ml={0.5}>Warning</Box>
        </Stack>
      </Stack.Item>
      <Stack.Item mr={2}>
        <Stack align="center">
          <ValidationBadge status="bad" />
          <Box ml={0.5}>Error</Box>
        </Stack>
      </Stack.Item>
      <Stack.Item mr={2}>
        <Stack align="center">
          <ValidationBadge status="info" />
          <Box ml={0.5}>Info</Box>
        </Stack>
      </Stack.Item>
      <Stack.Item>
        <Stack align="center">
          <ValidationBadge status="none" />
          <Box ml={0.5}>None (hidden)</Box>
        </Stack>
      </Stack.Item>
    </Stack>

    {/* FieldValidation */}
    <Box bold mb={1} mt={2} style={{ color: ACCENT_COLORS.teal }}>
      FieldValidation
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Inline validation for specific fields with messages and suggestions.
    </Box>

    <Stack vertical mb={2}>
      <Box mb={1}>
        <Box bold mb={0.25}>
          Full Mode (with messages):
        </Box>
        <FieldValidation
          field="attributes"
          issues={[mockValidationIssues[0]]}
          compact={false}
        />
      </Box>
      <Box>
        <Box bold mb={0.25}>
          Compact Mode (icon only):
        </Box>
        <Stack align="center">
          <Box>Attribute Field</Box>
          <FieldValidation
            field="attributes"
            issues={[mockValidationIssues[0]]}
            compact
          />
        </Stack>
      </Box>
    </Stack>

    {/* ValidationSummary */}
    <Box bold mb={1} mt={2} style={{ color: ACCENT_COLORS.purple }}>
      ValidationSummary
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Full validation report panel, grouped by severity.
    </Box>

    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        maxHeight: '200px',
        overflow: 'auto',
      }}
    >
      <ValidationSummary
        validation={mockValidationResult}
        onIssueClick={(issue) => console.log('Clicked:', issue)}
      />
    </Box>
  </Stack>
);

// ============================================================================
// PROGRESS SECTION
// ============================================================================

const ProgressSection = () => (
  <Stack vertical>
    <Box bold mb={1} style={{ color: ACCENT_COLORS.gold }}>
      ProgressBar
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Color-coded progress bars (green ≥80%, yellow ≥40%, red &lt;40%).
    </Box>

    <Stack vertical mb={2}>
      <Stack align="center" mb={0.5}>
        <Stack.Item basis="100px" style={{ fontSize: '0.85rem' }}>
          100%:
        </Stack.Item>
        <Stack.Item grow={1}>
          <ProgressBar value={100} max={100} />
        </Stack.Item>
      </Stack>
      <Stack align="center" mb={0.5}>
        <Stack.Item basis="100px" style={{ fontSize: '0.85rem' }}>
          80%:
        </Stack.Item>
        <Stack.Item grow={1}>
          <ProgressBar value={80} max={100} />
        </Stack.Item>
      </Stack>
      <Stack align="center" mb={0.5}>
        <Stack.Item basis="100px" style={{ fontSize: '0.85rem' }}>
          50%:
        </Stack.Item>
        <Stack.Item grow={1}>
          <ProgressBar value={50} max={100} />
        </Stack.Item>
      </Stack>
      <Stack align="center" mb={0.5}>
        <Stack.Item basis="100px" style={{ fontSize: '0.85rem' }}>
          25%:
        </Stack.Item>
        <Stack.Item grow={1}>
          <ProgressBar value={25} max={100} />
        </Stack.Item>
      </Stack>
    </Stack>

    {/* CollapsibleSection */}
    <Box bold mb={1} mt={2} style={{ color: ACCENT_COLORS.teal }}>
      CollapsibleSection
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Expandable container with icon, title, and validation badge.
    </Box>

    <CollapsibleSection
      title="Physical Attributes"
      icon="running"
      badge="good"
      stateKey="story_collapsible_1"
      defaultOpen
    >
      <Box style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
        Content goes here. This section can be expanded or collapsed.
      </Box>
    </CollapsibleSection>

    <CollapsibleSection
      title="Skills (Warning)"
      icon="book"
      badge="warn"
      stateKey="story_collapsible_2"
      defaultOpen={false}
    >
      <Box style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
        This section has a warning badge and starts collapsed.
      </Box>
    </CollapsibleSection>

    <CollapsibleSection
      title="Augments (Error)"
      icon="microchip"
      badge="bad"
      stateKey="story_collapsible_3"
      defaultOpen={false}
    >
      <Box style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
        This section has an error badge.
      </Box>
    </CollapsibleSection>
  </Stack>
);

// ============================================================================
// NAVIGATION SECTION
// ============================================================================

const NavigationSection = () => (
  <Stack vertical>
    <Box bold mb={1} style={{ color: ACCENT_COLORS.gold }}>
      HintedLabel
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Text with tooltip hint on hover.
    </Box>

    <Stack mb={2}>
      <Stack.Item mr={2}>
        <HintedLabel
          text="Body"
          hint="Physical health, resilience, and resistance to damage."
        />
      </Stack.Item>
      <Stack.Item mr={2}>
        <HintedLabel
          text="Agility"
          hint="Coordination, balance, and fine motor control."
        />
      </Stack.Item>
      <Stack.Item>
        <HintedLabel
          text="Charisma"
          hint="Social influence and force of personality."
        />
      </Stack.Item>
    </Stack>

    {/* BreadcrumbNav */}
    <Box bold mb={1} mt={2} style={{ color: ACCENT_COLORS.teal }}>
      BreadcrumbNav
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Hierarchical path navigation with clickable segments.
    </Box>

    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        marginBottom: '1rem',
      }}
    >
      <BreadcrumbNav
        segments={[
          {
            label: 'Character',
            icon: 'user',
            onClick: () => console.log('Character clicked'),
          },
          {
            label: 'Build',
            icon: 'sliders-h',
            onClick: () => console.log('Build clicked'),
          },
          { label: 'Attributes', icon: 'chart-bar' },
        ]}
      />
    </Box>

    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
      }}
    >
      <BreadcrumbNav
        segments={[
          { label: 'Equipment', icon: 'briefcase' },
          { label: 'Augments', icon: 'microchip' },
          { label: 'Cyberware' },
        ]}
      />
    </Box>
  </Stack>
);

// ============================================================================
// UNDO/REDO SECTION
// ============================================================================

const UndoRedoSection = () => {
  const [history, setHistory] = useState<number[]>([100]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentValue = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushValue = (value: number) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(value);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  return (
    <Stack vertical>
      <Box bold mb={1} style={{ color: ACCENT_COLORS.gold }}>
        UndoRedoControls
      </Box>
      <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
        Undo/redo buttons with tooltips and keyboard shortcut hints.
      </Box>

      {/* Interactive Demo */}
      <Box mb={2}>
        <Box bold mb={0.5}>
          Interactive Demo:
        </Box>
        <Stack align="center" mb={1}>
          <Stack.Item>
            <Box
              as="button"
              onClick={() => pushValue(currentValue - 10)}
              style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 107, 107, 0.3)',
                border: '1px solid rgba(255, 107, 107, 0.5)',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              -10
            </Box>
          </Stack.Item>
          <Stack.Item grow={1}>
            <Box style={{ textAlign: 'center', fontSize: '1.5rem' }}>
              Value: <AnimatedNumber value={currentValue} />
            </Box>
          </Stack.Item>
          <Stack.Item>
            <Box
              as="button"
              onClick={() => pushValue(currentValue + 10)}
              style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(76, 175, 80, 0.3)',
                border: '1px solid rgba(76, 175, 80, 0.5)',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              +10
            </Box>
          </Stack.Item>
        </Stack>

        <UndoRedoControls
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          historyCount={historyIndex}
          futureCount={history.length - historyIndex - 1}
          lastChangeLabel={
            canUndo
              ? `${history[historyIndex - 1]} → ${currentValue}`
              : undefined
          }
          nextRedoLabel={
            canRedo
              ? `${currentValue} → ${history[historyIndex + 1]}`
              : undefined
          }
        />
      </Box>

      {/* Compact variant */}
      <Box mb={1} bold>
        Compact Variant:
      </Box>
      <UndoRedoControls
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        compact
      />

      {/* Disabled state */}
      <Box mt={2} mb={1} bold>
        Disabled State (saved):
      </Box>
      <UndoRedoControls
        canUndo
        canRedo
        onUndo={() => {}}
        onRedo={() => {}}
        saved
      />
    </Stack>
  );
};

// ============================================================================
// SKELETON LOADERS SECTION
// ============================================================================

const SkeletonSection = () => (
  <Stack vertical>
    <Box bold mb={1} style={{ color: ACCENT_COLORS.gold }}>
      Skeleton Primitives
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Basic loading placeholder components with shimmer animation.
    </Box>

    <Stack mb={2}>
      <Stack.Item basis="33%">
        <Box mb={0.5} style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          SkeletonLine:
        </Box>
        <SkeletonLine />
        <Box mt={0.5}>
          <SkeletonLine width="60%" />
        </Box>
      </Stack.Item>
      <Stack.Item basis="33%">
        <Box mb={0.5} style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          SkeletonBox:
        </Box>
        <SkeletonBox height="50px" />
      </Stack.Item>
      <Stack.Item basis="33%">
        <Box mb={0.5} style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          SkeletonCard:
        </Box>
        <SkeletonCard accentColor={ACCENT_COLORS.cyan} />
      </Stack.Item>
    </Stack>

    {/* Section Header */}
    <Box bold mb={1} mt={2} style={{ color: ACCENT_COLORS.teal }}>
      SkeletonSectionHeader
    </Box>
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '0.5rem',
        borderRadius: '4px',
        marginBottom: '1rem',
      }}
    >
      <SkeletonSectionHeader accentColor={ACCENT_COLORS.purple} />
    </Box>

    {/* Tabs */}
    <Box bold mb={1} style={{ color: ACCENT_COLORS.purple }}>
      SkeletonTabs
    </Box>
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '0.5rem',
        borderRadius: '4px',
        marginBottom: '1rem',
      }}
    >
      <SkeletonTabs count={4} />
    </Box>

    {/* Stat Bar */}
    <Box bold mb={1} style={{ color: ACCENT_COLORS.orange }}>
      SkeletonStatBar
    </Box>
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '0.5rem',
        borderRadius: '4px',
        marginBottom: '1rem',
      }}
    >
      <SkeletonStatBar count={4} />
    </Box>

    {/* Tab Skeletons */}
    <Box bold mb={1} mt={2} style={{ color: ACCENT_COLORS.cyan }}>
      Tab-Specific Skeletons
    </Box>
    <Box mb={2} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
      Pre-built skeletons matching each tab&apos;s layout.
    </Box>

    <Stack wrap="wrap">
      <Stack.Item basis="48%" mb={1} mr="2%">
        <Box
          bold
          mb={0.5}
          style={{ fontSize: '0.8rem', color: ACCENT_COLORS.orange }}
        >
          GearSkeleton:
        </Box>
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.5rem',
            borderRadius: '4px',
            height: '120px',
            overflow: 'hidden',
          }}
        >
          <GearSkeleton />
        </Box>
      </Stack.Item>
      <Stack.Item basis="48%" mb={1}>
        <Box
          bold
          mb={0.5}
          style={{ fontSize: '0.8rem', color: ACCENT_COLORS.red }}
        >
          AugmentsSkeleton:
        </Box>
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.5rem',
            borderRadius: '4px',
            height: '120px',
            overflow: 'hidden',
          }}
        >
          <AugmentsSkeleton />
        </Box>
      </Stack.Item>
      <Stack.Item basis="48%" mb={1} mr="2%">
        <Box
          bold
          mb={0.5}
          style={{ fontSize: '0.8rem', color: ACCENT_COLORS.cyan }}
        >
          DronesSkeleton:
        </Box>
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.5rem',
            borderRadius: '4px',
            height: '120px',
            overflow: 'hidden',
          }}
        >
          <DronesSkeleton />
        </Box>
      </Stack.Item>
      <Stack.Item basis="48%" mb={1}>
        <Box
          bold
          mb={0.5}
          style={{ fontSize: '0.8rem', color: ACCENT_COLORS.purple }}
        >
          MagicSkeleton:
        </Box>
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.5rem',
            borderRadius: '4px',
            height: '120px',
            overflow: 'hidden',
          }}
        >
          <MagicSkeleton />
        </Box>
      </Stack.Item>
      <Stack.Item basis="48%" mb={1} mr="2%">
        <Box
          bold
          mb={0.5}
          style={{ fontSize: '0.8rem', color: ACCENT_COLORS.teal }}
        >
          CoreSkeleton:
        </Box>
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.5rem',
            borderRadius: '4px',
            height: '120px',
            overflow: 'hidden',
          }}
        >
          <CoreSkeleton />
        </Box>
      </Stack.Item>
      <Stack.Item basis="48%" mb={1}>
        <Box
          bold
          mb={0.5}
          style={{ fontSize: '0.8rem', color: ACCENT_COLORS.yellow }}
        >
          ConnectionsSkeleton:
        </Box>
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.5rem',
            borderRadius: '4px',
            height: '120px',
            overflow: 'hidden',
          }}
        >
          <ConnectionsSkeleton />
        </Box>
      </Stack.Item>
    </Stack>
  </Stack>
);
