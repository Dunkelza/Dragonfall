import { Window } from '../layouts';
import { Newscaster } from './Newscaster';

export const PhysicalNewscaster = (props) => {
  return (
    <Window theme="dragonfall" width={575} height={560}>
      <Window.Content className="Shadowrun" scrollable>
        <Newscaster />
      </Window.Content>
    </Window>
  );
};
