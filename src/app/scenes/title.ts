import { APP_WIDTH, APP_WIDTH_HALF, interaction } from '../app';
import {
  Container,
  Filters,
  loader,
  Point,
  Sprite,
  Text,
  TextStyle,
  ZContainer,
} from '../pixi_alias';
import * as R from '../resources';
import { ISceneType } from './scene';

const resources = loader.resources;  // Alias

export function create(): ISceneType {
  const sceneStage = new Container();

  // create a map
  const map = new Sprite(resources[R.MAP_PATH].texture);
  map.anchor.set(0.5, 0.5);
  map.position.set(APP_WIDTH_HALF, APP_WIDTH_HALF);
  sceneStage.addChild(map);

  // create a chungus
  const chungus = new Sprite(resources[R.CHUNGUS_PATH].texture);
  chungus.anchor.set(0.5, 0.5);
  chungus.position.set(APP_WIDTH_HALF, APP_WIDTH_HALF);
  sceneStage.addChild(chungus);

  // create a carrot
  const carrot = new Sprite(resources[R.CARROT_PATH].texture);
  carrot.anchor.set(0.5, 0.5);
  carrot.position.set(APP_WIDTH_HALF + 150, APP_WIDTH_HALF);
  sceneStage.addChild(carrot);

  // Create a title message
  const style = new TextStyle({
    fontFamily: 'Futura',
    fontSize: 32,
    fill: 'white',
    stroke: '#000000',
    strokeThickness: 6,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowDistance: 2,
  });
  const textMessage = new Text('Big Chungus', style);
  textMessage.anchor.set(0.5, 0.5);
  textMessage.position.set(APP_WIDTH_HALF, 150);
  sceneStage.addChild(textMessage);

  const scene: ISceneType = {
    sceneContainer: sceneStage,
    // restart,
    update,
    // activate,
    // deactivate,
  };
  return scene;
}

function update(delta: number) {
  // TODO
}
