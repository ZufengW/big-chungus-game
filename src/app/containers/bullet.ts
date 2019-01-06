import {
  Texture,
} from '../pixi-alias';
import { IRespawnable } from './factory';
import { MovingContainer } from './moving-container';

/** Ideally, this elevation should be the same as the gun barrel's */
const BULLET_ELEVATION = 40;

export class Bullet extends MovingContainer implements IRespawnable {
  private isActive = true;

  constructor(texture: Texture) {
    super(texture);
    this.setZ(BULLET_ELEVATION);
  }

  public init() {
    // TODO: implement
  }

  public isInactive(): boolean {
    return !this.isActive;
  }

  public update(delta: number) {
    // TODO: life counter
  }
}
