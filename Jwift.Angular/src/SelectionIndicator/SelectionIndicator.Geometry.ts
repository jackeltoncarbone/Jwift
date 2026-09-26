// The selection lens's box, as UIKit sizes it: it grows by bounds, never by transform (Jwift/Apple/LiquidGlass.md 7.1,
// `_updateSelectionViewBounds`), and here it stays concentric with its bar at every size.

/** The bar the lens stands in, in its own layout px (unflexed: the bar's flex carries bar and lens as one body). */
export interface LensBar {
  Width: number;
  Height: number;
  /** The bar's corner, clamped to half its height (a capsule's is exactly half). */
  Radius: number;
}

export interface LensInput {
  Bar: LensBar;
  /** Where the lens's centre wants to be, bar-local x: the item's centre, or the finger while dragging. */
  Center: number;
  /** The resting pill: its item's box (plus any reach). */
  Width: number;
  Height: number;
  /** How far the lifted lens reaches past the pill on each side: 8 pt all round on a tab bar, 12 across and 8 down
   *  on a segmented control (`CGRectInset(frame, -8, -8)`, `(-12, -8)`; Jwift/Apple/Sizing.md 1, 2). */
  OutsetX: number;
  OutsetY: number;
  /** 0 resting, 1 lifted; a spring may carry it past 1. */
  Lift: number;
  /** The loupe's movement scale along x (Internal/FlexMovement.ts); the cross axis takes its inverse. */
  Squash: number;
}

/** The lens in bar-local layout px, with the inset to the bar it keeps and the corner that makes it concentric. */
export interface LensRect {
  Left: number;
  Top: number;
  Width: number;
  Height: number;
  /** Its distance in from the bar's edge, the same on every side it approaches; negative while it rides past it. */
  Inset: number;
  /** The bar's corner less the inset (ConcentricRectangle, Jwift/Apple/LiquidGlass.md 10). */
  Radius: number;
}

/** The lens's box: the pill grown by its outset times the lift, then squashed about its centre keeping its area,
 *  centred on the bar's height and held so its ends never come nearer the bar's ends than its top and bottom do. */
export const LensGeometry = (input: LensInput): LensRect => {
  const { Bar: bar, Lift: lift } = input;
  const grownWidth = Math.max(0, input.Width + 2 * input.OutsetX * lift);
  const grownHeight = Math.max(0, input.Height + 2 * input.OutsetY * lift);
  // Narrowed no further than square, so it stays a capsule along the bar and so concentric with it.
  const floor = grownWidth > 0 ? Math.sqrt(grownHeight / grownWidth) : 1;
  const squash = Math.max(input.Squash > 0 ? input.Squash : 1, Math.min(1, floor));
  const width = grownWidth * squash;
  const height = grownHeight / squash;
  const inset = (bar.Height - height) / 2;
  const barRadius = Math.min(bar.Radius, bar.Height / 2);
  const radius = Math.max(0, Math.min(barRadius - inset, height / 2, width / 2));
  // UIKit clamps the dragged lens's centre inside the items' union (Sizing.md 1); at the lens's own inset that is
  // the same line when unsquashed, and the one that keeps a squashed or wider lens concentric at the ends.
  const low = inset + width / 2;
  const high = bar.Width - inset - width / 2;
  const center = low > high ? bar.Width / 2 : Math.min(high, Math.max(low, input.Center));
  return { Left: center - width / 2, Top: inset, Width: width, Height: height, Inset: inset, Radius: radius };
};
