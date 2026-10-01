import { ProjectedTravel, RubberBand } from '../Sheet/Sheet.Geometry';

/** Pure math for a swipeable row — shared by `swipe-row` and (lane C's W7) `sortable-row`. */

export type SwipeTone = 'Danger' | 'Neutral' | 'Accent';

export interface SwipeAction {
  readonly Key: string;
  readonly Label: string;
  readonly Icon?: string;
  readonly Tone: SwipeTone;
}

/** The shortest an action is ever drawn, however many share the strip. */
export const MIN_ACTION_WIDTH = 74;
/** How far past half the row a drag has to go before `FullSwipe` arms the first trailing action. */
const FULL_SWIPE_ARM_FRACTION = 0.6;

/** Each action's width sharing the strip's open total evenly, never under `MIN_ACTION_WIDTH` — so a
 *  strip with few actions widens them rather than leaving dead space, and one with many never
 *  squeezes an action unreadably thin (the strip's own open total grows to fit instead). */
export function ActionWidths(count: number, totalWidth: number): readonly number[] {
  if (count <= 0) return [];
  const w = Math.max(MIN_ACTION_WIDTH, totalWidth / count);
  return Array.from({ length: count }, () => w);
}

/** The resting (not full-swipe) open width for a side with `count` actions: each at its own minimum. */
export function RestingOpenWidth(count: number): number {
  return count * MIN_ACTION_WIDTH;
}

/** A drag's raw delta `dx`, clamped to `+-total` and rubber-banded (UIScrollView's curve,
 *  `Sheet.Geometry.RubberBand`) past it — `total` is the open width of the side `dx` points toward
 *  (0 on a side with no actions, so any drag that way rubber-bands from a standing start). */
export function Overscroll(dx: number, total: number, rowWidth: number): number {
  const mag = Math.abs(dx);
  if (mag <= total) return dx;
  const sign = Math.sign(dx);
  return sign * (total + RubberBand(mag - total, rowWidth || 1));
}

/** Past this fraction of the row's own width, `FullSwipe` arms: the first trailing action takes the
 *  row's full width (release fires it without needing to settle open first). */
export function ArmFull(tx: number, rowWidth: number): boolean {
  if (rowWidth <= 0) return false;
  return -tx > FULL_SWIPE_ARM_FRACTION * rowWidth;
}

/** Where a release settles: open (true) when the pan's momentum would carry it past half the open
 *  total, closed (false) otherwise. `tx`/`velocityPxPerSecond` share `tx`'s sign convention (negative
 *  = toward trailing). */
export function SettleOpen(tx: number, velocityPxPerSecond: number, total: number): boolean {
  if (total <= 0) return false;
  return Math.abs(tx + ProjectedTravel(velocityPxPerSecond)) > total / 2;
}
