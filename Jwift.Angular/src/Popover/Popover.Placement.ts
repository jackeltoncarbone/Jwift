/**
 * Popover's placement math — ported from the concept's `placePop` (DrillSentences.Concept.html:1208).
 * Pure: a rect in, a box out, no DOM. Prefers below the anchor when the whole panel fits there, else above
 * when it fits there, else whichever side has more room; keeps its side across re-places while the panel
 * still fits there; never overlaps the anchor.
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
  /** The panel's natural (unconstrained) height: everything its content would show with no cap at all,
   *  never a height an earlier placement already capped (`Popover.ts` keeps the two apart). */
  readonly H: number;
  /** Whether the content scrolls inside a capped panel (it reads `JWIFT_POPOVER_ROOM`). Content that does
   *  not (a count wheel, a stepper page) cannot shrink, so its panel is never capped: a cap would only let
   *  it spill out of its own frame, over the very word it points at. Absent means it scrolls. */
  readonly Scrolls?: boolean;
  /** `null` on the first placement (pick whichever side fits); the previous `Down` on every re-place
   *  after that, so an open popover doesn't flip sides on every frame of a scroll. */
  readonly PrevDown: boolean | null;
  /** A frame held where it already stands (`PopoverHold`), or absent to place afresh. */
  readonly Hold?: PopoverHold | null;
}

/**
 * Where a popover's frame stood when its content started changing in place: a menu pushing a submenu
 * page, or going back. Drill Sentences lane Y3, item 6 (phone): going into "Hold" from the "+" menu moved
 * the whole popover, since a page of another height re-placed the frame from scratch (an upward panel's
 * top follows its height; a side can flip). Like iOS menus, a held frame keeps its side, its leading edge
 * and its top (relative to the anchor, so it still rides a scroll); only its height follows the page.
 */
export interface PopoverHold {
  readonly Down: boolean;
  readonly X: number;
  /** The panel's top, less the anchor's own top. */
  readonly TopFromAnchor: number;
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
  /** The panel's capped height — never taller than the room on the side it landed, for content that
   *  scrolls; the natural height for content that does not (`PopoverPlacementInput.Scrolls`). */
  readonly MaxHeight: number;
  readonly Down: boolean;
  /** The arrow's tip X, in the SAME canvas-px space as `Region`/`Anchor` (not yet relative to `X`). */
  readonly ArrowX: number;
  readonly ArrowVisible: boolean;
  /** `VisualOrigin` fraction pair: where the panel grows from, so it opens out of the arrow tip. */
  readonly OriginX: number;
  readonly OriginY: number;
}

/** The box an open panel's rows are laid out in: its placement, at its own width, as tall as its content up
 *  to its cap. Drill Sentences lane CC1, item 5 (a blind phone tester): a row picked while the panel was still
 *  growing in only closed it. The rows hit test at this box from the first frame (the grow is a visual scale),
 *  but the outside press read the panel's own watched rect, which arrives from the worker a frame or more
 *  after each placement and so still stood where the panel was before it was placed. A press inside this
 *  box is a press on the panel. */
export function PopoverTargetRect(p: PopoverPlacement, width: number, naturalHeight: number): PopoverRect {
  return { X: p.X, Y: p.Y, Width: width, Height: Math.min(p.MaxHeight, naturalHeight) };
}

/** The arrow's own height — how far the panel stands off the anchor on the side it opens. */
const ARROW_HEIGHT = 12;
/** Popover.jss's own `Padding: 10pt` around the content, on every side (the sheet outlet a popover is
 *  teleported to draws at PointScale 1, so a point is a pixel there). The content's own room is the
 *  panel's capped height less this twice over: a scroll body capped at the PANEL's height used to run
 *  20pt past the panel's bottom, past the window's edge on a menu placed low. */
export const POPOVER_PANEL_PADDING = 10;
/** The shortest a popover is ever capped to; below this it would stop reading as a panel. */
const MIN_HEIGHT = 44;
/** How close to the panel's short corners the arrow tip is kept from — a 17×17 diamond needs clearance
 *  to still sit flush against a BorderRadius-22 panel's corner. */
const ARROW_MARGIN = 32;

const Clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export function PlacePopover(input: PopoverPlacementInput): PopoverPlacement {
  if (input.Hold) return holdPopover(input, input.Hold);
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

  // Drill Sentences lane AA2, item 1 (blind tester, desktop): the 5-8 row's "…" menu sat low in the list
  // and opened DOWNWARD into 260pt of room for a 350pt menu, since the first placement went below whenever
  // 240pt was free there. Capped and scrolled, its last two rows (Move down, Delete) sat under the window's
  // edge with nothing saying the panel scrolled. A side is only preferred when the WHOLE panel fits it;
  // a cap (and a scroll) is the last resort, when neither side holds it.
  const fitsBelow = H <= below;
  const fitsAbove = H <= above;
  let down: boolean;
  if (PrevDown === null) {
    down = fitsBelow || (!fitsAbove && below >= above);
  } else {
    // Keeps its side across a scroll while the panel fits there; once it no longer does, it moves to the
    // other side when the panel fits there or the other side simply has more room. Flipping only ever
    // gains room, so it never flips straight back.
    down = PrevDown;
    const fits = down ? fitsBelow : fitsAbove;
    const otherFits = down ? fitsAbove : fitsBelow;
    const room = down ? below : above;
    const other = down ? above : below;
    if (!fits && (otherFits || other > room)) down = !down;
  }

  const scrolls = input.Scrolls ?? true;
  const h = scrolls ? Math.max(MIN_HEIGHT, Math.min(H, down ? below : above)) : H;
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

/** A held frame (`PopoverHold`): same side, same leading edge (clamped back inside the region if the page
 *  got wider), same top relative to the anchor's top. A downward panel's room is everything below its top,
 *  so a taller page grows down into it; an upward panel's room ends at the arrow, so a taller page scrolls
 *  within it, and a shorter one leaves the panel where it stood with its arrow hidden (it no longer
 *  reaches the anchor), the way an iOS menu's submenu stays put. Never overlaps the anchor either way.
 *
 *  Drill Sentences lane BB2, item 2: the anchor itself may reflow under a held panel (a count wheel's taps
 *  rewrite the sentence it points at, and the sentence wraps one line shorter or longer). The top rides the
 *  anchor's TOP, which a reflow inside the anchor never moves and a scroll does, so the panel holds still
 *  through the one and follows the other.
 *
 *  Drill Sentences lane CC1, item 1 (blind testers, phone and desktop): an anchor grown down into a downward
 *  panel used to push it, "only as far as needed". The first − of a count wheel wrote a filler that wrapped
 *  the sentence onto a new line, the push moved the wheel 8 to 20pt, and the next − landed beside it. Like an
 *  iOS popover, a held panel never moves for its anchor's own reflow: a sentence that grows under it is
 *  covered, and only a scroll (the anchor's top moving) moves it. */
function holdPopover(input: PopoverPlacementInput, hold: PopoverHold): PopoverPlacement {
  const { Anchor: a, Region: r, W, H } = input;
  const aTop = a.Y;
  const aBottom = a.Y + a.Height;
  const aCenterX = a.X + a.Width / 2;
  const regionBottom = r.Y + r.Height;
  const x = Clamp(hold.X, r.X, r.X + r.Width - W);
  const down = hold.Down;
  let y: number;
  let room: number;
  if (down) {
    y = Math.max(aTop + hold.TopFromAnchor, r.Y);
    room = Math.max(MIN_HEIGHT, regionBottom - y);
  } else {
    const floor = aTop - ARROW_HEIGHT;
    y = Math.min(Math.max(aTop + hold.TopFromAnchor, r.Y), floor - MIN_HEIGHT);
    room = floor - y;
  }
  const arrowX = Clamp(aCenterX, x + ARROW_MARGIN, x + W - ARROW_MARGIN);
  const anchorShown = down
    ? (aBottom >= r.Y - 2 && aBottom <= regionBottom)
    : (aTop <= regionBottom + 2 && aTop >= r.Y);
  // The arrow shows only while the panel still stands one arrow off the anchor: not over a sentence grown
  // under it, nor short of one that shrank away from it.
  const reachesArrow = down ? Math.abs(y - (aBottom + ARROW_HEIGHT)) <= 0.5 : H >= room - 0.5;
  return {
    X: x,
    Y: y,
    MaxHeight: room,
    Down: down,
    ArrowX: arrowX,
    ArrowVisible: anchorShown && reachesArrow,
    OriginX: W > 0 ? (arrowX - x) / W : 0.5,
    OriginY: down ? 0 : 1,
  };
}
