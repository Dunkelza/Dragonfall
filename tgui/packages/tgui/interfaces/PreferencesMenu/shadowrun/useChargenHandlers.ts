/**
 * @file useChargenHandlers.ts
 * @description High-level action handlers for chargen state mutations.
 *
 * This hook consolidates common action patterns (bump, toggle, add, remove, set)
 * into reusable functions, reducing boilerplate in chargen components.
 *
 * ## Design Goals
 *
 * 1. **DRY**: Eliminate repeated handler patterns across components
 * 2. **Type Safety**: Strongly typed actions for each state section
 * 3. **Consistent Behavior**: All actions check `isSaved` and sync properly
 * 4. **Composable**: Can use individual handlers or the full API
 *
 * ## Usage
 *
 * ```tsx
 * const handlers = useChargenHandlers({
 *   act,
 *   featureId,
 *   chargenState: value,
 *   setPredictedValue,
 *   isSaved,
 * });
 *
 * // Bump an attribute
 * handlers.bumpAttribute('body', +1, { min: 1, max: 6 });
 *
 * // Toggle a spell
 * handlers.toggleSpell('fireball');
 *
 * // Add/remove gear
 * handlers.addGear('commlink', { stackable: true, maxQuantity: 5 });
 * handlers.removeGear('commlink');
 *
 * // Set a single value
 * handlers.setValue('lifestyle', 'middle');
 * ```
 */

import { useCallback, useMemo } from 'react';

import { BumpHandlerConfig, BumpResult, calculateBumpedValue } from './hooks';
import {
  AugmentSelection,
  ChargenState,
  DroneSelection,
  GearSelection,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for the chargen handlers hook.
 */
export type ChargenHandlersConfig = {
  /** The backend act function for server communication */
  act: (action: string, payload?: Record<string, unknown>) => void;
  /** Current chargen state */
  chargenState: ChargenState | null;
  /** Feature ID for preferences */
  featureId: string;
  /** Whether the sheet is locked/saved */
  isSaved: boolean;
  /** Function to set optimistic state */
  setPredictedValue: (value: ChargenState) => void;
};

/**
 * Options for bump operations.
 */
export type BumpOptions = {
  /** Whether bumping is allowed (e.g., not locked by group) */
  canBump?: (id: string, delta: number) => boolean;
  /** Whether to delete entry when value becomes 0 */
  deleteOnZero?: boolean;
  /** Maximum value */
  max?: number | ((id: string) => number);
  /** Minimum value */
  min?: number | ((id: string) => number);
  /** Point budget validation */
  validatePoints?: (id: string, current: number, next: number) => boolean;
};

/**
 * Options for add operations on stackable items.
 */
export type AddOptions = {
  /** Maximum quantity (for stackable items) */
  maxQuantity?: number;
  /** Whether the item is stackable */
  stackable?: boolean;
};

/**
 * Result of an action operation.
 */
export type ActionResult = {
  /** Error message if failed */
  error?: string;
  /** Whether the action succeeded */
  success: boolean;
};

/**
 * Return type for the chargen handlers hook.
 */
export type ChargenHandlersResult = {
  // --- Augment Actions ---
  addAugment: (augmentId: string, grade?: string) => ActionResult;

  addAugmentMod: (augmentId: string, modId: string) => ActionResult;

  // --- Drone Actions ---
  addDrone: (droneId: string) => ActionResult;

  addDroneMod: (droneId: string, modId: string) => ActionResult;

  // --- Gear Actions ---
  addGear: (gearId: string, options?: AddOptions) => ActionResult;

  // --- Generic Actions ---
  /** Bump any numeric field in a record section */
  bump: <K extends RecordSections>(
    section: K,
    id: string,
    delta: number,
    options?: BumpOptions,
  ) => ActionResult;
  // --- Attribute Actions ---
  bumpAttribute: (
    attrId: string,
    delta: number,
    options?: BumpOptions,
  ) => ActionResult;
  // --- Knowledge & Language Actions ---
  bumpKnowledgeSkill: (
    skillId: string,
    delta: number,
    options?: BumpOptions,
  ) => ActionResult;

  bumpLanguage: (
    langId: string,
    delta: number,
    options?: BumpOptions,
  ) => ActionResult;

  // --- Magic Actions ---
  bumpPower: (
    powerId: string,
    delta: number,
    options?: BumpOptions,
  ) => ActionResult;
  // --- Skill Actions ---
  bumpSkill: (
    skillId: string,
    delta: number,
    options?: BumpOptions,
  ) => ActionResult;
  bumpSkillGroup: (
    groupId: string,
    delta: number,
    options?: BumpOptions,
  ) => ActionResult;
  // --- Special Actions ---
  bumpSpecial: (
    specialId: string,
    delta: number,
    options?: BumpOptions,
  ) => ActionResult;
  changeAugmentGrade: (augmentId: string, newGrade: string) => ActionResult;

  clearAllAugments: () => ActionResult;
  clearAllDrones: () => ActionResult;
  clearAllGear: () => ActionResult;

  // --- Utility ---
  /** Whether actions are currently disabled (sheet is saved) */
  isDisabled: boolean;
  removeAugment: (augmentId: string) => ActionResult;
  removeAugmentMod: (augmentId: string, modId: string) => ActionResult;
  removeDrone: (droneId: string) => ActionResult;
  removeDroneMod: (droneId: string, modId: string) => ActionResult;
  removeGear: (gearId: string) => ActionResult;

  // --- Lifecycle Actions ---
  setAwakening: (awakening: ChargenState['awakening']) => ActionResult;
  setLifestyle: (lifestyle: string) => ActionResult;
  setMentorSpirit: (mentorId: string) => ActionResult;
  setMetatype: (metatype: string) => ActionResult;
  setNativeLanguage: (langId: string) => ActionResult;

  setPriority: (category: string, letter: string) => ActionResult;
  setSpecialization: (skillId: string, spec: string) => ActionResult;
  setTradition: (traditionId: string) => ActionResult;

  /** Toggle an item in an array section */
  toggle: <K extends ArraySections>(section: K, itemId: string) => ActionResult;
  /** Update the full state (for complex operations) */
  updateState: (updater: (prev: ChargenState) => ChargenState) => ActionResult;
  /** Set any field in the state */
  setValue: <K extends keyof ChargenState>(
    field: K,
    value: ChargenState[K],
  ) => ActionResult;
  toggleComplexForm: (formId: string) => ActionResult;

  toggleSpell: (spellId: string) => ActionResult;
};

// Sections that use Record<string, number> pattern
type RecordSections =
  | 'attributes'
  | 'knowledge_skills'
  | 'languages'
  | 'selected_powers'
  | 'skill_groups'
  | 'skills'
  | 'special';

// Sections that use array pattern
type ArraySections = 'selected_complex_forms' | 'selected_spells';

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook that provides high-level action handlers for chargen mutations.
 *
 * All actions automatically:
 * - Check if the sheet is saved (return early if locked)
 * - Apply optimistic updates via `setPredictedValue`
 * - Sync changes to the server via `act('set_preference', ...)`
 */
export function useChargenHandlers(
  config: ChargenHandlersConfig,
): ChargenHandlersResult {
  const { act, featureId, chargenState, setPredictedValue, isSaved } = config;

  // -------------------------------------------------------------------------
  // Core Helpers
  // -------------------------------------------------------------------------

  /**
   * Core function to persist a new state to the server.
   */
  const persistState = useCallback(
    (newState: ChargenState): ActionResult => {
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      setPredictedValue(newState);
      act('set_preference', { preference: featureId, value: newState });
      return { success: true };
    },
    [act, featureId, isSaved, setPredictedValue],
  );

  /**
   * Generic state updater that applies a function to the current state.
   */
  const updateState = useCallback(
    (updater: (prev: ChargenState) => ChargenState): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const newState = updater(chargenState);
      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  // -------------------------------------------------------------------------
  // Generic Actions
  // -------------------------------------------------------------------------

  /**
   * Bump a numeric value in any record-style section.
   */
  const bump = useCallback(
    <K extends RecordSections>(
      section: K,
      id: string,
      delta: number,
      options: BumpOptions = {},
    ): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentValues = (chargenState[section] || {}) as Record<
        string,
        number
      >;

      const bumpConfig: BumpHandlerConfig<Record<string, number>> = {
        currentValues,
        getMin:
          typeof options.min === 'function'
            ? options.min
            : () => options.min ?? 0,
        getMax:
          typeof options.max === 'function'
            ? options.max
            : () => options.max ?? 6,
        canBump: options.canBump,
        validatePoints: options.validatePoints,
        deleteOnZero: options.deleteOnZero ?? true,
      };

      const result: BumpResult<Record<string, number>> = calculateBumpedValue(
        id,
        delta,
        bumpConfig,
      );

      if (!result.success) {
        return { success: false, error: 'Bump failed (bounds or validation)' };
      }

      const newState = {
        ...chargenState,
        [section]: result.newValues,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  /**
   * Toggle an item in an array-style section.
   */
  const toggle = useCallback(
    <K extends ArraySections>(section: K, itemId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentArray = (chargenState[section] || []) as string[];
      const isSelected = currentArray.includes(itemId);

      const newArray = isSelected
        ? currentArray.filter((id) => id !== itemId)
        : [...currentArray, itemId];

      const newState = {
        ...chargenState,
        [section]: newArray,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  /**
   * Set a single field value.
   */
  const setValue = useCallback(
    <K extends keyof ChargenState>(
      field: K,
      value: ChargenState[K],
    ): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const newState = {
        ...chargenState,
        [field]: value,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  // -------------------------------------------------------------------------
  // Attribute Actions
  // -------------------------------------------------------------------------

  const bumpAttribute = useCallback(
    (attrId: string, delta: number, options?: BumpOptions): ActionResult => {
      return bump('attributes', attrId, delta, options);
    },
    [bump],
  );

  // -------------------------------------------------------------------------
  // Skill Actions
  // -------------------------------------------------------------------------

  const bumpSkill = useCallback(
    (skillId: string, delta: number, options?: BumpOptions): ActionResult => {
      return bump('skills', skillId, delta, options);
    },
    [bump],
  );

  const bumpSkillGroup = useCallback(
    (groupId: string, delta: number, options?: BumpOptions): ActionResult => {
      return bump('skill_groups', groupId, delta, options);
    },
    [bump],
  );

  const setSpecialization = useCallback(
    (skillId: string, spec: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const newSpecs = { ...(chargenState.skill_specializations || {}) };
      if (!spec || spec === '') {
        delete newSpecs[skillId];
      } else {
        newSpecs[skillId] = spec;
      }

      const newState = {
        ...chargenState,
        skill_specializations: newSpecs,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  // -------------------------------------------------------------------------
  // Special Actions
  // -------------------------------------------------------------------------

  const bumpSpecial = useCallback(
    (specialId: string, delta: number, options?: BumpOptions): ActionResult => {
      return bump('special', specialId, delta, options);
    },
    [bump],
  );

  // -------------------------------------------------------------------------
  // Magic Actions
  // -------------------------------------------------------------------------

  const setTradition = useCallback(
    (traditionId: string): ActionResult => {
      return setValue('tradition', traditionId);
    },
    [setValue],
  );

  const setMentorSpirit = useCallback(
    (mentorId: string): ActionResult => {
      return setValue('mentor_spirit', mentorId);
    },
    [setValue],
  );

  const toggleSpell = useCallback(
    (spellId: string): ActionResult => {
      return toggle('selected_spells', spellId);
    },
    [toggle],
  );

  const toggleComplexForm = useCallback(
    (formId: string): ActionResult => {
      return toggle('selected_complex_forms', formId);
    },
    [toggle],
  );

  const bumpPower = useCallback(
    (powerId: string, delta: number, options?: BumpOptions): ActionResult => {
      return bump('selected_powers', powerId, delta, options);
    },
    [bump],
  );

  // -------------------------------------------------------------------------
  // Gear Actions
  // -------------------------------------------------------------------------

  const addGear = useCallback(
    (gearId: string, options: AddOptions = {}): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentGear = chargenState.gear || [];
      const existingIndex = currentGear.findIndex(
        (g: GearSelection) => g.id === gearId,
      );

      let newGear: GearSelection[];

      if (existingIndex >= 0 && options.stackable) {
        // Increment quantity
        const existing = currentGear[existingIndex];
        const currentQty = existing.quantity || 1;
        const maxQty = options.maxQuantity || Infinity;

        if (currentQty >= maxQty) {
          return { success: false, error: 'Max quantity reached' };
        }

        newGear = [...currentGear];
        newGear[existingIndex] = { ...existing, quantity: currentQty + 1 };
      } else if (existingIndex < 0) {
        // Add new item
        newGear = [...currentGear, { id: gearId, quantity: 1 }];
      } else {
        // Non-stackable and already exists
        return { success: false, error: 'Item already added (not stackable)' };
      }

      const newState = {
        ...chargenState,
        gear: newGear,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const removeGear = useCallback(
    (gearId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentGear = chargenState.gear || [];
      const existingIndex = currentGear.findIndex(
        (g: GearSelection) => g.id === gearId,
      );

      if (existingIndex < 0) {
        return { success: false, error: 'Item not found' };
      }

      const existing = currentGear[existingIndex];
      const currentQty = existing.quantity || 1;

      let newGear: GearSelection[];

      if (currentQty > 1) {
        // Decrement quantity
        newGear = [...currentGear];
        newGear[existingIndex] = { ...existing, quantity: currentQty - 1 };
      } else {
        // Remove entirely
        newGear = currentGear.filter((g: GearSelection) => g.id !== gearId);
      }

      const newState = {
        ...chargenState,
        gear: newGear,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const clearAllGear = useCallback((): ActionResult => {
    return setValue('gear', []);
  }, [setValue]);

  // -------------------------------------------------------------------------
  // Augment Actions
  // -------------------------------------------------------------------------

  const addAugment = useCallback(
    (augmentId: string, grade: string = 'standard'): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentAugments = chargenState.augments || {};

      if (currentAugments[augmentId]) {
        return { success: false, error: 'Augment already installed' };
      }

      const newAugments = {
        ...currentAugments,
        [augmentId]: { grade, mods: [] } as AugmentSelection,
      };

      const newState = {
        ...chargenState,
        augments: newAugments,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const removeAugment = useCallback(
    (augmentId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentAugments = chargenState.augments || {};

      if (!currentAugments[augmentId]) {
        return { success: false, error: 'Augment not found' };
      }

      const newAugments = { ...currentAugments };
      delete newAugments[augmentId];

      const newState = {
        ...chargenState,
        augments: newAugments,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const changeAugmentGrade = useCallback(
    (augmentId: string, newGrade: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentAugments = chargenState.augments || {};
      const existing = currentAugments[augmentId];

      if (!existing) {
        return { success: false, error: 'Augment not found' };
      }

      const newAugments = {
        ...currentAugments,
        [augmentId]: { ...existing, grade: newGrade },
      };

      const newState = {
        ...chargenState,
        augments: newAugments,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const addAugmentMod = useCallback(
    (augmentId: string, modId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentAugments = chargenState.augments || {};
      const existing = currentAugments[augmentId];

      if (!existing) {
        return { success: false, error: 'Augment not found' };
      }

      const currentMods = existing.mods || [];
      if (currentMods.includes(modId)) {
        return { success: false, error: 'Mod already installed' };
      }

      const newAugments = {
        ...currentAugments,
        [augmentId]: { ...existing, mods: [...currentMods, modId] },
      };

      const newState = {
        ...chargenState,
        augments: newAugments,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const removeAugmentMod = useCallback(
    (augmentId: string, modId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentAugments = chargenState.augments || {};
      const existing = currentAugments[augmentId];

      if (!existing) {
        return { success: false, error: 'Augment not found' };
      }

      const currentMods = existing.mods || [];

      const newAugments = {
        ...currentAugments,
        [augmentId]: {
          ...existing,
          mods: currentMods.filter((m) => m !== modId),
        },
      };

      const newState = {
        ...chargenState,
        augments: newAugments,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const clearAllAugments = useCallback((): ActionResult => {
    return setValue('augments', {});
  }, [setValue]);

  // -------------------------------------------------------------------------
  // Drone Actions
  // -------------------------------------------------------------------------

  const addDrone = useCallback(
    (droneId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentDrones = chargenState.drones || {};

      if (currentDrones[droneId]) {
        return { success: false, error: 'Drone already owned' };
      }

      const newDrones = {
        ...currentDrones,
        [droneId]: { mods: [] } as DroneSelection,
      };

      const newState = {
        ...chargenState,
        drones: newDrones,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const removeDrone = useCallback(
    (droneId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentDrones = chargenState.drones || {};

      if (!currentDrones[droneId]) {
        return { success: false, error: 'Drone not found' };
      }

      const newDrones = { ...currentDrones };
      delete newDrones[droneId];

      const newState = {
        ...chargenState,
        drones: newDrones,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const addDroneMod = useCallback(
    (droneId: string, modId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentDrones = chargenState.drones || {};
      const existing = currentDrones[droneId];

      if (!existing) {
        return { success: false, error: 'Drone not found' };
      }

      const currentMods = existing.mods || [];
      if (currentMods.includes(modId)) {
        return { success: false, error: 'Mod already installed' };
      }

      const newDrones = {
        ...currentDrones,
        [droneId]: { ...existing, mods: [...currentMods, modId] },
      };

      const newState = {
        ...chargenState,
        drones: newDrones,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const removeDroneMod = useCallback(
    (droneId: string, modId: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const currentDrones = chargenState.drones || {};
      const existing = currentDrones[droneId];

      if (!existing) {
        return { success: false, error: 'Drone not found' };
      }

      const currentMods = existing.mods || [];

      const newDrones = {
        ...currentDrones,
        [droneId]: {
          ...existing,
          mods: currentMods.filter((m) => m !== modId),
        },
      };

      const newState = {
        ...chargenState,
        drones: newDrones,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const clearAllDrones = useCallback((): ActionResult => {
    return setValue('drones', {});
  }, [setValue]);

  // -------------------------------------------------------------------------
  // Knowledge & Language Actions
  // -------------------------------------------------------------------------

  const bumpKnowledgeSkill = useCallback(
    (skillId: string, delta: number, options?: BumpOptions): ActionResult => {
      return bump('knowledge_skills', skillId, delta, options);
    },
    [bump],
  );

  const bumpLanguage = useCallback(
    (langId: string, delta: number, options?: BumpOptions): ActionResult => {
      return bump('languages', langId, delta, options);
    },
    [bump],
  );

  const setNativeLanguage = useCallback(
    (langId: string): ActionResult => {
      return setValue('native_language', langId);
    },
    [setValue],
  );

  // -------------------------------------------------------------------------
  // Lifecycle Actions
  // -------------------------------------------------------------------------

  const setPriority = useCallback(
    (category: string, letter: string): ActionResult => {
      if (!chargenState) {
        return { success: false, error: 'No chargen state' };
      }
      if (isSaved) {
        return { success: false, error: 'Sheet is saved/locked' };
      }

      const newPriorities = {
        ...chargenState.priorities,
        [category]: letter,
      };

      const newState = {
        ...chargenState,
        priorities: newPriorities,
      };

      return persistState(newState);
    },
    [chargenState, isSaved, persistState],
  );

  const setMetatype = useCallback(
    (metatype: string): ActionResult => {
      return setValue('metatype_species', metatype);
    },
    [setValue],
  );

  const setAwakening = useCallback(
    (awakening: ChargenState['awakening']): ActionResult => {
      return setValue('awakening', awakening);
    },
    [setValue],
  );

  const setLifestyle = useCallback(
    (lifestyle: string): ActionResult => {
      return setValue('lifestyle', lifestyle);
    },
    [setValue],
  );

  // -------------------------------------------------------------------------
  // Memoized Return Value
  // -------------------------------------------------------------------------

  return useMemo(
    () => ({
      // Generic
      bump,
      toggle,
      setValue,
      updateState,

      // Attributes
      bumpAttribute,

      // Skills
      bumpSkill,
      bumpSkillGroup,
      setSpecialization,

      // Special
      bumpSpecial,

      // Magic
      setTradition,
      setMentorSpirit,
      toggleSpell,
      toggleComplexForm,
      bumpPower,

      // Gear
      addGear,
      removeGear,
      clearAllGear,

      // Augments
      addAugment,
      removeAugment,
      changeAugmentGrade,
      addAugmentMod,
      removeAugmentMod,
      clearAllAugments,

      // Drones
      addDrone,
      removeDrone,
      addDroneMod,
      removeDroneMod,
      clearAllDrones,

      // Knowledge & Languages
      bumpKnowledgeSkill,
      bumpLanguage,
      setNativeLanguage,

      // Lifecycle
      setPriority,
      setMetatype,
      setAwakening,
      setLifestyle,

      // Utility
      isDisabled: isSaved,
    }),
    [
      bump,
      toggle,
      setValue,
      updateState,
      bumpAttribute,
      bumpSkill,
      bumpSkillGroup,
      setSpecialization,
      bumpSpecial,
      setTradition,
      setMentorSpirit,
      toggleSpell,
      toggleComplexForm,
      bumpPower,
      addGear,
      removeGear,
      clearAllGear,
      addAugment,
      removeAugment,
      changeAugmentGrade,
      addAugmentMod,
      removeAugmentMod,
      clearAllAugments,
      addDrone,
      removeDrone,
      addDroneMod,
      removeDroneMod,
      clearAllDrones,
      bumpKnowledgeSkill,
      bumpLanguage,
      setNativeLanguage,
      setPriority,
      setMetatype,
      setAwakening,
      setLifestyle,
      isSaved,
    ],
  );
}
