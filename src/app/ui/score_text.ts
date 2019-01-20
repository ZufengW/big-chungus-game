import {
  Text,
  TextStyle,
} from '../pixi_alias';

/** this ui component has state. Alternative to using a class */
let score: number = 0;
/** The highest score achieved. Doesn't reset. */
let highScore: number = 0;
let scoreText: Text;

/** When frozen, score can't change anymore. */
let scoreFrozen = false;

/** Bonus size when there is a combo */
let bonusSize = 1;
/** Countdown before bonus size starts shrinking */
let bonusSizeShrinkDelay = 0;

const MAX_BONUS_SIZE = 10;
/** delay before bonusSize starts dropping. In frames */
const SHRINK_DELAY = 60;

/** initialise the Text that displays the game score */
export function initScoreText(): Text {
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
  scoreText = textMessage;
  return textMessage;
}

/**
 * Add score
 * @param n amount to add
 */
export function addScore(n: number) {
  if (scoreFrozen) {
    return;
  }
  score += n;
  scoreText.rotation = Math.random() - 0.5;
  scoreText.text = String(score);
  bonusSize = Math.min(bonusSize + n, MAX_BONUS_SIZE);

  // Reset shrink delay
  bonusSizeShrinkDelay = SHRINK_DELAY;
}

/** score shrinks over time */
export function updateScoreText(delta: number) {
  if (scoreFrozen) {
    return;
  }
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
  scoreFrozen = false;
}

export function getScore() {
  return score;
}

export function getHighScore() {
  return highScore;
}

/** Prevent the score from changing until next resetScore */
export function freezeScore() {
  scoreFrozen = true;
}

/** Call this at the end of the game. Also freezes the score. */
export function finaliseScore() {
  freezeScore();  // freeze if not already
  scoreText.text = 'Final score: ' + String(score);
  scoreText.rotation = 0;
  highScore = Math.max(highScore, score);
}
