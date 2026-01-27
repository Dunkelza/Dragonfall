/**
 * Preset Selector component for SR5 character generation
 *
 * Allows players to quickly apply predefined character archetypes/templates.
 * Templates include COMPLETE character builds with all point allocations.
 */

import { memo, useCallback, useState } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Button, Icon, Modal, Stack } from '../../../components';
import { PRIORITY_CATEGORIES } from './constants';
import {
  CharacterPreset,
  getPresetsByCategory,
  presetToChargenState,
} from './presets';
import { EmbeddableChargenProps } from './types';

export type PresetSelectorProps = EmbeddableChargenProps;

// Accent colors
const PRESET_ACCENT = '#03fca1';
const PRESET_ACCENT_DIM = 'rgba(3, 252, 161, 0.15)';
const PRESET_ACCENT_BORDER = 'rgba(3, 252, 161, 0.4)';

// Category colors for visual grouping
const CATEGORY_COLORS: Record<string, string> = {
  Combat: '#ff6b6b',
  Magic: '#9b59b6',
  Tech: '#00d4ff',
  Social: '#f1c40f',
  Specialist: '#26a69a',
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  Combat: 'sword',
  Magic: 'hat-wizard',
  Tech: 'microchip',
  Social: 'users',
  Specialist: 'star',
};

const getLetterColor = (letter: string): string => {
  switch (letter) {
    case 'A':
      return '#4caf50';
    case 'B':
      return '#8bc34a';
    case 'C':
      return '#ffeb3b';
    case 'D':
      return '#ff9800';
    default:
      return '#f44336';
  }
};

interface PresetCardProps {
  categoryColor: string;
  onSelect: (preset: CharacterPreset) => void;
  preset: CharacterPreset;
}

const PresetCard = memo(
  ({ preset, onSelect, categoryColor }: PresetCardProps) => {
    const [hovered, setHovered] = useState(false);

    return (
      <Box
        style={{
          background: hovered
            ? `linear-gradient(135deg, ${categoryColor}20, rgba(0, 0, 0, 0.5))`
            : 'rgba(0, 0, 0, 0.3)',
          border: hovered
            ? `1px solid ${categoryColor}60`
            : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          padding: '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={() => onSelect(preset)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header row */}
        <Stack align="center" mb="0.5rem">
          <Stack.Item>
            <Box
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `${categoryColor}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name={preset.icon}
                style={{ color: categoryColor, fontSize: '1rem' }}
              />
            </Box>
          </Stack.Item>
          <Stack.Item grow>
            <Box
              style={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                color: hovered ? categoryColor : '#fff',
              }}
            >
              {preset.name}
            </Box>
          </Stack.Item>
        </Stack>

        {/* Description */}
        <Box
          style={{
            fontSize: '0.8rem',
            opacity: 0.7,
            marginBottom: '0.5rem',
            lineHeight: '1.3',
          }}
        >
          {preset.description}
        </Box>

        {/* Priority letters display */}
        <Stack wrap="wrap" style={{ gap: '0.25rem' }}>
          {PRIORITY_CATEGORIES.map((category) => {
            const letter =
              preset.priorities[category as keyof typeof preset.priorities];
            const letterColor = getLetterColor(letter);
            const categoryLabel = category.charAt(0).toUpperCase();

            return (
              <Stack.Item key={category}>
                <Tooltip
                  content={`${category}: Priority ${letter}`}
                  position="top"
                >
                  <Box
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.15rem 0.35rem',
                      borderRadius: '3px',
                      fontSize: '0.7rem',
                    }}
                  >
                    <span style={{ opacity: 0.6 }}>{categoryLabel}:</span>
                    <span style={{ color: letterColor, fontWeight: 'bold' }}>
                      {letter}
                    </span>
                  </Box>
                </Tooltip>
              </Stack.Item>
            );
          })}
        </Stack>

        {/* Awakening badge for magic users */}
        {preset.awakening !== 'mundane' && (
          <Box
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: '#9b59b620',
              border: '1px solid #9b59b640',
              padding: '0.15rem 0.4rem',
              borderRadius: '3px',
              fontSize: '0.65rem',
              color: '#9b59b6',
              textTransform: 'capitalize',
            }}
          >
            {preset.awakening.replace('_', ' ')}
          </Box>
        )}
      </Box>
    );
  },
);

interface PresetConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  preset: CharacterPreset;
}

/**
 * Extract a readable name from a type path
 * e.g., "/datum/sr_spell/combat/manabolt" -> "Manabolt"
 */
const extractName = (path: string): string => {
  const parts = path.split('/');
  const lastPart = parts[parts.length - 1] || path;
  // Convert snake_case to Title Case
  return lastPart
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PresetConfirmModal = memo(
  ({ preset, onConfirm, onCancel }: PresetConfirmModalProps) => {
    // Count and extract names for what's included
    const skillCount = Object.keys(preset.skills).length;
    const spellNames = preset.spells?.map(extractName) || [];
    const powerNames = Object.keys(preset.adeptPowers || {}).map(extractName);
    const formNames = preset.complexForms?.map(extractName) || [];
    const traditionName = preset.tradition ? extractName(preset.tradition) : '';
    const lifestyleName = preset.lifestyle
      ? preset.lifestyle.charAt(0).toUpperCase() + preset.lifestyle.slice(1)
      : '';

    return (
      <Modal width="500px">
        <Box
          style={{
            padding: '1rem',
            background:
              'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98))',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <Stack align="center" mb="1rem">
            <Stack.Item>
              <Icon
                name="magic"
                style={{ color: PRESET_ACCENT, fontSize: '1.5rem' }}
              />
            </Stack.Item>
            <Stack.Item grow>
              <Box style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                Apply Template: {preset.name}
              </Box>
            </Stack.Item>
          </Stack>

          {/* What's included - basic info */}
          <Box
            style={{
              background: 'rgba(3, 252, 161, 0.1)',
              border: '1px solid rgba(3, 252, 161, 0.3)',
              borderRadius: '4px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <Box
              style={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
            >
              This template includes:
            </Box>
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.25rem',
                fontSize: '0.8rem',
              }}
            >
              <Box>
                <Icon name="check" style={{ color: PRESET_ACCENT }} /> Priority
                Selection
              </Box>
              <Box>
                <Icon name="check" style={{ color: PRESET_ACCENT }} /> All
                Attributes
              </Box>
              <Box>
                <Icon name="check" style={{ color: PRESET_ACCENT }} />{' '}
                {skillCount} Skills
              </Box>
              <Box>
                <Icon name="check" style={{ color: PRESET_ACCENT }} /> Edge
                Allocation
              </Box>
              {traditionName && (
                <Box>
                  <Icon name="check" style={{ color: PRESET_ACCENT }} />{' '}
                  {traditionName} Tradition
                </Box>
              )}
              {lifestyleName && (
                <Box>
                  <Icon name="check" style={{ color: PRESET_ACCENT }} />{' '}
                  {lifestyleName} Lifestyle
                </Box>
              )}
            </Box>
          </Box>

          {/* Spells Section */}
          {spellNames.length > 0 && (
            <Box
              style={{
                background: 'rgba(155, 89, 182, 0.1)',
                border: '1px solid rgba(155, 89, 182, 0.3)',
                borderRadius: '4px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <Box
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  marginBottom: '0.4rem',
                  color: '#9b59b6',
                }}
              >
                <Icon name="hat-wizard" /> Spells ({spellNames.length})
              </Box>
              <Box
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem',
                }}
              >
                {spellNames.map((name, i) => (
                  <Box
                    key={i}
                    style={{
                      background: 'rgba(155, 89, 182, 0.2)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {name}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Adept Powers Section */}
          {powerNames.length > 0 && (
            <Box
              style={{
                background: 'rgba(230, 126, 34, 0.1)',
                border: '1px solid rgba(230, 126, 34, 0.3)',
                borderRadius: '4px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <Box
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  marginBottom: '0.4rem',
                  color: '#e67e22',
                }}
              >
                <Icon name="fist-raised" /> Adept Powers ({powerNames.length})
              </Box>
              <Box
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem',
                }}
              >
                {powerNames.map((name, i) => (
                  <Box
                    key={i}
                    style={{
                      background: 'rgba(230, 126, 34, 0.2)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {name}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Complex Forms Section */}
          {formNames.length > 0 && (
            <Box
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '4px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <Box
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  marginBottom: '0.4rem',
                  color: '#00d4ff',
                }}
              >
                <Icon name="microchip" /> Complex Forms ({formNames.length})
              </Box>
              <Box
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem',
                }}
              >
                {formNames.map((name, i) => (
                  <Box
                    key={i}
                    style={{
                      background: 'rgba(0, 212, 255, 0.2)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {name}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Priority preview */}
          <Box
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <Box
              style={{
                fontSize: '0.8rem',
                opacity: 0.7,
                marginBottom: '0.5rem',
              }}
            >
              Priority Selection:
            </Box>
            <Box
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {PRIORITY_CATEGORIES.map((category) => {
                const letter =
                  preset.priorities[category as keyof typeof preset.priorities];
                const letterColor = getLetterColor(letter);
                return (
                  <Box
                    key={category}
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                      borderLeft: `2px solid ${letterColor}`,
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ opacity: 0.7, textTransform: 'capitalize' }}>
                      {category}:
                    </span>{' '}
                    <span style={{ color: letterColor, fontWeight: 'bold' }}>
                      {letter}
                    </span>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Warning */}
          <Box
            style={{
              background: 'rgba(255, 204, 0, 0.1)',
              border: '1px solid rgba(255, 204, 0, 0.3)',
              borderRadius: '4px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <Stack align="flex-start">
              <Stack.Item>
                <Icon
                  name="exclamation-triangle"
                  style={{ color: '#ffcc00', marginTop: '0.1rem' }}
                />
              </Stack.Item>
              <Stack.Item grow>
                <Box
                  style={{
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                  }}
                >
                  This will <strong>replace your entire character build</strong>{' '}
                  with a complete pre-built template. All current selections
                  will be overwritten.
                </Box>
              </Stack.Item>
            </Stack>
          </Box>

          {/* Playstyle tip */}
          <Box
            style={{
              background: 'rgba(100, 100, 255, 0.1)',
              border: '1px solid rgba(100, 100, 255, 0.3)',
              borderRadius: '4px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <Stack align="flex-start">
              <Stack.Item>
                <Icon
                  name="lightbulb"
                  style={{ color: '#6666ff', marginTop: '0.1rem' }}
                />
              </Stack.Item>
              <Stack.Item grow>
                <Box
                  style={{
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                    opacity: 0.9,
                  }}
                >
                  <strong>Playstyle:</strong> {preset.playstyle}
                </Box>
              </Stack.Item>
            </Stack>
          </Box>

          {/* Action buttons */}
          <Stack justify="flex-end">
            <Stack.Item>
              <Button color="grey" onClick={onCancel}>
                Cancel
              </Button>
            </Stack.Item>
            <Stack.Item>
              <Button color="good" onClick={onConfirm}>
                <Icon name="check" /> Apply Template
              </Button>
            </Stack.Item>
          </Stack>
        </Box>
      </Modal>
    );
  },
);

export const PresetSelector = memo((props: PresetSelectorProps) => {
  const { chargenState, isSaved, act, featureId, setPredictedValue, embedded } =
    props;

  const [showBrowser, setShowBrowser] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CharacterPreset | null>(
    null,
  );

  const presetsByCategory = getPresetsByCategory();

  const handlePresetSelect = useCallback((preset: CharacterPreset) => {
    setSelectedPreset(preset);
  }, []);

  const handleConfirmPreset = useCallback(() => {
    if (!selectedPreset || !chargenState) return;

    // Convert preset to full ChargenState
    const presetState = presetToChargenState(selectedPreset);

    // Merge with existing state, preserving things like saved flag
    const newState = {
      ...chargenState,
      ...presetState,
      // Ensure saved is false since we're making changes
      saved: false,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });

    setSelectedPreset(null);
    setShowBrowser(false);
  }, [selectedPreset, chargenState, setPredictedValue, act, featureId]);

  const handleCancelPreset = useCallback(() => {
    setSelectedPreset(null);
  }, []);

  // Don't show preset selector if saved
  if (isSaved) {
    return null;
  }

  return (
    <>
      {/* Quick preset button */}
      <Box
        style={{
          marginBottom: embedded ? '0.5rem' : '1rem',
        }}
      >
        <Button
          fluid
          style={{
            background: `linear-gradient(135deg, ${PRESET_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
            border: `1px solid ${PRESET_ACCENT_BORDER}`,
            padding: '0.75rem',
          }}
          onClick={() => setShowBrowser(true)}
        >
          <Stack align="center" justify="center">
            <Stack.Item>
              <Icon name="magic" style={{ color: PRESET_ACCENT }} />
            </Stack.Item>
            <Stack.Item>
              <span style={{ color: PRESET_ACCENT, fontWeight: 'bold' }}>
                Quick Start: Choose a Template
              </span>
            </Stack.Item>
            <Stack.Item>
              <Icon name="chevron-right" style={{ opacity: 0.5 }} />
            </Stack.Item>
          </Stack>
        </Button>
      </Box>

      {/* Template browser modal - uses Modal component for proper positioning */}
      {showBrowser && (
        <Modal width="720px" height="80vh">
          <Box
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background:
                'linear-gradient(135deg, rgba(10, 10, 20, 0.98), rgba(20, 20, 35, 0.98))',
              borderRadius: '8px',
            }}
          >
            {/* Header */}
            <Box
              style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                flexShrink: 0,
              }}
            >
              <Stack align="center">
                <Stack.Item>
                  <Icon
                    name="users-cog"
                    style={{ color: PRESET_ACCENT, fontSize: '1.3rem' }}
                  />
                </Stack.Item>
                <Stack.Item grow>
                  <Box style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    Character Templates
                  </Box>
                  <Box style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    Select a pre-built character with all points allocated
                  </Box>
                </Stack.Item>
                <Stack.Item>
                  <Button
                    icon="times"
                    color="transparent"
                    onClick={() => setShowBrowser(false)}
                  />
                </Stack.Item>
              </Stack>
            </Box>

            {/* Scrollable content */}
            <Box
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '1rem',
              }}
            >
              {/* Categories */}
              {Object.entries(presetsByCategory).map(([category, presets]) => (
                <Box key={category} mb="1rem">
                  {/* Category header */}
                  <Stack align="center" mb="0.5rem">
                    <Stack.Item>
                      <Icon
                        name={CATEGORY_ICONS[category] || 'folder'}
                        style={{
                          color: CATEGORY_COLORS[category],
                          fontSize: '0.9rem',
                        }}
                      />
                    </Stack.Item>
                    <Stack.Item>
                      <Box
                        style={{
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          color: CATEGORY_COLORS[category],
                        }}
                      >
                        {category}
                      </Box>
                    </Stack.Item>
                    <Stack.Item grow>
                      <Box
                        style={{
                          height: '1px',
                          background: `linear-gradient(90deg, ${CATEGORY_COLORS[category]}40, transparent)`,
                          marginLeft: '0.5rem',
                        }}
                      />
                    </Stack.Item>
                  </Stack>

                  {/* Preset grid */}
                  <Box
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '0.5rem',
                    }}
                  >
                    {presets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        onSelect={handlePresetSelect}
                        categoryColor={CATEGORY_COLORS[category]}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Footer */}
            <Box
              style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <Button color="grey" onClick={() => setShowBrowser(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>
      )}

      {/* Confirmation modal */}
      {selectedPreset && (
        <PresetConfirmModal
          preset={selectedPreset}
          onConfirm={handleConfirmPreset}
          onCancel={handleCancelPreset}
        />
      )}
    </>
  );
});
