import { describe, expect, it } from 'vitest';
import { LensGeometry, type LensInput, type LensRect } from './SelectionIndicator.Geometry';

// The iPhone bar: 62 pt, inset 4, five 54 pt items side by side. The wide bar: 60 pt, inset 6, gap 4, content items.
const Phone = { Width: 362, Height: 62, Radius: 31 };
const PhoneItem = { Width: 70.8, Height: 54 };
const PhoneCenters = [0, 1, 2, 3, 4].map((i) => 4 + PhoneItem.Width * (i + 0.5));
const Desktop = { Width: 420, Height: 60, Radius: 30 };
const DesktopItems = [96, 120, 88, 92];
const DesktopCenters = DesktopItems.map((w, i) => 6 + DesktopItems.slice(0, i).reduce((a, b) => a + b + 4, 0) + w / 2);

const tab = (bar: LensInput['Bar'], center: number, width: number, height: number, patch: Partial<LensInput> = {}): LensRect =>
  LensGeometry({ Bar: bar, Center: center, Width: width, Height: height, OutsetX: 8, OutsetY: 8, Lift: 0, Squash: 1, ...patch });

/** Concentric with the bar: centred on its height, its corner the bar's less its inset, its ends no nearer. */
const expectConcentric = (lens: LensRect, bar: LensInput['Bar']): void => {
  expect(lens.Top).toBeCloseTo(lens.Inset, 6);
  expect(bar.Height - (lens.Top + lens.Height)).toBeCloseTo(lens.Inset, 6);
  expect(lens.Radius).toBeCloseTo(bar.Radius - lens.Inset, 6);
  expect(lens.Radius).toBeCloseTo(lens.Height / 2, 6);
  expect(lens.Left).toBeGreaterThanOrEqual(lens.Inset - 1e-9);
  expect(bar.Width - (lens.Left + lens.Width)).toBeGreaterThanOrEqual(lens.Inset - 1e-9);
};

describe('LensGeometry on the iPhone bar', () => {
  it('rests on its item: 54 pt, inset 4, radius 27', () => {
    const lens = tab(Phone, PhoneCenters[0], PhoneItem.Width, PhoneItem.Height);
    expect(lens).toMatchObject({ Left: 4, Top: 4, Width: PhoneItem.Width, Height: 54, Inset: 4 });
    expect(lens.Radius).toBeCloseTo(27, 6);
    expectConcentric(lens, Phone);
  });

  it('lifts by bounds to the item plus 8 a side: 70 pt, riding 4 past the bar, radius 35', () => {
    for (const center of PhoneCenters) {
      const lens = tab(Phone, center, PhoneItem.Width, PhoneItem.Height, { Lift: 1 });
      expect(lens.Width).toBeCloseTo(PhoneItem.Width + 16, 6);
      expect(lens.Height).toBeCloseTo(70, 6);
      expect(lens.Inset).toBeCloseTo(-4, 6);
      expect(lens.Radius).toBeCloseTo(35, 6);
      expect(lens.Left + lens.Width / 2).toBeCloseTo(center, 6);
      expectConcentric(lens, Phone);
    }
    // At the end tab the lifted lens's end is exactly as far past the bar as its top.
    const first = tab(Phone, PhoneCenters[0], PhoneItem.Width, PhoneItem.Height, { Lift: 1 });
    expect(first.Left).toBeCloseTo(first.Inset, 6);
  });

  it('stays concentric through the lift spring, overshoot included', () => {
    for (const lift of [0.25, 0.5, 0.75, 1.07]) {
      const lens = tab(Phone, PhoneCenters[4], PhoneItem.Width, PhoneItem.Height, { Lift: lift });
      expect(lens.Inset).toBeCloseTo(4 - 8 * lift, 6);
      expectConcentric(lens, Phone);
      expect(Phone.Width - (lens.Left + lens.Width)).toBeCloseTo(lens.Inset, 6);
    }
  });

  it('mid-drag follows the finger, squashed about its centre keeping its area', () => {
    const lens = tab(Phone, 150, PhoneItem.Width, PhoneItem.Height, { Lift: 1, Squash: 1.1 });
    expect(lens.Left + lens.Width / 2).toBeCloseTo(150, 6);
    expect(lens.Width * lens.Height).toBeCloseTo((PhoneItem.Width + 16) * 70, 4);
    expectConcentric(lens, Phone);
  });

  it('mid-drag past either end holds its end at its own inset, squashed wide or narrow', () => {
    for (const squash of [0.75, 0.9, 1, 1.1, 1.15]) {
      const left = tab(Phone, -80, PhoneItem.Width, PhoneItem.Height, { Lift: 1, Squash: squash });
      expect(left.Left).toBeCloseTo(left.Inset, 6);
      expectConcentric(left, Phone);
      const right = tab(Phone, Phone.Width + 80, PhoneItem.Width, PhoneItem.Height, { Lift: 1, Squash: squash });
      expect(Phone.Width - (right.Left + right.Width)).toBeCloseTo(right.Inset, 6);
      expectConcentric(right, Phone);
    }
  });

  it('narrows no further than square, so it stays a capsule along the bar', () => {
    const lens = tab(Phone, 150, PhoneItem.Width, PhoneItem.Height, { Lift: 1, Squash: 0.75 });
    expect(lens.Width).toBeCloseTo(lens.Height, 6);
    expect(lens.Width * lens.Height).toBeCloseTo((PhoneItem.Width + 16) * 70, 4);
    expectConcentric(lens, Phone);
  });

  it('holds the unsquashed lifted lens on the end item, where UIKit clamps the finger', () => {
    const lens = tab(Phone, 0, PhoneItem.Width, PhoneItem.Height, { Lift: 1 });
    expect(lens.Left + lens.Width / 2).toBeCloseTo(PhoneCenters[0], 6);
  });
});

describe('LensGeometry on the wide bar', () => {
  it('rests on each item: inset 6, radius 24', () => {
    DesktopItems.forEach((width, i) => {
      const lens = tab(Desktop, DesktopCenters[i], width, 48);
      expect(lens.Left + lens.Width / 2).toBeCloseTo(DesktopCenters[i], 6);
      expect(lens.Inset).toBeCloseTo(6, 6);
      expect(lens.Radius).toBeCloseTo(24, 6);
      expectConcentric(lens, Desktop);
    });
    expect(tab(Desktop, DesktopCenters[0], DesktopItems[0], 48).Left).toBeCloseTo(6, 6);
  });

  it('lifts to 64 pt, riding 2 past the bar, radius 32, the end tab concentric', () => {
    const last = DesktopItems.length - 1;
    const lens = tab(Desktop, DesktopCenters[last], DesktopItems[last], 48, { Lift: 1 });
    expect(lens.Height).toBeCloseTo(64, 6);
    expect(lens.Inset).toBeCloseTo(-2, 6);
    expect(lens.Radius).toBeCloseTo(32, 6);
    expect(Desktop.Width - (lens.Left + lens.Width)).toBeCloseTo(-2, 6);
    expectConcentric(lens, Desktop);
  });

  it('mid-drag and mid-lift stays concentric anywhere along the bar', () => {
    for (const center of [-50, 40, 210, 380, 500]) {
      for (const lift of [0.4, 1]) {
        for (const squash of [0.8, 1, 1.12]) {
          expectConcentric(tab(Desktop, center, 104, 48, { Lift: lift, Squash: squash }), Desktop);
        }
      }
    }
  });
});

describe('LensGeometry edges', () => {
  it('keeps a segmented lens concentric at the ends although it reaches 12 across', () => {
    const segmented = { Width: 240, Height: 36, Radius: 18 };
    const lens = tab(segmented, 60, 116, 28, { OutsetX: 12, Lift: 1 });
    expect(lens.Width).toBeCloseTo(140, 6);
    expect(lens.Left).toBeCloseTo(lens.Inset, 6);
    expectConcentric(lens, segmented);
  });

  it('centres a lens wider than its bar', () => {
    const accessory = { Width: 62, Height: 62, Radius: 31 };
    const lens = tab(accessory, 31, 54, 54, { Lift: 1, Squash: 1.1 });
    expect(lens.Left + lens.Width / 2).toBeCloseTo(31, 6);
    expect(lens.Radius).toBeLessThanOrEqual(lens.Width / 2 + 1e-9);
  });

  it('takes the concentric corner of a bar that is not a capsule, clamped to the lens', () => {
    const card = { Width: 300, Height: 60, Radius: 20 };
    const lens = tab(card, 150, 80, 48);
    expect(lens.Radius).toBeCloseTo(14, 6);
  });
});
