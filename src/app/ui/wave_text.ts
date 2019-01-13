import {
  Text,
  TextStyle,
} from '../pixi_alias';

/** This UI Text */
let messageText: Text;

/** initialise the Text that displays the wave status
 * @return the Text. Need to set position and add it to the stage.
 */
export function installWaveText(): Text {
  const style = new TextStyle({
    fontFamily: 'Menlo',
    fontSize: 24,
    fill: 'white',
    stroke: '#000000',
    strokeThickness: 3,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 3,
    dropShadowDistance: 2,
  });
  const textMessage = new Text('', style);
  textMessage.anchor.set(0.5, 0.5);  // anchor right in the middle for spinning
  messageText = textMessage;
  return textMessage;
}

/**
 * Set the score text
 * @param n wave number
 */
export function setWaveTextNum(n: number) {
  messageText.text = 'Wave ' + n;
}

/** Reset the text */
export function restart() {
  messageText.text = '';
}
