import { Point } from './pixi-alias';
/**
 * Helper functions
 */

export function randRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
