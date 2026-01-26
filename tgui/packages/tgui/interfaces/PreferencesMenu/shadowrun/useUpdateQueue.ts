/**
 * Optimistic Update Queue - Batches rapid state changes before sending to server
 *
 * When users make rapid changes (e.g., clicking +/- buttons quickly), sending
 * each change immediately can cause performance issues and race conditions.
 * This hook batches changes and sends them after a debounce period.
 *
 * Features:
 * - Debounces rapid updates (configurable delay)
 * - Merges multiple field updates into a single server call
 * - Provides immediate optimistic UI updates
 * - Handles flush on unmount to prevent lost updates
 *
 * @example
 * const { queueUpdate, flushNow, pendingChanges } = useOptimisticUpdateQueue({
 *   currentValue: chargenState,
 *   onFlush: (mergedState) => {
 *     act('set_preference', { preference: 'shadowrun_chargen', value: mergedState });
 *   },
 *   setPredictedValue,
 * });
 *
 * // Queue changes - they'll be batched and sent after delay
 * queueUpdate({ skills: { ...skills, running: 3 } });
 */

import { useCallback, useEffect, useRef } from 'react';

import { ChargenState } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type UpdateQueueConfig = {
  /** Current chargen state value */
  currentValue: ChargenState | null;

  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;

  /** Callback when batched updates are flushed to server */
  onFlush: (mergedState: ChargenState) => void;

  /** Function to set optimistic/predicted value for immediate UI feedback */
  setPredictedValue: (value: ChargenState) => void;
};

export type UpdateQueueResult = {
  /** Clear all pending changes without sending */
  cancelPending: () => void;

  /** Immediately flush pending changes to server */
  flushNow: () => void;

  /** Whether there are pending changes not yet sent */
  hasPendingChanges: boolean;

  /** Number of changes in the queue */
  pendingCount: number;

  /** Queue a partial state update */
  queueUpdate: (partialState: Partial<ChargenState>) => void;
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook that provides optimistic update queuing with batching.
 */
export function useOptimisticUpdateQueue(
  config: UpdateQueueConfig,
): UpdateQueueResult {
  const { currentValue, debounceMs = 300, onFlush, setPredictedValue } = config;

  // Track pending changes
  const pendingChangesRef = useRef<Partial<ChargenState>>({});
  const changeCountRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentValueRef = useRef<ChargenState | null>(currentValue);

  // Keep currentValue ref up to date
  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  // Flush pending changes to server
  const flushNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const pending = pendingChangesRef.current;
    const current = currentValueRef.current;

    if (Object.keys(pending).length === 0 || !current) {
      return;
    }

    // Merge pending changes into current state
    const mergedState = deepMerge(current, pending) as ChargenState;

    // Clear pending
    pendingChangesRef.current = {};
    changeCountRef.current = 0;

    // Send to server
    onFlush(mergedState);
  }, [onFlush]);

  // Cancel pending changes
  const cancelPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingChangesRef.current = {};
    changeCountRef.current = 0;
  }, []);

  // Queue an update
  const queueUpdate = useCallback(
    (partialState: Partial<ChargenState>) => {
      const current = currentValueRef.current;
      if (!current) return;

      // Merge into pending changes
      pendingChangesRef.current = deepMerge(
        pendingChangesRef.current,
        partialState,
      ) as Partial<ChargenState>;
      changeCountRef.current += 1;

      // Immediately update optimistic state for UI feedback
      const optimisticState = deepMerge(
        current,
        pendingChangesRef.current,
      ) as ChargenState;
      setPredictedValue(optimisticState);

      // Reset/start debounce timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        flushNow();
      }, debounceMs);
    },
    [debounceMs, flushNow, setPredictedValue],
  );

  // Flush on unmount to prevent lost updates
  useEffect(() => {
    return () => {
      if (
        timeoutRef.current &&
        Object.keys(pendingChangesRef.current).length > 0
      ) {
        clearTimeout(timeoutRef.current);
        // Synchronously flush remaining changes
        const pending = pendingChangesRef.current;
        const current = currentValueRef.current;
        if (current && Object.keys(pending).length > 0) {
          const mergedState = deepMerge(current, pending) as ChargenState;
          onFlush(mergedState);
        }
      }
    };
  }, [onFlush]);

  return {
    queueUpdate,
    flushNow,
    cancelPending,
    hasPendingChanges: Object.keys(pendingChangesRef.current).length > 0,
    pendingCount: changeCountRef.current,
  };
}

// ============================================================================
// HELPER: DEEP MERGE
// ============================================================================

/**
 * Deep merge two objects, with source values overwriting target values.
 * Arrays are replaced, not merged.
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge objects
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      // Replace value (including arrays)
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for queuing skill updates with automatic point tracking.
 * Useful for rapid skill bumping.
 *
 * @example
 * const { bumpSkill, setSkillRating } = useSkillUpdateQueue(config);
 * bumpSkill('running', +1);
 * setSkillRating('pistols', 4);
 */
export function useSkillUpdateQueue(config: UpdateQueueConfig) {
  const queue = useOptimisticUpdateQueue(config);

  const bumpSkill = useCallback(
    (skillId: string, delta: number) => {
      const current = config.currentValue;
      if (!current) return;

      const currentRating = current.skills?.[skillId] || 0;
      const newRating = Math.max(0, Math.min(6, currentRating + delta));

      const newSkills = { ...current.skills };
      if (newRating === 0) {
        delete newSkills[skillId];
      } else {
        newSkills[skillId] = newRating;
      }

      queue.queueUpdate({ skills: newSkills });
    },
    [config.currentValue, queue],
  );

  const setSkillRating = useCallback(
    (skillId: string, rating: number) => {
      const current = config.currentValue;
      if (!current) return;

      const newSkills = { ...current.skills };
      if (rating === 0) {
        delete newSkills[skillId];
      } else {
        newSkills[skillId] = Math.max(0, Math.min(6, rating));
      }

      queue.queueUpdate({ skills: newSkills });
    },
    [config.currentValue, queue],
  );

  return {
    ...queue,
    bumpSkill,
    setSkillRating,
  };
}

/**
 * Hook for queuing attribute updates.
 *
 * @example
 * const { bumpAttribute, setAttribute } = useAttributeUpdateQueue(config);
 * bumpAttribute('body', +1);
 */
export function useAttributeUpdateQueue(config: UpdateQueueConfig) {
  const queue = useOptimisticUpdateQueue(config);

  const bumpAttribute = useCallback(
    (attrId: string, delta: number, min = 1, max = 6) => {
      const current = config.currentValue;
      if (!current) return;

      const currentValue = current.attributes?.[attrId] || min;
      const newValue = Math.max(min, Math.min(max, currentValue + delta));

      queue.queueUpdate({
        attributes: {
          ...current.attributes,
          [attrId]: newValue,
        },
      });
    },
    [config.currentValue, queue],
  );

  const setAttribute = useCallback(
    (attrId: string, value: number) => {
      const current = config.currentValue;
      if (!current) return;

      queue.queueUpdate({
        attributes: {
          ...current.attributes,
          [attrId]: value,
        },
      });
    },
    [config.currentValue, queue],
  );

  return {
    ...queue,
    bumpAttribute,
    setAttribute,
  };
}
