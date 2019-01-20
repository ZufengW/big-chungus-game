import { APP_WIDTH, APP_WIDTH_HALF, interaction } from '../app';
import { Chungus } from '../containers/chungus';
import { normalise } from '../helpers';
import {
  Container,
  Point,
  Rectangle,
} from '../pixi_alias';
import { FakeCursor } from '../ui/fake_cursor';
import { KeyboardKey } from '../ui/keyboard_key';
import { FloatingJoystick } from './joystick';
import { getKeyboardMoveInput } from './keyboard';

// For demo
const KEY_HOLD_DURATION = 60;

/**
 * Creates and manages things for user input to control player.
 * * left and right joystick
 * * keyboard
 * * mouse position and click
 */
export class PlayerInputManager {

  private mapDashDestPos: Point = new Point(0, 0);
  private chungus: Chungus;
  private joystickLeft: FloatingJoystick;
  private joystickRight: FloatingJoystick;
  /** Just to be safe in case supportsTouchEvents can somehow change */
  private touchEventsSupported = false;

  // For demo
  private keyW: KeyboardKey;
  private keyA: KeyboardKey;
  private keyS: KeyboardKey;
  private keyD: KeyboardKey;
  private keyHolder: Container;
  private demoCursor: FakeCursor;
  private onEndCallback: () => void;

  /** how long the demo has been running for. Value of 0 means not started */
  private demoTime = 0;

  /**
   *
   * @param sceneStage scene to add this manager to.
   * The manager adds the joysticks as children of this scene.
   * @param chungus player controlled
   * @param addDemo whether or not to add the things needed for the demo
   *   (default false)
   */
  constructor(sceneStage: Container, chungus: Chungus, addDemo = false) {

    this.chungus = chungus;

    // If the device allows touch, create two joysticks and add to stage
    this.touchEventsSupported = interaction.supportsTouchEvents;
    if (this.touchEventsSupported) {
      const rectLeft = new Rectangle(0, 0, APP_WIDTH_HALF, APP_WIDTH);
      this.joystickLeft = new FloatingJoystick(rectLeft, {
        preview: true,
      });
      sceneStage.addChild(this.joystickLeft);
      // Right joystick takes up the right side of the screen
      const rectRight = new Rectangle(0, 0, APP_WIDTH_HALF, APP_WIDTH);
      this.joystickRight = new FloatingJoystick(rectRight, {
        onEndCallback: () => {chungus.attemptDash(); },
        preview: true,
      });
      this.joystickRight.position.set(APP_WIDTH_HALF, 0);
      sceneStage.addChild(this.joystickRight);
    }

    if (addDemo) {
      this.setupDemo(sceneStage);
    }
  }

  /** check user input */
  public update(delta: number) {
    if (this.demoTime > 0) {
      this.demoTime += delta;
      this.demoUpdate(delta);
    } else {
      this.normalUpdate(delta);
    }

  }

  /** Start the Demo of the controls of the game
   * @param onEndCallback function to call when the demo ends
   */
  public startDemo(onEndCallback?: () => void) {
    this.keyHolder.visible = true;
    this.demoCursor.visible = true;
    this.demoTime = 1;
    if (onEndCallback) {
      this.onEndCallback = onEndCallback;
    }
    this.chungus.say('Here\'s how it\'s done');
  }

  /** Call this to end the demo */
  public endDemo() {
    this.keyHolder.visible = false;
    this.demoCursor.visible = false;
    this.demoTime = 0;
    if (this.onEndCallback) {
      this.onEndCallback();
    }
  }

  /** @return Whether or not the demo is running */
  public isDemoRunning(): boolean {
    return this.demoTime > 0;
  }

  /** Get user input and apply to chungus */
  private normalUpdate(delta: number) {
    const player = this.chungus;

    // Set aim position. Use touch with fallback to mouse.
    if (this.touchEventsSupported) {
      player.setMoveInput(this.joystickLeft.getDiffNormalised());

      const aimInput = this.joystickRight.getDiff();
      player.setDashDest(aimInput[0], aimInput[1]);
    } else {
      // No touch events. Fallback to keyboard and mouse
      player.setMoveInput(getKeyboardMoveInput());

      this.mapDashDestPos = interaction.mouse.getLocalPosition(
          player.parent, this.mapDashDestPos,
      );
      player.setDashDest(
        this.mapDashDestPos.x - player.x,
        this.mapDashDestPos.y - player.y,
      );
      // If mouse down, attempt to dash.
      if (interaction.mouse.buttons !== 0) {
        player.attemptDash();
      }
    }
  }

  private demoUpdate(delta: number) {
    const player = this.chungus;
    const moveInput: [number, number] = [0, 0];
    const t = this.demoTime;
    const APP_WIDTH_QUARTER = APP_WIDTH_HALF / 2;

    // Cursor offsets (express as coordinates relative to player's position)
    let xCursorOffset = -APP_WIDTH_QUARTER;
    let yCursorOffset = -100;

    if (t < 3 * KEY_HOLD_DURATION) {
      // Move towards position
      return;
    } else if (t < 4 * KEY_HOLD_DURATION) {
      this.keyW.setPressed();
      moveInput[1] -= 1;
    } else if (t < 5 * KEY_HOLD_DURATION) {
      this.keyW.setUnpressed();
      this.keyA.setPressed();
      moveInput[0] -= 1;
    } else if (t < 6 * KEY_HOLD_DURATION) {
      this.chungus.say('');
      this.keyA.setUnpressed();
      this.keyS.setPressed();
      moveInput[1] += 1;
    } else if (t < 7 * KEY_HOLD_DURATION) {
      this.keyS.setUnpressed();
      this.keyD.setPressed();
      moveInput[0] += 1;
    } else if (t < 8 * KEY_HOLD_DURATION) {
      this.keyD.setUnpressed();
    } else if (t < 8 * KEY_HOLD_DURATION + Math.PI * 2 * KEY_HOLD_DURATION) {
      const tSince = t - 8 * KEY_HOLD_DURATION;
      xCursorOffset = -APP_WIDTH_QUARTER * Math.cos(tSince * 0.05);
      if (tSince >= Math.PI * KEY_HOLD_DURATION) {
        yCursorOffset = APP_WIDTH_QUARTER * Math.sin(tSince * 0.05) - 100;
      }
    } else if (t < 15.5 * KEY_HOLD_DURATION) {
      // Wait
    } else if (t < 15.6 * KEY_HOLD_DURATION) {
      // Activate the dash
      this.demoCursor.setPressed();
      if (this.joystickRight) {
        this.joystickRight.alpha = 0.5;
      }
      player.attemptDash();
    } else if (t < 16.5 * KEY_HOLD_DURATION) {
      this.demoCursor.setUnpressed();
      if (this.joystickRight) {
        this.joystickRight.setHeadPos(0, 0);
      }
    } else {
      this.endDemo();
      return;
    }

    // Pass the demo input to the player
    player.setMoveInput(moveInput);

    // Note that the fake cursor's position is relative to the sceneState
    player.setDashDest(
      xCursorOffset,
      yCursorOffset,
    );

    const playerGlobalPos = player.getGlobalPosition();
    this.demoCursor.position.set(
      playerGlobalPos.x + xCursorOffset,
      playerGlobalPos.y + yCursorOffset,
    );

    // Update the position of the joysticks to match the demo input
    if (this.touchEventsSupported) {
      this.joystickLeft.setHeadPos(moveInput[0], moveInput[1]);

      const [x, y] = normalise([xCursorOffset, yCursorOffset]);
      this.joystickRight.setHeadPos(x, y);
    }
    return;
  }

  private setupDemo(sceneStage: Container) {
    const width = KeyboardKey.KEY_WIDTH;
    this.keyW = new KeyboardKey('W');
    this.keyA = new KeyboardKey('A');
    this.keyS = new KeyboardKey('S');
    this.keyD = new KeyboardKey('D');

    this.keyW.position.x = width;
    this.keyA.position.y = width;
    this.keyS.position.set(width);
    this.keyD.position.set(width * 2, width);

    this.keyHolder = new Container();

    this.keyHolder.addChild(this.keyW);
    this.keyHolder.addChild(this.keyA);
    this.keyHolder.addChild(this.keyS);
    this.keyHolder.addChild(this.keyD);

    this.keyHolder.position.set(APP_WIDTH_HALF / 2, APP_WIDTH * 0.6);

    this.demoCursor = new FakeCursor();
    // this.demoCursor.position.set(APP_WIDTH_HALF / 2);
    const APP_WIDTH_QUARTER = APP_WIDTH_HALF / 2;
    const playerPos = this.chungus.getGlobalPosition();
    this.demoCursor.position.set(
      playerPos.x - APP_WIDTH_QUARTER,
      playerPos.y - 100,
    );

    if (!this.touchEventsSupported) {
      sceneStage.addChild(this.demoCursor);

      sceneStage.addChild(this.keyHolder);
    }
  }
}
