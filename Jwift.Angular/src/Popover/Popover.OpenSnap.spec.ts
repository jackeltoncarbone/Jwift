import { describe, expect, it } from 'vitest';
import { OpenSnap, type SnapNode } from './Popover.OpenSnap';

// Drill Sentences lane DD2, item 1 (blind phone testers): the count wheel's first four − taps did nothing
// while the wheel was still sliding into place, and the who grid's cells the same.

/** A node of the popover's subtree: its box as the engine draws it this frame, where layout wants it, and
 *  the snap flag the engine reads. */
interface Box extends SnapNode {
  readonly Name: string;
  X: number; Y: number; readonly W: number; readonly H: number;
  TargetX: number; TargetY: number;
  readonly Children: Box[];
}

const box = (Name: string, X: number, Y: number, W: number, H: number, Children: Box[] = []): Box =>
  ({ Name, X, Y, W, H, TargetX: X, TargetY: Y, SnapLayout: false, Children });

const all = (root: Box): Box[] => [root, ...root.Children.flatMap(all)];

/** One frame of the engine's layout pass, the way `Jaui.ts` runs a node's rect spring: a snapping node
 *  stands on its target at once, any other covers part of the way there (a critically damped spring at
 *  60fps covers well under a fifth of the distance on its first frame). */
function frame(root: Box): void {
  for (const n of all(root)) {
    if (n.SnapLayout) { n.X = n.TargetX; n.Y = n.TargetY; continue; }
    n.X += (n.TargetX - n.X) * 0.15;
    n.Y += (n.TargetY - n.Y) * 0.15;
  }
}

/** The placement: every node's target moves by the panel's offset from where its first layout put it. */
function place(root: Box, dx: number, dy: number): void {
  for (const n of all(root)) { n.TargetX += dx; n.TargetY += dy; }
}

/** The deepest node whose box holds the point, as `HitTopmost` judges it: the box as it stands this frame. */
function hit(root: Box, x: number, y: number): string | null {
  for (const c of [...root.Children].reverse()) {
    const h = hit(c, x, y);
    if (h) return h;
  }
  return x >= root.X && x < root.X + root.W && y >= root.Y && y < root.Y + root.H ? root.Name : null;
}

/** The count wheel's popover as its first layout leaves it, at the outlet's corner: the − beside the wheel. */
function countWheel(): { Panel: Box; Minus: Box } {
  const minus = box('minus', 10, 60, 44, 44);
  const panel = box('panel', 0, 0, 250, 180, [box('row', 10, 40, 230, 120, [minus, box('wheel', 60, 40, 130, 120)])]);
  return { Panel: panel, Minus: minus };
}

/** A tap on the − where it will stand (a down on one frame, the up two frames later): whether the down and the
 *  up both land on it, which is what a click asks. */
function tapLands(panel: Box, minus: Box): boolean {
  const x = minus.TargetX + minus.W / 2, y = minus.TargetY + minus.H / 2;
  frame(panel);
  const down = hit(panel, x, y);
  frame(panel); frame(panel);
  const up = hit(panel, x, y);
  return down === 'minus' && up === 'minus';
}

describe('OpenSnap: a popover\'s controls are hit where they are drawn from the first placed frame', () => {
  it('a − tapped while the wheel opens: lost when the content glides in, a click when it lands', () => {
    const gliding = countWheel();
    place(gliding.Panel, 120, 400);
    expect(tapLands(gliding.Panel, gliding.Minus)).toBe(false);

    const landing = countWheel();
    const snap = new OpenSnap();
    snap.Hold(landing.Panel);
    place(landing.Panel, 120, 400);
    expect(tapLands(landing.Panel, landing.Minus)).toBe(true);
  });

  it('holds every node of the subtree, a who grid\'s cells included', () => {
    const cells = Array.from({ length: 6 }, (_, i) => box(`cell${i}`, 10 + i * 40, 50, 36, 36));
    const panel = box('panel', 0, 0, 320, 200, [box('grid', 10, 40, 300, 150, cells)]);
    new OpenSnap().Hold(panel);
    expect(all(panel).every((n) => n.SnapLayout)).toBe(true);
  });

  it('lets go once the panel stands on its placement, so later motion inside it springs again', () => {
    const { Panel: panel } = countWheel();
    const snap = new OpenSnap();
    snap.Hold(panel);
    place(panel, 120, 400);
    expect(snap.ReleaseOn(panel, { X: 120, Y: 400 })).toBe(false); // the worker has not solved it yet.
    expect(snap.Holding).toBe(true);
    frame(panel);
    expect(snap.ReleaseOn(panel, { X: 120, Y: 400 })).toBe(true);
    expect(snap.Holding).toBe(false);
    expect(all(panel).some((n) => n.SnapLayout)).toBe(false);
  });

  // Drill Sentences lane YY3b, items 1-3 (desktop: the count picker opened as an empty glass box with a
  // lone "−"; phone: the − and Done did not respond to the first tap; list rows overlapped while a control
  // was open or closing). `Hold`'s one call, the instant the panel's own FIRST placement lands, walks
  // whatever is under `this.Node` AT THAT MOMENT — but a picker's own rows (`NumberField`'s `@for` of wheel
  // rows, Angular's own change detection) can still be mounting a frame or two later, after that one walk
  // already ran: a row born AFTER it is born at `SnapLayout`'s own default (`false`, animated), missing the
  // hold entirely, and springs in from wherever its own first layout happened to put it — the empty box,
  // the stray "−", the overlap, every one of them a node `Hold`'s single walk never saw.
  it('a node that joins the subtree after the first Hold is still caught by a later one, before it is released', () => {
    const minus = box('minus', 10, 60, 44, 44);
    const panel = box('panel', 0, 0, 250, 180, [box('row', 10, 40, 230, 120, [minus])]);
    const snap = new OpenSnap();
    snap.Hold(panel); // the first placement: only "minus" exists yet.
    expect(minus.SnapLayout).toBe(true);
    // A heavier row mounts a frame later (NumberField's own wheel items, built off an async-ish computed) —
    // appended to the already-live tree, the same way Angular attaches a late `@for` child.
    const row = panel.Children[0];
    const lateWheel = box('wheel', 60, 40, 130, 120);
    row.Children.push(lateWheel);
    expect(lateWheel.SnapLayout).toBe(false); // born at the default: unsnapped, about to animate in wrong.
    snap.Hold(panel); // called again, every frame, while still holding (`Popover.ts`'s own `_place`).
    expect(lateWheel.SnapLayout).toBe(true);
  });

  it('leaves a node that snaps on its own account (a row highlight landing) snapping', () => {
    const own = box('indicator', 0, 0, 10, 10);
    own.SnapLayout = true;
    const panel = box('panel', 0, 0, 100, 100, [own]);
    const snap = new OpenSnap();
    snap.Hold(panel);
    snap.ReleaseOn(panel, { X: 0, Y: 0 });
    expect(own.SnapLayout).toBe(true);
    expect(panel.SnapLayout).toBe(false);
  });
});
