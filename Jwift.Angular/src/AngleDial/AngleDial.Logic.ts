/** Pure math for `<angle-dial>` — no Angular, no jaui. 0 is forward (up); clockwise is positive. */

/** Wrap any degree value into the dial's own range, `(-180, 180]`. */
export function Wrap180(deg: number): number {
  let d = deg % 360;
  if (d <= -180) d += 360;
  if (d > 180) d -= 360;
  return d;
}

/** The angle from the dial's centre to a finger offset `(dx, dy)` from it, in degrees. `atan2(dx, -dy)`
 *  rather than the usual `atan2(dy, dx)`: up is 0 (not right), and the result already increases
 *  clockwise because screen Y grows downward. */
export function AngleAt(dx: number, dy: number): number {
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

/** Snap `a` to the nearest multiple of 45 when within `withinDeg` of it (default 7); otherwise `a`
 *  unchanged. The multiple itself is wrapped, so the snap is continuous across the +-180 seam. */
export function Snap(a: number, withinDeg = 7): number {
  const nearest = Wrap180(Math.round(a / 45) * 45);
  const diff = Math.abs(Wrap180(a - nearest));
  return diff <= withinDeg ? nearest : a;
}

/** A point on the dial's ring at `angleDeg`, offset from the dial's own centre. Shared by the eight
 *  detent dots (`radius` = ring radius) and the knob (`radius` = ring radius, placed where the needle
 *  ends). */
export function DialPoint(angleDeg: number, radius: number): { X: number; Y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { X: radius * Math.sin(rad), Y: -radius * Math.cos(rad) };
}
