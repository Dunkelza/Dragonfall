/**
 * Save/Reset Action Bar Component
 *
 * Displays save/reset buttons, undo/redo controls, and validation summary for chargen.
 * Includes a validation summary modal before final save.
 */

import { useState } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Button, Icon, Stack } from '../../../components';
import { ShadowrunTab } from './TabContentRouter';

type ValidationIssue = {
  fixAction?: {
    amount?: number;
    label: string;
    targetId?: string;
    type: string;
  };
  message: string;
  section: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
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
    case 'knowledge': // Knowledge skills moved to Build tab
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

  // Modal state for validation summary before save
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Handle clicking on a validation issue to navigate
  const handleIssueClick = (issue: ValidationIssue) => {
    if (!onNavigateToSection) return;
    const tab = getSectionTab(issue.section);
    if (tab) {
      onNavigateToSection(tab);
      setShowValidationModal(false); // Close modal when navigating
    }
  };

  // Handle save button click - show modal if there are warnings, otherwise save directly
  const handleSaveClick = () => {
    if (validation.warningCount > 0 || validation.issues.length > 0) {
      setShowValidationModal(true);
    } else {
      onSaveSheet();
    }
  };

  // Confirm save from modal
  const handleConfirmSave = () => {
    setShowValidationModal(false);
    onSaveSheet();
  };

  // Group issues by section for the modal
  const issuesBySection = validation.issues.reduce(
    (acc, issue) => {
      const section = issue.section;
      if (!acc[section]) acc[section] = [];
      acc[section].push(issue);
      return acc;
    },
    {} as Record<string, ValidationIssue[]>,
  );

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
                  onClick={handleSaveClick}
                  tooltip={
                    !validation.canSave
                      ? `Fix ${validation.errorCount} error(s) before saving`
                      : validation.warningCount > 0
                        ? `Review ${validation.warningCount} warning(s) before saving`
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
            const hasSuggestion = !!issue.suggestion;

            return (
              <Box key={idx} style={{ marginBottom: '0.25rem' }}>
                <Tooltip
                  content={
                    isClickable
                      ? `Click to go to ${issue.section} section`
                      : undefined
                  }
                >
                  <Box
                    style={{
                      color: issue.severity === 'error' ? '#ff6b6b' : '#ffb74d',
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                      borderRadius: '2px',
                      padding: '0.15rem 0.25rem 0.15rem 1rem',
                      marginLeft: '-0.25rem',
                      display: 'inline-flex',
                      alignItems: 'center',
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
                {/* Fix-it suggestion */}
                {hasSuggestion && (
                  <Box
                    style={{
                      marginLeft: '1.5rem',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontStyle: 'italic',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Icon
                      name="lightbulb"
                      size="0.75"
                      style={{ color: '#ffc107', opacity: '0.8' }}
                    />
                    <span>{issue.suggestion}</span>
                  </Box>
                )}
              </Box>
            );
          })}
          {validation.issues.length > 4 && (
            <Box
              style={{
                color: 'rgba(255,255,255,0.5)',
                paddingLeft: '1rem',
                fontStyle: 'italic',
                cursor: 'pointer',
              }}
              onClick={() => setShowValidationModal(true)}
            >
              ...and {validation.issues.length - 4} more{' '}
              <Icon name="external-link-alt" size="0.7" />
            </Box>
          )}
        </Box>
      )}

      {/* Validation Summary Modal */}
      {showValidationModal && (
        <ValidationSummaryModal
          validation={validation}
          issuesBySection={issuesBySection}
          onClose={() => setShowValidationModal(false)}
          onConfirmSave={handleConfirmSave}
          onIssueClick={handleIssueClick}
          canSave={validation.canSave}
        />
      )}
    </Box>
  );
};

// ============================================================================
// Validation Summary Modal Component
// ============================================================================

/** Section display names and icons */
const SECTION_CONFIG: Record<
  string,
  { color: string; icon: string; name: string }
> = {
  attributes: { color: '#caa53d', icon: 'user', name: 'Attributes' },
  skills: { color: '#03fca1', icon: 'graduation-cap', name: 'Skills' },
  special: { color: '#9b59b6', icon: 'star', name: 'Special Attributes' },
  priorities: { color: '#caa53d', icon: 'list-ol', name: 'Priorities' },
  magic: { color: '#9c27b0', icon: 'hat-wizard', name: 'Magic' },
  augments: { color: '#ff6b6b', icon: 'microchip', name: 'Augments' },
  gear: { color: '#ff9500', icon: 'briefcase', name: 'Gear' },
  drones: { color: '#4fc3f7', icon: 'robot', name: 'Drones' },
  contacts: { name: 'Contacts', icon: 'users', color: '#f1c40f' },
  knowledge: { name: 'Knowledge', icon: 'book', color: '#2ecc71' },
  qualities: { name: 'Qualities', icon: 'gem', color: '#66bb6a' },
  metatype: { name: 'Metatype', icon: 'dna', color: '#e91e63' },
  nuyen: { name: 'Resources', icon: 'coins', color: '#ffc107' },
};

type ValidationSummaryModalProps = {
  canSave: boolean;
  issuesBySection: Record<string, ValidationIssue[]>;
  onClose: () => void;
  onConfirmSave: () => void;
  onIssueClick: (issue: ValidationIssue) => void;
  validation: Validation;
};

const ValidationSummaryModal = (props: ValidationSummaryModalProps) => {
  const {
    validation,
    issuesBySection,
    onClose,
    onConfirmSave,
    onIssueClick,
    canSave,
  } = props;

  const sections = Object.keys(issuesBySection);
  const hasErrors = validation.errorCount > 0;
  const hasWarnings = validation.warningCount > 0;
  const infoCount = validation.issues.filter(
    (i) => i.severity === 'info',
  ).length;

  return (
    <Box
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: '1000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <Box
        style={{
          background: hasErrors
            ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(0, 0, 0, 0.8))'
            : hasWarnings
              ? 'linear-gradient(135deg, rgba(255, 183, 77, 0.1), rgba(0, 0, 0, 0.8))'
              : 'linear-gradient(135deg, rgba(102, 187, 106, 0.1), rgba(0, 0, 0, 0.8))',
          border: hasErrors
            ? '2px solid rgba(255, 107, 107, 0.5)'
            : hasWarnings
              ? '2px solid rgba(255, 183, 77, 0.5)'
              : '2px solid rgba(102, 187, 106, 0.5)',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: hasErrors
            ? '0 0 30px rgba(255, 107, 107, 0.3)'
            : hasWarnings
              ? '0 0 30px rgba(255, 183, 77, 0.3)'
              : '0 0 30px rgba(102, 187, 106, 0.3)',
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <Stack justify="space-between" align="center" mb={1}>
          <Stack.Item>
            <Box
              style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: hasErrors
                  ? '#ff6b6b'
                  : hasWarnings
                    ? '#ffb74d'
                    : '#66bb6a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon
                name={
                  hasErrors
                    ? 'exclamation-circle'
                    : hasWarnings
                      ? 'exclamation-triangle'
                      : 'check-circle'
                }
              />
              Validation Summary
            </Box>
          </Stack.Item>
          <Stack.Item>
            <Button icon="times" color="transparent" onClick={onClose} />
          </Stack.Item>
        </Stack>

        {/* Summary counts */}
        <Box
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
          }}
        >
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color:
                validation.errorCount > 0 ? '#ff6b6b' : 'rgba(255,255,255,0.4)',
            }}
          >
            <Icon name="times-circle" />
            <span style={{ fontWeight: 'bold' }}>{validation.errorCount}</span>
            <span style={{ opacity: '0.7' }}>Errors</span>
          </Box>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color:
                validation.warningCount > 0
                  ? '#ffb74d'
                  : 'rgba(255,255,255,0.4)',
            }}
          >
            <Icon name="exclamation-triangle" />
            <span style={{ fontWeight: 'bold' }}>
              {validation.warningCount}
            </span>
            <span style={{ opacity: '0.7' }}>Warnings</span>
          </Box>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: infoCount > 0 ? '#4fc3f7' : 'rgba(255,255,255,0.4)',
            }}
          >
            <Icon name="info-circle" />
            <span style={{ fontWeight: 'bold' }}>{infoCount}</span>
            <span style={{ opacity: '0.7' }}>Suggestions</span>
          </Box>
        </Box>

        {/* Issues by section */}
        {sections.length === 0 ? (
          <Box
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#66bb6a',
            }}
          >
            <Icon name="check-circle" size={2} />
            <Box mt={1} style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              Character is ready to save!
            </Box>
            <Box style={{ opacity: '0.7', fontSize: '0.9rem' }}>
              No validation issues found.
            </Box>
          </Box>
        ) : (
          <Box style={{ marginBottom: '1rem' }}>
            {sections.map((section) => {
              const issues = issuesBySection[section];
              const config = SECTION_CONFIG[section] || {
                name: section.charAt(0).toUpperCase() + section.slice(1),
                icon: 'folder',
                color: '#9e9e9e',
              };
              const sectionErrors = issues.filter(
                (i) => i.severity === 'error',
              );
              const sectionWarnings = issues.filter(
                (i) => i.severity === 'warning',
              );
              const sectionInfo = issues.filter((i) => i.severity === 'info');

              return (
                <Box
                  key={section}
                  style={{
                    marginBottom: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: `1px solid rgba(${sectionErrors.length > 0 ? '255, 107, 107' : sectionWarnings.length > 0 ? '255, 183, 77' : '79, 195, 247'}, 0.3)`,
                    borderLeft: `3px solid ${config.color}`,
                    borderRadius: '4px',
                  }}
                >
                  {/* Section header */}
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      color: config.color,
                      fontWeight: 'bold',
                    }}
                  >
                    <Icon name={config.icon} />
                    {config.name}
                    <Box
                      style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      {sectionErrors.length > 0 && (
                        <Box style={{ color: '#ff6b6b' }}>
                          {sectionErrors.length} error
                          {sectionErrors.length > 1 ? 's' : ''}
                        </Box>
                      )}
                      {sectionWarnings.length > 0 && (
                        <Box style={{ color: '#ffb74d' }}>
                          {sectionWarnings.length} warning
                          {sectionWarnings.length > 1 ? 's' : ''}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Issues list */}
                  {issues.map((issue, idx) => (
                    <Box
                      key={idx}
                      style={{
                        padding: '0.35rem 0.5rem',
                        marginBottom: '0.25rem',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        transition: 'background 0.15s ease',
                      }}
                      className="PreferencesMenu__ShadowrunSheet__validationIssue--clickable"
                      onClick={() => onIssueClick(issue)}
                    >
                      <Box
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                        }}
                      >
                        <Icon
                          name={
                            issue.severity === 'error'
                              ? 'times-circle'
                              : issue.severity === 'warning'
                                ? 'exclamation-triangle'
                                : 'info-circle'
                          }
                          style={{
                            color:
                              issue.severity === 'error'
                                ? '#ff6b6b'
                                : issue.severity === 'warning'
                                  ? '#ffb74d'
                                  : '#4fc3f7',
                            marginTop: '0.15rem',
                          }}
                        />
                        <Box style={{ flex: 1 }}>
                          <Box
                            style={{
                              color:
                                issue.severity === 'error'
                                  ? '#ff6b6b'
                                  : issue.severity === 'warning'
                                    ? '#ffb74d'
                                    : 'rgba(255,255,255,0.9)',
                            }}
                          >
                            {issue.message}
                          </Box>
                          {issue.suggestion && (
                            <Box
                              style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontStyle: 'italic',
                                marginTop: '0.15rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Icon
                                name="lightbulb"
                                size="0.7"
                                style={{ color: '#ffc107' }}
                              />
                              {issue.suggestion}
                            </Box>
                          )}
                        </Box>
                        <Icon
                          name="arrow-right"
                          style={{
                            opacity: '0.4',
                            marginTop: '0.15rem',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Footer actions */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Button icon="arrow-left" onClick={onClose}>
            Go Back
          </Button>
          {canSave ? (
            <Button
              color={hasWarnings ? 'caution' : 'good'}
              icon="save"
              onClick={onConfirmSave}
            >
              {hasWarnings
                ? `Save Anyway (${validation.warningCount} warnings)`
                : 'Save Character'}
            </Button>
          ) : (
            <Tooltip content="Fix all errors before saving">
              <Button color="bad" icon="times" disabled>
                Cannot Save ({validation.errorCount} errors)
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};
