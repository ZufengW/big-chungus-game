import {
  Container,
  Graphics,
} from '../pixi_alias';

/** to resemble a key on a keyboard */
export class FakeCursor extends Container {
  public static readonly KEY_WIDTH = 50;

  private bg: Graphics;

  constructor() {
    super();

    // Create the cursor shape
    const bg = new Graphics();
    bg.lineStyle(1, 0x333333, 1);
    bg.beginFill(0xFFFFFF);
    bg.moveTo(0, 0);
    bg.lineTo(0, 0);
    bg.lineTo(10, 30);

    bg.lineTo(15, 15);
    bg.lineTo(30, 10);
    bg.lineTo(0, 0);
    this.addChild(bg);
    this.bg = bg;

    this.setUnpressed();
  }

  public setPressed() {
    this.alpha = 1;
    this.bg.tint = 0xffffff;
  }
  public setUnpressed() {
    this.alpha = 0.5;
    this.bg.tint = 0x333333;
  }
}
