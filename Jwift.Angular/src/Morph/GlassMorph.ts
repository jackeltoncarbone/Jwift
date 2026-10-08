/**
 * A MENU GROWS OUT OF ITS OWN CONTROL'S GLASS (Drill Sentences lane WW1, item 3), pure so the geometry is spec'd
 * (`GlassMorph.spec.ts`).
 *
 * Jack: "I see drop downs that don't expand into new glass but spawn a new glass dropdown rather than be the root of
 * one." In iOS 26 a menu is the control's own glass, morphed: the button's capsule springs its position, its size and
 * its corner together into the menu's panel, the button's face giving way to the menu's rows, and on close the panel
 * collapses back into the button. A submenu grows inside that same glass (`PopoverMenu`'s pages), and a sheet a toolbar
 * control presents grows out of that control the same way (`Sheet.Origin`). Where the origin is a word in a sentence,
 * not a glass control, the panel grows from the word's own highlight.
 *
 * The open is a rect spring: the panel is laid out where it opens and its box starts at the origin (Jaui's
 * `MorphFrom`), its content already standing at its place and clipped by the glass as it grows. The close is a visual
 * transform, since a leaving node is no longer laid out: the panel shrinks onto the origin by a scale about its centre
 * and a translate that lands that centre on the origin's, fading as it goes. With reduced motion, or for a passive tip
 * that is no control's menu, both are a plain fade.
 */

/** A rect, canvas px. */
export interface GlassMorphRect {
  readonly X: number;
  readonly Y: number;
  readonly Width: number;
  readonly Height: number;
}

/** A rect and its corner radius, canvas px. */
export interface GlassMorphShape extends GlassMorphRect {
  readonly Radius: number;
}

/** How a panel comes and goes: grown out of its origin, or a plain fade. */
export type GlassMotion = 'Morph' | 'Fade';

/** A menu morphs; a passive tip (nothing to press, no control it belongs to) and a reader who asked for reduced motion
 *  get a plain fade. */
export function GlassMotionFor(passive: boolean, reducedMotion: boolean): GlassMotion {
  return passive || reducedMotion ? 'Fade' : 'Morph';
}

/** Whether the reader asked for reduced motion, from the document's own window. */
export function PrefersReducedMotion(doc: Document): boolean {
  return !!doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** A corner held to half the rect's short side, as the renderer draws it. */
const CornerOf = (radius: number, width: number, height: number): number =>
  Math.max(0, Math.min(radius, Math.min(width, height) / 2));

/** Where the open starts: the origin's own rect and corner (the control, or a word's highlight). `originRadius` null
 *  is a capsule, the shape every glass control and pill the editor opens a menu from wears. */
export function GlassMorphStart(origin: GlassMorphRect, originRadius: number | null): GlassMorphShape {
  const radius = originRadius ?? Infinity;
  return { X: origin.X, Y: origin.Y, Width: origin.Width, Height: origin.Height, Radius: CornerOf(radius, origin.Width, origin.Height) };
}

/** Where the open ends: the panel where it is laid out, at the height it is drawn at (no taller than `maxHeight`),
 *  its own corner. */
export function GlassMorphEnd(panel: GlassMorphRect, maxHeight: number, panelRadius: number): GlassMorphShape {
  const h = Math.min(maxHeight, panel.Height);
  return { X: panel.X, Y: panel.Y, Width: panel.Width, Height: h, Radius: CornerOf(panelRadius, panel.Width, h) };
}

/** The close as the visual transform a leaving panel takes (`VisualOrigin` its centre): the scale that shrinks it to
 *  the origin's size and the translate that lands its centre on the origin's, so the panel ends on the control. */
export interface GlassCollapse {
  readonly ScaleX: number;
  readonly ScaleY: number;
  readonly TranslateX: number;
  readonly TranslateY: number;
}

export function GlassCollapseOnto(panel: GlassMorphRect, origin: GlassMorphRect): GlassCollapse {
  const scale = (to: number, from: number): number => (from > 0 ? Math.max(0, to / from) : 1);
  return {
    ScaleX: scale(origin.Width, panel.Width),
    ScaleY: scale(origin.Height, panel.Height),
    TranslateX: (origin.X + origin.Width / 2) - (panel.X + panel.Width / 2),
    TranslateY: (origin.Y + origin.Height / 2) - (panel.Y + panel.Height / 2),
  };
}

/** The collapse as the style a leaving panel wears: `VisualScale` and `VisualTranslate` (about `VisualOrigin` 0.5 0.5). */
export function GlassCollapseStyle(c: GlassCollapse): Record<string, string> {
  return { VisualScale: `${c.ScaleX} ${c.ScaleY}`, VisualTranslate: `${c.TranslateX}px ${c.TranslateY}px` };
}
