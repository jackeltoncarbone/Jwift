import { describe, it, expect } from 'vitest';
import { type Cell, DiffCells, CellTranslatePt } from './NumberTicker.Logic';

// ─── Helpers ───

/** Build a fresh cell at parity 0 with `ch` in slot 0, empty slot 1.
 *  This is the shape DiffCells produces for newly-appended characters. */
const fresh = (ch: string): Cell => ({ parity: 0, slots: [ch, ''] });

/** Pull the visible character out of a cell — `slots[parity]` by definition. */
const visible = (cell: Cell): string => cell.slots[cell.parity];

// ─── DiffCells: initial render ───

describe('DiffCells — initial render', () => {
  it('empty value produces zero cells', () => {
    expect(DiffCells([], '')).toEqual([]);
  });

  it('one-char value produces one cell at parity 0, char in slot 0', () => {
    const result = DiffCells([], '7');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ parity: 0, slots: ['7', ''] });
  });

  it('multi-char value produces one cell per character, all parity 0', () => {
    const result = DiffCells([], '0:00');
    expect(result).toHaveLength(4);
    expect(result.map(c => c.parity)).toEqual([0, 0, 0, 0]);
    expect(result.map(visible)).toEqual(['0', ':', '0', '0']);
  });

  it('every cell has the visible char in slot 0 and empty slot 1', () => {
    const result = DiffCells([], '12:34');
    for (const cell of result) {
      expect(cell.parity).toBe(0);
      expect(cell.slots[0]).not.toBe('');
      expect(cell.slots[1]).toBe('');
    }
  });
});

// ─── DiffCells: per-cell change semantics ───

describe('DiffCells — single character changes', () => {
  it('a changed character flips that cell\'s parity to 1', () => {
    const prev = DiffCells([], '0');
    const next = DiffCells(prev, '1');
    expect(next[0].parity).toBe(1);
  });

  it('a changed character writes the new char into the opposite slot', () => {
    const prev = DiffCells([], '0');     // { parity: 0, slots: ['0', ''] }
    const next = DiffCells(prev, '1');   // parity flips → 1, '1' lands in slot 1
    expect(next[0].slots[1]).toBe('1');
  });

  it('the previous character lingers in the now-hidden slot', () => {
    const prev = DiffCells([], '0');
    const next = DiffCells(prev, '1');
    // After the change, slot 0 (now hidden) still holds '0' — kept around so
    // the next change can flip back without disturbing what's onscreen.
    expect(next[0].slots[0]).toBe('0');
  });

  it('the visible character after a change is the incoming one', () => {
    const prev = DiffCells([], '0');
    const next = DiffCells(prev, '1');
    expect(visible(next[0])).toBe('1');
  });
});

// ─── DiffCells: stability ───

describe('DiffCells — stability of unchanged cells', () => {
  it('unchanged cells return the SAME reference (no churn)', () => {
    const prev = DiffCells([], '12:34');
    const next = DiffCells(prev, '12:35');  // only the last char changed
    // Reference equality on indexes 0..3 — Angular's @for tracking can skip
    // these; only index 4 should re-render and animate.
    expect(next[0]).toBe(prev[0]);
    expect(next[1]).toBe(prev[1]);
    expect(next[2]).toBe(prev[2]);
    expect(next[3]).toBe(prev[3]);
    expect(next[4]).not.toBe(prev[4]);
  });

  it('a no-op value change returns identical cells', () => {
    const prev = DiffCells([], '0:00');
    const next = DiffCells(prev, '0:00');
    expect(next).toEqual(prev);
    // And same references — every cell.
    for (let i = 0; i < prev.length; i++) {
      expect(next[i]).toBe(prev[i]);
    }
  });
});

// ─── DiffCells: alternating direction across successive changes ───

describe('DiffCells — alternating parity across successive changes', () => {
  it('three consecutive changes on the same cell oscillate parity 0 → 1 → 0 → 1', () => {
    let cells = DiffCells([], '0');
    expect(cells[0].parity).toBe(0);
    cells = DiffCells(cells, '1');
    expect(cells[0].parity).toBe(1);
    cells = DiffCells(cells, '2');
    expect(cells[0].parity).toBe(0);
    cells = DiffCells(cells, '3');
    expect(cells[0].parity).toBe(1);
  });

  it('the visible character at each step matches the input value', () => {
    let cells = DiffCells([], '0');
    expect(visible(cells[0])).toBe('0');
    cells = DiffCells(cells, '1');
    expect(visible(cells[0])).toBe('1');
    cells = DiffCells(cells, '2');
    expect(visible(cells[0])).toBe('2');
    cells = DiffCells(cells, '3');
    expect(visible(cells[0])).toBe('3');
  });

  it('a digit that bounces back (1 → 2 → 1) flips parity each step, never stales', () => {
    let cells = DiffCells([], '1');
    cells = DiffCells(cells, '2');
    expect(visible(cells[0])).toBe('2');
    expect(cells[0].parity).toBe(1);
    cells = DiffCells(cells, '1');
    expect(visible(cells[0])).toBe('1');
    expect(cells[0].parity).toBe(0);
    // The slot that just became hidden must hold the previous char (2),
    // not the original (1). This is the regression case that catches a
    // mis-write into the wrong slot.
    expect(cells[0].slots[1]).toBe('2');
  });
});

// ─── DiffCells: length changes ───

describe('DiffCells — value width grows or shrinks', () => {
  it('appended characters appear as fresh cells (parity 0, empty slot 1)', () => {
    const prev = DiffCells([], '9:59');
    const next = DiffCells(prev, '10:00');
    expect(next).toHaveLength(5);
    // Existing four cells are matched against the new value position-by-position
    // and may re-render if their character changed.
    // The new fifth cell is fresh.
    expect(next[4]).toEqual(fresh('0'));
  });

  it('every cell\'s visible char matches the new value, position by position', () => {
    const prev = DiffCells([], '9:59');
    const next = DiffCells(prev, '10:00');
    expect(next.map(visible).join('')).toBe('10:00');
  });

  it('shrinking value drops trailing cells', () => {
    const prev = DiffCells([], '10:00');
    const next = DiffCells(prev, '9:59');
    expect(next).toHaveLength(4);
    expect(next.map(visible).join('')).toBe('9:59');
  });
});

// ─── CellTranslatePt: slide distance math ───

describe('CellTranslatePt — slide distance math', () => {
  it('parity 0 keeps the stack at translate 0 (slot 0 visible)', () => {
    expect(CellTranslatePt({ parity: 0, slots: ['7', ''] }, 12)).toBe('0 0');
  });

  it('parity 1 lifts the stack by exactly one cell height (slot 1 visible)', () => {
    expect(CellTranslatePt({ parity: 1, slots: ['7', '8'] }, 12)).toBe('0 -12pt');
  });

  it('cell height of 16.8 (e.g. fontSize 14 × lineHeight 1.2) emits the same value', () => {
    expect(CellTranslatePt({ parity: 1, slots: ['a', 'b'] }, 16.8)).toBe('0 -16.8pt');
  });

  it('a cell at parity 0 is independent of cell height (always 0)', () => {
    expect(CellTranslatePt({ parity: 0, slots: ['x', ''] }, 12)).toBe('0 0');
    expect(CellTranslatePt({ parity: 0, slots: ['x', ''] }, 24)).toBe('0 0');
    expect(CellTranslatePt({ parity: 0, slots: ['x', ''] }, 100)).toBe('0 0');
  });
});

// ─── End-to-end scenario: scrubbing a timecode ───

describe('NumberTicker scenario — drill scrubber timecode 0:00 → 1:05', () => {
  it('walks through six successive changes without stranding any visible char', () => {
    const sequence = ['0:00', '0:01', '0:02', '0:03', '1:04', '1:05'];
    let cells: Cell[] = [];
    for (const value of sequence) {
      cells = DiffCells(cells, value);
      expect(cells.map(visible).join('')).toBe(value);
    }
  });

  it('only the cells that actually changed flip parity at each step', () => {
    // 0:09 → 0:10 changes the last two characters (':' is unchanged in
    // position 1; '0' stays at position 0; '0' → '1' at position 2; '9' → '0'
    // at position 3). Cells 0 and 1 must keep their references and parity.
    const a = DiffCells([], '0:09');
    const b = DiffCells(a, '0:10');
    expect(b[0]).toBe(a[0]);
    expect(b[1]).toBe(a[1]);
    expect(b[2]).not.toBe(a[2]);
    expect(b[3]).not.toBe(a[3]);
    expect(b[2].parity).toBe(1);
    expect(b[3].parity).toBe(1);
  });
});
