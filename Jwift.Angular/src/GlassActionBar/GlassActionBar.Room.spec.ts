import { describe, expect, it } from 'vitest';
import { BarRoom } from './GlassActionBar.Room';

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
