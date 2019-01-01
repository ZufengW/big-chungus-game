import { setupMoveKeys } from '../input';
import {
  Rectangle,
  Texture,
} from '../pixi-alias';
import { MovingContainer } from './moving-container';

export class Chungus extends MovingContainer {
  public isHit: boolean = false;
  private speed: number = 0;

  constructor(texture: Texture, speed: number) {
    super(texture);
    this.speed = speed;

    // make smaller
    this.setScale(0.6);

    setupMoveKeys(this, this.speed);
  }

  public update(delta: number): void {
    // tint differently if hurt
    this.body.tint = this.isHit ? 0xff0000 : 0xffffff;
  }
}
