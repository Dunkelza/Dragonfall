/**
 * Priority Selector component for SR5 character generation
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { Box, Dropdown, Icon, Stack } from '../../../components';
import {
  EmbeddableChargenProps,
  PRIORITY_CATEGORIES,
  PRIORITY_LETTERS,
  PriorityLetter,
} from './types';

export type PrioritySelectorProps = EmbeddableChargenProps;

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
      className="PreferencesMenu__ShadowrunSheet__prioritySelector"
      style={{
        background: embedded ? 'transparent' : 'rgba(0, 0, 0, 0.25)',
        border: embedded ? 'none' : '2px solid rgba(202, 165, 61, 0.4)',
        padding: embedded ? '0' : '0.5rem',
        marginTop: embedded ? '0' : '0.5rem',
      }}
    >
      {!embedded && (
        <Box
          bold
          style={{
            color: '#caa53d',
            borderBottom: '1px solid rgba(202, 165, 61, 0.3)',
            paddingBottom: '0.3rem',
            marginBottom: '0.4rem',
            fontSize: '0.9rem',
          }}
        >
          <Icon name="layer-group" mr={0.5} />
          Priorities
        </Box>
      )}
      {PRIORITY_CATEGORIES.map((category) => {
        const display = displayNames[category] || category;
        const currentLetter = (priorities[category] as PriorityLetter) || 'E';
        const letterColor = getLetterColor(currentLetter);

        return (
          <Stack
            key={category}
            align="center"
            style={{
              padding: '0.2rem 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Stack.Item grow>
              <Tooltip
                content={PRIORITY_HINTS[category] || display}
                position="right"
              >
                <Box style={{ fontSize: '0.85rem' }}>{display}</Box>
              </Tooltip>
            </Stack.Item>
            <Stack.Item>
              {isSaved ? (
                <Box
                  bold
                  style={{
                    color: letterColor,
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.1rem 0.4rem',
                    minWidth: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
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
        );
      })}
    </Box>
  );
});
