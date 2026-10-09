import { describe, expect, it } from 'vitest';
import { TitleChevronClass, TitleLabelClass } from './TitleButton.Classes';

/**
 * Drill Sentences lane AD1, item 1 (a round 18 blind tester, light theme, desktop and phone: the drill
 * editor's own title and its chevron read near-black over the dark field, the chevron nearly invisible,
 * while the toolbar's glass buttons beside them had already flipped to their dark face over that same
 * backdrop). `onScene` joins `JwiftLabelOnScene`/`JwiftSecondaryLabelOnScene` in beside the usual geometry
 * class — a flat, opaque ink stated outright, never the app's `@Dark`/`@Light` theme a scene the app does
 * not own never follows, and never a vibrancy blend sampling a backdrop with no known bound.
 */
describe('TitleLabelClass / TitleChevronClass: the title and its chevron over a scene state a flat ink outright', () => {
  it('off the scene (every other page this component serves): the plain geometry class alone, the usual theme-weighted ink', () => {
    expect(TitleLabelClass(false)).toBe('Jwift_ToolbarTitle Jwift_TitleButtonLabel');
    expect(TitleChevronClass(false)).toBe('Jwift_TitleButtonChevron');
  });

  it('on a scene (the drill field, a picture, an animation): the OnScene ink class joins in, geometry untouched', () => {
    expect(TitleLabelClass(true)).toBe('Jwift_ToolbarTitle JwiftLabelOnScene Jwift_TitleButtonLabel');
    expect(TitleChevronClass(true)).toBe('Jwift_TitleButtonChevron JwiftSecondaryLabelOnScene');
  });

  // The geometry class leads and the OnScene ink class trails in both strings: Styling.md's own merge order
  // ("merged left-to-right... last one wins") means the class listed second is the one whose Color/TextFilter
  // actually paints, the same order `Sheet.ts` already layers `JwiftProminentInk` after `Jwift_SheetBarGlyph`.
  it('the geometry class always leads, the OnScene ink class always trails, so OnScene is the one that wins', () => {
    expect(TitleLabelClass(true).indexOf('Jwift_ToolbarTitle')).toBeLessThan(TitleLabelClass(true).indexOf('JwiftLabelOnScene'));
    expect(TitleChevronClass(true).indexOf('Jwift_TitleButtonChevron')).toBeLessThan(TitleChevronClass(true).indexOf('JwiftSecondaryLabelOnScene'));
  });
});
