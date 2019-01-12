import {
  Texture,
} from '../pixi_alias';
import { IRespawnable } from './factory';
import { MovingContainer } from './moving_container';

/**
 * Carrot is a pickup
 */
export class Carrot extends MovingContainer implements IRespawnable {

  constructor(texture: Texture, power: boolean = false) {
    super(texture);
    this.init();
  }

  /**
   * Reset a Carrot.
   * Limitation: assume is a normal carrot
   */
  public init() {
    this.setScale(0.4);
    this.body.tint = 0xffffff;
    this.setZ(500);
    this.dz = -1;
    this.visible = true;
  }

  public isInactive() {
    return !this.visible;
  }

  /** Carrot gets consumed */
  public pickUp() {
    this.visible = false;
  }
}
