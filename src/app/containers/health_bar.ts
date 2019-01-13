import {
  Container,
  Filters,
  Graphics,
  Rectangle,
} from '../pixi_alias';

/** width of the inner part of the bar */
const BAR_WIDTH = 128;

const SHOCKWAVE_SPEED = 4;

export class HealthBar extends Container {
  /** Background bar */
  private bgBar: Graphics;
  /** front health bar */
  private outer: Graphics;
  private extensionBar: Graphics;
  private maxHealth: number;
  /** Current health */
  private health: number;

  private shockwaveFilter: Filters.ShockwaveFilter;

  constructor(maxHealth: number) {
    super();

    this.maxHealth = maxHealth;
    this.health = maxHealth;

    // Create the background rectangle
    const bgBar = new Graphics();
    bgBar.beginFill(0xffffff);
    bgBar.drawRect(-2, -2, BAR_WIDTH + 4, 12);
    bgBar.endFill();
    this.addChild(bgBar);
    this.bgBar = bgBar;

    // Create the front red rectangle
    const outerBar = new Graphics();
    outerBar.beginFill(0xFF3300);
    outerBar.drawRect(0, 0, BAR_WIDTH, 8);
    outerBar.endFill();
    this.addChild(outerBar);

    this.outer = outerBar;
    // To allow filters to take up more space
    this.filterArea = new Rectangle(-100, -100, BAR_WIDTH + 200, 212);

    this.shockwaveFilter = new Filters.ShockwaveFilter([60, 50], {
      amplitude: 50,
      brightness: 1,
      wavelength: 100,
      speed: SHOCKWAVE_SPEED,
    });

    // Outer bar extension for powerUp
    const outerBarExt = new Graphics();
    outerBarExt.beginFill(0x00ffff);
    const extentensionWidth = BAR_WIDTH / this.maxHealth;
    outerBarExt.drawRect(0, 0, extentensionWidth , 8);
    outerBarExt.endFill();
    outerBarExt.visible = false;
    this.addChild(outerBarExt);
    this.extensionBar = outerBarExt;
  }

  public update(delta: number) {
    // Update the shockwave filter
    if (this.shockwaveFilter && this.shockwaveFilter.time < 120) {
      this.shockwaveFilter.time += delta;
    }
  }

  /**
   * Change the health value. Can also add a negative amount of health.
   * @param num amount of health to add.
   */
  public addHealth(num: number) {
    this.health += num;
    // Update the appearance of the bar. Don't allow going negative
    const convertedHealth = this.health > 0 ? this.health : 0;
    this.outer.width = (convertedHealth / this.maxHealth) * BAR_WIDTH;
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  /** @return whether or not current health is below max health */
  public isBelowMaxhealth() {
    return this.health < this.maxHealth;
  }

  /** Make this health bar powered up
   * Add another health segment and start a shockwave effect.
   */
  public powerUp() {
    /** extended health bar */
    this.extensionBar.visible = true;
    const extentensionWidth = this.extensionBar.width;
    // Move the existing bars rightwards
    this.outer.position.set(extentensionWidth, 0);
    this.bgBar.width += extentensionWidth;
    this.filters = [this.shockwaveFilter];
  }

  /** Resets the health bar back to starting state */
  public restart() {
    const healthToAdd = this.maxHealth - this.health;
    this.addHealth(healthToAdd);
    // reset filter
    this.filters = [];
    this.shockwaveFilter.time = 0;
    // undo powerUp
    this.extensionBar.visible = false;
    this.bgBar.width = BAR_WIDTH + 4;
    this.outer.position.set(0);
  }
}
