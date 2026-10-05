import { describe, expect, it } from 'vitest';
import { RowIndicator, type RowIndicatorRow } from './RowIndicator';

/** A minimal stand-in for `JivHandle` — just the rect fields and the mutable `SnapLayout` flag
 *  `RowIndicator` actually reads/writes. No Jaui engine, no DOM: `RowIndicator`'s constructor takes
 *  plain thunks, so it is testable without either. */
interface FakeHandle { X: number; Y: number; Width: number; Height: number; SnapLayout: boolean }

function handle(x: number, y: number, w: number, h: number): FakeHandle {
  return { X: x, Y: y, Width: w, Height: h, SnapLayout: false };
}

function row(h: FakeHandle, disabled = false): RowIndicatorRow {
  return { Node: h as never, IsDisabled: () => disabled };
}

/** A fake `document`: just enough of the EventTarget surface `Bind` uses (`addEventListener` /
 *  `removeEventListener` for pointerdown/move/up/cancel/leave), with a `fire` helper standing in for
 *  dispatchEvent so a test can post a plain `{ clientX, clientY }` without constructing a real
 *  `PointerEvent` (this suite runs under vitest's `node` environment — no DOM, by design: the pure
 *  decision this fix lives in needs none). */
function fakeDoc() {
  const listeners = new Map<string, Set<(e: { clientX: number; clientY: number; pointerType: string }) => void>>();
  return {
    addEventListener: (type: string, fn: unknown) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn as (e: { clientX: number; clientY: number; pointerType: string }) => void);
    },
    removeEventListener: (type: string, fn: unknown) => {
      listeners.get(type)?.delete(fn as (e: { clientX: number; clientY: number; pointerType: string }) => void);
    },
    /** `pointerType` defaults to 'mouse' — every pre-existing test in this file fires bare move/leave
     *  events that never cared, and the touch-specific behavior below opts in explicitly. */
    fire: (type: string, x: number, y: number, pointerType = 'mouse') => {
      for (const fn of listeners.get(type) ?? []) fn({ clientX: x, clientY: y, pointerType });
    },
  };
}

/** The owner and the canvas are both identity here — row rects and pointer coordinates already live
 *  in the same space, which is all `_rowAt` / `_indicatorBoxFor` need to agree on for the test. */
function makeIndicator(rows: ReadonlyMap<RowIndicatorRow, FakeHandle>) {
  const owner = handle(0, 0, 300, 0);
  const indicatorNode = handle(0, 0, 0, 0);
  const canvas = { Canvas: { ClientToNodePoint: (x: number, y: number): [number, number] => [x, y] } };
  const ri = new RowIndicator(() => owner, () => canvas as never, () => indicatorNode as never);
  for (const r of rows.keys()) ri.RegisterRow(r);
  return { ri, indicatorNode, doc: fakeDoc() };
}

// The race this fix closes (RowIndicator.ts's own long comment on `_hover`): the OLD code set
// `SnapLayout = true` then cleared it on a main-thread `requestAnimationFrame`, racing the WORKER's own
// solve of the moved target — the reset could land before the worker ever saw the snap, so the
// indicator's first-ever placement sprang in from wherever it last was (visibly, the menu's own open
// morph) instead of landing on its row instantly. The fix sets `SnapLayout` synchronously, in the SAME
// call that moves the target, so ordering — not timing — guarantees it: true on arrival FROM NOWHERE,
// false on a slide BETWEEN two rows (the engine's own spring still owns that motion).
describe('RowIndicator first-placement snap (LaneM.md)', () => {
  it('snaps (SnapLayout true) the first time a row is hovered, arriving from no selection', () => {
    const h = handle(10, 50, 100, 24);
    const r = row(h);
    const { ri, indicatorNode, doc } = makeIndicator(new Map([[r, h]]));
    const unbind = ri.Bind(doc as never, () => true);

    expect(indicatorNode.SnapLayout).toBe(false);
    doc.fire('pointermove', 20, 55);

    expect(indicatorNode.SnapLayout).toBe(true);
    expect(ri.IndicatorLayout()).toEqual({ Left: '10px', Top: '50px', Width: '100px', Height: '24px' });
    unbind();
  });

  it('does NOT snap (SnapLayout false) when sliding from one row to a different row', () => {
    const hA = handle(10, 50, 100, 24);
    const hB = handle(10, 90, 100, 24);
    const rA = row(hA);
    const rB = row(hB);
    const { ri, indicatorNode, doc } = makeIndicator(new Map([[rA, hA], [rB, hB]]));
    const unbind = ri.Bind(doc as never, () => true);

    doc.fire('pointermove', 20, 55); // arrives on row A: snap.
    expect(indicatorNode.SnapLayout).toBe(true);

    doc.fire('pointermove', 20, 95); // moves to row B: must spring, not snap.
    expect(indicatorNode.SnapLayout).toBe(false);
    expect(ri.IndicatorLayout()).toEqual({ Left: '10px', Top: '90px', Width: '100px', Height: '24px' });
    unbind();
  });

  it('snaps again on the NEXT arrival after the pointer leaves and comes back', () => {
    const h = handle(10, 50, 100, 24);
    const r = row(h);
    const { ri, indicatorNode, doc } = makeIndicator(new Map([[r, h]]));
    const unbind = ri.Bind(doc as never, () => true);

    doc.fire('pointermove', 20, 55);
    expect(indicatorNode.SnapLayout).toBe(true);

    doc.fire('pointerleave', 0, 0);
    ri.Reset();
    doc.fire('pointermove', 20, 55);
    expect(indicatorNode.SnapLayout).toBe(true);
    unbind();
  });

  it('ignores a disabled row — no hover, no SnapLayout write', () => {
    const h = handle(10, 50, 100, 24);
    const r = row(h, true);
    const { ri, indicatorNode, doc } = makeIndicator(new Map([[r, h]]));
    const unbind = ri.Bind(doc as never, () => true);

    doc.fire('pointermove', 20, 55);
    expect(indicatorNode.SnapLayout).toBe(false);
    expect(ri.IndicatorLayout()).toBeUndefined();
    unbind();
  });

  it('does nothing while inactive (menu closed) — a listener left bound is a silent no-op', () => {
    const h = handle(10, 50, 100, 24);
    const r = row(h);
    const { ri, indicatorNode, doc } = makeIndicator(new Map([[r, h]]));
    const unbind = ri.Bind(doc as never, () => false);

    doc.fire('pointermove', 20, 55);
    expect(indicatorNode.SnapLayout).toBe(false);
    expect(ri.IndicatorLayout()).toBeUndefined();
    unbind();
  });
});

// Round 14, live: "a menu reopened fresh sometimes sticks on its first item" — a touch tap has no
// pointerleave of its own (a mouse moving off a row fires one; a lifted finger never does), so without
// this the pill stayed lit on whatever row the LAST tap landed on, indistinguishable from a real current
// hover the next time the same row happened to be first.
describe('RowIndicator release clears touch hover, not mouse hover (round 14)', () => {
  it('a touch release clears the hover — no stuck highlight for the next open', () => {
    const h = handle(10, 50, 100, 24);
    const r = row(h);
    const { ri, doc } = makeIndicator(new Map([[r, h]]));
    const unbind = ri.Bind(doc as never, () => true);

    doc.fire('pointerdown', 20, 55, 'touch');
    expect(ri.IndicatorClass()).not.toBe('Jwift_GlassDropdownIndicator');
    doc.fire('pointerup', 20, 55, 'touch');
    // Back to the base (Opacity: 0) class — nothing reads as hovered/pressed any more.
    expect(ri.IndicatorClass()).toBe('Jwift_GlassDropdownIndicator');
    unbind();
  });

  it('a mouse release leaves the hover alone — the cursor is still sitting right there', () => {
    const h = handle(10, 50, 100, 24);
    const r = row(h);
    const { ri, doc } = makeIndicator(new Map([[r, h]]));
    const unbind = ri.Bind(doc as never, () => true);

    doc.fire('pointerdown', 20, 55, 'mouse');
    expect(ri.IndicatorClass()).toBe('Jwift_GlassDropdownIndicator_Pressed');
    doc.fire('pointerup', 20, 55, 'mouse');
    // Press lifts, but the row is still hovered (the mouse never left it) — the "on" class, not the base one.
    expect(ri.IndicatorClass()).toBe('Jwift_GlassDropdownIndicator_On');
    unbind();
  });
});
