import { describe, expect, it } from 'vitest';
import { DocumentSheetSizeFor } from './Sheet.Geometry';

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
