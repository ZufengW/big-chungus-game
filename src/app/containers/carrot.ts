import { Texture } from '../pixi_alias';
import { IRespawnable } from './factory';
import { MovingContainer } from './moving_container';

/** Carrot's active substates */
enum ActiveState {
  Idle,
  Picked,
}

/** how long the carrot spends rising (frames) after being picked up */
const RAISE_DURATION = 40;
/** How quickly the carrot rises after being picked up */
const RAISE_SPEED = 3;
/** How quickly the carrot scales down after rising */
const SHRINK_SPEED = 0.00390625;

/**
 * Carrot is a pickup. When picked up, moves to destination position.
 */
export class Carrot extends MovingContainer implements IRespawnable {

  private state: ActiveState = ActiveState.Idle;
  private stateTime: number = 0;

  /** the thing that picked it up */
  private picker: MovingContainer;
  private callback: () => void;

  /**
   * Create a new Carrot
   * @param texture for body
   * @param callback called after picked up
   */
  constructor(texture: Texture, callback: () => void) {
    super(texture);
    this.init();
    this.callback = callback;
  }

  /**
   * Reset a Carrot.
   * Limitation: assume is a normal carrot
   */
  public init() {
    this.state = ActiveState.Idle;
    this.setScale(0.4);
    this.setZ(500);
    this.dx = 0;
    this.dy = 0;
    this.dz = -1;
    this.body.filters = [];
    this.visible = true;
  }

  public update(delta: number) {
    super.update(delta);
    if (this.state === ActiveState.Picked) {
      this.updatePicked(delta);
    }
  }

  public isInactive() {
    return !this.visible;
  }

  /** To save on collision checking
   * @return whether or not Carrot is allowed to be picked up
   */
  public canPickUp() {
    return this.state === ActiveState.Idle
        && this.visible
        && this.getZ() === 0;
  }

  /** Carrot gets picked up
   * @param by the thing that picks it up
   */
  public pickUp(by: MovingContainer) {
    // Change state
    this.state = ActiveState.Picked;
    this.stateTime = 0;
    this.picker = by;
  }

  /** Update picked up state
   * Raise and shrink animation.
   */
  private updatePicked(delta: number) {
    if (this.visible === false) {
      return;
    }
    this.stateTime += delta;

    // (Mostly) a function of stateTime...
    this.x = this.picker.x;
    this.y = this.picker.y + 5;
    if (this.stateTime > RAISE_DURATION) {
      /** shrink... */
      const shrinkTime = this.stateTime - RAISE_DURATION;
      const currentScale = this.scale.x;
      if (currentScale > MovingContainer.MIN_SCALE) {
        this.setScale(currentScale - shrinkTime * SHRINK_SPEED);
      } else {
        // Finished eating. Deactivate.
        this.setScale(0);
        this.visible = false;
        this.callback();
      }
      this.setZ(RAISE_DURATION * RAISE_SPEED + this.picker.getZ());
    } else {
      this.setZ(this.stateTime * RAISE_SPEED + this.picker.getZ());
    }
  }
}
