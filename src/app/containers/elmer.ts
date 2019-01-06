import { angleBetweenPoints, distanceSquared, normalise, pointTo } from '../helpers';
import {
  Graphics,
  Point,
  Sprite,
  Texture,
} from '../pixi-alias';
import { Bullet } from './bullet';
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

const BULLET_SPEED = 16;

/** Time to spend in Walking state before switching to Attacking (frames) */
const BASE_TIME_BEFORE_ATTACK = 180;
/** Amount of time to spend firing gun (frames) */
const FIRE_GUN_TIME = 22;

const HALF_PI = Math.PI / 2;

export class Elmer extends Character {
  public static createBullet: (globalPos: Point) => Bullet;
  public isHit: boolean = false;
  private arms: Sprite;
  private enemy: MovingContainer;
  private aimLine: Graphics;
  /** Angle of gun aim with respect to parent. */
  private aimAngle: number;
  private aimTargetPos: Point;
  private activeState: ActiveState = ActiveState.Walking;
  /** how much to strafe while walking. From [-2..2]
   * Strafing is perpendicular movement.
   */
  private strafeFactor: number = 0;
  /** how long before next reroll */
  private strafeFactorDuration: number = STRAFE_FACTOR_DURATION_MAX;
  private fleeDistSquared: number = 0;

  /** Timer used to keep track of timer before attacking.
   * And to time the attack itself
   */
  private attackTimer: number = BASE_TIME_BEFORE_ATTACK;

  constructor(
      bodyTexture: Texture,
      armsTexture: Texture,
      enemy: MovingContainer,
    ) {
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

    // Create the line for aiming
    const line = new Graphics();
    line.lineStyle(4, 0xFFFFFF, 1);
    line.moveTo(0, 0);
    line.lineTo(AIM_LINE_LENGTH, 0);
    line.x = this.arms.width;
    line.y = this.arms.height * SCALED_ARMS_HEIGHT_GUN_RATIO;
    this.arms.addChild(line);
    this.aimLine = line;
    this.aimLine.visible = false;

    this.rerollStrafeFactor();
    this.rerollTimeBeforeAttack();
  }

  /** Use this to reset elmer's state in preparation for respawning */
  public init() {
    super.init();
    this.activeState = ActiveState.Walking;
    this.aimLine.visible = false;
    this.aimLine.tint = 0xffffff;
    this.rerollStrafeFactor();
    this.rerollTimeBeforeAttack();
  }

  /** Happens once each frame. Update velocity and stuff. */
  public update(delta: number): void {
    super.update(delta);

    if (super.isActive()) {
      if (this.activeState === ActiveState.Walking) {
        // Walk and aim when Active
        this.updateWalking(delta);
      } else {
        this.updateAttacking(delta);
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
    this.attackTimer -= delta;
    if (this.attackTimer <= 0) {
      // Spent enought time walking. Switch to Attacking state. Init state.
      this.aimTargetPos = this.enemy.position.clone();

      this.activeState = ActiveState.Attacking;
      this.dx = 0;
      this.dy = 0;
      this.aimLine.alpha = 0;
      this.aimLine.tint = 0xffffff;
      this.aimLine.height = 4;
      this.aimLine.visible = true;
      return;
    }
  }

  /**
   * Elmer telegraphs the attack by charging, then fires.
   * @param delta frame time
   */
  private updateAttacking(delta: number) {
    if (this.aimLine.alpha < 1) {
      this.chargeGun(delta);
      return;
    }
    // Gun is charged. Fire.
    this.fireGun(delta);
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
    // Record aimAngle for the bullet
    this.aimAngle = angle;

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

  /** charges the attack by increasing alpha of the aim line */
  private chargeGun(delta: number) {
    const nextAlpha = this.aimLine.alpha + (delta / 100);
    if (nextAlpha > 1) {
      this.aimLine.alpha = 1;
      // Gun is charged enough. Init state to fire the gun
      this.attackTimer = FIRE_GUN_TIME;
      this.aimLine.height = 10;
      // Create the bullet and add velocity
      const bullet = Elmer.createBullet(this.aimLine.getGlobalPosition());
      bullet.body.rotation = this.aimAngle;
      const [dx, dy] = normalise(pointTo(this.position, this.aimTargetPos));
      bullet.dx = dx * BULLET_SPEED;
      bullet.dy = dy * BULLET_SPEED;
    } else {
      this.aimLine.alpha = nextAlpha;
    }
  }

  /** gun firing flashing animation */
  private fireGun(delta: number) {
    this.attackTimer -= delta;
    if (this.attackTimer > 17) {
      this.aimLine.visible = false;
    } else if (this.attackTimer > 14) {
      this.aimLine.visible = true;
    } else if (this.attackTimer > 7) {
      this.aimLine.visible = false;
    } else if (this.attackTimer > 0) {
      this.aimLine.tint = 0xFFFF00;
      this.aimLine.visible = true;
    } else {
      // Finished attacking. Switch back to Walking state.
      this.activeState = ActiveState.Walking;
      this.rerollTimeBeforeAttack();
      this.aimLine.visible = false;
    }
  }

  /** reset the time to spend Walking before switching to Attacking */
  private rerollTimeBeforeAttack() {
    this.attackTimer = BASE_TIME_BEFORE_ATTACK + (Math.random() * 500);
  }
}
