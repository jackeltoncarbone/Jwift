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
   * @param canvas the owner's injected `Jaui` (jaui-angular), read lazily.
   * @param indicatorNode the `<jiv #indicator>` the owner's template renders, read lazily so a
   *   "land, don't slide" SnapLayout can be set on first arrival.
   */
  constructor(
    private readonly _owner: JivHandle,
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

  /** The indicator's box, relative to the owner, from the CURRENT geometry of both. */
  private _indicatorBoxFor(row: RowIndicatorRow): RowIndicatorBox {
    return {
      Left: `${row.Node.X - this._owner.X}px`,
      Top: `${row.Node.Y - this._owner.Y}px`,
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
    // Placed: Left/Top are relative to the owner's own box.
    this.IndicatorLayout.set(this._indicatorBoxFor(row));
    // Arriving from nowhere: land on the row and fade in. Between rows: slide.
    const ind = this._indicatorNode();
    if (ind && !was) {
      ind.SnapLayout = true;
      requestAnimationFrame(() => { ind.SnapLayout = false; });
    }
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
    const onRelease = (): void => {
      if (!isActive()) return;
      if (this._pressed()) this._pressed.set(false);
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
