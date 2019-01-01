import { Circle, Container, Graphics, Sprite, Texture } from '../pixi-alias';

/**
 * Has velocity and update. And shadow and z (elevation)
 */
export class MovingContainer extends Container {
  public dx: number = 0;
  public dy: number = 0;
  public z: number = 0;
  /** the main Sprite of the container */
  public body: Sprite;
  /** half the original width of the container's shadow */
  private originalRadius: number;
  /** scaled */
  private radius: number;

  /**
   *
   * @param texture to use for the body
   * @param radius optional. Value to use for the longer radius of the shadow.
   *    If not provided, will use half the width of the texture.
   */
  constructor(texture: Texture, radius?: number) {
    super();

    // All MovingContainers have a shadow at the bottom and a circular hit area

    /** Either the provided radius or half the width of the texture */
    const halfWidth = !!radius ? radius : texture.width / 2;
    this.originalRadius = halfWidth;
    this.radius = halfWidth;

    const shadow = new Graphics();
    shadow.beginFill(0x000000);
    shadow.drawEllipse(0, 0, halfWidth, halfWidth / 2);
    shadow.endFill();
    shadow.x = texture.width / 2;
    shadow.y = texture.height;
    shadow.alpha = 0.5;

    this.addChild(shadow);

    // create the thing with texture
    const body = new Sprite(texture);
    this.addChild(body);
    this.body = body;

    // TODO: set anchor!
    this.pivot.set(halfWidth, texture.height);

    // MovingContainers only collide at the bottom
  }

  public update(delta: number): void {
    return;
  }

  /**
   * Set the scale of this MovingContainer. Use this instead of .scale.set()
   * @param scale to set
   */
  public setScale(scale: number): void {
    this.scale.set(scale, scale);
    this.radius = this.originalRadius * scale;
  }

  /**
   * Updates position using velocity. Call this after update().
   * @param delta frame time
   */
  public postUpdate(delta: number): void {
    this.x += this.dx * delta;
    this.y += this.dy * delta;

    // this.rotation += 0.02;

    // TODO update draw layer

    // TODO: height
  }

  /**
   * Returns whether or not this MovingContainer is overlapping another.
   * They only collide at their shadows.
   * @param c2 other object
   */
  public collision(c2: MovingContainer): boolean {
    const xDiff = this.x - c2.x;
    // trick: since all ellipses are same ratio and angle, can halve y scale
    const yDiff = (this.y - c2.y) / 2;
    const dist = Math.sqrt((xDiff * xDiff) * (yDiff * yDiff));
    return dist < (this.radius + c2.radius);
  }

  /**
   * Constrains this MovingContainer's position to keep it within bounds.
   * Takes into account the dimensions and scale of this MovingContainer.
   * @param minX minimum x position
   * @param maxX maximum x position
   * @param minY minimum y position
   * @param maxY maximum y position
   */
  public constrainPosition(
      minX: number, maxX: number,
      minY: number, maxY: number): void {
    const halfWidth = this.radius;
    const miniX = minX + halfWidth;
    const maxiX = maxX - halfWidth;
    const quarterR = halfWidth / 2;
    const miniY = minY + quarterR;
    const maxiY = maxY - quarterR;
    if (this.x < miniX) {
      this.x = miniX;
    } else if (this.x > maxiX) {
      this.x = maxiX;
    }
    if (this.y < miniY) {
      this.y = miniY;
    } else if (this.y > maxiY) {
      this.y = maxiY;
    }
  }
}
