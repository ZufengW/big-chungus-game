import {
  distanceSquared, lengthSquared,
  normalise, pointTo, randRange,
} from '../helpers';
import {
  Point,
  Sprite,
  Texture,
} from '../pixi-alias';
import { Character } from './character';
import { MovingContainer } from './moving-container';

/** Taz's Active substates */
enum ActiveState {
  Walking,
  Attacking,
}

const SCALE = 0.7;

const WALK_SPEED = 2;

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
   * When walking, taz walks to random points.
   * @param delta frame time
   */
  private updateWalking(delta: number) {
    // if enemy is close, charge an attack and move towards enemy.
    let [x, y] = pointTo(this.position, this.enemy.position);
    const squaredDistToEnemy = lengthSquared([x, y]);
    if (squaredDistToEnemy < 4000) {
      this.eyes.visible = true;
      if (this.chargeAttack(delta)) {
        // TODO: launch the attack
      }
      if (squaredDistToEnemy < DIST_TOO_CLOSE) {
        // Don't need to move any closer to enemy. Halt.
        this.dx = 0;
        this.dy = 0;
        return;
      }
    } else {
      // Otherwise move towards destination.
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

  /**
   *
   * @param delta frame time
   * @return whether or not attack has charged yet
   */
  private chargeAttack(delta: number): boolean {
    const nextAlpha = this.eyes.alpha + delta * 0.01;
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
