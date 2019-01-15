import { APP_WIDTH, APP_WIDTH_HALF, interaction, startPlayScene } from '../app';
import { Boulder } from '../containers/boulder';
import { Chungus } from '../containers/chungus';
import { HealthBar } from '../containers/health_bar';
import { FloatingJoystick, setupMoveKeys } from '../input';
import {
  Container,
  loader,
  Point,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  ZContainer,
} from '../pixi_alias';
import * as R from '../resources';
import { Button } from '../ui/button';
import { SpeechBubble } from '../ui/speech';
import {
  DUNGEON_MAX_X, DUNGEON_MAX_Y, DUNGEON_MIN_X, DUNGEON_MIN_Y,
  updateLayersOrder,
} from './play';
import { ISceneType } from './scene';

const resources = loader.resources;  // Alias

/** Things chungus says. delay is after what delay */
const speeches = [
  {
    text: 'My very own game.',
    delay: 60 * 3,
    speed: SpeechBubble.SPEAK_SPEED_NORMAL,
  },
  {
    text: 'I hope it has carrots.',
    delay: 60 * 10,
    speed: SpeechBubble.SPEAK_SPEED_NORMAL,
  },
];
let speechIndex = 0;
/** amount of time spent in this scene */
let sceneTime = 0;

// Things used in the game
let chungus: Chungus;  // the player
let healthBar: HealthBar;  // player's health bar
let boulder: Boulder;
let map: Sprite;

// User input
/** mouse position in stage coordinates, for dashing */
let mapDashDestPos: Point = new Point(0, 0);
/** record the most recent joystickRight non-zero input
 * Begin on [1, 0] due to default dash aim angle
 */
const prevJoystickRightDiff = [1, 0];
// for moving
let joystickLeft: FloatingJoystick;
let joystickRight: FloatingJoystick;
let getKeyboardMoveInput: () => [number, number];

/** Create the stage */
export function create(): ISceneType {
  const sceneStage = new Container();

  // create a map
  map = new Sprite(resources[R.MAP_PATH].texture);
  // Position it right in the middle without changing the anchor
  const mapOffset = Math.round(APP_WIDTH_HALF - map.width / 2);
  map.position.set(mapOffset);
  sceneStage.addChild(map);

  // Create a health bar and hide it
  healthBar = new HealthBar(5);
  healthBar.pivot.set(0, healthBar.height / 2);
  healthBar.position.set(60, 60);
  healthBar.visible = false;
  // Create the player
  chungus = new Chungus(resources[R.CHUNGUS_PATH].texture, healthBar, resources[R.CHUNGUS_POWER_PATH].texture);
  chungus.position.set(APP_WIDTH_HALF, APP_WIDTH_HALF);
  map.addChild(chungus);

  boulder = new Boulder(resources[R.BOULDER_PATH].texture);
  boulder.position.set(100, 100);
  map.addChild(boulder);

  // Create a title message
  const style = new TextStyle({
    fontFamily: 'Futura',
    fontSize: 32,
    fill: 'white',
    stroke: '#000000',
    strokeThickness: 6,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowDistance: 2,
  });
  const textMessage = new Text('Big Chungus', style);
  textMessage.anchor.set(0.5, 0.5);
  textMessage.position.set(APP_WIDTH_HALF, 150);
  sceneStage.addChild(textMessage);

  // Create controls
  sceneStage.interactive = true;
  const rectLeft = new Rectangle(0, 0, APP_WIDTH_HALF, APP_WIDTH);
  joystickLeft = new FloatingJoystick(rectLeft);
  sceneStage.addChild(joystickLeft);
  const rectRight = new Rectangle(APP_WIDTH_HALF, 0, APP_WIDTH_HALF, APP_WIDTH);
  joystickRight = new FloatingJoystick(rectRight, {
    onEndCallback: () => {chungus.stopChargingDash(); },
  });
  sceneStage.addChild(joystickRight);

  getKeyboardMoveInput = setupMoveKeys();

  // Create a button
  const playButton = new Button('Play', startPlayScene);
  playButton.position.set(APP_WIDTH_HALF - playButton.width / 2, DUNGEON_MAX_Y);
  sceneStage.addChild(playButton);

  const scene: ISceneType = {
    sceneContainer: sceneStage,
    restart,
    update,
    // activate,
    // deactivate,
  };
  return scene;
}

function restart() {
  // TODO
}

function update(delta: number) {
  sceneTime += delta;

  // Get user input. Try touch with fallback to keyboard.
  let moveInput = joystickLeft.getDiffNormalised();
  if (moveInput[0] === 0 && moveInput[1] === 0) {
    moveInput = getKeyboardMoveInput();
  }
  chungus.setMoveInput(moveInput);

  // Set aim position. Use touch with fallback to mouse.
  if (interaction.supportsTouchEvents) {
    const aimInput = joystickRight.getDiff();
    chungus.setDashDest(aimInput[0], aimInput[1]);
  } else {
    // No touch events. Fallback to mouse
    mapDashDestPos = interaction.mouse.getLocalPosition(map, mapDashDestPos);
    chungus.setDashDest(
      mapDashDestPos.x - chungus.x,
      mapDashDestPos.y - chungus.y,
    );
    // If mouse down, stop charging dash.
    if (interaction.mouse.buttons !== 0) {
      chungus.stopChargingDash();
    }
  }

  // update everything
  chungus.update(delta);
  boulder.update(delta);

  // postUpdate everything
  chungus.postUpdate(delta);
  boulder.postUpdate(delta);

  boulder.constrainPosition(
      DUNGEON_MIN_X, DUNGEON_MAX_X, DUNGEON_MIN_Y, DUNGEON_MAX_Y,
  );

  chungus.constrainPosition(
      DUNGEON_MIN_X, DUNGEON_MAX_X, DUNGEON_MIN_Y, DUNGEON_MAX_Y,
  );

  // say things
  if (speechIndex < speeches.length
      && sceneTime >= speeches[speechIndex].delay) {
    chungus.say(speeches[speechIndex].text, speeches[speechIndex].speed);
    speechIndex++;
  }

  if (chungus.isDashing()) {
    // Chungus can launch the boulder when it is moving slow
    if (!boulder.isMovingQuick() && chungus.collision(boulder)) {
      boulder.takeDamage(chungus);
    }
  } else if (boulder.isMovingQuick()) {
    // Boulder can hit chungus but won't deal damage
    if (chungus.isVulnerable() && boulder.collision(chungus)) {
      chungus.takeDamage(boulder, false);
    }
  }

  updateLayersOrder(map);
}

/** Checks whether or not chungus is trying to dash.
 * Check touch input, with fallback to mouse input
 */
// function checkDash(): void {
//   // If mouse down, stop charging dash.

// }
