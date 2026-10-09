import { describe, expect, it } from 'vitest';
import { BarRoom, CELL_PT, CellWidth, PillWidth, ShowsTitle, TipPlace, TitleWidth } from './GlassActionBar.Room';

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

  it('a bare cell is the 44pt circle; a titled one grows by its name, and a disclosure chevron\'s room', () => {
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

/** Drill Sentences lane SH2 (the owner: "A tip centers under the control it names"), over lane RR1, item 3. */
describe('TipPlace: a tip stays centred under its control, and steps down past the page chrome', () => {
  const screen = { Left: 0, Right: 1440 };
  // Undo's tip, 130 wide, centred under its cell at 780, in the band just under the toolbar.
  const tip = { Left: 715, Top: 82, Right: 845, Bottom: 108 };

  it('stays put with nothing to avoid, or a box it does not cover', () => {
    expect(TipPlace(tip, null, screen, 6)).toEqual({ DX: 0, DY: 0 });
    expect(TipPlace(tip, { Left: 200, Top: 86, Right: 600, Bottom: 126 }, screen, 6)).toEqual({ DX: 0, DY: 0 });
    expect(TipPlace(tip, { Left: 600, Top: 140, Right: 900, Bottom: 180 }, screen, 6)).toEqual({ DX: 0, DY: 0 });
  });

  it('never moves sideways off its control for a box under it: it steps down just below the box', () => {
    expect(TipPlace(tip, { Left: 560, Top: 86, Right: 740, Bottom: 126 }, screen, 6)).toEqual({ DX: 0, DY: 50 });
    expect(TipPlace(tip, { Left: 640, Top: 86, Right: 1245, Bottom: 126 }, screen, 6)).toEqual({ DX: 0, DY: 50 });
  });

  it('moves across only to stay on screen, the least that does', () => {
    expect(TipPlace({ Left: -20, Top: 82, Right: 110, Bottom: 108 }, null, screen, 6)).toEqual({ DX: 26, DY: 0 });
    expect(TipPlace({ Left: 1380, Top: 82, Right: 1510, Bottom: 108 }, null, screen, 6)).toEqual({ DX: -76, DY: 0 });
  });
});
