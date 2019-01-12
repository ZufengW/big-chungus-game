import {
  Texture,
} from '../pixi_alias';
import { IRespawnable } from './factory';
import { MovingContainer } from './moving_container';

/** type of carrot */
enum CarrotType {
  Normal,
  Power,
}

/**
 * Carrot is a pickup
 */
export class Carrot extends MovingContainer implements IRespawnable {
  /** Whether or not the boulder is currently moving quickly */
  private type: CarrotType = CarrotType.Normal;

  constructor(texture: Texture, type: CarrotType = CarrotType.Normal) {
    super(texture);
    this.type = type;
    if (this.type === CarrotType.Normal) {
      this.setScale(0.5);
    } else {  // Power
      this.body.tint = 0xffff00;
    }

    this.setZ(500);
    this.dz = -1;
  }

  /**
   * Reset a Carrot.
   * Limitation: assume is a normal carrot
   */
  public init() {
    this.visible = true;
    this.setZ(500);
    this.dz = -1;
  }

  public isInactive() {
    return !this.visible;
  }

  /** Carrot gets consumed */
  public pickUp() {
    this.visible = false;
  }
}
