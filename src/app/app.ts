import './../styles/app.css';
import { Boulder } from './containers/boulder';
import { Bullet } from './containers/bullet';
import { Carrot } from './containers/carrot';
import { Chungus } from './containers/chungus';
import { Elmer } from './containers/elmer';
import { Factory } from './containers/factory';
import { HealthBar } from './containers/health_bar';
import { Taz } from './containers/taz';
import { Treasure } from './containers/treasure';
import { randPosAwayFrom, randRange } from './helpers';
import {
  Application,
  Container,
  Filters,
  InteractionManager,
  loader,
  Point,
  Sprite,
  Text,
  utils,
  ZContainer,
} from './pixi_alias';
import {
  addScore, getScore, initScoreText, resetScore, updateScoreText,
} from './ui/score_text';
import { installWaves, updateWave } from './waves';

let type: string = 'WebGL';
if (!utils.isWebGLSupported()) {
  type = 'canvas';
}
utils.sayHello(type);

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const APP_WIDTH = 640;
const ASPECT_RATIO = 1; // 1:1 aspect ratio
const APP_WIDTH_HALF = APP_WIDTH / 2;
const app = new Application({
  width: APP_WIDTH, height: APP_WIDTH,
  // Use the native window resolution as the default resolution.
  // Will support high-density displays when rendering.
  resolution: window.devicePixelRatio,
});

/** interactionManager: deals with mouse, touch and pointer events */
const interaction: InteractionManager = app.renderer.plugins.interaction;

// The app creates a canvas element for you that you
// can then insert into the DOM
document.getElementById('canvas-div').appendChild(app.view);
/** p node for displaying loading messages */
const loadingP = document.getElementById('loading-p');

resize();
// Make app resize to fit window while maintaining aspect ratio.
function resize() {
  let w: number;
  let h: number;
  if (window.innerWidth / window.innerHeight >= ASPECT_RATIO) {
    w = window.innerHeight * ASPECT_RATIO;
    h = window.innerHeight;
  } else {
    w = window.innerWidth;
    h = window.innerWidth / ASPECT_RATIO;
  }
  app.renderer.view.style.width = w + 'px';
  app.renderer.view.style.height = h + 'px';
}
window.onresize = resize;

const resources = loader.resources;  // Alias
const MAP_PATH = './assets/arena.png';
const CHUNGUS_PATH = './assets/big-chungus-smaller.png';
const ELMER_BODY_PATH = './assets/elmer-body-sm.png';
const ELMER_ARMS_PATH = './assets/elmer-arms-sm.png';
const TREASURE_HUNTER_PATH = './assets/treasureHunter.json';
const BULLET_PATH = './assets/bullet.png';
const TAZ_BODY_PATH = './assets/taz-body-sm.png';
const TAZ_ARM_PATH = './assets/taz-arm-sm.png';
const TAZ_EYES_RED_PATH = './assets/taz-eyes-red-sm.png';
const BOULDER_PATH = './assets/boulder.png';
const CARROT_PATH = './assets/carrot.png';
const CHUNGUS_POWER_PATH = './assets/big-chungus-sm-glow.png';

// Load the assets
loader
  .add(MAP_PATH)
  .add(CHUNGUS_PATH)
  .add(ELMER_BODY_PATH)
  .add(ELMER_ARMS_PATH)
  .add(TREASURE_HUNTER_PATH)
  .add(TAZ_BODY_PATH)
  .add(TAZ_ARM_PATH)
  .add(TAZ_EYES_RED_PATH)
  .add(BULLET_PATH)
  .add(BOULDER_PATH)
  .add(CARROT_PATH)
  .add(CHUNGUS_POWER_PATH)
  .on('progress', loadProgressHandler)
  .load(setup);

function loadProgressHandler(load, resource) {
  loadingP.textContent = ('loading: ' + resource.url);
  loadingP.textContent = ('progress: ' + load.progress + '%');
}

// Things used in the game
let gameState: (delta: number) => void;
let chungus: Chungus;  // the player
let healthBar: HealthBar;  // player's health bar
/** a unique power up */
let powerCarrot: Carrot;

/** Limit to number of instances */
const ENEMY_POPULATION_LIMIT = 50;
/** to disallow enemies from spawning too close to chungus */
const MIN_SPAWN_DISTANCE_SQUARED = 210 ** 2;

/**** Variables relating to enemy spawning and difficulty ****/
/** factory that spawns elmer */
let elmerFactory: Factory<Elmer>;
/** factory that spawns taz */
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
const carrotFactory: Factory<Carrot> = new Factory(
    () => new Carrot(resources[CARROT_PATH].texture, carrotPickedUp),
);

/** callback function for when the carrot has finished being picked up */
function carrotPickedUp(carrot: Carrot) {
  if (carrot === powerCarrot) {
    // power up effect
    healthBar.powerUp();
    chungus.powerUp();
    // Remove the reference because the factory will reuse this carrot.
    powerCarrot = null;
  } else if (healthBar.getHealth() > 0) {
    if (healthBar.getHealth() < healthBar.getMaxHealth()) {
      healthBar.addHealth(1);
    } else {
      // Actually on maxHealth now. Don't need it anymore.
      carrot.cancelPickUp();
    }
  }
}

let treasure: Treasure;  // treasure chest
/** only initialised at a later wave */
let boulder: Boulder = null;
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
  map = new Sprite(resources[MAP_PATH].texture);
  app.stage.addChild(map);
  map.addChild(zStage);

  scoreText = initScoreText(APP_WIDTH_HALF, 60);
  app.stage.addChild(scoreText);

  // Create the health bar and the player
  healthBar = new HealthBar(5);
  healthBar.pivot.set(0, healthBar.height / 2);
  healthBar.position.set(60, 60);

  chungus = new Chungus(resources[CHUNGUS_PATH].texture, healthBar, resources[CHUNGUS_POWER_PATH].texture);
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

  /** Set up waves and install the wave text */
  const waveText = installWaves(elmerFactory, tazFactory, {
    beginWaveCallback: (waveNum) => {
      // Initialise the boulder at the end of wave 5
      if (waveNum === 5) {
        boulder = new Boulder(resources[BOULDER_PATH].texture);
        boulder.position.set(APP_WIDTH_HALF, APP_WIDTH_HALF);
        zStage.addChild(boulder);
      }
      // Spawn a normal carrot at the end of each wave except wave 8;
      const carrot = carrotFactory.spawn();
      carrot.position.set(
          randRange(56, 456),
          randRange(56, 456),
      );
      zStage.addChild(carrot);
      if (waveNum === 1) {
        // make this carrot a special one
        carrot.setScale(0.8);
        carrot.body.filters = [
          new Filters.GlowFilter(15, 2, 1, 0x00ffff, 0.5),
        ];
        powerCarrot = carrot;
      }
    },
  });
  waveText.position.set(APP_WIDTH - 100, 60);
  app.stage.addChild(waveText);

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
  // Spawn new enemies now and then

  const movers = updateWave(delta);
  for (const c of movers) {
    zStage.addChild(c);
    const [x, y] = randPosAwayFrom(
      80, 440, chungus.position, MIN_SPAWN_DISTANCE_SQUARED,
    );
    c.position.set(x, y);
  }

  // Update everything
  chungus.update(delta);
  checkMouse();
  chungus.dashDest = stageMousePos;
  if (boulder) {
    boulder.update(delta);
  }
  elmerFactory.forEach((elmer) => {elmer.update(delta); });
  tazFactory.forEach((taz) => {taz.update(delta); });
  carrotFactory.forEach((carrot) => {carrot.update(delta); });
  healthBar.update(delta);

  // postUpdate everything
  chungus.postUpdate(delta);
  if (boulder) {
    boulder.postUpdate(delta);
    boulder.constrainPosition(
      DUNGEON_MIX_X, DUNGEON_MAX_X,
      DUNGEON_MIN_Y, DUNGEON_MAX_Y,
    );
  }
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
  // chungus can pick up carrots when below max health
  carrotFactory.forEach((carrot) => {
    carrot.postUpdate(delta);
    if (carrot === powerCarrot
        && carrot.canPickUp() && carrot.collision(chungus)) {
      carrot.pickUp(chungus);
    } else if (healthBar.getHealth() < healthBar.getMaxHealth()
        && carrot.canPickUp() && carrot.collision(chungus)) {
      carrot.pickUp(chungus);
    }
  });

  // Constrain chungus to keep it within walls
  chungus.constrainPosition(
    DUNGEON_MIX_X, DUNGEON_MAX_X,
    DUNGEON_MIN_Y, DUNGEON_MAX_Y,
  );

  // chungus can damage enemies when dashing or when really big
  if (chungus.isDashing() || chungus.isHugeAndMoving()) {
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
    // Chungus can launch the boulder when it is moving slow
    if (boulder && !boulder.isMovingQuick() && chungus.collision(boulder)) {
      boulder.takeDamage(chungus);
    }
  } else if (chungus.isVulnerable()) {
    // taz can damage chungus
    tazFactory.forEach((taz) => {
      if (taz.isAttacking() && chungus.collision(taz)) {
        chungus.takeDamage(taz);
      }
    });
  }
  // Boulder can hit and damage elmer and taz
  if (boulder && boulder.isMovingQuick()) {
    elmerFactory.forEach((elmer) => {
      if (elmer.isActive() && boulder.collision(elmer)) {
        elmer.takeDamage(boulder);
        addScore(1);
      }
    });
    tazFactory.forEach((taz) => {
      if (taz.isVulnerable() && boulder.collision(taz)) {
        taz.takeDamage(boulder);
        addScore(1);
      }
    });
    // Boulder can hit chungus but won't deal damage
    if (chungus.isVulnerable() && boulder.collision(chungus)) {
      chungus.takeDamage(boulder, false);
    }
  }

  // Center the screen on Chungus. Round to integer avoid blurring.
  // Note that changing the map's position also changes chungus's global pos.
  const globalChungusPos = chungus.getGlobalPosition();
  const chungusOffset = chungus.scale.y * 40;
  map.x += APP_WIDTH_HALF - Math.round(globalChungusPos.x);
  map.y += APP_WIDTH_HALF - Math.round(globalChungusPos.y) + chungusOffset;

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

/** smaller zIndex should go before larger zIndex */
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
