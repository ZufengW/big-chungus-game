import {
  Graphics,
  Point,
  Texture,
} from '../pixi-alias';
import { MovingContainer } from './moving-container';

/** Elmer's states */
enum State {
  Starting,
  Active,
  Attacking,
  Leaving,
  Inactive,
}

const STARTING_ELEVATION = 500;
const SCALE = 0.6;
const MOVE_SPEED = 3;
const SCALED_BODY_HEIGHT_GUN_RATIO = 0.08;
const AIM_LINE_LENGTH = 1000;

export class Elmer extends MovingContainer {
  public isHit: boolean = false;
  private enemy: MovingContainer;
  private aimLine: Graphics;
  private state = State.Starting;

  constructor(texture: Texture, enemy: MovingContainer) {
    super(texture);
    this.enemy = enemy;

    // make smaller
    this.setScale(SCALE);

    // start state
    this.setZ(STARTING_ELEVATION);
    this.dz = -1;

    // // Allow body to rotate around middle
    // const halfBodyWidth = this.body.width / 2;
    // const halfBodyHeight = this.body.height / 2;
    // this.body.anchor.set(0.5, 0.5);
    // // Need to move body to compensate for anchor
    // this.body.position.set(halfBodyWidth, halfBodyHeight);

    // const halfBodyWidth = this.body.width / 2;
    // const halfBodyHeight = this.body.height / 2;
    // this.body.pivot.set(halfBodyWidth, halfBodyHeight);
    // // Need to move body to compensate for anchor
    // this.body.position.set(halfBodyWidth, halfBodyHeight);

    // line for aiming
    const line = new Graphics();
    line.lineStyle(4, 0xFFFFFF, 1);
    line.moveTo(0, 0);
    line.lineTo(AIM_LINE_LENGTH, 0);
    line.x = this.body.width / 2;
    line.y = this.body.height * SCALED_BODY_HEIGHT_GUN_RATIO;
    this.body.addChild(line);
    this.aimLine = line;
    // line.visible = false;
  }

  public update(delta: number): void {
    if (this.state === State.Starting) {
      this.updateStarting(delta);
      return;
    }

    // change state if hit
    if (this.isHit) {
      this.body.tint = 0xff0000;
    }

    // TODO: walk / aim / shoot
    this.aimGun(this.enemy.position);
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
   * Make elmer aim towards a postiion.
   * @param pos position to aim at
   */
  private aimGun(pos: Point): void {
    // Calculate approximate angle
    const angle = Math.atan2(pos.y - this.y, pos.x - this.x);
    if (pos.x < this.x && this.body.scale.y > 0) {
      this.body.scale.y = -1;
    } else if (pos.x > this.x && this.body.scale.y < 0) {
      this.body.scale.y = 1;
    }
    this.body.rotation = angle;
  }

  private chargeGun(delta: number) {
    const nextAlpha = this.aimLine.alpha + (delta / 100);
    if (nextAlpha > 1) {
      this.aimLine.alpha = 1;
      // TODO: fire gun
      this.aimLine.tint = 0xFFFF00;
    } else {
      this.aimLine.alpha = nextAlpha;
    }
  }
}
