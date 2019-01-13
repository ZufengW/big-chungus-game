import { restartCurrentScene, startTitleScene } from '../app';
import {
  Container,
  Graphics,
  Text,
  TextStyle,
} from '../pixi_alias';
import { Button } from './button';

/** what kind of UI */
export enum Kind {
  Lose,
  Win,
}

/** padding between the edges of the button and the text */
const PADDING_VERTICAL = 8;
const PADDING_HORIZONTAL = 20;

const LOSE_TEXT = 'Game Over';
const WIN_TEXT = 'You Win!';

/**
 * Lose Window
 */
export class WinLoseUI extends Container {

  private bg: Graphics;
  private captionText: Text;

  /**
   * Create a Lose window
   */
  constructor(kind?: Kind) {
    super();

    // Create the rounded rectangle background
    const bg = new Graphics();
    bg.lineStyle(1, 0x333333, 1);
    bg.beginFill(0xffffff);
    bg.drawRect(0, 0, 100, 50);
    bg.endFill();
    this.addChild(bg);
    this.bg = bg;

    // Create the text
    const style = new TextStyle({
      fontFamily: 'Futura',
      fontSize: 22,
      fill: '#ffffaa',
      stroke: 'black',
      strokeThickness: 3,
      dropShadow: true,
      dropShadowColor: 'black',
      dropShadowBlur: 4,
      dropShadowDistance: 3,
    });

    const caption = new Text(LOSE_TEXT, style);
    // Padding on the top and left
    caption.position.set(PADDING_HORIZONTAL, PADDING_VERTICAL);
    this.captionText = caption;
    this.addChild(caption);

    // Create the buttons
    const titleButton = new Button('Title', () => {startTitleScene(); });
    titleButton.position.set(
        PADDING_HORIZONTAL,
        PADDING_VERTICAL + caption.height + PADDING_VERTICAL,
    );
    this.addChild(titleButton);

    const playAgainButton = new Button('Again', this.onClickPlayAgain);
    playAgainButton.position.set(
        PADDING_HORIZONTAL * 2 + titleButton.width,
        PADDING_VERTICAL + caption.height + PADDING_VERTICAL,
    );
    this.addChild(playAgainButton);

    if (kind) {
      this.setKind(kind);
    }

    // Resize background to cover buttons
    this.bg.width = playAgainButton.width + titleButton.width
        + PADDING_HORIZONTAL * 3;
    this.bg.height = playAgainButton.height + caption.height
        + PADDING_VERTICAL * 3;
  }

  /** Update the appearance of the UI */
  public setKind(kind: Kind) {
    // taz brown or blue
    const bgFill = kind === Kind.Lose ? 0x82613e : 0x3d6782;
    const captionText = kind === Kind.Lose ? LOSE_TEXT : WIN_TEXT;
    this.captionText.text = captionText;
    this.bg.tint = bgFill;
  }

  private onClickPlayAgain() {
    console.log('click play again'); // TODO: restart the level
    restartCurrentScene();
  }
}
