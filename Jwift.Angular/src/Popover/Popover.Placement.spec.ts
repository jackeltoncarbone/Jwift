import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  PlacePopover, PointInRect, PopoverTargetRect, ROOM_STILL_MS, ROOM_WAIT_MS, RoomWaitStep, ShortfallBelow, type PopoverRect,
} from './Popover.Placement';

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

  it('still rides a scroll of the list, and covers a sentence grown into it rather than move (lane CC1, item 1)', () => {
    const scrolled = PlacePopover({ Anchor: { ...band, Y: band.Y - 40 }, Region: desktop, ...wheel, PrevDown: true, Hold: hold });
    expect(scrolled.Y).toBe(opened.Y - 40);
    const grown: PopoverRect = { ...band, Height: band.Height + 23 };
    const covered = PlacePopover({ Anchor: grown, Region: desktop, ...wheel, PrevDown: true, Hold: hold });
    expect(covered).toMatchObject({ X: opened.X, Y: opened.Y });
    expect(covered.Y).toBeLessThan(grown.Y + grown.Height); // the new line sits under the panel, as on iOS.
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

// Drill Sentences lane CC1, item 1 (blind testers, phone and desktop): after the first "−", a grey "mark time
// N" filler wrapped the sentence onto a new line, the held panel was pushed down by that line, and the next
// "−" taps missed. While a token's control is open its panel stands still on screen; only a scroll moves it.
describe('four quick − presses on a count wheel whose sentence gains a line (lane CC1, item 1)', () => {
  const phone: PopoverRect = { X: 8, Y: 67, Width: 386, Height: 765 };
  /** The wheel's panel, and where its − button sits inside it (the panel's padding, then the stepper). */
  const wheel = { W: 250, H: 200, Scrolls: false };
  const minusIn = { X: 10, Y: 150, Width: 44, Height: 44 };
  /** "march forward 16 counts" as a two-line band, the count on the last line. */
  const band = (counts: number): PopoverRect => counts === 16
    ? { X: 150, Y: 300, Width: 70, Height: 46 }
    // From 15 on, the line ends short and its "mark time N" filler wraps the sentence a line longer; the
    // count's own word moves a little left on its line, the way a rewrap moves it.
    : { X: 138, Y: 300, Width: 66, Height: 69 };
  const minusRect = (p: { X: number; Y: number }): PopoverRect =>
    ({ X: p.X + minusIn.X, Y: p.Y + minusIn.Y, Width: minusIn.Width, Height: minusIn.Height });

  it('gives 12, the − standing exactly where it was before and after each press', () => {
    let counts = 16;
    const opened = PlacePopover({ Anchor: band(counts), Region: phone, ...wheel, PrevDown: null });
    const hold = { Down: opened.Down, X: opened.X, TopFromAnchor: opened.Y - band(counts).Y };
    let minus = minusRect(opened);
    for (let press = 0; press < 4; press++) {
      // The finger lands on the − where it stands now.
      const at = { X: minus.X + minus.Width / 2, Y: minus.Y + minus.Height / 2 };
      expect(PointInRect(at.X, at.Y, minus), `press ${press + 1}`).toBe(true);
      counts -= 1;
      const after = PlacePopover({ Anchor: band(counts), Region: phone, ...wheel, PrevDown: opened.Down, Hold: hold });
      expect(minusRect(after), `press ${press + 1}`).toEqual(minus);
      minus = minusRect(after);
    }
    expect(counts).toBe(12);
  });

  it('a scroll of the list still carries the panel with its sentence', () => {
    const opened = PlacePopover({ Anchor: band(16), Region: phone, ...wheel, PrevDown: null });
    const hold = { Down: opened.Down, X: opened.X, TopFromAnchor: opened.Y - band(16).Y };
    const scrolled = PlacePopover({ Anchor: { ...band(15), Y: 300 - 30 }, Region: phone, ...wheel, PrevDown: opened.Down, Hold: hold });
    expect(scrolled.Y).toBe(opened.Y - 30);
  });
});

// Drill Sentences lane CC1, item 5 (a blind phone tester): a row picked while the phrase menu was still
// growing in only closed the menu. The rows are laid out at the panel's placement from its first frame; the
// panel's own watched rect trails it, so the outside press is judged against the placement's box too.
describe('PopoverTargetRect: where an opening panel\'s rows are', () => {
  it('is the placement at the panel\'s width, as tall as its content up to its cap', () => {
    const anchor: PopoverRect = { X: 100, Y: 400, Width: 120, Height: 44 };
    const region: PopoverRect = { X: 8, Y: 67, Width: 386, Height: 765 };
    const p = PlacePopover({ Anchor: anchor, Region: region, W: 250, H: 220, PrevDown: null });
    const target = PopoverTargetRect(p, 250, 220);
    expect(target).toEqual({ X: p.X, Y: p.Y, Width: 250, Height: 220 });
    // A row near the menu's bottom, picked mid grow: inside the target, whatever the trailing rect says.
    const stale: PopoverRect = { X: 0, Y: 0, Width: 250, Height: 110 };
    const row = { X: p.X + 125, Y: p.Y + 200 };
    expect(PointInRect(row.X, row.Y, stale)).toBe(false);
    expect(PointInRect(row.X, row.Y, target)).toBe(true);
    // A capped menu's box ends at its cap.
    const capped = PlacePopover({ Anchor: anchor, Region: region, W: 250, H: 2000, PrevDown: null });
    expect(PopoverTargetRect(capped, 250, 2000).Height).toBe(capped.MaxHeight);
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

// Drill Sentences lane EE2, item 4 (a round 10 blind desktop tester at 1440x900): tapping "3a ⇔ 3b" opened its
// mirror popover ("3b mirrors 3a / Write 3b separately") right over the next line of the sentence list.
describe('PlacePopover opens beside the column its word sits in, clear of the sentences around it', () => {
  const desktop: PopoverRect = { X: 8, Y: 8, Width: 1424, Height: 884 };
  /** The desktop island's right edge at 1440 (16pt in, 432pt wide). */
  const column = 448;
  /** "3a ⇔ 3b", the who word of a line part way down the list. */
  const word: PopoverRect = { X: 40, Y: 300, Width: 70, Height: 22 };
  const words = { Anchor: word, Region: desktop, W: 250, H: 120, PrevDown: null };

  it('to the right of the column, level with the word', () => {
    const p = PlacePopover({ ...words, Beside: column });
    expect(p.Side).toBe(true);
    expect(p.X).toBeGreaterThanOrEqual(column);
    expect(p.X + 250).toBeLessThanOrEqual(desktop.X + desktop.Width);
    expect(p.Y).toBeLessThanOrEqual(word.Y);
    expect(p.Y + p.MaxHeight).toBeGreaterThanOrEqual(word.Y + word.Height);
  });

  it('a word low in the list keeps its whole panel on screen, still level with the word', () => {
    const low: PopoverRect = { ...word, Y: 860 };
    const p = PlacePopover({ ...words, Anchor: low, Beside: column });
    expect(p.Y + p.MaxHeight).toBeLessThanOrEqual(desktop.Y + desktop.Height);
    expect(p.Y).toBeLessThanOrEqual(low.Y + low.Height / 2);
    expect(p.Y + p.MaxHeight).toBeGreaterThanOrEqual(low.Y + low.Height / 2);
  });

  it('above or below the word as ever where the panel does not fit beside the column', () => {
    const narrow: PopoverRect = { X: 8, Y: 8, Width: 600, Height: 884 };
    expect(PlacePopover({ ...words, Region: narrow, Beside: 400 }).Side).toBeFalsy();
    expect(PlacePopover({ ...words }).Side).toBeFalsy();
  });

  it('held, it stays beside the column through its word\'s own reflow and rides a scroll', () => {
    const p = PlacePopover({ ...words, Beside: column });
    const hold = { Down: p.Down, Side: p.Side, X: p.X, TopFromAnchor: p.Y - word.Y };
    const reflowed = PlacePopover({ ...words, Anchor: { ...word, Height: 44 }, Beside: column, Hold: hold });
    expect(reflowed.Side).toBe(true);
    expect(reflowed.X).toBe(p.X);
    expect(reflowed.Y).toBe(p.Y);
    const scrolled = PlacePopover({ ...words, Anchor: { ...word, Y: word.Y - 40 }, Beside: column, Hold: hold });
    expect(scrolled.Y).toBe(p.Y - 40);
  });
});

// Drill Sentences lane GG2, item 4 (a round 11 blind desktop tester: the count wheel, opened beside the panel,
// covered 3a, the squad its sentence names).
describe('PlacePopover beside its column keeps clear of what it is told to avoid', () => {
  const desktop: PopoverRect = { X: 8, Y: 8, Width: 1424, Height: 884 };
  const column = 448;
  const word: PopoverRect = { X: 40, Y: 400, Width: 70, Height: 22 };
  const wheel = { Anchor: word, Region: desktop, W: 250, H: 200, PrevDown: null, Beside: column, Scrolls: false };
  const covers = (p: { X: number; Y: number; MaxHeight: number }, r: PopoverRect): boolean =>
    p.X < r.X + r.Width && r.X < p.X + 250 && p.Y < r.Y + r.Height && r.Y < p.Y + p.MaxHeight;

  it('a squad just below the word: the panel rises over the column, still level with the word', () => {
    const squad: PopoverRect = { X: 470, Y: 470, Width: 60, Height: 30 };
    expect(covers(PlacePopover(wheel), squad)).toBe(true);
    const p = PlacePopover({ ...wheel, Avoid: [squad] });
    expect(p.Side).toBe(true);
    expect(covers(p, squad)).toBe(false);
    expect(p.Y + p.MaxHeight).toBeLessThanOrEqual(squad.Y);
    expect(p.Y + 32).toBeLessThanOrEqual(word.Y + word.Height / 2);
    expect(p.Y + p.MaxHeight - 32).toBeGreaterThanOrEqual(word.Y + word.Height / 2);
  });

  it('a squad above the word: the panel keeps hanging down from it, the side away from the squad', () => {
    const squad: PopoverRect = { X: 470, Y: 300, Width: 60, Height: 40 };
    const p = PlacePopover({ ...wheel, Avoid: [squad] });
    expect(covers(p, squad)).toBe(false);
    expect(p).toEqual(PlacePopover(wheel));
  });

  it('nothing to avoid, or nothing in the way: the panel stands level with the word, as ever', () => {
    const plain = PlacePopover(wheel);
    expect(PlacePopover({ ...wheel, Avoid: [] })).toEqual(plain);
    expect(PlacePopover({ ...wheel, Avoid: [{ X: 1000, Y: 100, Width: 40, Height: 40 }] })).toEqual(plain);
  });
});

/** Drill Sentences lane UU3, item 7 (round 23 and 24 blind phone testers: in the sheet at Medium the count wheel opened above
 *  its sentence over the transport, and the join menu above its row with room for two rows). */
describe('ShortfallBelow: what a panel lacks under its word, for its host to make room', () => {
  const region: PopoverRect = { X: 8, Y: 70, Width: 386, Height: 754 };

  it('the room under the word, its gap included, less the panel\'s height', () => {
    // 402x874 at Medium: the word's band ends at 700, a 225px wheel needs 225 + 12 under it.
    const word: PopoverRect = { X: 120, Y: 664, Width: 60, Height: 36 };
    expect(ShortfallBelow(word, region, 225)).toBe(225 - (824 - (700 + 12)));
  });

  it('nothing when the whole panel fits below', () => {
    expect(ShortfallBelow({ X: 120, Y: 300, Width: 60, Height: 36 }, region, 225)).toBe(0);
  });

  it('a panel asks before its first placement, rides its anchor while the room opens, and asks again for a taller held page', () => {
    const popover = readFileSync(new URL('./Popover.ts', import.meta.url), 'utf-8');
    expect(popover).toContain('if (short > 0.5 && maker(short, anchor)) {');
    expect(popover).toContain('const step = RoomWaitStep({ Shortfall: ShortfallBelow(anchor, region, h, over), StillFor: now - wait.StillSince, Elapsed: now - wait.Since });');
    expect(popover).toContain('} else if (this._hold?.Down && !this._hold.Side && h > this._roomHeight + 0.5) {');
  });
});

/** Lane UU3, item 7, live (402x874, "16 counts" in M5-12 at Medium, w2-wheel.png: the sheet rose and the word came up to
 *  y 505, but the wheel had already opened above it, over the transport). The word paused, still low, before the sheet rose.
 *  Lane XX2, item 4 (round 25, 04-tap16counts.png and 05-after-wait.png: nothing for about 1.5s, then the wheel): the panel
 *  shows at once below its word and rides it up; the room counts as made where UU3 placed. */
describe('RoomWaitStep: the room under a word is made once the panel fits below it and the word has come to rest', () => {
  const region: PopoverRect = { X: 8, Y: 70, Width: 386, Height: 762 };
  const wheel = 232;
  const atMedium: PopoverRect = { X: 24, Y: 760, Width: 90, Height: 68 };
  const atLarge: PopoverRect = { X: 24, Y: 450, Width: 90, Height: 68 };

  it('word low at Medium: still rising, however long the word stands still there before the sheet begins to rise', () => {
    expect(ShortfallBelow(atMedium, region, wheel)).toBeGreaterThan(0);
    expect(RoomWaitStep({ Shortfall: ShortfallBelow(atMedium, region, wheel), StillFor: 300, Elapsed: 300 })).toBe('Rising');
  });

  it('the word on its way up: still rising', () => {
    const rising = { ...atMedium, Y: 600 };
    expect(RoomWaitStep({ Shortfall: ShortfallBelow(rising, region, wheel), StillFor: 0, Elapsed: 400 })).toBe('Rising');
  });

  it('room made at Large: once the word has stood still there, the panel stands below the word', () => {
    expect(ShortfallBelow(atLarge, region, wheel)).toBe(0);
    expect(RoomWaitStep({ Shortfall: 0, StillFor: ROOM_STILL_MS - 1, Elapsed: 700 })).toBe('Rising');
    expect(RoomWaitStep({ Shortfall: 0, StillFor: ROOM_STILL_MS, Elapsed: 720 })).toBe('Made');
    const placed = PlacePopover({ Anchor: atLarge, Region: region, W: 250, H: wheel, PrevDown: true, Scrolls: false });
    expect(placed.Down).toBe(true);
    expect(placed.Y).toBe(atLarge.Y + atLarge.Height + 12);
    expect(placed.Y + wheel).toBeLessThanOrEqual(region.Y + region.Height);
  });

  it('a host that could not make room: past its time the room counts as made, and the panel takes wherever it fits', () => {
    expect(RoomWaitStep({ Shortfall: 240, StillFor: 900, Elapsed: ROOM_WAIT_MS })).toBe('Made');
  });

  it('while the room is made the panel stands below its word, whole and uncapped, whatever the room left this frame', () => {
    const rising = { ...atMedium, Y: 640 };
    const p = PlacePopover({ Anchor: rising, Region: region, W: 250, H: wheel, PrevDown: null, Scrolls: true, MakingRoom: true });
    expect(p).toEqual({
      X: rising.X + rising.Width / 2 - 125 < region.X ? region.X : rising.X + rising.Width / 2 - 125, Y: 640 + 68 + 12, MaxHeight: wheel, Down: true,
      // The arrow still points at the word's own middle, local to the panel (lane AB1, item 2): 24 + 45 (its centre) − 8
      // (the panel's clamped left) = 61.
      Arrow: 61,
    });
    // A menu that is its control's glass grows down from the control's own top, and needs no arrow of its own.
    const over = PlacePopover({ Anchor: rising, Region: region, W: 250, H: wheel, PrevDown: null, MakingRoom: true, Over: true });
    expect(over.Y).toBe(640);
    expect(over.Down).toBe(true);
    expect(over.Arrow).toBeNull();
  });

  /**
   * THE TIMELINE, a frame at a time (60Hz), as `Popover._place` runs it: "16 counts" at the Medium detent, the sheet
   * rising to Large on a critically damped spring and carrying the word from 760 to 450. The panel mounts unseen at 0ms,
   * is measured and placed the next frame, and shows the frame after, growing from the word: no hidden wait past 150ms.
   * From then on it stands a gap under the word every frame (its placement held, its ride the word's travel), and where
   * the room is made it lands on its own placement exactly where it already stood.
   */
  it('the timeline: placed at ~16ms, shown at ~33ms, a gap under the word every frame, landing where it stands', () => {
    const frame = 1000 / 60;
    const omega = 14;
    const wordAt = (t: number): number => {
      const s = t <= 0 ? 0 : 1 - (1 + omega * (t / 1000)) * Math.exp(-omega * (t / 1000));
      return Math.round((760 - 310 * s) * 100) / 100;
    };
    let rideFrom: PopoverRect | null = null;
    let placement: ReturnType<typeof PlacePopover> | null = null;
    let shownAt: number | null = null;
    let showPending = false;
    let wait: { Since: number; StillSince: number; At: number } | null = null;
    let made: { At: number; Placement: ReturnType<typeof PlacePopover> } | null = null;
    for (let n = 0; n * frame < 2000 && !made; n++) {
      const t = n * frame;
      const anchor: PopoverRect = { ...atMedium, Y: wordAt(t) };
      if (placement && showPending) { showPending = false; shownAt = t; }
      if (n === 0) continue; // mounted, unseen, its height not yet measured.
      if (!placement) {
        expect(ShortfallBelow(anchor, region, wheel)).toBeGreaterThan(0);
        wait = { Since: t, StillSince: t, At: anchor.Y };
      }
      if (wait!.At !== anchor.Y) { wait!.At = anchor.Y; wait!.StillSince = t; }
      const step = RoomWaitStep({ Shortfall: ShortfallBelow(anchor, region, wheel), StillFor: t - wait!.StillSince, Elapsed: t - wait!.Since });
      if (step === 'Rising') {
        if (!placement) {
          placement = PlacePopover({ Anchor: anchor, Region: region, W: 250, H: wheel, PrevDown: null, Scrolls: false, MakingRoom: true });
          rideFrom = anchor;
          showPending = true;
        }
        // Where it is drawn: its placement, ridden by the word's travel since.
        const drawnTop = placement.Y + (anchor.Y - rideFrom!.Y);
        expect(drawnTop, `${Math.round(t)}ms`).toBeCloseTo(anchor.Y + anchor.Height + 12, 6);
        continue;
      }
      made = { At: t, Placement: PlacePopover({ Anchor: anchor, Region: region, W: 250, H: wheel, PrevDown: placement!.Down, Scrolls: false }) };
      // It lands where it already stood: its placement plus the ride it is dropping.
      expect(made.Placement.Y).toBeCloseTo(placement!.Y + (anchor.Y - rideFrom!.Y), 6);
      expect(made.Placement.X).toBe(placement!.X);
    }
    expect(shownAt).not.toBeNull();
    expect(shownAt!).toBeLessThanOrEqual(150);
    expect(shownAt!).toBeLessThanOrEqual(2 * frame + 1);
    expect(made, 'the room is made once the word comes to rest').not.toBeNull();
    expect(made!.Placement.Y + wheel).toBeLessThanOrEqual(region.Y + region.Height);
  });
});

/** Drill Sentences lane WW1, item 3 (live, 1440x900: the phrase menu opened above its chip, the chip's spot a hole beside
 *  it). A menu that is its control's own glass covers the control, its edges on the control's on the sides it grows from. */
describe('PlacePopover over its control (Over)', () => {
  const desktop: PopoverRect = { X: 8, Y: 8, Width: 1424, Height: 884 };
  const contains = (p: { X: number; Y: number; MaxHeight: number }, w: number, r: PopoverRect): boolean =>
    p.X <= r.X && p.Y <= r.Y && p.X + w >= r.X + r.Width && p.Y + p.MaxHeight >= r.Y + r.Height;

  it('the player chip low on the screen: the bottom left corner on the chip\'s, growing up and right', () => {
    const chip: PopoverRect = { X: 620, Y: 818, Width: 92, Height: 44 };
    const p = PlacePopover({ Anchor: chip, Region: desktop, W: 270, H: 286, PrevDown: null, Over: true });
    expect(p.Down).toBe(false);
    expect(p.X).toBe(chip.X);
    expect(p.Y + p.MaxHeight).toBe(chip.Y + chip.Height);
    expect(contains(p, 270, chip)).toBe(true);
  });

  it('a "…" high on the screen near its right edge: the top right corner on the button\'s, growing down and left', () => {
    const more: PopoverRect = { X: 1380, Y: 120, Width: 36, Height: 36 };
    const p = PlacePopover({ Anchor: more, Region: desktop, W: 250, H: 300, PrevDown: null, Over: true });
    expect(p.Down).toBe(true);
    expect(p.Y).toBe(more.Y);
    expect(p.X + 250).toBe(more.X + more.Width);
    expect(contains(p, 250, more)).toBe(true);
  });

  it('stays on screen, capped to the larger room when neither side holds it, still over the control', () => {
    const mid: PopoverRect = { X: 300, Y: 400, Width: 60, Height: 30 };
    const p = PlacePopover({ Anchor: mid, Region: desktop, W: 250, H: 1200, PrevDown: null, Over: true });
    expect(p.Y).toBeGreaterThanOrEqual(desktop.Y);
    expect(p.Y + p.MaxHeight).toBeLessThanOrEqual(desktop.Y + desktop.Height);
    expect(contains(p, 250, mid)).toBe(true);
  });

  it('held through a taller submenu: its side and its leading edge kept, only the growing edge moving', () => {
    const chip: PopoverRect = { X: 620, Y: 818, Width: 92, Height: 44 };
    const root = PlacePopover({ Anchor: chip, Region: desktop, W: 270, H: 286, PrevDown: null, Over: true });
    const hold = { Down: root.Down, X: root.X, TopFromAnchor: root.Y - chip.Y };
    const sub = PlacePopover({ Anchor: chip, Region: desktop, W: 270, H: 420, PrevDown: root.Down, Hold: hold, Over: true });
    expect(sub.X).toBe(root.X);
    expect(sub.Y + sub.MaxHeight).toBe(chip.Y + chip.Height);
    expect(sub.Y).toBeLessThan(root.Y);
  });

  it('asks for room under the control\'s own top, not under its bottom', () => {
    const region: PopoverRect = { X: 8, Y: 70, Width: 386, Height: 754 };
    const more: PopoverRect = { X: 340, Y: 700, Width: 36, Height: 36 };
    expect(ShortfallBelow(more, region, 300, true)).toBe(300 - (824 - 700));
  });

  it('a chip\'s own menu (Over) needs no arrow: it already reads as the control, grown', () => {
    const chip: PopoverRect = { X: 620, Y: 818, Width: 92, Height: 44 };
    const p = PlacePopover({ Anchor: chip, Region: desktop, W: 270, H: 286, PrevDown: null, Over: true });
    expect(p.Arrow).toBeNull();
  });
});

/**
 * Drill Sentences lane AB1, item 2 (HIG Popovers, `Apple.Review.Checklist.md` #53: every popover has a visible
 * arrow aimed at the control that revealed it). `PlacePopover`'s own `Arrow`: where that pointer's tip belongs,
 * local to the panel's own box, on the edge it points from — never on a panel that is its anchor's own glass,
 * grown in place (`Over`, covered above).
 */
describe('PlacePopover.Arrow: the pointer aimed at the anchor that opened the panel', () => {
  const desktop: PopoverRect = { X: 8, Y: 8, Width: 1424, Height: 884 };

  it('below the anchor: the panel\'s top is its pointing edge, the arrow at the anchor\'s own centre', () => {
    // Centered under the anchor with room on every side, so X itself is never clamped: the arrow lands at
    // exactly the panel's own half-width, the anchor's centre and the panel's centre being the same point.
    const anchor: PopoverRect = { X: 200, Y: 200, Width: 40, Height: 20 };
    const p = PlacePopover({ Anchor: anchor, Region: desktop, W: 250, H: 120, PrevDown: null });
    expect(p.Down).toBe(true);
    expect(p.Arrow).toBe(125); // W / 2
  });

  it('above the anchor: same rule, the panel\'s bottom its pointing edge', () => {
    const anchor: PopoverRect = { X: 200, Y: 860, Width: 40, Height: 20 };
    const p = PlacePopover({ Anchor: anchor, Region: desktop, W: 250, H: 120, PrevDown: null });
    expect(p.Down).toBe(false);
    expect(p.Arrow).toBe(125);
  });

  it('an anchor near the region\'s edge: the arrow stays clear of the panel\'s own rounded corner', () => {
    // The panel's X is clamped to the region's own left (its natural centred X would run off screen); the
    // anchor's centre, 10px into the clamped panel, is too close to the corner, so the arrow holds at the inset.
    const anchor: PopoverRect = { X: 8, Y: 200, Width: 20, Height: 20 };
    const p = PlacePopover({ Anchor: anchor, Region: desktop, W: 250, H: 120, PrevDown: null });
    expect(p.X).toBe(desktop.X);
    expect(p.Arrow).toBe(20);
  });

  it('beside its column: the arrow is on the panel\'s own left edge, level with the anchor', () => {
    const column = 448;
    const word: PopoverRect = { X: 40, Y: 300, Width: 70, Height: 22 };
    const p = PlacePopover({ Anchor: word, Region: desktop, W: 250, H: 120, PrevDown: null, Beside: column });
    expect(p.Side).toBe(true);
    expect(p.Arrow).not.toBeNull();
    // Clear of both rounded corners, and (barring an `Avoid` push) level with the anchor's own middle.
    expect(p.Arrow!).toBeGreaterThanOrEqual(20);
    expect(p.Arrow!).toBeLessThanOrEqual(p.MaxHeight - 20);
    expect(p.Y + p.Arrow!).toBeCloseTo(word.Y + word.Height / 2, 5);
  });

  it('a held panel recomputes its arrow against the anchor\'s new position, same as its box does', () => {
    const band: PopoverRect = { X: 300, Y: 200, Width: 70, Height: 69 };
    const opened = PlacePopover({ Anchor: band, Region: desktop, W: 250, H: 120, Scrolls: false, PrevDown: null });
    const hold = { Down: opened.Down, X: opened.X, TopFromAnchor: opened.Y - band.Y };
    const reflowed: PopoverRect = { X: 262, Y: 200, Width: 62, Height: 46 };
    const held = PlacePopover({ Anchor: reflowed, Region: desktop, W: 250, H: 120, Scrolls: false, PrevDown: true, Hold: hold });
    expect(held.X).toBe(opened.X); // the box itself holds still (lane BB2, item 2's own rule) …
    expect(held.Arrow).toBe(ArrowAtForTest(reflowed.X + reflowed.Width / 2, held.X, 250)); // … the arrow still tracks the word.
  });
});

/** `ArrowAt`'s own formula, independent of `Popover.Placement.ts`'s import boundary (it is not exported — the
 *  module keeps it private, same as `Clamp`), so this file's own held-panel test above can state what it expects
 *  without re-deriving the clamp inline. Kept in lockstep with `ARROW_INSET` (20) by the first two tests above,
 *  which pin both the unclamped and the clamped case against literal numbers. */
function ArrowAtForTest(anchorCenter: number, origin: number, length: number): number {
  const inset = 20, half = length / 2;
  return Math.max(Math.min(inset, half), Math.min(Math.max(half, length - inset), anchorCenter - origin));
}
