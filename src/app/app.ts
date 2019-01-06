import './../styles/app.css';
import { Bullet } from './containers/bullet';
import { Chungus } from './containers/chungus';
import { Elmer } from './containers/elmer';
import { Factory } from './containers/factory';
import { HealthBar } from './containers/health-bar';
import { Taz } from './containers/taz';
import { Treasure } from './containers/treasure';
import { randPosAwayFrom, randRange } from './helpers';
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
const TAZ_BODY_PATH = './assets/taz-body-sm.png';
const TAZ_ARM_PATH = './assets/taz-arm-sm.png';
const TAZ_EYES_RED_PATH = './assets/taz-eyes-red-sm.png';

// Load the assets
loader
  .add(CHUNGUS_PATH)
  .add(ELMER_BODY_PATH)
  .add(ELMER_ARMS_PATH)
  .add(TREASURE_HUNTER_PATH)
  .add(TAZ_BODY_PATH)
  .add(TAZ_ARM_PATH)
  .add(TAZ_EYES_RED_PATH)
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
/** Limit to number of instances */
const ENEMY_POPULATION_LIMIT = 50;
/** to disallow enemies from spawning too close to chungus */
const MIN_SPAWN_DISTANCE_SQUARED = 210 ** 2;

const ELMER_SPAWN_COOLDOWN = 200;
// Current cooldown between elmer spawns (frames)
let elmerSpawnCooldown = ELMER_SPAWN_COOLDOWN;
let elmerFactory: Factory<Elmer>;

const TAZ_SPAWN_COOLDOWN = 200;
// Current cooldown between taz spawns (frames)
let tazSpawnCooldown = TAZ_SPAWN_COOLDOWN;
const tazFactory: Factory<Taz> = new Factory(
  () => new Taz(
    resources[TAZ_BODY_PATH].texture,
    resources[TAZ_ARM_PATH].texture,
    resources[TAZ_EYES_RED_PATH].texture,
    chungus,
  ),
  ENEMY_POPULATION_LIMIT,
);
const bulletFactory: Factory<Bullet> = new Factory(
  () => new Bullet(resources[BULLET_PATH].texture),
);

let treasure: Treasure;  // treasure chest
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

const MAP_BOUNDARY_BUFFER = 50;
// Set up Taz walking boundaries
Taz.minX = DUNGEON_MIX_X + MAP_BOUNDARY_BUFFER;
Taz.minY = DUNGEON_MIN_Y + MAP_BOUNDARY_BUFFER;
Taz.maxX = DUNGEON_MAX_X - MAP_BOUNDARY_BUFFER;
Taz.maxY = DUNGEON_MAX_Y - MAP_BOUNDARY_BUFFER;

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

  // Create the health bar and the player
  const healthBar = new HealthBar(5);
  healthBar.position.set(100, 30);
  chungus = new Chungus(resources[CHUNGUS_PATH].texture, healthBar);
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
  }, ENEMY_POPULATION_LIMIT);

  // Add healthBar to stage later so it is drawn on top
  app.stage.addChild(healthBar);

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
  // Spawn new elmer now and then
  elmerSpawnCooldown -= delta;
  if (elmerSpawnCooldown < 0) {
    elmerSpawnCooldown = ELMER_SPAWN_COOLDOWN;
    const elmer = elmerFactory.spawn();
    if (elmer) {
      zStage.addChild(elmer);
      const [x, y] = randPosAwayFrom(
        100, 400, chungus.position, MIN_SPAWN_DISTANCE_SQUARED,
      );
      elmer.position.set(x, y);
    }
  }
  tazSpawnCooldown -= delta;
  if (tazSpawnCooldown < 0) {
    tazSpawnCooldown = TAZ_SPAWN_COOLDOWN;
    const taz = tazFactory.spawn();
    if (taz) {
      zStage.addChild(taz);
      const [x, y] = randPosAwayFrom(
        100, 400, chungus.position, MIN_SPAWN_DISTANCE_SQUARED,
      );
      taz.position.set(x, y);
    }
  }

  // Update everything
  chungus.update(delta);
  checkMouse();
  chungus.dashDest = stageMousePos;
  elmerFactory.forEach((elmer) => {elmer.update(delta); });
  tazFactory.forEach((taz) => {taz.update(delta); });

  // postUpdate everything
  chungus.postUpdate(delta);
  bulletFactory.forEach((bullet) => {
    if (!bullet.isInactive()) {
      bullet.postUpdate(delta);
      // Check for bullet collision with chungus
      if (chungus.isVulnerable() && bullet.collision(chungus)) {
        chungus.takeDamage(bullet);
      }
    }
  });
  elmerFactory.forEach((elmer) => {
    elmer.postUpdate(delta);
    if (elmer.isActive()) {
      // Prevent elmer from leaving the map while active
      elmer.constrainPosition(
        DUNGEON_MIX_X, DUNGEON_MAX_X,
        DUNGEON_MIN_Y, DUNGEON_MAX_Y,
      );
    }
  });
  tazFactory.forEach((taz) => {
    taz.postUpdate(delta);
    if (taz.isActive()) {
      // Prevent from leaving map while active
      taz.constrainPosition(
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

  // chungus can damage enemies when dashing
  if (chungus.isDashing()) {
    elmerFactory.forEach((elmer) => {
      if (elmer.isActive() && chungus.collision(elmer)) {
        elmer.takeDamage(chungus);
        addScore(1);
      }
    });
    tazFactory.forEach((taz) => {
      if (taz.isVulnerable() && chungus.collision(taz)) {
        taz.takeDamage(chungus);
        addScore(1);
      }
    });
  } else if (chungus.isVulnerable()) {
    // taz can damage chungus
    tazFactory.forEach((taz) => {
      if (taz.isAttacking() && chungus.collision(taz)) {
        chungus.takeDamage(taz);
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
