import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  PlacePopover, ShortfallBelow, type PopoverRect,
  POPOVER_ARROW_GAP, POPOVER_ARROW_HEIGHT, POPOVER_ARROW_TIP_GAP, POPOVER_POINTING_INSET,
} from './Popover.Placement';
import { PopoverArrowRect, PopoverGlassArrow } from './Popover.Arrow';
import { IsRegularWidth } from '../Sheet/Sheet.Geometry';

/**
 * Drill Sentences lane GL4 (three blind desktop rounds: the count wheel and the who chooser stood off their word with
 * nothing pointing back at it, blind30-desktop/02_click_16.png). At regular width a popover's glass is one shape, its body
 * and an arrow whose tip points at the source (HIG Popovers; Jwift/Apple/Sizing.md 13 [C]: 13 pt on a 26 pt base). The
 * placement names the edge the arrow is drawn on and stands the panel its height further off, so the tip sits a few
 * points from the anchor; compact width (a sheet there) and a menu grown over its control point with none.
 */
describe('Pointing: a regular-width popover\'s glass arrow, aimed at its anchor', () => {
  const desktop: PopoverRect = { X: 8, Y: 8, Width: 1424, Height: 884 };
  const word: PopoverRect = { X: 600, Y: 300, Width: 70, Height: 22 };
  const centre = word.X + word.Width / 2;

  it('Apple\'s numbers: a 13 pt arrow, its tip 4 pt off the anchor, so the panel stands 17 pt off', () => {
    expect(POPOVER_ARROW_HEIGHT).toBe(13);
    expect(POPOVER_ARROW_TIP_GAP).toBeGreaterThanOrEqual(2);
    expect(POPOVER_ARROW_TIP_GAP).toBeLessThanOrEqual(6);
    expect(POPOVER_ARROW_GAP).toBe(POPOVER_ARROW_HEIGHT + POPOVER_ARROW_TIP_GAP);
    // The arrow's centre keeps off the house panel's 32 pt corner by half its 37 pt footprint (Jaui's clamp).
    expect(POPOVER_POINTING_INSET).toBe(32 + 18.5);
  });

  it('below its anchor: the arrow on the panel\'s top edge, at the anchor\'s centre, the tip 4 pt under the word', () => {
    const p = PlacePopover({ Anchor: word, Region: desktop, W: 250, H: 200, PrevDown: null, Pointing: true });
    expect(p.Down).toBe(true);
    expect(p.ArrowEdge).toBe('Top');
    expect(p.Y).toBe(word.Y + word.Height + POPOVER_ARROW_GAP);
    expect(p.X + p.Arrow!).toBe(centre);
    const style = PopoverGlassArrow(p, 250, 200);
    expect(style.GlassArrow).toBe('Top');
    // Jaui takes the offset from the edge's centre, as UIKit's arrowOffset is: here the panel is centred on the word.
    expect(style.GlassArrowOffset).toBe('0px');
    // The tip: the panel's top less the arrow's height, a few points under the word.
    expect(p.Y - POPOVER_ARROW_HEIGHT - (word.Y + word.Height)).toBe(POPOVER_ARROW_TIP_GAP);
    // A press on the arrow is a press on the panel: its box spans the 37 pt footprint over the panel's top.
    expect(PopoverArrowRect(p, 200)).toEqual({ X: centre - 18.5, Y: p.Y - 13, Width: 37, Height: 13 });
  });

  it('above its anchor: the arrow on the bottom edge, pointing down at the word', () => {
    const low: PopoverRect = { ...word, Y: 820 };
    const p = PlacePopover({ Anchor: low, Region: desktop, W: 250, H: 200, PrevDown: null, Pointing: true });
    expect(p.Down).toBe(false);
    expect(p.ArrowEdge).toBe('Bottom');
    expect(low.Y - (p.Y + p.MaxHeight)).toBe(POPOVER_ARROW_GAP);
    expect(PopoverGlassArrow(p, 250, p.MaxHeight).GlassArrow).toBe('Bottom');
  });

  it('beside its column: the arrow on the leading edge, level with the word, clear of the corner', () => {
    const column = 448;
    const listWord: PopoverRect = { X: 40, Y: 300, Width: 70, Height: 22 };
    const p = PlacePopover({ Anchor: listWord, Region: desktop, W: 250, H: 300, PrevDown: null, Beside: column, Pointing: true });
    expect(p.Side).toBe(true);
    expect(p.ArrowEdge).toBe('Leading');
    expect(p.X).toBe(column + POPOVER_ARROW_GAP);
    // Level with the word on the panel's straight side: its centre that far inside the corner.
    expect(p.Y + p.Arrow!).toBeCloseTo(listWord.Y + listWord.Height / 2, 6);
    expect(p.Arrow!).toBeGreaterThanOrEqual(POPOVER_POINTING_INSET);
    const style = PopoverGlassArrow(p, 250, 300);
    expect(style.GlassArrow).toBe('Leading');
    expect(parseFloat(style.GlassArrowOffset)).toBeCloseTo(p.Arrow! - 150, 6);
  });

  it('an anchor near the region\'s edge: the arrow holds clear of the corner, as Jaui draws it', () => {
    const edge: PopoverRect = { X: 8, Y: 300, Width: 20, Height: 20 };
    const p = PlacePopover({ Anchor: edge, Region: desktop, W: 250, H: 200, PrevDown: null, Pointing: true });
    expect(p.Arrow).toBe(POPOVER_POINTING_INSET);
    expect(parseFloat(PopoverGlassArrow(p, 250, 200).GlassArrowOffset)).toBe(POPOVER_POINTING_INSET - 125);
  });

  it('a held panel and a panel riding its anchor up keep pointing', () => {
    const opened = PlacePopover({ Anchor: word, Region: desktop, W: 250, H: 200, PrevDown: null, Pointing: true });
    const hold = { Down: opened.Down, X: opened.X, TopFromAnchor: opened.Y - word.Y };
    const held = PlacePopover({ Anchor: { ...word, X: 640 }, Region: desktop, W: 250, H: 200, PrevDown: true, Hold: hold, Pointing: true });
    expect(held.ArrowEdge).toBe('Top');
    expect(held.X + held.Arrow!).toBe(640 + word.Width / 2);
    const riding = PlacePopover({ Anchor: word, Region: desktop, W: 250, H: 200, PrevDown: null, MakingRoom: true, Pointing: true });
    expect(riding.ArrowEdge).toBe('Top');
    expect(riding.Y).toBe(word.Y + word.Height + POPOVER_ARROW_GAP);
    // The room a pointing panel asks for under its word counts the arrow's gap.
    expect(ShortfallBelow(word, desktop, 2000, false, true)).toBe(ShortfallBelow(word, desktop, 2000) + POPOVER_ARROW_GAP - 12);
  });

  it('compact width: no arrow, and the panel keeps its plain 12 pt gap', () => {
    const p = PlacePopover({ Anchor: word, Region: desktop, W: 250, H: 200, PrevDown: null, Pointing: false });
    expect(p.ArrowEdge ?? null).toBeNull();
    expect(p.Y).toBe(word.Y + word.Height + 12);
    expect(PopoverGlassArrow(p, 250, 200)).toEqual({ GlassArrow: 'None', GlassArrowOffset: '0px' });
    const beside = PlacePopover({ Anchor: { X: 40, Y: 300, Width: 70, Height: 22 }, Region: desktop, W: 250, H: 300, PrevDown: null, Beside: 448 });
    expect(beside.ArrowEdge ?? null).toBeNull();
    expect(PopoverGlassArrow(null, 250, 200).GlassArrow).toBe('None');
    expect(PopoverArrowRect(p, 200)).toBeNull();
  });

  it('a menu grown over its control (cover placement) never points, at any width, as iOS 26\'s menus do not', () => {
    const chip: PopoverRect = { X: 620, Y: 818, Width: 92, Height: 44 };
    const p = PlacePopover({ Anchor: chip, Region: desktop, W: 270, H: 286, PrevDown: null, Over: true, Pointing: true });
    expect(p.ArrowEdge ?? null).toBeNull();
    expect(p.Arrow).toBeNull();
    expect(PopoverGlassArrow(p, 270, 286).GlassArrow).toBe('None');
    const making = PlacePopover({ Anchor: chip, Region: desktop, W: 270, H: 286, PrevDown: null, Over: true, MakingRoom: true, Pointing: true });
    expect(making.ArrowEdge ?? null).toBeNull();
  });

  it('Popover points at regular width only, never over its control, and wears the arrow on its glass', () => {
    // Desktop and iPad are regular; a phone is compact.
    expect(IsRegularWidth(1440, 900)).toBe(true);
    expect(IsRegularWidth(1024, 768)).toBe(true);
    expect(IsRegularWidth(402, 874)).toBe(false);
    const popover = readFileSync(new URL('./Popover.ts', import.meta.url), 'utf-8');
    expect(popover).toContain('return !over && IsRegularWidth(canvasWidth, canvasHeight);');
    expect(popover).toContain('Over: over, MakingRoom: making, Pointing: pointing,');
    expect(popover).toContain('Object.assign(patch, PopoverGlassArrow(p, this._width(), ');
  });
});
