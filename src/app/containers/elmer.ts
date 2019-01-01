import {
  Point,
  Texture,
} from '../pixi-alias';
import { MovingContainer } from './moving-container';

const SCALE = 0.6;
const MOVE_SPEED = 3;

export class Elmer extends MovingContainer {
  public isHit: boolean = false;
  private enemy: MovingContainer;

  constructor(texture: Texture, enemy: MovingContainer) {
    super(texture);
    this.enemy = enemy;

    // make smaller
    this.setScale(SCALE);

    // Allow body to rotate around middle
    this.body.anchor.set(0.5, 0.5);
    // Need to move body to compensate for anchor
    this.body.x = this.body.width / 2;
    this.body.y = this.body.height / 2;
  }

  public update(delta: number): void {
    // change state if hit
    if (this.isHit) {
      this.body.tint = 0xff0000;
    }

    // TODO: walk / aim / shoot
    this.aimGun(this.enemy.position);
  }

  /**
   * Make elmer aim towards a postiion.
   * @param pos position to aim at
   */
  private aimGun(pos: Point): void {
    // Calculate approximate angle
    const angle = Math.atan2(pos.y - this.y, pos.x - this.x);
    if (pos.x < this.x && this.body.scale.y > 0) {
      console.log('asdf');
      this.body.scale.y = -1;
    } else if (pos.x > this.x && this.body.scale.y < 0) {
      this.body.scale.y = 1;
    }
    this.body.rotation = angle;
  }
}
