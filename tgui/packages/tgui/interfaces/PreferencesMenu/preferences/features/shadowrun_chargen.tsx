import { sortBy } from 'common/collections';
import { useEffect, useMemo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../../backend';
import { Box, Button, Icon, Input, Stack, Tabs } from '../../../../components';
import { Feature, FeatureValueProps } from './base';

type PriorityLetter = 'A' | 'B' | 'C' | 'D' | 'E';

type SRChargenState = {
  attributes?: Record<string, number>;
  awakening?: string;
  metatype_species?: string;
  priorities?: Record<string, PriorityLetter>;
  saved?: boolean;
  schema_version?: number;
  skill_groups?: Record<string, number>;
  skills?: Record<string, number>;
  special?: Record<string, number>;
};

type SRChargenConstantData = {
  attributes: {
    id: string;
    max: number;
    min: number;
    name: string;
    sort: number;
  }[];
  awakening_choices?: {
    id: string;
    name: string;
  }[];
  edge_base: number;
  metatype_attribute_bounds?: Record<
    string,
    Record<string, [number, number] | number[]>
  >;
  metatype_choices?: {
    id: string;
    min_priority: PriorityLetter;
    name: string;
  }[];
  priority_categories: string[];
  priority_display_names: Record<string, string>;
  priority_letters: PriorityLetter[];
  priority_tables: {
    attributes: Record<PriorityLetter, number>;
    magic: Record<PriorityLetter, number>;
    metatype_special: Record<PriorityLetter, number>;
    resources: Record<PriorityLetter, number>;
    skill_groups?: Record<PriorityLetter, number>;
    skills: Record<PriorityLetter, number>;
  };
  schema_version?: number;
  skill_groups?: {
    id: string;
    name: string;
    skills: string[];
  }[];
  skills: {
    id: string;
    name: string;
    parent_stat_id: string;
    parent_stat_name: string;
    sort: number;
  }[];
  special_attributes: {
    id: string;
    max: number;
    min: number;
    name: string;
  }[];
};

type SkillMeta = SRChargenConstantData['skills'][number];

const HintedLabel = (props: { hint?: string; text: string }) => {
  const { text, hint } = props;
  if (!hint) {
    return <Box as="span">{text}</Box>;
  }

  return (
    <Tooltip content={hint} position="bottom-start">
      <Box
        as="span"
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
          cursor: 'help',
        }}
      >
        {text}
      </Box>
    </Tooltip>
  );
};

const HINTS = {
  overview:
    'Summary of your current priorities and point spending. Save Sheet when you are done.',
  attributes:
    'Attribute points raise your core stats, which also set the base dice pool for related skills.',
  skills:
    'Skill points raise individual skills. Dice pool is typically Attribute + Skill rating.',
  skillGroups:
    'Skill groups raise several related skills together (when enabled for your ruleset).',
  special:
    'Special points are used for Edge, Magic (if awakened), and other special stats.',
  priorities:
    'Priorities (A–E) decide how many points/resources you get in each category.',
  awakening:
    'Awakening determines whether you can use Magic and how many Magic points you can allocate.',
  metatype:
    'Metatype sets your body/species and can affect attribute limits and special point totals.',
  resources: 'Resources represent starting money and gear budget.',
  magic:
    'Magic is only available if you are awakened. It affects magical aptitude and abilities.',
  metatypeSp:
    'Metatype Special Points are spent on special attributes like Edge (and Magic if awakened).',
  skillGroupLock:
    'When a skill group has points, its member skills are locked to prevent breaking the group. Remove group points to edit member skills again.',
  tabAllSkills:
    'Shows all skills (filter applies, and bought skills are always shown).',
};

const formatNuyen = (amount: number) => `\u00a5${amount}`;

const DEFAULT_PRIORITY_LETTERS: PriorityLetter[] = ['A', 'B', 'C', 'D', 'E'];
const DEFAULT_PRIORITY_CATEGORIES = [
  'metatype',
  'attributes',
  'skills',
  'magic',
  'resources',
] as const;

type NormalizedConstData = {
  attributesMeta: SRChargenConstantData['attributes'];
  priorityCategories: string[];
  priorityLetters: PriorityLetter[];
  priorityTables: SRChargenConstantData['priority_tables'];
  skillGroupsMeta: NonNullable<SRChargenConstantData['skill_groups']>;
  skillsMeta: SRChargenConstantData['skills'];
  specialAttributesMeta: SRChargenConstantData['special_attributes'];
};

const normalizeConstData = (
  constData: SRChargenConstantData,
): { data: NormalizedConstData; ok: true } | { error: string; ok: false } => {
  const attributesMeta = Array.isArray(constData.attributes)
    ? constData.attributes
    : [];
  const skillsMeta = Array.isArray(constData.skills) ? constData.skills : [];
  const skillGroupsMeta = Array.isArray(constData.skill_groups)
    ? constData.skill_groups
    : [];
  const specialAttributesMeta = Array.isArray(constData.special_attributes)
    ? constData.special_attributes
    : [];

  const priorityTables = constData.priority_tables;
  const priorityCategories = (Array.isArray(constData.priority_categories) &&
    constData.priority_categories.length > 0 &&
    constData.priority_categories) || [...DEFAULT_PRIORITY_CATEGORIES];
  const priorityLetters =
    (Array.isArray(constData.priority_letters) &&
      constData.priority_letters.length > 0 &&
      constData.priority_letters) ||
    DEFAULT_PRIORITY_LETTERS;

  if (
    !priorityTables ||
    !priorityTables.attributes ||
    !priorityTables.skills ||
    !priorityTables.resources ||
    !priorityTables.metatype_special ||
    !priorityTables.magic ||
    attributesMeta.length === 0 ||
    skillsMeta.length === 0
  ) {
    return {
      ok: false,
      error:
        'Shadowrun chargen metadata is missing (preferences.json is incomplete). Rebuild/update TGUI assets and try again.',
    };
  }

  return {
    ok: true,
    data: {
      attributesMeta,
      priorityCategories,
      priorityLetters,
      priorityTables,
      skillGroupsMeta,
      skillsMeta,
      specialAttributesMeta,
    },
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

const priorityRank = (letter: PriorityLetter) =>
  ({ A: 5, B: 4, C: 3, D: 2, E: 1 })[letter];

const sortSkills = sortBy<SRChargenConstantData['skills'][number]>((s) =>
  `${s.parent_stat_name}__${String(s.sort).padStart(5, '0')}__${s.name}`.toLowerCase(),
);

const ensureState = (raw: unknown): SRChargenState => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw as SRChargenState;
};

const swapPriority = (
  priorities: Record<string, PriorityLetter>,
  category: string,
  newLetter: PriorityLetter,
) => {
  const next = { ...priorities };
  const oldLetter = next[category];

  for (const [otherCat, otherLetter] of Object.entries(next)) {
    if (otherCat !== category && otherLetter === newLetter) {
      next[otherCat] = oldLetter;
      break;
    }
  }

  next[category] = newLetter;
  return next;
};

const normalizeAttributesAllocation = (
  current: Record<string, number>,
  meta: SRChargenConstantData['attributes'],
  allowedPoints: number,
): Record<string, number> => {
  const out: Record<string, number> = {};

  for (const a of meta) {
    const raw = current[a.id];
    const value = Number.isFinite(raw) ? Number(raw) : a.min;
    out[a.id] = clamp(Math.round(value), a.min, a.max);
  }

  let spent = sum(meta.map((a) => (out[a.id] ?? a.min) - a.min));
  while (spent > allowedPoints) {
    let best: { id: string; min: number; value: number } | null = null;
    for (const a of meta) {
      const value = out[a.id] ?? a.min;
      if (value <= a.min) {
        continue;
      }
      if (!best || value > best.value) {
        best = { id: a.id, value, min: a.min };
      }
    }

    if (!best) {
      break;
    }
    out[best.id] = Math.max(best.min, best.value - 1);
    spent -= 1;
  }

  return out;
};

const normalizeSkillsAllocation = (
  current: Record<string, number>,
  allowedPoints: number,
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [id, raw] of Object.entries(current)) {
    const value = Number.isFinite(raw) ? Number(raw) : 0;
    const clamped = clamp(Math.round(value), 0, 6);
    if (clamped > 0) {
      out[id] = clamped;
    }
  }

  let spent = sum(Object.values(out));
  while (spent > allowedPoints) {
    let bestId: string | null = null;
    let bestValue = 0;
    for (const [id, value] of Object.entries(out)) {
      if (value > bestValue) {
        bestId = id;
        bestValue = value;
      }
    }
    if (!bestId) {
      break;
    }
    const next = bestValue - 1;
    if (next <= 0) {
      delete out[bestId];
    } else {
      out[bestId] = next;
    }
    spent -= 1;
  }

  return out;
};

const normalizeSkillGroupsAllocation = (
  current: Record<string, number>,
  allowedPoints: number,
): Record<string, number> => {
  if (allowedPoints <= 0) {
    return {};
  }

  const out: Record<string, number> = {};
  for (const [id, raw] of Object.entries(current)) {
    const value = Number.isFinite(raw) ? Number(raw) : 0;
    const clamped = clamp(Math.round(value), 0, 6);
    if (clamped > 0) {
      out[id] = clamped;
    }
  }

  let spent = sum(Object.values(out));
  while (spent > allowedPoints) {
    let bestId: string | null = null;
    let bestValue = 0;
    for (const [id, value] of Object.entries(out)) {
      if (value > bestValue) {
        bestId = id;
        bestValue = value;
      }
    }
    if (!bestId) {
      break;
    }
    const next = bestValue - 1;
    if (next <= 0) {
      delete out[bestId];
    } else {
      out[bestId] = next;
    }
    spent -= 1;
  }

  return out;
};

const normalizeMetatypeSpecies = (
  current: string | undefined,
  metatypeLetter: PriorityLetter,
  metatypeChoices: { id: string; min_priority: PriorityLetter; name: string }[],
): string => {
  const HUMAN = '/datum/species/human';
  if (metatypeLetter === 'E') {
    return HUMAN;
  }

  const allowed = metatypeChoices.filter(
    (c) => priorityRank(metatypeLetter) >= priorityRank(c.min_priority),
  );

  const exists = allowed.find((c) => c.id === current);
  if (exists) {
    return exists.id;
  }

  const preferHuman = allowed.find((c) => c.id === HUMAN);
  return (preferHuman || allowed[0] || { id: HUMAN }).id;
};

const normalizeAwakening = (
  current: string | undefined,
  magicDisabledByPriority: boolean,
): string => {
  if (magicDisabledByPriority) {
    return 'mundane';
  }
  if (current === 'mage' || current === 'adept' || current === 'mundane') {
    return current;
  }
  return 'mage';
};

const normalizeSpecialAllocation = (params: {
  current: Record<string, number>;
  edgeBase: number;
  edgeId: string;
  edgeMax: number;
  isAwakened: boolean;
  magicBase: number;
  magicId: string;
  magicMax: number;
  totalSpecialPoints: number;
}): Record<string, number> => {
  const out: Record<string, number> = { ...params.current };

  let edgeBonus = Number.isFinite(out[params.edgeId])
    ? Math.round(out[params.edgeId])
    : 0;
  let magicBonus = Number.isFinite(out[params.magicId])
    ? Math.round(out[params.magicId])
    : 0;

  edgeBonus = clamp(
    edgeBonus,
    0,
    Math.max(0, params.edgeMax - params.edgeBase),
  );
  if (!params.isAwakened) {
    magicBonus = 0;
  } else {
    magicBonus = clamp(
      magicBonus,
      0,
      Math.max(0, params.magicMax - params.magicBase),
    );
  }

  while (edgeBonus + magicBonus > params.totalSpecialPoints) {
    if (magicBonus > edgeBonus && magicBonus > 0) {
      magicBonus -= 1;
    } else if (edgeBonus > 0) {
      edgeBonus -= 1;
    } else {
      break;
    }
  }

  out[params.edgeId] = edgeBonus;
  out[params.magicId] = magicBonus;
  return out;
};

// eslint-disable-next-line complexity
const ShadowrunChargenInput = (
  props: FeatureValueProps<unknown, SRChargenState, SRChargenConstantData>,
) => {
  const constData = props.serverData;
  if (!constData) {
    return <Box>Loading…</Box>;
  }

  // preferences.json is loaded independently of the BYOND UI payload.
  // If that JSON is missing/partial, avoid hard-crashing the whole menu.
  const normalized = normalizeConstData(constData);
  if (!normalized.ok) {
    return <Box color="bad">{normalized.error}</Box>;
  }

  const {
    attributesMeta,
    skillsMeta,
    skillGroupsMeta,
    specialAttributesMeta,
    priorityTables,
    priorityCategories,
    priorityLetters,
  } = normalized.data;

  const state = ensureState(props.value);
  const saved = Boolean((state as any)?.saved);
  const locked = saved;
  const priorities =
    state.priorities ||
    (() => {
      const out: Record<string, PriorityLetter> = {};
      for (let i = 0; i < priorityCategories.length; i++) {
        out[priorityCategories[i]] =
          priorityLetters[i % priorityLetters.length];
      }
      return out;
    })();
  const attributes = state.attributes || {};
  const skills = state.skills || {};
  const skillGroups = state.skill_groups || {};
  const special = state.special || {};

  const awakeningChoices =
    constData.awakening_choices ||
    ([
      { id: 'mundane', name: 'Mundane' },
      { id: 'mage', name: 'Mage' },
      { id: 'adept', name: 'Adept' },
    ] as const);

  const attrLetter = priorities['attributes'] || 'E';
  const skillLetter = priorities['skills'] || 'E';
  const magicLetter = priorities['magic'] || 'E';
  const resourcesLetter = priorities['resources'] || 'E';
  const metatypeLetter = priorities['metatype'] || 'E';

  const metatypeSpecies = normalizeMetatypeSpecies(
    state.metatype_species,
    metatypeLetter,
    (constData.metatype_choices ||
      ([
        { id: '/datum/species/human', name: 'Human', min_priority: 'E' },
      ] as const)) as any,
  );

  const metatypeChoices =
    constData.metatype_choices ||
    ([
      { id: '/datum/species/human', name: 'Human', min_priority: 'E' },
    ] as const);

  const metatypeBounds =
    constData.metatype_attribute_bounds?.[metatypeSpecies] || {};

  const effectiveAttributesMeta = attributesMeta.map((a) => {
    const range = metatypeBounds[a.id];
    if (Array.isArray(range) && range.length >= 2) {
      const min = Number(range[0]);
      const max = Number(range[1]);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return {
          ...a,
          min,
          max,
        };
      }
    }
    return a;
  });

  const totalAttrPoints = priorityTables.attributes[attrLetter];
  const totalSkillPoints = priorityTables.skills[skillLetter];
  const totalSkillGroupPoints = priorityTables.skill_groups?.[skillLetter] ?? 0;
  const magicRating = priorityTables.magic?.[magicLetter] ?? 0;
  const resourcesAmount = priorityTables.resources?.[resourcesLetter] ?? 0;
  const totalSpecialPoints =
    priorityTables.metatype_special?.[metatypeLetter] ?? 0;

  const magicDisabledByPriority = magicLetter === 'E' || magicRating <= 0;
  const awakening = normalizeAwakening(
    state.awakening,
    magicDisabledByPriority,
  );
  const isAwakened = awakening !== 'mundane' && !magicDisabledByPriority;

  const attrSpent = sum(
    effectiveAttributesMeta.map((a) => (attributes[a.id] ?? a.min) - a.min),
  );

  const skillSpent = sum(Object.values(skills).map((v) => v ?? 0));
  const skillGroupSpent = sum(Object.values(skillGroups).map((v) => v ?? 0));

  const attrRemaining = totalAttrPoints - attrSpent;
  const skillRemaining = totalSkillPoints - skillSpent;
  const skillGroupRemaining = totalSkillGroupPoints - skillGroupSpent;

  const edgeMeta = specialAttributesMeta.find((s) =>
    s.id.toLowerCase().includes('edge'),
  );
  const edgeId = edgeMeta?.id || '/datum/rpg_stat/edge';
  const edgeBase = constData.edge_base ?? 0;
  const edgeBonus = special[edgeId] ?? 0;

  const magicMeta = specialAttributesMeta.find((s) =>
    s.id.toLowerCase().includes('magic'),
  );
  const magicId = magicMeta?.id || '/datum/rpg_stat/magic';
  const magicBase = isAwakened ? magicRating : 0;
  const magicBonus = isAwakened ? (special[magicId] ?? 0) : 0;

  const specialSpent = Math.max(0, edgeBonus) + Math.max(0, magicBonus);
  const specialRemaining = totalSpecialPoints - specialSpent;

  const normalizeAndSet = (nextPartial: Partial<SRChargenState>) => {
    const merged: SRChargenState = {
      ...state,
      ...nextPartial,
    };

    const nextPriorities = merged.priorities || priorities;

    const nextAttrLetter = nextPriorities['attributes'] || 'E';
    const nextSkillLetter = nextPriorities['skills'] || 'E';
    const nextMagicLetter = nextPriorities['magic'] || 'E';
    const nextResourcesLetter = nextPriorities['resources'] || 'E';
    const nextMetatypeLetter = nextPriorities['metatype'] || 'E';

    const nextMagicRating = priorityTables.magic?.[nextMagicLetter] ?? 0;
    const nextMagicDisabled = nextMagicLetter === 'E' || nextMagicRating <= 0;

    const nextMetatypeSpecies = normalizeMetatypeSpecies(
      merged.metatype_species,
      nextMetatypeLetter,
      metatypeChoices as any,
    );

    const nextMetatypeBounds =
      constData.metatype_attribute_bounds?.[nextMetatypeSpecies] || {};

    const nextEffectiveAttributesMeta = attributesMeta.map((a) => {
      const range = (nextMetatypeBounds as any)[a.id];
      if (Array.isArray(range) && range.length >= 2) {
        const min = Number(range[0]);
        const max = Number(range[1]);
        if (Number.isFinite(min) && Number.isFinite(max)) {
          return { ...a, min, max };
        }
      }
      return a;
    });

    const nextTotalAttrPoints = priorityTables.attributes[nextAttrLetter];
    const nextTotalSkillPoints = priorityTables.skills[nextSkillLetter];
    const nextTotalGroupPoints =
      priorityTables.skill_groups?.[nextSkillLetter] ?? 0;
    const nextTotalSpecialPoints =
      priorityTables.metatype_special?.[nextMetatypeLetter] ?? 0;

    const nextAwakening = normalizeAwakening(
      merged.awakening,
      nextMagicDisabled,
    );
    const nextIsAwakened = nextAwakening !== 'mundane' && !nextMagicDisabled;

    const nextAttributes = normalizeAttributesAllocation(
      merged.attributes || {},
      nextEffectiveAttributesMeta,
      nextTotalAttrPoints,
    );

    const nextSkills = normalizeSkillsAllocation(
      merged.skills || {},
      nextTotalSkillPoints,
    );

    const nextGroups = normalizeSkillGroupsAllocation(
      merged.skill_groups || {},
      nextTotalGroupPoints,
    );

    const nextMagicBase = nextIsAwakened ? nextMagicRating : 0;
    const nextSpecial = normalizeSpecialAllocation({
      current: merged.special || {},
      totalSpecialPoints: nextTotalSpecialPoints,
      edgeId,
      edgeBase,
      edgeMax: edgeMeta?.max ?? edgeBase,
      magicId,
      magicBase: nextMagicBase,
      magicMax: magicMeta?.max ?? nextMagicBase,
      isAwakened: nextIsAwakened,
    });

    props.handleSetValue({
      ...merged,
      priorities: nextPriorities,
      awakening: nextAwakening,
      metatype_species: nextMetatypeSpecies,
      attributes: nextAttributes,
      skills: nextSkills,
      skill_groups: nextGroups,
      special: nextSpecial,
      // Keep resources in sync with priorities in UI by persisting their letter.
      // (Actual resources application happens server-side on spawn.)
      schema_version: merged.schema_version,
    });
  };

  const isAllocationInvalid =
    attrRemaining < 0 ||
    skillRemaining < 0 ||
    skillGroupRemaining < 0 ||
    specialRemaining < 0 ||
    (metatypeLetter === 'E' && metatypeSpecies !== '/datum/species/human') ||
    (magicDisabledByPriority && awakening !== 'mundane');

  useEffect(() => {
    if (isAllocationInvalid) {
      normalizeAndSet({});
    }
  }, [isAllocationInvalid]);

  const onSetPriorities = (category: string, letter: PriorityLetter) => {
    if (locked) {
      return;
    }

    const nextPriorities = swapPriority(priorities, category, letter);

    // Changing priorities can dramatically change allowed pools.
    // Per design request, treat priority changes as a full reset.
    normalizeAndSet({
      priorities: nextPriorities,
      attributes: {},
      skills: {},
      skill_groups: {},
      special: {},
      awakening: 'mundane',
      metatype_species: '/datum/species/human',
      saved: false,
    });
  };

  const onSetMetatypeSpecies = (next: string) => {
    if (locked) {
      return;
    }
    normalizeAndSet({ metatype_species: next });
  };

  const onSetAwakening = (next: string) => {
    if (locked) {
      return;
    }
    normalizeAndSet({
      awakening: next,
      special:
        next === 'mundane'
          ? {
              ...special,
              [magicId]: 0,
            }
          : special,
    });
  };

  const onResetAll = () => {
    normalizeAndSet({
      attributes: {},
      skills: {},
      skill_groups: {},
      special: {},
      awakening: 'mundane',
      metatype_species: '/datum/species/human',
      saved: false,
    });
  };

  const onSaveSheet = () => {
    if (locked) {
      return;
    }
    if (isAllocationInvalid) {
      normalizeAndSet({});
      return;
    }
    normalizeAndSet({ saved: true });
  };

  const onClearAttributes = () => normalizeAndSet({ attributes: {} });
  const onClearSkills = () => normalizeAndSet({ skills: {} });
  const onClearSkillGroups = () => normalizeAndSet({ skill_groups: {} });
  const onClearSpecial = () => normalizeAndSet({ special: {} });
  const onResetMetatype = () =>
    normalizeAndSet({ metatype_species: '/datum/species/human' });
  const onNormalize = () => normalizeAndSet({});

  const onBumpAttribute = (attrId: string, delta: number) => {
    if (locked) {
      return;
    }
    const attrMeta = effectiveAttributesMeta.find((a) => a.id === attrId);
    if (!attrMeta) {
      return;
    }

    const current = attributes[attrId] ?? attrMeta.min;
    const nextValue = clamp(current + delta, attrMeta.min, attrMeta.max);

    const nextAttrs = {
      ...attributes,
      [attrId]: nextValue,
    };

    props.handleSetValue({
      ...state,
      attributes: nextAttrs,
    });
  };

  const onBumpSkill = (skillId: string, delta: number) => {
    if (locked) {
      return;
    }
    const current = skills[skillId] ?? 0;
    const nextValue = clamp(current + delta, 0, 6);

    const nextSkills = { ...skills };
    if (nextValue <= 0) {
      delete nextSkills[skillId];
    } else {
      nextSkills[skillId] = nextValue;
    }

    props.handleSetValue({
      ...state,
      skills: nextSkills,
    });
  };

  const onBumpSkillGroup = (groupId: string, delta: number) => {
    if (locked) {
      return;
    }
    const current = skillGroups[groupId] ?? 0;
    const nextValue = clamp(current + delta, 0, 6);

    const nextGroups = { ...skillGroups };
    if (nextValue <= 0) {
      delete nextGroups[groupId];
    } else {
      nextGroups[groupId] = nextValue;
    }

    props.handleSetValue({
      ...state,
      skill_groups: nextGroups,
    });
  };

  const onBumpSpecial = (specialId: string, delta: number) => {
    if (locked) {
      return;
    }
    const meta = specialAttributesMeta.find((s) => s.id === specialId);
    if (!meta) {
      return;
    }

    const isMagic = specialId === magicId;
    if (isMagic && !isAwakened) {
      return;
    }

    const currentBonus = special[specialId] ?? 0;
    const poolRemainingIfRemoveCurrent =
      totalSpecialPoints - (specialSpent - currentBonus);

    const base = isMagic ? magicBase : edgeBase;
    const maxBonusFromStat = Math.max(0, meta.max - base);
    const maxBonusFromPool = Math.max(0, poolRemainingIfRemoveCurrent);
    const nextBonus = clamp(
      currentBonus + delta,
      0,
      Math.min(maxBonusFromStat, maxBonusFromPool),
    );

    props.handleSetValue({
      ...state,
      special: {
        ...special,
        [specialId]: nextBonus,
      },
    });
  };

  const [filterText, setFilterText] = useLocalState(
    `${props.featureId}_skillFilter`,
    '',
  );

  const normalizedFilter = String(filterText || '')
    .trim()
    .toLowerCase();

  const [showGroupMembers, setShowGroupMembers] = useLocalState(
    `${props.featureId}_showGroupMembers`,
    false,
  );

  const skillNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const sk of skillsMeta) {
      map.set(sk.id, sk.name);
    }
    return map;
  }, [skillsMeta]);

  const groupInfoBySkillId = useMemo(() => {
    const map = new Map<
      string,
      { groups: Array<{ id: string; name: string; rating: number }> }
    >();

    for (const g of skillGroupsMeta) {
      const rating = Number(skillGroups[g.id] ?? 0);
      if (!Number.isFinite(rating) || rating <= 0) {
        continue;
      }
      const skills = Array.isArray(g.skills) ? g.skills : [];
      for (const skillId of skills) {
        const existing = map.get(skillId);
        if (existing) {
          existing.groups.push({ id: g.id, name: g.name, rating });
        } else {
          map.set(skillId, {
            groups: [{ id: g.id, name: g.name, rating }],
          });
        }
      }
    }

    return map;
  }, [skillGroupsMeta, skillGroups]);

  const skillsByStat = useMemo(() => {
    const sorted = sortSkills(skillsMeta);
    const map = new Map<string, typeof sorted>();

    for (const sk of sorted) {
      const name = sk.name?.toLowerCase() || '';
      const parent = sk.parent_stat_name;

      if (normalizedFilter && !name.includes(normalizedFilter)) {
        // Still show if the user has points in it.
        if (!skills[sk.id]) {
          continue;
        }
      }

      if (!map.has(parent)) {
        map.set(parent, []);
      }
      map.get(parent)!.push(sk);
    }

    return map;
  }, [skillsMeta, normalizedFilter, skills]);

  const skillStatTabs = useMemo((): string[] => {
    const unique = new Set<string>();
    for (const sk of skillsMeta) {
      if (sk.parent_stat_name) {
        unique.add(sk.parent_stat_name);
      }
    }

    const sortByAttrName = new Map<string, number>();
    for (const a of effectiveAttributesMeta) {
      sortByAttrName.set(a.name, a.sort);
    }

    const result = Array.from(unique);
    result.sort((a, b) => {
      const sa = sortByAttrName.get(a);
      const sb = sortByAttrName.get(b);
      if (Number.isFinite(sa) && Number.isFinite(sb) && sa !== sb) {
        return (sa as number) - (sb as number);
      }
      if (Number.isFinite(sa) && !Number.isFinite(sb)) {
        return -1;
      }
      if (!Number.isFinite(sa) && Number.isFinite(sb)) {
        return 1;
      }
      return a.localeCompare(b);
    });
    return result;
  }, [skillsMeta, effectiveAttributesMeta]);

  const [activeSkillStat, setActiveSkillStat] = useLocalState(
    `${props.featureId}_skillStatTab`,
    'All',
  );

  useEffect(() => {
    const valid = new Set(['All', ...skillStatTabs]);
    if (!valid.has(activeSkillStat)) {
      setActiveSkillStat('All');
    }
  }, [skillStatTabs]);

  const spentAttributes = useMemo(() => {
    return [...effectiveAttributesMeta]
      .sort((a, b) => a.sort - b.sort)
      .map((a) => {
        const current = attributes[a.id] ?? a.min;
        return {
          id: a.id,
          name: a.name,
          value: current,
          min: a.min,
        };
      })
      .filter((a) => a.value !== a.min);
  }, [effectiveAttributesMeta, attributes]);

  const spentSkillsByStat = useMemo(() => {
    const sorted = sortSkills(skillsMeta);
    const map = new Map<string, typeof sorted>();
    for (const sk of sorted) {
      const rating = skills[sk.id] ?? 0;
      if (!rating) {
        continue;
      }
      const parent = sk.parent_stat_name;
      if (!map.has(parent)) {
        map.set(parent, []);
      }
      map.get(parent)!.push(sk);
    }
    return map;
  }, [skillsMeta, skills]);

  const spentSkillGroups = useMemo(() => {
    if (!skillGroupsMeta.length) {
      return [] as { id: string; name: string; value: number }[];
    }
    return [...skillGroupsMeta]
      .map((g) => ({ id: g.id, name: g.name, value: skillGroups[g.id] ?? 0 }))
      .filter((g) => g.value > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [skillGroupsMeta, skillGroups]);

  const skillNamesByAttributeId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const sk of skillsMeta) {
      if (!map.has(sk.parent_stat_id)) {
        map.set(sk.parent_stat_id, []);
      }
      map.get(sk.parent_stat_id)!.push(sk.name);
    }
    for (const [key, value] of map.entries()) {
      value.sort((a, b) => a.localeCompare(b));
      map.set(key, value);
    }
    return map;
  }, [skillsMeta]);

  const attributeHint = (attributeId: string, attributeName: string) => {
    const related = skillNamesByAttributeId.get(attributeId) || [];
    const preview = related.slice(0, 6);
    const remainder = related.length - preview.length;
    const linkedText = preview.length
      ? `${preview.join(', ')}${remainder > 0 ? `, and ${remainder} more` : ''}`
      : 'none';
    return `${attributeName}. Linked skills: ${linkedText}. Dice pools typically use Attribute + Skill.`;
  };

  const letters = priorityLetters;
  const categories = priorityCategories;

  // Calculate validation status for badges
  const attrStatus =
    attrRemaining < 0 ? 'bad' : attrRemaining === 0 ? 'good' : 'neutral';
  const skillStatus =
    skillRemaining < 0 ? 'bad' : skillRemaining === 0 ? 'good' : 'neutral';
  const specialStatus =
    specialRemaining < 0 ? 'bad' : specialRemaining === 0 ? 'good' : 'neutral';

  return (
    <Stack vertical className="PreferencesMenu__ShadowrunChargen">
      {/* Enhanced Header with Save Status */}
      <Box
        className="PreferencesMenu__ShadowrunChargen__header"
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(15, 15, 15, 0.7))',
          borderLeft: saved
            ? '4px solid rgba(0, 255, 0, 0.8)'
            : '4px solid rgba(202, 165, 61, 0.8)',
          padding: '0.6rem 1rem',
          marginBottom: '0.5rem',
        }}
      >
        <Stack align="center">
          <Stack.Item grow>
            <Box
              style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: saved ? '#6bff6b' : '#caa53d',
              }}
            >
              {saved ? '✓ Sheet Saved' : 'Priority Allocation'}
            </Box>
            <Box style={{ fontSize: '0.8rem', opacity: '0.7' }}>
              {saved
                ? 'Non-appearance edits locked. Reset All to make changes.'
                : 'Configure priorities and spend points, then save.'}
            </Box>
          </Stack.Item>
          <Stack.Item>
            <Stack>
              <Stack.Item>
                <Button
                  color="bad"
                  icon="undo"
                  onClick={onResetAll}
                  tooltip="Reset all selections and unlock editing"
                >
                  Reset All
                </Button>
              </Stack.Item>
              <Stack.Item ml={0.5}>
                {!saved ? (
                  <Button
                    color="good"
                    icon="save"
                    disabled={isAllocationInvalid}
                    onClick={onSaveSheet}
                    tooltip={
                      isAllocationInvalid
                        ? 'Fix allocation errors before saving'
                        : 'Save and lock character sheet'
                    }
                  >
                    Save Sheet
                  </Button>
                ) : (
                  <Button color="good" icon="check" disabled>
                    Saved
                  </Button>
                )}
              </Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
      </Box>

      {/* Quick Tools Row */}
      <Box
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(15, 15, 20, 0.4))',
          padding: '0.35rem 0.6rem',
          marginBottom: '0.5rem',
          border: '1px solid rgba(202, 165, 61, 0.15)',
          borderRadius: '2px',
        }}
      >
        <Stack align="center">
          <Stack.Item grow>
            <Box style={{ fontSize: '0.85rem', color: '#888' }}>Clear:</Box>
          </Stack.Item>
          <Stack.Item>
            <Button
              icon="eraser"
              disabled={locked}
              onClick={onClearAttributes}
              tooltip="Clear all attribute points"
            >
              Attributes
            </Button>
          </Stack.Item>
          <Stack.Item>
            <Button
              icon="eraser"
              disabled={locked}
              onClick={onClearSkills}
              tooltip="Clear all skill points"
            >
              Skills
            </Button>
          </Stack.Item>
          {skillGroupsMeta.length ? (
            <Stack.Item>
              <Button
                icon="eraser"
                disabled={locked}
                onClick={onClearSkillGroups}
                tooltip="Clear all skill group points"
              >
                Groups
              </Button>
            </Stack.Item>
          ) : null}
          <Stack.Item>
            <Button
              icon="eraser"
              disabled={locked}
              onClick={onClearSpecial}
              tooltip="Clear all special points"
            >
              Special
            </Button>
          </Stack.Item>
          {isAllocationInvalid && (
            <Stack.Item>
              <Button
                icon="magic"
                color="caution"
                onClick={onNormalize}
                tooltip="Auto-fix allocation errors"
              >
                Fix Errors
              </Button>
            </Stack.Item>
          )}
        </Stack>
      </Box>

      {/* Skills Section - Now the main content (Attributes/Special moved to sidebar) */}
      <Stack vertical className="PreferencesMenu__ShadowrunChargen__tabContent">
        {/* Skills Points Header */}
        <Box
          style={{
            background: 'rgba(97, 91, 125, 0.12)',
            border: '1px solid rgba(97, 91, 125, 0.25)',
            borderRadius: '2px',
            marginBottom: '0.5rem',
          }}
        >
          <Box
            style={{
              borderBottom: '1px solid rgba(97, 91, 125, 0.25)',
              padding: '0.35rem 0.5rem',
            }}
          >
            <Stack align="center">
              <Stack.Item grow>
                <Box bold style={{ color: '#9b8fc7', fontSize: '0.9rem' }}>
                  <Icon name="book" mr={0.5} />
                  Skills
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Box
                  style={{
                    fontSize: '0.8rem',
                    color:
                      skillRemaining < 0
                        ? '#ff6b6b'
                        : skillRemaining === 0
                          ? '#6bff6b'
                          : '#9b8fc7',
                  }}
                >
                  <b>{skillSpent}</b>/{totalSkillPoints}{' '}
                  <Box as="span" style={{ opacity: '0.6' }}>
                    ({skillRemaining} left)
                  </Box>
                </Box>
              </Stack.Item>
              {skillGroupsMeta.length ? (
                <Stack.Item ml={1}>
                  <Box
                    style={{
                      fontSize: '0.8rem',
                      color:
                        skillGroupRemaining < 0
                          ? '#ff6b6b'
                          : skillGroupRemaining === 0
                            ? '#6bff6b'
                            : '#888',
                    }}
                  >
                    Groups: <b>{skillGroupSpent}</b>/{totalSkillGroupPoints}
                  </Box>
                </Stack.Item>
              ) : null}
            </Stack>
          </Box>
        </Box>

        {/* Skill Groups Section */}
        {skillGroupsMeta.length ? (
          <Box
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <Stack align="center" mb={0.5}>
              <Stack.Item grow>
                <Box bold>
                  <HintedLabel text="Skill Groups" hint={HINTS.skillGroups} />
                </Box>
              </Stack.Item>
              <Stack.Item>
                <Button
                  onClick={() => setShowGroupMembers(!showGroupMembers)}
                  selected={showGroupMembers}
                  icon={showGroupMembers ? 'eye' : 'eye-slash'}
                >
                  {showGroupMembers ? 'Hide' : 'Show'} members
                </Button>
              </Stack.Item>
            </Stack>

            <Stack vertical>
              {[...skillGroupsMeta]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((g) => {
                  const current = skillGroups[g.id] ?? 0;
                  const canDec = current > 0;
                  const canInc = current < 6 && skillGroupRemaining > 0;

                  const memberNames = (g.skills || [])
                    .map((id) => skillNameById.get(id) || id)
                    .sort((a, b) => a.localeCompare(b));

                  return (
                    <Box
                      key={g.id}
                      style={{
                        padding: '0.3rem 0.4rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background:
                          current > 0
                            ? 'rgba(97, 91, 125, 0.15)'
                            : 'transparent',
                      }}
                    >
                      <Stack align="center">
                        <Stack.Item
                          style={{
                            minWidth: '2rem',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color:
                              current > 0 ? '#615b7d' : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {current}
                        </Stack.Item>
                        <Stack.Item grow>
                          <Box bold>
                            <HintedLabel
                              text={g.name}
                              hint={`Skill Group. ${memberNames.length} skills: ${memberNames
                                .slice(0, 8)
                                .join(
                                  ', ',
                                )}${memberNames.length > 8 ? ', and more' : ''}. Increasing the group raises member skills while group-locked.`}
                            />
                          </Box>
                          <Box color="grey" style={{ fontSize: '0.85em' }}>
                            {showGroupMembers
                              ? memberNames.join(', ')
                              : `${memberNames.length} skills`}
                          </Box>
                        </Stack.Item>
                        <Stack.Item>
                          <Button
                            disabled={locked || !canDec}
                            onClick={() => onBumpSkillGroup(g.id, -1)}
                          >
                            −
                          </Button>
                        </Stack.Item>
                        <Stack.Item
                          style={{
                            minWidth: '2.5rem',
                            textAlign: 'center',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '0.2rem',
                          }}
                        >
                          {current}
                        </Stack.Item>
                        <Stack.Item>
                          <Button
                            disabled={locked || !canInc}
                            onClick={() => onBumpSkillGroup(g.id, +1)}
                          >
                            +
                          </Button>
                        </Stack.Item>
                      </Stack>
                    </Box>
                  );
                })}
            </Stack>
          </Box>
        ) : null}

        {/* Filter and Skill Tabs */}
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '0.5rem',
            marginBottom: '0.3rem',
          }}
        >
          <Stack align="center">
            <Stack.Item grow>
              <Input
                placeholder="Filter skills..."
                value={filterText}
                onChange={(_, v) => setFilterText(v)}
              />
            </Stack.Item>
            <Stack.Item ml={0.5}>
              <Button icon="times" onClick={() => setFilterText('')}>
                Clear
              </Button>
            </Stack.Item>
          </Stack>
        </Box>

        <Tabs className="PreferencesMenu__ShadowrunChargen__statTabs">
          <Tabs.Tab
            selected={activeSkillStat === 'All'}
            onClick={() => setActiveSkillStat('All')}
            icon="list"
          >
            <HintedLabel text="All" hint={HINTS.tabAllSkills} />
          </Tabs.Tab>
          {skillStatTabs.map((stat) => (
            <Tabs.Tab
              key={stat}
              selected={activeSkillStat === stat}
              onClick={() => setActiveSkillStat(stat)}
            >
              <HintedLabel
                text={stat}
                hint={`Shows skills that roll with ${stat}.`}
              />
            </Tabs.Tab>
          ))}
        </Tabs>

        {/* Skills List */}
        <Box
          style={{
            maxHeight: '340px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.4rem',
          }}
        >
          {(() => {
            const allSections = Array.from(skillsByStat.entries()) as Array<
              [string, SkillMeta[]]
            >;
            const oneSection: Array<[string, SkillMeta[]]> = [
              [
                activeSkillStat,
                (skillsByStat.get(activeSkillStat) || []) as SkillMeta[],
              ],
            ];

            const visibleSections =
              activeSkillStat === 'All' ? allSections : oneSection;

            return visibleSections.map(([parent, skillEntries]) => {
              if (!skillEntries.length) {
                return (
                  <Box key={parent} color="grey">
                    No skills match your filter.
                  </Box>
                );
              }

              return (
                <Box key={parent} mb={1}>
                  {activeSkillStat === 'All' ? (
                    <Box
                      bold
                      style={{
                        color: '#615b7d',
                        borderBottom: '1px solid rgba(97, 91, 125, 0.3)',
                        paddingBottom: '0.2rem',
                        marginBottom: '0.3rem',
                      }}
                    >
                      {parent}
                    </Box>
                  ) : null}

                  <Stack vertical>
                    {skillEntries.map((sk) => {
                      const current = skills[sk.id] ?? 0;

                      const groupInfo = groupInfoBySkillId.get(sk.id);
                      const groupRating = groupInfo?.groups?.length
                        ? Math.max(...groupInfo.groups.map((g) => g.rating))
                        : 0;
                      const lockedByGroup = groupRating > 0;

                      const canDec = current > 0 && !lockedByGroup;
                      const canInc =
                        current < 6 && skillRemaining > 0 && !lockedByGroup;

                      const statMeta = effectiveAttributesMeta.find(
                        (a) => a.id === sk.parent_stat_id,
                      );
                      const statRating =
                        attributes[sk.parent_stat_id] ?? statMeta?.min ?? 1;

                      const effectiveSkillRating = Math.max(
                        current,
                        groupRating,
                      );
                      const pool = statRating + effectiveSkillRating;

                      const groupLabel = groupInfo?.groups
                        ?.slice()
                        .sort((a, b) => b.rating - a.rating)
                        .map((g) => `${g.name} ${g.rating}`)
                        .join(', ');

                      const lockTooltip = lockedByGroup
                        ? `Locked by skill group: ${groupLabel}. ${HINTS.skillGroupLock}`
                        : undefined;

                      const hasPoints = current > 0 || effectiveSkillRating > 0;

                      return (
                        <Box
                          key={sk.id}
                          style={{
                            padding: '0.3rem 0.4rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            background: lockedByGroup
                              ? 'rgba(97, 91, 125, 0.15)'
                              : hasPoints
                                ? 'rgba(97, 91, 125, 0.1)'
                                : 'transparent',
                          }}
                        >
                          <Stack align="center">
                            <Stack.Item
                              style={{
                                minWidth: '2rem',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '1.1em',
                                color: hasPoints
                                  ? '#615b7d'
                                  : 'rgba(255,255,255,0.5)',
                              }}
                            >
                              {pool}
                            </Stack.Item>
                            <Stack.Item grow>
                              <Box bold>
                                <HintedLabel
                                  text={sk.name}
                                  hint={`${sk.name}. Uses ${sk.parent_stat_name}. Current pool: ${pool}. Dice pools typically use Attribute + Skill.`}
                                />
                              </Box>
                              <Box color="grey" style={{ fontSize: '0.85em' }}>
                                {statRating} + {effectiveSkillRating}
                                {groupLabel ? (
                                  <Box as="span" ml={0.5}>
                                    (Group: <b>{groupLabel}</b>)
                                  </Box>
                                ) : null}
                              </Box>
                            </Stack.Item>
                            <Stack.Item>
                              <Button
                                disabled={locked || !canDec}
                                tooltip={lockTooltip || 'Decrease skill'}
                                tooltipPosition="left"
                                onClick={() => {
                                  if (lockedByGroup) {
                                    return;
                                  }
                                  onBumpSkill(sk.id, -1);
                                }}
                              >
                                −
                              </Button>
                            </Stack.Item>
                            <Stack.Item
                              style={{
                                minWidth: '2.5rem',
                                textAlign: 'center',
                                background: 'rgba(0, 0, 0, 0.3)',
                                padding: '0.2rem',
                              }}
                            >
                              <Tooltip
                                content={
                                  groupLabel
                                    ? `Skill: ${current}, Group: ${groupRating}, Effective: ${effectiveSkillRating}`
                                    : `Skill: ${current}`
                                }
                                position="left"
                              >
                                <Box>{effectiveSkillRating}</Box>
                              </Tooltip>
                            </Stack.Item>
                            <Stack.Item>
                              <Button
                                disabled={locked || !canInc}
                                tooltip={lockTooltip || 'Increase skill'}
                                tooltipPosition="left"
                                onClick={() => {
                                  if (lockedByGroup) {
                                    return;
                                  }
                                  onBumpSkill(sk.id, +1);
                                }}
                              >
                                +
                              </Button>
                            </Stack.Item>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              );
            });
          })()}
        </Box>
      </Stack>
    </Stack>
  );
};

export const shadowrun_chargen: Feature<
  unknown,
  SRChargenState,
  SRChargenConstantData
> = {
  name: 'Shadowrun Character Creation',
  description:
    'SR5 Priority (A–E) selection plus point-buy allocation for attributes and skills.',
  component: ShadowrunChargenInput,
};
