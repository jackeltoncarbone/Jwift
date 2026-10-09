import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  GlassCollapseOnto, GlassCollapseStyle, GlassMorphEnd, GlassMorphStart, GlassMotionFor, type GlassMorphRect,
} from './GlassMorph';

const POPOVER = readFileSync(new URL('../Popover/Popover.ts', import.meta.url), 'utf-8');
const POPOVER_JSS = readFileSync(new URL('../Popover/Popover.jss', import.meta.url), 'utf-8').replace(/\r\n/g, '\n');
const MENU_JSS = readFileSync(new URL('../Popover/PopoverMenu.jss', import.meta.url), 'utf-8').replace(/\r\n/g, '\n');

// Drill Sentences lane WW1, item 3: a menu grows out of its own control's glass, as iOS 26's does, and collapses back.

/** The player's phrase chip ("M5-12 ⌄"), a 44pt capsule, and the menu it opens under it. */
const chip: GlassMorphRect = { X: 70, Y: 1260, Width: 210, Height: 44 };
const menu: GlassMorphRect = { X: 20, Y: 1316, Width: 280, Height: 420 };

describe('the open starts on the control and ends on the panel', () => {
  it('starts at the control\'s own rect, a capsule\'s corner when it gives none', () => {
    expect(GlassMorphStart(chip, null)).toEqual({ ...chip, Radius: 22 });
  });

  it('a word in a sentence starts from its own highlight, at the highlight\'s corner', () => {
    const word: GlassMorphRect = { X: 120, Y: 400, Width: 64, Height: 24 };
    expect(GlassMorphStart(word, 7)).toEqual({ ...word, Radius: 7 });
  });

  it('a corner past half the short side is drawn as half of it, as the renderer draws it', () => {
    expect(GlassMorphStart({ X: 0, Y: 0, Width: 40, Height: 40 }, 32).Radius).toBe(20);
  });

  it('ends at the panel as laid out, no taller than its room, at the panel\'s own corner', () => {
    expect(GlassMorphEnd(menu, 600, 32)).toEqual({ ...menu, Radius: 32 });
    expect(GlassMorphEnd(menu, 300, 32)).toEqual({ ...menu, Height: 300, Radius: 32 });
  });

  it('a one row panel ends a capsule: its corner held to half its height', () => {
    expect(GlassMorphEnd({ ...menu, Height: 48 }, 600, 32).Radius).toBe(24);
  });
});

describe('the close collapses the panel onto the control', () => {
  it('scales to the control\'s size about the panel\'s centre and lands that centre on the control\'s', () => {
    const c = GlassCollapseOnto(menu, chip);
    expect(c.ScaleX).toBeCloseTo(210 / 280, 9);
    expect(c.ScaleY).toBeCloseTo(44 / 420, 9);
    // The panel's centre (160, 1526) moves to the chip's (175, 1282).
    expect(c.TranslateX).toBeCloseTo(15, 9);
    expect(c.TranslateY).toBeCloseTo(-244, 9);
    // So its corners land on the control's: x' = centre + scale x (x - centre) + translate.
    const left = 160 + c.ScaleX * (menu.X - 160) + c.TranslateX;
    const top = 1526 + c.ScaleY * (menu.Y - 1526) + c.TranslateY;
    expect(left).toBeCloseTo(chip.X, 9);
    expect(top).toBeCloseTo(chip.Y, 9);
  });

  it('as the style a leaving panel wears', () => {
    expect(GlassCollapseStyle({ ScaleX: 0.5, ScaleY: 0.25, TranslateX: -3, TranslateY: 12 }))
      .toEqual({ VisualScale: '0.5 0.25', VisualTranslate: '-3px 12px' });
  });

  it('a panel with no size yet keeps its scale', () => {
    expect(GlassCollapseOnto({ X: 0, Y: 0, Width: 0, Height: 0 }, chip)).toMatchObject({ ScaleX: 1, ScaleY: 1 });
  });
});

describe('a menu morphs, a tip fades, and nothing here branches on reduced motion', () => {
  it('by the panel\'s role alone', () => {
    expect(GlassMotionFor(false)).toBe('Morph');
    expect(GlassMotionFor(true)).toBe('Fade');
  });

  it('never reads a reduced-motion preference: retired (round 28, finding 1 -- the screenshot scripts\' own ' +
    '`reducedMotion: \'reduce\'` used to drop every word popover to a flat cross-fade)', () => {
    expect(GlassMotionFor.length).toBe(1);
  });
});

describe('the popover wears it', () => {
  it('opens the frame after its first placement, from its origin, in the same batch as the shown class', () => {
    expect(POPOVER).toContain('this.Node.MorphFrom(start);');
    expect(POPOVER).toContain("this.SetStyleOverrideNow({ BorderRadius: `${start.Radius}px` });");
    expect(POPOVER).toContain("if (!origin || GlassMotionFor(this.PassThrough()) === 'Fade') {");
  });

  it('leaves collapsing onto its origin', () => {
    expect(POPOVER).toContain('Object.assign(leave, GlassCollapseStyle(GlassCollapseOnto(');
    expect(POPOVER_JSS).toMatch(/^Jwift_Popover_Closing : Jwift_Popover \{\n  VisualOrigin: 0\.5 0\.5\n/m);
  });

  it('the glass is there at once when it grows, and fades when it does not', () => {
    expect(POPOVER_JSS).toMatch(/^Jwift_Popover_Morph : Jwift_Popover \{\n  Opacity: 1\n  @Transition Opacity \{ Duration: 0ms \}\n\}/m);
    expect(POPOVER_JSS).toMatch(/^Jwift_Popover_Fade : Jwift_Popover \{\n  Opacity: 1\n  @Transition Opacity \{ Duration: 200ms \}\n\}/m);
  });

  it('a submenu\'s page cross fades inside the same glass', () => {
    for (const cls of ['Jwift_PopoverMenuItem', 'Jwift_PopoverMenuBack', 'Jwift_PopoverMenuHeader', 'Jwift_PopoverMenuSeparator', 'Jwift_PopoverMenuNote']) {
      expect(MENU_JSS, cls).toMatch(new RegExp(`^${cls} : Jwift_PopoverMenuPageFade(, \\w+)? \\{`, 'm'));
    }
    expect(MENU_JSS).toMatch(/^Jwift_PopoverMenuPageFade \{\n  Opacity: Presence\n/m);
  });
});
