import './../styles/app.css';
import { Chungus } from './containers/chungus';
import { HealthBar } from './containers/health-bar';
import { Treasure } from './containers/treasure';
import { randRange } from './helpers';
import {
  Application,
  Container,
  loader,
  Sprite,
  Text,
  TextStyle,
  utils,
  ZContainer,
} from './pixi-alias';

let type: string = 'WebGL';
if (!utils.isWebGLSupported()) {
  type = 'canvas';
}
utils.sayHello(type);

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const APP_WIDTH = 640;  // 1:1 aspect ratio
const app = new Application({width: APP_WIDTH, height: APP_WIDTH});
app.renderer.autoResize = true;
app.renderer.resize(APP_WIDTH, APP_WIDTH);

// The app creates a canvas element for you that you
// can then insert into the DOM
document.getElementById('canvas-div').appendChild(app.view);
/** p node for displaying loading messages */
const loadingP = document.getElementById('loading-p');

const resources = loader.resources;  // Alias
const CHUNGUS_PATH = './assets/big-chungus-smaller.png';
const TREASURE_HUNTER_PATH = './assets/treasureHunter.json';

// Load the assets
loader
  .add(CHUNGUS_PATH)
  .add(TREASURE_HUNTER_PATH)
  .on('progress', loadProgressHandler)
  .load(setup);

function loadProgressHandler(load, resource) {
  loadingP.textContent = ('loading: ' + resource.url);
  loadingP.textContent = ('progress: ' + load.progress + '%');
}

// Things used in the game
let gameState: (delta: number) => void;
let chungus: Chungus;  // the player
let treasure: Treasure;  // treasure chest
let healthBar: HealthBar;  // player's health bar
// Sub-container within app.stage that only holds things with zIndex
const zStage = new Container();

// Wall boundaries of dungeon.png
const DUNGEON_MIX_X = 32;
const DUNGEON_MAX_X = 512 - 32;
const DUNGEON_MIN_Y = 32;
const DUNGEON_MAX_Y = 480;
const CHUNGUS_SPEED = 4;

function setup() {
  // clear the loadingP
  loadingP.textContent = '';

  /** Alias to point to the texture atlas's textures object */
  const id = loader.resources[TREASURE_HUNTER_PATH].textures;

  // create and add the sprites
  const dungeon = new Sprite(id['dungeon.png']);
  app.stage.addChild(dungeon);

  app.stage.addChild(zStage);

  chungus = new Chungus(resources[CHUNGUS_PATH].texture, CHUNGUS_SPEED);
  chungus.position.set(100, app.stage.height / 2);
  zStage.addChild(chungus);

  treasure = new Treasure(id['treasure.png']);
  // Position the treasure next to the right edge of the canvas
  treasure.x = app.stage.width - treasure.width - 148;
  treasure.y = app.stage.height / 2 - treasure.height / 2;
  zStage.addChild(treasure);
  treasure.updateZIndex();

  // Create the health bar
  healthBar = new HealthBar(40);
  healthBar.position.set(app.stage.width - 170, 4);
  app.stage.addChild(healthBar);  // TODO: replace with gameScene.addChild

  // Start the game loop by adding the `gameLoop` function to
  // Pixi's `ticker` and providing it with a `delta` argument.
  gameState = play;
  app.ticker.add((delta) => gameLoop(delta));
}

function gameLoop(delta: number) {
  // Update the current game state
  gameState(delta);
}

/**
 * The Play game state. Playable.
 * @param delta frame time difference
 */
function play(delta: number) {
  chungus.update(delta);

  // postUpdate to update positions using velocity
  chungus.postUpdate(delta);

  // Constrain explorer to keep it within walls
  chungus.constrainPosition(
    DUNGEON_MIX_X, DUNGEON_MAX_X,
    DUNGEON_MIN_Y, DUNGEON_MAX_Y,
  );

  chungus.isHit = false;  // reset
  if (chungus.collision(treasure)) {
    chungus.isHit = true;
  }

  // Update layer order
  updateLayersOrder();

}

/**
 * To update draw order of zContainers
 */
function updateLayersOrder(): void {
  zStage.children.sort(compareZIndex);
}

function compareZIndex(a: ZContainer , b: ZContainer) {
  return a.zIndex - b.zIndex;
}

function showEndMessage(message: string): Text {
  const style = new TextStyle({
    fontFamily: 'Futura',
    fontSize: 16,
    fill: 'white',
    stroke: '#000000',
    strokeThickness: 6,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowDistance: 6,
  });
  const textMessage = new Text(message, style);
  textMessage.anchor.set(0.5, 0.5);  // anchor right in the middle for spinning
  textMessage.rotation = 0.1;
  textMessage.x = app.stage.width / 2;
  textMessage.y = app.stage.height / 2;
  app.stage.addChild(textMessage);
  return textMessage;
}
