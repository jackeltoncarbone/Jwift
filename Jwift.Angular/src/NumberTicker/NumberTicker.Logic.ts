/**
 * Pure logic for the Jwift NumberTicker primitive. Lives apart from the
 * Angular component so the per-cell diff and the slide-distance math are
 * testable without spinning up a Jaui canvas or a TestBed.
 *
 * The shape of one cell:
 *
 *   Cell {
 *     parity: 0 | 1     // which slot currently holds the visible character
 *     slots: [s0, s1]   // two-glyph buffer; the other slot lingers offscreen
 *   }
 *
 * The visible character is always `slots[parity]`. The opposite slot
 * carries the previous character so the next digit-change can write
 * into it without disturbing what's onscreen mid-transition.
 */

export interface Cell {
  parity: 0 | 1;
  slots: [string, string];
}

/**
 * Diff a previous cell array against an incoming string. Returns a new
 * array of cells where:
 *   - each character in `value` produces one cell
 *   - cells whose visible character matches the previous run are returned
 *     by reference (so Angular's @for tracking skips re-render and the
 *     cell's VisualTranslate stays settled)
 *   - cells whose character changed flip parity and write the incoming
 *     character into the freed (formerly hidden) slot — the JSS
 *     @Transition VisualTranslate spring then animates the stack to
 *     expose it
 *   - cells appended past the previous length start at parity 0 with the
 *     character in slot 0 (no opening slide)
 *
 * No mutation of the input. Pure function — same input, same output.
 */
export const DiffCells = (prev: readonly Cell[], value: string): Cell[] => {
  const next: Cell[] = [];
  for (let i = 0; i < value.length; i++) {
    const ch = value.charAt(i);
    const existing = prev[i];
    if (!existing) {
      next.push({ parity: 0, slots: [ch, ''] });
      continue;
    }
    const currentChar = existing.slots[existing.parity];
    if (currentChar === ch) {
      next.push(existing);
      continue;
    }
    const newParity = (1 - existing.parity) as 0 | 1;
    const newSlots: [string, string] = [existing.slots[0], existing.slots[1]];
    newSlots[newParity] = ch;
    next.push({ parity: newParity, slots: newSlots });
  }
  return next;
};

/**
 * Vertical offset (in pt) the cell's stack must hold to expose the
 * current slot. At parity 0 the stack sits at the cell's top so slot 0
 * is visible (offset 0). At parity 1 the stack lifts by one cell height
 * so slot 1 is visible (offset −cellHeightPt).
 *
 * The string return shape matches Jaui's `VisualTranslate` two-token
 * format ("X Y", both Length-typed). Negative Y lifts the stack up.
 */
export const CellTranslatePt = (cell: Cell, cellHeightPt: number): string =>
  cell.parity === 0 ? '0 0' : `0 -${cellHeightPt}pt`;
