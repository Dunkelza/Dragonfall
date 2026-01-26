/**
 * Contacts Selector Component
 *
 * Handles contact creation and management for character generation.
 */

import { memo } from 'react';
import { Tooltip } from 'tgui-core/components';

import { useLocalState } from '../../../backend';
import { Box, Button, Icon, Input, Stack, Tabs } from '../../../components';
import { CollapsibleSection } from './components';
import {
  AttributeMeta,
  ChargenConstData,
  ChargenState,
  Contact,
  ContactTypeMeta,
} from './types';

// === ACCENT COLORS ===
const ACCENT_YELLOW = '#f1c40f';
const ACCENT_YELLOW_DIM = 'rgba(241, 196, 15, 0.15)';
const ACCENT_YELLOW_BORDER = 'rgba(241, 196, 15, 0.4)';
const SUCCESS_GREEN = '#4caf50';
const DANGER_RED = '#ff6b6b';
const CONNECTION_COLOR = '#4fc3f7';
const LOYALTY_COLOR = '#e91e63';

type ContactsSelectorProps = {
  act: (action: string, payload?: Record<string, unknown>) => void;
  chargenConstData: ChargenConstData | null;
  chargenState: ChargenState | null;
  embedded?: boolean;
  featureId: string;
  isSaved: boolean;
  setPredictedValue: (value: ChargenState) => void;
  value: ChargenState | null;
};

export const ContactsSelector = memo((props: ContactsSelectorProps) => {
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

  // Get CHA for contact points calculation
  const getAttrValue = (name: string) => {
    const attrs = chargenConstData.attributes || [];
    const meta = attrs.find(
      (a: AttributeMeta) =>
        a.name?.toLowerCase() === name.toLowerCase() ||
        a.id?.toLowerCase().includes(name.toLowerCase()),
    );
    if (!meta) return 1;
    return chargenState.attributes?.[meta.id] ?? meta.min ?? 1;
  };

  const charisma = getAttrValue('charisma');
  const maxContactPoints = charisma * 3;

  const contactTypes = chargenConstData.contact_types || [];
  const contacts = chargenState.contacts || [];

  // Calculate spent points
  const spentPoints = contacts.reduce(
    (sum: number, c: Contact) => sum + (c.connection || 1) + (c.loyalty || 1),
    0,
  );

  // Group contact types by archetype
  const typesByArchetype = contactTypes.reduce(
    (acc: Record<string, ContactTypeMeta[]>, ct: ContactTypeMeta) => {
      const arch = ct.archetype || 'general';
      if (!acc[arch]) acc[arch] = [];
      acc[arch].push(ct);
      return acc;
    },
    {},
  );

  const [selectedArchetype, setSelectedArchetype] = useLocalState(
    'sr_contact_arch',
    'fixer',
  );

  // Points remaining
  const pointsRemaining = maxContactPoints - spentPoints;

  // Get archetype icon
  const getArchetypeIcon = (arch: string) => {
    const icons: Record<string, string> = {
      fixer: 'handshake',
      street: 'road',
      corporate: 'building',
      underworld: 'skull',
      government: 'landmark',
      academic: 'graduation-cap',
      medical: 'user-md',
      military: 'crosshairs',
      media: 'newspaper',
      default: 'user',
    };
    return icons[arch] || icons.default;
  };

  const handleAddContact = (typeId: string) => {
    if (isSaved) return;

    // Default connection 1, loyalty 1 = 2 points
    if (spentPoints + 2 > maxContactPoints) return;

    const contactType = contactTypes.find(
      (ct: ContactTypeMeta) => ct.id === typeId,
    );
    const newContact = {
      type_id: typeId,
      connection: 1,
      loyalty: 1,
      name: contactType?.name || 'Contact',
    };

    const newContacts = [...contacts, newContact];
    const newState = {
      ...value!,
      contacts: newContacts,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleRemoveContact = (index: number) => {
    if (isSaved) return;

    const newContacts = contacts.filter((_: Contact, i: number) => i !== index);
    const newState = {
      ...value!,
      contacts: newContacts,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  const handleUpdateContact = (
    index: number,
    field: 'connection' | 'loyalty' | 'name',
    delta: number | string,
  ) => {
    if (isSaved) return;

    const contact = contacts[index];
    if (!contact) return;

    const newContacts = [...contacts];
    if (field === 'name') {
      newContacts[index] = { ...contact, name: String(delta) };
    } else {
      const currentValue = contact[field] || 1;
      const maxValue = field === 'connection' ? 12 : 6;
      const newValue = Math.max(
        1,
        Math.min(maxValue, currentValue + (delta as number)),
      );
      const costDelta = delta as number;
      if (costDelta > 0 && spentPoints + costDelta > maxContactPoints) return;
      newContacts[index] = { ...contact, [field]: newValue };
    }

    const newState = {
      ...value!,
      contacts: newContacts,
    };

    setPredictedValue(newState);
    act('set_preference', {
      preference: featureId,
      value: newState,
    });
  };

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${ACCENT_YELLOW_DIM}, rgba(0, 0, 0, 0.4))`,
        borderRadius: '8px',
        border: `1px solid ${ACCENT_YELLOW_BORDER}`,
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
          background: `linear-gradient(135deg, transparent 50%, ${ACCENT_YELLOW_DIM} 50%)`,
          opacity: '0.5',
        }}
      />

      {/* Header */}
      {!embedded && (
        <Box style={{ marginBottom: '1rem' }}>
          <Stack align="center" justify="space-between">
            <Stack.Item>
              <Box
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: ACCENT_YELLOW,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="users" />
                Contacts Network
                {contacts.length > 0 && (
                  <Box
                    as="span"
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.2rem 0.5rem',
                      background: ACCENT_YELLOW_DIM,
                      border: `1px solid ${ACCENT_YELLOW_BORDER}`,
                      borderRadius: '10px',
                      marginLeft: '0.5rem',
                    }}
                  >
                    {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                  </Box>
                )}
              </Box>
            </Stack.Item>
          </Stack>
        </Box>
      )}

      {embedded && (
        <CollapsibleSection
          title={`Contacts (${spentPoints}/${maxContactPoints} points)`}
          icon="users"
          stateKey="sr_contacts_embedded"
          defaultOpen
        >
          <Box style={{ marginTop: '-0.5rem' }} />
        </CollapsibleSection>
      )}

      {/* Points Display Card */}
      <Box
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderLeft: `3px solid ${pointsRemaining <= 0 ? DANGER_RED : ACCENT_YELLOW}`,
        }}
      >
        <Stack align="center" justify="space-between">
          <Stack.Item>
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon
                name="star"
                style={{
                  color: ACCENT_YELLOW,
                  fontSize: '1.2rem',
                }}
              />
              <Box>
                <Box
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Contact Points
                </Box>
                <Box
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    color: pointsRemaining <= 0 ? DANGER_RED : ACCENT_YELLOW,
                  }}
                >
                  {pointsRemaining} / {maxContactPoints}
                </Box>
              </Box>
            </Box>
          </Stack.Item>
          <Stack.Item>
            <Box style={{ textAlign: 'right' }}>
              <Box
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                Based on CHA × 3
              </Box>
              <Box
                style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                CHA: {charisma}
              </Box>
            </Box>
          </Stack.Item>
        </Stack>
        {/* Progress bar */}
        <Box
          style={{
            marginTop: '0.5rem',
            height: '4px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              width: `${Math.min(100, (spentPoints / maxContactPoints) * 100)}%`,
              height: '100%',
              background:
                pointsRemaining <= 0
                  ? `linear-gradient(90deg, ${DANGER_RED}, #ff8888)`
                  : `linear-gradient(90deg, ${ACCENT_YELLOW}, #f39c12)`,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Box>

      {/* Current Contacts */}
      {contacts.length > 0 && (
        <Box
          style={{
            flexGrow: '1',
            overflow: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '6px',
            padding: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <Box
            style={{
              fontWeight: 'bold',
              color: ACCENT_YELLOW,
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Icon name="address-book" />
            Your Contacts
          </Box>
          {contacts.map((contact: Contact, index: number) => {
            const contactType = contactTypes.find(
              (ct: ContactTypeMeta) => ct.id === contact.type_id,
            );
            const contactCost =
              (contact.connection || 1) + (contact.loyalty || 1);

            return (
              <Box
                key={index}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${ACCENT_YELLOW}`,
                  opacity: isSaved ? '0.6' : '1',
                }}
              >
                <Stack vertical>
                  {/* Name and Remove */}
                  <Stack.Item>
                    <Stack align="center">
                      <Stack.Item grow>
                        <Input
                          placeholder="Contact name"
                          value={contact.name || ''}
                          disabled={isSaved}
                          fluid
                          onChange={(_, v) =>
                            handleUpdateContact(index, 'name', v)
                          }
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: `1px solid ${ACCENT_YELLOW_BORDER}`,
                            borderRadius: '4px',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item ml={0.5}>
                        <Box
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.4rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            color: ACCENT_YELLOW,
                          }}
                        >
                          {contactCost} pts
                        </Box>
                      </Stack.Item>
                      <Stack.Item ml={0.25}>
                        <Button
                          icon="times"
                          color="bad"
                          compact
                          disabled={isSaved}
                          onClick={() => handleRemoveContact(index)}
                        />
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>

                  {/* Type/Profession */}
                  <Stack.Item>
                    <Box
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginTop: '0.25rem',
                      }}
                    >
                      <Icon name="briefcase" mr={0.5} />
                      {contactType?.profession || 'Contact'}
                    </Box>
                  </Stack.Item>

                  {/* Connection and Loyalty Controls */}
                  <Stack.Item>
                    <Stack align="center" mt={0.5}>
                      {/* Connection */}
                      <Stack.Item>
                        <Box
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: `1px solid rgba(79, 195, 247, 0.3)`,
                          }}
                        >
                          <Tooltip content="Connection: How useful/powerful (1-12)">
                            <Box
                              as="span"
                              style={{
                                fontSize: '0.75rem',
                                color: CONNECTION_COLOR,
                                cursor: 'help',
                                fontWeight: 'bold',
                              }}
                            >
                              <Icon name="network-wired" mr={0.25} />
                              CON
                            </Box>
                          </Tooltip>
                          <Button
                            icon="minus"
                            compact
                            disabled={isSaved || contact.connection <= 1}
                            onClick={() =>
                              handleUpdateContact(index, 'connection', -1)
                            }
                            style={{ padding: '0.15rem 0.25rem' }}
                          />
                          <Box
                            style={{
                              minWidth: '1.5rem',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: CONNECTION_COLOR,
                            }}
                          >
                            {contact.connection || 1}
                          </Box>
                          <Button
                            icon="plus"
                            compact
                            disabled={
                              isSaved ||
                              contact.connection >= 12 ||
                              spentPoints >= maxContactPoints
                            }
                            onClick={() =>
                              handleUpdateContact(index, 'connection', 1)
                            }
                            style={{ padding: '0.15rem 0.25rem' }}
                          />
                        </Box>
                      </Stack.Item>

                      {/* Loyalty */}
                      <Stack.Item ml={0.5}>
                        <Box
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: `1px solid rgba(233, 30, 99, 0.3)`,
                          }}
                        >
                          <Tooltip content="Loyalty: How much they like you (1-6)">
                            <Box
                              as="span"
                              style={{
                                fontSize: '0.75rem',
                                color: LOYALTY_COLOR,
                                cursor: 'help',
                                fontWeight: 'bold',
                              }}
                            >
                              <Icon name="heart" mr={0.25} />
                              LOY
                            </Box>
                          </Tooltip>
                          <Button
                            icon="minus"
                            compact
                            disabled={isSaved || contact.loyalty <= 1}
                            onClick={() =>
                              handleUpdateContact(index, 'loyalty', -1)
                            }
                            style={{ padding: '0.15rem 0.25rem' }}
                          />
                          <Box
                            style={{
                              minWidth: '1.5rem',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: LOYALTY_COLOR,
                            }}
                          >
                            {contact.loyalty || 1}
                          </Box>
                          <Button
                            icon="plus"
                            compact
                            disabled={
                              isSaved ||
                              contact.loyalty >= 6 ||
                              spentPoints >= maxContactPoints
                            }
                            onClick={() =>
                              handleUpdateContact(index, 'loyalty', 1)
                            }
                            style={{ padding: '0.15rem 0.25rem' }}
                          />
                        </Box>
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Add New Contact */}
      <Box
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          padding: '0.75rem',
          borderLeft: `3px solid ${SUCCESS_GREEN}`,
        }}
      >
        <Box
          style={{
            fontWeight: 'bold',
            color: SUCCESS_GREEN,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Icon name="user-plus" />
          Add Contact
          <Box
            as="span"
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 'normal',
            }}
          >
            (2 points each)
          </Box>
        </Box>

        {/* Archetype Tabs */}
        <Box style={{ marginBottom: '0.5rem' }}>
          <Tabs fluid>
            {Object.keys(typesByArchetype).map((arch) => {
              const isActive = selectedArchetype === arch;
              return (
                <Tabs.Tab
                  key={arch}
                  selected={isActive}
                  onClick={() => setSelectedArchetype(arch)}
                  style={{
                    ...(isActive && {
                      background: ACCENT_YELLOW_DIM,
                      borderBottom: `2px solid ${ACCENT_YELLOW}`,
                    }),
                  }}
                >
                  <Icon name={getArchetypeIcon(arch)} mr={0.5} />
                  {arch.charAt(0).toUpperCase() + arch.slice(1)}
                </Tabs.Tab>
              );
            })}
          </Tabs>
        </Box>

        {/* Contact Types Grid */}
        <Box
          style={{
            maxHeight: '150px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            padding: '0.5rem',
          }}
        >
          {(typesByArchetype[selectedArchetype] || []).map(
            (ct: ContactTypeMeta) => {
              const canAdd = !isSaved && spentPoints + 2 <= maxContactPoints;
              return (
                <Tooltip key={ct.id} content={ct.specialty} position="right">
                  <Box
                    onClick={() => canAdd && handleAddContact(ct.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.35rem',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '4px',
                      borderLeft: `3px solid transparent`,
                      cursor: canAdd ? 'pointer' : 'not-allowed',
                      opacity: canAdd ? '1' : '0.5',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Stack align="center">
                      <Stack.Item grow>
                        <Box
                          style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                        >
                          {ct.name}
                        </Box>
                        <Box
                          style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          {ct.profession}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
                        <Icon
                          name="plus-circle"
                          size={1.1}
                          style={{
                            color: canAdd
                              ? SUCCESS_GREEN
                              : 'rgba(255,255,255,0.3)',
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
      </Box>
    </Box>
  );
});
