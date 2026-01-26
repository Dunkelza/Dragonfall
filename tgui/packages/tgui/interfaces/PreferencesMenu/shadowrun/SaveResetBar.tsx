/**
 * Save/Reset Action Bar Component
 *
 * Displays save/reset buttons, undo/redo controls, and validation summary for chargen.
 */

import { Tooltip } from 'tgui-core/components';

import { Box, Button, Icon, Stack } from '../../../components';
import { ShadowrunTab } from './TabContentRouter';

type ValidationIssue = {
  message: string;
  section: string;
  severity: 'error' | 'warning' | 'info';
};

type Validation = {
  canSave: boolean;
  errorCount: number;
  issues: ValidationIssue[];
  warningCount: number;
};

type UndoRedoState = {
  canRedo: boolean;
  canUndo: boolean;
  futureCount: number;
  historyCount: number;
  lastChangeLabel?: string;
  nextRedoLabel?: string;
};

/**
 * Maps validation section names to the appropriate tab.
 * Used for click-to-navigate on validation errors.
 */
export function getSectionTab(section: string): ShadowrunTab | null {
  switch (section) {
    case 'attributes':
    case 'skills':
    case 'special':
    case 'priorities':
      return ShadowrunTab.Build;
    case 'magic':
      return ShadowrunTab.Magic;
    case 'augments':
      return ShadowrunTab.Augments;
    case 'gear':
      return ShadowrunTab.Gear;
    case 'drones':
      return ShadowrunTab.Drones;
    case 'contacts':
    case 'knowledge':
      return ShadowrunTab.Connections;
    case 'qualities':
      return ShadowrunTab.Qualities;
    case 'metatype':
    case 'nuyen':
      return ShadowrunTab.Build;
    default:
      return null;
  }
}

type SaveResetBarProps = {
  isSaved: boolean;
  /** Called when user clicks on a validation error to navigate to that section */
  onNavigateToSection?: (tab: ShadowrunTab) => void;
  onRedo?: () => void;
  onResetAll: () => void;
  onSaveSheet: () => void;
  onUndo?: () => void;
  undoRedo?: UndoRedoState;
  validation: Validation;
};

export const SaveResetBar = (props: SaveResetBarProps) => {
  const {
    isSaved,
    validation,
    onResetAll,
    onSaveSheet,
    onUndo,
    onRedo,
    onNavigateToSection,
    undoRedo,
  } = props;

  // Handle clicking on a validation issue to navigate
  const handleIssueClick = (issue: ValidationIssue) => {
    if (!onNavigateToSection) return;
    const tab = getSectionTab(issue.section);
    if (tab) {
      onNavigateToSection(tab);
    }
  };

  // Build tooltip content for undo/redo
  const undoTooltip = undoRedo?.canUndo
    ? `Undo${undoRedo.lastChangeLabel ? `: ${undoRedo.lastChangeLabel}` : ''} (Ctrl+Z)`
    : 'Nothing to undo';

  const redoTooltip = undoRedo?.canRedo
    ? `Redo${undoRedo.nextRedoLabel ? `: ${undoRedo.nextRedoLabel}` : ''} (Ctrl+Y)`
    : 'Nothing to redo';

  const undoDisabled = !undoRedo?.canUndo || isSaved;
  const redoDisabled = !undoRedo?.canRedo || isSaved;

  return (
    <Box
      style={{
        background: isSaved
          ? 'linear-gradient(135deg, rgba(0, 80, 0, 0.3), rgba(0, 40, 0, 0.4))'
          : 'linear-gradient(135deg, rgba(60, 50, 20, 0.3), rgba(40, 30, 10, 0.4))',
        borderLeft: isSaved
          ? '3px solid rgba(0, 255, 0, 0.6)'
          : '3px solid rgba(202, 165, 61, 0.6)',
        padding: '0.5rem 0.75rem',
        marginBottom: '0.5rem',
        borderRadius: '2px',
      }}
    >
      <Stack align="center">
        <Stack.Item grow>
          <Box
            style={{
              fontSize: '0.95rem',
              fontWeight: 'bold',
              color: isSaved ? '#6bff6b' : '#caa53d',
            }}
          >
            <Icon name={isSaved ? 'check-circle' : 'edit'} mr={0.5} />
            {isSaved ? 'Sheet Saved' : 'Editing Sheet'}
          </Box>
          <Box style={{ fontSize: '0.75rem', opacity: '0.7' }}>
            {isSaved
              ? 'Character locked. Reset All to make changes.'
              : 'Allocate points, then save to lock your character.'}
          </Box>
        </Stack.Item>
        <Stack.Item>
          <Stack>
            {/* Undo/Redo buttons - only show when available and not saved */}
            {onUndo && onRedo && (
              <>
                <Stack.Item>
                  <Tooltip content={undoTooltip}>
                    <Button
                      icon="undo"
                      disabled={undoDisabled}
                      onClick={onUndo}
                      color={undoDisabled ? 'transparent' : 'default'}
                    />
                  </Tooltip>
                </Stack.Item>
                <Stack.Item>
                  <Tooltip content={redoTooltip}>
                    <Button
                      icon="redo"
                      disabled={redoDisabled}
                      onClick={onRedo}
                      color={redoDisabled ? 'transparent' : 'default'}
                    />
                  </Tooltip>
                </Stack.Item>
                <Stack.Item ml={0.5}>
                  <Box
                    style={{
                      borderLeft: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                    }}
                  />
                </Stack.Item>
              </>
            )}
            <Stack.Item ml={onUndo && onRedo ? 0.5 : 0}>
              <Button
                color="bad"
                icon="trash"
                onClick={onResetAll}
                tooltip="Reset all selections and unlock editing"
              >
                Reset All
              </Button>
            </Stack.Item>
            <Stack.Item ml={0.5}>
              {!isSaved ? (
                <Button
                  color="good"
                  icon="save"
                  disabled={!validation.canSave}
                  onClick={onSaveSheet}
                  tooltip={
                    !validation.canSave
                      ? `Fix ${validation.errorCount} error(s) before saving`
                      : validation.warningCount > 0
                        ? `Save with ${validation.warningCount} warning(s)`
                        : 'Save and lock character sheet'
                  }
                >
                  Save Sheet
                </Button>
              ) : (
                <Button color="good" icon="check" disabled>
                  Saved
                </Button>
              )}
            </Stack.Item>
          </Stack>
        </Stack.Item>
      </Stack>

      {/* Validation Summary */}
      {!isSaved && validation.issues.length > 0 && (
        <Box
          mt={0.5}
          style={{
            background:
              validation.errorCount > 0
                ? 'rgba(255, 107, 107, 0.15)'
                : 'rgba(255, 183, 77, 0.15)',
            border: `1px solid ${validation.errorCount > 0 ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 183, 77, 0.4)'}`,
            borderRadius: '4px',
            padding: '0.5rem',
            fontSize: '0.8rem',
          }}
        >
          <Box
            style={{
              fontWeight: 'bold',
              marginBottom: '0.25rem',
              color: validation.errorCount > 0 ? '#ff6b6b' : '#ffb74d',
            }}
          >
            <Icon
              name={
                validation.errorCount > 0
                  ? 'exclamation-circle'
                  : 'exclamation-triangle'
              }
              mr={0.5}
            />
            {validation.errorCount > 0
              ? `${validation.errorCount} Error(s)`
              : `${validation.warningCount} Warning(s)`}
            {onNavigateToSection && (
              <Box
                as="span"
                style={{
                  fontSize: '0.7rem',
                  opacity: '0.6',
                  marginLeft: '0.5rem',
                  fontWeight: 'normal',
                }}
              >
                (click to navigate)
              </Box>
            )}
          </Box>
          {validation.issues.slice(0, 4).map((issue, idx) => {
            const targetTab = getSectionTab(issue.section);
            const isClickable = onNavigateToSection && targetTab;

            return (
              <Tooltip
                key={idx}
                content={
                  isClickable
                    ? `Click to go to ${issue.section} section`
                    : undefined
                }
              >
                <Box
                  style={{
                    color: issue.severity === 'error' ? '#ff6b6b' : '#ffb74d',
                    paddingLeft: '1rem',
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                    borderRadius: '2px',
                    padding: '0.15rem 0.25rem 0.15rem 1rem',
                    marginLeft: '-0.25rem',
                  }}
                  onClick={
                    isClickable ? () => handleIssueClick(issue) : undefined
                  }
                  className={
                    isClickable
                      ? 'PreferencesMenu__ShadowrunSheet__validationIssue--clickable'
                      : undefined
                  }
                >
                  • {issue.message}
                  {isClickable && (
                    <Icon
                      name="arrow-right"
                      size="0.8"
                      style={{
                        marginLeft: '0.5rem',
                        opacity: '0.5',
                      }}
                    />
                  )}
                </Box>
              </Tooltip>
            );
          })}
          {validation.issues.length > 4 && (
            <Box
              style={{
                color: 'rgba(255,255,255,0.5)',
                paddingLeft: '1rem',
                fontStyle: 'italic',
              }}
            >
              ...and {validation.issues.length - 4} more
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
