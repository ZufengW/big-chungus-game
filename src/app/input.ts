import { MovingContainer } from './containers/moving-container';

/**
 * For getting user input.
 */

/**
 * Set up arrow keys for a sprite to move
 * @param spriteToMove
 * @param speed move speed
 */
export function setupMoveKeys(spriteToMove: MovingContainer, speed: number) {
  // Capture the keyboard arrow keys
  const left = keyboard('ArrowLeft');
  const up = keyboard('ArrowUp');
  const right = keyboard('ArrowRight');
  const down = keyboard('ArrowDown');

  // Left arrow key `press` method
  left.press = () => {
    spriteToMove.dx = -speed;
    spriteToMove.dy = 0;
  };

  // Left arrow key `release` method
  left.release = () => {
    // If the left arrow has been released, and the right arrow isn't down,
    // and the spriteToMove isn't moving vertically:
    // Stop the spriteToMove
    if (!right.isDown && spriteToMove.dy === 0) {
      spriteToMove.dx = 0;
    }
  };

  // Up
  up.press = () => {
    spriteToMove.dy = -speed;
    spriteToMove.dx = 0;
  };
  up.release = () => {
    if (!down.isDown && spriteToMove.dx === 0) {
      spriteToMove.dy = 0;
    }
  };

  // Right
  right.press = () => {
    spriteToMove.dx = speed;
    spriteToMove.dy = 0;
  };
  right.release = () => {
    if (!left.isDown && spriteToMove.dy === 0) {
      spriteToMove.dx = 0;
    }
  };

  // Down
  down.press = () => {
    spriteToMove.dy = speed;
    spriteToMove.dx = 0;
  };
  down.release = () => {
    if (!up.isDown && spriteToMove.dx === 0) {
      spriteToMove.dy = 0;
    }
  };
}

/**
 * Attaches listeners to make a key suitable for getting user input
 * @param value of the key
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 */
function keyboard(value: string) {
  const key: {
    value: string,
    isDown: boolean,
    isUp: boolean,
    press: () => void,
    release: () => void,
    downHandler: (event: any) => void,
    upHandler: (event: any) => void,
    unsubscribe: () => void,
  } = {
    value,
    isDown: false,
    isUp: true,
    press: undefined,
    release: undefined,
    downHandler: undefined,
    upHandler: undefined,
    unsubscribe: undefined,
  };

  // The `downHandler`
  key.downHandler = (event) => {
    if (event.key === key.value) {
      if (key.isUp && key.press) {
        key.press();
      }
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  // The `upHandler`
  key.upHandler = (event) => {
    if (event.key === key.value) {
      if (key.isDown && key.release) {
        key.release();
      }
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  // Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);

  window.addEventListener('keydown', downListener, false);
  window.addEventListener('keyup', upListener, false);

  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener('keydown', downListener);
    window.removeEventListener('keyup', upListener);
  };

  return key;
}
