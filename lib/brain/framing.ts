// How far the home camera sits so the specimen fits the stage, whatever its shape.

/** Vertical field of view, degrees. */
export const FOV = 30;

/** Home view direction: three-quarter left and slightly above. +X is the brain's left, +Z its front. */
export const HOME_DIRECTION: readonly [number, number, number] = [0.3, 0.07, 0.27];

/** Share of the stage's height, and of its width, the specimen may fill at home. */
const FILL_HEIGHT = 0.62;
const FILL_WIDTH = 0.8;

/** Zoom limits, as multiples of the home distance. */
export const ZOOM_IN = 0.55;
export const ZOOM_OUT = 1.6;

/** Metres. `size` is the specimen's bounding box size (x, y, z); `aspect` is the stage's width over height. */
export function homeDistance(size: readonly [number, number, number], aspect: number): number {
  const [dx, , dz] = HOME_DIRECTION;
  const azimuth = Math.atan2(dx, dz);
  // Half the box's width as seen from the home azimuth, and half its height.
  const halfWidth = (size[0] * Math.abs(Math.cos(azimuth)) + size[2] * Math.abs(Math.sin(azimuth))) / 2;
  const halfHeight = size[1] / 2;
  const tan = Math.tan(((FOV / 2) * Math.PI) / 180);
  return Math.max(halfHeight / (FILL_HEIGHT * tan), halfWidth / (FILL_WIDTH * tan * aspect));
}
