import { exhaustiveCheck } from 'common/exhaustive';

import { useBackend, useLocalState } from '../../backend';
import { Dropdown, Flex, Stack } from '../../components';
import { Window } from '../../layouts';
import { AntagsPage } from './AntagsPage';
import { PreferencesMenuData } from './data';
import { PageButton } from './PageButton';
import { ShadowrunPage } from './ShadowrunPage';

enum Page {
  Antags,
  Shadowrun,
}

const CharacterProfiles = (props: {
  activeSlot: number;
  onClick: (index: number) => void;
  profiles?: (string | null)[];
}) => {
  const profiles = props.profiles || [];
  const activeSlot = Math.max(
    0,
    Math.min(props.activeSlot, profiles.length - 1),
  );
  const { onClick } = props;

  if (profiles.length === 0) {
    return null;
  }

  return (
    <Flex justify="center">
      <Flex.Item width="25%">
        <Dropdown
          width="100%"
          displayText={profiles[activeSlot]}
          options={profiles.map((profile, slot) => ({
            value: slot,
            displayText: profile ?? 'New Character',
          }))}
          onSelected={(slot) => {
            onClick(slot);
          }}
        />
      </Flex.Item>
    </Flex>
  );
};

export const CharacterPreferenceWindow = (props) => {
  const { act, data } = useBackend<PreferencesMenuData>();

  const [currentPage, setCurrentPage] = useLocalState(
    'currentPage',
    Page.Shadowrun,
  );

  let pageContents;

  switch (currentPage) {
    case Page.Antags:
      pageContents = <AntagsPage />;
      break;
    case Page.Shadowrun:
      pageContents = <ShadowrunPage />;
      break;
    default:
      exhaustiveCheck(currentPage);
  }

  return (
    <Window
      title="Runner Dossier"
      theme="ntos_darkmode"
      width={920}
      height={770}
    >
      <Window.Content scrollable className="PreferencesMenu__ShadowrunSheet">
        <Stack vertical fill>
          <Stack.Item>
            <CharacterProfiles
              activeSlot={data.active_slot - 1}
              onClick={(slot) => {
                act('change_slot', {
                  slot: slot + 1,
                });
              }}
              profiles={data.character_profiles || []}
            />
          </Stack.Item>

          {!data.content_unlocked && (
            <Stack.Item align="center">
              BYOND membership unlocks additional runner dossiers.
            </Stack.Item>
          )}

          <Stack.Divider />

          <Stack.Item>
            <Stack fill>
              <Stack.Item grow>
                <PageButton
                  currentPage={currentPage}
                  page={Page.Shadowrun}
                  setPage={setCurrentPage}
                >
                  Character Sheet
                </PageButton>
              </Stack.Item>

              <Stack.Item grow>
                <PageButton
                  currentPage={currentPage}
                  page={Page.Antags}
                  setPage={setCurrentPage}
                >
                  Threat Profile
                </PageButton>
              </Stack.Item>
            </Stack>
          </Stack.Item>

          <Stack.Divider />

          <Stack.Item>{pageContents}</Stack.Item>
        </Stack>
      </Window.Content>
    </Window>
  );
};
