import { useBackend } from '../backend';
import { Button, NoticeBox, Section, Table } from '../components';
import { Window } from '../layouts';

export const GulagItemReclaimer = (props) => {
  const { act, data } = useBackend();
  const { mobs = [] } = data;
  return (
    <Window width={325} height={400} theme="dragonfall">
      <Window.Content scrollable className="Shadowrun">
        {mobs.length === 0 && <NoticeBox>No stored items</NoticeBox>}
        {mobs.length > 0 && (
          <Section title="Stored Items">
            <Table>
              {mobs.map((mob) => (
                <Table.Row key={mob.mob}>
                  <Table.Cell>{mob.name}</Table.Cell>
                  <Table.Cell textAlign="right">
                    <Button
                      content="Retrieve Items"
                      disabled={!data.can_reclaim}
                      onClick={() =>
                        act('release_items', {
                          mobref: mob.mob,
                        })
                      }
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table>
          </Section>
        )}
      </Window.Content>
    </Window>
  );
};
