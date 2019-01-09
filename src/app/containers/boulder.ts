import { lengthSquared } from '../helpers';
import {
  Texture,
} from '../pixi_alias';
import { MovingContainer } from './moving_container';

const FAST_THRESHOLD_SQUARED = 12;
const ROLL_FACTOR = 0.05;

/**
 * boulder has special logic
 */
export class Boulder extends MovingContainer {
  /** Whether or not the boulder is currently moving quickly */
  private movingQuick: boolean = false;

  constructor(texture: Texture) {
    super(texture);

    this.setScale(0.6);

    this.setZ(500);
    this.dz = -1;
  }

  public update(delta: number) {
    super.update(delta);
    // damp velocity
    this.dx *= 0.99 * delta;
    this.dy *= 0.99 * delta;
    // Calculate if moving quickly and tint differently
    const totalMove = lengthSquared([this.dx, this.dy]);
    this.movingQuick = totalMove > FAST_THRESHOLD_SQUARED;
    this.body.tint = this.movingQuick ? 0xffffff : 0xcccccc;

    // appearance of rolling sideways
    this.body.rotation += this.dx * delta * ROLL_FACTOR;
  }

  /** whether or not the boulder is moving quickly */
  public isMovingQuick() {
    return this.movingQuick;
  }

  /** Boulder is invulnerable. Gets pushed. */
  public takeDamage(from: MovingContainer) {
    this.dx += from.dx;
    this.dy += from.dy;
  }

  /**
   * Constrains this MovingContainer's position to keep it within bounds.
   * Takes into account the dimensions and scale of this MovingContainer.
   * @param minX minimum x position
   * @param maxX maximum x position
   * @param minY minimum y position
   * @param maxY maximum y position
   */
  public constrainPosition(
      minX: number, maxX: number,
      minY: number, maxY: number): void {
    const prevX = this.x;
    const prevY = this.y;
    super.constrainPosition(minX, maxX, minY, maxY);
    // See which parts got constrained. Bounce
    if (this.x !== prevX) {
      this.dx *= -1;
    }
    if (this.y !== prevY) {
      this.dy *= -1;
    }
  }
}
