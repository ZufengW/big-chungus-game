import { normalise } from '../helpers';
import { setupMoveKeys } from '../input';
import {
  Point, Texture,
} from '../pixi-alias';
import { Character } from './character';

const MOVE_SPEED = 4;

// times are in frames
const MIN_DASH_CHARGE_TIME = 60;
const MAX_DASH_CHARGE_TIME = 240;
const CHARGE_XY_DAMP_FACTOR = 0.96;

/** Chungus's active substates */
enum ActiveState {
  Walking,
  Dashing,
}

export class Chungus extends Character {
  public isHit: boolean = false;

  /** Destination of dash in local coordinates */
  public dashDest: Point = new Point(0, 0);
  /** Also represents whether or not charging a dash */
  private dashChargeTime: number = 0;
  private activeState: ActiveState = ActiveState.Walking;

  private getInput: () => [number, number];

  constructor(texture: Texture) {
    super(texture);

    // make smaller
    this.setScale(0.6);

    // TODO: revise use of setup functions here. Maybe move out
    this.getInput = setupMoveKeys();
  }

  public update(delta: number): void {
    super.update(delta);
    if (super.isActive()) {
      switch (this.activeState) {
        case ActiveState.Walking:
          this.updateWalking(delta);
          break;
        case ActiveState.Dashing:
          // cannot change direction. Invulnerable.
          this.updateDashing(delta);
        default:
          break;
      }
    }
  }

  /**
   * Attempt to begin charging dash.
   * Will only work if not already charging or dashing.
   */
  public startChargingDash() {
    // Check if the time is right
    if (this.dashChargeTime === 0
        && this.activeState === ActiveState.Walking && super.isActive()) {
      this.dashChargeTime = 1;
    }
  }

  /**
   * Attempt to finish charging dash.
   * Will continue to charge if minimum charge time not achieved yet.
   */
  public stopChargingDash() {
    // Don't do anything if already not charging, or not charged enough
    // or in the middle of dashing
    if (this.activeState === ActiveState.Dashing
        || !super.isActive()
        || this.dashChargeTime < MIN_DASH_CHARGE_TIME) {
      return;
    }
    // cap the charge
    this.dashChargeTime = Math.min(this.dashChargeTime, MAX_DASH_CHARGE_TIME);

    // Calculate dash power
    const dashPower = this.dashChargeTime / 10;
    this.activeState = ActiveState.Dashing;

    const [xDiff, yDiff] = normalise(
      [this.dashDest.x - this.x, this.dashDest.y - this.y],
    );
    // reset xy velocity to dashing
    this.dx = xDiff * dashPower;
    this.dy = yDiff * dashPower;
    this.dz += dashPower;
    // Reset
    this.dashChargeTime = 0;
  }

  /** update during Walking state */
  private updateWalking(delta: number): void {
    // Get user input
    const [inX, inY] = this.getInput();
    this.dx = inX * MOVE_SPEED;
    this.dy = inY * MOVE_SPEED;
    // tint differently if hurt
    this.body.tint = this.isHit ? 0xff0000 : 0xffffff;

    // Keep charging dash
    if (this.dashChargeTime > 0) {
      this.dashChargeTime += delta;
    }
  }

  /** update during Dashing state */
  private updateDashing(delta: number): void {
    // dampen velocity
    const dampFactor = CHARGE_XY_DAMP_FACTOR * delta;
    this.dx *= dampFactor;
    this.dy *= dampFactor;
    // Change back to Walking at end of jump (when on ground again)
    if (this.dx < MOVE_SPEED && this.dy < MOVE_SPEED && this.getZ() === 0) {
      this.activeState = ActiveState.Walking;
    }
  }
}
