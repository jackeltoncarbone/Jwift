import { describe, expect, it } from 'vitest';
import { PopoverMenuHasLeadingMark } from './PopoverMenu.Check';

// Drill Sentences lane AD2's finding, against the "+" add-step menu's own rows (Menus.ts's `familyMenu`):
// Face, March, Flank, Slant, Squad, Hold, none of them checked, none of them iconed.

describe('PopoverMenuHasLeadingMark: whether some row on the page actually wears a mark', () => {
  it('no row checked and no row iconed — the add-step menu\'s own shape — has no mark', () => {
    expect(PopoverMenuHasLeadingMark([
      { Kind: 'Item', Key: 'face' }, { Kind: 'Item', Key: 'march' }, { Kind: 'Item', Key: 'flank' },
    ])).toBe(false);
  });

  it('one row checked is enough for the whole page, the phrase "…" menu\'s "Show Thumbnail" row', () => {
    expect(PopoverMenuHasLeadingMark([
      { Kind: 'Item', Key: 'measures' }, { Kind: 'Item', Key: 'thumbnail', Checked: true },
    ])).toBe(true);
  });

  it('one row iconed is the same mark, the SAME column a checkmark stands in', () => {
    expect(PopoverMenuHasLeadingMark([{ Kind: 'Item', Key: 'rotate', Icon: 'rotate.right' }])).toBe(true);
  });

  it('a Header or Separator row carries no mark of its own and is skipped', () => {
    expect(PopoverMenuHasLeadingMark([{ Kind: 'Header', Label: 'Face' }, { Kind: 'Separator' }])).toBe(false);
  });

  it('a Checked that reads false (an explicit off, not merely unset) still carries no mark', () => {
    expect(PopoverMenuHasLeadingMark([{ Kind: 'Item', Key: 'off', Checked: false }])).toBe(false);
  });
});
