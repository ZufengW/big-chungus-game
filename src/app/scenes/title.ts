import { APP_WIDTH, APP_WIDTH_HALF, interaction, startPlayScene } from '../app';
import { Boulder } from '../containers/boulder';
import { Chungus } from '../containers/chungus';
import { HealthBar } from '../containers/health_bar';
import { PlayerInputManager } from '../input/install';
import {
  Container,
  loader,
  Sprite,
  Text,
  TextStyle,
} from '../pixi_alias';
import * as R from '../resources';
import { Button } from '../ui/button';
import { getHighScore } from '../ui/score_text';
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
    delay: 60 * 30,
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

// For user input and controlling chungus
let playerInputManger: PlayerInputManager;

// High score
let highScoreTextMessage: Text;
// Buttons
let playButton: Button;
let demoButton: Button;

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
  boulder.position.set(100, 200);
  map.addChild(boulder);

  // Create a title message
  const titleStyle = new TextStyle({
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
  const titleTextMessage = new Text('Big Chungus', titleStyle);
  titleTextMessage.anchor.set(0.5, 0.5);
  titleTextMessage.position.set(APP_WIDTH_HALF, 150);
  sceneStage.addChild(titleTextMessage);

  // Create a corner message with credit
  const subtitleStyle = new TextStyle({
    fontFamily: 'Futura',
    fontSize: 14,
    fill: 'gray',
  });
  const cornerTextMessage = new Text('A game by ZufengW', subtitleStyle);
  cornerTextMessage.anchor.set(0, 1);
  cornerTextMessage.position.set(5, APP_WIDTH - 5);
  sceneStage.addChild(cornerTextMessage);

  // Create a high score message
  const style = new TextStyle({
    fontFamily: 'Menlo',
    fontSize: 18,
    fill: 'white',
    stroke: '#000000',
    strokeThickness: 2,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowDistance: 2,
  });
  highScoreTextMessage = new Text('', style);
  highScoreTextMessage.anchor.set(0.5, 0.5);
  highScoreTextMessage.position.set(APP_WIDTH_HALF, DUNGEON_MAX_Y + 120);
  sceneStage.addChild(highScoreTextMessage);

  // Create joystick and keyboard controls
  playerInputManger = new PlayerInputManager(sceneStage, chungus, true);
  playerInputManger.startDemo(() => {
    chungus.say('Now you try.');
    demoButton.setText('Demo');
    playButton.visible = true;
  });

  // Create a play button. Needs to be added after the joysticks to be on top.
  playButton = new Button('Play', startPlayScene);
  playButton.position.set(APP_WIDTH_HALF - playButton.width / 2, DUNGEON_MAX_Y);
  // Initially invisible until the demo finishes
  playButton.visible = false;
  sceneStage.addChild(playButton);

  // Button to skip / start demo
  demoButton = new Button('Skip', onDemoButtonClick);
  demoButton.position.set(DUNGEON_MAX_X, DUNGEON_MAX_Y);
  sceneStage.addChild(demoButton);
  demoButton.alpha = 0.5;

  const scene: ISceneType = {
    sceneContainer: sceneStage,
    restart,
    update,
    // activate,
    // deactivate,
    resume,
  };
  return scene;
}

function restart() {
  // TODO
}

function resume() {
  highScoreTextMessage.text = 'High score: ' + String(getHighScore());
}

function update(delta: number) {
  sceneTime += delta;

  // Get and apply user input. Try touch with fallback to keyboard.
  playerInputManger.update(delta);

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

/** Either stop or start the demo */
function onDemoButtonClick() {
  if (playerInputManger.isDemoRunning()) {
    // Skip button pressed
    playerInputManger.endDemo();
    chungus.say('Ain\'t nobody got time for that.');
    demoButton.setText('Demo');
  } else {
    // Demo button pressed
    playerInputManger.startDemo();
    playButton.visible = false;
    demoButton.setText('Skip');
  }
}
