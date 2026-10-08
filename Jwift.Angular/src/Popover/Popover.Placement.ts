/**
 * Popover's placement math — ported from the concept's `placePop` (DrillSentences.Concept.html:1208).
 * Pure: a rect in, a box out, no DOM. Prefers below the anchor when the whole panel fits there, else above
 * when it fits there, else whichever side has more room; keeps its side across re-places while the panel
 * still fits there; never overlaps the anchor. Given `Beside`, it opens to the right of the column its
 * anchor sits in first, whenever the whole panel fits there.
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
  /**
   * The right edge of the column the anchor sits in (a list panel down the screen's left side), or absent.
   * Drill Sentences lane EE2, item 4 (a blind desktop tester tapped "3a ⇔ 3b" and its popover opened over the
   * next line of the list): a panel placed above or below a word in a column of sentences covers the
   * sentences around it. Given this, the panel opens beside the column instead, level with the word, whenever
   * the whole panel fits to its right; else it places above or below as ever.
   */
  readonly Beside?: number | null;
  /**
   * What a panel opened beside its column keeps clear of where it can, or absent. Drill Sentences lane GG2,
   * item 4 (a round 11 blind desktop tester: the count wheel opened over 3a, the squad its sentence names):
   * the panel slides up or down its column, still level with the word, to the place that covers least of
   * these, the side away from them first.
   */
  readonly Avoid?: readonly PopoverRect[];
  /**
   * The panel is its anchor's own glass, grown (`Popover.Source`, Drill Sentences lane WW1, item 3): it covers the
   * anchor rather than standing off it, its edges on the anchor's edges on the sides it grows from (`placeOver`).
   */
  readonly Over?: boolean;
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
  /** Opened beside the anchor's column (`PopoverPlacementInput.Beside`): held there. */
  readonly Side?: boolean;
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
  /** Opened beside the anchor's column (`PopoverPlacementInput.Beside`), level with the anchor. */
  readonly Side?: boolean;
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

/** How far the panel stands off the anchor on the side it opens. A menu grows out of its anchor's own glass
 *  (`Morph/GlassMorph.ts`) and needs no arrow to say where it came from, so this is a gap, not an arrow's height. */
const ANCHOR_GAP = 12;
/** Popover.jss's own `Padding: 10pt` around the content, on every side (the sheet outlet a popover is
 *  teleported to draws at PointScale 1, so a point is a pixel there). The content's own room is the
 *  panel's capped height less this twice over: a scroll body capped at the PANEL's height used to run
 *  20pt past the panel's bottom, past the window's edge on a menu placed low. */
export const POPOVER_PANEL_PADDING = 10;
/** The shortest a popover is ever capped to; below this it would stop reading as a panel. */
const MIN_HEIGHT = 44;
/** How far inside a beside panel's top or bottom edge its anchor's middle is kept: the panel's corner radius, so
 *  the word it opened from stands level with its straight side, never off past a corner. */
const LEVEL_MARGIN = 32;

const Clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

/** How much more room under `anchor` a panel `h` tall needs than `region` leaves there, px, its gap included: 0 when
 *  it fits below (Drill Sentences lane UU3, item 7: a panel opened in a phone's sheet asks its host for that room first,
 *  `Popover.MakeRoom`, rather than open above the word over the sheet's transport). */
export function ShortfallBelow(anchor: PopoverRect, region: PopoverRect, h: number, over = false): number {
  // A panel over its anchor (`Over`) grows down from the anchor's own top.
  const top = over ? anchor.Y : anchor.Y + anchor.Height + ANCHOR_GAP;
  return Math.max(0, h - (region.Y + region.Height - top));
}

/** How long the anchor stands still, fitting, before a panel that asked for room places, ms, and the longest it waits. */
export const ROOM_STILL_MS = 120;
export const ROOM_WAIT_MS = 1600;

/**
 * Whether a panel that asked its host for room (`Popover.MakeRoom`) waits another frame or places now. Drill Sentences lane
 * UU3, item 7, live (402x874, "16 counts" in M5-12 at the sheet's Medium detent: the sheet rose to Large and the word came
 * up to y 505, but the count wheel had opened above it, over the transport). The panel placed once its word stood still,
 * and the word stood still for a moment before the sheet began to rise, still low, so the first placement went above and
 * the held panel kept that side. It waits until the whole panel fits below the word (`Shortfall` 0) and the word has stood
 * still there (`StillFor`), or until the host has had `ROOM_WAIT_MS` (`Elapsed`), when it places wherever it fits.
 */
export function RoomWaitStep(o: { readonly Shortfall: number; readonly StillFor: number; readonly Elapsed: number }): 'Wait' | 'Place' {
  if (o.Elapsed >= ROOM_WAIT_MS) return 'Place';
  return o.Shortfall <= 0.5 && o.StillFor >= ROOM_STILL_MS ? 'Place' : 'Wait';
}

export function PlacePopover(input: PopoverPlacementInput): PopoverPlacement {
  if (input.Over) return placeOver(input);
  if (input.Hold) return input.Hold.Side ? holdBeside(input, input.Hold) : holdPopover(input, input.Hold);
  const beside = input.Beside === null || input.Beside === undefined ? null : placeBeside(input, input.Beside);
  if (beside) return beside;
  const { Anchor: a, Region: r, W, H, PrevDown } = input;
  const aTop = a.Y;
  const aBottom = a.Y + a.Height;
  const aCenterX = a.X + a.Width / 2;
  const regionTop = r.Y;
  const regionBottom = r.Y + r.Height;
  const regionLeft = r.X;
  const regionRight = r.X + r.Width;

  const below = regionBottom - (aBottom + ANCHOR_GAP);
  const above = (aTop - ANCHOR_GAP) - regionTop;

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
    ? Math.max(aBottom + ANCHOR_GAP, regionTop)
    : Math.min(aTop - ANCHOR_GAP - h, regionBottom - h);
  return { X: x, Y: y, MaxHeight: h, Down: down };
}

/**
 * A MENU THAT IS ITS CONTROL'S GLASS COVERS THE CONTROL (`Over`; Drill Sentences lane WW1, item 3). In iOS 26 a menu
 * from a button expands out of the button over the spot it stood on: the panel contains the anchor, its edges on the
 * anchor's edges on the sides it grows from. It grows down from the anchor's top when the whole panel fits below it, up
 * from the anchor's bottom when it fits above, else toward the larger room, capped; right from the anchor's leading
 * edge when it fits there, else left from the trailing edge. It stays in the region, its side kept across re-places and
 * its side and leading edge held while a submenu changes its height (`Hold`), the growing edge alone moving.
 */
function placeOver(input: PopoverPlacementInput): PopoverPlacement {
  const { Anchor: a, Region: r, W, H, PrevDown, Hold: hold } = input;
  const regionBottom = r.Y + r.Height;
  const roomDown = regionBottom - a.Y;
  const roomUp = a.Y + a.Height - r.Y;
  let down: boolean;
  if (hold) down = hold.Down;
  else if (PrevDown === null) down = H <= roomDown || (H > roomUp && roomDown >= roomUp);
  else {
    down = PrevDown;
    const fits = H <= (down ? roomDown : roomUp);
    const otherFits = H <= (down ? roomUp : roomDown);
    if (!fits && (otherFits || (down ? roomUp : roomDown) > (down ? roomDown : roomUp))) down = !down;
  }
  const scrolls = input.Scrolls ?? true;
  const h = scrolls ? Math.max(MIN_HEIGHT, Math.min(H, down ? roomDown : roomUp)) : H;
  const y = Clamp(down ? a.Y : a.Y + a.Height - h, r.Y, regionBottom - h);
  const leading = a.X + W <= r.X + r.Width ? a.X : a.X + a.Width - W;
  const x = Clamp(hold ? hold.X : leading, r.X, r.X + r.Width - W);
  return { X: x, Y: y, MaxHeight: h, Down: down };
}

/** The panel beside the anchor's column (lane EE2, item 4), or null when the whole panel does not fit to the
 *  column's right. Its top stands level with the anchor, pulled up only as far as the region's bottom asks. */
function placeBeside(input: PopoverPlacementInput, column: number): PopoverPlacement | null {
  const { Anchor: a, Region: r, W, H } = input;
  const x = Math.max(r.X, column + ANCHOR_GAP);
  if (x + W > r.X + r.Width) return null;
  const scrolls = input.Scrolls ?? true;
  if (!scrolls && H > r.Height) return null;
  const h = scrolls ? Math.max(MIN_HEIGHT, Math.min(H, r.Height)) : H;
  // Its top as far above the word's middle as the panel's corner, so its first row stands level with the word.
  const y = Clamp(a.Y + a.Height / 2 - LEVEL_MARGIN, r.Y, r.Y + r.Height - h);
  return besideAt(x, clearOf(input, x, y, h), h);
}

/** How much of `avoid` a panel at `x`, `y`, `w` by `h` covers, in px squared. */
function coverOf(avoid: readonly PopoverRect[], x: number, y: number, w: number, h: number): number {
  let area = 0;
  for (const r of avoid) {
    const dx = Math.min(x + w, r.X + r.Width) - Math.max(x, r.X);
    const dy = Math.min(y + h, r.Y + r.Height) - Math.max(y, r.Y);
    if (dx > 0 && dy > 0) area += dx * dy;
  }
  return area;
}

/** The top a beside panel takes to keep clear of `Avoid` (lane GG2, item 4): `y` when that covers none of it,
 *  else, of every top that still keeps the anchor's middle level with the panel's side and the panel in the
 *  region, the one covering least, the nearest to `y` on a tie. */
function clearOf(input: PopoverPlacementInput, x: number, y: number, h: number): number {
  const avoid = input.Avoid ?? [];
  if (!avoid.length || coverOf(avoid, x, y, input.W, h) === 0) return y;
  const { Anchor: a, Region: r } = input;
  const middle = a.Y + a.Height / 2;
  const reach = h > 2 * LEVEL_MARGIN ? LEVEL_MARGIN : h / 2;
  const lo = Math.max(r.Y, middle - h + reach);
  const hi = Math.min(r.Y + r.Height - h, middle - reach);
  if (!(hi > lo)) return y;
  let best = y;
  let bestCover = coverOf(avoid, x, y, input.W, h);
  const steps = Math.ceil((hi - lo) / 4);
  for (let i = 0; i <= steps; i++) {
    const top = lo + ((hi - lo) * i) / steps;
    const cover = coverOf(avoid, x, top, input.W, h);
    if (cover < bestCover || (cover === bestCover && Math.abs(top - y) < Math.abs(best - y))) { best = top; bestCover = cover; }
  }
  return best;
}

/** A beside panel at `x`, `y`, `h` tall. */
function besideAt(x: number, y: number, h: number): PopoverPlacement {
  return { X: x, Y: y, MaxHeight: h, Down: true, Side: true };
}

/** A held beside panel: same leading edge, same top relative to the anchor's top (so it rides a scroll and
 *  holds still through the anchor's own reflow, as `holdPopover` does), its room everything below its top. */
function holdBeside(input: PopoverPlacementInput, hold: PopoverHold): PopoverPlacement {
  const { Anchor: a, Region: r, W, H } = input;
  const x = Clamp(hold.X, r.X, r.X + r.Width - W);
  const y = Clamp(a.Y + hold.TopFromAnchor, r.Y, r.Y + r.Height - MIN_HEIGHT);
  const room = r.Y + r.Height - y;
  const scrolls = input.Scrolls ?? true;
  return besideAt(x, y, scrolls ? Math.max(MIN_HEIGHT, Math.min(H, room)) : H);
}

/** A held frame (`PopoverHold`): same side, same leading edge (clamped back inside the region if the page
 *  got wider), same top relative to the anchor's top. A downward panel's room is everything below its top,
 *  so a taller page grows down into it; an upward panel's room ends one gap above the anchor, so a taller page
 *  scrolls within it, and a shorter one leaves the panel where it stood, the way an iOS menu's submenu stays put.
 *  Never overlaps the anchor either way.
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
  const { Anchor: a, Region: r, W } = input;
  const aTop = a.Y;
  const regionBottom = r.Y + r.Height;
  const x = Clamp(hold.X, r.X, r.X + r.Width - W);
  const down = hold.Down;
  let y: number;
  let room: number;
  if (down) {
    y = Math.max(aTop + hold.TopFromAnchor, r.Y);
    room = Math.max(MIN_HEIGHT, regionBottom - y);
  } else {
    const floor = aTop - ANCHOR_GAP;
    y = Math.min(Math.max(aTop + hold.TopFromAnchor, r.Y), floor - MIN_HEIGHT);
    room = floor - y;
  }
  return { X: x, Y: y, MaxHeight: room, Down: down };
}
