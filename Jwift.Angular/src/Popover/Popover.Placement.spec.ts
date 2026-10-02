import { describe, expect, it } from 'vitest';
import { PointInRect, type PopoverRect } from './Popover.Placement';

// PointInRect is Popover's own outside-dismiss and anchor-toggle decision (LaneM.md): a press on the
// floating panel OR on the anchor that opened it both read as "inside" and must never dismiss, so the
// anchor's own click handler — not a stray pointerdown — decides whether a second press closes the
// menu. Before this fix the anchor was never checked at all, which read as "press the '…' again: it
// closes then instantly reopens" (the outside-dismiss fired on pointerdown, then the anchor's click
// reopened it on the same gesture).
describe('PointInRect', () => {
  const rect: PopoverRect = { X: 100, Y: 50, Width: 40, Height: 20 };

  it('is true for a point inside the rect', () => {
    expect(PointInRect(110, 55, rect)).toBe(true);
  });

  it('includes the top/left edge', () => {
    expect(PointInRect(rect.X, rect.Y, rect)).toBe(true);
  });

  it('excludes the bottom/right edge — half-open, matching every other hit-test in the kit', () => {
    expect(PointInRect(rect.X + rect.Width, rect.Y, rect)).toBe(false);
    expect(PointInRect(rect.X, rect.Y + rect.Height, rect)).toBe(false);
  });

  it('is false just outside each side', () => {
    expect(PointInRect(rect.X - 1, rect.Y + 5, rect)).toBe(false);
    expect(PointInRect(rect.X + rect.Width + 1, rect.Y + 5, rect)).toBe(false);
    expect(PointInRect(rect.X + 5, rect.Y - 1, rect)).toBe(false);
    expect(PointInRect(rect.X + 5, rect.Y + rect.Height + 1, rect)).toBe(false);
  });

  it('is false for a zero-size rect at any point, including its own origin', () => {
    const zero: PopoverRect = { X: 200, Y: 200, Width: 0, Height: 0 };
    expect(PointInRect(200, 200, zero)).toBe(false);
  });

  // The actual scenario: a row "…" button is the Anchor; a press on it must read as inside so the
  // outside-dismiss never fires, leaving the toggle decision to the button's own click handler.
  it('treats a press on the anchor rect as inside, the same as the panel itself', () => {
    const anchor: PopoverRect = { X: 10, Y: 10, Width: 28, Height: 28 };
    const panel: PopoverRect = { X: 200, Y: 60, Width: 250, Height: 180 };
    const pressOnAnchor = { x: 20, y: 20 };
    expect(PointInRect(pressOnAnchor.x, pressOnAnchor.y, panel)).toBe(false);
    expect(PointInRect(pressOnAnchor.x, pressOnAnchor.y, anchor)).toBe(true);
  });
});
