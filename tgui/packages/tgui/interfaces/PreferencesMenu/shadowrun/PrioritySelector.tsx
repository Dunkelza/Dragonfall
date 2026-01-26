/**
 * Priority Selector component for SR5 character generation
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Dropdown, Icon, Stack } from '../../../components';
import {
  PRIORITY_CATEGORIES,
  PRIORITY_LETTERS,
  PriorityLetter,
} from './constants';
import { EmbeddableChargenProps } from './types';

export type PrioritySelectorProps = EmbeddableChargenProps;

// Accent colors for the priority selector
const PRIORITY_ACCENT = '#caa53d';
const PRIORITY_ACCENT_DIM = 'rgba(202, 165, 61, 0.15)';
const PRIORITY_ACCENT_BORDER = 'rgba(202, 165, 61, 0.4)';

// Hints for each priority category
const PRIORITY_HINTS: Record<string, string> = {
  metatype:
    'Determines available metatypes (Human, Elf, Dwarf, Ork, Troll) and special attribute points.',
  attributes:
    'Sets the number of points to allocate to physical and mental attributes.',
  magic:
    'Determines awakened status (Mundane, Mage, Adept, etc.) and magic rating.',
  skills: 'Sets the number of points for active skills and skill groups.',
  resources:
    'Starting nuyen (¥) for gear, augments, lifestyle, and other purchases.',
};

// Category icons for visual distinction
const CATEGORY_ICONS: Record<string, string> = {
  metatype: 'dna',
  attributes: 'chart-bar',
  magic: 'hat-wizard',
  skills: 'tools',
  resources: 'coins',
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

const getLetterGlow = (letter: string): string => {
  const color = getLetterColor(letter);
  return `0 0 8px ${color}66, 0 0 4px ${color}33`;
};

export const PrioritySelector = memo((props: PrioritySelectorProps) => {
  const {
    chargenState,
    chargenConstData,
    isSaved,
    act,
    featureId,
    setPredictedValue,
    value,
    embedded,
  } = props;

  const priorities = chargenState?.priorities || {};
  const displayNames = chargenConstData?.priority_display_names || {};

  const handleSetPriority = (category: string, newLetter: PriorityLetter) => {
    // Swap priorities: find which category currently has the newLetter
    // and give it the old letter from the category being changed
    const oldLetter = priorities[category];
    const newPriorities = { ...priorities };

    // Find the category that currently has the letter we want
    for (const [otherCat, otherLetter] of Object.entries(priorities)) {
      if (otherCat !== category && otherLetter === newLetter) {
        // Swap: give the other category our old letter
        newPriorities[otherCat] = oldLetter;
        break;
      }
    }

    // Set our new letter
    newPriorities[category] = newLetter;

    const newState = {
      ...chargenState!,
      priorities: newPriorities,
    };
    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  return (
    <Box
      style={{
        background: embedded
          ? 'transparent'
          : `linear-gradient(135deg, ${PRIORITY_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
        border: embedded ? 'none' : `1px solid ${PRIORITY_ACCENT_BORDER}`,
        borderRadius: '8px',
        padding: embedded ? '0' : '1rem',
        marginTop: embedded ? '0' : '0.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative corner accent */}
      {!embedded && (
        <Box
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '80px',
            height: '80px',
            background: `linear-gradient(135deg, transparent 50%, ${PRIORITY_ACCENT_DIM} 50%)`,
            opacity: '0.5',
          }}
        />
      )}

      {/* Header */}
      {!embedded && (
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: `2px solid ${PRIORITY_ACCENT}`,
          }}
        >
          <Icon
            name="layer-group"
            style={{ color: PRIORITY_ACCENT, fontSize: '1.2rem' }}
          />
          <Box
            style={{
              marginLeft: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: PRIORITY_ACCENT,
            }}
          >
            Priority Selection
          </Box>
          <Box
            style={{
              marginLeft: 'auto',
              fontSize: '0.75rem',
              opacity: '0.6',
            }}
          >
            Assign A–E to each category
          </Box>
        </Box>
      )}

      {/* Priority Rows */}
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {PRIORITY_CATEGORIES.map((category) => {
          const display = displayNames[category] || category;
          const currentLetter = (priorities[category] as PriorityLetter) || 'E';
          const letterColor = getLetterColor(currentLetter);
          const categoryIcon = CATEGORY_ICONS[category] || 'circle';

          return (
            <Box
              key={category}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.6rem 0.75rem',
                borderLeft: `3px solid ${letterColor}`,
                transition: 'all 0.2s ease',
              }}
            >
              <Stack align="center">
                <Stack.Item>
                  <Box
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: `${letterColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name={categoryIcon}
                      style={{ color: letterColor, fontSize: '0.9rem' }}
                    />
                  </Box>
                </Stack.Item>
                <Stack.Item grow>
                  <Tooltip
                    content={PRIORITY_HINTS[category] || display}
                    position="right"
                  >
                    <Box
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        cursor: 'help',
                      }}
                    >
                      {display}
                    </Box>
                  </Tooltip>
                </Stack.Item>
                <Stack.Item>
                  {isSaved ? (
                    <Box
                      style={{
                        color: letterColor,
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '0.3rem 0.6rem',
                        minWidth: '2rem',
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        boxShadow: getLetterGlow(currentLetter),
                      }}
                    >
                      {currentLetter}
                    </Box>
                  ) : (
                    <Dropdown
                      width="3.5rem"
                      selected={currentLetter}
                      options={PRIORITY_LETTERS.map((l) => {
                        // Find if another category has this letter
                        const usedBy = Object.entries(priorities).find(
                          ([cat, letter]) => cat !== category && letter === l,
                        );
                        const usedByName = usedBy
                          ? displayNames[usedBy[0]] || usedBy[0]
                          : null;
                        return {
                          value: l,
                          displayText: usedByName ? `${l} ⟷ ${usedByName}` : l,
                        };
                      })}
                      onSelected={(v) =>
                        handleSetPriority(category, v as PriorityLetter)
                      }
                    />
                  )}
                </Stack.Item>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});
