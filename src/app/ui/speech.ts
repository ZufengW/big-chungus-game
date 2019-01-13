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

  // The thing to say
  private targetText: string = '';
  private bg: Graphics;
  private speechText: Text;

  /** How quickly the text appears */
  private speakSpeed: number = SpeechBubble.SPEAK_SPEED_NORMAL;
  private speakProgress: number = 0;
  /** How long to spend displaying the speech bubble */
  private textTimeRemaining = 0;

  constructor() {
    super();

    this.pivot.set(0, TOTAL_HEIGHT);

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
    this.addChild(triangle);

    // Create the rounded rectangle background
    const bg = new Graphics();
    // bg.lineStyle(1, 0x333333, 1);
    bg.beginFill(0xffffff);
    bg.drawRoundedRect(0, 0, 84, 50, 8);
    bg.endFill();
    this.addChild(bg);
    this.bg = bg;

    // Create the text
    const style = new TextStyle({
      fontFamily: 'Menlo',
      fontSize: 22,
      fill: 'black',
    });
    const speechText = new Text('', style);
    // Padding on the top and left
    speechText.position.set(PADDING, this.height - 20);
    speechText.anchor.set(0, 1);
    this.speechText = speechText;
    this.addChild(speechText);

    // Start invisible until something gets said
    this.visible = false;
  }

  /** Begin saying something
   * @param text what to say
   * @param speed (Optional) how fast to say it. Defaults to normal speed.
   */
  public say(text: string, speed = SpeechBubble.SPEAK_SPEED_NORMAL) {
    this.targetText = text;
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
