import {
  Text,
  TextStyle,
} from '../pixi-alias';

/** this ui component has state... */
let score: number = 0;
let scoreText: Text;

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
}
