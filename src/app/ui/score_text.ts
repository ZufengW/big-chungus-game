import {
  Text,
  TextStyle,
} from '../pixi_alias';

/** this ui component has state. Alternative to using a class */
let score: number = 0;
let scoreText: Text;

/** Bonus size when there is a combo */
let bonusSize = 1;
/** Countdown before bonus size starts shrinking */
let bonusSizeShrinkDelay = 0;

const MAX_BONUS_SIZE = 20;
/** delay before bonusSize starts dropping. In frames */
const SHRINK_DELAY = 60;

/** initialise the Text that displays the game score */
export function initScoreText(x: number, y: number): Text {
  const style = new TextStyle({
    fontFamily: 'Futura',
    fontSize: 32,
    fill: 'white',
    stroke: '#000000',
    strokeThickness: 6,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowDistance: 6,
  });
  const textMessage = new Text('0', style);
  textMessage.anchor.set(0.5, 0.5);  // anchor right in the middle for spinning
  textMessage.rotation = 0.1;
  textMessage.position.set(x, y);
  scoreText = textMessage;
  return textMessage;
}

/**
 * Add score
 * @param n amount to add
 */
export function addScore(n: number) {
  score += n;
  scoreText.rotation = Math.random() - 0.5;
  scoreText.text = String(score);
  bonusSize = Math.min(bonusSize + n, MAX_BONUS_SIZE);

  // Reset shrink delay
  bonusSizeShrinkDelay = SHRINK_DELAY;
}

export function updateScoreText(delta: number) {
  bonusSizeShrinkDelay -= delta;
  if (bonusSizeShrinkDelay <= 0) {
    // Bonus size shrinks
    bonusSize = Math.max(0, bonusSize - (delta * 0.02));
    bonusSizeShrinkDelay = 0;
  }
  scoreText.scale.set(1 + (bonusSize / 10));
}

/** Reset state */
export function resetScore() {
  score = 0;
  bonusSize = 1;
  scoreText.text = '0';
  bonusSizeShrinkDelay = 0;
}

export function getScore() {
  return score;
}
