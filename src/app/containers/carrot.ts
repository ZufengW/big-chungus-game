import { Texture } from '../pixi_alias';
import { IRespawnable } from './factory';
import { MovingContainer } from './moving_container';

/** Carrot's active substates */
enum ActiveState {
  Idle,
  Picked,
}

/** how long the carrot spends rising (frames) after being picked up */
const RAISE_DURATION = 30;
/** How quickly the carrot rises after being picked up */
const RAISE_SPEED = 3;
/** How long the carrot spends shrinking after rising */
const SHRINK_DURATION = 40;

/**
 * Carrot is a pickup. When picked up, moves to destination position.
 */
export class Carrot extends MovingContainer implements IRespawnable {

  private state: ActiveState = ActiveState.Idle;
  private stateTime: number = 0;

  /** the thing that picked it up */
  private picker: MovingContainer;
  /** called after picking up */
  private callback: (carrot: Carrot) => void;
  /** to remember the starting scale of the carrot when it was picked up */
  private pickUpScale: number;

  /**
   * Create a new Carrot
   * @param texture for body
   * @param callback called after the carrot is picked up.
   * Can still call cancelPickup during this callback to put the carrot back.
   */
  constructor(texture: Texture, callback: (carrot: Carrot) => void) {
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
    this.picker = null;
    this.visible = true;
  }

  public deactivate() {
    this.visible = false;
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
    if (!this.canPickUp()) {
      return;
    }
    this.state = ActiveState.Picked;
    this.stateTime = 0;
    this.picker = by;
    this.pickUpScale = this.scale.x;
  }

  public cancelPickUp() {
    this.picker = null;
  }

  /** Update picked up state
   * Raise and shrink animation.
   */
  private updatePicked(delta: number) {
    if (this.visible === false) {
      return;
    }
    let extraZ = 0;
    if (this.picker) {
      this.stateTime += delta;
      const newPos = this.picker.position;
      this.x = newPos.x;
      this.y = newPos.y + 5;
      extraZ = this.picker.getZ();
    } else {
      // undo the pickup (faster rate than picking up)
      this.stateTime -= delta * 2;
      if (this.stateTime < 0) {
        this.state = ActiveState.Idle;
        this.stateTime = 0;
      }
    }

    // (Mostly) a stateless function of stateTime...
    if (this.stateTime > RAISE_DURATION) {
      /** how long been shrinking for */
      const shrinkTime = this.stateTime - RAISE_DURATION;

      if (shrinkTime > SHRINK_DURATION) {
        // Finished shrinking. The callback is the last chance to deactivate.
        this.callback(this);
        if (this.picker) {
          this.deactivate();
        } else {
          // Cancel pick up
          this.stateTime -= delta;
        }
      } else {
        // shrink from this.pickUpScale down to to MovingContainer.MIN_SCALE
        const shrinkRatio = shrinkTime / SHRINK_DURATION;
        const shrinkAmount = (this.pickUpScale - MovingContainer.MIN_SCALE) * shrinkRatio;
        this.setScale(this.pickUpScale - shrinkAmount);
      }

      this.setZ(RAISE_DURATION * RAISE_SPEED + extraZ);
    } else {
      if (this.scale.x !== this.pickUpScale) {
        this.setScale(this.pickUpScale);
      }
      this.setZ(this.stateTime * RAISE_SPEED + extraZ);
    }
    this.dz = 0;  // Don't want this interfering with the animation
  }
}
