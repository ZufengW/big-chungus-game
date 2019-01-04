import {
  Texture,
} from '../pixi-alias';
import { IRespawnable } from './factory';
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

export class Character extends MovingContainer implements IRespawnable {
  private state = State.Entering;
  /** time spent in a state */
  private stateTime: number = 0;
  private rotateSpeed = 0;

  constructor(texture: Texture) {
    super(texture);
    this.init();
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

  public isInactive(): boolean {
    return this.state === State.Inactive;
  }

  /**
   * Resets a character to Entering without using new keyword
   * Should override this class
   */
  public init() {
    this.state = State.Entering;
    this.stateTime = 0;
    this.rotateSpeed = 0;
    this.visible = true;
    // reset displacement
    this.x = 0;
    this.y = 0;
    // reset velocity
    this.dx = 0;
    this.dy = 0;
    this.body.rotation = 0;
    // start in the sky
    this.setZ(STARTING_ELEVATION);
    this.dz = -1;
  }

  protected getState(): State {
    return this.state;
  }

  /** Returns whether or not current State is Active */
  protected isActive(): boolean {
    return this.state === State.Active;
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
    this.body.rotation += this.rotateSpeed;
  }
}
