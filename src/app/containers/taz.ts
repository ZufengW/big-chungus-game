import {
  distanceSquared, lengthSquared,
  normalise, pointTo, randRange,
} from '../helpers';
import {
  Point,
  Sprite,
  Texture,
} from '../pixi_alias';
import { Character } from './character';
import { MovingContainer } from './moving_container';

/** Taz's Active substates */
enum ActiveState {
  Walking,
  Attacking,
  Hurt,
}

const SCALE = 0.7;

const EYES_TRANSITION_SPEED = 0.03;
const WALKING_AGGRO_RANGE_SQUARED = 9000;
const WALKING_CALMDOWN_RANGE_SQUARED = 35000;
const WALK_SPEED = 2;
/** amount of time Hurt state lasts for. (Frames) */
const HURT_DURATION = 80;

/** to prevent rapid flipping */
const DIST_TOO_CLOSE = 10;

export class Taz extends Character {
  /** Walking boundaries. They need to be set up somewhere. */
  public static minX: number;
  public static maxX: number;
  public static minY: number;
  public static maxY: number;
  /** current Active substate */
  private activeState: ActiveState = ActiveState.Walking;
  private eyes: Sprite;
  private arm: Sprite;
  private enemy: MovingContainer;
  /** destination when walking */
  private walkDest: Point = new Point(0, 0);
  /** time spent in Hurt state */
  private hurtTime = 0;

  /** When aggro, will chase enemey */
  private aggro = false;
  /** Whether or not taz is attacking (i.e. swinging arm) */
  private attacking = true;
  /** Number of hits taz can survive */
  private hp = 2;

  /**
   * Create a new Taz
   * @param bodyTexture texture for body
   * @param armTexture texture for arm
   * @param eyesRedTexture texture for red eyes
   * @param enemy enemy of taz
   */
  constructor(
    bodyTexture: Texture,
    armTexture: Texture,
    eyesRedTexture: Texture,
    enemy: MovingContainer,
  ) {
  super(bodyTexture);
  this.enemy = enemy;

  // set up eyes
  const eyes = new Sprite(eyesRedTexture);
  eyes.pivot.set(38, 19);
  eyes.position.set(-12, -24);
  eyes.visible = false;
  this.body.addChild(eyes);
  this.eyes = eyes;

  // set up Arm
  const arm = new Sprite(armTexture);
  arm.pivot.set(80, 54);
  arm.position.set(-64, -32);
  this.body.addChild(arm);
  this.arm = arm;

  // make smaller
  this.setScale(SCALE);
  this.rerollWalkDest();
  }

  /** Use this to reset state in preparation for respawning */
  public init() {
    super.init();
    this.activeState = ActiveState.Walking;
    this.eyes.visible = false;
    this.rerollWalkDest();
    this.aggro = false;
    this.hp = 2;
    this.body.tint = 0xffffff;
  }

  /** Whether or not taz is attacking (and active). */
  public isAttacking(): boolean {
    return this.attacking && super.isActive();
  }

  /** Whether or not taz is vulnerable to damage.
   * Use this to save on collision checking.
   */
  public isVulnerable(): boolean {
    return super.isActive() && this.activeState === ActiveState.Walking;
  }

  /** Happens once each frame. Update velocity and stuff. */
  public update(delta: number): void {
    super.update(delta);
    if (super.isActive()) {
      switch (this.activeState) {
        case ActiveState.Walking:
          this.updateWalking(delta);
          break;
        case ActiveState.Attacking:
          this.updateAttacking(delta);
          break;
        case ActiveState.Hurt:
          this.updateHurt(delta);
          break;
        default:
          break;
      }
      // Flip body depending on x velocity
      if (this.dx < 0) {
        this.body.scale.x = 1;
      } else if (this.dx !== 0) {  // this.dx > 0
        this.body.scale.x = -1;
      }
    }
    // this.arm.rotation += 0.5;
  }

  /**
   * Should check isVulnerable before doing this.
   * @param from thing to take damage from.
   */
  public takeDamage(from?: MovingContainer): void {
    this.hp--;
    if (this.hp <= 0) {
      super.takeDamage(from);
      return;
    }
    // knockback
    this.body.tint = 0xff3333;
    if (!!from) {
      this.dx += from.dx * 2;
      this.dy += from.dy * 2;
    }
    this.aggro = false;
    this.activeState = ActiveState.Hurt;
    this.hurtTime = HURT_DURATION;
  }

  /**
   * When walking, taz walks to random points.
   * @param delta frame time
   */
  private updateWalking(delta: number) {
    // if enemy is close, charge an attack and move towards enemy.
    let [x, y] = pointTo(this.position, this.enemy.position);
    const squaredDistToEnemy = lengthSquared([x, y]);
    if (squaredDistToEnemy < WALKING_AGGRO_RANGE_SQUARED || this.aggro) {
      if (this.aggro) {
        if (squaredDistToEnemy > WALKING_CALMDOWN_RANGE_SQUARED) {
          this.aggro = false;
        }
      } else {
        // Not yet aggro. Transition.
        this.aggro = true;
        this.eyes.visible = true;
        this.eyes.alpha = 0;
      }
      this.attacking = this.chargeAttack(delta);
      if (this.attacking) {
        // Actually attack.
        this.attacking = true;
        this.arm.rotation -= 0.5 * delta;
      }
      if (squaredDistToEnemy < DIST_TOO_CLOSE) {
        // Don't need to move any closer to enemy. Halt.
        this.dx = 0;
        this.dy = 0;
        return;
      }

    } else {
      // Otherwise move towards destination.
      this.eyes.alpha -= delta * EYES_TRANSITION_SPEED;
      [x, y] = pointTo(this.position, this.walkDest);
    }
    // If close to destination, reroll destination
    if (lengthSquared([x, y]) < DIST_TOO_CLOSE) {
      this.rerollWalkDest();
    }
    // Move towards destination
    const [dx, dy] = normalise([x, y]);
    this.dx = dx * WALK_SPEED;
    this.dy = dy * WALK_SPEED;
  }

  /**
   * When attacking, taz charges towards the enemy
   * @param delta frame time
   */
  private updateAttacking(delta: number) {
    // TODO
  }

  /** When hurt, taz is affected by knockback. */
  private updateHurt(delta: number): void {
    // Damp velocity
    this.dx *= 0.96;
    this.dy *= 0.96;
    this.hurtTime -= delta;
    // Reduce aggro when hurt
    this.eyes.alpha -= delta * EYES_TRANSITION_SPEED;
    if (this.hurtTime <= 0) {
      // Change back to Walking state. Stay slightly red.
      this.body.tint = 0xffaaaa;
      this.activeState = ActiveState.Walking;
    }
  }

  /**
   *
   * @param delta frame time
   * @return whether or not attack has charged yet
   */
  private chargeAttack(delta: number): boolean {
    const nextAlpha = this.eyes.alpha + delta * EYES_TRANSITION_SPEED;
    if (nextAlpha >= 1) {
      this.eyes.alpha = 1;
      return true;
    }
    this.eyes.alpha = nextAlpha;
    return false;
  }

  private rerollWalkDest() {
    this.walkDest.x = randRange(Taz.minX, Taz.maxX);
    this.walkDest.y = randRange(Taz.minY, Taz.maxY);
  }
}
