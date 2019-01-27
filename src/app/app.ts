import './../styles/app.css';
import { FloatingJoystick } from './input/joystick';
import {
  Application,
  Container,
  InteractionManager,
  loader,
  Rectangle,
  utils,
} from './pixi_alias';
import * as R from './resources';
import { create as createPlay } from './scenes/play';
import { ISceneType } from './scenes/scene';
import { create as createTitle } from './scenes/title';

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

// When clicked, scroll until canvas is aligned to the bottom of the visible area
document.getElementById('scroll-button').onclick = () => {
  app.view.scrollIntoView(false);
};

// Load the assets
loader
  .add(R.MAP_PATH)
  .add(R.CHUNGUS_PATH)
  .add(R.ELMER_BODY_PATH)
  .add(R.ELMER_ARMS_PATH)
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
/** each iteration of gameLoop adds delta. Physics updates try to keep up. */
let deltaToCatchUp: number = 0;
// Scenes
let currentScene: ISceneType;
let titleScene: ISceneType;
let playScene: ISceneType;

function setup() {
  // clear the loadingP
  loadingP.textContent = '';

  // Set up scenes
  titleScene = createTitle();
  playScene = createPlay();

  // Set up the title scene
  currentScene = titleScene;
  const sceneContainer = currentScene.sceneContainer;
  app.stage.addChild(sceneContainer);

  // Start the game loop by adding the `gameLoop` function to
  // Pixi's `ticker` and providing it with a `delta` argument.
  gameState = currentScene.update;
  app.ticker.add((delta) => gameLoop(delta));
}

/** The top-level update function
 * @param delta frame time
 */
function gameLoop(delta: number) {
  deltaToCatchUp += delta;
  while (deltaToCatchUp >= 1) {
    // Update the current game state (physics, etc.).
    // May need to call this multiple times if the visuals lag.
    gameState(1);
    deltaToCatchUp -= 1;
  }
}

/** Change from one scene to another
 * @param newScene scene to switch to
 * @param restart whether or not to reset the newScene (default false)
 */
function switchScene(newScene: ISceneType, restart = false) {
  // TODO: call preparation functions
  app.stage.removeChildren();
  currentScene.sceneContainer.visible = false;  // Might not need this
  if (restart) {
    newScene.restart();
  }
  newScene.sceneContainer.visible = true;
  app.stage.addChild(newScene.sceneContainer);
  currentScene = newScene;
  gameState = currentScene.update;
}

/** Switches to and restarts the play scene */
export function startPlayScene() {
  if (currentScene !== playScene) {
    switchScene(playScene, true);
  }
}

/** Switch to the title scene. Don't restart. Resume. */
export function startTitleScene() {
  if (currentScene !== titleScene) {
    switchScene(titleScene);
    titleScene.resume();
  }
}

export function restartCurrentScene() {
  currentScene.restart();
}
