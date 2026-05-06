/**
 * Integration test — builds a small Jiv tree mirroring what NumberTicker
 * renders at runtime, runs the actual Jaui layout solver against it, and
 * asserts on resolved pixel positions. Catches positioning regressions
 * (layout shift between cells, slide distance off, glyph mis-centered)
 * that the pure-logic test in NumberTicker.Logic.Test.ts can't see.
 *
 * Mirrors the markup in NumberTicker.ts:
 *
 *   NumberTickerRow                       direction row, gap 0
 *     NumberTickerCell  (per character)   width = fontSize × 0.62, height = fontSize × 1.2
 *       NumberTickerStack                 column, VisualTranslate = '0 0' or '0 -<cellH>pt'
 *         NumberTickerGlyph (slot 0)      height = cellHeight
 *         NumberTickerGlyph (slot 1)      height = cellHeight
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Jiv } from '../../../../Jaui/Jaui/src/Jiv/Jiv';
import { SolveLayout } from '../../../../Jaui/Jaui/src/Layout/Layout.Solver';
import { ComputeIntrinsicSizes } from '../../../../Jaui/Jaui/src/Layout/Layout.Intrinsic';
import { type Cell, CellTranslatePt } from './NumberTicker.Logic';

beforeEach(() => {
  // Jaui test pattern — Jiv construction touches `document` for canvas
  // measurement; stub it for headless runs.
  global.document = {
    createElement: () => ({ getContext: () => null }),
  } as unknown as Document;
});

// ─── Helpers — build the same tree NumberTicker.ts renders ───

interface TickerSpec {
  fontSizePt: number;
  lineHeightRatio: number;
  cellWidthRatio: number;
  cells: Cell[];
}

const buildTicker = (spec: TickerSpec) => {
  const cellHeight = spec.fontSizePt * spec.lineHeightRatio;
  const cellWidth = spec.fontSizePt * spec.cellWidthRatio;

  // PointScale: '16' matches Jaui's SEED_CONTEXT (the seed PointScale used
  // by the Style resolver at Jiv-construction time). Layout-time resolution
  // honors the cascade we set here; the RenderStyle resolved at construction
  // uses SEED. Aligning the two means both pt-driven sizes (Width / Height
  // on ChildLayout) and pt-driven Visual* (resolved at construction) end up
  // in the same scale — the assertions then read in raw layout pixels.
  const POINT_SCALE = 16;
  const root = new Jiv({
    Width: 400 * POINT_SCALE, Height: 80 * POINT_SCALE,
    Style: { PointScale: `${POINT_SCALE}` },
    Layout: { Direction: 'Column', Justify: 'Start', Align: 'Start' },
  });

  const row = new Jiv({
    Layout: { Direction: 'Row', Justify: 'Center', Align: 'Center', Gap: '0' },
  });
  root.AddChild(row);

  const cellNodes: Jiv[] = [];
  const stackNodes: Jiv[] = [];
  for (const cell of spec.cells) {
    const cellJiv = new Jiv({
      Layout: { Direction: 'Column', Justify: 'Start', Align: 'Center' },
      ChildLayout: { Width: `${cellWidth}pt`, Height: `${cellHeight}pt` },
      Style: { Overflow: 'Hidden' as unknown as string },
    });
    const stackJiv = new Jiv({
      Layout: { Direction: 'Column', Justify: 'Start', Align: 'Center' },
      Style: { VisualTranslate: CellTranslatePt(cell, cellHeight) },
    });
    const slot0 = new Jiv({
      ChildLayout: { Height: `${cellHeight}pt` },
      Text: cell.slots[0],
    });
    const slot1 = new Jiv({
      ChildLayout: { Height: `${cellHeight}pt` },
      Text: cell.slots[1],
    });
    stackJiv.AddChild(slot0);
    stackJiv.AddChild(slot1);
    cellJiv.AddChild(stackJiv);
    row.AddChild(cellJiv);
    cellNodes.push(cellJiv);
    stackNodes.push(stackJiv);
  }

  // Hand the solver an oversized viewport so flex doesn't ever shrink
  // a cell — the cell's explicit Width/Height should always win.
  ComputeIntrinsicSizes(root, { Width: 400 * POINT_SCALE, Height: 80 * POINT_SCALE });
  const results = SolveLayout(root, { Width: 400 * POINT_SCALE, Height: 80 * POINT_SCALE });
  // Layout returns pixels at PointScale 16; convert back to pt for
  // assertion readability (assertions stay in pt-space, the unit the
  // component author actually reasons in).
  const inPt = (px: number): number => px / POINT_SCALE;
  return { root, row, cellNodes, stackNodes, results, cellWidth, cellHeight, inPt };
};

const fresh = (ch: string): Cell => ({ parity: 0, slots: [ch, ''] });

// ─── Cell layout: uniform width prevents row-shift ───

describe('NumberTicker — uniform cell width across characters', () => {
  it('every cell resolves to the same width regardless of its character', () => {
    const { cellNodes, results, inPt } = buildTicker({
      fontSizePt: 10, lineHeightRatio: 1.2, cellWidthRatio: 0.62,
      cells: [fresh('1'), fresh('4'), fresh(':'), fresh('0'), fresh('8')],
    });
    const widths = cellNodes.map(c => inPt(results.get(c)!.Width));
    const first = widths[0];
    for (const w of widths) {
      expect(w).toBeCloseTo(first, 4);
    }
  });

  it('cells line up at predictable x intervals — no layout shift', () => {
    const { cellNodes, results, cellWidth, inPt } = buildTicker({
      fontSizePt: 10, lineHeightRatio: 1.2, cellWidthRatio: 0.62,
      cells: [fresh('1'), fresh('2'), fresh('3'), fresh('4')],
    });
    const xs = cellNodes.map(c => inPt(results.get(c)!.X));
    // Each cell's X is the previous X plus exactly cellWidth.
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeCloseTo(cellWidth, 4);
    }
  });

  it('cell width tracks FontSizePx × CellWidthRatio', () => {
    const { cellNodes, results, inPt } = buildTicker({
      fontSizePt: 14, lineHeightRatio: 1.2, cellWidthRatio: 0.62,
      cells: [fresh('5')],
    });
    expect(inPt(results.get(cellNodes[0])!.Width)).toBeCloseTo(14 * 0.62, 4);
  });

  it('cell height tracks FontSizePx × LineHeightRatio', () => {
    const { cellNodes, results, inPt } = buildTicker({
      fontSizePt: 14, lineHeightRatio: 1.2, cellWidthRatio: 0.62,
      cells: [fresh('5')],
    });
    expect(inPt(results.get(cellNodes[0])!.Height)).toBeCloseTo(14 * 1.2, 4);
  });
});

// ─── Stack translate: parity drives VisualTranslateY ───

describe('NumberTicker — stack VisualTranslate resolves with parity', () => {
  it('parity 0 stack sits at translate 0 (slot 0 visible)', () => {
    const { stackNodes } = buildTicker({
      fontSizePt: 10, lineHeightRatio: 1.2, cellWidthRatio: 0.62,
      cells: [{ parity: 0, slots: ['7', ''] }],
    });
    expect(stackNodes[0].RenderStyle.VisualTranslateY).toBeCloseTo(0, 4);
  });

  it('parity 1 stack lifts by exactly one cell height', () => {
    const fontSizePt = 10;
    const lineHeightRatio = 1.2;
    const cellHeight = fontSizePt * lineHeightRatio;
    const { stackNodes, inPt } = buildTicker({
      fontSizePt, lineHeightRatio, cellWidthRatio: 0.62,
      cells: [{ parity: 1, slots: ['7', '8'] }],
    });
    // VisualTranslateY comes out in render pixels (resolved against the
    // Jiv's PointScale at construction). Convert back to pt to compare
    // against the cellHeight, which is authored in pt. Negative = the
    // stack lifts UP to expose slot 1 below the fold.
    expect(inPt(stackNodes[0].RenderStyle.VisualTranslateY)).toBeCloseTo(-cellHeight, 4);
  });

  it('mixed-parity row resolves each stack independently', () => {
    const fontSizePt = 14;
    const lineHeightRatio = 1.2;
    const cellHeight = fontSizePt * lineHeightRatio;
    const { stackNodes, inPt } = buildTicker({
      fontSizePt, lineHeightRatio, cellWidthRatio: 0.62,
      cells: [
        { parity: 0, slots: ['1', '0'] },  // slot 0 visible
        { parity: 1, slots: ['1', '2'] },  // slot 1 visible
        { parity: 0, slots: ['3', '4'] },  // slot 0 visible
      ],
    });
    expect(inPt(stackNodes[0].RenderStyle.VisualTranslateY)).toBeCloseTo(0, 4);
    expect(inPt(stackNodes[1].RenderStyle.VisualTranslateY)).toBeCloseTo(-cellHeight, 4);
    expect(inPt(stackNodes[2].RenderStyle.VisualTranslateY)).toBeCloseTo(0, 4);
  });
});

// ─── Total row width ───

describe('NumberTicker — overall row footprint', () => {
  it('row width = N × cellWidth (no extra gap, no padding)', () => {
    const { row, results, cellWidth, inPt } = buildTicker({
      fontSizePt: 10, lineHeightRatio: 1.2, cellWidthRatio: 0.62,
      cells: [fresh('1'), fresh(':'), fresh('0'), fresh('0')],
    });
    expect(inPt(results.get(row)!.Width)).toBeCloseTo(4 * cellWidth, 4);
  });
});
