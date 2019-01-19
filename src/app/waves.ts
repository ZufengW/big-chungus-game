import { Character } from './containers/character';
import { Elmer } from './containers/elmer';
import { Factory } from './containers/factory';
import { MovingContainer } from './containers/moving_container';
import { Taz } from './containers/taz';
import { Text } from './pixi_alias';
import {
  installWaveText, restart as resetWaveText, setWaveTextNum,
} from './ui/wave_text';

enum WaveState {
  None,
  Spawning,
  Waiting,
}

/** Current wave state */
let waveState = WaveState.None;
/** Current wave */
let waveNumber = 0;
/** How long the current wave has been going for (frames) */
let waveTime = 0;
/** Total number of creatures to spawn in this wave */
let wavePopulation = 0;
/** how many creatures have spawned this wave */
let spawnIndex = 0;
/** Minimum delay between the spawning of two creatures in this wave */
let minSpawnDelay = 0;

/** at what waveTime in this wave will the next creature spawn */
let nextSpawnTime = 0;
/** Cap to prevent the time between spawns growing too large in later waves */
const MAX_TIME_BETWEEN_SPAWNS = 120;

/** Rest period between waves (frames) */
const WAVE_REST_PERIOD = 60;
/** Current amount of rest time remaining before next wave begins */
let restTimeRemaining = WAVE_REST_PERIOD * 3;

let elmerFactory: Factory<Elmer>;
let tazFactory: Factory<Taz>;

const spawnElmer = () => elmerFactory.spawn();
const spawnTaz = () => tazFactory.spawn();
const spawnQueue = [spawnElmer, spawnElmer, spawnTaz, spawnElmer, spawnTaz];
/** Current position in the spawn queue. Index of what to spawn next. */
let spawnQueuePos = 0;
/** UI component for waves */
let waveText: Text;

/** callback function to call at the beginning of each wave.
 * @param waveNum wave number of the wave that just began.
 */
let beginNextWaveCallback: (waveNum: number) => void;
/** callback function to call at the end of each wave.
 * @param waveNum wave number of the wave that just ended.
 */
let waveEndedCallback: (waveNum: number) => void;

/**
 * Set up the waves system
 * @param eFactory factory that spawns Elmer
 * @param tFactory factory that spawns Taz
 * @param opts options
 * * beginWaveCallback callback function to call at the beginning of each wave.
 * * endWaveCallback callback function to call at the end of each wave.
 * @return Text that displays info about the current wave.
 *  Need to position and add to stage.
 */
export function installWaves(
    eFactory: Factory<Elmer>,
    tFactory: Factory<Taz>,
    opts: {
      beginWaveCallback?: (waveNum: number) => void,
      endWaveCallback?: (waveNum: number) => void,
    },
  ): Text {
  elmerFactory = eFactory;
  tazFactory = tFactory;
  beginNextWaveCallback = opts.beginWaveCallback;
  waveEndedCallback = opts.endWaveCallback;

  waveText = installWaveText();
  return waveText;
}

/** Restart the waves system. Keep using the same factories */
export function restartWaves() {
  waveState = WaveState.None;
  waveNumber = 0;
  restTimeRemaining = WAVE_REST_PERIOD * 3;
  resetWaveText();
}

/**
 * Growth is quadratic + small exponential.
 * @param n wave number (start at 1)
 * @return number of creatures that should spawn in wave n
 */
function getWavePopulation(n: number) {
  return (0.5 * ((n + 2) ** 2) + 2.5 * n) + Math.floor(1.1 ** n) - 5;
}

/**
 * Get the starting spawn delay of wave n.
 * @param n wave number
 * @return spawn delay between the first and second creatures in wave n.
 *    Starts at 120 for wave 1, eventually reaches 10.
 */
function getFirstSpawnDelay(n: number) {
  return Math.floor(110 / n + 10);
}

/**
 * Quadratic interpolation.
 * @param n value to interpolate. In range [0, nMax]
 * @param nMax max n value. (must be > 0) (nMin is 0)
 * @param valMin minimum output value
 * @param valMax maximum output value
 * @return n converted to a value in range [valMin, valMax]
 */
function quadLerp(n: number, nMax: number, valMin: number, valMax: number): number {
  const proportion = n / nMax;
  return (valMax - valMin) * (proportion ** 2) + valMin;
}

/**
 * Handles updating and spawning
 * @param delta frame time
 * @return list of Characters that spawned this update.
 *  (empty if nothing spawned)
 *  Those characters still need to be positioned.
 */
export function updateWave(delta: number): MovingContainer[] {
  switch (waveState) {
    case WaveState.None:
      updateResting(delta);
      break;
    case WaveState.Spawning:
      return updateSpawning(delta);
    case WaveState.Waiting:
      updateWaiting(delta);
      break;
    default:
      break;
  }
  return [];
}

/**
 * Wait until the next wave can start.
 * @param delta frame time
 */
function updateResting(delta: number) {
  restTimeRemaining -= delta;
  if (restTimeRemaining <= 0) {
    beginNextWave();
  }
}

/**
 * Spawn creatures for this wave.
 * @param delta frame time
 */
function updateSpawning(delta: number): MovingContainer[] {
  waveTime += delta;

  /** characters spawned this update */
  const spawned: Character[] = [];

  while (waveTime >= nextSpawnTime && spawnIndex < wavePopulation) {
    // Enough time passed. Spawn the next thing in the queue
    spawned.push(spawnQueue[spawnQueuePos]());

    const spawnDelay = quadLerp(
        spawnIndex, wavePopulation - 1,
        minSpawnDelay, MAX_TIME_BETWEEN_SPAWNS,
    );
    spawnQueuePos = (spawnQueuePos + 1) % spawnQueue.length;
    nextSpawnTime += spawnDelay;

    spawnIndex++;
  }
  if (spawnIndex === wavePopulation) {
    // finished spawning all the creatures. Wait for wave to end.
    waveState = WaveState.Waiting;
  }
  return spawned;
}

/**
 * Wait for current wave to end.
 * @param delta frame time
 */
function updateWaiting(delta: number) {
  waveTime += delta;
  // The wave ends once all enemies are gone
  if (elmerFactory.numActiveInstances() === 0
      && tazFactory.numActiveInstances() === 0) {
    waveState = WaveState.None;
    restTimeRemaining = WAVE_REST_PERIOD;
    if (waveEndedCallback) {
      waveEndedCallback(waveNumber);
    }
  }
}

/**
 * Begin the next wave
 */
function beginNextWave() {
  // set up variables
  waveNumber++;
  if (beginNextWaveCallback) {
    beginNextWaveCallback(waveNumber);
  }
  setWaveTextNum(waveNumber);
  waveTime = 0;
  nextSpawnTime = 0;
  spawnQueuePos = 0;
  waveState = WaveState.Spawning;
  // Calculate spawning population and delay
  wavePopulation = getWavePopulation(waveNumber);
  spawnIndex = 0;
  minSpawnDelay = getFirstSpawnDelay(waveNumber);
}
