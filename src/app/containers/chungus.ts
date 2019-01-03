import { angleBetweenPoints, normalise, rgb } from '../helpers';
import { setupMoveKeys } from '../input';
import {
  Graphics, Point, Texture,
} from '../pixi-alias';
import { Character } from './character';

const MOVE_SPEED = 4;
const CHARGE_MOVE_SPEED_PENALTY = 2;

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
  /** visual indicator of dash charging */
  private dashAim: Graphics;
  private activeState: ActiveState = ActiveState.Walking;

  private getInput: () => [number, number];

  constructor(texture: Texture) {
    super(texture);

    // make smaller
    this.setScale(0.6);

    // TODO: revise use of setup functions here. Maybe move out
    this.getInput = setupMoveKeys();

    // line for aiming the dash
    const triangle = new Graphics();
    triangle.beginFill(0xFFFFFF);
    triangle.moveTo(0, 0);
    // The triangle's x/y position is anchored to its first point in the path
    triangle.lineTo(0, 0);
    triangle.lineTo(-10, -40);
    triangle.lineTo(80, 0);
    triangle.lineTo(-10, 40);
    triangle.lineTo(0, 0);
    triangle.pivot.set(-50, 0);
    this.addChildAt(triangle, 1);
    triangle.x = this.body.width / 2;
    triangle.y = this.body.height;
    this.dashAim = triangle;
    this.resetDash();
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
      this.dashAim.visible = true;
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
    // Reset things
    this.resetDash();
  }

  /** update during Walking state */
  private updateWalking(delta: number): void {
    // Get user input
    const [inX, inY] = this.getInput();
    let convertedMoveSpeed = MOVE_SPEED;
    // tint differently if hurt
    this.body.tint = this.isHit ? 0xff0000 : 0xffffff;

    // Keep charging dash
    if (this.dashChargeTime > 0) {
      this.dashChargeTime += delta;

      if (this.dashChargeTime > MAX_DASH_CHARGE_TIME) {
        this.dashChargeTime = MAX_DASH_CHARGE_TIME;
      } else if (this.dashChargeTime > MIN_DASH_CHARGE_TIME) {
        this.dashAim.tint = 0xffffaa;
      } else {
        // if not yet reach min charge, tint in grayscale
        const chargeAmount = Math.round(
            255 * this.dashChargeTime / MIN_DASH_CHARGE_TIME,
        );
        this.dashAim.tint = rgb(chargeAmount, chargeAmount, chargeAmount);
      }

      // Update the aiming line
      const angle = angleBetweenPoints(this.position, this.dashDest);
      this.dashAim.rotation = angle;
      this.dashAim.width = this.dashChargeTime;
      /** How far the dash has been charged [0..1] */
      const chargeRatio = this.dashChargeTime / MAX_DASH_CHARGE_TIME;
      this.dashAim.alpha = chargeRatio;
      // Player moves slower the longer they charge
      convertedMoveSpeed -= chargeRatio * CHARGE_MOVE_SPEED_PENALTY;
    }

    // Update player's velocity
    this.dx = inX * convertedMoveSpeed;
    this.dy = inY * convertedMoveSpeed;
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

  /** Reset dash variables */
  private resetDash() {
    this.dashChargeTime = 0;
    this.dashAim.visible = false;
    this.dashAim.alpha = 0;
    this.dashAim.tint = 0x000000;
  }
}
