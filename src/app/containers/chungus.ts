import { setupMoveKeys } from '../input';
import {
  Texture,
} from '../pixi-alias';
import { Character } from './character';

export class Chungus extends Character {
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
    super.update(delta);
    // tint differently if hurt
    this.body.tint = this.isHit ? 0xff0000 : 0xffffff;
  }
}
