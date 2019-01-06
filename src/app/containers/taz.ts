import { angleBetweenPoints, distanceSquared, normalise, pointTo } from '../helpers';
import {
  Graphics,
  Point,
  Sprite,
  Texture,
} from '../pixi-alias';
import { Character } from './character';
import { MovingContainer } from './moving-container';

/** Taz's Active substates */
enum ActiveState {
  Walking,
  Attacking,
}

const SCALE = 0.7;

export class Taz extends Character {
  private activeState: ActiveState = ActiveState.Walking;
  private arm: Sprite;
  private enemy: MovingContainer;

  constructor(
    bodyTexture: Texture,
    armsTexture: Texture,
    enemy: MovingContainer,
  ) {
  super(bodyTexture);
  this.enemy = enemy;

  // set up Arm
  const arm = new Sprite(armsTexture);
  arm.pivot.set(80, 54);
  arm.position.set(-64, -32);
  this.body.addChild(arm);
  this.arm = arm;

  // make smaller
  this.setScale(SCALE);
  }

  /** Use this to reset state in preparation for respawning */
  public init() {
    super.init();
    this.activeState = ActiveState.Walking;
  }
}
