/**
 * Pure logic for the Jwift NumberTicker primitive. Lives apart from the
 * Angular component so the per-cell rotation math is unit-testable
 * without spinning up a Jaui canvas or a TestBed.
 *
 * Three-slot model:
 *
 *   slots[s] = the character that slot s currently holds
 *   positions[s] = which row of the 3-row band slot s sits in:
 *                  -1 = above viewport
 *                   0 = visible (in viewport)
 *                  +1 = below viewport
 *   opacities[s] = 1 when slot is the visible one, 0 otherwise
 *   currentSlot  = index of the slot at position 0 (the visible slot)
 *
 * On a digit change we rotate roles by ONE STEP in the direction matching
 * the numeric change:
 *   - incrementing → slide UP   → the slot currently at +1 becomes visible
 *   - decrementing → slide DOWN → the slot currently at -1 becomes visible
 *
 * The slot that was just-visible slides out in the direction of motion.
 * The third (off-screen) slot recycles to the opposite far side so it's
 * ready for the next tick — its opacity stays 0 throughout, so the
 * spring travelling through the viewport mid-jump is invisible.
 *
 * Non-numeric chars (e.g. the colon in "0:09") don't compute a direction;
 * unchanged cells return by reference (so Angular's @for tracking skips
 * re-render and the cell's springs stay settled).
 */

export interface Cell {
  slots: [string, string, string];
  /** Each slot's vertical row in cell-heights. -1 above, 0 visible, +1 below. */
  positions: [number, number, number];
  opacities: [number, number, number];
  currentSlot: 0 | 1 | 2;
  /** Last visible char — compared against incoming to determine direction. */
  lastChar: string;
}

const _initCell = (ch: string): Cell => ({
  slots: [ch, '', ''],
  positions: [0, -1, 1],
  opacities: [1, 0, 0],
  currentSlot: 0,
  lastChar: ch,
});

/**
 * Diff a previous cell array against an incoming string. Returns a new
 * array where:
 *   - each character produces one cell
 *   - cells whose visible character matches the previous return by reference
 *   - cells whose character changed rotate one slot in the direction of
 *     numeric change (inc → slide UP, dec → slide DOWN). The "next"
 *     slot inherits the new char; the previous-visible slot slides out;
 *     the third slot recycles to the opposite far side at opacity 0.
 *   - cells past the previous length start fresh with the new char visible
 */
export const DiffCells = (prev: readonly Cell[], value: string): Cell[] => {
  const next: Cell[] = [];
  for (let i = 0; i < value.length; i++) {
    const ch = value.charAt(i);
    const existing = prev[i];
    if (!existing) {
      next.push(_initCell(ch));
      continue;
    }
    if (existing.lastChar === ch) {
      next.push(existing);
      continue;
    }
    const oldNum = parseInt(existing.lastChar, 10);
    const newNum = parseInt(ch, 10);
    const direction: -1 | 0 | 1 =
      Number.isNaN(oldNum) || Number.isNaN(newNum) ? 0
        : newNum > oldNum ? 1
          : newNum < oldNum ? -1
            : 0;
    if (direction === 0) {
      // Non-numeric or same value — replace the visible slot's text in place,
      // no slide. Snap rather than animate.
      const newSlots = [...existing.slots] as [string, string, string];
      newSlots[existing.currentSlot] = ch;
      next.push({ ...existing, slots: newSlots, lastChar: ch });
      continue;
    }
    // Find the slot currently at position == direction (i.e. +1 for inc,
    // -1 for dec). That slot becomes the new visible one.
    let nextSlot = -1;
    for (let s = 0; s < 3; s++) {
      if (existing.positions[s] === direction) { nextSlot = s; break; }
    }
    if (nextSlot < 0) {
      // Degenerate — fall back to in-place replace.
      const newSlots = [...existing.slots] as [string, string, string];
      newSlots[existing.currentSlot] = ch;
      next.push({ ...existing, slots: newSlots, lastChar: ch });
      continue;
    }
    // The third slot (neither current nor next) recycles to the far side.
    let recycleSlot = -1;
    for (let s = 0; s < 3; s++) {
      if (s !== existing.currentSlot && s !== nextSlot) { recycleSlot = s; break; }
    }
    const newSlots: [string, string, string] = [...existing.slots] as [string, string, string];
    newSlots[nextSlot] = ch;
    const newPositions: [number, number, number] = [0, 0, 0];
    newPositions[existing.currentSlot] = -direction as -1 | 1; // slides out opposite to incoming
    newPositions[nextSlot] = 0;
    newPositions[recycleSlot] = direction;                      // jumps to the far side (invisible)
    const newOpacities: [number, number, number] = [0, 0, 0];
    newOpacities[nextSlot] = 1;
    next.push({
      slots: newSlots,
      positions: newPositions,
      opacities: newOpacities,
      currentSlot: nextSlot as 0 | 1 | 2,
      lastChar: ch,
    });
  }
  return next;
};

/**
 * Vertical offset (in pt) for one slot — `position × cellHeight`. Negative
 * lifts above viewport, positive drops below. Returned as a Jaui
 * `VisualTranslate` two-token string.
 */
export const SlotTranslate = (cell: Cell, slotIdx: 0 | 1 | 2, cellHeightPt: number): string => {
  const pos = cell.positions[slotIdx];
  if (pos === 0) return '0 0';
  return `0 ${pos * cellHeightPt}pt`;
};
