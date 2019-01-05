import { angleBetweenPoints, distanceSquared, normalise, pointTo } from '../helpers';
import {
  Graphics,
  Point,
  Sprite,
  Texture,
} from '../pixi-alias';
import { Character } from './character';
import { MovingContainer } from './moving-container';

/** Elmer's Active substates */
enum ActiveState {
  Walking,
  Attacking,
}

const SCALE = 0.6;
const MOVE_SPEED = 2;
const SCALED_ARMS_HEIGHT_GUN_RATIO = 0.4;
const AIM_LINE_LENGTH = 1000;

const BASE_FLEE_DIST_SQUARED = 190 ** 2;
const STRAFE_FACTOR_DURATION_MAX = 300;

const HALF_PI = Math.PI / 2;

export class Elmer extends Character {
  public isHit: boolean = false;
  private arms: Sprite;
  private enemy: MovingContainer;
  private aimLine: Graphics;
  private activeState: ActiveState;
  /** how much to strafe while walking. From [-2..2]
   * Strafing is perpendicular movement.
   */
  private strafeFactor: number = 0;
  /** how long before next reroll */
  private strafeFactorDuration: number = STRAFE_FACTOR_DURATION_MAX;
  private fleeDistSquared: number = 0;

  constructor(bodyTexture: Texture, armsTexture, enemy: MovingContainer) {
    super(bodyTexture);
    this.enemy = enemy;

    // set up arms
    const arms = new Sprite(armsTexture);
    arms.pivot.set(40, 25);
    arms.position.set(-12, 15);
    this.body.addChild(arms);
    this.arms = arms;

    // make smaller
    this.setScale(SCALE);

    // line for aiming
    const line = new Graphics();
    line.lineStyle(4, 0xFFFFFF, 1);
    line.moveTo(0, 0);
    line.lineTo(AIM_LINE_LENGTH, 0);
    line.x = this.arms.width;
    line.y = this.arms.height * SCALED_ARMS_HEIGHT_GUN_RATIO;
    this.arms.addChild(line);
    this.aimLine = line;
    // line.visible = false;
    this.rerollStrafeFactor();
  }

  public init() {
    super.init();
    this.activeState = ActiveState.Walking;
    // this.aimLine.visible = false;  // undef?
    this.rerollStrafeFactor();
  }

  /** Happens once each frame. Update velocity and stuff. */
  public update(delta: number): void {
    super.update(delta);

    // TODO: walk / aim / shoot when Active
    if (super.isActive()) {
      if (this.activeState === ActiveState.Walking) {
        this.updateWalking(delta);
      }
    }
  }

  public takeDamage(from?: Character) {
    this.aimLine.visible = false;
    super.takeDamage(from);
  }

  /**
   * Walk around and aim gun
   * @param delta frame time
   */
  private updateWalking(delta: number) {
    // strafe
    const [x, y] = pointTo(this.position, this.enemy.position);
    // let dxNew = y;
    // let dyNew = -x;
    let dxNew = y * this.strafeFactor;
    let dyNew = -x * this.strafeFactor;

    // Walk away if enemy is close
    if (distanceSquared(this.position, this.enemy.position) < this.fleeDistSquared) {
      dxNew -= x;
      dyNew -= y;
    }
    [dxNew, dyNew] = normalise([dxNew, dyNew]);
    this.dx = dxNew * MOVE_SPEED * delta;
    this.dy = dyNew * MOVE_SPEED * delta;

    // Check if actually moved
    this.strafeFactorDuration -= delta;
    if (this.strafeFactorDuration < 0) {
      this.strafeFactorDuration = STRAFE_FACTOR_DURATION_MAX * Math.random();
      this.rerollStrafeFactor();
    }

    this.aimGun(this.enemy.position);
  }

  /** Roll a new StrafeFactor and fleeDistSquared
   * Use when wanting to change direction.
   */
  private rerollStrafeFactor() {
    this.strafeFactor = (Math.random() * 4) - 2;
    this.fleeDistSquared = BASE_FLEE_DIST_SQUARED + Math.random() * 100;
  }

  /**
   * Make elmer aim towards a postiion.
   * Angle body half way, and arms the other half of the way.
   * @param pos position to aim at
   */
  private aimGun(pos: Point): void {
    // Calculate approximate angle from self position to target position
    const angle = angleBetweenPoints(this.position, pos);
    const halfAngle = angle / 2;

    // TODO find something less hacky than this
    if (pos.x < this.x) {
      const halfAngleFlipped = halfAngle - HALF_PI;
      // Treat these two quadrants differently because weird stuff
      if (pos.y < this.y) {
        this.body.scale.x = 1;
        this.body.scale.y = -1;
        this.arms.rotation = -halfAngleFlipped + Math.PI;
      } else {
        this.arms.rotation = -halfAngleFlipped;
        this.body.scale.x = -1;
        this.body.scale.y = 1;
      }
      this.body.rotation = halfAngleFlipped;
    } else if (pos.x > this.x) {
      // Target is on the right
      this.body.scale.x = 1;
      this.body.scale.y = 1;
      this.body.rotation = halfAngle;
      this.arms.rotation = halfAngle;
    }
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
