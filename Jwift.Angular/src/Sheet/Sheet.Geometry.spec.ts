import { describe, expect, it } from 'vitest';
import { DocumentSheetSizeFor, SheetFaceAlpha, SHEET_METRICS } from './Sheet.Geometry';

// A DOCUMENT sheet (Quick Look's own reading) takes most of the window rather than Apple's small centered
// form — the export preview's own reason for opting in (`Export.PreviewLayout` wide-screen bug).
describe('DocumentSheetSizeFor', () => {
  const config = { WidthFraction: 0.96, MaxWidth: 1400, HeightFraction: 0.9 };

  it('takes a fraction of a narrow window, well under the max', () => {
    const size = DocumentSheetSizeFor(900, 700, config);
    expect(size.Width).toBeCloseTo(900 * 0.96, 5);
    expect(size.Height).toBeCloseTo(700 * 0.9, 5);
  });

  it('caps at the max width on a very wide window rather than growing without bound', () => {
    const size = DocumentSheetSizeFor(1877, 1252, config);
    expect(size.Width).toBe(1400);
    expect(size.Height).toBeCloseTo(1252 * 0.9, 5);
  });
});

// THE FACE: glass never turns into a flat opaque plate (Jack's departure from Apple's actual opaque `@Sheet`
// above half height, Sheets.md section 2). A translucent white/black face fades in over the still-glass card
// instead, and this is its alpha law: zero at and below GlassBelow, never fully opaque, continuous in between.
describe('SheetFaceAlpha', () => {
  it('is invisible at and below the glass threshold', () => {
    expect(SheetFaceAlpha(0)).toBe(0);
    expect(SheetFaceAlpha(SHEET_METRICS.GlassBelow)).toBe(0);
  });

  it('rises continuously past the threshold, never snapping', () => {
    const quarter = SheetFaceAlpha(SHEET_METRICS.GlassBelow + (1 - SHEET_METRICS.GlassBelow) * 0.25);
    const half = SheetFaceAlpha(SHEET_METRICS.GlassBelow + (1 - SHEET_METRICS.GlassBelow) * 0.5);
    const threeQuarter = SheetFaceAlpha(SHEET_METRICS.GlassBelow + (1 - SHEET_METRICS.GlassBelow) * 0.75);
    expect(quarter).toBeGreaterThan(0);
    expect(half).toBeGreaterThan(quarter);
    expect(threeQuarter).toBeGreaterThan(half);
    expect(threeQuarter).toBeLessThan(SHEET_METRICS.FaceMax);
  });

  it('reaches its max at a full height, and never goes fully opaque', () => {
    expect(SheetFaceAlpha(1)).toBe(SHEET_METRICS.FaceMax);
    expect(SheetFaceAlpha(1)).toBeLessThan(1);
  });

  it('clamps past a full height rather than overshooting', () => {
    expect(SheetFaceAlpha(1.4)).toBe(SHEET_METRICS.FaceMax);
  });
});
