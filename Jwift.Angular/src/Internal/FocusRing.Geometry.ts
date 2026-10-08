/**
 * Apple's keyboard focus ring (HIG Full Keyboard Access) — geometry only, no Angular, no jaui imports,
 * cheap to unit test (same contract as `TokenSentence.Layout.ts`). The ring sits OUTSIDE the focused
 * control, concentric with it: its own radius is the control's radius plus the gap, and its box is the
 * control's own rect expanded by that same gap on every side. `JivHost` attaches the ring with
 * `ChildLayout.AttachMode: 'Fill'` against the control and this geometry's `AttachInsetPt` as a NEGATIVE
 * inset — `Layout.Solver.ts`'s own Attach/Fill math (`target.Width - left - right`) turns a negative
 * inset into an outward expansion, which is the only part of this that is Jaui-specific; everything here
 * is plain arithmetic.
 *
 * Numbers: blind round 27's own finding ("an accent colored ring about 3 to 4 pt wide just outside the
 * control") is the only spec either sheet or control states; `FOCUS_RING_WIDTH_PT` takes its midpoint,
 * and `FOCUS_RING_GAP_PT` is the small standing gap before the stroke starts, matching the system ring's
 * own two-part shape (gap, then stroke) rather than painting straight off the control's own edge.
 */

/** The ring's own stroke width, pt — the "3 to 4 pt wide" half of the finding. */
export const FOCUS_RING_WIDTH_PT = 3.5;

/** The gap between the control's own edge and the ring's nearer edge, pt. */
export const FOCUS_RING_GAP_PT = 2;

export interface FocusRingGeometry {
  /** The ring's own `ChildLayout.AttachInset`, uniform on all four sides: the gap's negative, so
   *  Jaui's Attach/Fill math expands the ring's box outward instead of shrinking it inward. */
  readonly AttachInsetPt: number;
  /** The ring's own `BorderRadius`, concentric with the control: the control's corner radius plus the
   *  same gap its box was expanded by — the finding's own formula, "the control's radius plus the gap".
   *  `null` when the control's own radius could not be read (an unparsed or absent `BorderRadius`), so a
   *  caller can leave `BorderRadius` unset rather than ring a control at a guessed number. */
  readonly RadiusPt: number | null;
}

/** `value` as Jaui hands it off a resolved JSS `Style` bag — typically `"24pt"`, sometimes a bare
 *  number already (a direct style-override channel, never JSS text). `null` for anything that is not
 *  one readable pt length (a per-corner shorthand, `undefined`, `NaN`, a non-pt unit) — a shape this
 *  function cannot read a single radius off is a shape the ring must not guess at. */
export function ParsePt(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = /^(-?\d+(?:\.\d+)?)\s*pt$/.exec(value.trim());
  if (!match) return null;
  const n = Number.parseFloat(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** The focused control's own ring geometry, concentric at any gap (`gap` defaults to the system one,
 *  `FOCUS_RING_GAP_PT`). `controlRadiusPt` is the control's OWN resolved `BorderRadius` in pt (`ParsePt`
 *  of its Style bag), or `null` if that could not be read. */
export function FocusRingGeometryOf(controlRadiusPt: number | null, gap: number = FOCUS_RING_GAP_PT): FocusRingGeometry {
  return {
    AttachInsetPt: -gap,
    RadiusPt: controlRadiusPt === null ? null : controlRadiusPt + gap,
  };
}
