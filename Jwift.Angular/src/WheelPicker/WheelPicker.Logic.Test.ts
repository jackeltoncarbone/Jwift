import { describe, it, expect } from 'vitest';
import {
  ClampPosition,
  DefaultWheelGeometry,
  DegreesPerItem,
  NearestIndex,
  ProjectSlot,
  type WheelGeometry,
} from './WheelPicker.Logic';

const G: WheelGeometry = DefaultWheelGeometry;

describe('ProjectSlot — centered row', () => {
  it('is identity at the selection center', () => {
    const p = ProjectSlot(0, G);
    expect(p.TranslateY).toBeCloseTo(0, 6);
    expect(p.ScaleY).toBeCloseTo(1, 6);
    expect(p.Opacity).toBe(1);
  });
});

describe('ProjectSlot — symmetry + falloff', () => {
  it('mirrors above/below the center', () => {
    const up = ProjectSlot(-1.5, G);
    const down = ProjectSlot(1.5, G);
    expect(up.TranslateY).toBeCloseTo(-down.TranslateY, 6);
    expect(up.ScaleY).toBeCloseTo(down.ScaleY, 6);
    expect(up.Opacity).toBeCloseTo(down.Opacity, 6);
  });

  it('translates the same sign as the distance (below is positive Y)', () => {
    expect(ProjectSlot(1, G).TranslateY).toBeGreaterThan(0);
    expect(ProjectSlot(-1, G).TranslateY).toBeLessThan(0);
  });

  it('compresses vertically and dims monotonically as a row leaves the center', () => {
    const near = ProjectSlot(1, G);
    const far = ProjectSlot(2, G);
    expect(far.ScaleY).toBeLessThan(near.ScaleY);
    expect(far.Opacity).toBeLessThanOrEqual(near.Opacity);
    expect(near.ScaleY).toBeGreaterThanOrEqual(G.ScaleFloor);
  });
});

describe('ProjectSlot — beyond the rim', () => {
  it('parks fully transparent at the floor scale past MaxAngle', () => {
    // DegreesPerItem ≈ 21.6° for the defaults, so distance 5 (~108°) is past the 90° rim.
    const p = ProjectSlot(5, G);
    expect(p.Opacity).toBe(0);
    expect(p.ScaleY).toBeCloseTo(G.ScaleFloor, 6);
  });
});

describe('DegreesPerItem', () => {
  it('flattens (fewer degrees per row) as the radius grows', () => {
    const tight = DegreesPerItem({ ...G, Radius: 60 });
    const flat = DegreesPerItem({ ...G, Radius: 120 });
    expect(flat).toBeLessThan(tight);
  });
});

describe('ClampPosition / NearestIndex', () => {
  it('clamps to the valid index range', () => {
    expect(ClampPosition(-3, 5)).toBe(0);
    expect(ClampPosition(9, 5)).toBe(4);
    expect(ClampPosition(2.4, 5)).toBe(2.4);
  });

  it('pins at 0 for an empty wheel', () => {
    expect(ClampPosition(2, 0)).toBe(0);
    expect(NearestIndex(2, 0)).toBe(0);
  });

  it('rounds to the nearest settled index', () => {
    expect(NearestIndex(2.4, 5)).toBe(2);
    expect(NearestIndex(2.6, 5)).toBe(3);
  });
});
