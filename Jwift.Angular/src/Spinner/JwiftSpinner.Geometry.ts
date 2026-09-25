// UIActivityIndicatorView's spoke art, as iOS 26.1 draws it (Jwift/Apple/Sizing.md section 8; every
// value is read from UIKitCore in the firmware). Pure, so the geometry and the step table are testable
// without a canvas.

/** Eight spokes at every size, two image frames per spoke (`_updateLayoutInfo`). */
export const SpokeCount = 8;
export const FramesPerSpoke = 2;
export const FrameCount = SpokeCount * FramesPerSpoke;

/** One full loop of the ring (`_UIActivityIndicatorSettings.fullLoopDuration`). */
export const LoopSeconds = 0.8;

/** Every spoke is filled at this alpha on top of its step alpha (`fillWithBlendMode:kCGBlendModeCopy alpha:0.85`). */
export const SpokeFillAlpha = 0.85;

/** UIActivityIndicatorView.Style.medium and .large (`defaultSizeForStyle:`). */
export const MediumSize = 20;
export const LargeSize = 37;

export interface SpokeGeometry {
  /** The indicator's box, square, in points. */
  Box: number;
  /** The ring's centre, from the box's top left. Large draws a 35pt ring in its 37pt box, from the corner. */
  Center: number;
  /** Distance from the centre to a spoke's outer end. */
  Radius: number;
  /** Spoke thickness; the spoke is a capsule, so its corner radius is half of this. */
  Thickness: number;
  Length: number;
}

const Lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** `UIRoundToViewScale`: UIKit snaps a computed length to the device pixel grid. */
const RoundToScale = (value: number, scale: number): number => Math.round(value * scale) / scale;

/** Half the spoke's thickness (`_spokeWidthForGearWidth:`), eight-spoke branch. Any width that is not
 *  medium or large takes UIKit's custom-width table, which reproduces medium exactly at 20. */
const HalfThickness = (width: number): number => {
  if (width === LargeSize) return 2.5;
  if (width < 20) return 1;
  if (width < 30) return 1.25;
  if (width < 32) return 1.75;
  if (width < 37) return 2;
  if (width < 42.75) return 2.5;
  if (width < 54.25) return 3;
  if (width <= 60) return 3.5;
  return Math.max(1, Math.round(width / 7.5) * 0.5);
};

/** Spoke length (`_spokeLengthForGearWidth:`), eight-spoke branch. */
const SpokeLength = (width: number, scale: number): number => {
  if (width === LargeSize) return 12;
  const knots: ReadonlyArray<readonly [number, number]> = [
    [14, 4], [20, 6.5], [24, 7.5], [30, 9.5], [32, 10], [40, 14], [60, 19], [64, 22],
  ];
  if (width <= 14) return RoundToScale((4 * width) / 14, scale);
  if (width > 64) return RoundToScale(width / 2.84, scale);
  for (let k = 1; k < knots.length; k++) {
    const [w0, l0] = knots[k - 1];
    const [w1, l1] = knots[k];
    if (width <= w1) return RoundToScale(Lerp(l0, l1, (width - w0) / (w1 - w0)), scale);
  }
  return RoundToScale(22, scale);
};

export const SpokeGeometryFor = (size: number, scale: number): SpokeGeometry => {
  const ring = size === LargeSize ? 35 : size;
  return {
    Box: size,
    Center: ring / 2,
    Radius: ring / 2,
    Thickness: 2 * HalfThickness(size),
    Length: SpokeLength(size, scale),
  };
};

/** Spoke `index` sits at the 9 o'clock spoke turned `index` eighths counterclockwise; as a clockwise
 *  angle from 12 o'clock, for a rotation transform. */
export const SpokeAngle = (index: number): number => (((270 - 45 * index) % 360) + 360) % 360;

/** The spoke's alpha in image `frame` (`_imageForStep:` with `_alphaValueForStep:`): a linear ramp down
 *  0.085 per frame from 1 to a 0.32 floor. The bright head advances one spoke clockwise every two frames. */
export const SpokeStepAlpha = (index: number, frame: number): number => {
  const step = (frame + FramesPerSpoke * index) % FrameCount;
  return Math.max(0.32, 1 - (0.68 / (FrameCount / 2)) * step);
};
