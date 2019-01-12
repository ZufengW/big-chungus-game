import { Graphics, Sprite, Texture, ZContainer } from '../pixi_alias';

/**
 * Has velocity and update. And shadow and z (elevation)
 */
export class MovingContainer extends ZContainer {
  public static readonly MIN_SCALE = 0.00390625;
  /** Velocity */
  public dx: number = 0;
  public dy: number = 0;
  public dz: number = 0;
  /** What order to render in */
  public zIndex: number = 0;
  /** the main Sprite of the container */
  public body: Sprite;
  private shadow: Graphics;
  /** elevation */
  private z: number = 0;
  /** half the original width of the container's shadow */
  private originalRadius: number;
  /** scales with this.setScale. Used in collision detection */
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
    this.shadow = shadow;

    // create the thing with texture
    const body = new Sprite(texture);
    this.addChild(body);
    this.body = body;

    // TODO: set anchor!
    this.pivot.set(halfWidth, texture.height);

    // Allow body to rotate around middle
    const halfBodyWidth = this.body.width / 2;
    const halfBodyHeight = this.body.height / 2;
    this.body.anchor.set(0.5, 0.5);
    // Need to move body's position to compensate for anchor
    this.body.position.set(halfBodyWidth, halfBodyHeight);
    // MovingContainers only collide at the bottom
  }

  public update(delta: number): void {
    // update z like gravity
    this.dz -= delta;
    if (this.z < 0) {
      this.dz = 0;
    }
  }

  /**
   * Set the scale of this MovingContainer. Use this instead of .scale.set()
   * @param scale to set
   */
  public setScale(scale: number): void {
    // Avoid setting to 0 or negative
    const newScale = Math.max(scale, MovingContainer.MIN_SCALE);
    this.scale.set(newScale);
    this.radius = this.originalRadius * newScale;
  }

  /**
   * Set the elevation and update the Sprite's position
   * @param z new z value
   */
  public setZ(z: number): void {
    this.z = z;
    this.body.y = (this.body.height / 2) - (this.z / this.scale.y);
    // normalize z to a value in range [0..1]
    const normZ = normalize(z);
    this.shadow.scale.set(1 - normZ);
  }

  public getZ(): number {
    return this.z;
  }

  /**
   * Updates position using velocity. Call this after update().
   * @param delta frame time
   */
  public postUpdate(delta: number): void {
    this.x += this.dx * delta;
    this.y += this.dy * delta;
    // Update elevation (z)
    if (this.dz !== 0) {
      const zNext = this.z + this.dz * delta;
      if (zNext < 0) {
        // disallow going below 0
        this.setZ(0);
        this.dz = 0;
      } else {
        this.setZ(zNext);
      }
    }

    // Update draw layer
    this.updateZIndex();
  }

  /**
   * Returns whether or not this MovingContainer is overlapping another.
   * They only collide at their shadows.
   * @param c2 other object
   */
  public collision(c2: MovingContainer): boolean {
    const xDiff = this.x - c2.x;
    // trick: since all ellipses are same ratio and angle, can double y scale
    const yDiff = (this.y - c2.y) * 2;
    const dist = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
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

  /** in case need to show or hide shadow */
  protected setShadowVisibility(value: boolean) {
    this.shadow.visible = value;
  }
}

const MAX_NUM = 600;
/**
 * Normalises n to a number in range [0..1]
 * @param n number to normalize
 */
function normalize(n: number) {
  if (n >= MAX_NUM) {
    return 1;
  } else if (n <= 0) {
    return 0;
  }
  return n / MAX_NUM;
}
