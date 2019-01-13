import {
  Container,
  Graphics,
  Text,
  TextStyle,
} from '../pixi_alias';

/** padding between the edges of the button and the text */
const PADDING_VERTICAL = 8;
const PADDING_HORIZONTAL = 20;

/**
 * Clickable button
 */
export class Button extends Container {

  private bg: Graphics;
  private buttonText: Text;

  /**
   * Clickable button
   * @param text button text
   * @param onClick function to call when button is clicked
   */
  constructor(text: string, onClick: () => void) {
    super();

    // Opt-in to interactivity
    this.interactive = true;
    // Shows hand cursor
    this.buttonMode = true;
    // Pointers normalize touch and mouse
    this.on('pointerdown', onClick)
        .on('pointerover', this.onOver)
        .on('pointerout', this.onOut);

    // Create the rounded rectangle background
    const bg = new Graphics();
    bg.lineStyle(1, 0x333333, 1);
    bg.beginFill(0xffffff);
    bg.drawRoundedRect(0, 0, 50, 50, 8);
    bg.endFill();
    this.addChild(bg);
    this.bg = bg;

    // Create the text
    const style = new TextStyle({
      fontFamily: 'Futura',
      fontSize: 22,
      fill: 'black',
    });
    const buttonText = new Text(text, style);
    // Padding on the top and left
    buttonText.position.set(PADDING_HORIZONTAL, PADDING_VERTICAL);
    this.buttonText = buttonText;
    this.addChild(buttonText);

    this.bg.width = this.buttonText.width + PADDING_HORIZONTAL * 2;
    this.bg.height = this.buttonText.height + PADDING_VERTICAL * 2;
  }

  /** darken the background when pointer hovers over */
  private onOver() {
    this.bg.tint = 0xcccccc;
  }

  private onOut() {
    this.bg.tint = 0xffffff;
  }
}
