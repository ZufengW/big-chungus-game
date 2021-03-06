/**
 * PIXI aliases
 */
import * as Filters from 'pixi-filters';
import * as PIXI from 'pixi.js';

import Application = PIXI.Application;
import Circle = PIXI.Circle;
import Container = PIXI.Container;
export class ZContainer extends Container {
  public zIndex: number = 0;

  /**
   * Call this after each time this.y changes.
   */
  public updateZIndex() {
    this.zIndex = this.y;
  }
}
import Graphics = PIXI.Graphics;
import InteractionData = PIXI.interaction.InteractionData;
import InteractionEvent = PIXI.interaction.InteractionEvent;
import InteractionManager = PIXI.interaction.InteractionManager;
import loader = PIXI.loader;
import Point = PIXI.Point;
import Rectangle = PIXI.Rectangle;
import Sprite = PIXI.Sprite;
import Text = PIXI.Text;
import TextStyle = PIXI.TextStyle;
import Texture = PIXI.Texture;
import utils = PIXI.utils;

export {
  Application,
  Circle,
  Container,
  Filters,
  Graphics,
  InteractionData,
  InteractionEvent,
  InteractionManager,
  loader,
  Point,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  Texture,
  utils,
};
