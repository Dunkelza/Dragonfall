/**
 * Contacts Selector Component
 *
 * Handles contact creation and management for character generation.
 */

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

export const ContactsSelector = (props: ContactsSelectorProps) => {
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
    <Box className="PreferencesMenu__ShadowrunSheet__contactsSelector">
      {!embedded && (
        <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header">
          <Icon
            name="users"
            className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__icon"
          />
          <Box className="PreferencesMenu__ShadowrunSheet__sidebarSection__header__title">
            Contacts ({spentPoints}/{maxContactPoints})
          </Box>
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

      {/* Current Contacts */}
      {contacts.length > 0 && (
        <Box mt={0.5}>
          {contacts.map((contact: Contact, index: number) => {
            const contactType = contactTypes.find(
              (ct: ContactTypeMeta) => ct.id === contact.type_id,
            );
            return (
              <Box
                key={index}
                className="PreferencesMenu__ShadowrunSheet__contactItem"
                style={{
                  marginBottom: '0.25rem',
                  opacity: isSaved ? '0.6' : '1',
                }}
              >
                <Stack vertical>
                  <Stack.Item>
                    <Stack align="center">
                      <Stack.Item grow>
                        <Input
                          placeholder="Contact name"
                          value={contact.name || ''}
                          disabled={isSaved}
                          width="100%"
                          onChange={(_, v) =>
                            handleUpdateContact(index, 'name', v)
                          }
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="times"
                          color="bad"
                          compact
                          disabled={isSaved}
                          onClick={() => handleRemoveContact(index)}
                          style={{ minWidth: '1.2rem', fontSize: '0.6rem' }}
                        />
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                  <Stack.Item>
                    <Box
                      style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {contactType?.profession || 'Contact'}
                    </Box>
                  </Stack.Item>
                  <Stack.Item>
                    <Stack align="center">
                      <Stack.Item>
                        <Tooltip content="Connection: How useful/powerful (1-12)">
                          <Box
                            as="span"
                            style={{
                              fontSize: '0.7rem',
                              cursor: 'help',
                            }}
                          >
                            C:
                          </Box>
                        </Tooltip>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="minus"
                          compact
                          disabled={isSaved || contact.connection <= 1}
                          onClick={() =>
                            handleUpdateContact(index, 'connection', -1)
                          }
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            minWidth: '1rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          {contact.connection || 1}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
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
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item ml={1}>
                        <Tooltip content="Loyalty: How much they like you (1-6)">
                          <Box
                            as="span"
                            style={{
                              fontSize: '0.7rem',
                              cursor: 'help',
                            }}
                          >
                            L:
                          </Box>
                        </Tooltip>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          icon="minus"
                          compact
                          disabled={isSaved || contact.loyalty <= 1}
                          onClick={() =>
                            handleUpdateContact(index, 'loyalty', -1)
                          }
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
                          }}
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Box
                          style={{
                            minWidth: '1rem',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          {contact.loyalty || 1}
                        </Box>
                      </Stack.Item>
                      <Stack.Item>
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
                          style={{
                            minWidth: '1rem',
                            padding: '0.1rem',
                            fontSize: '0.6rem',
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
      )}

      {/* Add New Contact */}
      <CollapsibleSection
        title="Add Contact"
        icon="user-plus"
        stateKey="sr_add_contact"
        defaultOpen={contacts.length === 0}
      >
        <Tabs fluid>
          {Object.keys(typesByArchetype).map((arch) => (
            <Tabs.Tab
              key={arch}
              selected={selectedArchetype === arch}
              onClick={() => setSelectedArchetype(arch)}
            >
              {arch.charAt(0).toUpperCase() + arch.slice(1)}
            </Tabs.Tab>
          ))}
        </Tabs>
        <Box
          style={{
            maxHeight: '8rem',
            overflowY: 'auto',
            marginTop: '0.25rem',
          }}
        >
          {(typesByArchetype[selectedArchetype] || []).map(
            (ct: ContactTypeMeta) => (
              <Tooltip key={ct.id} content={ct.specialty} position="right">
                <Box
                  className="PreferencesMenu__ShadowrunSheet__contactTypeItem"
                  onClick={() => handleAddContact(ct.id)}
                  style={{
                    cursor:
                      isSaved || spentPoints + 2 > maxContactPoints
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      isSaved || spentPoints + 2 > maxContactPoints
                        ? '0.5'
                        : '1',
                  }}
                >
                  <Stack align="center">
                    <Stack.Item grow>
                      <Box style={{ fontSize: '0.75rem' }}>{ct.name}</Box>
                      <Box
                        style={{
                          fontSize: '0.65rem',
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {ct.profession}
                      </Box>
                    </Stack.Item>
                    <Stack.Item>
                      <Icon name="plus" size={0.8} />
                    </Stack.Item>
                  </Stack>
                </Box>
              </Tooltip>
            ),
          )}
        </Box>
      </CollapsibleSection>
    </Box>
  );
};
