/**
 * Core Tab Content for Shadowrun Character Sheet
 *
 * Contains: SIN (Identity), Lifestyle, Character Notes, Biometrics & Metatype,
 * and Derived Statistics sections.
 */

import { memo, ReactNode } from 'react';
import { Tooltip } from 'tgui-core/components';

import {
  Box,
  Button,
  Dropdown,
  Icon,
  Input,
  LabeledList,
  Stack,
} from '../../../components';
import { createSetPreference } from '../data';
import { Gender, GENDERS } from '../preferences/gender';
import { CollapsibleSection } from './components';
import {
  ChargenConstData,
  ChargenState,
  DashboardData,
  DerivedStats,
  LifestyleMeta,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

// Re-export for consumers
export type { DashboardData, DerivedStats } from './types';

// MetatypeSelector component prop type
type MetatypeSelectorProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: unknown) => void;
  value: unknown;
};

export type CoreTabContentProps = {
  MetatypeSelector: React.ComponentType<MetatypeSelectorProps>;
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  dashboardData: DashboardData | null;
  data: {
    active_slot: number;
    character_preferences: {
      misc: Record<string, unknown>;
      names?: Record<string, string>;
    };
  };
  derivedStats: DerivedStats | null;
  featureId: string;
  isEditingName: boolean;
  isSaved: boolean;
  multiNameInputOpen: boolean;
  nameDraft: string;
  nameKey: string;
  nameLocked: boolean;
  renderPreference: (preferenceId: string) => ReactNode;
  setIsEditingName: (value: boolean) => void;
  setMultiNameInputOpen: (value: boolean) => void;
  setNameDraft: (value: string) => void;
  setPredictedValue: (value: unknown) => void;
  value: unknown;
};

// ============================================================================
// FIELD HINTS (for tooltips)
// ============================================================================

const FIELD_HINTS: Record<string, string> = {
  Birthplace: 'Where you were born or claim to be from on your SIN.',
  Religion:
    'Your spiritual beliefs or lack thereof. May affect roleplay interactions.',
  SINStatus:
    'Whether your SIN is legitimate, criminal, or forged. Affects how corps and law enforcement view you.',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const CoreTabContent = memo((props: CoreTabContentProps) => {
  const {
    act,
    chargenConstData,
    chargenState,
    dashboardData,
    data,
    derivedStats,
    featureId,
    isEditingName,
    isSaved,
    MetatypeSelector,
    multiNameInputOpen,
    nameDraft,
    nameKey,
    nameLocked,
    renderPreference,
    setIsEditingName,
    setMultiNameInputOpen,
    setNameDraft,
    setPredictedValue,
    value,
  } = props;

  return (
    <>
      {/* SIN Section - Collapsible */}
      <CollapsibleSection
        title="SIN (Identity)"
        icon="id-card"
        stateKey={`sr_sin_${data.active_slot}`}
        defaultOpen
      >
        <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
          <LabeledList>
            <LabeledList.Item label="Name:">
              <Box style={{ maxWidth: '28rem' }}>
                <Stack align="center">
                  <Stack.Item grow>
                    <Input
                      placeholder="Enter name"
                      value={nameDraft}
                      disabled={nameLocked}
                      onInput={(_, v) => {
                        if (nameLocked) return;
                        setIsEditingName(true);
                        setNameDraft(v);
                      }}
                      onChange={(_, v) => {
                        if (nameLocked) return;
                        act('set_preference', {
                          preference: nameKey,
                          value: (v ?? '').trim(),
                        });
                        setIsEditingName(false);
                      }}
                    />
                  </Stack.Item>
                  <Stack.Item>
                    <Button
                      icon="id-card"
                      tooltip={
                        nameLocked
                          ? 'Names locked during round'
                          : 'Alternate names'
                      }
                      tooltipPosition="bottom"
                      disabled={nameLocked}
                      onClick={() => setMultiNameInputOpen(true)}
                    />
                  </Stack.Item>
                </Stack>
              </Box>
            </LabeledList.Item>

            <LabeledList.Item label="Gender:">
              <Box style={{ maxWidth: '16rem' }}>
                <Dropdown
                  width="100%"
                  selected={data.character_preferences.misc.gender}
                  displayText={
                    GENDERS[
                      (data.character_preferences.misc.gender as Gender) ||
                        Gender.Male
                    ]?.text || 'Gender'
                  }
                  options={Object.entries(GENDERS).map(([value, { text }]) => ({
                    value,
                    displayText: text,
                  }))}
                  onSelected={createSetPreference(act, 'gender')}
                />
              </Box>
            </LabeledList.Item>

            {renderPreference('employer')}

            {renderPreference('age')}

            {renderPreference('dominant_hand')}
          </LabeledList>
        </Box>

        {/* Extended SIN Information */}
        <Box
          style={{
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(155, 143, 199, 0.25)',
          }}
        >
          <Box
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#9b8fc7',
              marginBottom: '0.5rem',
            }}
          >
            <Icon name="file-alt" mr={0.5} />
            Extended SIN Data
          </Box>
          <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
            <LabeledList>
              <LabeledList.Item label="SIN Status:">
                <Box style={{ maxWidth: '16rem' }}>
                  <Tooltip content={FIELD_HINTS.SINStatus} position="bottom">
                    <Dropdown
                      width="100%"
                      disabled={isSaved}
                      selected={chargenState?.sin_status || 'legitimate'}
                      options={[
                        {
                          value: 'legitimate',
                          displayText: 'Legitimate SIN',
                        },
                        {
                          value: 'criminal',
                          displayText: 'Criminal SIN',
                        },
                        {
                          value: 'corporate',
                          displayText: 'Corporate SIN',
                        },
                        {
                          value: 'sinless',
                          displayText: 'SINless',
                        },
                        {
                          value: 'fake_low',
                          displayText: 'Fake SIN (Rating 1-2)',
                        },
                        {
                          value: 'fake_mid',
                          displayText: 'Fake SIN (Rating 3-4)',
                        },
                        {
                          value: 'fake_high',
                          displayText: 'Fake SIN (Rating 5-6)',
                        },
                      ]}
                      onSelected={(val) => {
                        if (isSaved) return;
                        const newState = {
                          ...value!,
                          sin_status: val,
                        };
                        setPredictedValue(newState);
                        act('set_preference', {
                          preference: featureId,
                          value: newState,
                        });
                      }}
                    />
                  </Tooltip>
                </Box>
              </LabeledList.Item>

              <LabeledList.Item label="Birthplace:">
                <Box style={{ maxWidth: '16rem' }}>
                  <Tooltip content={FIELD_HINTS.Birthplace} position="bottom">
                    <Dropdown
                      width="100%"
                      disabled={isSaved}
                      selected={chargenState?.birthplace || 'seattle'}
                      options={[
                        {
                          value: 'seattle',
                          displayText: 'Seattle Metroplex',
                        },
                        {
                          value: 'ucas',
                          displayText: 'UCAS (Other)',
                        },
                        {
                          value: 'cas',
                          displayText: 'Confederation of American States',
                        },
                        {
                          value: 'native_nations',
                          displayText: 'Native American Nations',
                        },
                        {
                          value: 'aztlan',
                          displayText: 'Aztlan',
                        },
                        {
                          value: 'tir',
                          displayText: 'Tír Tairngire / Tír na nÓg',
                        },
                        {
                          value: 'japan',
                          displayText: 'Japan',
                        },
                        {
                          value: 'europe',
                          displayText: 'European Nations',
                        },
                        {
                          value: 'other',
                          displayText: 'Other / Unknown',
                        },
                      ]}
                      onSelected={(val) => {
                        if (isSaved) return;
                        const newState = {
                          ...value!,
                          birthplace: val,
                        };
                        setPredictedValue(newState);
                        act('set_preference', {
                          preference: featureId,
                          value: newState,
                        });
                      }}
                    />
                  </Tooltip>
                </Box>
              </LabeledList.Item>

              <LabeledList.Item label="Religion:">
                <Box style={{ maxWidth: '16rem' }}>
                  <Tooltip content={FIELD_HINTS.Religion} position="bottom">
                    <Dropdown
                      width="100%"
                      disabled={isSaved}
                      selected={chargenState?.religion || 'none'}
                      options={[
                        {
                          value: 'none',
                          displayText: 'None / Atheist',
                        },
                        {
                          value: 'christian',
                          displayText: 'Christianity',
                        },
                        {
                          value: 'islam',
                          displayText: 'Islam',
                        },
                        {
                          value: 'buddhist',
                          displayText: 'Buddhism',
                        },
                        {
                          value: 'hindu',
                          displayText: 'Hinduism',
                        },
                        {
                          value: 'shinto',
                          displayText: 'Shinto',
                        },
                        {
                          value: 'jewish',
                          displayText: 'Judaism',
                        },
                        {
                          value: 'neo_pagan',
                          displayText: 'Neo-Paganism',
                        },
                        {
                          value: 'shamanic',
                          displayText: 'Shamanic Tradition',
                        },
                        {
                          value: 'hermetic',
                          displayText: 'Hermetic Philosophy',
                        },
                        {
                          value: 'druidic',
                          displayText: 'Druidism',
                        },
                        {
                          value: 'aztec',
                          displayText: 'Aztec Tradition',
                        },
                        {
                          value: 'other',
                          displayText: 'Other',
                        },
                      ]}
                      onSelected={(val) => {
                        if (isSaved) return;
                        const newState = {
                          ...value!,
                          religion: val,
                        };
                        setPredictedValue(newState);
                        act('set_preference', {
                          preference: featureId,
                          value: newState,
                        });
                      }}
                    />
                  </Tooltip>
                </Box>
              </LabeledList.Item>
            </LabeledList>
          </Box>
        </Box>
      </CollapsibleSection>

      {/* Lifestyle Section */}
      <CollapsibleSection
        title="Lifestyle"
        icon="home"
        stateKey={`sr_lifestyle_${data.active_slot}`}
        defaultOpen
      >
        <Box
          style={{
            marginBottom: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
          }}
        >
          Your lifestyle determines your living conditions and costs 1 month
          prepaid from your starting nuyen.
        </Box>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '0.5rem',
          }}
        >
          {(chargenConstData?.lifestyles || []).map(
            (lifestyle: LifestyleMeta) => {
              const isSelected = chargenState?.lifestyle === lifestyle.id;
              const canAfford =
                dashboardData &&
                dashboardData.nuyenRemaining +
                  dashboardData.lifestyleCost -
                  lifestyle.cost >=
                  0;
              return (
                <Box
                  key={lifestyle.id}
                  style={{
                    padding: '0.75rem',
                    background: isSelected
                      ? 'rgba(155, 143, 199, 0.25)'
                      : 'rgba(0, 0, 0, 0.3)',
                    border: isSelected
                      ? '2px solid #9b8fc7'
                      : '1px solid rgba(155, 143, 199, 0.3)',
                    borderRadius: '4px',
                    cursor: isSaved || !canAfford ? 'not-allowed' : 'pointer',
                    opacity: !canAfford && !isSelected ? '0.5' : '1',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    if (isSaved || (!canAfford && !isSelected)) {
                      return;
                    }
                    const newState = {
                      ...value!,
                      lifestyle: lifestyle.id,
                    };
                    setPredictedValue(newState);
                    act('set_preference', {
                      preference: featureId,
                      value: newState,
                    });
                  }}
                >
                  <Box
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <Box
                      style={{
                        fontWeight: 'bold',
                        color: isSelected ? '#ffd700' : '#ffffff',
                      }}
                    >
                      {isSelected && (
                        <Icon
                          name="check"
                          style={{
                            marginRight: '0.25rem',
                            color: '#4caf50',
                          }}
                        />
                      )}
                      {lifestyle.name}
                    </Box>
                    <Box
                      style={{
                        color:
                          lifestyle.cost === 0
                            ? '#4caf50'
                            : lifestyle.cost >= 10000
                              ? '#ffd700'
                              : '#ff9800',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    >
                      ¥{lifestyle.cost.toLocaleString()}
                      /mo
                    </Box>
                  </Box>
                  <Box
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: '1.3',
                    }}
                  >
                    {lifestyle.description}
                  </Box>
                </Box>
              );
            },
          )}
        </Box>
        {dashboardData && (
          <Box
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Lifestyle Cost (1 month prepaid):
            </Box>
            <Box style={{ fontWeight: 'bold', color: '#ffd700' }}>
              ¥{dashboardData.lifestyleCost.toLocaleString()}
            </Box>
          </Box>
        )}
      </CollapsibleSection>

      {/* Character Notes & Backstory Section */}
      <CollapsibleSection
        title="Character Notes & Backstory"
        icon="book"
        stateKey={`sr_notes_${data.active_slot}`}
        defaultOpen={false}
      >
        <Box
          style={{
            marginBottom: '0.75rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
          }}
        >
          Add backstory and notes for your character. These will be visible to
          admins and may be used for roleplay purposes.
        </Box>

        {/* General Notes */}
        <Box style={{ marginBottom: '1rem' }}>
          <Box
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#9b8fc7',
              marginBottom: '0.25rem',
            }}
          >
            <Icon name="user" mr={0.5} />
            General Notes / Backstory
          </Box>
          <Box
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.5rem',
            }}
          >
            Your character&apos;s background, personality, and general
            information.
          </Box>
          <textarea
            style={{
              width: '100%',
              minHeight: '100px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(155, 143, 199, 0.3)',
              borderRadius: '4px',
              padding: '0.5rem',
              color: '#ffffff',
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
            disabled={isSaved}
            placeholder="Write your character's backstory here..."
            value={chargenState?.character_notes?.general || ''}
            maxLength={2000}
            onChange={(e) => {
              if (isSaved) return;
              const newNotes = {
                ...(chargenState?.character_notes || {}),
                general: e.target.value,
              };
              const newState = {
                ...value!,
                character_notes: newNotes,
              };
              setPredictedValue(newState);
              act('set_preference', {
                preference: featureId,
                value: newState,
              });
            }}
          />
          <Box
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'right',
            }}
          >
            {(
              chargenState?.character_notes?.general || ''
            ).length.toLocaleString()}
            /2,000
          </Box>
        </Box>

        {/* Security Record */}
        <Box style={{ marginBottom: '1rem' }}>
          <Box
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#ff6b6b',
              marginBottom: '0.25rem',
            }}
          >
            <Icon name="shield-alt" mr={0.5} />
            Security Record
          </Box>
          <Box
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.5rem',
            }}
          >
            Criminal history, warrants, or security-relevant information.
          </Box>
          <textarea
            style={{
              width: '100%',
              minHeight: '80px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '4px',
              padding: '0.5rem',
              color: '#ffffff',
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
            disabled={isSaved}
            placeholder="Any criminal history or security concerns..."
            value={chargenState?.character_notes?.security_record || ''}
            maxLength={2000}
            onChange={(e) => {
              if (isSaved) return;
              const newNotes = {
                ...(chargenState?.character_notes || {}),
                security_record: e.target.value,
              };
              const newState = {
                ...value!,
                character_notes: newNotes,
              };
              setPredictedValue(newState);
              act('set_preference', {
                preference: featureId,
                value: newState,
              });
            }}
          />
          <Box
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'right',
            }}
          >
            {(
              chargenState?.character_notes?.security_record || ''
            ).length.toLocaleString()}
            /2,000
          </Box>
        </Box>

        {/* Medical Record */}
        <Box style={{ marginBottom: '1rem' }}>
          <Box
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#4fc3f7',
              marginBottom: '0.25rem',
            }}
          >
            <Icon name="heartbeat" mr={0.5} />
            Medical Record
          </Box>
          <Box
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.5rem',
            }}
          >
            Medical history, allergies, or health conditions.
          </Box>
          <textarea
            style={{
              width: '100%',
              minHeight: '80px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(79, 195, 247, 0.3)',
              borderRadius: '4px',
              padding: '0.5rem',
              color: '#ffffff',
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
            disabled={isSaved}
            placeholder="Any medical conditions or notes..."
            value={chargenState?.character_notes?.medical_record || ''}
            maxLength={2000}
            onChange={(e) => {
              if (isSaved) return;
              const newNotes = {
                ...(chargenState?.character_notes || {}),
                medical_record: e.target.value,
              };
              const newState = {
                ...value!,
                character_notes: newNotes,
              };
              setPredictedValue(newState);
              act('set_preference', {
                preference: featureId,
                value: newState,
              });
            }}
          />
          <Box
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'right',
            }}
          >
            {(
              chargenState?.character_notes?.medical_record || ''
            ).length.toLocaleString()}
            /2,000
          </Box>
        </Box>

        {/* Exploitable Information */}
        <Box>
          <Box
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#ff9800',
              marginBottom: '0.25rem',
            }}
          >
            <Icon name="exclamation-triangle" mr={0.5} />
            Exploitable Information
          </Box>
          <Box
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.5rem',
            }}
          >
            Weaknesses, secrets, or info antagonists might use against you.
          </Box>
          <textarea
            style={{
              width: '100%',
              minHeight: '80px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '4px',
              padding: '0.5rem',
              color: '#ffffff',
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
            disabled={isSaved}
            placeholder="Phobias, addictions, enemies, or exploitable secrets..."
            value={chargenState?.character_notes?.exploitable_info || ''}
            maxLength={2000}
            onChange={(e) => {
              if (isSaved) return;
              const newNotes = {
                ...(chargenState?.character_notes || {}),
                exploitable_info: e.target.value,
              };
              const newState = {
                ...value!,
                character_notes: newNotes,
              };
              setPredictedValue(newState);
              act('set_preference', {
                preference: featureId,
                value: newState,
              });
            }}
          />
          <Box
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'right',
            }}
          >
            {(
              chargenState?.character_notes?.exploitable_info || ''
            ).length.toLocaleString()}
            /2,000
          </Box>
        </Box>
      </CollapsibleSection>

      {/* Biometrics Section with Metatype - Collapsible */}
      <CollapsibleSection
        title="Biometrics & Metatype"
        icon="dna"
        stateKey={`sr_bio_${data.active_slot}`}
        defaultOpen
      >
        {/* Metatype Selector */}
        <MetatypeSelector
          chargenState={chargenState}
          chargenConstData={chargenConstData}
          isSaved={isSaved}
          act={act}
          featureId={featureId}
          setPredictedValue={setPredictedValue}
          value={value}
        />

        {/* Two-column Biometrics Grid */}
        <Box className="PreferencesMenu__ShadowrunSheet__biometricsGrid">
          <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn">
            <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn__title">
              <Icon name="palette" mr={0.5} />
              Physical Appearance
            </Box>
            <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
              <LabeledList>
                {renderPreference('skin_tone')}
                {renderPreference('eye_color')}
                {renderPreference('heterochromatic')}
                {renderPreference('sclera_color')}
              </LabeledList>
            </Box>
          </Box>

          <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn">
            <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn__title">
              <Icon name="cut" mr={0.5} />
              Hair Styles
            </Box>
            <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
              <LabeledList>
                {renderPreference('hairstyle_name')}
                {renderPreference('hair_color')}
                {renderPreference('hair_gradient')}
                {renderPreference('hair_gradient_color')}
              </LabeledList>
            </Box>
          </Box>

          <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn">
            <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn__title">
              <Icon name="user" mr={0.5} />
              Facial Hair
            </Box>
            <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
              <LabeledList>
                {renderPreference('facial_style_name')}
                {renderPreference('facial_hair_color')}
                {renderPreference('facial_hair_gradient')}
                {renderPreference('facial_hair_gradient_color')}
              </LabeledList>
            </Box>
          </Box>

          <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn">
            <Box className="PreferencesMenu__ShadowrunSheet__biometricsColumn__title">
              <Icon name="tshirt" mr={0.5} />
              Undergarments
            </Box>
            <Box className="PreferencesMenu__ShadowrunSheet__labeledList">
              <LabeledList>
                {renderPreference('underwear')}
                {renderPreference('underwear_color')}
                {renderPreference('undershirt')}
                {renderPreference('socks')}
              </LabeledList>
            </Box>
          </Box>
        </Box>
      </CollapsibleSection>

      {/* Derived Stats Panel */}
      {derivedStats && (
        <Box className="PreferencesMenu__ShadowrunSheet__derivedStats">
          <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__title">
            <Icon name="calculator" mr={0.5} />
            Derived Statistics
          </Box>
          <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__grid">
            <Tooltip
              content="Charisma + Willpower: Staying calm under pressure"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Composure
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.composure}
                </Box>
              </Box>
            </Tooltip>
            <Tooltip
              content="Charisma + Intuition: Reading people's intentions"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Judge Intentions
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.judgeIntentions}
                </Box>
              </Box>
            </Tooltip>
            <Tooltip
              content="Logic + Willpower: Recalling information"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Memory
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.memory}
                </Box>
              </Box>
            </Tooltip>
            <Tooltip
              content="Strength + Body: Physical carrying capacity"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Lift/Carry
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.liftCarry}
                </Box>
              </Box>
            </Tooltip>
            <Tooltip
              content="Reaction + Intuition: Acting first in combat"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Initiative
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.initiative}
                </Box>
              </Box>
            </Tooltip>
          </Box>
          {/* Limits Section */}
          <Box
            className="PreferencesMenu__ShadowrunSheet__derivedStats__title"
            mt={1}
          >
            <Icon name="shield-alt" mr={0.5} />
            Limits
          </Box>
          <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__grid">
            <Tooltip
              content="(STR×2 + BOD + REA) ÷ 3: Max hits on physical tests"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Physical
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.physicalLimit}
                </Box>
              </Box>
            </Tooltip>
            <Tooltip
              content="(LOG×2 + INT + WIL) ÷ 3: Max hits on mental tests"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Mental
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.mentalLimit}
                </Box>
              </Box>
            </Tooltip>
            <Tooltip
              content="(CHA×2 + WIL + ESS) ÷ 3: Max hits on social tests"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Social
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.socialLimit}
                </Box>
              </Box>
            </Tooltip>
          </Box>
          {/* Condition Monitors Section */}
          <Box
            className="PreferencesMenu__ShadowrunSheet__derivedStats__title"
            mt={1}
          >
            <Icon name="heart" mr={0.5} />
            Condition Monitors
          </Box>
          <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__grid">
            <Tooltip
              content="8 + (BOD ÷ 2): Physical damage boxes"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Physical CM
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.physicalCM}
                </Box>
              </Box>
            </Tooltip>
            <Tooltip
              content="8 + (WIL ÷ 2): Stun damage boxes"
              position="bottom"
            >
              <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat">
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__name">
                  Stun CM
                </Box>
                <Box className="PreferencesMenu__ShadowrunSheet__derivedStats__stat__value">
                  {derivedStats.stunCM}
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      )}
    </>
  );
});
