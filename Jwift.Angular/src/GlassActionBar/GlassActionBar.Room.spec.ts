import { describe, expect, it } from 'vitest';
import { BarRoom, CELL_PT, CellWidth, PillWidth, ShowsTitle, TipShift, TitleWidth } from './GlassActionBar.Room';

describe('BarRoom (Drill Sentences lane AA1, item 6: a phone title truncated while there was room)', () => {
  it('counts every other child of the trailing cluster, each with the cluster\'s gap', () => {
    expect(BarRoom({ InnerWidth: 326, LeadingWidth: 220, PillGap: 10, SiblingWidths: [], TrailingGap: 8 })).toBe(96);
    // The phone's own compact undo group (48) beside the bar.
    expect(BarRoom({ InnerWidth: 326, LeadingWidth: 220, PillGap: 10, SiblingWidths: [48], TrailingGap: 8 })).toBe(40);
  });

  it('a child not laid out yet takes nothing, and the room never goes negative', () => {
    expect(BarRoom({ InnerWidth: 326, LeadingWidth: 220, PillGap: 10, SiblingWidths: [0], TrailingGap: 8 })).toBe(96);
    expect(BarRoom({ InnerWidth: 100, LeadingWidth: 220, PillGap: 10, SiblingWidths: [48], TrailingGap: 8 })).toBe(0);
  });

  it('with the leading cluster squeezed by an unfolded group, the room is less than the bar holds, so it folds', () => {
    // A phone row of 338: the undo group (48) and the gap (8) beside a bar that unfolded one 48pt group
    // plus the avatar (48 + 10 + 48 = 106). The leading cluster gave way to 338 - 56 - 106 = 176.
    const bar = 106;
    const room = BarRoom({ InnerWidth: 338 - 12, LeadingWidth: 338 - 56 - bar, PillGap: 10, SiblingWidths: [48], TrailingGap: 8 });
    expect(room).toBeLessThan(bar);
  });
});

/** Drill Sentences lane DD2, item 5 (blind desktop testers met four bare glyphs at the toolbar's end). */
describe('a titled cell wears its name beside its glyph while there is room', () => {
  const cast = { Label: 'Cast', Titled: true };
  const camera = { Label: 'Camera', Titled: true, Disclosure: true };
  const undo = { Label: 'Undo' };

  it('only a cell marked Titled, with a name, and only while the bar\'s names are on', () => {
    expect(ShowsTitle(cast, true)).toBe(true);
    expect(ShowsTitle(cast, false)).toBe(false);
    expect(ShowsTitle(undo, true)).toBe(false);
    expect(ShowsTitle({ Label: ' ', Titled: true }, true)).toBe(false);
  });

  it('a bare cell is the 40pt circle; a titled one grows by its name, and a disclosure chevron\'s room', () => {
    expect(CellWidth(cast, false)).toBe(CELL_PT);
    expect(CellWidth(undo, true)).toBe(CELL_PT);
    expect(CellWidth(cast, true)).toBeGreaterThan(CELL_PT + TitleWidth('Cast') - 1);
    expect(CellWidth({ ...camera, Disclosure: false }, true)).toBeLessThan(CellWidth(camera, true));
    expect(CellWidth({ Label: '9 problems', Titled: true }, true)).toBeGreaterThan(CellWidth(cast, true));
  });

  it('sizes a name to its own words, CJK a whole em a character', () => {
    expect(TitleWidth('Library')).toBeGreaterThan(TitleWidth('Cast'));
    expect(TitleWidth('全員', 10)).toBe(20);
  });

  it('a pill is its cells, the gaps between them and its padding; the names cost the bar room', () => {
    expect(PillWidth([], true, 4, 4)).toBe(0);
    expect(PillWidth([undo, undo], false, 4, 4)).toBe(2 * 4 + 2 * CELL_PT + 4);
    expect(PillWidth([cast, undo], true, 4, 4)).toBe(2 * 4 + CellWidth(cast, true) + CELL_PT + 4);
    expect(PillWidth([cast, camera], true, 4, 4)).toBeGreaterThan(PillWidth([cast, camera], false, 4, 4));
  });
});

/** Drill Sentences lane RR1, item 3 (a round 22 blind desktop tester's "Undo the last edit" stood over the selection bar). */
describe('TipShift: a tip moves sideways along its band, clear of the page\'s chrome', () => {
  const screen = { Left: 0, Right: 1440 };
  // Undo's tip, 130 wide, under its 40pt cell at 760-800, in the band just under the toolbar.
  const tip = { Left: 715, Top: 82, Right: 845, Bottom: 108 };
  const cell = { Left: 760, Right: 800 };

  it('stays put with nothing to avoid, or a box it does not cover', () => {
    expect(TipShift(tip, cell, null, screen, 6, 12)).toBe(0);
    expect(TipShift(tip, cell, { Left: 200, Top: 86, Right: 600, Bottom: 126 }, screen, 6, 12)).toBe(0);
    expect(TipShift(tip, cell, { Left: 600, Top: 140, Right: 900, Bottom: 180 }, screen, 6, 12)).toBe(0);
  });

  it('moves just beside the box, the shorter way, still over its cell', () => {
    // A selection bar ending at 740, under the tip's left end: the tip moves right, 6 clear of it.
    expect(TipShift(tip, cell, { Left: 560, Top: 86, Right: 740, Bottom: 126 }, screen, 6, 12)).toBe(31);
    // One starting at 830, under its right end: it moves left.
    expect(TipShift(tip, cell, { Left: 830, Top: 86, Right: 1200, Bottom: 126 }, screen, 6, 12)).toBe(-21);
  });

  it('is not shown where no clear spot still points at its cell, or the clear spot is off screen', () => {
    // A box under the whole cell: clear of it, the tip would no longer stand over the cell.
    expect(TipShift(tip, cell, { Left: 640, Top: 86, Right: 1245, Bottom: 126 }, screen, 6, 12)).toBeNull();
    // Beside the box to the right is past the screen's edge, and to the left leaves its cell.
    expect(TipShift(tip, cell, { Left: 560, Top: 86, Right: 790, Bottom: 126 }, { Left: 0, Right: 900 }, 6, 12)).toBeNull();
  });
});
