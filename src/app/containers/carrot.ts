import { lengthSquared, normalise, pointTo } from '../helpers';
import {
  Point,
  Texture,
} from '../pixi_alias';
import { IRespawnable } from './factory';
import { MovingContainer } from './moving_container';

/** Carrot's active substates */
enum ActiveState {
  Idle,
  Moving,
}

/** for moving to global pos */
const MOVE_SPEED = 12;

const DIST_THRESHOLD = 16;

/**
 * Carrot is a pickup. When picked up, moves to destination position.
 */
export class Carrot extends MovingContainer implements IRespawnable {
  /** Where to move after being picked up */
  public static destPos: Point = new Point(60, 60);

  private state: ActiveState = ActiveState.Idle;

  constructor(texture: Texture, power: boolean = false) {
    super(texture);
    this.init();
  }

  /**
   * Reset a Carrot.
   * Limitation: assume is a normal carrot
   */
  public init() {
    this.state = ActiveState.Idle;
    this.setScale(0.4);
    this.body.tint = 0xffffff;
    this.setZ(500);
    this.dx = 0;
    this.dy = 0;
    this.dz = -1;
    this.visible = true;
    this.setShadowVisibility(true);
  }

  public update(delta: number) {
    super.update(delta);
    if (this.state === ActiveState.Moving) {
      this.updateMoving(delta);
    }
  }

  public isInactive() {
    return !this.visible;
  }

  /** to save on collision checking
   * @return whether or not Carrot is allowed to be picked up
   */
  public canPickUp() {
    return this.state === ActiveState.Idle && this.visible;
  }

  /** Carrot gets consumed */
  public pickUp() {
    // Change state
    this.state = ActiveState.Moving;
    this.setShadowVisibility(false);
  }

  private updateMoving(delta: number) {
    // calculate direction
    const [xDiff, yDiff] = pointTo(this.getGlobalPosition(), Carrot.destPos);
    if (lengthSquared([xDiff, yDiff]) > DIST_THRESHOLD) {
      const [dx, dy] = normalise([xDiff, yDiff]);

      this.dx = dx * MOVE_SPEED * delta;
      this.dy = dy * MOVE_SPEED * delta;
    } else {
      // Close enough to the destination. Deactivate.
      this.visible = false;
    }
  }

  private moveToGlobalPos(globalPos: Point) {
    const currGlobalPos = this.getGlobalPosition();
    this.dz = MOVE_SPEED;
  }
}
