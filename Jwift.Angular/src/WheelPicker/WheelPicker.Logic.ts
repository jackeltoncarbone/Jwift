/**
 * Pure logic for the Jwift WheelPicker primitive. Lives apart from the
 * Angular component so the cylinder projection is unit-testable without a
 * Jaui canvas or a TestBed.
 *
 * Jaui's canvas compositor is 2D affine — translate / scale / in-plane rotate
 * / skew, but NO `rotateX` / `perspective` / Z (the original DOM picker leaned
 * on all three). So the wheel is reproduced as the orthographic PROJECTION of
 * the same cylinder: an item's angle on the drum (φ ∝ its distance from the
 * selection center) maps to a vertical offset (R·sinφ — rows bunch toward the
 * rim) and a VERTICAL-ONLY foreshorten (ScaleY = cosφ — rows keep their width
 * and squish in Y as they tip away, exactly what Apple's rotateX produces),
 * plus an edge fade. ScaleX stays 1 — Apple's picker never shrinks rows
 * horizontally. A true 3D drum would need perspective added to the engine.
 */

export interface WheelGeometry {
  /** Height of one row's band, px. Sets row spacing AND the drum's tooth pitch. */
  ItemHeight: number;
  /** Cylinder radius, px. Larger = flatter wheel (gentler bunching). */
  Radius: number;
  /** Items past this tip angle (deg) are clamped flat and fully faded. */
  MaxAngleDeg: number;
  /** Fade begins at this tip angle (deg); opacity ramps 1→0 from here to MaxAngle. */
  FadeStartDeg: number;
  /** Vertical foreshorten floor — ScaleY at the rim (cosφ→0 would collapse the
   *  row to a line; this keeps a floor so it never degenerates). */
  ScaleFloor: number;
}

export const DefaultWheelGeometry: WheelGeometry = {
  ItemHeight: 34,
  Radius: 90,
  MaxAngleDeg: 90,
  FadeStartDeg: 55,
  ScaleFloor: 0.1,
};

export interface SlotProjection {
  /** Vertical offset from the selection center, px (R·sinφ). */
  TranslateY: number;
  /** Vertical foreshorten in [ScaleFloor, 1] (cosφ). X is always 1 — Apple's
   *  drum compresses rows vertically only, never horizontally. */
  ScaleY: number;
  /** Visibility in [0, 1]. */
  Opacity: number;
}

/** Degrees of drum rotation per row — the tooth pitch. Small itemHeight or
 *  large radius ⇒ fewer degrees per row ⇒ a flatter, slower-curving wheel. */
export const DegreesPerItem = (g: WheelGeometry): number =>
  (180 / Math.PI) * (g.ItemHeight / g.Radius);

/** Clamp a (possibly fractional, mid-drag) scroll position to the valid index
 *  range. `count` is the item total; an empty wheel pins at 0. */
export const ClampPosition = (position: number, count: number): number =>
  count <= 0 ? 0 : Math.max(0, Math.min(count - 1, position));

/** Nearest settled index for a scroll position. */
export const NearestIndex = (position: number, count: number): number =>
  count <= 0 ? 0 : Math.max(0, Math.min(count - 1, Math.round(position)));

/**
 * Project one row onto the 2D drum. `distance` is the row's signed offset
 * from the selection center in rows (index − scrollPosition): 0 is centered,
 * positive is below, negative is above.
 */
export const ProjectSlot = (distance: number, g: WheelGeometry): SlotProjection => {
  const angleDeg = distance * DegreesPerItem(g);
  const absAngle = Math.abs(angleDeg);

  // Beyond the rim the row is flat against the drum's far side — pin it at the
  // rim position, fully transparent, so it parks instead of inverting.
  if (absAngle >= g.MaxAngleDeg) {
    const sign = Math.sign(angleDeg) || 1;
    const phiMax = (g.MaxAngleDeg * Math.PI) / 180;
    return {
      TranslateY: sign * g.Radius * Math.sin(phiMax),
      ScaleY: g.ScaleFloor,
      Opacity: 0,
    };
  }

  const phi = (angleDeg * Math.PI) / 180;
  const translateY = g.Radius * Math.sin(phi);
  const scaleY = Math.max(g.ScaleFloor, Math.cos(phi));

  let opacity = 1;
  if (absAngle >= g.FadeStartDeg) {
    opacity = 1 - (absAngle - g.FadeStartDeg) / (g.MaxAngleDeg - g.FadeStartDeg);
  }

  return { TranslateY: translateY, ScaleY: scaleY, Opacity: opacity };
};
