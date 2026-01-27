/**
 * @file useLocalDraftStorage.ts
 * @description Local draft storage hook for SR5 character generation.
 *
 * Saves work-in-progress character data to localStorage so it survives
 * page refreshes. The draft is automatically saved on state changes and
 * cleared when the character is saved or reset.
 *
 * ## Features
 * - Auto-save to localStorage on state changes (debounced)
 * - Load draft on initial mount
 * - Draft expiration after 7 days
 * - Conflict detection (draft vs server state)
 * - Storage quota handling
 *
 * ## Usage
 * ```tsx
 * const { draft, saveDraft, clearDraft, hasDraft, draftAge } = useLocalDraftStorage({
 *   key: 'shadowrun_chargen_draft_1',
 *   serverState: serverValue,
 * });
 * ```
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChargenState } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** localStorage key prefix for chargen drafts */
const STORAGE_KEY_PREFIX = 'sr5_chargen_draft_';

/** Draft expiration time in milliseconds (7 days) */
const DRAFT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

/** Debounce delay for auto-save in milliseconds */
const AUTO_SAVE_DEBOUNCE_MS = 1000;

// ============================================================================
// TYPES
// ============================================================================

/** Stored draft structure with metadata */
interface StoredDraft {
  /** The character state data */
  data: ChargenState;
  /** Timestamp when draft was saved */
  savedAt: number;
  /** Version for future migration support */
  version: number;
}

/** Configuration for the local draft storage hook */
export interface LocalDraftStorageConfig {
  /** Unique key for this draft (usually includes slot ID) */
  key: string;
  /** Called when draft conflicts with server state */
  onDraftConflict?: (draft: ChargenState, server: ChargenState) => void;
  /** Called when draft is loaded on mount */
  onDraftLoaded?: (draft: ChargenState) => void;
  /** Current server state for conflict detection */
  serverState: ChargenState | null;
}

/** Return type for the local draft storage hook */
export interface LocalDraftStorageResult {
  /** Clear the stored draft */
  clearDraft: () => void;
  /** Age of the draft in human-readable format */
  draftAge: string | null;
  /** Whether the draft conflicts with server state */
  hasConflict: boolean;
  /** Whether a draft exists in storage */
  hasDraft: boolean;
  /** Whether draft storage is supported */
  isSupported: boolean;
  /** Load draft from storage (returns null if none exists or expired) */
  loadDraft: () => ChargenState | null;
  /** Save state to draft storage */
  saveDraft: (state: ChargenState) => boolean;
  /** The stored draft data (null if none) */
  storedDraft: StoredDraft | null;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if localStorage is available and working
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__sr5_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the full storage key for a draft
 */
function getStorageKey(key: string): string {
  return `${STORAGE_KEY_PREFIX}${key}`;
}

/**
 * Format draft age as human-readable string
 */
function formatDraftAge(savedAt: number): string {
  const ageMs = Date.now() - savedAt;
  const ageMinutes = Math.floor(ageMs / (60 * 1000));
  const ageHours = Math.floor(ageMs / (60 * 60 * 1000));
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  if (ageDays > 0) {
    return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
  }
  if (ageHours > 0) {
    return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
  }
  if (ageMinutes > 0) {
    return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/**
 * Check if two ChargenState objects are meaningfully different
 * (ignores minor differences like undefined vs empty object)
 */
function hasSignificantDifference(
  a: ChargenState | null,
  b: ChargenState | null,
): boolean {
  if (!a || !b) return !!a !== !!b;

  // Compare key fields that indicate actual changes
  const keysToCompare: (keyof ChargenState)[] = [
    'priorities',
    'attributes',
    'skills',
    'special',
    'awakening',
    'metatype_species',
    'augments',
    'gear',
    'contacts',
    'selected_spells',
    'selected_powers',
  ];

  for (const key of keysToCompare) {
    const aVal = JSON.stringify(a[key] || {});
    const bVal = JSON.stringify(b[key] || {});
    if (aVal !== bVal) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing local draft storage for character generation.
 */
export function useLocalDraftStorage(
  config: LocalDraftStorageConfig,
): LocalDraftStorageResult {
  const { key, serverState, onDraftLoaded, onDraftConflict } = config;

  // Check localStorage availability once
  const isSupported = useMemo(() => isLocalStorageAvailable(), []);

  // State for the stored draft
  const [storedDraft, setStoredDraft] = useState<StoredDraft | null>(null);

  // Ref for debounced auto-save
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if we've loaded on mount
  const hasLoadedRef = useRef(false);

  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback((): ChargenState | null => {
    if (!isSupported) return null;

    try {
      const storageKey = getStorageKey(key);
      const stored = localStorage.getItem(storageKey);

      if (!stored) return null;

      const parsed: StoredDraft = JSON.parse(stored);

      // Check if draft is expired
      if (Date.now() - parsed.savedAt > DRAFT_EXPIRATION_MS) {
        localStorage.removeItem(storageKey);
        return null;
      }

      setStoredDraft(parsed);
      return parsed.data;
    } catch (error) {
      console.warn('[SR5 Draft] Failed to load draft:', error);
      return null;
    }
  }, [isSupported, key]);

  /**
   * Save state to localStorage
   */
  const saveDraft = useCallback(
    (state: ChargenState): boolean => {
      if (!isSupported) return false;

      // Don't save if the character is already saved/locked
      if (state.saved) {
        return false;
      }

      try {
        const storageKey = getStorageKey(key);
        const draft: StoredDraft = {
          data: state,
          savedAt: Date.now(),
          version: 1,
        };

        localStorage.setItem(storageKey, JSON.stringify(draft));
        setStoredDraft(draft);
        return true;
      } catch (error) {
        // Handle quota exceeded
        if (
          error instanceof DOMException &&
          (error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
        ) {
          console.warn(
            '[SR5 Draft] Storage quota exceeded, clearing old drafts',
          );
          clearOldDrafts();
          // Try one more time
          try {
            const storageKey = getStorageKey(key);
            const draft: StoredDraft = {
              data: state,
              savedAt: Date.now(),
              version: 1,
            };
            localStorage.setItem(storageKey, JSON.stringify(draft));
            setStoredDraft(draft);
            return true;
          } catch {
            return false;
          }
        }
        console.warn('[SR5 Draft] Failed to save draft:', error);
        return false;
      }
    },
    [isSupported, key],
  );

  /**
   * Clear the stored draft
   */
  const clearDraft = useCallback(() => {
    if (!isSupported) return;

    try {
      const storageKey = getStorageKey(key);
      localStorage.removeItem(storageKey);
      setStoredDraft(null);
    } catch (error) {
      console.warn('[SR5 Draft] Failed to clear draft:', error);
    }
  }, [isSupported, key]);

  /**
   * Clear old drafts to free up space
   */
  const clearOldDrafts = useCallback(() => {
    if (!isSupported) return;

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey?.startsWith(STORAGE_KEY_PREFIX)) {
          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const parsed: StoredDraft = JSON.parse(stored);
              // Remove if expired
              if (Date.now() - parsed.savedAt > DRAFT_EXPIRATION_MS) {
                keysToRemove.push(storageKey);
              }
            }
          } catch {
            // Remove corrupted entries
            keysToRemove.push(storageKey);
          }
        }
      }

      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (error) {
      console.warn('[SR5 Draft] Failed to clear old drafts:', error);
    }
  }, [isSupported]);

  // Load draft on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const draft = loadDraft();
    if (draft && onDraftLoaded) {
      // Check for conflict with server state
      if (serverState && hasSignificantDifference(draft, serverState)) {
        onDraftConflict?.(draft, serverState);
      } else if (!serverState?.saved) {
        onDraftLoaded(draft);
      }
    }
  }, [loadDraft, onDraftLoaded, onDraftConflict, serverState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Derived values
  const hasDraft = storedDraft !== null;
  const draftAge = storedDraft ? formatDraftAge(storedDraft.savedAt) : null;
  const hasConflict =
    hasDraft &&
    serverState !== null &&
    hasSignificantDifference(storedDraft?.data ?? null, serverState);

  return {
    clearDraft,
    draftAge,
    hasDraft,
    hasConflict,
    isSupported,
    loadDraft,
    saveDraft,
    storedDraft,
  };
}

// ============================================================================
// AUTO-SAVE HOOK
// ============================================================================

/**
 * Hook that automatically saves state to localStorage with debouncing.
 * Use this in conjunction with useLocalDraftStorage.
 */
export function useAutoSaveDraft(
  state: ChargenState | null,
  saveDraft: (state: ChargenState) => boolean,
  options: {
    /** Debounce delay in ms */
    debounceMs?: number;
    /** Whether auto-save is enabled */
    enabled?: boolean;
  } = {},
): void {
  const { enabled = true, debounceMs = AUTO_SAVE_DEBOUNCE_MS } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !state || state.saved) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      const stateJson = JSON.stringify(state);

      // Only save if state has changed
      if (stateJson !== lastSavedRef.current) {
        const saved = saveDraft(state);
        if (saved) {
          lastSavedRef.current = stateJson;
        }
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, saveDraft, enabled, debounceMs]);
}

export default useLocalDraftStorage;
