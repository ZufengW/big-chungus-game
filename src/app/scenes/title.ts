import { APP_WIDTH, APP_WIDTH_HALF, interaction, startPlayScene } from '../app';
import { Boulder } from '../containers/boulder';
import { Chungus } from '../containers/chungus';
import { HealthBar } from '../containers/health_bar';
import {
  Container,
  loader,
  Point,
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
/** mouse position in stage coordinates */
let stageMousePos: Point = new Point(0, 0);

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

  // Create a button
  const playButton = new Button('Play', startPlayScene);
  playButton.position.set(APP_WIDTH_HALF - playButton.width / 2, DUNGEON_MAX_Y);
  sceneStage.addChild(playButton);

  const scene: ISceneType = {
    sceneContainer: sceneStage,
    // restart,
    update,
    // activate,
    // deactivate,
  };
  return scene;
}

function update(delta: number) {
  sceneTime += delta;

  // update everything
  chungus.update(delta);
  checkMouse();
  chungus.dashDest = stageMousePos;
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

/**
 * check mouse input
 */
function checkMouse(): void {
  // If mouse down, stop charging dash.
  if (interaction.mouse.buttons !== 0) {
    chungus.stopChargingDash();
  } else {
    chungus.startChargingDash();
  }
  // this is actually reassigning to itself...
  stageMousePos = interaction.mouse.getLocalPosition(map, stageMousePos);
}
