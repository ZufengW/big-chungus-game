import { setupMoveKeys } from '../input';
import {
  Texture,
} from '../pixi-alias';
import { Character } from './character';

const MOVE_SPEED = 4;

export class Chungus extends Character {
  public isHit: boolean = false;
  private getInput: () => [number, number];

  constructor(texture: Texture) {
    super(texture);

    // make smaller
    this.setScale(0.6);

    this.getInput = setupMoveKeys();
  }

  public update(delta: number): void {
    super.update(delta);
    // Get user input
    const [inX, inY] = this.getInput();
    this.dx = inX * MOVE_SPEED;
    this.dy = inY * MOVE_SPEED;

    // tint differently if hurt
    this.body.tint = this.isHit ? 0xff0000 : 0xffffff;
  }
}
