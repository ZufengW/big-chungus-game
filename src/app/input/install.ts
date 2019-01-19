import { APP_WIDTH, APP_WIDTH_HALF, interaction } from '../app';
import { Chungus } from '../containers/chungus';
import {
  Container,
  Point,
  Rectangle,
} from '../pixi_alias';
import { FloatingJoystick } from './joystick';
import { getKeyboardMoveInput } from './keyboard';

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

  /**
   *
   * @param sceneStage scene to add this manager to.
   * The manager adds the joysticks as children of this scene.
   * @param chungus player controlled
   */
  constructor(sceneStage: Container, chungus: Chungus) {

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
  }

  /** check user input */
  public update(delta: number) {
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
}
