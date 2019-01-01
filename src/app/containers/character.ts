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
/** number of frames spend in leaving state */
const LEAVING_DURATION = 60;

export class Character extends MovingContainer {
  private state = State.Entering;
  /** time spent in a state */
  private stateTime: number = 0;
  private rotateSpeed = 0;

  constructor(texture: Texture) {
    super(texture);

    // start state
    this.setZ(STARTING_ELEVATION);
    this.dz = -1;
  }

  public update(delta: number) {
    super.update(delta);
    switch (this.state) {
      case State.Entering:
        this.updateStarting(delta);
        break;
      case State.Leaving:
        this.updateLeaving(delta);
        break;
      default:
        break;
    }
  }

  /**
   * This character takes damage from another character.
   * Default behavior: fly away as if pushed by from
   * @param from Character that dealt damage to this character
   */
  public takeDamage(from?: Character): void {
    this.body.tint = 0xffeeee;
    if (!!from) {
      this.dx += from.dx + Math.random();
      this.dy += from.dy + Math.random();
    }
    this.setStateLeaving();
  }

  protected getState() {
    return this.state;
  }

  /**
   * Change to Leaving state
   */
  protected setStateLeaving() {
    this.stateTime = 0;
    this.state = State.Leaving;
    this.dz = 40;
    this.rotateSpeed = (Math.random()) - 0.5;
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

  /**
   * Fly away when in Leaving State
   * @param delta frame time
   */
  private updateLeaving(delta: number) {
    this.stateTime += delta;
    // TODO: explosion vfx
    if (this.stateTime >  LEAVING_DURATION) {
      this.state = State.Inactive;
      this.visible = false;
    }
    this.dz -= delta;
    this.body.rotation += this.rotateSpeed;
  }
}
