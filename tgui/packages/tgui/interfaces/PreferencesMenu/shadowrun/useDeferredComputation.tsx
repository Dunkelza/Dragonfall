/**
 * Deferred and Cached Computation Hooks for Tab Performance Optimization
 *
 * This module provides hooks for optimizing expensive computations in
 * tab-based UIs where:
 * 1. Only one tab renders at a time (switch-based routing)
 * 2. Tabs may remount when revisited
 * 3. Expensive computations (filtering, sorting) should be cached
 *
 * Key Patterns:
 *
 * 1. `useCachedComputation` - Caches computation results with dependency tracking
 *    Survives component remounts via external cache storage
 *
 * 2. `ComputationCacheProvider` - Context for cross-tab computation caching
 *    Allows child components to share cached computation results
 *
 * 3. `useDeferredComputation` - Skips computation when tab isn't active
 *    Only useful when tabs stay mounted but hidden
 *
 * @example
 * ```tsx
 * // In parent component
 * <ComputationCacheProvider>
 *   <TabContentRouter tab={activeTab} />
 * </ComputationCacheProvider>
 *
 * // In child tab component
 * const filteredItems = useCachedComputation(
 *   'gear-filtered-items',
 *   () => items.filter(i => i.category === selectedCategory),
 *   [items, selectedCategory]
 * );
 * ```
 */

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// ============================================================================
// COMPUTATION CACHE CONTEXT
// ============================================================================

type CacheEntry<T = unknown> = {
  deps: unknown[];
  value: T;
};

type ComputationCache = Map<string, CacheEntry>;

type ComputationCacheContextValue = {
  cache: ComputationCache;
  get: <T>(key: string) => CacheEntry<T> | undefined;
  invalidate: (key: string) => void;
  invalidateAll: () => void;
  set: <T>(key: string, value: T, deps: unknown[]) => void;
};

const ComputationCacheContext =
  createContext<ComputationCacheContextValue | null>(null);

/**
 * Provider for computation cache that persists across tab switches.
 * Place this above the TabContentRouter to enable cross-tab caching.
 */
export function ComputationCacheProvider({
  children,
}: {
  children: ReactNode;
}) {
  const cacheRef = useRef<ComputationCache>(new Map());

  const contextValue = useMemo<ComputationCacheContextValue>(
    () => ({
      cache: cacheRef.current,
      get: function <T>(key: string) {
        return cacheRef.current.get(key) as CacheEntry<T> | undefined;
      },
      set: function <T>(key: string, value: T, deps: unknown[]) {
        cacheRef.current.set(key, { value, deps });
      },
      invalidate: (key: string) => {
        cacheRef.current.delete(key);
      },
      invalidateAll: () => {
        cacheRef.current.clear();
      },
    }),
    [],
  );

  return (
    <ComputationCacheContext.Provider value={contextValue}>
      {children}
    </ComputationCacheContext.Provider>
  );
}

/**
 * Hook to access the computation cache context.
 */
export function useComputationCache(): ComputationCacheContextValue | null {
  return useContext(ComputationCacheContext);
}

// ============================================================================
// CACHED COMPUTATION HOOK
// ============================================================================

/**
 * Performs an expensive computation with cross-mount caching.
 *
 * Unlike useMemo, this hook caches results in a context that persists
 * when the component unmounts. When the component remounts with the same
 * cache key and dependencies, the cached value is returned immediately.
 *
 * Falls back to regular useMemo behavior if cache context isn't available.
 *
 * @param cacheKey - Unique key for this computation
 * @param computeFn - The expensive computation function
 * @param deps - Dependencies that trigger recomputation when changed
 * @returns The computed (or cached) value
 */
export function useCachedComputation<T>(
  cacheKey: string,
  computeFn: () => T,
  deps: unknown[],
): T {
  const cache = useComputationCache();

  // Fallback to regular useMemo if no cache context
  const fallbackMemo = useMemo(computeFn, deps);

  if (!cache) {
    return fallbackMemo;
  }

  // Check cache for existing value with matching deps
  const cached = cache.get<T>(cacheKey);

  if (cached && depsEqual(cached.deps, deps)) {
    return cached.value;
  }

  // Compute new value and cache it
  const newValue = computeFn();
  cache.set(cacheKey, newValue, deps);

  return newValue;
}

// ============================================================================
// DEFERRED COMPUTATION HOOK (for kept-mounted tabs)
// ============================================================================

/**
 * Defers expensive computation until the component is "active" (visible).
 * Once computed, the result is cached and returned even when inactive.
 *
 * Note: This is most useful when tabs stay mounted but hidden. If tabs
 * unmount when switched (like with a switch statement), use
 * `useCachedComputation` instead.
 *
 * @param isActive - Whether this component/tab is currently visible
 * @param computeFn - The expensive computation function
 * @param deps - Dependencies that should trigger recomputation when active
 * @returns The computed value (or null/cached value if never computed)
 */
export function useDeferredComputation<T>(
  isActive: boolean,
  computeFn: () => T,
  deps: React.DependencyList,
): T | null {
  // Track whether we've ever computed this value
  const hasComputed = useRef(false);

  // Cache the last computed result
  const cachedResult = useRef<T | null>(null);

  // Track deps to know when to invalidate cache
  const depsRef = useRef<React.DependencyList>(deps);

  // Check if deps changed
  const depsChanged = !depsEqual(depsRef.current, deps);

  if (depsChanged) {
    depsRef.current = deps;
  }

  // Only compute if:
  // 1. We're active AND
  // 2. Either we haven't computed yet OR deps changed
  if (isActive && (!hasComputed.current || depsChanged)) {
    cachedResult.current = computeFn();
    hasComputed.current = true;
  }

  return cachedResult.current;
}

/**
 * Version that returns a default value instead of null when not yet computed.
 *
 * @param isActive - Whether this component/tab is currently visible
 * @param computeFn - The expensive computation function
 * @param deps - Dependencies that should trigger recomputation when active
 * @param defaultValue - Value to return if not yet computed
 * @returns The computed value or defaultValue
 */
export function useDeferredComputationWithDefault<T>(
  isActive: boolean,
  computeFn: () => T,
  deps: React.DependencyList,
  defaultValue: T,
): T {
  const result = useDeferredComputation(isActive, computeFn, deps);
  return result ?? defaultValue;
}

// ============================================================================
// TAB VISIT STATE HOOK
// ============================================================================

/**
 * Hook that tracks whether a tab has ever been visited.
 * Once visited, computations can be enabled permanently.
 *
 * @param currentTab - The currently active tab
 * @param thisTab - The tab this component belongs to
 * @returns Object with isActive (currently visible) and hasBeenVisited (ever seen)
 */
export function useTabVisitState(
  currentTab: string,
  thisTab: string,
): { hasBeenVisited: boolean; isActive: boolean } {
  const isActive = currentTab === thisTab;
  const [hasBeenVisited, setHasBeenVisited] = useState(isActive);

  useEffect(() => {
    if (isActive && !hasBeenVisited) {
      setHasBeenVisited(true);
    }
  }, [isActive, hasBeenVisited]);

  return { isActive, hasBeenVisited };
}

// ============================================================================
// TAB CONTEXT (for passing tab state to deeply nested children)
// ============================================================================

export type TabContextValue = {
  currentTab: string;
  hasTabBeenVisited: (tabId: string) => boolean;
  isTabActive: (tabId: string) => boolean;
};

export const TabContext = createContext<TabContextValue | null>(null);

/**
 * Hook to access tab context for determining if the current tab is active.
 * Returns a fallback that always reports active if context isn't provided.
 */
export function useTabContext(): TabContextValue {
  const context = useContext(TabContext);
  if (!context) {
    // Fallback for when context isn't provided - always active
    return {
      currentTab: '',
      isTabActive: () => true,
      hasTabBeenVisited: () => true,
    };
  }
  return context;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to compare dependency arrays for equality.
 */
function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}
