import { Container } from '../pixi_alias';

export interface ISceneType {
  sceneContainer: Container;
  // restart;
  update: (delta: number) => void;
  // activate;
  // deactivate;
}
