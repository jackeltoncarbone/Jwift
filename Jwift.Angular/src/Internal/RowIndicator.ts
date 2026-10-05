import { computed, signal, type Signal, type WritableSignal } from '@angular/core';
import type { Jaui } from 'jaui-angular';
import type { JivHandle } from 'jaui';

/** A row of an open menu, as the shared indicator sees it: a hit rect plus the one fact that changes
 *  whether it is eligible to be hovered at all. */
export interface RowIndicatorRow {
  readonly Node: JivHandle;
  IsDisabled(): boolean;
}

export interface RowIndicatorBox {
  Left: string;
  Top: string;
  Width: string;
  Height: string;
}

/**
 * The ONE sliding hover/press highlight shared by every row of an open menu — extracted out of
 * GlassDropdown UNCHANGED (see its own long comment, preserved on `Replace` below) so PopoverMenu can
 * share the exact same pill instead of growing its own: "one sliding indicator", as Jack required.
 * Both consumers paint it with the `Jwift_GlassDropdownIndicator*` classes.
 *
 * Rows register their own rect (`RegisterRow`); the owner hit-tests the pointer in DOCUMENT space —
 * everything paints into one canvas, so DOM `contains()` can't tell what's under a point — and springs
 * the indicator onto whichever row is under it.
 */
export class RowIndicator {
  private readonly _rows = new Set<RowIndicatorRow>();
  private readonly _hovered = signal<RowIndicatorRow | null>(null);
  private readonly _pressed = signal(false);
  readonly IndicatorLayout: WritableSignal<RowIndicatorBox | undefined> = signal(undefined);
  readonly IndicatorClass: Signal<string> = computed(() => {
    const row = this._hovered();
    if (!row) return 'Jwift_GlassDropdownIndicator';
    return this._pressed() ? 'Jwift_GlassDropdownIndicator_Pressed' : 'Jwift_GlassDropdownIndicator_On';
  });

  /**
   * @param owner the menu's own Jiv handle — a row's box is placed RELATIVE to it (`Placed: Left/Top`).
   *   Read lazily (a thunk, not the handle itself): a `JivHost` has its `Node` the moment it is
   *   constructed, but a plain component's owner is often a VIEW CHILD (e.g. PopoverMenu's scroll
   *   body), which resolves only after the first view pass — after rows have already registered, so
   *   the indicator itself must tolerate being built before its owner is ready.
   * @param canvas the owner's injected `Jaui` (jaui-angular), read lazily.
   * @param indicatorNode the `<jiv #indicator>` the owner's template renders, read lazily so a
   *   "land, don't slide" SnapLayout can be set on first arrival.
   */
  constructor(
    private readonly _owner: () => JivHandle | null | undefined,
    private readonly _canvas: () => Jaui | null | undefined,
    private readonly _indicatorNode: () => JivHandle | undefined,
  ) {}

  RegisterRow(row: RowIndicatorRow): void { this._rows.add(row); }
  UnregisterRow(row: RowIndicatorRow): void {
    this._rows.delete(row);
    if (this._hovered() === row) this._hovered.set(null);
  }

  private _rowAt(clientX: number, clientY: number): RowIndicatorRow | null {
    const canvas = this._canvas()?.Canvas;
    if (!canvas) return null;
    const [x, y] = canvas.ClientToNodePoint(clientX, clientY);
    for (const row of this._rows) {
      if (row.IsDisabled()) continue;
      const n = row.Node;
      if (n.Width <= 0 || n.Height <= 0) continue;
      if (x >= n.X && x < n.X + n.Width && y >= n.Y && y < n.Y + n.Height) return row;
    }
    return null;
  }

  /** The indicator's box, relative to the owner, from the CURRENT geometry of both. `null` while the
   *  owner has not resolved yet (nothing to be relative to). */
  private _indicatorBoxFor(row: RowIndicatorRow): RowIndicatorBox | null {
    const owner = this._owner();
    if (!owner) return null;
    return {
      Left: `${row.Node.X - owner.X}px`,
      Top: `${row.Node.Y - owner.Y}px`,
      Width: `${row.Node.Width}px`,
      Height: `${row.Node.Height}px`,
    };
  }

  /**
   * Re-place the indicator on the row it is already on.
   *
   * WHY THIS EXISTS. `Left` is `row.X - owner.X`, read ONCE when the pointer enters a row. An open
   * panel that grows (width/height animate) is anchored so its OWN X keeps moving while its rows are
   * already laid out at their final places. Hover a row inside that window and a stale offset is baked
   * in, and the highlight sits off to one side for as long as it stays on that row. Call this every
   * frame of such a transition instead of trusting one frame's read.
   */
  Replace(): void {
    const row = this._hovered();
    if (!row) return;
    const next = this._indicatorBoxFor(row);
    if (!next) return;
    const now = this.IndicatorLayout();
    if (now && now.Left === next.Left && now.Top === next.Top
        && now.Width === next.Width && now.Height === next.Height) return;
    this.IndicatorLayout.set(next);
  }

  private _hover(row: RowIndicatorRow | null): void {
    const was = this._hovered();
    if (row === was) return;
    this._hovered.set(row);
    if (!row) { this._pressed.set(false); return; }
    // Arriving from nowhere: land on the row instantly, no transition. Between rows: slide.
    //
    // SnapLayout is set HERE, synchronously, in the same call that moves the box — never on a
    // timer. The old shape set `SnapLayout = true` then cleared it a `requestAnimationFrame` later
    // on the MAIN thread; Jaui's actual layout solve runs on the WORKER, on the worker's own frame
    // cadence, reached by `postMessage`. Nothing ties a main-thread rAF to when the worker gets
    // around to solving THIS node's new target — the reset message can arrive and be applied before
    // the worker ever solves the frame that carries the moved target, so the flag reads false by the
    // time it matters and the "landing" frame springs in from wherever the indicator last was (the
    // menu's own open morph, most visibly, since the indicator mounts at the same time the panel
    // does). `postMessage` preserves ORDER, not wall-clock timing — so the fix is to make the order
    // itself carry the intent: set the flag before the box that must obey it, in the same synchronous
    // block, and never schedule its reset on a clock the worker does not share. Same pattern
    // `SelectionIndicator.ts` uses (`Node.SnapLayout = true` once in `ngOnInit`, never reset) for a
    // pill that owns its OWN spring; here the engine's own spring must still run for an actual
    // between-rows slide, so the flag instead toggles on `was`: unset (nowhere -> a row) snaps,
    // set (a row -> a different row) springs.
    const ind = this._indicatorNode();
    if (ind) ind.SnapLayout = !was;
    // Placed: Left/Top are relative to the owner's own box.
    const box = this._indicatorBoxFor(row);
    if (box) this.IndicatorLayout.set(box);
  }

  /**
   * Document-level pointer tracking that drives hover/press — bind once for the owner's lifetime
   * (matching the original GlassDropdown wiring), gated by `isActive` exactly as the original's own
   * `if (!this._open()) return;` guards did, so a listener fired while closed is a silent no-op rather
   * than something the owner has to unbind and rebind every open. Returns the unbind function.
   */
  Bind(doc: Document, isActive: () => boolean): () => void {
    const onMove = (e: PointerEvent): void => {
      if (!isActive()) return;
      this._hover(this._rowAt(e.clientX, e.clientY));
    };
    const onPress = (e: PointerEvent): void => {
      if (!isActive()) return;
      const row = this._rowAt(e.clientX, e.clientY);
      this._hover(row);
      this._pressed.set(row !== null);
    };
    const onRelease = (e: PointerEvent): void => {
      if (!isActive()) return;
      if (this._pressed()) this._pressed.set(false);
      // A finger has no hover once it lifts (Jaui.ts's own `liftTouch` does the identical thing for the
      // engine's own Hover/Active states) -- touch raises no pointerleave the way a mouse moving off the
      // row does, so without this the pill stayed lit on whatever row a tap last landed on, reading as
      // "stuck" the next time this same menu (or a fresh page pushed into it) opened with nothing
      // actually hovered. Mouse is untouched: its own pointerleave/pointermove already keep hover honest.
      if (e.pointerType !== 'mouse') this._hover(null);
    };
    const onLeave = (): void => {
      if (!isActive()) return;
      this._hover(null);
    };
    doc.addEventListener('pointerdown', onPress, true);
    doc.addEventListener('pointermove', onMove, true);
    doc.addEventListener('pointerup', onRelease, true);
    doc.addEventListener('pointercancel', onRelease, true);
    doc.addEventListener('pointerleave', onLeave, true);
    return () => {
      doc.removeEventListener('pointerdown', onPress, true);
      doc.removeEventListener('pointermove', onMove, true);
      doc.removeEventListener('pointerup', onRelease, true);
      doc.removeEventListener('pointercancel', onRelease, true);
      doc.removeEventListener('pointerleave', onLeave, true);
    };
  }

  /** Clear hover/press — call on close, so a stale pill isn't left highlighted for the next open. */
  Reset(): void { this._hovered.set(null); this._pressed.set(false); }
}
