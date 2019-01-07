import {
  Texture,
} from '../pixi_alias';
import { MovingContainer } from './moving_container';

export class Treasure extends MovingContainer {
  public holder: MovingContainer = null;

  constructor(texture: Texture) {
    super(texture);
  }

  // update does nothing

  public postUpdate(delta: number) {
    if (this.holder) {
      // move to holder's position
      const pos = this.holder.position;
      this.position.set(pos.x + 8, pos.y + 8);
    }
  }
}
