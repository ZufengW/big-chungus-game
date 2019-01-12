import { Character } from './containers/character';
import { Elmer } from './containers/elmer';
import { Factory } from './containers/factory';
import { MovingContainer } from './containers/moving_container';
import { Taz } from './containers/taz';
import { Text } from './pixi_alias';
import { installWaveText, setWaveTextNum } from './ui/wave_text';

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
/** Number of creatures left to spawn in this wave */
let numSpawnsRemaining = 0;
/** at what waveTime in this wave will the next creature spawn */
let nextSpawnTime = 0;
/** time between creature spawns during a wave */
let timeBetweenSpawns = 0;
/** Time between spawns also increases as the wave progresses
 * So creatures spawn more quickly at the start, then slow down.
 */
const TIME_BETWEEN_SPAWNS_INCREASE = 2;

/** Rest period between waves (frames) */
const WAVE_REST_PERIOD = 60;
/** amount of rest remaining */
let restTimeRemaining = WAVE_REST_PERIOD;

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

/**
 * Grows quadratically
 * @param n wave number
 * @return number of creatures that should spawn this wave
 */
function getWavePopulation(n: number) {
  return (n ** 2) + n;
}

/**
 * Get wave spawning duration (frames)
 * @param n wave number
 */
function getWaveSpawningDuration(n: number) {
  return 0.5 * (n ** 2) + (240 * n);
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

  while (waveTime >= nextSpawnTime && numSpawnsRemaining > 0) {
    // Spawn the next thing in the queue
    spawned.push(spawnQueue[spawnQueuePos]());
    spawnQueuePos = (spawnQueuePos + 1) % spawnQueue.length;
    nextSpawnTime += timeBetweenSpawns;
    // time between spawns also increases linearly as the wave progresses
    timeBetweenSpawns += TIME_BETWEEN_SPAWNS_INCREASE;
    numSpawnsRemaining--;
  }
  if (numSpawnsRemaining === 0) {
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
  // Calculate the timing of spawning
  const waveSpawningDuration = getWaveSpawningDuration(waveNumber);
  numSpawnsRemaining = getWavePopulation(waveNumber);
  timeBetweenSpawns = Math.floor(waveSpawningDuration / numSpawnsRemaining);
}
