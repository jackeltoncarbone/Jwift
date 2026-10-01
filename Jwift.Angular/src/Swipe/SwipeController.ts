import { InjectionToken } from '@angular/core';
import type { Jaui } from 'jaui-angular';
import type { JivHandle } from 'jaui';
import { CanvasPress } from '../Internal/CanvasPress';
import { Follow } from '../Internal/CanvasFollow';
import { ArmFull, Overscroll, SettleOpen, type SwipeAction } from './Swipe.Logic';

/** One open row per group — provided by `List`, `SortableList` and `Paper` (a fresh instance each),
 *  so opening a row closes whatever else was open in the SAME section. Plain and imperative, the
 *  `ContextMenuService`/`SheetStack` shape: callers register a closer, not a reactive row list. */
export class SwipeGroup {
  private _open: { Row: object; Close: () => void } | null = null;

  /** `row` is about to open (or is already dragging open) — close whatever else in this group is open. */
  Opening(row: object, close: () => void): void {
    if (this._open && this._open.Row !== row) this._open.Close();
    this._open = { Row: row, Close: close };
  }

  Closed(row: object): void {
    if (this._open?.Row === row) this._open = null;
  }
}

export const SWIPE_GROUP = new InjectionToken<SwipeGroup>('SWIPE_GROUP');

/** What `SwipeController` needs from its host row — `swipe-row` and (W7) `sortable-row` both supply
 *  this, so the drag/settle/strip-tap machinery is written exactly once. */
export interface SwipeControllerHost {
  readonly Node: JivHandle;
  Canvas(): Jaui | null | undefined;
  RowWidth(): number;
  LeadingTotal(): number;
  TrailingTotal(): number;
  FullSwipeEnabled(): boolean;
  /** `tracking` true while a finger drives it (no spring — the Tracking class); false on settle (the
   *  resting class's own `@Spring VisualTranslate` carries it the rest of the way). */
  SetTranslate(tx: number, tracking: boolean): void;
  SetArmed(armed: boolean): void;
  Fire(key: string): void;
}

const WHEEL_SETTLE_MS = 140;

/** The shared swipe gesture: claimed by `PanClaim: Horizontal` (`(panclaim)` on the host row), driven
 *  by `CanvasFollow`, clamped + rubber-banded by `Swipe.Logic`, and — while open — a second canvas
 *  listener that either fires the tapped action or closes the row. */
export class SwipeController {
  private _tx = 0;
  private _open = false;
  private _unfollow: (() => void) | null = null;
  private _unbindOpenWatch: (() => void) | null = null;
  private _wheelTimer: ReturnType<typeof setTimeout> | null = null;
  private _suppressNextClick = false;

  constructor(
    private readonly _host: SwipeControllerHost,
    private readonly _leading: readonly SwipeAction[],
    private readonly _trailing: readonly SwipeAction[],
    private readonly _group: SwipeGroup | null,
  ) {}

  get Tx(): number { return this._tx; }
  get IsOpen(): boolean { return this._open; }
  /** True once the CURRENT drag should swallow its trailing click (a tap that closed an open row). */
  get ShouldSwallowClick(): boolean {
    const v = this._suppressNextClick;
    this._suppressNextClick = false;
    return v;
  }

  OnPanClaim(e: PointerEvent): void {
    const canvasEl = this._host.Canvas()?.Canvas?.Element;
    if (!canvasEl) return;
    this._group?.Opening(this, () => this.Close());
    const startTx = this._tx;
    let lastClientX = e.clientX;
    let lastT = performance.now();
    let velocity = 0; // px/sec
    let armed = false;
    this._unfollow = Follow(canvasEl, {
      ClientX: e.clientX, ClientY: e.clientY, PointerType: e.pointerType, PointerId: e.pointerId,
    }, {
      Move: (clientX) => {
        const now = performance.now();
        const dt = now - lastT;
        if (dt > 0) velocity = ((clientX - lastClientX) / dt) * 1000;
        lastClientX = clientX; lastT = now;

        const dx = startTx + (clientX - e.clientX);
        const total = dx < 0 ? this._host.TrailingTotal() : this._host.LeadingTotal();
        const tx = Overscroll(dx, total, this._host.RowWidth());
        this._tx = tx;
        this._host.SetTranslate(tx, true);

        const nowArmed = this._host.FullSwipeEnabled() && this._trailing.length > 0 && ArmFull(tx, this._host.RowWidth());
        if (nowArmed !== armed) { armed = nowArmed; this._host.SetArmed(armed); if (armed) navigator.vibrate?.(8); }
      },
      End: () => { this._unfollow = null; this._settle(velocity, armed); },
      Cancel: () => { this._unfollow = null; this._settle(0, false); },
    });
  }

  /** Trackpad: horizontal wheel deltaX nudges `tx` directly; settles `WHEEL_SETTLE_MS` after the last
   *  event, the `WheelPicker` debounce pattern. */
  OnWheel(deltaX: number): void {
    const dx = this._tx - deltaX;
    const total = dx < 0 ? this._host.TrailingTotal() : this._host.LeadingTotal();
    this._tx = Overscroll(dx, total, this._host.RowWidth());
    this._host.SetTranslate(this._tx, true);
    if (this._wheelTimer !== null) clearTimeout(this._wheelTimer);
    this._wheelTimer = setTimeout(() => { this._wheelTimer = null; this._settle(0, false); }, WHEEL_SETTLE_MS);
  }

  private _settle(velocityPxPerSecond: number, armed: boolean): void {
    this._host.SetArmed(false);
    if (armed) {
      this._host.SetTranslate(0, false);
      this._tx = 0;
      this._open = false;
      this._group?.Closed(this);
      const key = this._trailing[0]?.Key;
      if (key) this._host.Fire(key);
      return;
    }
    const total = this._tx < 0 ? this._host.TrailingTotal() : this._host.LeadingTotal();
    const open = total > 0 && SettleOpen(this._tx, velocityPxPerSecond, total);
    const target = open ? (this._tx < 0 ? -total : total) : 0;
    this._tx = target;
    this._open = open;
    this._host.SetTranslate(target, false);
    if (open) this._watchForOutsideTap(); else { this._unwatchOutsideTap(); this._group?.Closed(this); }
  }

  /** While open, a canvas pointerdown inside the visible strip rect fires its action; any OTHER
   *  pointerdown closes the row and swallows the row's next click (hit-testing ignores
   *  `VisualTranslate`, so the row's own rect never moved — the strip rect is row rect + tx). */
  private _watchForOutsideTap(): void {
    this._unwatchOutsideTap();
    const canvas = this._host.Canvas()?.Canvas;
    const el = canvas?.Element;
    if (!el) return;
    const onDown = (e: PointerEvent): void => {
      const [x, y] = CanvasPress.ToNode(canvas, e.clientX, e.clientY);
      const n = this._host.Node;
      const inRow = x >= n.X && x < n.X + n.Width && y >= n.Y && y < n.Y + n.Height;
      if (inRow) {
        // Inside the row's own rect: could be the freed strip (trailing: the right `|tx|` px; leading:
        // the left `|tx|` px) or the still-visible content. Only the strip fires an action.
        const inStrip = this._tx < 0
          ? x >= n.X + n.Width + this._tx
          : this._tx > 0 ? x < n.X + this._tx : false;
        if (inStrip) {
          const actions = this._tx < 0 ? this._trailing : this._leading;
          const widths = _widthsFor(actions, Math.abs(this._tx));
          let cursor = this._tx < 0 ? n.X + n.Width + this._tx : n.X;
          for (let i = 0; i < actions.length; i++) {
            if (x >= cursor && x < cursor + widths[i]) { this._host.Fire(actions[i].Key); break; }
            cursor += widths[i];
          }
          this.Close();
          return;
        }
        return; // a tap on the still-visible row content — let the row's own click handle it.
      }
      this.Close();
    };
    this._suppressNextClick = false;
    document.addEventListener('pointerdown', onDown, true);
    this._unbindOpenWatch = () => document.removeEventListener('pointerdown', onDown, true);
  }

  private _unwatchOutsideTap(): void {
    this._unbindOpenWatch?.();
    this._unbindOpenWatch = null;
  }

  Close(): void {
    if (!this._open && this._tx === 0) return;
    this._unwatchOutsideTap();
    this._tx = 0;
    this._open = false;
    this._host.SetTranslate(0, false);
    this._group?.Closed(this);
  }

  Destroy(): void {
    this._unfollow?.();
    this._unwatchOutsideTap();
    if (this._wheelTimer !== null) clearTimeout(this._wheelTimer);
    this._group?.Closed(this);
  }
}

function _widthsFor(actions: readonly SwipeAction[], total: number): readonly number[] {
  if (actions.length === 0) return [];
  const w = total / actions.length;
  return actions.map(() => w);
}
