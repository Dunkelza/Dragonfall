/**
 * Undo/Redo Hook for Chargen State Management
 *
 * Provides history tracking with undo/redo capabilities for character generation.
 * Uses a simple stack-based approach with configurable max history depth.
 *
 * Features:
 * - Tracks state changes with timestamps and optional labels
 * - Supports undo/redo operations
 * - Automatic debouncing to batch rapid changes
 * - Keyboard shortcut support (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z)
 * - Configurable max history size
 *
 * @example
 * const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo(initialState);
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChargenState } from './types';

// ============================================================================
// TYPES
// ============================================================================

/** A single entry in the history stack */
export interface HistoryEntry<T> {
  /** Human-readable description of the change */
  label?: string;
  /** The state snapshot */
  state: T;
  /** When this entry was created */
  timestamp: number;
}

/** Configuration options for the undo/redo hook */
export interface UndoRedoOptions {
  /** Debounce time in ms for batching rapid changes (default: 300) */
  debounceMs?: number;
  /** Enable keyboard shortcuts (default: true) */
  enableKeyboardShortcuts?: boolean;
  /** Maximum number of history entries to keep (default: 50) */
  maxHistory?: number;
}

/** Return type for the useUndoRedo hook */
export interface UndoRedoState<T> {
  /** Whether redo is available */
  canRedo: boolean;
  /** Whether undo is available */
  canUndo: boolean;
  /** Clear all history */
  clearHistory: () => void;
  /** Current state */
  currentState: T;
  /** Number of redo steps available */
  futureCount: number;
  /** Number of undo steps available */
  historyCount: number;
  /** Get the label for the last change (for undo tooltip) */
  lastChangeLabel?: string;
  /** Get the label for the next redo (for redo tooltip) */
  nextRedoLabel?: string;
  /** Redo the last undone change */
  redo: () => void;
  /** Update state and add to history */
  setState: (newState: T, label?: string) => void;
  /** Undo the last change */
  undo: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_HISTORY = 50;
const DEFAULT_DEBOUNCE_MS = 300;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Deep compare two objects to check if they're equal
 * Used to skip duplicate history entries
 */
function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

/**
 * Generate a default label for a state change by comparing states
 */
function generateChangeLabel(
  prevState: ChargenState | null,
  nextState: ChargenState,
): string {
  if (!prevState) return 'Initial state';

  // Check what changed
  const changes: string[] = [];

  // Priority changes
  if (!deepEqual(prevState.priorities, nextState.priorities)) {
    changes.push('priorities');
  }

  // Attribute changes
  if (!deepEqual(prevState.attributes, nextState.attributes)) {
    changes.push('attributes');
  }

  // Skill changes
  if (!deepEqual(prevState.skills, nextState.skills)) {
    changes.push('skills');
  }

  // Skill group changes
  if (!deepEqual(prevState.skill_groups, nextState.skill_groups)) {
    changes.push('skill groups');
  }

  // Special attribute changes
  if (!deepEqual(prevState.special, nextState.special)) {
    changes.push('special attributes');
  }

  // Awakening/metatype changes
  if (prevState.awakening !== nextState.awakening) {
    changes.push('awakening');
  }
  if (prevState.metatype_species !== nextState.metatype_species) {
    changes.push('metatype');
  }

  // Magic changes
  if (!deepEqual(prevState.selected_spells, nextState.selected_spells)) {
    changes.push('spells');
  }
  if (!deepEqual(prevState.selected_powers, nextState.selected_powers)) {
    changes.push('adept powers');
  }
  if (
    !deepEqual(
      prevState.selected_complex_forms,
      nextState.selected_complex_forms,
    )
  ) {
    changes.push('complex forms');
  }
  if (prevState.tradition !== nextState.tradition) {
    changes.push('tradition');
  }
  if (prevState.mentor_spirit !== nextState.mentor_spirit) {
    changes.push('mentor spirit');
  }

  // Augment changes
  if (!deepEqual(prevState.augments, nextState.augments)) {
    changes.push('augments');
  }

  // Gear changes
  if (!deepEqual(prevState.gear, nextState.gear)) {
    changes.push('gear');
  }

  // Drone changes
  if (!deepEqual(prevState.drones, nextState.drones)) {
    changes.push('drones');
  }

  // Contact changes
  if (!deepEqual(prevState.contacts, nextState.contacts)) {
    changes.push('contacts');
  }

  // Knowledge/language changes
  if (!deepEqual(prevState.knowledge_skills, nextState.knowledge_skills)) {
    changes.push('knowledge skills');
  }
  if (!deepEqual(prevState.languages, nextState.languages)) {
    changes.push('languages');
  }

  // Lifestyle changes
  if (prevState.lifestyle !== nextState.lifestyle) {
    changes.push('lifestyle');
  }

  // Notes changes
  if (!deepEqual(prevState.character_notes, nextState.character_notes)) {
    changes.push('notes');
  }

  if (changes.length === 0) {
    return 'Minor change';
  }

  if (changes.length === 1) {
    return `Changed ${changes[0]}`;
  }

  return `Changed ${changes.slice(0, 2).join(', ')}${changes.length > 2 ? ` +${changes.length - 2} more` : ''}`;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook that provides undo/redo functionality for state management.
 *
 * @param initialState - The initial state value
 * @param options - Configuration options
 * @returns State and history control functions
 */
export function useUndoRedo<T>(
  initialState: T,
  options: UndoRedoOptions = {},
): UndoRedoState<T> {
  const {
    maxHistory = DEFAULT_MAX_HISTORY,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    enableKeyboardShortcuts = true,
  } = options;

  // History stacks
  const [past, setPast] = useState<HistoryEntry<T>[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<HistoryEntry<T>[]>([]);

  // Debounce timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingState = useRef<{ label?: string; state: T } | null>(null);

  // Track if we're in the middle of an undo/redo operation
  const isUndoRedoOperation = useRef(false);

  /**
   * Flush any pending debounced state to history
   */
  const flushPending = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    if (pendingState.current) {
      const { state, label } = pendingState.current;
      pendingState.current = null;

      setPast((prev) => {
        const entry: HistoryEntry<T> = {
          state: present,
          timestamp: Date.now(),
          label,
        };

        const newPast = [...prev, entry];
        // Trim to max history
        if (newPast.length > maxHistory) {
          return newPast.slice(-maxHistory);
        }
        return newPast;
      });

      setPresent(state);
      setFuture([]); // Clear redo stack on new change
    }
  }, [maxHistory, present]);

  /**
   * Update state with optional label, using debouncing
   */
  const setState = useCallback(
    (newState: T, label?: string) => {
      // Skip if state hasn't actually changed
      if (deepEqual(newState, present)) {
        return;
      }

      // If this is an undo/redo operation, don't add to history
      if (isUndoRedoOperation.current) {
        setPresent(newState);
        return;
      }

      // Clear any existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // If no pending state, save current as base for history
      if (!pendingState.current) {
        pendingState.current = { state: newState, label };
      } else {
        // Update pending with latest state, keep first label
        pendingState.current = {
          state: newState,
          label: pendingState.current.label || label,
        };
      }

      // Immediately update display state
      setPresent(newState);

      // Set timer to commit to history
      debounceTimer.current = setTimeout(() => {
        if (pendingState.current) {
          const { label: pendingLabel } = pendingState.current;

          setPast((prev) => {
            // Get the actual previous state (before pending changes)
            const baseState =
              prev.length > 0 ? prev[prev.length - 1].state : present;

            const entry: HistoryEntry<T> = {
              state: baseState as T,
              timestamp: Date.now(),
              label: pendingLabel,
            };

            const newPast = [...prev, entry];
            if (newPast.length > maxHistory) {
              return newPast.slice(-maxHistory);
            }
            return newPast;
          });

          setFuture([]); // Clear redo stack on new change
          pendingState.current = null;
        }
        debounceTimer.current = null;
      }, debounceMs);
    },
    [debounceMs, maxHistory, present],
  );

  /**
   * Undo the last change
   */
  const undo = useCallback(() => {
    // Flush any pending changes first
    flushPending();

    if (past.length === 0) return;

    isUndoRedoOperation.current = true;

    const newPast = [...past];
    const lastEntry = newPast.pop()!;

    setPast(newPast);
    setFuture((prev) => [
      { state: present, timestamp: Date.now(), label: lastEntry.label },
      ...prev,
    ]);
    setPresent(lastEntry.state);

    // Reset flag after state updates
    requestAnimationFrame(() => {
      isUndoRedoOperation.current = false;
    });
  }, [flushPending, past, present]);

  /**
   * Redo the last undone change
   */
  const redo = useCallback(() => {
    if (future.length === 0) return;

    isUndoRedoOperation.current = true;

    const newFuture = [...future];
    const nextEntry = newFuture.shift()!;

    setFuture(newFuture);
    setPast((prev) => [
      ...prev,
      { state: present, timestamp: Date.now(), label: nextEntry.label },
    ]);
    setPresent(nextEntry.state);

    // Reset flag after state updates
    requestAnimationFrame(() => {
      isUndoRedoOperation.current = false;
    });
  }, [future, present]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    pendingState.current = null;
    setPast([]);
    setFuture([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z (undo) or Cmd+Z on Mac
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Check for Ctrl+Y or Ctrl+Shift+Z (redo)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, undo, redo]);

  // Sync with external state changes (e.g., from server)
  useEffect(() => {
    if (!isUndoRedoOperation.current && !deepEqual(initialState, present)) {
      // External state change - this could be from server sync
      // We don't add it to history to avoid duplicate entries
      setPresent(initialState);
    }
  }, [initialState]);

  return useMemo(
    () => ({
      currentState: present,
      setState,
      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      historyCount: past.length,
      futureCount: future.length,
      lastChangeLabel:
        past.length > 0 ? past[past.length - 1].label : undefined,
      nextRedoLabel: future.length > 0 ? future[0].label : undefined,
      clearHistory,
    }),
    [present, setState, undo, redo, past, future, clearHistory],
  );
}

// ============================================================================
// SPECIALIZED HOOK FOR CHARGEN
// ============================================================================

/**
 * Specialized undo/redo hook for ChargenState with auto-labeling
 */
export function useChargenUndoRedo(
  initialState: ChargenState | null,
  options: UndoRedoOptions = {},
): UndoRedoState<ChargenState | null> & {
  /** Set state with auto-generated label based on what changed */
  setStateWithAutoLabel: (newState: ChargenState) => void;
} {
  const baseHook = useUndoRedo(initialState, options);

  const setStateWithAutoLabel = useCallback(
    (newState: ChargenState) => {
      const label = generateChangeLabel(baseHook.currentState, newState);
      baseHook.setState(newState, label);
    },
    [baseHook],
  );

  return {
    ...baseHook,
    setStateWithAutoLabel,
  };
}

export default useUndoRedo;
