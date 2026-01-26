/**
 * Save/Reset Action Bar Component
 *
 * Displays save/reset buttons and validation summary for chargen.
 */

import { Box, Button, Icon, Stack } from '../../../components';

type ValidationIssue = {
  message: string;
  severity: 'error' | 'warning';
};

type Validation = {
  canSave: boolean;
  errorCount: number;
  issues: ValidationIssue[];
  warningCount: number;
};

type SaveResetBarProps = {
  isSaved: boolean;
  onResetAll: () => void;
  onSaveSheet: () => void;
  validation: Validation;
};

export const SaveResetBar = (props: SaveResetBarProps) => {
  const { isSaved, validation, onResetAll, onSaveSheet } = props;

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
            <Stack.Item>
              <Button
                color="bad"
                icon="undo"
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
          </Box>
          {validation.issues.slice(0, 4).map((issue, idx) => (
            <Box
              key={idx}
              style={{
                color: issue.severity === 'error' ? '#ff6b6b' : '#ffb74d',
                paddingLeft: '1rem',
              }}
            >
              • {issue.message}
            </Box>
          ))}
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
