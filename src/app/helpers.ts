import { Point } from './pixi_alias';
/**
 * Module containing Helper functions
 */

const MAX_TRIES = 50;

/** @return random integer in range [min, max] */
export function randRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 *
 * @param min minimum x and y value
 * @param max maximum x and y value
 * @param avoid Point to avoid
 * @param distanceSquaredToAvoid distance squared away from point to avoid
 * @return random coordinates away from point to avoid
 */
export function randPosAwayFrom(
    min: number, max: number,
    avoid: Point, distanceSquaredToAvoid: number,
  ): [number, number] {
  let side: number;
  let x: number = randRange(min, max);
  let y: number = randRange(min, max);
  let tries = 0;
  while (lengthSquared([x - avoid.x, y - avoid.y]) < distanceSquaredToAvoid) {
    // Fallback to only trying the extremes
    side = randRange(1, 4);
    switch (side) {
      case 1:  // top
        x = randRange(min, max);
        y = min;
        break;
      case 2:  // right
        x = max;
        y = randRange(min, max);
        break;
      case 3:  // bottom
        x = randRange(min, max);
        y = max;
        break;
      case 4:  // left
        x = min;
        y = randRange(min, max);
        break;
      default:
        return [min, min];  // Should not happen
    }
    tries++;
    if (tries > MAX_TRIES) {
      // This is bad. Don't get into this situation.
      break;
    }
  }
  return [x, y];
}

/**
 * Flips angle 180 degrees
 * @param angle to flip (in radians)
 */
export function flipAngle(angle: number) {
  if (angle > Math.PI) {
    return angle - Math.PI;
  }
  return angle + Math.PI;
}

/**
 * @param p1 first point
 * @param p2 second point
 * @return squared distance between two points
 */
export function distanceSquared(p1: Point, p2: Point) {
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

/**
 * @param param0 coordinates
 * @return squared length of pair
 */
export function lengthSquared([x, y]: [number, number]): number {
  return (x ** 2) + (y ** 2);
}

/**
 * [x, y] pair from p1 to p2
 * @param p1 start point
 * @param p2 end point
 */
export function pointTo(p1: Point, p2: Point): [number, number] {
  return [p2.x - p1.x, p2.y - p1.y];
}

/**
 * Returns angle (from x axis) in radians from p1 to p2
 * @param p1 start point
 * @param p2 destination point
 */
export function angleBetweenPoints(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Returns the pair normalised so they have magnitude 1.
 * Returns [0, 0] if input is [0, 0]
 * @param param0 ordered pair of numbers
 */
export function normalise([x, y]: [number, number]): [number, number] {
  if (x === 0 && y === 0) {
    return [0, 0];
  }
  const length = Math.sqrt((x * x) + (y * y));
  return [x / length, y / length];
}

/**
 * Convert rgb to colour number (hex)
 * @param r red
 * @param g blue
 * @param b green
 */
export function rgb(r: number, g: number, b: number): number {
  return r * (256 ** 2) + g * 256 + b;
}
