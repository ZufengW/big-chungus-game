import {
  Texture,
} from '../pixi-alias';
import { IRespawnable } from './factory';
import { MovingContainer } from './moving-container';

/** Ideally, this elevation should be the same as the gun barrel's */
const BULLET_ELEVATION = 40;
/** How long bullet lasts for (frames) */
const BULLET_LIFE = 120;

export class Bullet extends MovingContainer implements IRespawnable {
  /** Whether or not the bullet is active */
  private isActive = true;
  private lifeRemaining = BULLET_LIFE;

  constructor(texture: Texture) {
    super(texture);
    this.setZ(BULLET_ELEVATION);
  }

  public init() {
    this.lifeRemaining = BULLET_LIFE;
    this.isActive = true;
    this.visible = true;
  }

  public isInactive(): boolean {
    return !this.isActive;
  }

  /**
   * Bullets don't change direction. They only decrease in lifetime.
   * @param delta frame time
   */
  public postUpdate(delta: number) {
    super.postUpdate(delta);

    // update life
    this.lifeRemaining -= delta;
    if (this.lifeRemaining <= 0) {
      // deactivate the bullet
      this.isActive = false;
      this.visible = false;
    }
  }
}
