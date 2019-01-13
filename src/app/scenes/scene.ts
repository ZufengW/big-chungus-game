import { Container } from '../pixi_alias';

export interface ISceneType {
  sceneContainer: Container;
  restart: () => void;
  update: (delta: number) => void;
  // activate;
  // deactivate;
}
