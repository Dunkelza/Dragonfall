import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBackend, useLocalState } from '../../backend';
import {
  Box,
  Button,
  Dropdown,
  Icon,
  LabeledList,
  Stack,
  Tabs,
} from '../../components';
import { CharacterPreview } from './CharacterPreview';
import { PreferencesMenuData, ServerData } from './data';
import { MultiNameInput } from './names';
import features from './preferences/features';
import { FeatureValueInput } from './preferences/features/base';
import { ServerPreferencesFetcher } from './ServerPreferencesFetcher';
// Import extracted Shadowrun components
import {
  ChargenState,
  ComputationCacheProvider,
  DashboardTile,
  HintedLabel,
  MetatypeSelector,
  ProgressBar,
  SaveResetBar,
  ShadowrunTab,
  TabContentRouter,
  useAutoSaveDraft,
  useChargenValidation,
  useCompletionPercent,
  useDashboardData,
  useDerivedStats,
  useLocalDraftStorage,
  ValidationBadge,
} from './shadowrun';

// Wrapper component to fetch server data
export const ShadowrunPage = () => {
  return (
    <ServerPreferencesFetcher
      render={(serverData) => <ShadowrunPageInner serverData={serverData} />}
    />
  );
};

// Inner component that receives serverData
// eslint-disable-next-line complexity
const ShadowrunPageInner = (props: { serverData: ServerData | undefined }) => {
  const { serverData } = props;
  const { act, data } = useBackend<PreferencesMenuData>();

  // Calculate karma balance from selected quirks
  const karmaBalance = useMemo(() => {
    const selectedQuirks = data.selected_quirks || [];
    const quirkInfo = (serverData?.quirks as any)?.quirk_info || {};
    let balance = 0;
    for (const quirkName of selectedQuirks) {
      const quirk = quirkInfo[quirkName];
      if (quirk && typeof quirk.value === 'number') {
        // Server: negative value = positive quality (costs karma)
        //         positive value = negative quality (gives karma)
        // So we just add the value directly to get the balance
        balance += quirk.value;
      }
    }
    return balance;
  }, [data.selected_quirks, serverData?.quirks]);

  // Check if player has Biocompatibility quality (reduces essence cost by 10%)
  const hasBiocompatibility = useMemo(() => {
    const selectedQuirks = data.selected_quirks || [];
    const quirkInfo = (serverData?.quirks as any)?.quirk_info || {};
    for (const quirkKey of selectedQuirks) {
      const quirk = quirkInfo[quirkKey];
      if (quirk?.name === 'Biocompatibility') {
        return true;
      }
    }
    return false;
  }, [data.selected_quirks, serverData?.quirks]);

  // Extract chargen constant data from server preferences
  const chargenConstData = useMemo(() => {
    return (serverData?.['shadowrun_chargen'] as any) || null;
  }, [serverData]);

  // Field hints for tab labels
  const FIELD_HINTS: Record<string, string> = {
    Name: "Your runner's street name or legal alias. Use Alternate Names for additional identities.",
    Gender: 'Sets pronouns/body defaults where applicable.',
    Age: "Cosmetic: your runner's listed age.",
    SIN: 'Your System Identification Number (legit or forged). This is what Matrix records show.',
    Biometrics:
      'Physical characteristics: metatype features, skin/eyes/hair. These do not spend build points.',
    SINTab:
      'Your System Identification Number - the digital identity that defines who you are in the Sixth World. Configure name, personal data, and legal status.',
    JobsTab:
      'Select your assignment/role for the run. Determines your starting position and gear.',
    Religion:
      'Your spiritual beliefs or lack thereof. May affect roleplay interactions.',
    Birthplace: 'Where you were born or claim to be from on your SIN.',
    SINStatus:
      'Whether your SIN is legitimate, criminal, or forged. Affects how corps and law enforcement view you.',
  };

  // Defensive fallback: if server doesn't provide name_to_use, default to real_name
  const nameKey = data.name_to_use || 'real_name';
  const nameValue = data.character_preferences?.names?.[nameKey] || '';
  const nameLocked = !!data.name_locked;

  const [isEditingName, setIsEditingName] = useLocalState(
    `shadowrun_sheet_isEditingName_${data.active_slot}_${nameKey}`,
    false,
  );
  const [nameDraft, setNameDraft] = useLocalState(
    `shadowrun_sheet_nameDraft_${data.active_slot}_${nameKey}`,
    nameValue,
  );

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(nameValue);
    }
  }, [data.active_slot, nameKey, isEditingName, nameValue]);

  // BYOND focus/blur behavior can be inconsistent; ensure name edits reach the server
  // even if the user closes the window without "committing" the input.
  useEffect(() => {
    if (!isEditingName || nameLocked) {
      return;
    }

    const trimmedDraft = (nameDraft ?? '').trim();
    const trimmedServer = (nameValue ?? '').trim();
    if (!trimmedDraft || trimmedDraft === trimmedServer) {
      return;
    }

    const timeout = setTimeout(() => {
      act('set_preference', {
        preference: nameKey,
        value: trimmedDraft,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [act, nameKey, isEditingName, nameDraft, nameValue, nameLocked]);

  const [tab, setTab] = useLocalState<ShadowrunTab>(
    `shadowrun_sheet_tab_${data.active_slot}`,
    ShadowrunTab.Build,
  );

  const [multiNameInputOpen, setMultiNameInputOpen] = useLocalState(
    `shadowrun_sheet_multiNameInputOpen_${data.active_slot}`,
    false,
  );

  const prefMap = data.character_preferences?.secondary_features || {};
  const featureId = 'shadowrun_chargen';
  const feature = features[featureId];
  const serverValue = prefMap[featureId] as ChargenState | null;

  // Use the same optimistic state key that FeatureValueInput uses
  // This ensures we see the same value as the chargen component
  const [predictedValue, setPredictedValue] =
    useLocalState<ChargenState | null>(
      `${featureId}_predictedValue_${data.active_slot}`,
      serverValue as ChargenState | null,
    );

  // Track pending save to prevent useEffect from resetting optimistic update
  const pendingSaveRef = useRef(false);

  // Sync predictedValue with serverValue when server state changes
  // This ensures we pick up changes from the server (e.g., after save/load)
  useEffect(() => {
    // Only sync if server has a value and it's different from predicted
    if (serverValue !== undefined) {
      const serverSaved =
        serverValue &&
        typeof serverValue === 'object' &&
        (serverValue as any).saved;
      const predictedSaved =
        predictedValue &&
        typeof predictedValue === 'object' &&
        (predictedValue as any).saved;

      // DEBUG: Log state sync
      console.log('[SR5 Save Debug] useEffect triggered:', {
        serverSaved,
        predictedSaved,
        pendingSave: pendingSaveRef.current,
        willSync: serverSaved !== predictedSaved,
      });

      // If we have a pending save and server confirms saved, clear the flag
      if (pendingSaveRef.current && serverSaved) {
        console.log(
          '[SR5 Save Debug] Server confirmed save, clearing pending flag',
        );
        pendingSaveRef.current = false;
        // Don't sync - our optimistic update was correct
        return;
      }

      // If we have a pending save but server says not saved, wait for next update
      // This prevents resetting our optimistic update while server is processing
      if (pendingSaveRef.current && !serverSaved && predictedSaved) {
        console.log(
          '[SR5 Save Debug] Pending save, ignoring stale server state',
        );
        return;
      }

      // If server says saved but we don't, sync to server
      // If server says not saved but we do (after reset on server), sync to server
      if (serverSaved !== predictedSaved) {
        console.log('[SR5 Save Debug] Syncing predictedValue to serverValue');
        setPredictedValue(serverValue);
      }
    }
  }, [serverValue]);

  // Use predictedValue if available, otherwise fall back to server value
  const value = predictedValue ?? serverValue;

  const isSaved = Boolean(
    value && typeof value === 'object' && (value as any).saved,
  );

  // ========================================================================
  // LOCAL DRAFT STORAGE - Survives page refreshes
  // ========================================================================

  // State for showing draft recovery banner
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<ChargenState | null>(
    null,
  );

  // Handle draft loaded on mount
  const handleDraftLoaded = useCallback(
    (draft: ChargenState) => {
      // Only show recovery if there's meaningful data and sheet isn't saved
      if (draft && !draft.saved && !isSaved) {
        setRecoveredDraft(draft);
        setShowDraftRecovery(true);
      }
    },
    [isSaved],
  );

  // Local draft storage hook
  const {
    saveDraft,
    clearDraft,
    hasDraft,
    draftAge,
    isSupported: isDraftStorageSupported,
  } = useLocalDraftStorage({
    key: `slot_${data.active_slot}`,
    serverState: serverValue,
    onDraftLoaded: handleDraftLoaded,
  });

  // Auto-save draft on state changes
  useAutoSaveDraft(value as ChargenState | null, saveDraft, {
    enabled: isDraftStorageSupported && !isSaved,
  });

  // Restore draft handler
  const handleRestoreDraft = useCallback(() => {
    if (recoveredDraft) {
      setPredictedValue(recoveredDraft);
      act('set_preference', {
        preference: featureId,
        value: recoveredDraft,
      });
      setShowDraftRecovery(false);
      setRecoveredDraft(null);
    }
  }, [recoveredDraft, setPredictedValue, act, featureId]);

  // Dismiss draft handler
  const handleDismissDraft = useCallback(() => {
    setShowDraftRecovery(false);
    setRecoveredDraft(null);
    clearDraft();
  }, [clearDraft]);

  // Extract chargen state for dashboard and metatype selector
  const chargenState = useMemo(() => {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const v = value as any;
    return {
      priorities: v.priorities || {},
      attributes: v.attributes || {},
      skills: v.skills || {},
      skill_groups: v.skill_groups || {},
      skill_specializations: v.skill_specializations || {},
      special: v.special || {},
      awakening: v.awakening || 'mundane',
      metatype_species: v.metatype_species || '/datum/species/human',
      saved: v.saved || false,
      // Magic system
      tradition: v.tradition || '',
      mentor_spirit: v.mentor_spirit || '',
      selected_spells: v.selected_spells || [],
      selected_powers: v.selected_powers || {},
      selected_complex_forms: v.selected_complex_forms || [],
      // Knowledge system
      knowledge_skills: v.knowledge_skills || {},
      languages: v.languages || {},
      native_language: v.native_language || '',
      // Contacts system
      contacts: v.contacts || [],
      // SIN extended data
      sin_status: v.sin_status || 'legitimate',
      birthplace: v.birthplace || 'seattle',
      religion: v.religion || 'none',
      // Augments
      augments: v.augments || {},
      // Karma system
      karma_spent: v.karma_spent || 0,
      karma_purchases: v.karma_purchases || {},
      // Lifestyle
      lifestyle: v.lifestyle || 'low',
      // Starting gear
      gear: v.gear || [],
      // Drones (new format: { [droneId]: { mods: [] } }, but support legacy [] format)
      drones: v.drones || {},
      // Character notes/backstory
      character_notes: v.character_notes || {
        general: '',
        security_record: '',
        medical_record: '',
        exploitable_info: '',
      },
    };
  }, [value]);

  // Calculate point totals for dashboard (extracted to custom hook)
  const dashboardData = useDashboardData(
    chargenState,
    chargenConstData,
    hasBiocompatibility,
  );

  // Calculate derived stats for display (extracted to custom hook)
  const derivedStats = useDerivedStats(dashboardData, chargenState);

  // Calculate completion percentage (extracted to custom hook)
  const completionPercent = useCompletionPercent(dashboardData, isSaved);

  // Check if allocation is invalid (overspent)
  const isAllocationInvalid = useMemo(() => {
    if (!dashboardData) return false;
    return (
      dashboardData.attrRemaining < 0 ||
      dashboardData.skillRemaining < 0 ||
      dashboardData.specialRemaining < 0
    );
  }, [dashboardData]);

  // Comprehensive validation for character sheet (extracted to custom hook)
  const validation = useChargenValidation(dashboardData, chargenState);

  // Save sheet handler
  const onSaveSheet = () => {
    console.log('[SR5 Save Debug] onSaveSheet called:', {
      isSaved,
      canSave: validation.canSave,
      currentValueSaved: (value as any)?.saved,
    });

    if (isSaved || !validation.canSave) return;

    const nextValue = {
      ...(value as object),
      saved: true,
    } as ChargenState;

    // Set pending flag to prevent useEffect from resetting optimistic update
    console.log('[SR5 Save Debug] Setting pendingSaveRef to true');
    pendingSaveRef.current = true;

    console.log('[SR5 Save Debug] Setting predictedValue with saved=true');
    setPredictedValue(nextValue);
    console.log('[SR5 Save Debug] Sending act set_preference');
    act('set_preference', {
      preference: featureId,
      value: nextValue,
    });

    // Clear draft on successful save
    clearDraft();
  };

  // Reset all handler
  const onResetAll = () => {
    const nextValue: ChargenState = {
      priorities: {},
      attributes: {},
      skills: {},
      skill_groups: {},
      special: {},
      awakening: 'mundane',
      metatype_species: '/datum/species/human',
      saved: false,
      knowledge_skills: {},
      languages: {},
      native_language: '',
      contacts: [],
      selected_spells: [],
      selected_powers: {},
      selected_complex_forms: [],
      augments: {},
      // SIN data
      sin_status: 'legitimate',
      birthplace: 'seattle',
      religion: 'none',
      // Karma tracking
      karma_spent: 0,
    };

    setPredictedValue(nextValue);
    act('set_preference', {
      preference: featureId,
      value: nextValue,
    });

    // Clear draft on reset
    clearDraft();
  };

  const nonContextualPrefs = Object.fromEntries(
    Object.entries(data.character_preferences?.non_contextual || {}).filter(
      ([key]) => key !== 'random_body',
    ),
  );

  const allPrefs = {
    ...(data.character_preferences?.misc || {}),
    ...(data.character_preferences?.clothing || {}),
    ...(data.character_preferences?.features || {}),
    ...(data.character_preferences?.secondary_features || {}),
    ...nonContextualPrefs,
    ...(data.character_preferences?.supplemental_features || {}),
  } as Record<string, unknown>;

  const renderPreference = (preferenceId: string) => {
    if (preferenceId === 'random_body') {
      return null;
    }
    const feature = features[preferenceId];
    const prefValue = allPrefs[preferenceId];

    if (prefValue === undefined) {
      return null;
    }

    if (!feature) {
      return (
        <LabeledList.Item key={preferenceId} label={preferenceId}>
          <Box color="bad">Feature is not recognized.</Box>
        </LabeledList.Item>
      );
    }

    return (
      <LabeledList.Item key={preferenceId} label={feature.name}>
        <FeatureValueInput
          act={act}
          feature={feature}
          featureId={preferenceId}
          value={prefValue}
        />
      </LabeledList.Item>
    );
  };

  if (!feature) {
    return <Box>Feature {featureId} is not recognized.</Box>;
  }

  if (value === undefined) {
    return (
      <Box>
        Shadowrun character creation is not available for this character.
      </Box>
    );
  }

  return (
    <Box
      p={1}
      style={{
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(0, 255, 145, 0.25)',
        boxShadow: 'inset 0 0 0 1px rgba(0, 255, 145, 0.08)',
      }}
    >
      <Stack vertical fill>
        {/* Draft Recovery Banner */}
        {showDraftRecovery && recoveredDraft && (
          <Stack.Item>
            <Box
              style={{
                background:
                  'linear-gradient(135deg, rgba(79, 195, 247, 0.15), rgba(0, 0, 0, 0.4))',
                border: '1px solid rgba(79, 195, 247, 0.4)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
              }}
            >
              <Stack align="center">
                <Stack.Item>
                  <Icon
                    name="clock-rotate-left"
                    size={1.3}
                    color="#4fc3f7"
                    mr={0.75}
                  />
                </Stack.Item>
                <Stack.Item grow>
                  <Box
                    style={{
                      fontWeight: 'bold',
                      color: '#4fc3f7',
                    }}
                  >
                    Unsaved Draft Found
                  </Box>
                  <Box
                    style={{
                      fontSize: '0.8rem',
                      opacity: '0.7',
                    }}
                  >
                    A work-in-progress was saved {draftAge}. Would you like to
                    restore it?
                  </Box>
                </Stack.Item>
                <Stack.Item>
                  <Button icon="undo" color="good" onClick={handleRestoreDraft}>
                    Restore Draft
                  </Button>
                </Stack.Item>
                <Stack.Item ml={0.5}>
                  <Button
                    icon="times"
                    color="transparent"
                    onClick={handleDismissDraft}
                    tooltip="Discard saved draft"
                  />
                </Stack.Item>
              </Stack>
            </Box>
          </Stack.Item>
        )}

        {multiNameInputOpen && (
          <MultiNameInput
            handleClose={() => setMultiNameInputOpen(false)}
            handleRandomizeName={(preference) =>
              act('randomize_name', {
                preference,
              })
            }
            handleUpdateName={(nameType, value) =>
              act('set_preference', {
                preference: nameType,
                value,
              })
            }
            names={data.character_preferences.names}
          />
        )}

        <Stack.Item>
          <Stack>
            <Stack.Item>
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '6px',
                }}
              >
                <CharacterPreview
                  height="320px"
                  id={data.character_preview_view}
                />
                <Dropdown
                  width="220px"
                  mt={0.5}
                  position="relative"
                  selected={data.preview_selection}
                  options={data.preview_options}
                  onSelected={(value) =>
                    act('update_preview', {
                      updated_preview: value,
                    })
                  }
                />
              </Box>
            </Stack.Item>

            <Stack.Item grow>
              <Box
                className="PreferencesMenu__ShadowrunSheet"
                style={{
                  background: 'rgba(0, 0, 0, 0.15)',
                  padding: '8px',
                }}
              >
                <Stack vertical>
                  {/* Enhanced Header Banner */}
                  <Stack.Item>
                    <Box className="PreferencesMenu__ShadowrunSheet__header">
                      <Box className="PreferencesMenu__ShadowrunSheet__header__title">
                        RUNNER DOSSIER
                      </Box>
                      <Box className="PreferencesMenu__ShadowrunSheet__header__subtitle">
                        {nameDraft || 'Unknown Runner'}
                      </Box>
                      <Box className="PreferencesMenu__ShadowrunSheet__header__hint">
                        {isSaved ? (
                          <Box as="span" color="good">
                            <Icon name="check-circle" mr={0.5} />
                            Sheet saved and ready
                          </Box>
                        ) : (
                          'Configure your runner using the tabs below'
                        )}
                      </Box>
                    </Box>
                  </Stack.Item>

                  {/* Dashboard Tiles */}
                  {dashboardData && (
                    <Stack.Item>
                      <Box className="PreferencesMenu__ShadowrunSheet__dashboard">
                        <DashboardTile
                          icon="heart"
                          label="Essence"
                          value={dashboardData.essenceRemaining.toFixed(2)}
                          subtext={`of ${dashboardData.essenceTotal.toFixed(1)}`}
                          colorType="special"
                          status={
                            dashboardData.essenceRemaining < 1
                              ? 'bad'
                              : dashboardData.essenceRemaining < 3
                                ? 'warn'
                                : 'good'
                          }
                          tooltip={`Essence remaining after augmentations. Low essence affects magic and resonance.`}
                          showProgress
                          progressCurrent={dashboardData.essenceRemaining}
                          progressMax={dashboardData.essenceTotal}
                        />
                        <DashboardTile
                          icon="yin-yang"
                          label="Karma"
                          value={
                            karmaBalance >= 0
                              ? `+${karmaBalance}`
                              : karmaBalance
                          }
                          colorType={karmaBalance >= 0 ? 'mental' : 'physical'}
                          status={
                            karmaBalance < 0
                              ? 'bad'
                              : karmaBalance > 0
                                ? 'good'
                                : 'neutral'
                          }
                          tooltip={`Net karma from qualities. Positive = you have karma to spend. Negative = over budget.`}
                        />
                        <DashboardTile
                          icon="coins"
                          label="Nuyen"
                          value={`¥${dashboardData.nuyenRemaining.toLocaleString()}`}
                          subtext={`of ¥${dashboardData.resources.toLocaleString()}`}
                          colorType="resources"
                          status={
                            dashboardData.nuyenRemaining < 0
                              ? 'bad'
                              : dashboardData.nuyenRemaining <
                                  dashboardData.resources * 0.25
                                ? 'warn'
                                : 'good'
                          }
                          tooltip={`¥${dashboardData.augmentNuyenSpent?.toLocaleString() || 0} augments + ¥${dashboardData.gearNuyenSpent?.toLocaleString() || 0} gear + ¥${dashboardData.lifestyleCost?.toLocaleString() || 0} lifestyle + ¥${dashboardData.droneNuyenSpent?.toLocaleString() || 0} drones = ¥${dashboardData.nuyenSpent.toLocaleString()} spent`}
                          showProgress
                          progressCurrent={dashboardData.nuyenRemaining}
                          progressMax={dashboardData.resources}
                        />
                      </Box>

                      {/* Progress Bar */}
                      <Box mb={1}>
                        <Stack align="center">
                          <Stack.Item grow>
                            <ProgressBar value={completionPercent} max={100} />
                          </Stack.Item>
                          <Stack.Item ml={1}>
                            <Box
                              color={
                                completionPercent >= 80
                                  ? 'good'
                                  : completionPercent >= 40
                                    ? 'average'
                                    : 'grey'
                              }
                              bold
                            >
                              {completionPercent}%
                            </Box>
                          </Stack.Item>
                        </Stack>
                      </Box>
                    </Stack.Item>
                  )}

                  {/* Save/Reset Actions */}
                  <Stack.Item>
                    <SaveResetBar
                      isSaved={isSaved}
                      validation={validation}
                      onResetAll={onResetAll}
                      onSaveSheet={onSaveSheet}
                      onNavigateToSection={setTab}
                    />
                  </Stack.Item>

                  {/* Tabs with Validation Badges */}
                  <Stack.Item>
                    <Tabs
                      fluid
                      className="PreferencesMenu__ShadowrunSheet__tabs"
                    >
                      <Tabs.Tab
                        icon="sliders-h"
                        selected={tab === ShadowrunTab.Build}
                        onClick={() => setTab(ShadowrunTab.Build)}
                      >
                        <HintedLabel
                          text="Build"
                          hint="Set your priority selections, allocate attribute and skill points."
                        />
                        <ValidationBadge
                          status={
                            validation.issues.some(
                              (i) =>
                                (i.section === 'attributes' ||
                                  i.section === 'skills' ||
                                  i.section === 'special') &&
                                i.severity === 'error',
                            )
                              ? 'bad'
                              : isSaved
                                ? 'good'
                                : validation.issues.some(
                                      (i) =>
                                        i.section === 'attributes' ||
                                        i.section === 'skills' ||
                                        i.section === 'special',
                                    )
                                  ? 'warn'
                                  : 'none'
                          }
                        />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="id-card"
                        selected={tab === ShadowrunTab.Core}
                        onClick={() => setTab(ShadowrunTab.Core)}
                      >
                        <HintedLabel text="SIN" hint={FIELD_HINTS.SINTab} />
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="hat-wizard"
                        selected={tab === ShadowrunTab.Magic}
                        onClick={() => setTab(ShadowrunTab.Magic)}
                      >
                        <HintedLabel
                          text="Magic"
                          hint="Configure magical traditions, spells, adept powers, and mentor spirits for awakened characters."
                        />
                        <ValidationBadge
                          status={
                            validation.issues.some(
                              (i) =>
                                i.section === 'magic' && i.severity === 'error',
                            )
                              ? 'bad'
                              : isSaved
                                ? 'good'
                                : validation.issues.some(
                                      (i) => i.section === 'magic',
                                    )
                                  ? 'warn'
                                  : 'none'
                          }
                        />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="address-book"
                        selected={tab === ShadowrunTab.Connections}
                        onClick={() => setTab(ShadowrunTab.Connections)}
                      >
                        <HintedLabel
                          text="Connections"
                          hint="Knowledge skills, languages, and contacts that represent your character's social network and expertise."
                        />
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="microchip"
                        selected={tab === ShadowrunTab.Augments}
                        onClick={() => setTab(ShadowrunTab.Augments)}
                      >
                        Augments
                        <ValidationBadge
                          status={
                            validation.issues.some(
                              (i) =>
                                i.section === 'augments' &&
                                i.severity === 'error',
                            )
                              ? 'bad'
                              : isSaved
                                ? 'good'
                                : 'none'
                          }
                        />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="id-badge"
                        selected={tab === ShadowrunTab.Occupations}
                        onClick={() => setTab(ShadowrunTab.Occupations)}
                      >
                        <HintedLabel text="Jobs" hint={FIELD_HINTS.JobsTab} />
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="shopping-cart"
                        selected={tab === ShadowrunTab.Gear}
                        onClick={() => setTab(ShadowrunTab.Gear)}
                      >
                        <HintedLabel
                          text="Gear"
                          hint="Purchase starting equipment with your nuyen. Weapons, armor, electronics, and more."
                        />
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="robot"
                        selected={tab === ShadowrunTab.Drones}
                        onClick={() => setTab(ShadowrunTab.Drones)}
                      >
                        <HintedLabel
                          text="Drones"
                          hint="Purchase and customize drones for surveillance, combat, and utility operations."
                        />
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="star"
                        selected={tab === ShadowrunTab.Qualities}
                        onClick={() => setTab(ShadowrunTab.Qualities)}
                      >
                        <HintedLabel
                          text="Qualities"
                          hint="Positive and negative qualities that define your character's edges and flaws. Positive qualities cost karma, negative ones give karma."
                        />
                        <ValidationBadge status={isSaved ? 'good' : 'none'} />
                      </Tabs.Tab>
                      <Tabs.Tab
                        icon="clipboard-list"
                        selected={tab === ShadowrunTab.Summary}
                        onClick={() => setTab(ShadowrunTab.Summary)}
                      >
                        <HintedLabel
                          text="Summary"
                          hint="Complete overview of your character build with validation status."
                        />
                        <ValidationBadge
                          status={
                            validation.errorCount > 0
                              ? 'bad'
                              : validation.warningCount > 0
                                ? 'warn'
                                : isSaved
                                  ? 'good'
                                  : 'none'
                          }
                        />
                      </Tabs.Tab>
                    </Tabs>
                  </Stack.Item>

                  {/* Tab Content with Animation */}
                  <Box className="PreferencesMenu__ShadowrunSheet__tabContent">
                    <ComputationCacheProvider>
                      <TabContentRouter
                        act={act}
                        chargenConstData={chargenConstData}
                        chargenState={chargenState}
                        dashboardData={dashboardData}
                        data={data}
                        derivedStats={derivedStats}
                        featureId={featureId}
                        hasBiocompatibility={hasBiocompatibility}
                        isEditingName={isEditingName}
                        isSaved={isSaved}
                        MetatypeSelector={MetatypeSelector}
                        multiNameInputOpen={multiNameInputOpen}
                        nameDraft={nameDraft}
                        nameKey={nameKey}
                        nameLocked={nameLocked}
                        renderPreference={renderPreference}
                        setIsEditingName={setIsEditingName}
                        setMultiNameInputOpen={setMultiNameInputOpen}
                        setNameDraft={setNameDraft}
                        setPredictedValue={setPredictedValue}
                        tab={tab}
                        validation={validation}
                        value={value}
                      />
                    </ComputationCacheProvider>
                  </Box>
                </Stack>
              </Box>
            </Stack.Item>
          </Stack>
        </Stack.Item>
      </Stack>
    </Box>
  );
};
