// Apple's iOS 26 sheet, as numbers and pure functions. Every value cites Jwift/Apple/Sheets.md:
// [C] read from UIKit 26.1, [I] measured or inferred.

/** A resting height. `content` fits the sheet to what it holds (Apple's custom detent, or a fitted form sheet),
 *  capped at the large detent; `medium` and `large` are Apple's two system detents. */
export type SheetDetent = 'content' | 'medium' | 'large';

export const SHEET_METRICS = {
  /** The large detent's top edge sits this far below the top safe area (`_UISheetPresentationMetrics.topOffset`) [C]. */
  TopOffset: 10,
  /** The medium detent, as a fraction of the large one, for containers taller than 568 pt; 0.63 at or under [C]. */
  MediumFraction: 0.56,
  MediumFractionShort: 0.63,
  /** Bottom corners never under 20 pt [C]. The corners themselves are the app's outer corner less the gap
   *  (`@JwiftSheetRadius`, `@JwiftScreenRadius`), and the 8 pt partial gap [C] is `@JwiftSheetInset`. */
  MinBottomRadius: 20,
  /** Glass while the sheet is at most half way to full height, opaque above [C]. */
  GlassBelow: 0.5,
  /** The dimming view's black: 0.2 in light, 0.48 in dark (`_alertControllerDimmingViewColor`) [C]. */
  DimLight: 0.2,
  DimDark: 0.48,
  /** A pan past this travel is a drag, not a tap (the engine's slop). */
  Slop: 10,
} as const;

export interface FormSheetSize { readonly Width: number; readonly Height: number }

/** `defaultFormSheetSizeForScreenSize:` [C], by the screen's longer side. */
export function FormSheetSizeFor(width: number, height: number): FormSheetSize {
  const longest = Math.max(width, height);
  if (longest <= 1024) return { Width: 540, Height: 600 };
  if (longest <= 1590) return { Width: 580, Height: 640 };
  return { Width: 620, Height: 680 };
}

/** Regular width presents a centered form sheet; compact width, an edge-attached sheet [I]: the iPad's regular class. */
export function IsRegularWidth(width: number, height: number): boolean {
  return width >= 700 && height >= 500;
}

export function LargeHeight(containerHeight: number, safeTop: number): number {
  return Math.max(0, containerHeight - safeTop - SHEET_METRICS.TopOffset);
}

export function MediumHeight(large: number, containerHeight: number): number {
  return large * (containerHeight > 568 ? SHEET_METRICS.MediumFraction : SHEET_METRICS.MediumFractionShort);
}

export const Clamp01 = (v: number): number => (v <= 0 ? 0 : v >= 1 ? 1 : v);

/** How far the sheet is from its partial look to its full one: 0 at the medium height and below, 1 at large. */
export function PercentFullHeight(height: number, medium: number, large: number): number {
  if (large <= medium) return height >= large ? 1 : 0;
  return Clamp01((height - medium) / (large - medium));
}

/** The side and bottom gap for a percent full height: the partial gap, closing to 0 at the large detent [C]. */
export function InsetFor(percentFull: number, partialInset: number): number {
  return partialInset * (1 - percentFull);
}

/** The bottom corners, concentric with the app's outer corner across the gap between them, never under 20 pt. */
export function BottomRadius(screenRadius: number, inset: number): number {
  return Math.max(screenRadius - inset, SHEET_METRICS.MinBottomRadius);
}

/** UIScrollView's rubber band [I]: `(1 - 1 / (x c / d + 1)) d`, c = 0.55. */
export function RubberBand(overshoot: number, dimension: number): number {
  if (overshoot <= 0 || dimension <= 0) return 0;
  return (1 - 1 / ((overshoot * 0.55) / dimension + 1)) * dimension;
}

/** Where a released pan would come to rest under UIScrollView's normal deceleration (0.998 per ms) [I]. */
export function ProjectedTravel(velocityPxPerSecond: number): number {
  const rate = 0.998;
  return (velocityPxPerSecond / 1000) * rate / (1 - rate);
}

/** The detent the grabber's tap goes to: one step smaller, wrapping from the smallest to the largest [C]
 *  (`sub_18910767C`, `(current + n - 1) mod n`). Null means dismiss: a sheet with one detent. */
export function GrabberTarget(current: number, count: number): number | null {
  if (count <= 1) return null;
  return (current + count - 1) % count;
}

/** The resting height a release lands on: the nearest of the detents (and 0, the dismissal, when allowed) to where
 *  the pan's momentum would carry it. Returns -1 for a dismissal. */
export function SettleIndex(projectedHeight: number, heights: readonly number[], canDismiss: boolean): number {
  let best = -1;
  let bestDistance = canDismiss ? Math.abs(projectedHeight) : Infinity;
  heights.forEach((h, i) => {
    const d = Math.abs(projectedHeight - h);
    if (d < bestDistance) { best = i; bestDistance = d; }
  });
  return best;
}
