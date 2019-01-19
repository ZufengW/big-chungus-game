import {
  Container,
  Graphics,
  Text,
  TextStyle,
} from '../pixi_alias';

/** to resemble a key on a keyboard */
export class KeyboardKey extends Container {
  public static readonly KEY_WIDTH = 50;

  private bg: Graphics;
  private buttonText: Text;

  constructor(text: string) {
    super();

    // Create the rounded rectangle background
    const bg = new Graphics();
    bg.lineStyle(1, 0x333333, 1);
    bg.beginFill(0xeeeeee);
    bg.drawRoundedRect(0, 0, 50, 50, 8);
    bg.endFill();
    this.addChild(bg);
    this.bg = bg;

    // Create the text
    const style = new TextStyle({
      fontFamily: 'Menlo',
      fontSize: 22,
      fill: 'black',
    });
    const buttonText = new Text(text, style);
    // Padding on the top and left
    buttonText.position.set(KeyboardKey.KEY_WIDTH / 2);
    buttonText.anchor.set(0.5);
    this.buttonText = buttonText;
    this.addChild(buttonText);

    this.setUnpressed();
  }

  public setPressed() {
    this.alpha = 1;
  }
  public setUnpressed() {
    this.alpha = 0.5;
  }
}
