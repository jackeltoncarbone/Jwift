import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import type { JivHandle } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import { CanvasPress } from '../Internal/CanvasPress';
import { Follow } from '../Internal/CanvasFollow';
import { SWIPE_GROUP, SwipeGroup } from '../Swipe/SwipeController';
import { JWIFT_PAPER_GEOMETRY } from '../Paper/Paper';
import { RowRadius } from '../Paper/Paper.Geometry';
import {
  AutoscrollVelocity, Shifts, Target,
  type SortableEntry, type SortableEntryKind,
} from './Sortable.Logic';
import SortableListJss from './SortableList.jss';

/** What `SortableList` needs from a registered row or (folded or open) section header. Both
 *  `sortable-row` and `sortable-section` implement it and register in `ngOnInit`. */
export interface SortableEntryHandle {
  readonly Id: () => string;
  readonly Kind: SortableEntryKind;
  readonly SectionId: string | null;
  readonly Node: JivHandle;
  IsSectionOpen?(): boolean;
  SetShift(y: number | null, tracking: boolean): void;
  SetLifted(lifted: boolean): void;
  SetDropTarget?(over: boolean): void;
}

export interface SortableReorder {
  readonly Key: string;
  readonly Section: string | null;
  readonly Index: number;
}

export const SORTABLE_LIST = new InjectionToken<SortableList>('SORTABLE_LIST');

const TOUCH_HOLD_MS = 380;
const TOUCH_SLOP_PX = 8;
const MOUSE_LIFT_PX = 6;

/**
 * `<sortable-list>`: long-press a row (or a folded section's header) to lift it, drag to reorder.
 * Needs J1 (`PanClaim: Hold` + `Node.ClaimPan()`) and W6's `SwipeController`/`SWIPE_GROUP` (a row may
 * also be a `sortable-row` with its own swipe actions).
 *
 *   <sortable-list [Scroller]="scrollBody" (Reorder)="onReorder($event)">
 *     <sortable-row [Key]="r.Id">...</sortable-row>
 *     <sortable-section [Key]="g.Id" [Title]="g.Title" [Count]="g.Count+''" [Open]="open()" (OpenChange)="open.set($event)">
 *       @if (open()) { <sortable-row [Key]="r.Id">...</sortable-row> }
 *     </sortable-section>
 *   </sortable-list>
 */
@Component({
  selector: 'sortable-list',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => SortableList) },
    { provide: SORTABLE_LIST, useExisting: forwardRef(() => SortableList) },
    { provide: SWIPE_GROUP, useFactory: () => new SwipeGroup() },
  ],
  host: { '(pointerdown)': '_onPointerDown($event)' },
})
export class SortableList extends JivHost implements OnInit, OnDestroy {
  /** The scroll container to autoscroll while a lift sits near its top or bottom edge. */
  readonly Scroller = input<Jiv | null>(null);
  /** Row/section corner; defaults to `JWIFT_PAPER_GEOMETRY`'s radius minus padding when this list
   *  sits inside a `<paper>`, else 0. */
  readonly Radius = input<number | null>(null);
  /** Overrides `Jwift_SortableList`'s own class `Gap` (8pt) for this one list — Jack, live (round 12):
   *  the drill editor nests two different roles under the same component (the top-level list of phrases,
   *  and each phrase's own list of lines), which need two different rhythms (20pt between phrase groups
   *  reads as a group break; 8pt between lines within one phrase reads as the same row). Unset (the
   *  default), a list keeps the class's own Gap. */
  readonly Gap = input<number | null>(null);

  readonly Reorder = output<SortableReorder>();
  readonly SectionReorder = output<{ Key: string; Index: number }>();

  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _parentList = inject(SORTABLE_LIST, { skipSelf: true, optional: true });
  private readonly _paperGeometry = inject(JWIFT_PAPER_GEOMETRY, { optional: true });

  /** The radius a row/section reads for its own `BorderRadius` — `Radius` if the consumer set one,
   *  else `JWIFT_PAPER_GEOMETRY`'s (radius - padding) when this list sits inside a `<paper>`, else 0. */
  readonly EffectiveRadius = computed(() => {
    const own = this.Radius();
    if (own !== null) return own;
    const geo = this._paperGeometry?.();
    return geo ? RowRadius(geo.Radius, geo.Padding) : 0;
  });

  private readonly _entries = new Set<SortableEntryHandle>();
  private readonly _childLists = new Set<SortableList>();

  private _holdTimer: ReturnType<typeof setTimeout> | null = null;
  private _pressStart: { X: number; Y: number; PointerId: number; PointerType: string } | null = null;
  private _lifted: SortableEntryHandle | null = null;
  private _unfollow: (() => void) | null = null;
  private _autoscrollRaf: number | null = null;
  private _lastFingerY = 0;
  private _dropTargetSection: SortableEntryHandle | null = null;
  private _swallowNextClick = false;

  constructor() {
    super('SortableList', SortableListJss, 'Jwift_SortableList', () => 'Jwift_SortableList');
    effect(() => {
      const gap = this.Gap();
      if (gap !== null) this.SetStyleOverride({ Gap: `${gap}pt` });
      else this.ClearStyleOverride('Gap');
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
    this.Node.WatchRect(true);
    this._parentList?.RegisterChildList(this);
  }
  ngOnDestroy(): void {
    this._cancelPress();
    this._parentList?.UnregisterChildList(this);
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  RegisterEntry(entry: SortableEntryHandle): void { this._entries.add(entry); }
  UnregisterEntry(entry: SortableEntryHandle): void { this._entries.delete(entry); }
  RegisterChildList(list: SortableList): void { this._childLists.add(list); }
  UnregisterChildList(list: SortableList): void { this._childLists.delete(list); }

  /** `Entries` in DOM/registration order — Angular constructs them top-to-bottom within one CD pass,
   *  so `Set` insertion order already matches the template's. */
  private _orderedEntries(): SortableEntryHandle[] {
    return Array.from(this._entries);
  }

  private _entryRects(): SortableEntry[] {
    return this._orderedEntries().map((e) => ({
      Id: e.Id(), Kind: e.Kind, Y: e.Node.Y, Height: e.Node.Height,
      SectionId: e.SectionId, SectionOpen: e.IsSectionOpen?.(),
    }));
  }

  private _pointInNode(canvasX: number, canvasY: number, n: JivHandle): boolean {
    return canvasX >= n.X && canvasX < n.X + n.Width && canvasY >= n.Y && canvasY < n.Y + n.Height;
  }

  private _entryAt(canvasX: number, canvasY: number): SortableEntryHandle | null {
    for (const e of this._orderedEntries()) {
      if (this._pointInNode(canvasX, canvasY, e.Node)) return e;
    }
    return null;
  }

  private _insideChildList(canvasX: number, canvasY: number): boolean {
    for (const child of this._childLists) {
      if (this._pointInNode(canvasX, canvasY, child.Node)) return true;
    }
    return false;
  }

  protected _onPointerDown(e: PointerEvent): void {
    if (this._pressStart || this._lifted) return;
    const canvas = this._canvasRef?.Canvas;
    const [x, y] = CanvasPress.ToNode(canvas, e.clientX, e.clientY);
    if (!this._pointInNode(x, y, this.Node)) return;
    if (this._insideChildList(x, y)) return;
    const entry = this._entryAt(x, y);
    if (!entry) return;

    this._pressStart = { X: e.clientX, Y: e.clientY, PointerId: e.pointerId, PointerType: e.pointerType };
    for (const en of this._orderedEntries()) en.Node.WatchRect(true);

    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      this._holdTimer = setTimeout(() => {
        this._holdTimer = null;
        if (this._pressStart) this._lift(entry, this._pressStart.X, this._pressStart.Y, this._pressStart);
      }, TOUCH_HOLD_MS);
      const onEarlyMove = (ev: PointerEvent): void => {
        if (ev.pointerId !== e.pointerId || !this._pressStart) return;
        const dx = ev.clientX - this._pressStart.X, dy = ev.clientY - this._pressStart.Y;
        if (Math.hypot(dx, dy) > TOUCH_SLOP_PX) this._cancelPress();
      };
      const onEarlyUp = (ev: PointerEvent): void => { if (ev.pointerId === e.pointerId) this._cancelPress(); };
      document.addEventListener('pointermove', onEarlyMove, true);
      document.addEventListener('pointerup', onEarlyUp, true);
      document.addEventListener('pointercancel', onEarlyUp, true);
      this._earlyUnbind = () => {
        document.removeEventListener('pointermove', onEarlyMove, true);
        document.removeEventListener('pointerup', onEarlyUp, true);
        document.removeEventListener('pointercancel', onEarlyUp, true);
      };
    } else {
      const onEarlyMove = (ev: PointerEvent): void => {
        if (ev.pointerId !== e.pointerId || !this._pressStart) return;
        const dx = ev.clientX - this._pressStart.X, dy = ev.clientY - this._pressStart.Y;
        if (Math.abs(dy) >= Math.abs(dx) && Math.hypot(dx, dy) > MOUSE_LIFT_PX) {
          this._earlyUnbind?.();
          this._lift(entry, ev.clientX, ev.clientY, this._pressStart!);
        } else if (Math.abs(dx) > MOUSE_LIFT_PX) {
          this._cancelPress(); // a sideways mouse drag is the row's own swipe, not a lift.
        }
      };
      const onEarlyUp = (ev: PointerEvent): void => { if (ev.pointerId === e.pointerId) this._cancelPress(); };
      document.addEventListener('pointermove', onEarlyMove, true);
      document.addEventListener('pointerup', onEarlyUp, true);
      document.addEventListener('pointercancel', onEarlyUp, true);
      this._earlyUnbind = () => {
        document.removeEventListener('pointermove', onEarlyMove, true);
        document.removeEventListener('pointerup', onEarlyUp, true);
        document.removeEventListener('pointercancel', onEarlyUp, true);
      };
    }
  }

  private _earlyUnbind: (() => void) | null = null;

  private _cancelPress(): void {
    if (this._holdTimer !== null) { clearTimeout(this._holdTimer); this._holdTimer = null; }
    this._earlyUnbind?.(); this._earlyUnbind = null;
    if (!this._lifted) for (const en of this._orderedEntries()) en.Node.WatchRect(false);
    this._pressStart = null;
  }

  private _lift(entry: SortableEntryHandle, clientX: number, clientY: number, start: { PointerId: number; PointerType: string }): void {
    this._earlyUnbind?.(); this._earlyUnbind = null;
    if (this._holdTimer !== null) { clearTimeout(this._holdTimer); this._holdTimer = null; }
    const canvasEl = this._canvasRef?.Canvas?.Element;
    if (!canvasEl) { this._cancelPress(); return; }

    this.Node.ClaimPan();
    navigator.vibrate?.(8);
    // Close any open popover the same way a real outside tap would — an off-screen point is outside
    // every popover's rect, which is the entirety of what that listener checks.
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: -1, clientY: -1 }));

    this._lifted = entry;
    entry.SetLifted(true);
    const order = this._orderedEntries();
    const originIndex = order.indexOf(entry);
    const liftedHeight = entry.Node.Height;
    const [, startCanvasY] = CanvasPress.ToNode(this._canvasRef?.Canvas, clientX, clientY);
    const originY = startCanvasY - entry.Node.Y;
    const ids = order.map((o) => o.Id());
    const state = { Target: originIndex };

    const recompute = (): void => {
      entry.SetShift(this._lastFingerY - originY - entry.Node.Y, true);
      const t = Target(this._entryRects(), entry.Id(), this._lastFingerY);
      const targetIndex = Math.min(t.Index, order.length - 1);
      this._updateDropTarget(order, t.IntoSection);
      if (targetIndex === state.Target) return;
      state.Target = targetIndex;
      const shifts = Shifts(ids, originIndex, targetIndex, liftedHeight);
      for (const o of order) {
        if (o === entry) continue;
        o.SetShift(shifts.get(o.Id()) ?? null, false);
      }
    };

    this._lastFingerY = startCanvasY;
    this._startAutoscroll(recompute);
    this._unfollow = Follow(canvasEl, {
      ClientX: clientX, ClientY: clientY, PointerType: start.PointerType, PointerId: start.PointerId,
    }, {
      Move: (mx, my) => {
        const [, canvasY] = CanvasPress.ToNode(this._canvasRef?.Canvas, mx, my);
        this._lastFingerY = canvasY;
        recompute();
      },
      End: () => { this._drop(entry, order, originIndex, state.Target); },
      Cancel: () => { this._drop(entry, order, originIndex, originIndex); },
    });
  }

  /** Autoscroll runs every frame while lifted, independent of pointer events, so a finger held still
   *  near the scroller's edge keeps scrolling — applying a scroll changes layout, so the target is
   *  recomputed after each tick too ("apply, then recompute"). */
  private _startAutoscroll(recompute: () => void): void {
    const step = (): void => {
      this._autoscroll(recompute);
      this._autoscrollRaf = requestAnimationFrame(step);
    };
    this._autoscrollRaf = requestAnimationFrame(step);
  }

  private _updateDropTarget(order: readonly SortableEntryHandle[], sectionId: string | null): void {
    if (this._dropTargetSection) { this._dropTargetSection.SetDropTarget?.(false); this._dropTargetSection = null; }
    if (sectionId === null) return;
    const section = order.find((o) => o.Kind === 'SectionHeader' && o.SectionId === sectionId) ?? null;
    if (section) { section.SetDropTarget?.(true); this._dropTargetSection = section; }
  }

  private _autoscroll(recompute: () => void): void {
    const scroller = this.Scroller()?.Node;
    if (!scroller || scroller.Height <= 0) return;
    const v = AutoscrollVelocity(this._lastFingerY, scroller.Y, scroller.Y + scroller.Height);
    if (v === 0) return;
    scroller.ScrollTo({ Y: scroller.ScrollY + v, Motion: 'Instant' });
    recompute();
  }

  private _drop(entry: SortableEntryHandle, order: readonly SortableEntryHandle[], originIndex: number, targetIndex: number): void {
    this._unfollow = null;
    if (this._autoscrollRaf !== null) { cancelAnimationFrame(this._autoscrollRaf); this._autoscrollRaf = null; }
    this._updateDropTarget(order, null);

    const moved = targetIndex !== originIndex;
    // Spring the lifted entry toward its slot first (250ms), then snap every entry's layout in one
    // tick so the slot offset (new layout - old layout) already equals the translate — no visual jump.
    entry.SetShift(0, false);
    setTimeout(() => {
      for (const o of order) o.SetShift(null, true);
      entry.SetLifted(false);
      if (moved) {
        if (entry.Kind === 'SectionHeader') {
          this.SectionReorder.emit({ Key: entry.Id(), Index: targetIndex });
        } else {
          this.Reorder.emit({ Key: entry.Id(), Section: entry.SectionId, Index: targetIndex });
        }
      }
      requestAnimationFrame(() => { for (const o of order) o.SetShift(null, false); });
    }, 250);

    this._swallowNextClick = true;
    this._lifted = null;
    for (const en of order) en.Node.WatchRect(false);
    this._pressStart = null;
  }

  /** The drag just dropped — the row's own `(click)` handler (which fires BEFORE this ancestor ever
   *  sees the event, since clicks bubble) asks here whether to swallow itself. Consumed once. */
  ShouldSwallowClick(): boolean {
    const v = this._swallowNextClick;
    this._swallowNextClick = false;
    return v;
  }
}
