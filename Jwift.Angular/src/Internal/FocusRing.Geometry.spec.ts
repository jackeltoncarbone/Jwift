import { describe, expect, it } from 'vitest';
import { FOCUS_RING_GAP_PT, FocusRingGeometryOf, ParsePt } from './FocusRing.Geometry';

describe('ParsePt', () => {
  it('reads a pt length the way a resolved JSS Style bag gives one', () => {
    expect(ParsePt('24pt')).toBe(24);
    expect(ParsePt('999pt')).toBe(999);
    expect(ParsePt('0pt')).toBe(0);
    expect(ParsePt('14.5pt')).toBe(14.5);
  });

  it('reads a bare finite number (a direct style-override channel, never JSS text)', () => {
    expect(ParsePt(14)).toBe(14);
    expect(ParsePt(0)).toBe(0);
  });

  it('is null for anything it cannot read as one pt length — never a wrong number', () => {
    expect(ParsePt(undefined)).toBeNull();
    expect(ParsePt(null)).toBeNull();
    expect(ParsePt('4 4 0 0')).toBeNull(); // a per-corner shorthand: no single radius to ring around
    expect(ParsePt('auto')).toBeNull();
    expect(ParsePt('24px')).toBeNull(); // the wrong unit, not Jaui's own pt
    expect(ParsePt(Number.NaN)).toBeNull();
  });
});

describe('FocusRingGeometryOf — concentric with the ringed control', () => {
  it("radius is the control's own radius plus the gap, exactly the blind-test finding's formula", () => {
    expect(FocusRingGeometryOf(24).RadiusPt).toBe(24 + FOCUS_RING_GAP_PT);
    expect(FocusRingGeometryOf(14).RadiusPt).toBe(14 + FOCUS_RING_GAP_PT);
    expect(FocusRingGeometryOf(999).RadiusPt).toBe(999 + FOCUS_RING_GAP_PT); // a capsule stays a capsule
    expect(FocusRingGeometryOf(0).RadiusPt).toBe(FOCUS_RING_GAP_PT); // a square corner still gets the gap's own curve
  });

  it('AttachInset is the gap\'s negative, so Attach/Fill grows the box outward, never inward', () => {
    expect(FocusRingGeometryOf(24).AttachInsetPt).toBe(-FOCUS_RING_GAP_PT);
    expect(FocusRingGeometryOf(24).AttachInsetPt).toBeLessThan(0);
  });

  it('an unreadable control radius leaves the ring with no radius override, never a guessed one', () => {
    expect(FocusRingGeometryOf(null).RadiusPt).toBeNull();
  });

  it('a caller may widen the gap; the radius grows with it and the inset stays its negative — concentricity holds at any gap', () => {
    const g = FocusRingGeometryOf(24, 4);
    expect(g.RadiusPt).toBe(28);
    expect(g.AttachInsetPt).toBe(-4);
  });
});
