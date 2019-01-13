import { APP_WIDTH, APP_WIDTH_HALF, interaction } from '../app';
import { Boulder } from '../containers/boulder';
import { Bullet } from '../containers/bullet';
import { Carrot } from '../containers/carrot';
import { Chungus } from '../containers/chungus';
import { Elmer } from '../containers/elmer';
import { Factory } from '../containers/factory';
import { HealthBar } from '../containers/health_bar';
import { Taz } from '../containers/taz';
import { Treasure } from '../containers/treasure';
import { randPosAwayFrom, randRange } from '../helpers';
import {
  Container,
  Filters,
  loader,
  Point,
  Sprite,
  Text,
  ZContainer,
} from '../pixi_alias';
import * as R from '../resources';
import {
  addScore, initScoreText, resetScore, updateScoreText,
} from '../ui/score_text';
import { Kind as EndingType, WinLoseUI } from '../ui/winLose';
import { installWaves, restartWaves, updateWave } from '../waves';
import { ISceneType } from './scene';

const resources = loader.resources;  // Alias

const FIRST_THING_CHUNGUS_SAYS = 'What a fine day.';

// Things used in the game
let chungus: Chungus;  // the player
let healthBar: HealthBar;  // player's health bar
/** a unique power up */
let powerCarrot: Carrot;

/** Limit to number of instances */
const ENEMY_POPULATION_LIMIT = 50;
/** to disallow enemies from spawning too close to chungus */
const MIN_SPAWN_DISTANCE_SQUARED = 210 ** 2;

/**** Variables relating to enemy spawning ****/
/** factory that spawns elmer */
let elmerFactory: Factory<Elmer>;
/** factory that spawns taz */
let tazFactory: Factory<Taz>;
let bulletFactory: Factory<Bullet>;
let carrotFactory: Factory<Carrot>;

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
const winLoseUI = new WinLoseUI();

// Wall boundaries of the map
export const DUNGEON_MIN_X = 32;
export const DUNGEON_MAX_X = 512 - 32;
export const DUNGEON_MIN_Y = 32;
export const DUNGEON_MAX_Y = 480;

const MAP_BOUNDARY_BUFFER = 50;
// Set up Taz walking boundaries
Taz.minX = DUNGEON_MIN_X + MAP_BOUNDARY_BUFFER;
Taz.minY = DUNGEON_MIN_Y + MAP_BOUNDARY_BUFFER;
Taz.maxX = DUNGEON_MAX_X - MAP_BOUNDARY_BUFFER;
Taz.maxY = DUNGEON_MAX_Y - MAP_BOUNDARY_BUFFER;

/**
 * Create the scene
 */
export function create(): ISceneType {
  const sceneStage = new Container();

  /** Alias to point to the texture atlas's textures object */
  const id = loader.resources[R.TREASURE_HUNTER_PATH].textures;

  // Create the map and zStage
  map = new Sprite(resources[R.MAP_PATH].texture);
  sceneStage.addChild(map);
  map.addChild(zStage);

  scoreText = initScoreText(APP_WIDTH_HALF, 60);
  sceneStage.addChild(scoreText);

  // Create the health bar and the player
  healthBar = new HealthBar(5);
  healthBar.pivot.set(0, healthBar.height / 2);
  healthBar.position.set(60, 60);

  chungus = new Chungus(resources[R.CHUNGUS_PATH].texture, healthBar, resources[R.CHUNGUS_POWER_PATH].texture);
  chungus.position.set(map.width / 2);
  zStage.addChild(chungus);
  // Chungus says something upon entering
  chungus.say(FIRST_THING_CHUNGUS_SAYS);

  treasure = new Treasure(id['treasure.png']);
  // Position the treasure next to the right edge of the canvas
  treasure.x = sceneStage.width - treasure.width - 148;
  treasure.y = sceneStage.height / 2 - treasure.height / 2;
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

  // Set up factories
  elmerFactory = new Factory<Elmer>(() => {
    return new Elmer(
      resources[R.ELMER_BODY_PATH].texture,
      resources[R.ELMER_ARMS_PATH].texture,
      chungus,
    );
  }, ENEMY_POPULATION_LIMIT);
  tazFactory = new Factory(
    () => new Taz(
      resources[R.TAZ_BODY_PATH].texture,
      resources[R.TAZ_ARM_PATH].texture,
      resources[R.TAZ_EYES_RED_PATH].texture,
      chungus,
    ),
    ENEMY_POPULATION_LIMIT,
  );
  bulletFactory = new Factory(
    () => new Bullet(resources[R.BULLET_PATH].texture),
  );
  carrotFactory = new Factory(
      () => new Carrot(resources[R.CARROT_PATH].texture, carrotPickedUp),
  );

  // Initialise up boulder
  boulder = new Boulder(resources[R.BOULDER_PATH].texture);
  boulder.deactivate();

  /** Set up waves and install the wave text */
  const waveText = installWaves(elmerFactory, tazFactory, {
    beginWaveCallback: (waveNum) => {
      if (waveNum === 1) {
        chungus.say('!!!!!!!!!!');
      }
      // Initialise the boulder at the end of wave 5
      if (waveNum === 5) {
        boulder.init();
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
  sceneStage.addChild(waveText);

  // Add healthBar to stage later so it is drawn on top
  sceneStage.addChild(healthBar);

  // Add UI
  winLoseUI.visible = false;
  sceneStage.addChild(winLoseUI);
  winLoseUI.position.set(
      APP_WIDTH_HALF - winLoseUI.width / 2,
      sceneStage.height / 2,
  );

  const scene: ISceneType = {
    sceneContainer: sceneStage,
    restart,
    update,
    // activate,
    // deactivate,
  };

  return scene;
}

/** restart the scene */
function restart() {
  // Reset all factories
  elmerFactory.restart();
  tazFactory.restart();
  bulletFactory.restart();
  carrotFactory.restart();
  // Reset waves
  restartWaves();
  powerCarrot = null;
  // Reset things
  chungus.deactivate();
  boulder.deactivate();
  // Reset UI
  winLoseUI.visible = false;
  resetScore();
  zStage.removeChildren();

  // Reactivate things
  chungus.init();
  chungus.position.set(map.width / 2);
  zStage.addChild(chungus);
  chungus.say(FIRST_THING_CHUNGUS_SAYS);
}

/**
 * Update the scene.
 * @param delta frame time difference
 */
function update(delta: number) {
  // Check if game ended by lose or win conditions being met
  if (winLoseUI.visible === false) {
    if (!chungus.isActive() && healthBar.getHealth() <= 0) {
      winLoseUI.setKind(EndingType.Lose);
      winLoseUI.visible = true;
    } else if (chungus.hasWon()) {
      winLoseUI.setKind(EndingType.Win);
      winLoseUI.visible = true;
    }
  }

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
  if (!boulder.isInactive()) {
    boulder.update(delta);
  }
  elmerFactory.forEach((elmer) => {elmer.update(delta); });
  tazFactory.forEach((taz) => {taz.update(delta); });
  carrotFactory.forEach((carrot) => {carrot.update(delta); });
  healthBar.update(delta);

  // postUpdate everything
  chungus.postUpdate(delta);
  if (!boulder.isInactive()) {
    boulder.postUpdate(delta);
    boulder.constrainPosition(
      DUNGEON_MIN_X, DUNGEON_MAX_X,
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
        DUNGEON_MIN_X, DUNGEON_MAX_X,
        DUNGEON_MIN_Y, DUNGEON_MAX_Y,
      );
    }
  });
  tazFactory.forEach((taz) => {
    taz.postUpdate(delta);
    if (taz.isActive()) {
      // Prevent from leaving map while active
      taz.constrainPosition(
        DUNGEON_MIN_X, DUNGEON_MAX_X,
        DUNGEON_MIN_Y, DUNGEON_MAX_Y,
      );
    }
  });
  // chungus can pick up carrots when below max health
  carrotFactory.forEach((carrot) => {
    carrot.postUpdate(delta);
    if (chungus.isActive()) {
      if (carrot === powerCarrot
          && carrot.canPickUp() && carrot.collision(chungus)) {
        carrot.pickUp(chungus);
      } else if (healthBar.isBelowMaxhealth()
          && carrot.canPickUp() && carrot.collision(chungus)) {
        carrot.pickUp(chungus);
      }
    }
  });

  // Constrain chungus to keep it within walls
  chungus.constrainPosition(
    DUNGEON_MIN_X, DUNGEON_MAX_X,
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
    if (!boulder.isInactive() && !boulder.isMovingQuick()
        && chungus.collision(boulder)) {
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
  if (!boulder.isInactive() && boulder.isMovingQuick()) {
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
  updateLayersOrder(zStage);
  // update ui
  updateScoreText(delta);
}

/**
 * To update draw order of zContainers
 * @param container must only contain zContainers
 */
export function updateLayersOrder(container: Container): void {
  container.children.sort(compareZIndex);
}

/** smaller zIndex should go before larger zIndex */
function compareZIndex(a: ZContainer , b: ZContainer) {
  return a.zIndex - b.zIndex;
}

/** callback function for when the carrot has finished being picked up */
function carrotPickedUp(carrot: Carrot) {
  if (healthBar.getHealth() > 0) {
    if (carrot === powerCarrot) {
      // power up effect
      healthBar.powerUp();
      chungus.powerUp();
      // Remove the reference because the factory will reuse this carrot.
      powerCarrot = null;
    } else if (healthBar.isBelowMaxhealth()) {
      // Normal carrot and chungus is below max health. Heal.
      healthBar.addHealth(1);
    } else {
      // Actually on maxHealth now. Don't need it anymore.
      carrot.cancelPickUp();
    }
  } else {
    // No health. Cannot finish picking up.
    carrot.cancelPickUp();
  }
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
