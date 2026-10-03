export const VERTICAL_RATIO = 9 / 16;
export const VERTICAL_RATIO_TOLERANCE = 0.03;

export function isVerticalNineSixteen(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return false;
  return Math.abs(width / height - VERTICAL_RATIO) <= VERTICAL_RATIO_TOLERANCE;
}
