import { APP_WIDTH, APP_WIDTH_HALF, interaction } from '../app';
import { Chungus } from '../containers/chungus';
import {
  Container,
  Point,
  Rectangle,
} from '../pixi_alias';
import { FloatingJoystick, getKeyboardMoveInput } from './input';

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

  constructor(sceneStage: Container, chungus: Chungus) {

    this.chungus = chungus;

    // Create two joysticks and add to stage
    const rectLeft = new Rectangle(0, 0, APP_WIDTH_HALF, APP_WIDTH);
    this.joystickLeft = new FloatingJoystick(rectLeft);
    sceneStage.addChild(this.joystickLeft);
    const rectRight = new Rectangle(APP_WIDTH_HALF, 0, APP_WIDTH_HALF, APP_WIDTH);
    this.joystickRight = new FloatingJoystick(rectRight, {
      onEndCallback: () => {chungus.attemptDash(); },
    });
    sceneStage.addChild(this.joystickRight);
  }

  // return an update function
  public update(delta: number) {
    const player = this.chungus;

    // Get user input. Try touch with fallback to keyboard.
    let moveInput = this.joystickLeft.getDiffNormalised();
    if (moveInput[0] === 0 && moveInput[1] === 0) {
      moveInput = getKeyboardMoveInput();
    }
    player.setMoveInput(moveInput);

    // Set aim position. Use touch with fallback to mouse.
    if (interaction.supportsTouchEvents) {
      const aimInput = this.joystickRight.getDiff();
      player.setDashDest(aimInput[0], aimInput[1]);
    } else {
      // No touch events. Fallback to mouse
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
