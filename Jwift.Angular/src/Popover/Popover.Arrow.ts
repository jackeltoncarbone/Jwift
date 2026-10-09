/**
 * THE POPOVER'S ARROW, ON ITS OWN GLASS (Drill Sentences lane GL4). Three blind rounds read the word popovers (the count
 * wheel, the who / mirror chooser) as floating panels with nothing tying them to their word. On macOS and on iPadOS at
 * regular width a popover's glass is one shape, the rounded body and an arrow whose tip points at the source
 * (Jwift/Apple/Sizing.md 13 [C]: 13 pt tall on a 26 pt base, `_UIPopoverShapePathProviderIOS`), and the glass's rim,
 * lens and shadow follow that whole outline. Jaui draws it as `GlassArrow` on the panel's own glass (Glass.Jss.md).
 *
 * Pure: a placement in, the panel's style patch out. The arrow stands on the edge the placement names (`ArrowEdge`, set
 * only at regular width and never on a menu grown over its control) at the placement's `Arrow`, which is measured from
 * the panel's left or top; Jaui takes it from the edge's centre, as UIKit's `arrowOffset` is.
 */
import type { PopoverPlacement } from './Popover.Placement';

export interface PopoverGlassArrowStyle {
  readonly GlassArrow: 'None' | 'Top' | 'Bottom' | 'Leading';
  readonly GlassArrowOffset: string;
}

/** The glass arrow a placed panel `width` wide and `height` tall wears: none unless it points. */
export function PopoverGlassArrow(p: PopoverPlacement | null, width: number, height: number): PopoverGlassArrowStyle {
  const edge = p?.ArrowEdge ?? null;
  if (!p || edge === null || p.Arrow === null) return { GlassArrow: 'None', GlassArrowOffset: '0px' };
  const length = edge === 'Leading' ? height : width;
  const offset = Math.round((p.Arrow - length / 2) * 100) / 100;
  return { GlassArrow: edge, GlassArrowOffset: `${offset}px` };
}
