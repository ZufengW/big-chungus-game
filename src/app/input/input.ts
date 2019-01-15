import { lengthSquared, normalise, pointTo } from '../helpers';
import {
  Container, Graphics, InteractionData, InteractionEvent, Point, Rectangle,
} from '../pixi_alias';

/**
 * For getting user input.
 */

/**
 * Set up arrow keys for a sprite to move.
 * @param spriteToMove
 * @param speed move speed
 * @return coordinates with length normalised to 1
 */
export function setupMoveKeys(): () => [number, number] {
  // Capture the keyboard arrow keys and WASD
  const left = keyboard('ArrowLeft');
  const up = keyboard('ArrowUp');
  const right = keyboard('ArrowRight');
  const down = keyboard('ArrowDown');
  const w = keyboard('w');
  const a = keyboard('a');
  const s = keyboard('s');
  const d = keyboard('d');

  // function to call to get resultant input direction
  return (): [number, number] => {
    // resultant x and y
    let x = 0;
    let y = 0;

    if (up.isDown || w.isDown) {
      y -= 1;
    }
    if (right.isDown || d.isDown) {
      x += 1;
    }
    if (down.isDown || s.isDown) {
      y += 1;
    }
    if (left.isDown || a.isDown) {
      x -= 1;
    }
    return normalise([x, y]);
  };
}

/**
 * Attaches listeners to make a key suitable for getting user input
 * @param value of the key
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 */
function keyboard(value: string) {
  const key: {
    value: string,
    isDown: boolean,
    isUp: boolean,
    press: () => void,
    release: () => void,
    downHandler: (event: any) => void,
    upHandler: (event: any) => void,
    unsubscribe: () => void,
  } = {
    value,
    isDown: false,
    isUp: true,
    press: undefined,
    release: undefined,
    downHandler: undefined,
    upHandler: undefined,
    unsubscribe: undefined,
  };

  // The `downHandler`
  key.downHandler = (event) => {
    if (event.key === key.value) {
      if (key.isUp && key.press) {
        key.press();
      }
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  // The `upHandler`
  key.upHandler = (event) => {
    if (event.key === key.value) {
      if (key.isDown && key.release) {
        key.release();
      }
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  // Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);

  window.addEventListener('keydown', downListener, false);
  window.addEventListener('keyup', upListener, false);

  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener('keydown', downListener);
    window.removeEventListener('keyup', upListener);
  };

  return key;
}

/** Radius of outer circle (joystick base) */
const OUTER_RADIUS = 100;
const INNER_RADIUS = 40;

// max distance of joystick from middle
const JOYSTICK_DIST = 80;
const JOYSTICK_DIST_SQUARED = JOYSTICK_DIST ** 2;

export class FloatingJoystick extends Container {

  /** the base of the joystick */
  private outerCircle: Graphics;
  /** The joystick */
  private innerCircle: Graphics;

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
   *
   */
  constructor(hitArea: Rectangle, opts?: {
    onEndCallback: () => void,
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
    // console.log('new touch', this.width, this.height, this.hitArea);

    this.innerCircle.visible = false;
    this.outerCircle.visible = false;
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

  /** When touch starts, move the entire joystick here.
   * This means the diff becomes [0, 0] until the user moves the joystick.
   */
  private onStart(event: InteractionEvent) {
    const startPos = event.data.getLocalPosition(this.parent);
    // Store a reference to the data so we can track the movement of this
    // particular touch. (For multi-touch)
    this.eventData = event.data;
    this.innerCircle.visible = true;
    this.outerCircle.visible = true;
    this.outerCircle.position = startPos;
    this.innerCircle.position = startPos;
    this.dragging = true;
  }

  /** When touch moves, keep the outer in place, but move inner towards pos */
  private onMove() {
    if (this.dragging) {
      const currPos = this.eventData.getLocalPosition(this.parent);
      this.setJoystickHeadPos(currPos);
    }
  }

  private onEnd() {
    // hide visibility of joystick
    this.innerCircle.visible = false;
    this.outerCircle.visible = false;
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
