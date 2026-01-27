/**
 * Chargen Context - Provides chargen state and actions via React Context
 *
 * This eliminates prop drilling by making chargen state and actions available
 * to any component in the tree without passing them through intermediate components.
 *
 * Usage:
 * 1. Wrap your component tree with <ChargenProvider>
 * 2. Use useChargen() hook in any child component to access state and actions
 *
 * @example
 * // In parent:
 * <ChargenProvider value={chargenState} onChange={handleChange} ...>
 *   <YourComponents />
 * </ChargenProvider>
 *
 * // In any child:
 * const { chargenState, updateState, isSaved } = useChargen();
 */

import { createContext, memo, ReactNode, useCallback, useContext } from 'react';

import {
  DEFAULT_AWAKENING,
  DEFAULT_BIRTHPLACE,
  DEFAULT_METATYPE,
  DEFAULT_RELIGION,
  DEFAULT_SIN_STATUS,
} from './constants';
import { ChargenState, DashboardData, ValidationResult } from './types';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Undo/Redo state exposed through context
 */
export type UndoRedoState = {
  /** Whether redo is possible */
  canRedo: boolean;
  /** Whether undo is possible */
  canUndo: boolean;
  /** Number of redo steps available */
  futureCount: number;
  /** Number of undo steps available */
  historyCount: number;
  /** Label of last change (for undo tooltip) */
  lastChangeLabel?: string;
  /** Label of next redo (for redo tooltip) */
  nextRedoLabel?: string;
};

/**
 * Actions available through the chargen context.
 * These handle common state mutations without requiring prop drilling.
 */
export type ChargenActions = {
  /** Clear undo/redo history */
  clearHistory: () => void;

  /** Redo the last undone change */
  redo: () => void;

  /** Reset all chargen state */
  resetAll: () => void;

  /** Save the character sheet */
  saveSheet: () => void;

  /** Send an action to the server (wrapper around act) */
  sendAction: (action: string, payload?: Record<string, unknown>) => void;

  /** Undo the last change */
  undo: () => void;

  /** Update a specific field in chargen state */
  updateField: <K extends keyof ChargenState>(
    field: K,
    value: ChargenState[K],
  ) => void;

  /** Update chargen state with a partial update (optimistically) */
  updateState: (partialState: Partial<ChargenState>) => void;
};

/**
 * Full context value including state and actions.
 */
export type ChargenContextValue = {
  // Actions
  actions: ChargenActions;
  // State
  chargenState: ChargenState | null;
  dashboardData: DashboardData | null;
  featureId: string;
  hasBiocompatibility: boolean;
  isSaved: boolean;
  // Undo/Redo state
  undoRedo: UndoRedoState;

  validation: ValidationResult;
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ChargenContext = createContext<ChargenContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export type ChargenProviderProps = {
  /** The backend act function for server communication */
  act: (action: string, payload?: Record<string, unknown>) => void;

  /** Child components */
  children: ReactNode;

  /** Calculated dashboard data */
  dashboardData: DashboardData | null;

  /** Feature ID for preferences (usually 'shadowrun_chargen') */
  featureId: string;

  /** Whether character has Biocompatibility quality */
  hasBiocompatibility: boolean;

  /** Whether sheet is locked/saved */
  isSaved: boolean;

  /** Function to set optimistic state */
  setPredictedValue: (value: ChargenState) => void;

  /** Undo/Redo callbacks and state (optional, for undo/redo support) */
  undoRedo?: {
    canRedo: boolean;
    canUndo: boolean;
    clearHistory: () => void;
    futureCount: number;
    historyCount: number;
    lastChangeLabel?: string;
    nextRedoLabel?: string;
    redo: () => void;
    undo: () => void;
  };

  /** Validation result */
  validation: ValidationResult;

  /** Current chargen state (from optimistic or server value) */
  value: ChargenState | null;
};

/**
 * Provider component that supplies chargen state and actions to descendants.
 */
export const ChargenProvider = memo((props: ChargenProviderProps) => {
  const {
    act,
    children,
    dashboardData,
    featureId,
    hasBiocompatibility,
    isSaved,
    setPredictedValue,
    undoRedo,
    validation,
    value,
  } = props;

  // Default undo/redo state (no-op if not provided)
  const defaultUndoRedo: UndoRedoState = {
    canUndo: false,
    canRedo: false,
    historyCount: 0,
    futureCount: 0,
    lastChangeLabel: undefined,
    nextRedoLabel: undefined,
  };

  // Send action to server
  const sendAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      act(action, payload);
    },
    [act],
  );

  // Update state with partial values (optimistic update)
  const updateState = useCallback(
    (partialState: Partial<ChargenState>) => {
      if (!value) return;

      const nextValue = {
        ...value,
        ...partialState,
      } as ChargenState;

      setPredictedValue(nextValue);
      act('set_preference', {
        preference: featureId,
        value: nextValue,
      });
    },
    [act, featureId, setPredictedValue, value],
  );

  // Update a specific field
  const updateField = useCallback(
    <K extends keyof ChargenState>(field: K, fieldValue: ChargenState[K]) => {
      if (!value) return;

      const nextValue = {
        ...value,
        [field]: fieldValue,
      } as ChargenState;

      setPredictedValue(nextValue);
      act('set_preference', {
        preference: featureId,
        value: nextValue,
      });
    },
    [act, featureId, setPredictedValue, value],
  );

  // Save the sheet
  const saveSheet = useCallback(() => {
    if (isSaved || !validation.canSave || !value) return;

    const nextValue = {
      ...value,
      saved: true,
    } as ChargenState;

    setPredictedValue(nextValue);
    act('set_preference', {
      preference: featureId,
      value: nextValue,
    });
  }, [act, featureId, isSaved, setPredictedValue, validation.canSave, value]);

  // Reset all state
  const resetAll = useCallback(() => {
    const nextValue: ChargenState = {
      priorities: {},
      attributes: {},
      skills: {},
      skill_groups: {},
      special: {},
      awakening: DEFAULT_AWAKENING,
      metatype_species: DEFAULT_METATYPE,
      saved: false,
      knowledge_skills: {},
      languages: {},
      native_language: '',
      contacts: [],
      selected_spells: [],
      selected_powers: {},
      selected_complex_forms: [],
      augments: {},
      sin_status: DEFAULT_SIN_STATUS,
      birthplace: DEFAULT_BIRTHPLACE,
      religion: DEFAULT_RELIGION,
      karma_spent: 0,
    };

    setPredictedValue(nextValue);
    act('set_preference', {
      preference: featureId,
      value: nextValue,
    });

    // Clear history on reset
    undoRedo?.clearHistory?.();
  }, [act, featureId, setPredictedValue, undoRedo]);

  // Undo action
  const undo = useCallback(() => {
    undoRedo?.undo?.();
  }, [undoRedo]);

  // Redo action
  const redo = useCallback(() => {
    undoRedo?.redo?.();
  }, [undoRedo]);

  // Clear history action
  const clearHistory = useCallback(() => {
    undoRedo?.clearHistory?.();
  }, [undoRedo]);

  const contextValue: ChargenContextValue = {
    // State
    chargenState: value,
    dashboardData,
    featureId,
    hasBiocompatibility,
    isSaved,
    validation,
    // Undo/Redo state
    undoRedo: undoRedo
      ? {
          canUndo: undoRedo.canUndo,
          canRedo: undoRedo.canRedo,
          historyCount: undoRedo.historyCount,
          futureCount: undoRedo.futureCount,
          lastChangeLabel: undoRedo.lastChangeLabel,
          nextRedoLabel: undoRedo.nextRedoLabel,
        }
      : defaultUndoRedo,
    // Actions
    actions: {
      sendAction,
      updateState,
      updateField,
      saveSheet,
      resetAll,
      undo,
      redo,
      clearHistory,
    },
  };

  return (
    <ChargenContext.Provider value={contextValue}>
      {children}
    </ChargenContext.Provider>
  );
});

ChargenProvider.displayName = 'ChargenProvider';

// ============================================================================
// CONSUMER HOOK
// ============================================================================

/**
 * Hook to access chargen context.
 * Must be used within a ChargenProvider.
 *
 * @throws Error if used outside of ChargenProvider
 *
 * @example
 * const { chargenState, actions, isSaved } = useChargen();
 *
 * // Update a field
 * actions.updateField('awakening', 'mage');
 *
 * // Update multiple fields
 * actions.updateState({ awakening: 'mage', tradition: 'hermetic' });
 */
export function useChargen(): ChargenContextValue {
  const context = useContext(ChargenContext);

  if (!context) {
    throw new Error('useChargen must be used within a ChargenProvider');
  }

  return context;
}

/**
 * Hook to access only chargen actions (for components that don't need state).
 * This can help prevent unnecessary re-renders.
 *
 * @example
 * const { updateField, saveSheet } = useChargenActions();
 */
export function useChargenActions(): ChargenActions {
  const { actions } = useChargen();
  return actions;
}

/**
 * Hook to access only chargen state (read-only).
 *
 * @example
 * const { chargenState, isSaved, validation } = useChargenState();
 */
export function useChargenState() {
  const { chargenState, dashboardData, isSaved, validation } = useChargen();
  return { chargenState, dashboardData, isSaved, validation };
}
