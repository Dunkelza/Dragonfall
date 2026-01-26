/**
 * @file
 * @copyright 2024
 * @author Dragonfall Contributors
 * @license MIT
 *
 * Centralized persistence hook for SR5 character generation.
 * Consolidates all save/load/sync logic that was previously scattered
 * across individual components.
 *
 * ## Design Goals
 *
 * 1. **Single Source of Truth**: All persistence operations go through this hook
 * 2. **Type Safety**: Strongly typed update methods for each section
 * 3. **Optimistic Updates**: Immediate UI feedback with server sync
 * 4. **Batching Support**: Can integrate with debounced update queue
 * 5. **Sync Status**: Track pending changes and sync state
 *
 * ## Usage Example
 *
 * ```tsx
 * const persistence = useChargenPersistence();
 *
 * // Update specific section
 * persistence.updateAttributes({ body: 3, agility: 4 });
 *
 * // Update any field
 * persistence.updateField('skills', { pistols: 3 });
 *
 * // Batch multiple updates
 * persistence.batchUpdate({
 *   attributes: { body: 3 },
 *   skills: { pistols: 3 },
 * });
 *
 * // Save the sheet
 * persistence.save();
 *
 * // Reset all
 * persistence.reset();
 * ```
 */

import { useCallback, useMemo, useRef, useState } from 'react';

import { ChargenState } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for persistence operations.
 */
export type PersistenceOptions = {
  /** Custom change label for undo history */
  changeLabel?: string;
  /** Skip optimistic update (wait for server confirmation) */
  skipOptimistic?: boolean;
  /** Skip server sync (local-only change) */
  skipSync?: boolean;
};

/**
 * Sync status for tracking pending operations.
 */
export type SyncStatus = {
  /** Whether there are pending changes not yet sent to server */
  hasPendingChanges: boolean;
  /** Whether currently syncing with server */
  isSyncing: boolean;
  /** Last error if any */
  lastError: string | null;
  /** Last sync timestamp */
  lastSyncTime: number | null;
  /** Number of pending operations */
  pendingCount: number;
};

/**
 * Configuration for the persistence hook.
 */
export type ChargenPersistenceConfig = {
  /** The backend act function for server communication */
  act: (action: string, payload?: Record<string, unknown>) => void;
  /** Feature ID for preferences (usually 'shadowrun_chargen') */
  featureId: string;
  /** Whether the sheet is locked/saved */
  isSaved: boolean;
  /** Callback when state changes (for undo/redo integration) */
  onStateChange?: (prevState: ChargenState, nextState: ChargenState) => void;
  /** Function to set optimistic state */
  setPredictedValue: (value: ChargenState) => void;
  /** Current chargen state */
  state: ChargenState | null;
};

/**
 * Return type for the persistence hook.
 */
export type ChargenPersistenceResult = {
  /** Update multiple fields at once */
  batchUpdate: (
    partialState: Partial<ChargenState>,
    options?: PersistenceOptions,
  ) => void;
  /** Current state (read-only) */
  currentState: ChargenState | null;
  /** Force sync pending changes to server */
  forceSync: () => void;
  /** Whether sheet is locked/saved */
  isSaved: boolean;
  /** Replace entire state */
  replaceState: (newState: ChargenState, options?: PersistenceOptions) => void;
  /** Reset to initial state */
  reset: () => void;
  // --- Lifecycle methods ---
  /** Save the sheet (lock it) */
  save: () => boolean;
  // --- Status ---
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Update attributes */
  updateAttributes: (
    attributes: Partial<ChargenState['attributes']>,
    options?: PersistenceOptions,
  ) => void;
  /** Update augments */
  updateAugments: (
    augments: Partial<ChargenState['augments']>,
    options?: PersistenceOptions,
  ) => void;
  /** Update awakening type */
  updateAwakening: (
    awakening: ChargenState['awakening'],
    options?: PersistenceOptions,
  ) => void;
  /** Update birthplace */
  updateBirthplace: (
    birthplace: ChargenState['birthplace'],
    options?: PersistenceOptions,
  ) => void;
  /** Update selected complex forms */
  updateComplexForms: (
    forms: ChargenState['selected_complex_forms'],
    options?: PersistenceOptions,
  ) => void;
  /** Update contacts */
  updateContacts: (
    contacts: ChargenState['contacts'],
    options?: PersistenceOptions,
  ) => void;
  /** Update drones */
  updateDrones: (
    drones: ChargenState['drones'],
    options?: PersistenceOptions,
  ) => void;
  // --- Generic update methods ---
  /** Update any single field */
  updateField: <K extends keyof ChargenState>(
    field: K,
    value: ChargenState[K],
    options?: PersistenceOptions,
  ) => void;
  /** Update gear */
  updateGear: (
    gear: ChargenState['gear'],
    options?: PersistenceOptions,
  ) => void;
  /** Update karma spent */
  updateKarmaSpent: (
    karma: ChargenState['karma_spent'],
    options?: PersistenceOptions,
  ) => void;
  /** Update knowledge skills */
  updateKnowledgeSkills: (
    knowledge: Partial<ChargenState['knowledge_skills']>,
    options?: PersistenceOptions,
  ) => void;
  /** Update languages */
  updateLanguages: (
    languages: Partial<ChargenState['languages']>,
    options?: PersistenceOptions,
  ) => void;
  /** Update lifestyle */
  updateLifestyle: (
    lifestyle: ChargenState['lifestyle'],
    options?: PersistenceOptions,
  ) => void;
  /** Update metatype/species */
  updateMetatype: (
    metatype: ChargenState['metatype_species'],
    options?: PersistenceOptions,
  ) => void;
  /** Update native language */
  updateNativeLanguage: (
    lang: ChargenState['native_language'],
    options?: PersistenceOptions,
  ) => void;
  /** Update negative qualities */
  updateNegativeQualities: (
    qualities: ChargenState['negative_qualities'],
    options?: PersistenceOptions,
  ) => void;
  /** Update nuyen */
  updateNuyen: (
    nuyen: ChargenState['nuyen'],
    options?: PersistenceOptions,
  ) => void;
  /** Update SIN status */
  updateSinStatus: (
    status: ChargenState['sin_status'],
    options?: PersistenceOptions,
  ) => void;

  /** Update selected powers */
  updatePowers: (
    powers: ChargenState['selected_powers'],
    options?: PersistenceOptions,
  ) => void;
  // --- Section-specific update methods ---
  /** Update priorities */
  updatePriorities: (
    priorities: Partial<ChargenState['priorities']>,
    options?: PersistenceOptions,
  ) => void;
  /** Update religion */
  updateReligion: (
    religion: ChargenState['religion'],
    options?: PersistenceOptions,
  ) => void;

  /** Update positive qualities */
  updatePositiveQualities: (
    qualities: ChargenState['positive_qualities'],
    options?: PersistenceOptions,
  ) => void;
  /** Update skill groups */
  updateSkillGroups: (
    skillGroups: Partial<ChargenState['skill_groups']>,
    options?: PersistenceOptions,
  ) => void;
  /** Update skill specializations */
  updateSkillSpecializations: (
    specs: Partial<ChargenState['skill_specializations']>,
    options?: PersistenceOptions,
  ) => void;

  /** Update skills */
  updateSkills: (
    skills: Partial<ChargenState['skills']>,
    options?: PersistenceOptions,
  ) => void;
  /** Update special attributes */
  updateSpecial: (
    special: Partial<ChargenState['special']>,
    options?: PersistenceOptions,
  ) => void;
  /** Update selected spells */
  updateSpells: (
    spells: ChargenState['selected_spells'],
    options?: PersistenceOptions,
  ) => void;
};

// ============================================================================
// DEFAULT STATE
// ============================================================================

/**
 * Default/initial chargen state used for resets.
 */
export const DEFAULT_CHARGEN_STATE: ChargenState = {
  priorities: {},
  attributes: {},
  skills: {},
  skill_groups: {},
  skill_specializations: {},
  special: {},
  awakening: 'mundane',
  metatype_species: '/datum/species/human',
  saved: false,
  knowledge_skills: {},
  languages: {},
  native_language: '',
  contacts: [],
  selected_spells: [],
  selected_powers: {},
  selected_complex_forms: [],
  augments: {},
  sin_status: 'legitimate',
  birthplace: 'seattle',
  religion: 'none',
  karma_spent: 0,
  gear: [],
  drones: [],
  nuyen: 0,
  lifestyle: 'street',
  positive_qualities: [],
  negative_qualities: [],
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook that centralizes all chargen persistence logic.
 *
 * This hook replaces scattered `act('set_preference', ...)` calls throughout
 * the codebase with a single, type-safe API.
 */
export function useChargenPersistence(
  config: ChargenPersistenceConfig,
): ChargenPersistenceResult {
  const { act, featureId, state, setPredictedValue, isSaved, onStateChange } =
    config;

  // Track sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    hasPendingChanges: false,
    pendingCount: 0,
    isSyncing: false,
    lastSyncTime: null,
    lastError: null,
  });

  // Pending changes ref for batching
  const pendingChangesRef = useRef<Partial<ChargenState>>({});
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Core persist function
  // -------------------------------------------------------------------------

  /**
   * Core function that handles the actual persistence to server.
   */
  const persistToServer = useCallback(
    (nextState: ChargenState, options?: PersistenceOptions) => {
      if (options?.skipSync) {
        return;
      }

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: true,
        hasPendingChanges: false,
        pendingCount: 0,
      }));

      try {
        act('set_preference', {
          preference: featureId,
          value: nextState,
        });

        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: Date.now(),
          lastError: null,
        }));
      } catch (error) {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    },
    [act, featureId],
  );

  /**
   * Update state with partial values (optimistic update + server sync).
   */
  const updateStateInternal = useCallback(
    (partialState: Partial<ChargenState>, options?: PersistenceOptions) => {
      if (!state) return;
      if (isSaved && !('saved' in partialState)) return; // Can't modify saved sheet

      const prevState = state;
      const nextState: ChargenState = {
        ...state,
        ...partialState,
      };

      // Optimistic update
      if (!options?.skipOptimistic) {
        setPredictedValue(nextState);
      }

      // Notify change (for undo/redo)
      onStateChange?.(prevState, nextState);

      // Persist to server
      persistToServer(nextState, options);
    },
    [state, isSaved, setPredictedValue, onStateChange, persistToServer],
  );

  // -------------------------------------------------------------------------
  // Section-specific update methods (merge with existing values)
  // -------------------------------------------------------------------------

  const updatePriorities = useCallback(
    (
      priorities: Partial<ChargenState['priorities']>,
      options?: PersistenceOptions,
    ) => {
      if (!state) return;
      updateStateInternal(
        {
          priorities: { ...state.priorities, ...priorities },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateAttributes = useCallback(
    (
      attributes: Partial<ChargenState['attributes']>,
      options?: PersistenceOptions,
    ) => {
      if (!state) return;
      updateStateInternal(
        {
          attributes: { ...state.attributes, ...attributes },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateSkills = useCallback(
    (skills: Partial<ChargenState['skills']>, options?: PersistenceOptions) => {
      if (!state) return;
      updateStateInternal(
        {
          skills: { ...state.skills, ...skills },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateSkillGroups = useCallback(
    (
      skillGroups: Partial<ChargenState['skill_groups']>,
      options?: PersistenceOptions,
    ) => {
      if (!state) return;
      updateStateInternal(
        {
          skill_groups: { ...state.skill_groups, ...skillGroups },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateSkillSpecializations = useCallback(
    (
      specs: Partial<ChargenState['skill_specializations']>,
      options?: PersistenceOptions,
    ) => {
      if (!state) return;
      updateStateInternal(
        {
          skill_specializations: {
            ...(state.skill_specializations || {}),
            ...specs,
          },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateSpecial = useCallback(
    (
      special: Partial<ChargenState['special']>,
      options?: PersistenceOptions,
    ) => {
      if (!state) return;
      updateStateInternal(
        {
          special: { ...state.special, ...special },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateAwakening = useCallback(
    (awakening: ChargenState['awakening'], options?: PersistenceOptions) => {
      updateStateInternal({ awakening }, options);
    },
    [updateStateInternal],
  );

  const updateMetatype = useCallback(
    (
      metatype: ChargenState['metatype_species'],
      options?: PersistenceOptions,
    ) => {
      updateStateInternal({ metatype_species: metatype }, options);
    },
    [updateStateInternal],
  );

  const updateKnowledgeSkills = useCallback(
    (
      knowledge: Partial<ChargenState['knowledge_skills']>,
      options?: PersistenceOptions,
    ) => {
      if (!state) return;
      updateStateInternal(
        {
          knowledge_skills: { ...state.knowledge_skills, ...knowledge },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateLanguages = useCallback(
    (
      languages: Partial<ChargenState['languages']>,
      options?: PersistenceOptions,
    ) => {
      if (!state) return;
      updateStateInternal(
        {
          languages: { ...state.languages, ...languages },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateNativeLanguage = useCallback(
    (lang: ChargenState['native_language'], options?: PersistenceOptions) => {
      updateStateInternal({ native_language: lang }, options);
    },
    [updateStateInternal],
  );

  const updateContacts = useCallback(
    (contacts: ChargenState['contacts'], options?: PersistenceOptions) => {
      updateStateInternal({ contacts }, options);
    },
    [updateStateInternal],
  );

  const updateSpells = useCallback(
    (spells: ChargenState['selected_spells'], options?: PersistenceOptions) => {
      updateStateInternal({ selected_spells: spells }, options);
    },
    [updateStateInternal],
  );

  const updatePowers = useCallback(
    (powers: ChargenState['selected_powers'], options?: PersistenceOptions) => {
      updateStateInternal({ selected_powers: powers }, options);
    },
    [updateStateInternal],
  );

  const updateComplexForms = useCallback(
    (
      forms: ChargenState['selected_complex_forms'],
      options?: PersistenceOptions,
    ) => {
      updateStateInternal({ selected_complex_forms: forms }, options);
    },
    [updateStateInternal],
  );

  const updateAugments = useCallback(
    (
      augments: Partial<ChargenState['augments']>,
      options?: PersistenceOptions,
    ) => {
      if (!state) return;
      updateStateInternal(
        {
          augments: { ...state.augments, ...augments },
        },
        options,
      );
    },
    [state, updateStateInternal],
  );

  const updateSinStatus = useCallback(
    (status: ChargenState['sin_status'], options?: PersistenceOptions) => {
      updateStateInternal({ sin_status: status }, options);
    },
    [updateStateInternal],
  );

  const updateBirthplace = useCallback(
    (birthplace: ChargenState['birthplace'], options?: PersistenceOptions) => {
      updateStateInternal({ birthplace }, options);
    },
    [updateStateInternal],
  );

  const updateReligion = useCallback(
    (religion: ChargenState['religion'], options?: PersistenceOptions) => {
      updateStateInternal({ religion }, options);
    },
    [updateStateInternal],
  );

  const updateKarmaSpent = useCallback(
    (karma: ChargenState['karma_spent'], options?: PersistenceOptions) => {
      updateStateInternal({ karma_spent: karma }, options);
    },
    [updateStateInternal],
  );

  const updateGear = useCallback(
    (gear: ChargenState['gear'], options?: PersistenceOptions) => {
      updateStateInternal({ gear }, options);
    },
    [updateStateInternal],
  );

  const updateDrones = useCallback(
    (drones: ChargenState['drones'], options?: PersistenceOptions) => {
      updateStateInternal({ drones }, options);
    },
    [updateStateInternal],
  );

  const updateNuyen = useCallback(
    (nuyen: ChargenState['nuyen'], options?: PersistenceOptions) => {
      updateStateInternal({ nuyen }, options);
    },
    [updateStateInternal],
  );

  const updateLifestyle = useCallback(
    (lifestyle: ChargenState['lifestyle'], options?: PersistenceOptions) => {
      updateStateInternal({ lifestyle }, options);
    },
    [updateStateInternal],
  );

  const updatePositiveQualities = useCallback(
    (
      qualities: ChargenState['positive_qualities'],
      options?: PersistenceOptions,
    ) => {
      updateStateInternal({ positive_qualities: qualities }, options);
    },
    [updateStateInternal],
  );

  const updateNegativeQualities = useCallback(
    (
      qualities: ChargenState['negative_qualities'],
      options?: PersistenceOptions,
    ) => {
      updateStateInternal({ negative_qualities: qualities }, options);
    },
    [updateStateInternal],
  );

  // -------------------------------------------------------------------------
  // Generic update methods
  // -------------------------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof ChargenState>(
      field: K,
      value: ChargenState[K],
      options?: PersistenceOptions,
    ) => {
      updateStateInternal({ [field]: value } as Partial<ChargenState>, options);
    },
    [updateStateInternal],
  );

  const batchUpdate = useCallback(
    (partialState: Partial<ChargenState>, options?: PersistenceOptions) => {
      updateStateInternal(partialState, options);
    },
    [updateStateInternal],
  );

  const replaceState = useCallback(
    (newState: ChargenState, options?: PersistenceOptions) => {
      if (isSaved) return;

      const prevState = state;

      if (!options?.skipOptimistic) {
        setPredictedValue(newState);
      }

      if (prevState) {
        onStateChange?.(prevState, newState);
      }

      persistToServer(newState, options);
    },
    [state, isSaved, setPredictedValue, onStateChange, persistToServer],
  );

  // -------------------------------------------------------------------------
  // Lifecycle methods
  // -------------------------------------------------------------------------

  const save = useCallback((): boolean => {
    if (!state || isSaved) return false;

    const nextState: ChargenState = {
      ...state,
      saved: true,
    };

    setPredictedValue(nextState);
    persistToServer(nextState);
    return true;
  }, [state, isSaved, setPredictedValue, persistToServer]);

  const reset = useCallback(() => {
    setPredictedValue(DEFAULT_CHARGEN_STATE);
    persistToServer(DEFAULT_CHARGEN_STATE);
  }, [setPredictedValue, persistToServer]);

  const forceSync = useCallback(() => {
    if (!state) return;

    // Clear any pending timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    // Merge pending changes and sync
    if (Object.keys(pendingChangesRef.current).length > 0) {
      const mergedState: ChargenState = {
        ...state,
        ...pendingChangesRef.current,
      };
      pendingChangesRef.current = {};
      persistToServer(mergedState);
    } else {
      persistToServer(state);
    }
  }, [state, persistToServer]);

  // -------------------------------------------------------------------------
  // Return memoized result
  // -------------------------------------------------------------------------

  return useMemo(
    () => ({
      // Section-specific updates
      updatePriorities,
      updateAttributes,
      updateSkills,
      updateSkillGroups,
      updateSkillSpecializations,
      updateSpecial,
      updateAwakening,
      updateMetatype,
      updateKnowledgeSkills,
      updateLanguages,
      updateNativeLanguage,
      updateContacts,
      updateSpells,
      updatePowers,
      updateComplexForms,
      updateAugments,
      updateSinStatus,
      updateBirthplace,
      updateReligion,
      updateKarmaSpent,
      updateGear,
      updateDrones,
      updateNuyen,
      updateLifestyle,
      updatePositiveQualities,
      updateNegativeQualities,

      // Generic updates
      updateField,
      batchUpdate,
      replaceState,

      // Lifecycle
      save,
      reset,
      forceSync,

      // Status
      syncStatus,
      isSaved,
      currentState: state,
    }),
    [
      updatePriorities,
      updateAttributes,
      updateSkills,
      updateSkillGroups,
      updateSkillSpecializations,
      updateSpecial,
      updateAwakening,
      updateMetatype,
      updateKnowledgeSkills,
      updateLanguages,
      updateNativeLanguage,
      updateContacts,
      updateSpells,
      updatePowers,
      updateComplexForms,
      updateAugments,
      updateSinStatus,
      updateBirthplace,
      updateReligion,
      updateKarmaSpent,
      updateGear,
      updateDrones,
      updateNuyen,
      updateLifestyle,
      updatePositiveQualities,
      updateNegativeQualities,
      updateField,
      batchUpdate,
      replaceState,
      save,
      reset,
      forceSync,
      syncStatus,
      isSaved,
      state,
    ],
  );
}

// ============================================================================
// CONTEXT-BASED HOOK (uses ChargenContext)
// ============================================================================

// Import here to avoid circular dependency
import { type ChargenContextValue, useChargen } from './ChargenContext';

/**
 * Convenience hook that uses ChargenContext to get persistence functions.
 * Use this in components that are already wrapped in ChargenProvider.
 */
export function useChargenPersistenceFromContext(): Pick<
  ChargenPersistenceResult,
  'updateField' | 'batchUpdate' | 'save' | 'reset' | 'isSaved' | 'currentState'
> & {
  /** Actions from context */
  actions: ChargenContextValue['actions'];
} {
  const ctx = useChargen();

  const { actions, chargenState, isSaved } = ctx;

  return useMemo(
    () => ({
      updateField: actions.updateField,
      batchUpdate: actions.updateState,
      save: () => {
        actions.saveSheet();
        return !isSaved;
      },
      reset: actions.resetAll,
      isSaved,
      currentState: chargenState,
      actions,
    }),
    [actions, chargenState, isSaved],
  );
}

// ============================================================================
// HELPER: Create typed updater for a specific field
// ============================================================================

/**
 * Creates a memoized updater function for a specific field.
 * Useful when you need to pass an updater to a child component.
 *
 * @example
 * ```tsx
 * const persistence = useChargenPersistence(config);
 * const updateBody = createFieldUpdater(persistence, 'attributes', 'body');
 *
 * // In child component
 * <NumberInput onChange={updateBody} />
 * ```
 */
export function createFieldUpdater<
  K extends keyof ChargenState,
  V extends ChargenState[K],
>(
  persistence: ChargenPersistenceResult,
  field: K,
  subKey?: V extends Record<string, unknown> ? keyof V : never,
): (value: V extends Record<string, unknown> ? V[keyof V] : V) => void {
  if (subKey !== undefined) {
    // Handle nested field (e.g., attributes.body)
    return (value) => {
      const currentValue = (persistence.currentState?.[field] || {}) as Record<
        string,
        unknown
      >;
      persistence.updateField(field, {
        ...currentValue,
        [subKey]: value,
      } as ChargenState[K]);
    };
  }

  // Handle top-level field
  return (value) => {
    persistence.updateField(field, value as ChargenState[K]);
  };
}
