/**
 * Popover's placement math — ported from the concept's `placePop` (DrillSentences.Concept.html:1208).
 * Pure: a rect in, a box out, no DOM. Prefers below the anchor; keeps its side across re-places unless
 * the room it has shrinks past a floor and the other side has more; never overlaps the anchor.
 */

export interface PopoverRect {
  readonly X: number;
  readonly Y: number;
  readonly Width: number;
  readonly Height: number;
}

export interface PopoverPlacementInput {
  /** The word/control the popover points at, in canvas px. */
  readonly Anchor: PopoverRect;
  /** The box the panel must stay inside — canvas bounds inset by the caller (safe areas, a fixed gap). */
  readonly Region: PopoverRect;
  /** The panel's authored width. */
  readonly W: number;
  /** The panel's natural (unconstrained) height. */
  readonly H: number;
  /** `null` on the first placement (pick whichever side fits); the previous `Down` on every re-place
   *  after that, so an open popover doesn't flip sides on every frame of a scroll. */
  readonly PrevDown: boolean | null;
}

/** Whether a canvas-px point falls inside a rect, inclusive of its top/left edge, exclusive of its
 *  bottom/right — the same half-open convention a hit-test uses everywhere else in the kit. Shared by
 *  Popover's own outside-dismiss (LaneM.md's toggle fix: a press on the PANEL or the ANCHOR both read
 *  as "inside", never a dismiss) so the geometry has one definition instead of two inline copies. */
export function PointInRect(x: number, y: number, rect: PopoverRect): boolean {
  return x >= rect.X && x < rect.X + rect.Width && y >= rect.Y && y < rect.Y + rect.Height;
}

export interface PopoverPlacement {
  readonly X: number;
  readonly Y: number;
  /** The panel's capped height — never taller than the room on the side it landed. */
  readonly MaxHeight: number;
  readonly Down: boolean;
  /** The arrow's tip X, in the SAME canvas-px space as `Region`/`Anchor` (not yet relative to `X`). */
  readonly ArrowX: number;
  readonly ArrowVisible: boolean;
  /** `VisualOrigin` fraction pair: where the panel grows from, so it opens out of the arrow tip. */
  readonly OriginX: number;
  readonly OriginY: number;
}

/** The arrow's own height — how far the panel stands off the anchor on the side it opens. */
const ARROW_HEIGHT = 12;
/** The shortest a popover is ever capped to; below this it would stop reading as a panel. */
const MIN_HEIGHT = 44;
/** How close to the panel's short corners the arrow tip is kept from — a 17×17 diamond needs clearance
 *  to still sit flush against a BorderRadius-22 panel's corner. */
const ARROW_MARGIN = 32;

const Clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export function PlacePopover(input: PopoverPlacementInput): PopoverPlacement {
  const { Anchor: a, Region: r, W, H, PrevDown } = input;
  const aTop = a.Y;
  const aBottom = a.Y + a.Height;
  const aCenterX = a.X + a.Width / 2;
  const regionTop = r.Y;
  const regionBottom = r.Y + r.Height;
  const regionLeft = r.X;
  const regionRight = r.X + r.Width;

  const below = regionBottom - (aBottom + ARROW_HEIGHT);
  const above = (aTop - ARROW_HEIGHT) - regionTop;

  let down: boolean;
  if (PrevDown === null) {
    down = below >= Math.min(H, 240) || below >= above;
  } else {
    down = PrevDown;
    const room = down ? below : above;
    const other = down ? above : below;
    if (room < Math.min(H, 140) && other > room) down = !down;
  }

  const h = Math.max(MIN_HEIGHT, Math.min(H, down ? below : above));
  const x = Clamp(aCenterX - W / 2, regionLeft, regionRight - W);
  const y = down
    ? Math.max(aBottom + ARROW_HEIGHT, regionTop)
    : Math.min(aTop - ARROW_HEIGHT - h, regionBottom - h);
  const arrowX = Clamp(aCenterX, x + ARROW_MARGIN, x + W - ARROW_MARGIN);
  const arrowVisible = down
    ? (aBottom >= regionTop - 2 && aBottom <= regionBottom)
    : (aTop <= regionBottom + 2 && aTop >= regionTop);

  return {
    X: x,
    Y: y,
    MaxHeight: h,
    Down: down,
    ArrowX: arrowX,
    ArrowVisible: arrowVisible,
    OriginX: W > 0 ? (arrowX - x) / W : 0.5,
    OriginY: down ? 0 : 1,
  };
}
