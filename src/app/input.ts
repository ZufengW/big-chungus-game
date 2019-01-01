import { MovingContainer } from './containers/moving-container';

/**
 * For getting user input.
 */

/**
 * Set up arrow keys for a sprite to move
 * @param spriteToMove
 * @param speed move speed
 */
export function setupMoveKeys(): () => [number, number] {
  // Capture the keyboard arrow keys and WASD
  const left = keyboard('ArrowLeft');
  const up = keyboard('ArrowUp');
  const right = keyboard('ArrowRight');
  const down = keyboard('ArrowDown');
  const w = keyboard('w');
  const a = keyboard('a');
  const s = keyboard('s');
  const d = keyboard('d');

  // function to call to get resultant direction
  return (): [number, number] => {
    // resultant x and y
    let x = 0;
    let y = 0;

    if (up.isDown || w.isDown) {
      y -= 1;
    }
    if (right.isDown || d.isDown) {
      x += 1;
    }
    if (down.isDown || s.isDown) {
      y += 1;
    }
    if (left.isDown || a.isDown) {
      x -= 1;
    }
    // TODO: normalise
    return [x, y];
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
