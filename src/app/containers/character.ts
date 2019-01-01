import {
  Texture,
} from '../pixi-alias';
import { MovingContainer } from './moving-container';

/** Character states */
export enum State {
  Entering,
  Active,
  Leaving,
  Inactive,
}

const STARTING_ELEVATION = 500;

export class Character extends MovingContainer {
  protected state = State.Entering;

  constructor(texture: Texture) {
    super(texture);

    // start state
    this.setZ(STARTING_ELEVATION);
    this.dz = -1;
  }

  public update(delta: number) {
    super.update(delta);
    if (this.state === State.Entering) {
      this.updateStarting(delta);
      return;
    }
  }

  /**
   * Accelerate downwards until hit ground. Then change state to Active.
   * @param delta frame time
   */
  private updateStarting(delta: number) {
    const z = this.getZ();
    if (z > 0) {
      this.dz -= delta;
      return;
    }
    this.state = State.Active;
  }

}
