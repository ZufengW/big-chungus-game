import { angleBetweenPoints, normalise, rgb } from '../helpers';
import { setupMoveKeys } from '../input';
import {
  Graphics, Point, Texture,
} from '../pixi_alias';
import { Character } from './character';
import { HealthBar } from './health_bar';
import { MovingContainer } from './moving_container';

const MOVE_SPEED = 4;
/** How much chungus waddles */
const WADDLE_AMOUNT = 0.07;

// times are in frames
const MIN_DASH_CHARGE_TIME = 60;
const MAX_DASH_CHARGE_TIME = 180;
const CHARGE_XY_DAMP_FACTOR = 0.96;

const DASH_BODY_ROTATION_FACTOR = 0.01;
/** amount of time Hurt state lasts for. (Frames) */
const HURT_DURATION = 30;
const HURT_MOVE_PENALTY = 0.5;

/** Chungus's active substates */
enum ActiveState {
  Walking,
  Dashing,
  Hurt,
}

export class Chungus extends Character {
  /** Destination of dash in local coordinates */
  public dashDest: Point = new Point(0, 0);
  /** Also represents whether or not charging a dash */
  private dashChargeTime: number = 0;
  /** visual indicator of dash charging */
  private dashAim: Graphics;
  /** current Active substate */
  private activeState: ActiveState = ActiveState.Walking;
  /** time spent in Hurt state */
  private hurtTime = 0;
  private healthBar: HealthBar;
  /** For the waddle animation. */
  private waddleState = 0;
  private waddleDirection = 1;

  private getInput: () => [number, number];

  constructor(texture: Texture, healthBar: HealthBar) {
    super(texture);

    // make smaller
    this.setScale(0.6);

    // TODO: revise use of setup functions here. Maybe move out
    this.getInput = setupMoveKeys();

    this.healthBar = healthBar;
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
          break;
        case ActiveState.Hurt:
          this.updateHurt(delta);
        default:
          break;
      }
      // Flip body depending on x velocity
      if (this.dx < 0) {
        this.body.scale.x = -1;
      } else if (this.dx !== 0) {  // this.dx > 0
        this.body.scale.x = 1;
      }
    }
  }

  /** Whether or not taz is vulnerable to damage.
   * Use this to save on collision checking.
   */
  public isVulnerable() {
    // Chungus is invulnerable while dashing and hurt.
    return super.isActive() && this.activeState === ActiveState.Walking;
  }

  /**
   * Should check isVulnerable before doing this.
   * @param from thing to take damage from.
   * @param hurt whether or not actually taking damage (or just knockback).
   *  Default true.
   */
  public takeDamage(from?: MovingContainer, hurt = true): void {
    if (hurt) {
      this.healthBar.addHealth(-1);
      if (this.healthBar.getHealth() <= 0) {
        super.takeDamage(from);
      }
      this.body.tint = 0xff3333;
    }
    if (!!from) {
      this.dx += from.dx + Math.random();
      this.dy += from.dy + Math.random();
    }
    this.hurtTime = HURT_DURATION;
    this.activeState = ActiveState.Hurt;
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
   * Attempt to finish charging dash, and begin Dashing.
   * Will continue to charge if minimum charge time not achieved yet.
   */
  public stopChargingDash() {
    // Don't do anything if already not charging, or not charged enough
    // or in the middle of dashing
    if (this.activeState !== ActiveState.Walking
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

  /** Whether or not chungus is dashing */
  public isDashing(): boolean {
    return this.activeState === ActiveState.Dashing;
  }

  /** update during Walking state */
  private updateWalking(delta: number): void {
    // Get user input
    const [inX, inY] = this.getInput();

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
    }

    // Update player's velocity
    this.dx = inX * MOVE_SPEED;
    this.dy = inY * MOVE_SPEED;

    // Update waddle
    this.updateWaddle();
  }

  /** update during Dashing state */
  private updateDashing(delta: number): void {
    // dampen velocity
    const dampFactor = CHARGE_XY_DAMP_FACTOR * delta;
    this.dx *= dampFactor;
    this.dy *= dampFactor;
    // Change back to Walking at end of jump (when on ground again)
    if (this.dx < MOVE_SPEED && this.dy < MOVE_SPEED && this.getZ() === 0) {
      this.body.rotation = 0;
      this.activeState = ActiveState.Walking;
    }
    // Change rotation based on height for kicking effect
    if (this.dx < 0) {
      this.body.rotation = this.getZ() * DASH_BODY_ROTATION_FACTOR;
    } else {
      this.body.rotation = -this.getZ() * DASH_BODY_ROTATION_FACTOR;
    }

  }

  /** Chungus moves slower while hurt and is affected by knockback. */
  private updateHurt(delta: number): void {
    // Affected by knockback. Less control.
    const [inX, inY] = this.getInput();
    this.dx += inX * HURT_MOVE_PENALTY;
    this.dy += inY * HURT_MOVE_PENALTY;

    // Damp velocity
    this.dx *= 0.95;
    this.dy *= 0.95;
    this.hurtTime -= delta;
    if (this.hurtTime <= 0) {
      // Change back to Walking state.
      this.activeState = ActiveState.Walking;
      this.body.tint = 0xffffff;
      this.waddleState = 0;
    }
    this.updateWaddle();
  }

  /** Waddle animation */
  private updateWaddle() {
    if (this.dx !== 0 || this.dy !== 0) {
      this.body.rotation = this.waddleState;
      if (this.waddleState <= -WADDLE_AMOUNT && this.waddleDirection === -1) {
        this.waddleDirection = 1;
      } else if (this.waddleState >= WADDLE_AMOUNT && this.waddleDirection === 1) {
        this.waddleDirection = -1;
      }
      this.waddleState += 0.01 * this.waddleDirection;
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
