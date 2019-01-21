import { angleBetweenPoints, normalise, rgb } from '../helpers';
import {
  Graphics, Point, Texture,
} from '../pixi_alias';
import { freezeScore } from '../ui/score_text';
import { SpeechBubble } from '../ui/speech';
import { Character } from './character';
import { HealthBar } from './health_bar';
import { MovingContainer } from './moving_container';

const STARTING_SCALE = 0.6;
/** powerTexture dimensions multiplied by this should be similar to texture */
const NEW_BODY_SCALE = 0.5;
const SCALE_GROW_SPEED = 0.01;
/** maximum scale for chungus when fully grown */
const MAX_POW_SCALE = 3.1;
/** How long (frames) between chungus activating power and beginning to grow */
const POW_TIME_BEFORE_GROW = 60 * 7;
/** Delay between activating power and win conditions considered met */
const POW_TIME_WIN = 60 * 15;

const ORIGIN = new Point(0, 0);

/** Things chungus says. delay is after what delay */
const speeches = [
  {
    text: 'YOU FOOLS!       \nTHIS ISN\'T EVEN MY FINAL FORM.',
    delay: 60,
    speed: SpeechBubble.SPEAK_SPEED_SLOW,
  },
  {
    text: 'HUMONGOUS CHUNGUS',
    delay: POW_TIME_BEFORE_GROW - 30,
    speed: SpeechBubble.SPEAK_SPEED_NORMAL,
  },
];

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
  /** Destination of dash in local coordinates
   * Relative to chungus's position.
   */
  private dashDest: Point = new Point(1, 0);
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
  /** Whether or not have access to the powered up state */
  private isPoweredUp = false;
  /** How long the power up state has been active for */
  private powerTime = 0;
  /** Body texture when normal */
  private normalTexture: Texture;
  private powerTexture: Texture;

  private speechBubble: SpeechBubble;
  private speechIndex: number = 0;

  /** pair of coordinates. Should be normalised to 1. (or 0, 0 for no move)
   * Used to decide Chungus's next walking direction.
   */
  private moveInput: [number, number] = [0, 0];

  /**
   * Create a new chungus
   * @param texture body texture
   * @param healthBar chungus health
   * @param powerTexture body texture after activating powerup.
   *    Should be twice the size of texture.
   */
  constructor(texture: Texture, healthBar: HealthBar, powerTexture: Texture) {
    super(texture);
    this.normalTexture = texture;
    this.powerTexture = powerTexture;

    // make smaller
    this.setScale(STARTING_SCALE);

    // TODO: revise use of setup functions here. Maybe move out
    // this.getInput = setupMoveKeys();

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
    this.finishDashCharging();
    // Position the speech bubble
    this.speechBubble = new SpeechBubble();
    // this.speechBubble.position.set(100, 100);
    this.addChild(this.speechBubble);
  }

  /** Reset chungus's state in preparation for respawning */
  public init() {
    super.init();
    this.activeState = ActiveState.Walking;
    this.setScale(STARTING_SCALE);
    this.healthBar.restart();
    this.finishDashCharging();
    this.speechBubble.visible = false;  // deactivate speech bubble
    this.speechIndex = 0;
    this.powerTime = 0;
    this.isPoweredUp = false;
    this.hurtTime = 0;
    this.waddleState = 0;
    this.waddleDirection = 1;
    this.body.tint = 0xffffff;
    // reset texture
    this.body.texture = this.normalTexture;
    this.body.scale.set(1);
    this.moveInput = [0, 0];
    this.dashDest.set(1, 0);
  }

  public update(delta: number): void {
    super.update(delta);
    this.speechBubble.update(delta);

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
      if ((this.dx < 0 && this.body.scale.x > 0)
          || (this.dx > 0 && this.body.scale.x < 0)) {
        this.body.scale.x *= -1;
      }
      // powered up?
      if (this.powerTime > 0) {
        this.updatePower(delta);
      }
    }
  }

  /**
   * Set the dashDest. Coordinates are relative to chungus's position
   * @param x coordinate
   * @param y coordinate
   */
  public setDashDest(x: number, y: number) {
    if (x === 0 && y === 0) {
      return;  // don't want 0
    }
    this.dashDest.set(x, y);
  }

  /** Set chungus's next move. Assume input is valid. */
  public setMoveInput(coord: [number, number]) {
    this.moveInput[0] = coord[0];
    this.moveInput[1] = coord[1];
  }

  /** Whether or not taz is vulnerable to damage.
   * Use this to save on collision checking.
   */
  public isVulnerable() {
    // Chungus is invulnerable while dashing or hurt or powered up.
    return super.isActive() && this.activeState === ActiveState.Walking
        && this.powerTime === 0;
  }

  /**
   * Should check isVulnerable before doing this.
   * @param from thing to take damage from.
   * @param hurt whether or not actually taking damage (or just knockback).
   *  Default true.
   */
  public takeDamage(from?: MovingContainer, hurt = true): void {
    if (this.powerTime > 0) {
      return;  // invulnerable
    }
    if (hurt) {
      this.healthBar.addHealth(-1);
      if (this.healthBar.getHealth() <= 0) {
        // 0 health. Either activate power up if have it, or lose.
        if (this.isPoweredUp) {
          this.activatePower();
          return;
        }
        super.takeDamage(from);
        freezeScore();
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
   * Attempt to (finish charging and) begin Dashing.
   * Will continue to charge if minimum charge time not achieved yet.
   */
  public attemptDash() {
    // Don't do anything if already not charging, or not charged enough
    // or in the middle of dashing
    if (this.activeState !== ActiveState.Walking
        || !super.isActive()
        || this.dashChargeTime < MIN_DASH_CHARGE_TIME) {
      return;
    }
    // cap the maximum charge
    this.dashChargeTime = Math.min(this.dashChargeTime, MAX_DASH_CHARGE_TIME);

    // Calculate dash power
    const dashPower = this.dashChargeTime * 0.1;
    this.activeState = ActiveState.Dashing;

    const [xDiff, yDiff] = normalise(
      [this.dashDest.x, this.dashDest.y],
    );
    // Set xy velocity to dashing velocity.
    this.dx = xDiff * dashPower;
    this.dy = yDiff * dashPower;
    this.dz += dashPower;
    // Reset things
    this.finishDashCharging();
  }

  /** Whether or not chungus is dashing */
  public isDashing(): boolean {
    return this.activeState === ActiveState.Dashing;
  }

  /** Powers up the chungus */
  public powerUp() {
    this.isPoweredUp = true;
    // Power will activate when health drops to 0
    this.powerTime = 0;
  }

  /** @return whether or not chungus is humongous and moving */
  public isHugeAndMoving() {
    return this.powerTime > 0 && this.scale.y > 2
        && (this.dx !== 0 || this.dy !== 0);
  }

  /** @return Whether or not achieved win conditions */
  public hasWon() {
    return this.powerTime > POW_TIME_WIN;
  }

  /** chungus says something new */
  public say(text: string, speed?: number) {
    this.speechBubble.say(text, speed);
  }

  /** In addition, move the text upwards when chungus goes up  */
  public postUpdate(delta: number) {
    super.postUpdate(delta);
    this.speechBubble.position.y = -this.getZ();
  }

  /** update during Walking state */
  private updateWalking(delta: number): void {
    // Get user input
    const [inX, inY] = this.moveInput;

    // Start charging dash if not already
    if (this.dashChargeTime === 0) {
      this.dashChargeTime = 1;
      this.dashAim.visible = true;
    } else {
      // Keep charging dash
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
      const angle = angleBetweenPoints(ORIGIN, this.dashDest);
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

    if (this.getZ() === 0) {
      if (Math.abs(this.dx) < MOVE_SPEED && Math.abs(this.dy) < MOVE_SPEED) {
        // Moving slowly and on the ground. Switch back to walking.
        this.body.rotation = 0;
        this.activeState = ActiveState.Walking;
      }
      return;
    }
    // When in air, change rotation based on height for kicking effect
    if (this.dx < 0) {
      this.body.rotation = this.getZ() * DASH_BODY_ROTATION_FACTOR;
    } else {
      this.body.rotation = -this.getZ() * DASH_BODY_ROTATION_FACTOR;
    }
  }

  /** Chungus moves slower while hurt and is affected by knockback. */
  private updateHurt(delta: number): void {
    // Affected by knockback. Less control.
    const [inX, inY] = this.moveInput;
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

  /** chungus activates the powerup */
  private activatePower() {
    freezeScore();  // Game is effectively won. No more updating score.
    this.powerTime = 1;
    // Replace the body texture with the power texture.
    this.body.texture = this.powerTexture;
    // Scale down the body so that the new texture is same size as old
    this.body.scale.set(NEW_BODY_SCALE);

    this.dz += 35;  // Do a jump for effect
  }

  /** when powered up */
  private updatePower(delta: number) {
    this.powerTime += delta;

    // Check to see if need to say anything
    const i = this.speechIndex;
    if (i < speeches.length && this.powerTime >= speeches[i].delay) {
      this.say(speeches[i].text, speeches[i].speed);
      this.speechIndex++;

      // Also heal health
      if (this.healthBar.isBelowMaxhealth()) {
        this.healthBar.addHealth(1);
      }
    }

    // Start growing after a delay
    const growTime = this.powerTime - POW_TIME_BEFORE_GROW;
    if (growTime > 0) {
      const nextScale = Math.min(
          STARTING_SCALE + growTime * SCALE_GROW_SPEED,
          MAX_POW_SCALE,
      );
      this.setScale(nextScale);
    }
  }

  /** Reset dash charging variables */
  private finishDashCharging() {
    this.dashChargeTime = 0;
    this.dashAim.visible = false;
    this.dashAim.alpha = 0;
    this.dashAim.tint = 0x000000;
  }
}
