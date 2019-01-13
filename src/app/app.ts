import './../styles/app.css';
import {
  Application,
  Container,
  InteractionManager,
  loader,
  utils,
} from './pixi_alias';
import * as R from './resources';
import * as Play from './scenes/play';

let type: string = 'WebGL';
if (!utils.isWebGLSupported()) {
  type = 'canvas';
}
utils.sayHello(type);

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
export const APP_WIDTH = 640;
export const ASPECT_RATIO = 1; // 1:1 aspect ratio
export const APP_WIDTH_HALF = APP_WIDTH / 2;
const app = new Application({
  width: APP_WIDTH, height: APP_WIDTH,
  // Use the native window resolution as the default resolution.
  // Will support high-density displays when rendering.
  resolution: window.devicePixelRatio,
});

/** interactionManager: deals with mouse, touch and pointer events */
export const interaction: InteractionManager = app.renderer.plugins.interaction;

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

// Load the assets
loader
  .add(R.MAP_PATH)
  .add(R.CHUNGUS_PATH)
  .add(R.ELMER_BODY_PATH)
  .add(R.ELMER_ARMS_PATH)
  .add(R.TREASURE_HUNTER_PATH)
  .add(R.TAZ_BODY_PATH)
  .add(R.TAZ_ARM_PATH)
  .add(R.TAZ_EYES_RED_PATH)
  .add(R.BULLET_PATH)
  .add(R.BOULDER_PATH)
  .add(R.CARROT_PATH)
  .add(R.CHUNGUS_POWER_PATH)
  .on('progress', loadProgressHandler)
  .load(setup);

function loadProgressHandler(load, resource) {
  loadingP.textContent = ('loading: ' + resource.url);
  loadingP.textContent = ('progress: ' + load.progress + '%');
}

// Things used in the game
let gameState: (delta: number) => void;
// Scenes
let playScene: Container;

function setup() {
  // clear the loadingP
  loadingP.textContent = '';

  // Set up the first scene
  playScene = Play.create();
  app.stage.addChild(playScene);

  // Start the game loop by adding the `gameLoop` function to
  // Pixi's `ticker` and providing it with a `delta` argument.
  gameState = Play.update;
  app.ticker.add((delta) => gameLoop(delta));
}

/** The top-level update function
 * @param delta frame time
 */
function gameLoop(delta: number) {
  // Update the current game state
  gameState(delta);
}
