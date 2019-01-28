import { APP_WIDTH } from '../app';
import {
  Container,
  Graphics,
  Text,
  TextStyle,
} from '../pixi_alias';

const TOTAL_HEIGHT = 60;

/** multiplier for how long the text should remain visible once finished.
 * Lower number is longer duration.
 */
const TEXT_REMAIN_FACTOR = 0.0625;
/** extra length added to text to make it stay for longer */
const TEXT_REMAIN_EXTRA = 10;

/** padding between the edges of the bubble and the text */
const PADDING = 10;
const PADDING_X2 = PADDING * 2;

/**
 * Speech bubble containing text.
 */
export class SpeechBubble extends Container {

  /** speed for text to appear */
  public static readonly SPEAK_SPEED_NORMAL = 0.5;
  public static readonly SPEAK_SPEED_SLOW = 0.25;

  /** The thing to say */
  private targetText: string = '';
  /** Contains the bg and text.
   * Used for positioning and width/height calculations.
   */
  private container: Container;
  private bg: Graphics;
  private speechText: Text;

  /** How quickly the text appears */
  private speakSpeed: number = SpeechBubble.SPEAK_SPEED_NORMAL;
  private speakProgress: number = 0;
  /** How long to spend displaying the speech bubble */
  private textTimeRemaining = 0;
  /** The full width of the speech bubble after finished speaking */
  private fullWidth = 0;

  constructor() {
    super();

    this.pivot.set(0, TOTAL_HEIGHT);

    this.container = new Container();

    // draw a triangle
    const triangle = new Graphics();
    // triangle.lineStyle(1, 0x333333, 1);
    triangle.beginFill(0xFFFFFF);
    triangle.moveTo(0, 0);
    // The triangle's x/y position is anchored to its first point in the path
    triangle.lineTo(0, -20);
    triangle.lineTo(20, -20);
    triangle.lineTo(0, 0);
    triangle.position.set(0, TOTAL_HEIGHT);
    this.container.addChild(triangle);

    // Create the rounded rectangle background
    const bg = new Graphics();
    // bg.lineStyle(1, 0x333333, 1);
    bg.beginFill(0xffffff);
    bg.drawRoundedRect(0, 0, 84, 50, 8);
    bg.endFill();
    this.container.addChild(bg);
    this.bg = bg;

    // Create the text
    const style = new TextStyle({
      fontFamily: 'Menlo',
      fontSize: 22,
      fill: 'black',
    });
    const speechText = new Text('', style);
    // Padding on the top and left
    speechText.position.set(PADDING, this.container.height - 20);
    speechText.anchor.set(0, 1);
    this.speechText = speechText;
    this.container.addChild(speechText);

    this.addChild(this.container);

    // Start invisible until something gets said
    this.visible = false;
  }

  /** Begin saying something
   * @param text what to say. If empty string (''), then it will stop speaking.
   * @param speed (Optional) how fast to say it. Defaults to normal speed.
   */
  public say(text: string, speed = SpeechBubble.SPEAK_SPEED_NORMAL) {
    this.targetText = text;
    this.visible = false;
    if (text === '') {
      return;
    }
    // calculate the total expected width first
    this.updateText(text);
    this.fullWidth = this.container.width;

    this.speakProgress = 0;
    this.textTimeRemaining = text.length + TEXT_REMAIN_EXTRA;
    this.updateText('');  // Clear the previous text before making visible
    this.speakSpeed = speed;
    this.visible = true;
  }

  /**
   * Update the text scrolling
   * @param delta frame time
   */
  public update(delta: number) {
    if (!this.visible) {
      return;  // only update when visible
    }
    if (this.speakProgress <= this.targetText.length) {
      this.speakProgress += this.speakSpeed * delta;
      // Continue scrolling message
      const newText = this.targetText.slice(0, Math.floor(this.speakProgress));
      this.updateText(newText);
    } else {
      // Finished speaking.
      // Text remains visible for time proportional to length of text.
      this.textTimeRemaining -= TEXT_REMAIN_FACTOR * delta;
      if (this.textTimeRemaining < 0) {
        this.visible = false;
      }
    }
    // Prevent the bubble from going off the right of the screen
    // Note: doesn't take parent's scale into account.
    const parentScale = this.parent.scale.x;
    const oneOverParentScale = 1 / parentScale;
    const globalPos = this.getGlobalPosition();
    const xDiff = globalPos.x + (this.fullWidth * parentScale) - APP_WIDTH;
    if (xDiff > 0) {
      this.bg.x = -xDiff * oneOverParentScale;
      this.speechText.x = PADDING - xDiff * oneOverParentScale;
    } else {
      this.bg.x = 0;
      this.speechText.x = PADDING;
    }
    // Prevent the bubble from going beyond the top of the screen
    const yDiff = globalPos.y - this.container.height * parentScale;
    if (yDiff < 0) {
      this.container.y = -yDiff * oneOverParentScale;
    } else {
      this.container.y = 0;
    }
  }

  /** Update the appearance of the speech bubble with new text */
  private updateText(text: string) {
    this.speechText.text = text;
    // bg needs to cover text
    this.bg.width = this.speechText.width + PADDING_X2;
    this.bg.height = this.speechText.height + PADDING_X2;
    // Note that speechText is anchored at the bottom-left
    // but bg is anchored at the top-left
    this.bg.position.y = this.speechText.y - this.speechText.height - PADDING;
  }
}
