import { describe, expect, it } from 'vitest';
import { PlacePopover, PointInRect, type PopoverRect } from './Popover.Placement';

// Drill Sentences lane AA2, items 1 and 2 (blind first-time testers, phone 402x874 and desktop 1440x900).
describe('PlacePopover keeps every row on screen and never covers the word it edits', () => {
  /** The desktop window, inset the way Popover's own default region is (8pt each side). */
  const desktop: PopoverRect = { X: 8, Y: 8, Width: 1424, Height: 884 };
  /** The phone, inset 8pt plus its safe areas (59pt top, 34pt bottom). */
  const phone: PopoverRect = { X: 8, Y: 67, Width: 386, Height: 765 };
  const bottomOf = (p: { Y: number; MaxHeight: number }): number => p.Y + p.MaxHeight;

  it('a row menu low in the list flips up rather than open into room it does not fit (item 1)', () => {
    // The 5-8 row's "…" in M5-12, low in the desktop list: 244pt below it, a 350pt menu.
    const anchor: PopoverRect = { X: 1380, Y: 608, Width: 28, Height: 28 };
    const p = PlacePopover({ Anchor: anchor, Region: desktop, W: 260, H: 350, PrevDown: null });
    expect(p.Down).toBe(false);
    expect(p.MaxHeight).toBe(350); // every row shows, Move down and Delete included.
    expect(p.Y).toBeGreaterThanOrEqual(desktop.Y);
    expect(bottomOf(p)).toBeLessThanOrEqual(anchor.Y);
  });

  it('still prefers below whenever the whole menu fits there', () => {
    const anchor: PopoverRect = { X: 1380, Y: 200, Width: 28, Height: 28 };
    const p = PlacePopover({ Anchor: anchor, Region: desktop, W: 260, H: 350, PrevDown: null });
    expect(p.Down).toBe(true);
    expect(p.Y).toBeGreaterThanOrEqual(anchor.Y + anchor.Height);
  });

  it('caps to the roomier side and scrolls only when neither side holds the menu, inside the region', () => {
    const anchor: PopoverRect = { X: 180, Y: 420, Width: 28, Height: 28 };
    const p = PlacePopover({ Anchor: anchor, Region: phone, W: 260, H: 900, PrevDown: null });
    expect(p.MaxHeight).toBeLessThan(900);
    expect(p.Y).toBeGreaterThanOrEqual(phone.Y);
    expect(bottomOf(p)).toBeLessThanOrEqual(phone.Y + phone.Height);
    expect(p.Down ? p.Y >= anchor.Y + anchor.Height : bottomOf(p) <= anchor.Y).toBe(true);
  });

  it('an open menu that stops fitting its side as the list scrolls moves to the side where it fits', () => {
    const anchor: PopoverRect = { X: 180, Y: 600, Width: 28, Height: 28 };
    const p = PlacePopover({ Anchor: anchor, Region: phone, W: 260, H: 330, PrevDown: true });
    expect(p.Down).toBe(false);
    expect(p.MaxHeight).toBe(330);
  });

  it('a count wheel, which cannot scroll, is never capped and never covers the line it edits (item 2)', () => {
    // "16 counts" anywhere down the phone's list, and the 200pt wheel (its 180pt drum and the padding).
    for (const y of [120, 300, 520, 700]) {
      const anchor: PopoverRect = { X: 140, Y: y, Width: 70, Height: 26 };
      const p = PlacePopover({ Anchor: anchor, Region: phone, W: 250, H: 200, PrevDown: null, Scrolls: false });
      expect(p.MaxHeight, `anchor at ${y}`).toBe(200);
      if (p.Down) expect(p.Y, `anchor at ${y}`).toBeGreaterThanOrEqual(anchor.Y + anchor.Height);
      else expect(p.Y + 200, `anchor at ${y}`).toBeLessThanOrEqual(anchor.Y);
    }
  });

  it('a submenu page still holds the panel where it stood (lane Y3, item 6)', () => {
    const anchor: PopoverRect = { X: 180, Y: 600, Width: 28, Height: 28 };
    const p = PlacePopover({
      Anchor: anchor, Region: phone, W: 260, H: 500, PrevDown: false,
      Hold: { Down: false, X: 40, TopFromAnchor: -340 },
    });
    expect(p.Down).toBe(false);
    expect(p.X).toBe(40);
    expect(p.Y).toBe(260);
    expect(bottomOf(p)).toBeLessThanOrEqual(anchor.Y);
  });
});

// Drill Sentences lane BB2, item 2 (blind testers): every − and + on the count wheel rewrites the sentence it
// points at, so its anchor (the word's column across the whole sentence) moves sideways and the sentence
// wraps a line shorter or longer, and the panel re-placed on each tap moved the − out from under the finger.
// A token's control holds the placement it opened with (`Popover.HoldOnOpen`), like a submenu page.
describe('a held panel stands still while the sentence it points at reflows (lane BB2, item 2)', () => {
  const desktop: PopoverRect = { X: 8, Y: 8, Width: 1424, Height: 884 };
  const wheel = { W: 250, H: 120, Scrolls: false };
  /** "march forward 10 counts" as a three-line sentence band, its count on the last line. */
  const band: PopoverRect = { X: 300, Y: 200, Width: 70, Height: 69 };
  const opened = PlacePopover({ Anchor: band, Region: desktop, ...wheel, PrevDown: null });
  const hold = { Down: opened.Down, X: opened.X, TopFromAnchor: opened.Y - band.Y };

  it('a tap that rewraps the sentence a line shorter and moves the word leaves the panel where it stood', () => {
    expect(opened.Down).toBe(true);
    const reflowed: PopoverRect = { X: 262, Y: 200, Width: 62, Height: 46 };
    const held = PlacePopover({ Anchor: reflowed, Region: desktop, ...wheel, PrevDown: true, Hold: hold });
    expect(held).toMatchObject({ Down: true, X: opened.X, Y: opened.Y });
    // Unheld, the same tap moved it: up by the line the sentence lost, and sideways after the word.
    const unheld = PlacePopover({ Anchor: reflowed, Region: desktop, ...wheel, PrevDown: true });
    expect(unheld.Y).toBeLessThan(opened.Y);
    expect(unheld.X).not.toBe(opened.X);
  });

  it('still rides a scroll of the list, and is pushed only as far as a sentence grown into it needs', () => {
    const scrolled = PlacePopover({ Anchor: { ...band, Y: band.Y - 40 }, Region: desktop, ...wheel, PrevDown: true, Hold: hold });
    expect(scrolled.Y).toBe(opened.Y - 40);
    const grown: PopoverRect = { ...band, Height: band.Height + 23 };
    const pushed = PlacePopover({ Anchor: grown, Region: desktop, ...wheel, PrevDown: true, Hold: hold });
    expect(pushed.Y).toBe(grown.Y + grown.Height + 12);
    expect(pushed.X).toBe(opened.X);
  });

  it('a panel above its sentence holds the same way', () => {
    const low: PopoverRect = { X: 300, Y: 760, Width: 70, Height: 69 };
    const above = PlacePopover({ Anchor: low, Region: desktop, ...wheel, PrevDown: null });
    expect(above.Down).toBe(false);
    const held = PlacePopover({
      Anchor: { X: 340, Y: 760, Width: 60, Height: 46 }, Region: desktop, ...wheel, PrevDown: false,
      Hold: { Down: false, X: above.X, TopFromAnchor: above.Y - low.Y },
    });
    expect(held).toMatchObject({ Down: false, X: above.X, Y: above.Y });
  });
});

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
