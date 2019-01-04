import './../styles/app.css';
import { Chungus } from './containers/chungus';
import { Elmer } from './containers/elmer';
import { Factory } from './containers/factory';
import { HealthBar } from './containers/health-bar';
import { Treasure } from './containers/treasure';
import { randRange } from './helpers';
import {
  Application,
  Container,
  InteractionManager,
  loader,
  Point,
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
/** interactionManager: deals with mouse, touch and pointer events */
const interaction: InteractionManager = app.renderer.plugins.interaction;

// The app creates a canvas element for you that you
// can then insert into the DOM
document.getElementById('canvas-div').appendChild(app.view);
/** p node for displaying loading messages */
const loadingP = document.getElementById('loading-p');

const resources = loader.resources;  // Alias
const CHUNGUS_PATH = './assets/big-chungus-smaller.png';
const ELMER_PATH = './assets/elmer-sm.png';
const TREASURE_HUNTER_PATH = './assets/treasureHunter.json';

// Load the assets
loader
  .add(CHUNGUS_PATH)
  .add(ELMER_PATH)
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
const ELMER_SPAWN_COOLDOWN = 100;
// Current cooldown between elmer spawns (frames)
let elmerSpawnCooldown = ELMER_SPAWN_COOLDOWN;
let elmerFactory: Factory<Elmer>;
let treasure: Treasure;  // treasure chest
let healthBar: HealthBar;  // player's health bar
/** mouse position in stage coordinates */
let stageMousePos: Point = new Point(0, 0);
// Sub-container within app.stage that only holds things with zIndex
const zStage = new Container();

// Wall boundaries of dungeon.png
const DUNGEON_MIX_X = 32;
const DUNGEON_MAX_X = 512 - 32;
const DUNGEON_MIN_Y = 32;
const DUNGEON_MAX_Y = 480;

function setup() {
  // clear the loadingP
  loadingP.textContent = '';

  /** Alias to point to the texture atlas's textures object */
  const id = loader.resources[TREASURE_HUNTER_PATH].textures;

  // create and add the sprites
  const dungeon = new Sprite(id['dungeon.png']);
  app.stage.addChild(dungeon);

  app.stage.addChild(zStage);

  // TODO: set dynamically
  app.stage.position.set(80, 80);

  // Create the player
  chungus = new Chungus(resources[CHUNGUS_PATH].texture);
  chungus.position.set(100, app.stage.height / 2);
  zStage.addChild(chungus);

  treasure = new Treasure(id['treasure.png']);
  // Position the treasure next to the right edge of the canvas
  treasure.x = app.stage.width - treasure.width - 148;
  treasure.y = app.stage.height / 2 - treasure.height / 2;
  zStage.addChild(treasure);
  treasure.updateZIndex();

  // Create an enemy factory
  elmerFactory = new Factory<Elmer>(() => {
    return new Elmer(resources[ELMER_PATH].texture, chungus);
  });
  // Spawn an enemy
  const elmer = elmerFactory.spawn();
  zStage.addChild(elmer);
  elmer.position.set(200, 300);

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
  // Spawn new elmer every 5 seconds
  elmerSpawnCooldown -= delta;
  if (elmerSpawnCooldown < 0) {
    elmerSpawnCooldown = ELMER_SPAWN_COOLDOWN;
    const elmer = elmerFactory.spawn();
    zStage.addChild(elmer);
    elmer.position.set(randRange(100, 400), randRange(100, 400));
  }

  // Update everything
  chungus.update(delta);
  checkMouse();
  chungus.dashDest = stageMousePos;
  elmerFactory.forEach((elmer) => {elmer.update(delta); });

  // postUpdate everything
  chungus.postUpdate(delta);
  elmerFactory.forEach((elmer) => {
    elmer.postUpdate(delta);
    if (elmer.isActive()) {
      // Prevent elemer from leaving the map while active
      elmer.constrainPosition(
        DUNGEON_MIX_X, DUNGEON_MAX_X,
        DUNGEON_MIN_Y, DUNGEON_MAX_Y,
      );
    }
  });

  // Constrain chungus to keep it within walls
  chungus.constrainPosition(
    DUNGEON_MIX_X, DUNGEON_MAX_X,
    DUNGEON_MIN_Y, DUNGEON_MAX_Y,
  );

  chungus.isHit = false;  // reset
  if (chungus.isDashing()) {
    elmerFactory.forEach((elmer) => {
      if (chungus.collision(elmer)) {
        elmer.takeDamage(chungus);
      }
    });
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
  stageMousePos = interaction.mouse.getLocalPosition(app.stage, stageMousePos);
}
