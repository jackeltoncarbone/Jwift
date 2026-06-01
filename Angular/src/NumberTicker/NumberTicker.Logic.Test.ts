import { describe, it, expect } from 'vitest';
import { DiffCells, SlotTranslate } from './NumberTicker.Logic';

// ─── DiffCells: initial render ────────────────────────────────────────

describe('DiffCells — initial render', () => {
  it('empty value produces zero cells', () => {
    expect(DiffCells([], '')).toEqual([]);
  });

  it('one-char value produces one cell with the char visible at slot 0', () => {
    const result = DiffCells([], '7');
    expect(result).toHaveLength(1);
    expect(result[0].slots[0]).toBe('7');
    expect(result[0].currentSlot).toBe(0);
    expect(result[0].positions).toEqual([0, -1, 1]);
    expect(result[0].opacities).toEqual([1, 0, 0]);
  });

  it('multi-char value produces one cell per character', () => {
    const result = DiffCells([], '0:00');
    expect(result.map(c => c.slots[c.currentSlot])).toEqual(['0', ':', '0', '0']);
  });
});

// ─── DiffCells: numeric increment ─────────────────────────────────────

describe('DiffCells — incrementing slides UP', () => {
  it('the slot at position +1 (below) becomes the new visible slot', () => {
    const prev = DiffCells([], '0');
    const next = DiffCells(prev, '1');
    const cell = next[0];
    const incomingSlot = cell.currentSlot;
    expect(cell.slots[incomingSlot]).toBe('1');
    const outgoingSlot = prev[0].currentSlot;
    expect(cell.positions[outgoingSlot]).toBe(-1);
    expect(cell.opacities[outgoingSlot]).toBe(0);
    expect(cell.positions[incomingSlot]).toBe(0);
    expect(cell.opacities[incomingSlot]).toBe(1);
  });

  it('three consecutive increments keep sliding UP', () => {
    let cells = DiffCells([], '0');
    cells = DiffCells(cells, '1');
    cells = DiffCells(cells, '2');
    cells = DiffCells(cells, '3');
    const cell = cells[0];
    expect(cell.slots[cell.currentSlot]).toBe('3');
    expect(cell.positions[cell.currentSlot]).toBe(0);
    expect(cell.opacities[cell.currentSlot]).toBe(1);
    expect(cell.positions.filter(p => p === -1)).toHaveLength(1);
    expect(cell.positions.filter(p => p === 1)).toHaveLength(1);
  });
});

describe('DiffCells — decrementing slides DOWN', () => {
  it('the slot at position -1 (above) becomes the new visible slot', () => {
    const prev = DiffCells([], '5');
    const next = DiffCells(prev, '4');
    const cell = next[0];
    expect(cell.slots[cell.currentSlot]).toBe('4');
    expect(cell.positions[prev[0].currentSlot]).toBe(1);
  });

  it('three consecutive decrements keep sliding DOWN', () => {
    let cells = DiffCells([], '9');
    cells = DiffCells(cells, '8');
    cells = DiffCells(cells, '7');
    cells = DiffCells(cells, '6');
    const cell = cells[0];
    expect(cell.slots[cell.currentSlot]).toBe('6');
    expect(cell.positions[cell.currentSlot]).toBe(0);
  });
});

describe('DiffCells — unchanged + non-numeric', () => {
  it('unchanged character returns the cell by reference', () => {
    const prev = DiffCells([], '0:00');
    const next = DiffCells(prev, '0:00');
    expect(next[0]).toBe(prev[0]);
    expect(next[1]).toBe(prev[1]);
  });

  it('non-numeric char change snaps in place (no slide)', () => {
    const prev = DiffCells([], 'a');
    const next = DiffCells(prev, 'b');
    expect(next[0].slots[next[0].currentSlot]).toBe('b');
    expect(next[0].positions[next[0].currentSlot]).toBe(0);
  });
});

// ─── SlotTranslate ────────────────────────────────────────────────────

describe('SlotTranslate', () => {
  it('returns "0 0" for the slot at position 0', () => {
    const cells = DiffCells([], '1');
    expect(SlotTranslate(cells[0], cells[0].currentSlot, 20)).toBe('0 0');
  });

  it('returns negative Y for slots above viewport', () => {
    const cells = DiffCells([], '1');
    const aboveSlot = cells[0].positions.findIndex(p => p === -1) as 0 | 1 | 2;
    expect(SlotTranslate(cells[0], aboveSlot, 20)).toBe('0 -20pt');
  });

  it('returns positive Y for slots below viewport', () => {
    const cells = DiffCells([], '1');
    const belowSlot = cells[0].positions.findIndex(p => p === 1) as 0 | 1 | 2;
    expect(SlotTranslate(cells[0], belowSlot, 20)).toBe('0 20pt');
  });
});
