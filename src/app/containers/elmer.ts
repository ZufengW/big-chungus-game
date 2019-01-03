import { angleBetweenPoints } from '../helpers';
import {
  Graphics,
  Point,
  Texture,
} from '../pixi-alias';
import { Character, State } from './character';
import { MovingContainer } from './moving-container';

/** Elmer's Active substates */
enum ActiveState {
  Idle,
  Attacking,
}

const SCALE = 0.6;
const MOVE_SPEED = 3;
const SCALED_BODY_HEIGHT_GUN_RATIO = 0.08;
const AIM_LINE_LENGTH = 1000;

export class Elmer extends Character {
  public isHit: boolean = false;
  private enemy: MovingContainer;
  private aimLine: Graphics;

  constructor(texture: Texture, enemy: MovingContainer) {
    super(texture);
    this.enemy = enemy;

    // make smaller
    this.setScale(SCALE);

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

  public init() {
    super.init();
    //  this.aimLine.visible = false;
  }

  public update(delta: number): void {
    super.update(delta);

    // TODO: walk / aim / shoot when Active
    if (super.isActive()) {
      this.aimGun(this.enemy.position);
    }
  }

  public takeDamage(from?: Character) {
    this.aimLine.visible = false;
    super.takeDamage(from);
  }

  /**
   * Make elmer aim towards a postiion.
   * @param pos position to aim at
   */
  private aimGun(pos: Point): void {
    // Calculate approximate angle
    const angle = angleBetweenPoints(this.position, pos);
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
