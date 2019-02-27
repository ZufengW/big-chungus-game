import { lengthSquared, normalise, pointTo } from '../helpers';
import {
  Container, Graphics, InteractionData, InteractionEvent, Point, Rectangle,
} from '../pixi_alias';

/** Radius of outer circle (joystick base) */
const OUTER_RADIUS = 100;
const INNER_RADIUS = 40;

/** max distance of joystick from middle */
const JOYSTICK_DIST = 80;
const JOYSTICK_DIST_SQUARED = JOYSTICK_DIST ** 2;

/** For user input -- touch control. Can be dragged. */
export class FloatingJoystick extends Container {

  /** when user is not touching the joystick, it's visible at a lower alpha */
  public static readonly NO_TOUCH_ALPHA = 0.5;

  /** the base of the joystick */
  private outerCircle: Graphics;
  /** The joystick */
  private innerCircle: Graphics;

  /** if enabled, will respond to touch events */
  private isEnabled: boolean = true;
  /** Whether or not the joystick is being dragged (pointer is down) */
  private dragging = false;
  private eventData: InteractionData;
  // callbacks
  private onEndCallback: () => void;

  /**
   * Create a new floating joystick
   * @param hitArea boundary rectangle of the floating joystick
   * @param opts more options such as callbacks
   * * onEndCallback function to call when drag (that started in the area)
   *    ends.
   * * preview whether or not the joysticks should start visible
   *
   */
  constructor(hitArea: Rectangle, opts?: {
    onEndCallback?: () => void,
    preview?: boolean,
  }) {
    super();

    this.interactive = true;
    /** The rectangle that can be hit */
    this.hitArea = hitArea;
    // Apply options
    if (opts) {
      this.onEndCallback = opts.onEndCallback;
    }

    // Outer circle: joystick base
    const outerCircle = new Graphics();
    outerCircle.beginFill(0xffffff);
    outerCircle.drawCircle(0, 0, OUTER_RADIUS);
    outerCircle.endFill();
    outerCircle.alpha = 0.2;

    this.addChild(outerCircle);
    this.outerCircle = outerCircle;

    // Inner circle: joystick top
    const innerCircle = new Graphics();
    innerCircle.beginFill(0xffffff);
    innerCircle.drawCircle(0, 0, INNER_RADIUS);
    innerCircle.endFill();
    innerCircle.alpha = 0.5;

    this.addChild(innerCircle);
    this.innerCircle = innerCircle;

    // For both mouse and touch events
    // this.on('pointerdown', this.onStart)
    //     .on('pointermove', this.onMove)
    //     .on('pointerup', this.onEnd);

    // For touch-only events
    this.on('touchstart', this.onStart)
        .on('touchmove', this.onMove)
        .on('touchend', this.onEnd)
        .on('touchendoutside', this.onEnd)
        .on('touchcancel', this.onEnd);

    this.resetPos();
    // If preview, keep the joystick at full visibility
    this.alpha = opts && opts.preview
        ? 1
        : FloatingJoystick.NO_TOUCH_ALPHA;
  }

  /**
   * Set the position of the joystick to the bottom-center of the hit area.
   * And reset the joystick head to be in the middle.
   */
  public resetPos() {
    const hitArea = this.hitArea as Rectangle;
    const xNew = hitArea.width * 0.5;
    const yNew = hitArea.height * 0.75;
    this.innerCircle.position.set(xNew, yNew);
    this.outerCircle.position.set(xNew, yNew);
  }

  /** @return the coordinate from joystick base to joystick top,
   * or [0, 0] if not active.
   */
  public getDiff(): [number, number] {
    if (this.dragging) {
      return [
          this.innerCircle.x - this.outerCircle.x,
          this.innerCircle.y - this.outerCircle.y,
      ];
    }
    return [0, 0];
  }

  /** Returns position of joystick relative to base, normalised.
   * [0, 0] if not active.
   */
  public getDiffNormalised(): [number, number] {
    return normalise(this.getDiff());
  }

  public isDragging() {
    return this.dragging;
  }

  /**
   * Set the position of the head of the joystick relative to the body.
   * Can use to demo.
   * @param xOffset x offset from [0, 1]
   * @param yOffset y offset from [0, 1]
   */
  public setHeadPos(xOffset: number, yOffset: number) {
    const dist = JOYSTICK_DIST * 0.75;
    this.innerCircle.position.set(
      this.outerCircle.x + dist * xOffset,
      this.outerCircle.y + dist * yOffset,
    );
  }

  /**
   * Enable or disable the joystick responding to touch events.
   * @param enabled either true or false
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /** When touch starts, move the entire joystick here.
   * This means the diff becomes [0, 0] until the user moves the joystick.
   */
  private onStart(event: InteractionEvent) {
    if (!this.isEnabled) {
      return;
    }
    const startPos = event.data.getLocalPosition(this);
    // Store a reference to the data so we can track the movement of this
    // particular touch. (For multi-touch)
    this.eventData = event.data;
    this.alpha = 1;
    this.outerCircle.position = startPos;
    this.innerCircle.position = startPos;
    this.dragging = true;
  }

  /** When touch moves, keep the outer in place, but move inner towards pos */
  private onMove() {
    if (this.dragging && this.isEnabled) {
      const currPos = this.eventData.getLocalPosition(this);
      this.setJoystickHeadPos(currPos);
    }
  }

  /** When touch ends, reduce visibility and reset position of joystick head */
  private onEnd() {
    if (!this.isEnabled) {
      return;
    }
    // Hide visibility of joystick only if it was dragging to begin with
    // So previews won't get hidden too early
    if (this.dragging) {
      this.alpha = FloatingJoystick.NO_TOUCH_ALPHA;
      this.innerCircle.position = this.outerCircle.position;
    }
    // Need to check this.dragging because otherwise will also trigger if start
    // drag from outside this joystick but end inside.
    if (this.onEndCallback && this.dragging) {
      this.onEndCallback();
    }
    this.dragging = false;
    this.eventData = null;
  }

  /** Set the position of the inner circle */
  private setJoystickHeadPos(localPos: Point) {
    const [xDiff, yDiff] = pointTo(this.outerCircle.position, localPos);
    if (lengthSquared([xDiff, yDiff]) > JOYSTICK_DIST_SQUARED) {
      // Limit the max distance of the joystick head from the base
      const [x, y] = normalise([xDiff, yDiff]);
      this.innerCircle.position.set(
          x * JOYSTICK_DIST + this.outerCircle.position.x,
          y * JOYSTICK_DIST + this.outerCircle.position.y,
      );
    } else {
      this.innerCircle.position = localPos;
    }
  }
}
