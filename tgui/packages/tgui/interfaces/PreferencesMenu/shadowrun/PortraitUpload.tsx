/**
 * Portrait Upload Component
 *
 * Allows users to upload character portrait images via URL.
 * Validates that images are hosted on catbox.moe, are .png/.jpg, and under 6MB.
 */

import { useCallback, useEffect, useState } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Button, Icon, Input, Stack } from '../../../components';
import {
  PORTRAIT_REQUIRED_HOST,
  validatePortraitSize,
  validatePortraitUrl,
} from './calculations';

// ============================================================================
// TYPES
// ============================================================================

export type PortraitType = 'headshot' | 'bodyshot';

export type PortraitUploadProps = {
  /** Whether the input is disabled (e.g., when character is saved). */
  disabled?: boolean;
  /** Callback when portrait URL changes. */
  onChange: (url: string) => void;
  /** Type of portrait (affects display size and label). */
  type: PortraitType;
  /** Current portrait URL value. */
  value?: string;
};

type ValidationState = {
  message?: string;
  status: 'idle' | 'validating' | 'valid' | 'error' | 'warning';
};

// ============================================================================
// CONSTANTS
// ============================================================================

const PORTRAIT_DIMENSIONS: Record<
  PortraitType,
  { height: number; width: number }
> = {
  headshot: { width: 150, height: 150 },
  bodyshot: { width: 200, height: 300 },
};

const PORTRAIT_LABELS: Record<PortraitType, string> = {
  headshot: 'Headshot',
  bodyshot: 'Full Body',
};

const PORTRAIT_DESCRIPTIONS: Record<PortraitType, string> = {
  headshot: "A close-up portrait showing your character's face.",
  bodyshot: "A full-body image showing your character's appearance.",
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Portrait upload component with URL validation and preview.
 *
 * @example
 * ```tsx
 * <PortraitUpload
 *   type="headshot"
 *   value={chargenState.portrait_headshot}
 *   onChange={(url) => updateChargenState({ portrait_headshot: url })}
 *   disabled={isSaved}
 * />
 * ```
 */
export function PortraitUpload({
  onChange,
  value = '',
  type,
  disabled = false,
}: PortraitUploadProps) {
  const [inputValue, setInputValue] = useState(value);
  const [validation, setValidation] = useState<ValidationState>({
    status: 'idle',
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showInput, setShowInput] = useState(!value);

  const dimensions = PORTRAIT_DIMENSIONS[type];
  const label = PORTRAIT_LABELS[type];
  const description = PORTRAIT_DESCRIPTIONS[type];

  // Sync input with external value changes
  useEffect(() => {
    setInputValue(value);
    if (value) {
      setShowInput(false);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [value]);

  // Validate URL when input changes
  const validateUrl = useCallback(async (url: string) => {
    if (!url.trim()) {
      setValidation({ status: 'idle' });
      return;
    }

    // First, do synchronous validation
    const syncResult = validatePortraitUrl(url);
    if (!syncResult.isValid) {
      setValidation({ status: 'error', message: syncResult.error });
      return;
    }

    // Then, check file size asynchronously
    setValidation({ status: 'validating', message: 'Checking image...' });

    const sizeResult = await validatePortraitSize(url);
    if (!sizeResult.isValid) {
      setValidation({ status: 'error', message: sizeResult.error });
      return;
    }

    if (sizeResult.warning) {
      setValidation({ status: 'warning', message: sizeResult.warning });
    } else {
      setValidation({
        status: 'valid',
        message: 'Image validated successfully',
      });
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    setImageLoaded(false);
    setImageError(false);
  }, []);

  // Handle submit (Enter key or button click)
  const handleSubmit = useCallback(async () => {
    const trimmedUrl = inputValue.trim();

    if (!trimmedUrl) {
      onChange('');
      setValidation({ status: 'idle' });
      setShowInput(true);
      return;
    }

    // Validate before submitting
    const syncResult = validatePortraitUrl(trimmedUrl);
    if (!syncResult.isValid) {
      setValidation({ status: 'error', message: syncResult.error });
      return;
    }

    // Check size
    setValidation({ status: 'validating', message: 'Validating image...' });
    const sizeResult = await validatePortraitSize(trimmedUrl);

    if (!sizeResult.isValid) {
      setValidation({ status: 'error', message: sizeResult.error });
      return;
    }

    // Success - update the value
    onChange(trimmedUrl);
    setValidation({ status: 'valid', message: 'Portrait saved' });
    setShowInput(false);
  }, [inputValue, onChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
    setValidation({ status: 'idle' });
    setShowInput(true);
    setImageLoaded(false);
    setImageError(false);
  }, [onChange]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    setImageError(true);
  }, []);

  // Get validation icon and color
  const getValidationDisplay = () => {
    switch (validation.status) {
      case 'validating':
        return { icon: 'spinner', color: '#4a90d9', spin: true };
      case 'valid':
        return { icon: 'check-circle', color: '#4caf50', spin: false };
      case 'error':
        return { icon: 'times-circle', color: '#f44336', spin: false };
      case 'warning':
        return { icon: 'exclamation-triangle', color: '#ff9800', spin: false };
      default:
        return null;
    }
  };

  const validationDisplay = getValidationDisplay();

  return (
    <Box className="PortraitUpload">
      {/* Label and Description */}
      <Stack mb={1}>
        <Stack.Item grow>
          <Box bold fontSize="14px" color="#e0e0e0">
            {label}
          </Box>
          <Box fontSize="11px" color="#9e9e9e" mt={0.5}>
            {description}
          </Box>
        </Stack.Item>
        <Stack.Item>
          <Tooltip
            content={`Images must be hosted on ${PORTRAIT_REQUIRED_HOST}, be .png or .jpg, and under 6MB.`}
          >
            <Icon name="info-circle" color="#666" />
          </Tooltip>
        </Stack.Item>
      </Stack>

      {/* Preview Area */}
      <Box
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          background: '#1a1a2e',
          border: '2px dashed #333',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '8px',
        }}
      >
        {value && !imageError ? (
          <>
            <img
              src={value}
              alt={`Character ${label}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                opacity: imageLoaded ? 1 : 0.3,
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!imageLoaded && !imageError && (
              <Box
                style={{
                  position: 'absolute',
                  color: '#666',
                }}
              >
                <Icon name="spinner" spin /> Loading...
              </Box>
            )}
            {/* Clear button overlay */}
            {!disabled && (
              <Box
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                }}
              >
                <Button
                  icon="times"
                  color="bad"
                  tooltip="Remove portrait"
                  onClick={handleClear}
                />
              </Box>
            )}
          </>
        ) : imageError ? (
          <Stack vertical align="center">
            <Stack.Item>
              <Icon name="image-slash" size={2} color="#666" />
            </Stack.Item>
            <Stack.Item>
              <Box color="#f44336" fontSize="11px" mt={1}>
                Failed to load image
              </Box>
            </Stack.Item>
          </Stack>
        ) : (
          <Stack vertical align="center">
            <Stack.Item>
              <Icon name="image" size={2} color="#444" />
            </Stack.Item>
            <Stack.Item>
              <Box color="#666" fontSize="11px" mt={1}>
                No portrait set
              </Box>
            </Stack.Item>
          </Stack>
        )}
      </Box>

      {/* URL Input */}
      {(showInput || !value) && !disabled && (
        <Box mb={1}>
          <Stack>
            <Stack.Item grow>
              <Input
                fluid
                placeholder={`https://${PORTRAIT_REQUIRED_HOST}/...`}
                value={inputValue}
                onChange={(e, newValue) => handleInputChange(newValue)}
                onEnter={handleSubmit}
                disabled={disabled || validation.status === 'validating'}
              />
            </Stack.Item>
            <Stack.Item>
              <Button
                icon="check"
                color="good"
                tooltip="Set portrait"
                onClick={handleSubmit}
                disabled={
                  disabled ||
                  validation.status === 'validating' ||
                  !inputValue.trim()
                }
              />
            </Stack.Item>
          </Stack>
        </Box>
      )}

      {/* Edit button when URL is set */}
      {value && !showInput && !disabled && (
        <Button icon="edit" fluid onClick={() => setShowInput(true)}>
          Change URL
        </Button>
      )}

      {/* Validation Message */}
      {validation.message && (
        <Box
          mt={1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: validationDisplay?.color || '#9e9e9e',
          }}
        >
          {validationDisplay && (
            <Icon name={validationDisplay.icon} spin={validationDisplay.spin} />
          )}
          <span>{validation.message}</span>
        </Box>
      )}

      {/* Requirements hint */}
      {showInput && !disabled && !validation.message && (
        <Box mt={1} fontSize="10px" color="#666">
          Accepted: .png, .jpg • Max: 6MB • Host: catbox.moe
        </Box>
      )}
    </Box>
  );
}

// ============================================================================
// PORTRAITS SECTION (for CoreTabContent)
// ============================================================================

export type PortraitsSectionProps = {
  /** Whether the section is disabled. */
  disabled?: boolean;
  /** Callback for updating the character state. */
  onUpdate: (updates: {
    portrait_bodyshot?: string;
    portrait_headshot?: string;
  }) => void;
  /** Current bodyshot URL. */
  portraitBodyshot?: string;
  /** Current headshot URL. */
  portraitHeadshot?: string;
};

/**
 * Combined portraits section with both headshot and bodyshot uploaders.
 */
export function PortraitsSection({
  onUpdate,
  portraitHeadshot = '',
  portraitBodyshot = '',
  disabled = false,
}: PortraitsSectionProps) {
  return (
    <Box>
      <Stack wrap>
        <Stack.Item>
          <PortraitUpload
            type="headshot"
            value={portraitHeadshot}
            onChange={(url) => onUpdate({ portrait_headshot: url })}
            disabled={disabled}
          />
        </Stack.Item>
        <Stack.Item ml={2}>
          <PortraitUpload
            type="bodyshot"
            value={portraitBodyshot}
            onChange={(url) => onUpdate({ portrait_bodyshot: url })}
            disabled={disabled}
          />
        </Stack.Item>
      </Stack>

      {/* Help text */}
      <Box
        mt={2}
        p={1}
        style={{ background: 'rgba(74, 144, 217, 0.1)', borderRadius: '4px' }}
      >
        <Stack>
          <Stack.Item>
            <Icon name="info-circle" color="#4a90d9" />
          </Stack.Item>
          <Stack.Item grow ml={1}>
            <Box fontSize="11px" color="#9e9e9e">
              <strong>How to upload:</strong> Upload your image to{' '}
              <a
                href="https://catbox.moe/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4a90d9' }}
              >
                catbox.moe
              </a>{' '}
              and paste the direct link here. Images must be .png or .jpg and
              under 6MB.
            </Box>
          </Stack.Item>
        </Stack>
      </Box>
    </Box>
  );
}
