/**
 * Magic Selector Component (Traditions, Spells, Adept Powers, Complex Forms)
 *
 * Handles magic-related selections for awakened characters.
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Dropdown, Icon, Stack, Tabs } from '../../../components';
import { CollapsibleSection } from './components';
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

  // Don't render anything for mundanes
  if (!isAwakened) {
    if (embedded) {
      return (
        <Box
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <Icon name="magic" size={3} mb={1} />
          <Box style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            Mundane Character
          </Box>
          <Box style={{ fontSize: '0.85rem' }}>
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
  const magicRating =
    chargenState.special?.['/datum/rpg_stat/magic'] ||
    chargenConstData.priority_tables?.magic?.[
      chargenState.priorities?.['magic']
    ] ||
    0;
  const maxSpells = magicRating * 2;

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

  // Get complex forms (for technomancers)
  const complexForms = chargenConstData.complex_forms || [];
  const selectedForms = chargenState.selected_complex_forms || [];
  const resonance =
    chargenState.special?.['/datum/rpg_stat/resonance'] || magicRating;
  const maxForms = resonance * 2;

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
  const powerMetaMap = new Map(
    adeptPowers.map((p: AdeptPowerMeta) => [
      p.id,
      { maxLevel: p.max_level || 1, ppCost: p.pp_cost },
    ]),
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
  const spellsByCategory = spells.reduce(
    (acc: Record<string, SpellMeta[]>, spell: SpellMeta) => {
      const cat = spell.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(spell);
      return acc;
    },
    {},
  );

  // Group complex forms by category
  const formsByCategory = complexForms.reduce(
    (acc: Record<string, ComplexFormMeta[]>, form: ComplexFormMeta) => {
      const cat = form.target || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(form);
      return acc;
    },
    {},
  );

  // Group adept powers by category
  const powersByCategory = adeptPowers.reduce(
    (acc: Record<string, AdeptPowerMeta[]>, power: AdeptPowerMeta) => {
      const cat = 'powers';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(power);
      return acc;
    },
    {},
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
    <Box className="PreferencesMenu__ShadowrunSheet__magicSelector">
      {!embedded && (
        <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header">
          <Icon
            name={isTechnomancer ? 'wifi' : 'magic'}
            className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__icon"
          />
          <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__title">
            {isTechnomancer ? 'Resonance' : 'Magic'}
          </Box>
        </Box>
      )}

      {/* Tradition Selector (for magical awakened) */}
      {!isTechnomancer && (
        <Box mt={0.5}>
          <Stack align="center" justify="space-between">
            <Stack.Item>
              <Tooltip
                content="Your magical tradition determines how you perceive and interact with the astral plane, and what attribute you use to resist drain."
                position="right"
              >
                <Box
                  style={{
                    fontSize: '0.75rem',
                    cursor: 'help',
                    borderBottom: '1px dotted rgba(255,255,255,0.2)',
                  }}
                >
                  Tradition
                </Box>
              </Tooltip>
            </Stack.Item>
            <Stack.Item width="10em">
              {isSaved ? (
                <Box
                  style={{
                    fontSize: '0.75rem',
                    color: '#ba55d3',
                    textAlign: 'right',
                  }}
                >
                  <Icon name="lock" mr={0.5} />
                  {currentTradition?.name || 'None'}
                </Box>
              ) : (
                <Dropdown
                  width="100%"
                  selected={selectedTradition}
                  displayText={currentTradition?.name || 'Select...'}
                  options={traditions.map((t: TraditionMeta) => ({
                    value: t.id,
                    displayText: t.name,
                  }))}
                  onSelected={handleSetTradition}
                />
              )}
            </Stack.Item>
          </Stack>
          {currentTradition && (
            <Box
              mt={0.3}
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Drain: {currentTradition.drain_attribute}
            </Box>
          )}
        </Box>
      )}

      {/* Mentor Spirit Selector (for awakened characters) */}
      {!isTechnomancer && (
        <Box mt={0.5}>
          <Stack align="center" justify="space-between">
            <Stack.Item>
              <Tooltip
                content="A mentor spirit provides guidance and bonuses, but also imposes behavioral expectations. Optional for awakened characters."
                position="right"
              >
                <Box
                  style={{
                    fontSize: '0.75rem',
                    cursor: 'help',
                    borderBottom: '1px dotted rgba(255,255,255,0.2)',
                  }}
                >
                  <Icon name="ghost" mr={0.5} />
                  Mentor Spirit
                </Box>
              </Tooltip>
            </Stack.Item>
            <Stack.Item width="10em">
              {isSaved ? (
                <Box
                  style={{
                    fontSize: '0.75rem',
                    color: '#ba55d3',
                    textAlign: 'right',
                  }}
                >
                  <Icon name="lock" mr={0.5} />
                  {currentMentorSpirit?.name || 'None'}
                </Box>
              ) : (
                <Dropdown
                  width="100%"
                  selected={selectedMentorSpirit}
                  displayText={currentMentorSpirit?.name || 'None'}
                  options={[
                    { value: '', displayText: 'None' },
                    ...mentorSpirits.map((m: MentorSpiritMeta) => ({
                      value: m.id,
                      displayText: m.name,
                    })),
                  ]}
                  onSelected={handleSetMentorSpirit}
                />
              )}
            </Stack.Item>
          </Stack>
          {currentMentorSpirit && (
            <Box
              mt={0.3}
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.6)',
                background: 'rgba(186, 85, 211, 0.1)',
                padding: '0.3rem',
                borderRadius: '3px',
                marginTop: '0.5rem',
              }}
            >
              <Box style={{ color: '#90EE90', marginBottom: '0.2rem' }}>
                <Icon name="plus" mr={0.3} />
                {currentMentorSpirit.advantages}
              </Box>
              <Box style={{ color: '#FFB347' }}>
                <Icon name="exclamation-triangle" mr={0.3} />
                {currentMentorSpirit.disadvantages}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Spells (for mages/mystic adepts) */}
      {isMage && (
        <CollapsibleSection
          title={`Spells (${selectedSpells.length}/${maxSpells})`}
          icon="book-open"
          stateKey="sr_magic_spells"
          defaultOpen={false}
        >
          <Tabs fluid>
            {Object.keys(spellsByCategory).map((cat) => (
              <Tabs.Tab
                key={cat}
                selected={spellCategory === cat}
                onClick={() => setSpellCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Tabs.Tab>
            ))}
          </Tabs>
          <Box
            style={{
              maxHeight: '12rem',
              overflowY: 'auto',
              marginTop: '0.25rem',
            }}
          >
            {(spellsByCategory[spellCategory] || []).map((spell: SpellMeta) => {
              const isSelected = selectedSpells.includes(spell.id);
              return (
                <Tooltip
                  key={spell.id}
                  content={spell.description || spell.name}
                  position="right"
                >
                  <Box
                    className={`PreferencesMenu__ShadowrunSheet__spellItem ${isSelected ? 'PreferencesMenu__ShadowrunSheet__spellItem--selected' : ''}`}
                    onClick={() => handleToggleSpell(spell.id)}
                    style={{
                      cursor: isSaved ? 'not-allowed' : 'pointer',
                      opacity: isSaved ? '0.6' : '1',
                    }}
                  >
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box style={{ fontSize: '0.75rem' }}>{spell.name}</Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            fontSize: '0.65rem',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {spell.drain}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        {isSelected && (
                          <Icon name="check" color="good" size={0.8} />
                        )}
                      </Stack.Item>
                    </Stack>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </CollapsibleSection>
      )}

      {/* Adept Powers (for adepts/mystic adepts) */}
      {isAdept && (
        <CollapsibleSection
          title={`Powers (${spentPP.toFixed(1)}/${maxPP} PP)`}
          icon="fist-raised"
          stateKey="sr_magic_powers"
          defaultOpen={false}
        >
          <Tabs fluid>
            {Object.keys(powersByCategory).map((cat) => (
              <Tabs.Tab
                key={cat}
                selected={powerCategory === cat}
                onClick={() => setPowerCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Tabs.Tab>
            ))}
          </Tabs>
          <Box
            style={{
              maxHeight: '12rem',
              overflowY: 'auto',
              marginTop: '0.25rem',
            }}
          >
            {(powersByCategory[powerCategory] || []).map(
              (power: AdeptPowerMeta) => {
                const currentLevel = Number(selectedPowers[power.id]) || 0;
                const isActive = currentLevel > 0;
                const canIncrease =
                  !isSaved &&
                  spentPP + power.pp_cost <= maxPP &&
                  currentLevel < power.max_level;
                const canDecrease = !isSaved && currentLevel > 0;

                return (
                  <Tooltip
                    key={power.id}
                    content={power.description || power.name}
                    position="right"
                  >
                    <Box
                      className={`PreferencesMenu__ShadowrunSheet__powerItem ${isActive ? 'PreferencesMenu__ShadowrunSheet__powerItem--active' : ''}`}
                      style={{ opacity: isSaved ? '0.6' : '1' }}
                    >
                      <Stack align="center">
                        <Stack.Item grow>
                          <Box style={{ fontSize: '0.75rem' }}>
                            {power.name}
                            {power.max_level > 1 && currentLevel > 0 && (
                              <Box as="span" color="label" ml={0.5}>
                                [{currentLevel}]
                              </Box>
                            )}
                          </Box>
                        </Stack.Item>
                        <Stack.Item>
                          <Box
                            style={{
                              fontSize: '0.65rem',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {power.pp_cost} PP
                          </Box>
                        </Stack.Item>
                        <Stack.Item>
                          <Button
                            icon="minus"
                            compact
                            disabled={!canDecrease}
                            onClick={() => handleBumpPower(power.id, -1)}
                            style={{
                              minWidth: '1rem',
                              padding: '0.1rem',
                              fontSize: '0.6rem',
                            }}
                          />
                          <Button
                            icon="plus"
                            compact
                            disabled={!canIncrease}
                            onClick={() => handleBumpPower(power.id, 1)}
                            style={{
                              minWidth: '1rem',
                              padding: '0.1rem',
                              fontSize: '0.6rem',
                            }}
                          />
                        </Stack.Item>
                      </Stack>
                    </Box>
                  </Tooltip>
                );
              },
            )}
          </Box>
        </CollapsibleSection>
      )}

      {/* Complex Forms (for technomancers) */}
      {isTechnomancer && (
        <CollapsibleSection
          title={`Complex Forms (${selectedForms.length}/${maxForms})`}
          icon="code"
          stateKey="sr_matrix_forms"
          defaultOpen={false}
        >
          <Tabs fluid>
            {Object.keys(formsByCategory).map((cat) => (
              <Tabs.Tab
                key={cat}
                selected={formCategory === cat}
                onClick={() => setFormCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Tabs.Tab>
            ))}
          </Tabs>
          <Box
            style={{
              maxHeight: '12rem',
              overflowY: 'auto',
              marginTop: '0.25rem',
            }}
          >
            {(formsByCategory[formCategory] || []).map(
              (form: ComplexFormMeta) => {
                const isSelected = selectedForms.includes(form.id);
                return (
                  <Tooltip
                    key={form.id}
                    content={form.description || form.name}
                    position="right"
                  >
                    <Box
                      className={`PreferencesMenu__ShadowrunSheet__spellItem ${isSelected ? 'PreferencesMenu__ShadowrunSheet__spellItem--selected' : ''}`}
                      onClick={() => handleToggleForm(form.id)}
                      style={{
                        cursor: isSaved ? 'not-allowed' : 'pointer',
                        opacity: isSaved ? '0.6' : '1',
                      }}
                    >
                      <Stack align="center">
                        <Stack.Item grow>
                          <Box style={{ fontSize: '0.75rem' }}>{form.name}</Box>
                        </Stack.Item>
                        <Stack.Item>
                          <Box
                            style={{
                              fontSize: '0.65rem',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {form.fading}
                          </Box>
                        </Stack.Item>
                        <Stack.Item>
                          {isSelected && (
                            <Icon name="check" color="good" size={0.8} />
                          )}
                        </Stack.Item>
                      </Stack>
                    </Box>
                  </Tooltip>
                );
              },
            )}
          </Box>
        </CollapsibleSection>
      )}
    </Box>
  );
});
