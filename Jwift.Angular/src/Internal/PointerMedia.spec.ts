import { describe, expect, it } from 'vitest';
import { ShowsLeadingMenuColumn } from './PointerMedia';

// Drill Sentences lane AD2's finding: the "+" add-step menu (Face, March, Flank, Slant, Squad, Hold, none
// of them checked) reserved its leading checkmark column with nothing in it. Apple's own split: a touch
// reader gets the column only once the section earns it; a pointer reader keeps macOS's column-always
// convention regardless.

describe('ShowsLeadingMenuColumn: the split between a touch reader and a pointer one', () => {
  it('a coarse pointer (a finger) with nothing checked gets no column', () => {
    expect(ShowsLeadingMenuColumn(false, true)).toBe(false);
  });

  it('a coarse pointer with some row checked keeps the column, so the rows line up', () => {
    expect(ShowsLeadingMenuColumn(true, true)).toBe(true);
  });

  it('a fine pointer (mouse, trackpad) keeps the column whether or not anything is checked', () => {
    expect(ShowsLeadingMenuColumn(false, false)).toBe(true);
    expect(ShowsLeadingMenuColumn(true, false)).toBe(true);
  });
});
