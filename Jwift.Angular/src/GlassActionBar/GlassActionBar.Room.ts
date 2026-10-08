/**
 * THE ROOM THE ACTION BAR'S PILLS MAY TAKE, pure so the rule is spec'd rather than trusted
 * (`GlassActionBar.Room.spec.ts`). The toolbar's inner width, less the leading cluster, the gap before the
 * bar, and every other child the trailing cluster holds beside the bar (a page's own compact undo group on a
 * phone, a presence pill), each with the cluster's own gap.
 *
 * Drill Sentences lane AA1, item 6 (a blind phone tester: the show's title truncated while there was room):
 * the trailing cluster's other children were never counted, so the bar unfolded a group into width that was
 * not there. The row overflowed, the leading cluster gave way (its title truncates), and measured squeezed it
 * left the bar exactly the room the bar had taken: the fold that would have given the title back never came.
 */
export interface BarRoomInput {
  /** The toolbar's own width less its padding. */
  readonly InnerWidth: number;
  /** The leading cluster as measured now. */
  readonly LeadingWidth: number;
  /** The gap between the leading cluster and the bar. */
  readonly PillGap: number;
  /** Every other child of the trailing cluster, as measured now (zero for one not laid out yet). */
  readonly SiblingWidths: readonly number[];
  /** The trailing cluster's own gap between its children. */
  readonly TrailingGap: number;
}

export function BarRoom(o: BarRoomInput): number {
  let siblings = 0;
  for (const w of o.SiblingWidths) if (w > 0) siblings += w + o.TrailingGap;
  return Math.max(0, o.InnerWidth - o.LeadingWidth - o.PillGap - siblings);
}

// ── A cell's name beside its glyph (Drill Sentences lane DD2, item 5) ────────────────────────────────────
// Blind desktop testers met four bare glyphs at the toolbar's trailing end. A cell marked `Titled` wears its
// name beside its glyph while the bar has room (`GlassActionBar.Titled`), as a Mac toolbar's "Icon and Text"
// does; the names are the first thing the bar gives up as it narrows, before any group folds. The solver
// lays the bar out from these widths, never from a measurement, so the cell is sized to the same number
// (its own `Width`) and the two can never disagree.

/** A bare cell: the house 40pt circle (`Jwift_GlassDropdownCell`). */
export const CELL_PT = 40;
/** The name's size (`Jwift_GlassActionTitle`). */
export const TITLE_FONT_PT = 13;
/** A titled cell's own insets and gaps: lead to the glyph, the glyph, glyph to name, name to the trailing
 *  edge, and a disclosure chevron's room when it has one (`Jwift_GlassDropdownCell_Titled`). */
const TITLED_LEAD_PT = 12;
const TITLED_GLYPH_PT = 18;
const TITLED_GAP_PT = 6;
const TITLED_TRAIL_PT = 14;
const TITLED_CHEVRON_PT = 4 + 10;

/** About how wide `text` runs at `fontPt`, rounded up: a little over half an em for Latin at Inter's
 *  semibold, a whole em for CJK. Generous by design, since the cell is sized to it. */
export function TitleWidth(text: string, fontPt = TITLE_FONT_PT): number {
  let em = 0;
  for (const ch of text) em += (ch.codePointAt(0) ?? 0) >= 0x2e80 ? 1 : 0.64;
  return Math.ceil(em * fontPt);
}

export interface TitledCell {
  readonly Label?: string;
  readonly Titled?: boolean;
  readonly Disclosure?: boolean;
}

/** Whether `cell` shows its name, the bar's names being on (`titles`). */
export function ShowsTitle(cell: TitledCell, titles: boolean): boolean {
  return titles && !!cell.Titled && !!cell.Label?.trim();
}

/** A cell's width in pt: the bare circle, or, while its name shows, the glyph and the name with their insets. */
export function CellWidth(cell: TitledCell, titles: boolean): number {
  if (!ShowsTitle(cell, titles)) return CELL_PT;
  return TITLED_LEAD_PT + TITLED_GLYPH_PT + TITLED_GAP_PT + TitleWidth(cell.Label!.trim()) + TITLED_TRAIL_PT
    + (cell.Disclosure ? TITLED_CHEVRON_PT : 0);
}

/** A pill's width in pt: its cells, the gaps between them and its own padding on both ends. */
export function PillWidth(cells: readonly TitledCell[], titles: boolean, gap: number, pad: number): number {
  if (cells.length === 0) return 0;
  let sum = 0;
  for (const cell of cells) sum += CellWidth(cell, titles);
  return 2 * pad + sum + (cells.length - 1) * gap;
}

// ── A tip clear of the page's own chrome (Drill Sentences lane RR1, item 3) ──────────────────────────────────
// A round 22 blind desktop tester rested on Undo, and "Undo the last edit" stood over the drill page's selection bar,
// the one thing under the toolbar the tip must never hide.

/** A box on screen, px. */
export interface TipBox {
  readonly Left: number;
  readonly Top: number;
  readonly Right: number;
  readonly Bottom: number;
}

/** How much of its cell a tip moved sideways still stands over, at the least, px at one point a pt: so it still reads as
 *  that cell's. */
export const TIP_CELL_OVERLAP_PT = 12;
/** The air a tip moved clear of a box keeps from it, pt. */
export const TIP_AVOID_GAP_PT = 6;

/**
 * How far to move a tip sideways, px, so it clears `avoid` (Drill Sentences lane RR1, item 3): 0 when it already does (or
 * there is nothing to avoid), the shorter of the moves that put it just beside the box, left or right, else null when no
 * spot along its band is clear. A move keeps the tip inside `bounds` and still over `cell` by `overlap` at the least, so
 * it points at the cell it names; a tip with no such spot is not shown.
 */
export function TipShift(
  tip: TipBox, cell: { readonly Left: number; readonly Right: number }, avoid: TipBox | null,
  bounds: { readonly Left: number; readonly Right: number }, gap: number, overlap: number,
): number | null {
  const covers = (dx: number): boolean => !!avoid && tip.Left + dx < avoid.Right && tip.Right + dx > avoid.Left
    && tip.Top < avoid.Bottom && tip.Bottom > avoid.Top;
  if (!covers(0)) return 0;
  const fits = (dx: number): boolean => tip.Left + dx >= bounds.Left && tip.Right + dx <= bounds.Right
    && Math.min(tip.Right + dx, cell.Right) - Math.max(tip.Left + dx, cell.Left) >= Math.min(overlap, cell.Right - cell.Left);
  const moves = [avoid!.Right + gap - tip.Left, avoid!.Left - gap - tip.Right].filter((dx) => fits(dx) && !covers(dx));
  if (!moves.length) return null;
  return moves.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a));
}
