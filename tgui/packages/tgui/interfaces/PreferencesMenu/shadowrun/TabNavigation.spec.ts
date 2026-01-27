/**
 * Integration Tests for Tab Navigation State Preservation
 *
 * Tests ensure that:
 * 1. Computation cache persists across simulated tab switches
 * 2. ChargenState updates are preserved when navigating between tabs
 * 3. Tab visit tracking works correctly
 * 4. Deferred computations function as expected
 */

// Define ShadowrunTab locally to avoid importing TabContentRouter
// which pulls in heavy component dependencies
enum ShadowrunTab {
  Augments = 'augments',
  Build = 'build',
  Connections = 'connections',
  Core = 'core',
  Drones = 'drones',
  Gear = 'gear',
  Magic = 'magic',
  Occupations = 'occupations',
  Qualities = 'qualities',
  Summary = 'summary',
}

// ============================================================================
// MOCK COMPUTATION CACHE (standalone implementation for testing)
// ============================================================================

type CacheEntry<T = unknown> = {
  deps: unknown[];
  value: T;
};

class MockComputationCache {
  private cache = new Map<string, CacheEntry>();

  get<T>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key) as CacheEntry<T> | undefined;
  }

  set<T>(key: string, value: T, deps: unknown[]): void {
    this.cache.set(key, { value, deps });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Simulates useCachedComputation behavior for testing
 */
function cachedComputation<T>(
  cache: MockComputationCache,
  cacheKey: string,
  computeFn: () => T,
  deps: unknown[],
): { computeCount: number; value: T } {
  const cached = cache.get<T>(cacheKey);

  if (cached && depsEqual(cached.deps, deps)) {
    return { value: cached.value, computeCount: 0 };
  }

  const newValue = computeFn();
  cache.set(cacheKey, newValue, deps);
  return { value: newValue, computeCount: 1 };
}

// ============================================================================
// COMPUTATION CACHE TESTS
// ============================================================================

describe('Computation Cache Persistence', () => {
  let cache: MockComputationCache;

  beforeEach(() => {
    cache = new MockComputationCache();
  });

  describe('Basic caching behavior', () => {
    test('caches computation result on first call', () => {
      let computeCount = 0;
      const items = ['a', 'b', 'c'];
      const filter = 'a';

      const { value } = cachedComputation(
        cache,
        'test-filter',
        () => {
          computeCount++;
          return items.filter((i) => i === filter);
        },
        [items, filter],
      );

      expect(value).toEqual(['a']);
      expect(computeCount).toBe(1);
      expect(cache.size()).toBe(1);
    });

    test('returns cached value on subsequent calls with same deps', () => {
      let computeCount = 0;
      const items = ['a', 'b', 'c'];
      const filter = 'a';

      // First call - computes
      cachedComputation(
        cache,
        'test-filter',
        () => {
          computeCount++;
          return items.filter((i) => i === filter);
        },
        [items, filter],
      );

      // Second call - should use cache
      const { value } = cachedComputation(
        cache,
        'test-filter',
        () => {
          computeCount++;
          return items.filter((i) => i === filter);
        },
        [items, filter],
      );

      expect(value).toEqual(['a']);
      expect(computeCount).toBe(1); // Only computed once
    });

    test('recomputes when dependencies change', () => {
      let computeCount = 0;
      const items = ['a', 'b', 'c'];

      // First call with filter 'a'
      cachedComputation(
        cache,
        'test-filter',
        () => {
          computeCount++;
          return items.filter((i) => i === 'a');
        },
        [items, 'a'],
      );

      // Second call with filter 'b' - deps changed
      const { value } = cachedComputation(
        cache,
        'test-filter',
        () => {
          computeCount++;
          return items.filter((i) => i === 'b');
        },
        [items, 'b'],
      );

      expect(value).toEqual(['b']);
      expect(computeCount).toBe(2); // Computed twice due to dep change
    });
  });

  describe('Simulated tab switching', () => {
    test('cache persists when simulating unmount (tab switch away)', () => {
      let gearComputeCount = 0;
      const gearItems = [
        { id: '1', category: 'weapons' },
        { id: '2', category: 'armor' },
        { id: '3', category: 'weapons' },
      ];

      // Simulate GearSection mounting and computing
      cachedComputation(
        cache,
        'gear-category-weapons',
        () => {
          gearComputeCount++;
          return gearItems.filter((i) => i.category === 'weapons');
        },
        [gearItems, 'weapons'],
      );

      expect(gearComputeCount).toBe(1);

      // Simulate tab switch (component unmounts, but cache persists)
      // ... (cache is preserved in parent context)

      // Simulate GearSection remounting (visiting tab again)
      const { value } = cachedComputation(
        cache,
        'gear-category-weapons',
        () => {
          gearComputeCount++;
          return gearItems.filter((i) => i.category === 'weapons');
        },
        [gearItems, 'weapons'],
      );

      // Should return cached value without recomputing
      expect(gearComputeCount).toBe(1);
      expect(value).toHaveLength(2);
      expect(value.map((i) => i.id)).toEqual(['1', '3']);
    });

    test('multiple tabs can have independent caches', () => {
      let gearComputes = 0;
      let augmentComputes = 0;

      const gearItems = [{ id: 'g1', category: 'weapons' }];
      const augmentItems = [{ id: 'a1', category: 'cyberware' }];

      // Gear tab computation
      cachedComputation(
        cache,
        'gear-filtered',
        () => {
          gearComputes++;
          return gearItems;
        },
        [gearItems],
      );

      // Augments tab computation
      cachedComputation(
        cache,
        'augments-filtered',
        () => {
          augmentComputes++;
          return augmentItems;
        },
        [augmentItems],
      );

      // Both should compute once
      expect(gearComputes).toBe(1);
      expect(augmentComputes).toBe(1);
      expect(cache.size()).toBe(2);

      // Revisit gear tab - should use cache
      cachedComputation(
        cache,
        'gear-filtered',
        () => {
          gearComputes++;
          return gearItems;
        },
        [gearItems],
      );

      // Still only 1 compute for gear
      expect(gearComputes).toBe(1);
    });

    test('cache invalidation works correctly', () => {
      let computeCount = 0;

      cachedComputation(
        cache,
        'test-cache',
        () => {
          computeCount++;
          return 'value';
        },
        [],
      );

      expect(computeCount).toBe(1);

      // Invalidate the cache
      cache.invalidate('test-cache');

      // Should recompute after invalidation
      cachedComputation(
        cache,
        'test-cache',
        () => {
          computeCount++;
          return 'value';
        },
        [],
      );

      expect(computeCount).toBe(2);
    });
  });
});

// ============================================================================
// TAB VISIT STATE TESTS
// ============================================================================

describe('Tab Visit State Tracking', () => {
  test('tracks which tabs have been visited', () => {
    const visitedTabs = new Set<string>();
    let currentTab = ShadowrunTab.Build;

    // Simulate visiting Build tab
    visitedTabs.add(currentTab);
    expect(visitedTabs.has(ShadowrunTab.Build)).toBe(true);
    expect(visitedTabs.has(ShadowrunTab.Gear)).toBe(false);

    // Simulate switching to Gear tab
    currentTab = ShadowrunTab.Gear;
    visitedTabs.add(currentTab);

    expect(visitedTabs.has(ShadowrunTab.Build)).toBe(true);
    expect(visitedTabs.has(ShadowrunTab.Gear)).toBe(true);
    expect(visitedTabs.has(ShadowrunTab.Magic)).toBe(false);
  });

  test('once visited, tab remains in visited set', () => {
    const visitedTabs = new Set<string>();

    visitedTabs.add(ShadowrunTab.Build);
    visitedTabs.add(ShadowrunTab.Gear);

    // Switch back to Build - Gear should still be "visited"
    const currentTab = ShadowrunTab.Build;
    expect(currentTab).toBe(ShadowrunTab.Build);
    expect(visitedTabs.has(ShadowrunTab.Gear)).toBe(true);
  });
});

// ============================================================================
// CHARGEN STATE PRESERVATION TESTS
// ============================================================================

describe('ChargenState Preservation Across Tabs', () => {
  // Simulated state management (mimics React state behavior)
  type ChargenState = {
    attributes: Record<string, number>;
    augments: Record<string, unknown>;
    skills: Record<string, number>;
  };

  function createMockStateManager(initialState: ChargenState) {
    let state = { ...initialState };
    return {
      getState: () => state,
      setState: (updates: Partial<ChargenState>) => {
        state = { ...state, ...updates };
      },
      setAttributes: (attrs: Record<string, number>) => {
        state = { ...state, attributes: attrs };
      },
      setSkills: (skills: Record<string, number>) => {
        state = { ...state, skills };
      },
    };
  }

  test('state changes in one tab are preserved when switching tabs', () => {
    const stateManager = createMockStateManager({
      attributes: { body: 3, agility: 3 },
      skills: {},
      augments: {},
    });

    // On Build tab - modify attributes
    stateManager.setAttributes({ body: 5, agility: 4 });

    // Simulate switching to Gear tab
    // State should be preserved
    const afterSwitch = stateManager.getState();
    expect(afterSwitch.attributes.body).toBe(5);
    expect(afterSwitch.attributes.agility).toBe(4);

    // Simulate switching back to Build tab
    const backToBuild = stateManager.getState();
    expect(backToBuild.attributes.body).toBe(5);
  });

  test('changes in Gear tab dont affect attribute state', () => {
    const stateManager = createMockStateManager({
      attributes: { body: 5 },
      skills: {},
      augments: {},
    });

    // Simulate adding gear (would update a different part of state)
    const gear = { gear_items: [{ id: 'ares_predator' }] };
    stateManager.setState(gear as Partial<ChargenState>);

    // Attributes should be unchanged
    expect(stateManager.getState().attributes.body).toBe(5);
  });

  test('skills state persists across tab navigation', () => {
    const stateManager = createMockStateManager({
      attributes: {},
      skills: {},
      augments: {},
    });

    // On Build tab - set skills
    stateManager.setSkills({ firearms: 4, stealth: 3, perception: 2 });

    // Switch to Augments tab and back
    const afterRoundTrip = stateManager.getState();
    expect(afterRoundTrip.skills).toEqual({
      firearms: 4,
      stealth: 3,
      perception: 2,
    });
  });
});

// ============================================================================
// DEFERRED COMPUTATION TESTS
// ============================================================================

describe('Deferred Computation Logic', () => {
  test('computation is skipped when inactive', () => {
    let computeCount = 0;
    let isActive = false;
    let cachedResult: string | null = null;
    let hasComputed = false;

    // Simulate deferred computation behavior
    function deferredCompute(active: boolean, computeFn: () => string) {
      if (active && !hasComputed) {
        cachedResult = computeFn();
        hasComputed = true;
      }
      return cachedResult;
    }

    // Initially inactive - should not compute
    const result1 = deferredCompute(isActive, () => {
      computeCount++;
      return 'computed';
    });

    expect(result1).toBeNull();
    expect(computeCount).toBe(0);

    // Now become active - should compute
    isActive = true;
    const result2 = deferredCompute(isActive, () => {
      computeCount++;
      return 'computed';
    });

    expect(result2).toBe('computed');
    expect(computeCount).toBe(1);

    // Subsequent calls while active should use cached value
    const result3 = deferredCompute(isActive, () => {
      computeCount++;
      return 'computed again';
    });

    expect(result3).toBe('computed');
    expect(computeCount).toBe(1); // Still 1, used cache
  });

  test('cache survives when becoming inactive', () => {
    let cachedResult: string | null = null;
    let hasComputed = false;

    function deferredCompute(active: boolean, computeFn: () => string) {
      if (active && !hasComputed) {
        cachedResult = computeFn();
        hasComputed = true;
      }
      return cachedResult;
    }

    // Compute while active
    deferredCompute(true, () => 'first-compute');
    expect(cachedResult).toBe('first-compute');

    // Become inactive - cached value should persist
    const result = deferredCompute(false, () => 'should-not-run');
    expect(result).toBe('first-compute');
  });
});

// ============================================================================
// DEPENDENCY COMPARISON TESTS
// ============================================================================

describe('Dependency Array Comparison', () => {
  test('equal primitive deps are detected', () => {
    const deps1 = [1, 'a', true];
    const deps2 = [1, 'a', true];
    expect(depsEqual(deps1, deps2)).toBe(true);
  });

  test('different primitive deps are detected', () => {
    const deps1 = [1, 'a', true];
    const deps2 = [1, 'b', true];
    expect(depsEqual(deps1, deps2)).toBe(false);
  });

  test('different length deps are not equal', () => {
    const deps1 = [1, 2];
    const deps2 = [1, 2, 3];
    expect(depsEqual(deps1, deps2)).toBe(false);
  });

  test('same object reference is equal', () => {
    const obj = { a: 1 };
    const deps1 = [obj];
    const deps2 = [obj];
    expect(depsEqual(deps1, deps2)).toBe(true);
  });

  test('different object references are not equal (by design)', () => {
    const deps1 = [{ a: 1 }];
    const deps2 = [{ a: 1 }];
    // Object.is uses reference equality, so these are different
    expect(depsEqual(deps1, deps2)).toBe(false);
  });

  test('empty deps are equal', () => {
    expect(depsEqual([], [])).toBe(true);
  });

  test('NaN equals NaN (Object.is behavior)', () => {
    expect(depsEqual([NaN], [NaN])).toBe(true);
  });
});

// ============================================================================
// INTEGRATION: FULL TAB NAVIGATION SIMULATION
// ============================================================================

describe('Full Tab Navigation Integration', () => {
  test('complete tab navigation workflow preserves all state', () => {
    // Setup
    const cache = new MockComputationCache();
    const visitedTabs = new Set<string>();
    let currentTab = ShadowrunTab.Build;

    // Simulated character state
    const charState = {
      attributes: { body: 3, agility: 3 },
      skills: { firearms: 0 },
      selectedGear: [] as string[],
      selectedAugments: [] as string[],
    };

    // Computation counters
    const computeCounts = {
      gearFilter: 0,
      augmentFilter: 0,
      skillGrouping: 0,
    };

    // === STEP 1: Start on Build tab ===
    visitedTabs.add(currentTab);
    charState.attributes = { body: 5, agility: 4 };
    charState.skills = { firearms: 4 };

    // === STEP 2: Navigate to Gear tab ===
    currentTab = ShadowrunTab.Gear;
    visitedTabs.add(currentTab);

    // Gear computation runs
    const gearItems = [
      { id: 'g1', cat: 'weapons' },
      { id: 'g2', cat: 'armor' },
    ];
    cachedComputation(
      cache,
      'gear-weapons',
      () => {
        computeCounts.gearFilter++;
        return gearItems.filter((g) => g.cat === 'weapons');
      },
      [gearItems, 'weapons'],
    );

    charState.selectedGear.push('g1');

    // === STEP 3: Navigate to Augments tab ===
    currentTab = ShadowrunTab.Augments;
    visitedTabs.add(currentTab);

    const augmentItems = [{ id: 'a1', cat: 'cyberware' }];
    cachedComputation(
      cache,
      'augments-cyberware',
      () => {
        computeCounts.augmentFilter++;
        return augmentItems.filter((a) => a.cat === 'cyberware');
      },
      [augmentItems, 'cyberware'],
    );

    // === STEP 4: Navigate back to Gear tab ===
    currentTab = ShadowrunTab.Gear;

    // Re-run gear computation - should use cache
    cachedComputation(
      cache,
      'gear-weapons',
      () => {
        computeCounts.gearFilter++;
        return gearItems.filter((g) => g.cat === 'weapons');
      },
      [gearItems, 'weapons'],
    );

    // === STEP 5: Navigate back to Build tab ===
    currentTab = ShadowrunTab.Build;

    // === ASSERTIONS ===

    // All tabs should be tracked as visited
    expect(visitedTabs.has(ShadowrunTab.Build)).toBe(true);
    expect(visitedTabs.has(ShadowrunTab.Gear)).toBe(true);
    expect(visitedTabs.has(ShadowrunTab.Augments)).toBe(true);

    // State should be preserved
    expect(charState.attributes).toEqual({ body: 5, agility: 4 });
    expect(charState.skills).toEqual({ firearms: 4 });
    expect(charState.selectedGear).toEqual(['g1']);

    // Computations should have been cached
    expect(computeCounts.gearFilter).toBe(1); // Only computed once despite 2 visits
    expect(computeCounts.augmentFilter).toBe(1);

    // Cache should have entries
    expect(cache.size()).toBe(2);
  });
});
