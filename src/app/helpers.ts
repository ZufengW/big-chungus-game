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
