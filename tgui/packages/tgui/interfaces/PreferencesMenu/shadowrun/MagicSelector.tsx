/**
 * Magic Selector Component (Traditions, Spells, Adept Powers, Complex Forms)
 *
 * Visual overhaul with:
 * - Mystical gradient background with purple accent
 * - Awakening status display with type icon
 * - Styled tradition and mentor spirit cards
 * - Spell/Power cards with category colors and drain indicators
 * - Power Points bar for adepts
 * - Matrix aesthetic for technomancers
 */

import { memo, useMemo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Dropdown, Icon, Stack, Tabs } from '../../../components';
import {
  AWAKENING,
  isAdeptUser,
  isAwakened as checkAwakened,
  isMagicUser,
  isTechnomancer as checkTechnomancer,
} from './constants';
import { calculateBumpedValue } from './hooks';
import {
  AdeptPowerMeta,
  ChargenConstData,
  ChargenState,
  ComplexFormMeta,
  MentorSpiritMeta,
  SpellMeta,
  TraditionMeta,
} from './types';

// ============================================================================
// ACCENT COLORS
// ============================================================================

const MAGIC_ACCENT = '#9b59b6'; // Purple - main magic accent
const MAGIC_ACCENT_DIM = 'rgba(155, 89, 182, 0.3)';
const MATRIX_ACCENT = '#00ff88'; // Green for technomancer
const MATRIX_ACCENT_DIM = 'rgba(0, 255, 136, 0.3)';
const ADEPT_ACCENT = '#ff6b6b'; // Red for adept powers
const MENTOR_ACCENT = '#ffd700'; // Gold for mentor spirits

// Spell category colors
const SPELL_CATEGORY_COLORS: Record<string, { color: string; icon: string }> = {
  combat: { color: '#ff6b6b', icon: 'fire' },
  detection: { color: '#4fc3f7', icon: 'eye' },
  health: { color: '#4caf50', icon: 'heart' },
  illusion: { color: '#e91e63', icon: 'mask' },
  manipulation: { color: '#ff9800', icon: 'hand-sparkles' },
  other: { color: '#9e9e9e', icon: 'magic' },
};

// Get awakening type display info
const getAwakeningInfo = (
  awakening: string,
): { color: string; icon: string; label: string } => {
  switch (awakening) {
    case AWAKENING.MAGE:
      return { label: 'Mage', icon: 'hat-wizard', color: MAGIC_ACCENT };
    case AWAKENING.MYSTIC_ADEPT:
      return { label: 'Mystic Adept', icon: 'yin-yang', color: '#e91e63' };
    case AWAKENING.ADEPT:
      return { label: 'Adept', icon: 'fist-raised', color: ADEPT_ACCENT };
    case AWAKENING.TECHNOMANCER:
      return { label: 'Technomancer', icon: 'wifi', color: MATRIX_ACCENT };
    default:
      return { label: 'Mundane', icon: 'user', color: '#9e9e9e' };
  }
};

type MagicSelectorProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  embedded?: boolean;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: unknown) => void;
  value: unknown;
};

export const MagicSelector = memo((props: MagicSelectorProps) => {
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

  if (!chargenState || !chargenConstData) {
    return null;
  }

  const awakening = chargenState.awakening || AWAKENING.MUNDANE;
  const isAwakened = checkAwakened(awakening);
  const isTechnomancer = checkTechnomancer(awakening);
  const isMage = isMagicUser(awakening);
  const isAdept = isAdeptUser(awakening);
  const awakeningInfo = getAwakeningInfo(awakening);

  // Theme colors based on awakening type
  const THEME_ACCENT = isTechnomancer ? MATRIX_ACCENT : MAGIC_ACCENT;
  const THEME_ACCENT_DIM = isTechnomancer
    ? MATRIX_ACCENT_DIM
    : MAGIC_ACCENT_DIM;

  // Don't render anything for mundanes
  if (!isAwakened) {
    if (embedded) {
      return (
        <Box
          style={{
            background:
              'linear-gradient(135deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.95))',
            border: '1px solid rgba(155, 89, 182, 0.2)',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <Icon name="magic" size={3} color="rgba(155, 89, 182, 0.3)" />
          <Box
            style={{
              fontSize: '1.1rem',
              marginTop: '0.5rem',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Mundane Character
          </Box>
          <Box
            style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '0.5rem',
            }}
          >
            Magic options are only available for awakened characters.
            <br />
            Set Magic priority to D or higher in the Build tab to unlock.
          </Box>
        </Box>
      );
    }
    return null;
  }

  // Get traditions list
  const traditions = chargenConstData.traditions || [];
  const selectedTradition = chargenState.tradition || '';
  const currentTradition = traditions.find(
    (t: TraditionMeta) => t.id === selectedTradition,
  );

  // Get mentor spirits list
  const mentorSpirits = chargenConstData.mentor_spirits || [];
  const selectedMentorSpirit = chargenState.mentor_spirit || '';
  const currentMentorSpirit = mentorSpirits.find(
    (m: MentorSpiritMeta) => m.id === selectedMentorSpirit,
  );

  // Get spells list (for mages)
  const spells = chargenConstData.spells || [];
  const selectedSpells = chargenState.selected_spells || [];
  const magicPriority = chargenState.priorities?.magic;
  const magicRating =
    chargenState.special?.['/datum/rpg_stat/magic'] ||
    (magicPriority &&
      chargenConstData.priority_tables?.magic?.[magicPriority]) ||
    0;
  const maxSpells = magicRating * 2;
  const spellPercent =
    maxSpells > 0 ? (selectedSpells.length / maxSpells) * 100 : 0;

  // Get adept powers (for adepts)
  const adeptPowers = chargenConstData.adept_powers || [];
  const selectedPowers = chargenState.selected_powers || {};
  const maxPP = magicRating; // Power Points = Magic Rating
  const spentPP = Object.entries(selectedPowers).reduce(
    (sum, [powerId, level]) => {
      const power = adeptPowers.find((p: AdeptPowerMeta) => p.id === powerId);
      if (!power) return sum;
      const lvl = Number(level) || 1;
      return sum + power.pp_cost * lvl;
    },
    0,
  );
  const ppPercent = maxPP > 0 ? (spentPP / maxPP) * 100 : 0;
  const ppRemaining = maxPP - spentPP;

  // Get complex forms (for technomancers)
  const complexForms = chargenConstData.complex_forms || [];
  const selectedForms = chargenState.selected_complex_forms || [];
  const resonance =
    chargenState.special?.['/datum/rpg_stat/resonance'] || magicRating;
  const maxForms = resonance * 2;
  const formPercent =
    maxForms > 0 ? (selectedForms.length / maxForms) * 100 : 0;

  const handleSetTradition = (newTradition: string) => {
    if (isSaved) return;

    const newState = {
      ...value!,
      tradition: newTradition,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleSetMentorSpirit = (newMentor: string) => {
    if (isSaved) return;

    const newState = {
      ...value!,
      mentor_spirit: newMentor,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleToggleSpell = (spellId: string) => {
    if (isSaved) return;

    const currentSpells = [...selectedSpells];
    const idx = currentSpells.indexOf(spellId);
    if (idx >= 0) {
      currentSpells.splice(idx, 1);
    } else if (currentSpells.length < maxSpells) {
      currentSpells.push(spellId);
    }

    const newState = {
      ...value!,
      selected_spells: currentSpells,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleToggleForm = (formId: string) => {
    if (isSaved) return;

    const currentForms = [...selectedForms];
    const idx = currentForms.indexOf(formId);
    if (idx >= 0) {
      currentForms.splice(idx, 1);
    } else if (currentForms.length < maxForms) {
      currentForms.push(formId);
    }

    const newState = {
      ...value!,
      selected_complex_forms: currentForms,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  // Build power metadata map for quick lookup
  const powerMetaMap = useMemo(
    () =>
      new Map(
        adeptPowers.map((p: AdeptPowerMeta) => [
          p.id,
          { maxLevel: p.max_level || 1, ppCost: p.pp_cost },
        ]),
      ),
    [adeptPowers],
  );

  const handleBumpPower = (powerId: string, delta: number) => {
    if (isSaved) return;

    const powerMeta = powerMetaMap.get(powerId);
    if (!powerMeta) return;

    // Check PP cost before bumping
    const currentLevel = Number(selectedPowers[powerId]) || 0;
    const costDelta = delta * powerMeta.ppCost;
    if (delta > 0 && spentPP + costDelta > maxPP) return;

    const result = calculateBumpedValue(powerId, delta, {
      currentValues: selectedPowers,
      getMax: () => powerMeta.maxLevel,
    });

    if (!result.success) return;

    const newState = { ...value!, selected_powers: result.newValues };
    setPredictedValue(newState);
    act('set_preference', { preference: featureId, value: newState });
  };

  // Group spells by category
  const spellsByCategory = useMemo(
    () =>
      spells.reduce((acc: Record<string, SpellMeta[]>, spell: SpellMeta) => {
        const cat = spell.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(spell);
        return acc;
      }, {}),
    [spells],
  );

  // Group complex forms by category
  const formsByCategory = useMemo(
    () =>
      complexForms.reduce(
        (acc: Record<string, ComplexFormMeta[]>, form: ComplexFormMeta) => {
          const cat = form.target || 'other';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(form);
          return acc;
        },
        {},
      ),
    [complexForms],
  );

  // Group adept powers by category
  const powersByCategory = useMemo(
    () =>
      adeptPowers.reduce(
        (acc: Record<string, AdeptPowerMeta[]>, power: AdeptPowerMeta) => {
          const cat = 'powers';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(power);
          return acc;
        },
        {},
      ),
    [adeptPowers],
  );

  const [spellCategory, setSpellCategory] = useLocalState(
    'sr_magic_spell_cat',
    'combat',
  );
  const [formCategory, setFormCategory] = useLocalState(
    'sr_magic_form_cat',
    'attack',
  );
  const [powerCategory, setPowerCategory] = useLocalState(
    'sr_magic_power_cat',
    'physical',
  );

  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${THEME_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
        border: `1px solid ${THEME_ACCENT_DIM}`,
        borderRadius: '8px',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative corner accent */}
      <Box
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '80px',
          height: '80px',
          background: `linear-gradient(135deg, transparent 50%, ${THEME_ACCENT_DIM} 50%)`,
          opacity: '0.5',
        }}
      />

      {/* Header with Awakening Type */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: `2px solid ${THEME_ACCENT}`,
        }}
      >
        <Icon
          name={awakeningInfo.icon}
          size={1.3}
          color={awakeningInfo.color}
        />
        <Box style={{ marginLeft: '0.5rem' }}>
          <Box style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            {isTechnomancer ? 'Resonance' : 'Magic'}
          </Box>
          <Box style={{ fontSize: '0.75rem', color: awakeningInfo.color }}>
            {awakeningInfo.label}
          </Box>
        </Box>

        {/* Magic/Resonance Rating Badge */}
        <Box
          style={{
            marginLeft: 'auto',
            padding: '0.35rem 0.75rem',
            background: `rgba(0, 0, 0, 0.4)`,
            border: `1px solid ${THEME_ACCENT}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Icon
            name={isTechnomancer ? 'wifi' : 'star'}
            color={THEME_ACCENT}
            size={0.9}
          />
          <Box
            style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: THEME_ACCENT,
            }}
          >
            {isTechnomancer ? resonance : magicRating}
          </Box>
        </Box>
      </Box>

      {/* Tradition Selector (for magical awakened) */}
      {!isTechnomancer && (
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(155, 89, 182, 0.2)',
            borderLeft: `3px solid ${MAGIC_ACCENT}`,
            borderRadius: '4px',
            padding: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <Icon name="book" color={MAGIC_ACCENT} />
            <Box style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              Tradition
            </Box>
          </Box>

          {isSaved ? (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: MAGIC_ACCENT,
              }}
            >
              <Icon name="lock" size={0.8} />
              {currentTradition?.name || 'None'}
            </Box>
          ) : (
            <Dropdown
              width="100%"
              selected={selectedTradition}
              displayText={currentTradition?.name || 'Select Tradition...'}
              options={traditions.map((t: TraditionMeta) => ({
                value: t.id,
                displayText: t.name,
              }))}
              onSelected={handleSetTradition}
            />
          )}

          {currentTradition && (
            <Box
              style={{
                marginTop: '0.5rem',
                padding: '0.35rem 0.5rem',
                background: 'rgba(155, 89, 182, 0.1)',
                borderRadius: '3px',
                fontSize: '0.75rem',
              }}
            >
              <Icon name="bolt" color="#ffd700" mr={0.5} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Drain Attribute:{' '}
              </span>
              <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
                {currentTradition.drain_attribute}
              </span>
            </Box>
          )}
        </Box>
      )}

      {/* Mentor Spirit Selector (for awakened characters) */}
      {!isTechnomancer && (
        <Box
          style={{
            background: currentMentorSpirit
              ? 'rgba(255, 215, 0, 0.08)'
              : 'rgba(0, 0, 0, 0.2)',
            border: `1px solid ${currentMentorSpirit ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderLeft: `3px solid ${MENTOR_ACCENT}`,
            borderRadius: '4px',
            padding: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <Icon name="ghost" color={MENTOR_ACCENT} />
            <Box style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              Mentor Spirit
            </Box>
            <Box
              style={{
                marginLeft: 'auto',
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              Optional
            </Box>
          </Box>

          {isSaved ? (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: currentMentorSpirit
                  ? MENTOR_ACCENT
                  : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <Icon name="lock" size={0.8} />
              {currentMentorSpirit?.name || 'None'}
            </Box>
          ) : (
            <Dropdown
              width="100%"
              selected={selectedMentorSpirit}
              displayText={currentMentorSpirit?.name || 'None (No mentor)'}
              options={[
                { value: '', displayText: 'None (No mentor)' },
                ...mentorSpirits.map((m: MentorSpiritMeta) => ({
                  value: m.id,
                  displayText: m.name,
                })),
              ]}
              onSelected={handleSetMentorSpirit}
            />
          )}

          {currentMentorSpirit && (
            <Box style={{ marginTop: '0.5rem' }}>
              <Box
                style={{
                  padding: '0.35rem 0.5rem',
                  background: 'rgba(76, 175, 80, 0.15)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  marginBottom: '0.35rem',
                }}
              >
                <Icon name="plus-circle" color="#4caf50" mr={0.5} />
                <span style={{ color: '#4caf50' }}>
                  {currentMentorSpirit.advantages}
                </span>
              </Box>
              <Box
                style={{
                  padding: '0.35rem 0.5rem',
                  background: 'rgba(255, 152, 0, 0.15)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                }}
              >
                <Icon name="exclamation-triangle" color="#ff9800" mr={0.5} />
                <span style={{ color: '#ff9800' }}>
                  {currentMentorSpirit.disadvantages}
                </span>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Spells Section (for mages/mystic adepts) */}
      {isMage && (
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(155, 89, 182, 0.2)',
            borderRadius: '4px',
            padding: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          {/* Spells Header */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              paddingBottom: '0.35rem',
              borderBottom: `1px solid ${MAGIC_ACCENT}`,
            }}
          >
            <Icon name="book-open" color={MAGIC_ACCENT} />
            <Box style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Spells</Box>
            <Box
              style={{
                marginLeft: 'auto',
                padding: '0.15rem 0.5rem',
                background:
                  selectedSpells.length >= maxSpells
                    ? 'rgba(76, 175, 80, 0.2)'
                    : 'rgba(255, 193, 7, 0.2)',
                border: `1px solid ${selectedSpells.length >= maxSpells ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`,
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color:
                  selectedSpells.length >= maxSpells ? '#4caf50' : '#ffc107',
              }}
            >
              {selectedSpells.length}/{maxSpells}
            </Box>
          </Box>

          {/* Spell Progress Bar */}
          <Box
            style={{
              height: '4px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '0.5rem',
            }}
          >
            <Box
              style={{
                height: '100%',
                width: `${Math.min(spellPercent, 100)}%`,
                background: `linear-gradient(90deg, ${MAGIC_ACCENT}, #e91e63)`,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>

          {/* Category Tabs */}
          <Tabs fluid>
            {Object.keys(spellsByCategory).map((cat) => {
              const catInfo =
                SPELL_CATEGORY_COLORS[cat] || SPELL_CATEGORY_COLORS.other;
              return (
                <Tabs.Tab
                  key={cat}
                  selected={spellCategory === cat}
                  onClick={() => setSpellCategory(cat)}
                  style={
                    spellCategory === cat
                      ? { boxShadow: `0 0 8px ${catInfo.color}` }
                      : {}
                  }
                >
                  <Icon
                    name={catInfo.icon}
                    mr={0.5}
                    color={spellCategory === cat ? catInfo.color : undefined}
                  />
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Tabs.Tab>
              );
            })}
          </Tabs>

          {/* Spell List */}
          <Box
            style={{
              maxHeight: '14rem',
              overflowY: 'auto',
              marginTop: '0.5rem',
            }}
          >
            {(spellsByCategory[spellCategory] || []).map((spell: SpellMeta) => {
              const isSelected = selectedSpells.includes(spell.id);
              const catInfo =
                SPELL_CATEGORY_COLORS[spell.category || 'other'] ||
                SPELL_CATEGORY_COLORS.other;
              const canSelect =
                !isSaved && (isSelected || selectedSpells.length < maxSpells);

              return (
                <Box
                  key={spell.id}
                  onClick={() => canSelect && handleToggleSpell(spell.id)}
                  style={{
                    background: isSelected
                      ? `rgba(${catInfo.color === '#ff6b6b' ? '255,107,107' : '155,89,182'}, 0.15)`
                      : 'rgba(0, 0, 0, 0.2)',
                    border: `1px solid ${isSelected ? catInfo.color : 'rgba(255, 255, 255, 0.1)'}`,
                    borderLeft: `3px solid ${catInfo.color}`,
                    borderRadius: '4px',
                    padding: '0.5rem 0.75rem',
                    marginBottom: '0.35rem',
                    cursor: canSelect ? 'pointer' : 'not-allowed',
                    opacity: isSaved ? '0.6' : '1',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Stack align="center">
                    <Stack.Item grow>
                      <Tooltip
                        content={spell.description || spell.name}
                        position="right"
                      >
                        <Box
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            cursor: 'help',
                          }}
                        >
                          {spell.name}
                        </Box>
                      </Tooltip>
                    </Stack.Item>
                    <Stack.Item>
                      <Box
                        style={{
                          fontSize: '0.7rem',
                          color: '#ffd700',
                          background: 'rgba(255, 215, 0, 0.1)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '3px',
                        }}
                      >
                        <Icon name="bolt" size={0.7} mr={0.25} />
                        {spell.drain}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      {isSelected ? (
                        <Icon name="check-circle" color="#4caf50" size={1} />
                      ) : (
                        <Icon
                          name="circle"
                          color="rgba(255, 255, 255, 0.2)"
                          size={1}
                        />
                      )}
                    </Stack.Item>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Adept Powers Section (for adepts/mystic adepts) */}
      {isAdept && (
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 107, 107, 0.2)',
            borderRadius: '4px',
            padding: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          {/* Powers Header */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              paddingBottom: '0.35rem',
              borderBottom: `1px solid ${ADEPT_ACCENT}`,
            }}
          >
            <Icon name="fist-raised" color={ADEPT_ACCENT} />
            <Box style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              Adept Powers
            </Box>
            <Box
              style={{
                marginLeft: 'auto',
                padding: '0.15rem 0.5rem',
                background:
                  ppRemaining <= 0
                    ? 'rgba(76, 175, 80, 0.2)'
                    : 'rgba(255, 193, 7, 0.2)',
                border: `1px solid ${ppRemaining <= 0 ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`,
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: ppRemaining <= 0 ? '#4caf50' : '#ffc107',
              }}
            >
              {spentPP.toFixed(1)}/{maxPP} PP
            </Box>
          </Box>

          {/* PP Progress Bar */}
          <Box
            style={{
              height: '6px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '0.5rem',
            }}
          >
            <Box
              style={{
                height: '100%',
                width: `${Math.min(ppPercent, 100)}%`,
                background: `linear-gradient(90deg, ${ADEPT_ACCENT}, #ff9800)`,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>

          {/* Powers List */}
          <Box
            style={{
              maxHeight: '14rem',
              overflowY: 'auto',
            }}
          >
            {(powersByCategory['powers'] || []).map((power: AdeptPowerMeta) => {
              const currentLevel = Number(selectedPowers[power.id]) || 0;
              const isActive = currentLevel > 0;
              const canIncrease =
                !isSaved &&
                spentPP + power.pp_cost <= maxPP &&
                currentLevel < power.max_level;
              const canDecrease = !isSaved && currentLevel > 0;

              return (
                <Box
                  key={power.id}
                  style={{
                    background: isActive
                      ? 'rgba(255, 107, 107, 0.1)'
                      : 'rgba(0, 0, 0, 0.2)',
                    border: `1px solid ${isActive ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderLeft: `3px solid ${ADEPT_ACCENT}`,
                    borderRadius: '4px',
                    padding: '0.5rem 0.75rem',
                    marginBottom: '0.35rem',
                    opacity: isSaved ? '0.6' : '1',
                  }}
                >
                  <Stack align="center">
                    <Stack.Item grow>
                      <Tooltip
                        content={power.description || power.name}
                        position="right"
                      >
                        <Box
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 'bold' : 'normal',
                            cursor: 'help',
                          }}
                        >
                          {power.name}
                          {power.max_level > 1 && currentLevel > 0 && (
                            <Box
                              as="span"
                              style={{
                                marginLeft: '0.5rem',
                                color: ADEPT_ACCENT,
                                fontSize: '0.75rem',
                              }}
                            >
                              [Lvl {currentLevel}]
                            </Box>
                          )}
                        </Box>
                      </Tooltip>
                    </Stack.Item>
                    <Stack.Item>
                      <Box
                        style={{
                          fontSize: '0.7rem',
                          color: ADEPT_ACCENT,
                          background: 'rgba(255, 107, 107, 0.1)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                        }}
                      >
                        {power.pp_cost} PP
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Stack align="center">
                        <Stack.Item>
                          <Button
                            icon="minus"
                            disabled={!canDecrease}
                            onClick={() => handleBumpPower(power.id, -1)}
                            style={{
                              minWidth: '1.4rem',
                              height: '1.4rem',
                              padding: '0',
                              fontSize: '0.7rem',
                              background: canDecrease
                                ? 'rgba(255, 107, 107, 0.2)'
                                : 'transparent',
                              border: `1px solid ${canDecrease ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}
                          />
                        </Stack.Item>
                        <Stack.Item>
                          <Box
                            style={{
                              minWidth: '1.5rem',
                              textAlign: 'center',
                              fontSize: '0.95rem',
                              fontWeight: 'bold',
                              color: isActive
                                ? ADEPT_ACCENT
                                : 'rgba(255, 255, 255, 0.3)',
                            }}
                          >
                            {currentLevel}
                          </Box>
                        </Stack.Item>
                        <Stack.Item>
                          <Button
                            icon="plus"
                            disabled={!canIncrease}
                            onClick={() => handleBumpPower(power.id, 1)}
                            style={{
                              minWidth: '1.4rem',
                              height: '1.4rem',
                              padding: '0',
                              fontSize: '0.7rem',
                              background: canIncrease
                                ? 'rgba(76, 175, 80, 0.2)'
                                : 'transparent',
                              border: `1px solid ${canIncrease ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}
                          />
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Complex Forms Section (for technomancers) */}
      {isTechnomancer && (
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            borderRadius: '4px',
            padding: '0.75rem',
          }}
        >
          {/* Forms Header */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              paddingBottom: '0.35rem',
              borderBottom: `1px solid ${MATRIX_ACCENT}`,
            }}
          >
            <Icon name="code" color={MATRIX_ACCENT} />
            <Box style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              Complex Forms
            </Box>
            <Box
              style={{
                marginLeft: 'auto',
                padding: '0.15rem 0.5rem',
                background:
                  selectedForms.length >= maxForms
                    ? 'rgba(76, 175, 80, 0.2)'
                    : 'rgba(255, 193, 7, 0.2)',
                border: `1px solid ${selectedForms.length >= maxForms ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`,
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: selectedForms.length >= maxForms ? '#4caf50' : '#ffc107',
              }}
            >
              {selectedForms.length}/{maxForms}
            </Box>
          </Box>

          {/* Forms Progress Bar */}
          <Box
            style={{
              height: '4px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '0.5rem',
            }}
          >
            <Box
              style={{
                height: '100%',
                width: `${Math.min(formPercent, 100)}%`,
                background: `linear-gradient(90deg, ${MATRIX_ACCENT}, #00bcd4)`,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>

          {/* Category Tabs */}
          <Tabs fluid>
            {Object.keys(formsByCategory).map((cat) => (
              <Tabs.Tab
                key={cat}
                selected={formCategory === cat}
                onClick={() => setFormCategory(cat)}
                style={
                  formCategory === cat
                    ? { boxShadow: `0 0 8px ${MATRIX_ACCENT}` }
                    : {}
                }
              >
                <Icon
                  name="terminal"
                  mr={0.5}
                  color={formCategory === cat ? MATRIX_ACCENT : undefined}
                />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Tabs.Tab>
            ))}
          </Tabs>

          {/* Forms List */}
          <Box
            style={{
              maxHeight: '14rem',
              overflowY: 'auto',
              marginTop: '0.5rem',
            }}
          >
            {(formsByCategory[formCategory] || []).map(
              (form: ComplexFormMeta) => {
                const isSelected = selectedForms.includes(form.id);
                const canSelect =
                  !isSaved && (isSelected || selectedForms.length < maxForms);

                return (
                  <Box
                    key={form.id}
                    onClick={() => canSelect && handleToggleForm(form.id)}
                    style={{
                      background: isSelected
                        ? 'rgba(0, 255, 136, 0.1)'
                        : 'rgba(0, 0, 0, 0.2)',
                      border: `1px solid ${isSelected ? MATRIX_ACCENT : 'rgba(255, 255, 255, 0.1)'}`,
                      borderLeft: `3px solid ${MATRIX_ACCENT}`,
                      borderRadius: '4px',
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.35rem',
                      cursor: canSelect ? 'pointer' : 'not-allowed',
                      opacity: isSaved ? '0.6' : '1',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Stack align="center">
                      <Stack.Item grow>
                        <Tooltip
                          content={form.description || form.name}
                          position="right"
                        >
                          <Box
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              cursor: 'help',
                              fontFamily: 'monospace',
                            }}
                          >
                            {form.name}
                          </Box>
                        </Tooltip>
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            fontSize: '0.7rem',
                            color: '#00bcd4',
                            background: 'rgba(0, 188, 212, 0.1)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                          }}
                        >
                          <Icon name="wave-square" size={0.7} mr={0.25} />
                          {form.fading}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        {isSelected ? (
                          <Icon
                            name="check-circle"
                            color={MATRIX_ACCENT}
                            size={1}
                          />
                        ) : (
                          <Icon
                            name="circle"
                            color="rgba(255, 255, 255, 0.2)"
                            size={1}
                          />
                        )}
                      </Stack.Item>
                    </Stack>
                  </Box>
                );
              },
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
});
