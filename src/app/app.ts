import './../styles/app.css';
import { Bullet } from './containers/bullet';
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
  utils,
  ZContainer,
} from './pixi-alias';
import { addScore, initScoreText, updateScoreText } from './ui/score_text';

let type: string = 'WebGL';
if (!utils.isWebGLSupported()) {
  type = 'canvas';
}
utils.sayHello(type);

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const APP_WIDTH = 640;  // 1:1 aspect ratio
const APP_WIDTH_HALF = APP_WIDTH / 2;
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
const ELMER_BODY_PATH = './assets/elmer-body-sm.png';
const ELMER_ARMS_PATH = './assets/elmer-arms-sm.png';
const TREASURE_HUNTER_PATH = './assets/treasureHunter.json';
const BULLET_PATH = './assets/bullet.png';

// Load the assets
loader
  .add(CHUNGUS_PATH)
  .add(ELMER_BODY_PATH)
  .add(ELMER_ARMS_PATH)
  .add(TREASURE_HUNTER_PATH)
  .add(BULLET_PATH)
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
const bulletFactory: Factory<Bullet> = new Factory(
  () => new Bullet(resources[BULLET_PATH].texture),
);

let treasure: Treasure;  // treasure chest
let healthBar: HealthBar;  // player's health bar
/** mouse position in stage coordinates */
let stageMousePos: Point = new Point(0, 0);
/** The map within the stage */
let map: Sprite;
/** Sub-container within map that only holds things with zIndex */
const zStage = new Container();

// UI
let scoreText: Text;

// Wall boundaries of dungeon.png
const DUNGEON_MIX_X = 32;
const DUNGEON_MAX_X = 512 - 32;
const DUNGEON_MIN_Y = 32;
const DUNGEON_MAX_Y = 480;

// Limit to number of instances
const ELMER_POPULATION_LIMIT = 100;

function setup() {
  // clear the loadingP
  loadingP.textContent = '';

  /** Alias to point to the texture atlas's textures object */
  const id = loader.resources[TREASURE_HUNTER_PATH].textures;

  // Create the map and zStage
  map = new Sprite(id['dungeon.png']);
  app.stage.addChild(map);
  map.addChild(zStage);

  scoreText = initScoreText(APP_WIDTH_HALF, 60);
  app.stage.addChild(scoreText);

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

  // Set up Elmer
  Elmer.createBullet = (globalPos) => {
    const bullet = bulletFactory.spawn();
    // We want the bullet's body to appear at globalPos.
    // Given global position of the bullet source,
    // position the bullet relative to the map.
    // Add z to y because the bullet's z makes it appear higher.
    bullet.position.set(
      globalPos.x - map.x,
      globalPos.y - map.y + bullet.getZ(),
    );
    zStage.addChild(bullet);
    return bullet;
  };

  // Create an enemy factory
  elmerFactory = new Factory<Elmer>(() => {
    return new Elmer(
      resources[ELMER_BODY_PATH].texture,
      resources[ELMER_ARMS_PATH].texture,
      chungus,
    );
  }, ELMER_POPULATION_LIMIT);
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
    if (elmer) {
      zStage.addChild(elmer);
      elmer.position.set(randRange(100, 400), randRange(100, 400));
    }
  }

  // Update everything
  chungus.update(delta);
  checkMouse();
  chungus.dashDest = stageMousePos;
  elmerFactory.forEach((elmer) => {elmer.update(delta); });

  // postUpdate everything
  chungus.postUpdate(delta);
  bulletFactory.forEach((bullet) => {
    bullet.postUpdate(delta);
  });
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
      if (elmer.isActive() && chungus.collision(elmer)) {
        elmer.takeDamage(chungus);
        addScore(1);
      }
    });
  }

  // Center the screen on Chungus
  const globalChungusPos = chungus.getGlobalPosition();
  map.x += APP_WIDTH_HALF - globalChungusPos.x;
  map.y += APP_WIDTH_HALF - globalChungusPos.y;

  // Update layer order
  updateLayersOrder();
  // update ui
  updateScoreText(delta);
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
