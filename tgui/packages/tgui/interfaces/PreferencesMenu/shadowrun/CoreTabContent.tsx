/**
 * Core Tab Content for Shadowrun Character Sheet
 *
 * Contains: SIN (Identity), Lifestyle, Character Notes, Character Portraits,
 * Biometrics & Metatype, and Derived Statistics sections.
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
import { MetatypeSelectorProps } from './MetatypeSelector';
import { PortraitsSection } from './PortraitUpload';
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

  // SIN accent color
  const SIN_ACCENT = '#00d4ff';
  const SIN_ACCENT_DIM = 'rgba(0, 212, 255, 0.3)';

  // Lifestyle accent color (Orange)
  const LIFESTYLE_ACCENT = '#ff9800';
  const LIFESTYLE_ACCENT_DIM = 'rgba(255, 152, 0, 0.15)';
  const LIFESTYLE_ACCENT_BORDER = 'rgba(255, 152, 0, 0.4)';

  // Notes accent color (Silver)
  const NOTES_ACCENT = '#9e9e9e';
  const NOTES_ACCENT_DIM = 'rgba(158, 158, 158, 0.15)';
  const NOTES_ACCENT_BORDER = 'rgba(158, 158, 158, 0.4)';

  // Biometrics accent color (Teal)
  const BIO_ACCENT = '#26c6da';
  const BIO_ACCENT_DIM = 'rgba(38, 198, 218, 0.15)';
  const BIO_ACCENT_BORDER = 'rgba(38, 198, 218, 0.4)';

  // Derived Stats accent color (Purple)
  const STATS_ACCENT = '#9b59b6';
  const STATS_ACCENT_DIM = 'rgba(155, 89, 182, 0.15)';
  const STATS_ACCENT_BORDER = 'rgba(155, 89, 182, 0.4)';

  // Common status colors
  const SUCCESS_GREEN = '#4caf50';
  const WARNING_YELLOW = '#ffeb3b';

  // Lifestyle tier icon helper
  const getLifestyleTierIcon = (cost: number): string => {
    if (cost === 0) return 'campground'; // Street
    if (cost <= 2000) return 'warehouse'; // Squatter
    if (cost <= 5000) return 'building'; // Low
    if (cost <= 10000) return 'city'; // Middle
    if (cost <= 50000) return 'hotel'; // High
    return 'crown'; // Luxury
  };

  const getLifestyleTierColor = (cost: number): string => {
    if (cost === 0) return '#9e9e9e'; // Street - gray
    if (cost <= 2000) return '#795548'; // Squatter - brown
    if (cost <= 5000) return '#ff9800'; // Low - orange
    if (cost <= 10000) return '#ffc107'; // Middle - amber
    if (cost <= 50000) return '#ffd700'; // High - gold
    return '#e91e63'; // Luxury - pink
  };

  // Status icon helper for SIN status
  const getSINStatusIcon = (status: string) => {
    switch (status) {
      case 'legitimate':
        return { icon: 'check-circle', color: '#4caf50' };
      case 'criminal':
        return { icon: 'exclamation-triangle', color: '#ff6b6b' };
      case 'corporate':
        return { icon: 'building', color: '#ffd700' };
      case 'sinless':
        return { icon: 'question-circle', color: '#9e9e9e' };
      case 'fake_low':
        return { icon: 'user-secret', color: '#ff9800' };
      case 'fake_mid':
        return { icon: 'user-secret', color: '#ff9800' };
      case 'fake_high':
        return { icon: 'user-secret', color: '#4caf50' };
      default:
        return { icon: 'id-card', color: '#9e9e9e' };
    }
  };

  const sinStatusInfo = getSINStatusIcon(
    chargenState?.sin_status || 'legitimate',
  );

  return (
    <>
      {/* SIN Section - Fully Redesigned */}
      <CollapsibleSection
        title="SIN (Identity)"
        icon="id-card"
        stateKey={`sr_sin_${data.active_slot}`}
        defaultOpen
      >
        {/* SIN Card - Main Identity Display */}
        <Box
          style={{
            background: `linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 0, 0, 0.4))`,
            border: `1px solid ${SIN_ACCENT_DIM}`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            position: 'relative',
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
              background: `linear-gradient(135deg, transparent 50%, ${SIN_ACCENT_DIM} 50%)`,
              opacity: '0.5',
            }}
          />

          {/* SIN Status Badge */}
          <Box
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              padding: '0.25rem 0.5rem',
              background: `rgba(0, 0, 0, 0.5)`,
              border: `1px solid ${sinStatusInfo.color}`,
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: sinStatusInfo.color,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Icon name={sinStatusInfo.icon} />
            {(chargenState?.sin_status || 'legitimate')
              .replace(/_/g, ' ')
              .toUpperCase()}
          </Box>

          <Stack vertical>
            {/* Name Row - Prominent */}
            <Stack.Item>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: SIN_ACCENT,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.25rem',
                }}
              >
                <Icon name="user" mr={0.5} />
                Legal Name
              </Box>
              <Stack align="center">
                <Stack.Item grow>
                  <Input
                    placeholder="Enter name"
                    value={nameDraft}
                    disabled={nameLocked}
                    fluid
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                    }}
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
                    color="transparent"
                    tooltip={
                      nameLocked
                        ? 'Names locked during round'
                        : 'Manage alternate names / aliases'
                    }
                    tooltipPosition="left"
                    disabled={nameLocked}
                    onClick={() => setMultiNameInputOpen(true)}
                    style={{
                      border: `1px solid ${SIN_ACCENT_DIM}`,
                    }}
                  />
                </Stack.Item>
              </Stack>
            </Stack.Item>

            {/* Horizontal divider */}
            <Stack.Item>
              <Box
                style={{
                  height: '1px',
                  background: `linear-gradient(90deg, ${SIN_ACCENT_DIM}, transparent)`,
                  margin: '0.75rem 0',
                }}
              />
            </Stack.Item>

            {/* Basic Info Grid */}
            <Stack.Item>
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Gender */}
                <Box>
                  <Box
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Gender
                  </Box>
                  <Dropdown
                    width="100%"
                    selected={data.character_preferences.misc.gender}
                    displayText={
                      GENDERS[
                        (data.character_preferences.misc.gender as Gender) ||
                          Gender.Male
                      ]?.text || 'Gender'
                    }
                    options={Object.entries(GENDERS).map(
                      ([value, { text }]) => ({
                        value,
                        displayText: text,
                      }),
                    )}
                    onSelected={createSetPreference(act, 'gender')}
                  />
                </Box>

                {/* Employer - Rendered via preference system */}
                <Box>
                  <Box
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Employer
                  </Box>
                  {renderPreference('employer')}
                </Box>

                {/* Age */}
                <Box>
                  <Box
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Age
                  </Box>
                  {renderPreference('age')}
                </Box>

                {/* Dominant Hand */}
                <Box>
                  <Box
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Dominant Hand
                  </Box>
                  {renderPreference('dominant_hand')}
                </Box>
              </Box>
            </Stack.Item>
          </Stack>
        </Box>

        {/* Extended SIN Data - Styled Cards */}
        <Box
          style={{
            marginTop: '1rem',
          }}
        >
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: `2px solid ${SIN_ACCENT}`,
            }}
          >
            <Icon name="file-alt" size={1.2} color={SIN_ACCENT} />
            <Box
              style={{
                marginLeft: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              Extended SIN Data
            </Box>
            <Box
              style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                opacity: '0.6',
              }}
            >
              Official records & documentation
            </Box>
          </Box>

          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {/* SIN Status Card */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${sinStatusInfo.color}40`,
                borderLeft: `3px solid ${sinStatusInfo.color}`,
                borderRadius: '4px',
                padding: '0.75rem',
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <Icon name="fingerprint" color={sinStatusInfo.color} mr={0.5} />
                <Box
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: sinStatusInfo.color,
                  }}
                >
                  SIN Status
                </Box>
              </Box>
              <Tooltip content={FIELD_HINTS.SINStatus} position="bottom">
                <Dropdown
                  width="100%"
                  disabled={isSaved}
                  selected={chargenState?.sin_status || 'legitimate'}
                  options={[
                    { value: 'legitimate', displayText: 'Legitimate SIN' },
                    { value: 'criminal', displayText: 'Criminal SIN' },
                    { value: 'corporate', displayText: 'Corporate SIN' },
                    { value: 'sinless', displayText: 'SINless' },
                    { value: 'fake_low', displayText: 'Fake SIN (Rating 1-2)' },
                    { value: 'fake_mid', displayText: 'Fake SIN (Rating 3-4)' },
                    {
                      value: 'fake_high',
                      displayText: 'Fake SIN (Rating 5-6)',
                    },
                  ]}
                  onSelected={(val) => {
                    if (isSaved) return;
                    const newState = { ...value!, sin_status: val };
                    setPredictedValue(newState);
                    act('set_preference', {
                      preference: featureId,
                      value: newState,
                    });
                  }}
                />
              </Tooltip>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '0.25rem',
                }}
              >
                Affects how corps and law enforcement view you
              </Box>
            </Box>

            {/* Birthplace Card */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(79, 195, 247, 0.3)',
                borderLeft: '3px solid #4fc3f7',
                borderRadius: '4px',
                padding: '0.75rem',
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <Icon name="globe-americas" color="#4fc3f7" mr={0.5} />
                <Box
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: '#4fc3f7',
                  }}
                >
                  Place of Origin
                </Box>
              </Box>
              <Tooltip content={FIELD_HINTS.Birthplace} position="bottom">
                <Dropdown
                  width="100%"
                  disabled={isSaved}
                  selected={chargenState?.birthplace || 'seattle'}
                  options={[
                    { value: 'seattle', displayText: 'Seattle Metroplex' },
                    { value: 'ucas', displayText: 'UCAS (Other)' },
                    {
                      value: 'cas',
                      displayText: 'Confederation of American States',
                    },
                    {
                      value: 'native_nations',
                      displayText: 'Native American Nations',
                    },
                    { value: 'aztlan', displayText: 'Aztlan' },
                    { value: 'tir', displayText: 'Tír Tairngire / Tír na nÓg' },
                    { value: 'japan', displayText: 'Japan' },
                    { value: 'europe', displayText: 'European Nations' },
                    { value: 'other', displayText: 'Other / Unknown' },
                  ]}
                  onSelected={(val) => {
                    if (isSaved) return;
                    const newState = { ...value!, birthplace: val };
                    setPredictedValue(newState);
                    act('set_preference', {
                      preference: featureId,
                      value: newState,
                    });
                  }}
                />
              </Tooltip>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '0.25rem',
                }}
              >
                Where you were born or claim origin
              </Box>
            </Box>

            {/* Religion Card */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(155, 89, 182, 0.3)',
                borderLeft: '3px solid #9b59b6',
                borderRadius: '4px',
                padding: '0.75rem',
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <Icon name="pray" color="#9b59b6" mr={0.5} />
                <Box
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: '#9b59b6',
                  }}
                >
                  Spiritual Beliefs
                </Box>
              </Box>
              <Tooltip content={FIELD_HINTS.Religion} position="bottom">
                <Dropdown
                  width="100%"
                  disabled={isSaved}
                  selected={chargenState?.religion || 'none'}
                  options={[
                    { value: 'none', displayText: 'None / Atheist' },
                    { value: 'christian', displayText: 'Christianity' },
                    { value: 'islam', displayText: 'Islam' },
                    { value: 'buddhist', displayText: 'Buddhism' },
                    { value: 'hindu', displayText: 'Hinduism' },
                    { value: 'shinto', displayText: 'Shinto' },
                    { value: 'jewish', displayText: 'Judaism' },
                    { value: 'neo_pagan', displayText: 'Neo-Paganism' },
                    { value: 'shamanic', displayText: 'Shamanic Tradition' },
                    { value: 'hermetic', displayText: 'Hermetic Philosophy' },
                    { value: 'druidic', displayText: 'Druidism' },
                    { value: 'aztec', displayText: 'Aztec Tradition' },
                    { value: 'other', displayText: 'Other' },
                  ]}
                  onSelected={(val) => {
                    if (isSaved) return;
                    const newState = { ...value!, religion: val };
                    setPredictedValue(newState);
                    act('set_preference', {
                      preference: featureId,
                      value: newState,
                    });
                  }}
                />
              </Tooltip>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '0.25rem',
                }}
              >
                May affect roleplay interactions
              </Box>
            </Box>
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
            background: `linear-gradient(135deg, ${LIFESTYLE_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
            borderRadius: '8px',
            border: `1px solid ${LIFESTYLE_ACCENT_BORDER}`,
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
              background: `linear-gradient(135deg, transparent 50%, ${LIFESTYLE_ACCENT_DIM} 50%)`,
              opacity: '0.5',
            }}
          />

          {/* Header */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: `2px solid ${LIFESTYLE_ACCENT}`,
            }}
          >
            <Icon
              name="home"
              style={{ color: LIFESTYLE_ACCENT, fontSize: '1.2rem' }}
            />
            <Box
              style={{
                marginLeft: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: LIFESTYLE_ACCENT,
              }}
            >
              Living Conditions
            </Box>
            {dashboardData && (
              <Box
                style={{
                  marginLeft: 'auto',
                  padding: '0.2rem 0.5rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: '#ffd700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Icon name="coins" />¥
                {dashboardData.lifestyleCost.toLocaleString()}/mo
              </Box>
            )}
          </Box>

          <Box
            style={{
              marginBottom: '0.75rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
            }}
          >
            Your lifestyle determines your living conditions. One month is
            prepaid from starting nuyen.
          </Box>

          {/* Lifestyle Grid */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
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
                const tierIcon = getLifestyleTierIcon(lifestyle.cost);
                const tierColor = getLifestyleTierColor(lifestyle.cost);

                return (
                  <Box
                    key={lifestyle.id}
                    style={{
                      padding: '0.75rem',
                      background: isSelected
                        ? `linear-gradient(135deg, rgba(255, 152, 0, 0.25), rgba(0, 0, 0, 0.4))`
                        : 'rgba(0, 0, 0, 0.3)',
                      border: isSelected
                        ? `2px solid ${LIFESTYLE_ACCENT}`
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderLeft: `4px solid ${tierColor}`,
                      borderRadius: '6px',
                      cursor: isSaved || !canAfford ? 'not-allowed' : 'pointer',
                      opacity: !canAfford && !isSelected ? '0.5' : '1',
                      transition: 'all 0.2s ease',
                      position: 'relative',
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
                    {/* Selected checkmark */}
                    {isSelected && (
                      <Box
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          width: '20px',
                          height: '20px',
                          background: SUCCESS_GREEN,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon
                          name="check"
                          style={{ color: '#fff', fontSize: '0.7rem' }}
                        />
                      </Box>
                    )}

                    {/* Tier icon and name */}
                    <Box
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <Icon
                        name={tierIcon}
                        style={{ color: tierColor, fontSize: '1.3rem' }}
                      />
                      <Box>
                        <Box
                          style={{
                            fontWeight: 'bold',
                            color: isSelected ? LIFESTYLE_ACCENT : '#ffffff',
                            fontSize: '0.95rem',
                          }}
                        >
                          {lifestyle.name}
                        </Box>
                        <Box
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: tierColor,
                          }}
                        >
                          ¥{lifestyle.cost.toLocaleString()}/mo
                        </Box>
                      </Box>
                    </Box>

                    {/* Description */}
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
        </Box>
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
            background: `linear-gradient(135deg, ${NOTES_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
            borderRadius: '8px',
            border: `1px solid ${NOTES_ACCENT_BORDER}`,
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
              background: `linear-gradient(135deg, transparent 50%, ${NOTES_ACCENT_DIM} 50%)`,
              opacity: '0.5',
            }}
          />

          {/* Header */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: `2px solid ${NOTES_ACCENT}`,
            }}
          >
            <Icon
              name="book"
              style={{ color: NOTES_ACCENT, fontSize: '1.2rem' }}
            />
            <Box
              style={{
                marginLeft: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: NOTES_ACCENT,
              }}
            >
              Character Records
            </Box>
            <Box
              style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Visible to admins
            </Box>
          </Box>

          <Box
            style={{
              marginBottom: '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
            }}
          >
            Add backstory and notes for roleplay purposes.
          </Box>

          {/* Notes Grid - 2 columns */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* General Notes */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                borderLeft: '3px solid #9b8fc7',
              }}
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#9b8fc7',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="user" />
                General Notes / Backstory
              </Box>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '0.5rem',
                }}
              >
                Background, personality, and general information.
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
                  fontFamily: 'monospace',
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
                  marginTop: '0.25rem',
                }}
              >
                {(
                  chargenState?.character_notes?.general || ''
                ).length.toLocaleString()}
                /2,000
              </Box>
            </Box>

            {/* Security Record */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                borderLeft: '3px solid #ff6b6b',
              }}
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#ff6b6b',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="shield-alt" />
                Security Record
              </Box>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '0.5rem',
                }}
              >
                Criminal history, warrants, or security-relevant info.
              </Box>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  fontFamily: 'monospace',
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
                  marginTop: '0.25rem',
                }}
              >
                {(
                  chargenState?.character_notes?.security_record || ''
                ).length.toLocaleString()}
                /2,000
              </Box>
            </Box>

            {/* Medical Record */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                borderLeft: '3px solid #4fc3f7',
              }}
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#4fc3f7',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="heartbeat" />
                Medical Record
              </Box>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '0.5rem',
                }}
              >
                Medical history, allergies, or health conditions.
              </Box>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(79, 195, 247, 0.3)',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  fontFamily: 'monospace',
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
                  marginTop: '0.25rem',
                }}
              >
                {(
                  chargenState?.character_notes?.medical_record || ''
                ).length.toLocaleString()}
                /2,000
              </Box>
            </Box>

            {/* Exploitable Information */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                borderLeft: '3px solid #ff9800',
              }}
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#ff9800',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="exclamation-triangle" />
                Exploitable Information
              </Box>
              <Box
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '0.5rem',
                }}
              >
                Weaknesses, secrets, or info antagonists might use.
              </Box>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  fontFamily: 'monospace',
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
                  marginTop: '0.25rem',
                }}
              >
                {(
                  chargenState?.character_notes?.exploitable_info || ''
                ).length.toLocaleString()}
                /2,000
              </Box>
            </Box>
          </Box>
        </Box>
      </CollapsibleSection>

      {/* Character Portraits Section */}
      <CollapsibleSection
        title="Character Portraits"
        icon="image"
        stateKey={`sr_portraits_${data.active_slot}`}
        defaultOpen={false}
      >
        <PortraitsSection
          portraitHeadshot={chargenState?.portrait_headshot}
          portraitBodyshot={chargenState?.portrait_bodyshot}
          disabled={isSaved}
          onUpdate={(updates) => {
            if (!chargenState) return;
            const newState = { ...chargenState, ...updates };
            setPredictedValue(newState);

            // Send update to server
            if (updates.portrait_headshot !== undefined) {
              act('update_chargen', {
                portrait_headshot: updates.portrait_headshot,
              });
            }
            if (updates.portrait_bodyshot !== undefined) {
              act('update_chargen', {
                portrait_bodyshot: updates.portrait_bodyshot,
              });
            }
          }}
        />
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
          value={value as ChargenState | null}
        />

        {/* Biometrics Container */}
        <Box
          style={{
            background: `linear-gradient(135deg, ${BIO_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
            borderRadius: '8px',
            border: `1px solid ${BIO_ACCENT_BORDER}`,
            padding: '1rem',
            marginTop: '0.75rem',
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
              background: `linear-gradient(135deg, transparent 50%, ${BIO_ACCENT_DIM} 50%)`,
              opacity: '0.5',
            }}
          />

          {/* Header */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: `2px solid ${BIO_ACCENT}`,
            }}
          >
            <Icon
              name="fingerprint"
              style={{ color: BIO_ACCENT, fontSize: '1.2rem' }}
            />
            <Box
              style={{
                marginLeft: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: BIO_ACCENT,
              }}
            >
              Physical Characteristics
            </Box>
          </Box>

          {/* Biometrics Grid */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Physical Appearance */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                borderLeft: `3px solid ${BIO_ACCENT}`,
              }}
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: BIO_ACCENT,
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="palette" />
                Physical Appearance
              </Box>
              <Box>
                <LabeledList>
                  {renderPreference('skin_tone')}
                  {renderPreference('eye_color')}
                  {renderPreference('heterochromatic')}
                  {renderPreference('sclera_color')}
                </LabeledList>
              </Box>
            </Box>

            {/* Hair Styles */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                borderLeft: '3px solid #9b59b6',
              }}
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#9b59b6',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="cut" />
                Hair Styles
              </Box>
              <Box>
                <LabeledList>
                  {renderPreference('hairstyle_name')}
                  {renderPreference('hair_color')}
                  {renderPreference('hair_gradient')}
                  {renderPreference('hair_gradient_color')}
                </LabeledList>
              </Box>
            </Box>

            {/* Facial Hair */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                borderLeft: '3px solid #ff9800',
              }}
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#ff9800',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="user" />
                Facial Hair
              </Box>
              <Box>
                <LabeledList>
                  {renderPreference('facial_style_name')}
                  {renderPreference('facial_hair_color')}
                  {renderPreference('facial_hair_gradient')}
                  {renderPreference('facial_hair_gradient_color')}
                </LabeledList>
              </Box>
            </Box>

            {/* Undergarments */}
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                borderLeft: '3px solid #607d8b',
              }}
            >
              <Box
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#607d8b',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="tshirt" />
                Undergarments
              </Box>
              <Box>
                <LabeledList>
                  {renderPreference('underwear')}
                  {renderPreference('underwear_color')}
                  {renderPreference('undershirt')}
                  {renderPreference('socks')}
                </LabeledList>
              </Box>
            </Box>
          </Box>
        </Box>
      </CollapsibleSection>

      {/* Derived Stats Panel */}
      {derivedStats && (
        <Box
          style={{
            background: `linear-gradient(135deg, ${STATS_ACCENT_DIM}, rgba(0, 0, 0, 0.4))`,
            borderRadius: '8px',
            border: `1px solid ${STATS_ACCENT_BORDER}`,
            padding: '1rem',
            marginTop: '0.75rem',
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
              background: `linear-gradient(135deg, transparent 50%, ${STATS_ACCENT_DIM} 50%)`,
              opacity: '0.5',
            }}
          />

          {/* Header */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: `2px solid ${STATS_ACCENT}`,
            }}
          >
            <Icon
              name="calculator"
              style={{ color: STATS_ACCENT, fontSize: '1.2rem' }}
            />
            <Box
              style={{
                marginLeft: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: STATS_ACCENT,
              }}
            >
              Derived Statistics
            </Box>
          </Box>

          {/* Derived Stats Grid */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <Tooltip
              content="Charisma + Willpower: Staying calm under pressure"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: `3px solid ${STATS_ACCENT}`,
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Composure
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: STATS_ACCENT,
                  }}
                >
                  {derivedStats.composure}
                </Box>
              </Box>
            </Tooltip>

            <Tooltip
              content="Charisma + Intuition: Reading people's intentions"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: `3px solid ${STATS_ACCENT}`,
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Judge Intent
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: STATS_ACCENT,
                  }}
                >
                  {derivedStats.judgeIntentions}
                </Box>
              </Box>
            </Tooltip>

            <Tooltip
              content="Logic + Willpower: Recalling information"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: `3px solid ${STATS_ACCENT}`,
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Memory
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: STATS_ACCENT,
                  }}
                >
                  {derivedStats.memory}
                </Box>
              </Box>
            </Tooltip>

            <Tooltip
              content="Strength + Body: Physical carrying capacity"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: `3px solid ${STATS_ACCENT}`,
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Lift/Carry
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: STATS_ACCENT,
                  }}
                >
                  {derivedStats.liftCarry}
                </Box>
              </Box>
            </Tooltip>

            <Tooltip
              content="Reaction + Intuition: Acting first in combat"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: `3px solid ${STATS_ACCENT}`,
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Initiative
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: STATS_ACCENT,
                  }}
                >
                  {derivedStats.initiative}
                </Box>
              </Box>
            </Tooltip>
          </Box>

          {/* Limits Section */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem',
              paddingBottom: '0.25rem',
              borderBottom: '1px solid rgba(255, 152, 0, 0.4)',
            }}
          >
            <Icon
              name="shield-alt"
              style={{ color: '#ff9800', fontSize: '1rem' }}
            />
            <Box
              style={{
                marginLeft: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: '#ff9800',
              }}
            >
              Limits
            </Box>
          </Box>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <Tooltip
              content="(STR×2 + BOD + REA) ÷ 3: Max hits on physical tests"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: '3px solid #ff9800',
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Physical
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#ff9800',
                  }}
                >
                  {derivedStats.physicalLimit}
                </Box>
              </Box>
            </Tooltip>

            <Tooltip
              content="(LOG×2 + INT + WIL) ÷ 3: Max hits on mental tests"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: '3px solid #4fc3f7',
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Mental
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#4fc3f7',
                  }}
                >
                  {derivedStats.mentalLimit}
                </Box>
              </Box>
            </Tooltip>

            <Tooltip
              content="(CHA×2 + WIL + ESS) ÷ 3: Max hits on social tests"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: '3px solid #e91e63',
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Social
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#e91e63',
                  }}
                >
                  {derivedStats.socialLimit}
                </Box>
              </Box>
            </Tooltip>
          </Box>

          {/* Condition Monitors Section */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem',
              paddingBottom: '0.25rem',
              borderBottom: '1px solid rgba(244, 67, 54, 0.4)',
            }}
          >
            <Icon name="heart" style={{ color: '#f44336', fontSize: '1rem' }} />
            <Box
              style={{
                marginLeft: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: '#f44336',
              }}
            >
              Condition Monitors
            </Box>
          </Box>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <Tooltip
              content="8 + (BOD ÷ 2): Physical damage boxes"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: '3px solid #f44336',
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Physical CM
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#f44336',
                  }}
                >
                  {derivedStats.physicalCM}
                </Box>
              </Box>
            </Tooltip>

            <Tooltip
              content="8 + (WIL ÷ 2): Stun damage boxes"
              position="bottom"
            >
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  borderLeft: '3px solid #ffc107',
                  cursor: 'help',
                }}
              >
                <Box
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Stun CM
                </Box>
                <Box
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#ffc107',
                  }}
                >
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
