import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import { JivHandle as JivCore, ResolveLengthTuple4, Spring } from 'jaui';
import { FlexMovementScale, TuneSpring } from '../Internal/FlexMovement';
import { JivHost } from '../Internal/JivHost';
import { TabBar } from '../TabBar/TabBar';
import { LensGeometry, type LensBar } from './SelectionIndicator.Geometry';
import SelectionIndicatorJss from './SelectionIndicator.jss';

@Component({
  selector: 'selection-indicator',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => SelectionIndicator) },
  ],
})
export class SelectionIndicator extends JivHost implements OnInit, OnDestroy {
  readonly target = input<JivCore | null>(null);
  readonly pressed = input<boolean | null>(null);
  /** App classes merged after the base look, so a consumer can tint the pill. */
  readonly Class = input<string>('');
  /** How far the resting pill reaches past its item on each side, a JSS length. The iPhone tab bar's
   *  pill is its slot plus about 3px a side, spilling into the neighbours' slots, while the bar's
   *  long-side padding grows by the same amount so an end pill keeps its inset. */
  readonly reach = input<string>('0pt');
  private _reachPx = 0;

  // A `<selection-indicator>` declared inside a `<tab-bar>` injects it and reads its authoritative
  // drag/press flag automatically — so the GLASS press state "just works" without the consumer having
  // to remember `[pressed]="tb.IsPressed()"`. (Worker mode no longer syncs JivHandle.Active to main,
  // so the old `_autoPressed` rect-flag detection is dead; this is the standard wiring in its place.)
  // An explicit `pressed` input still wins when given.
  private _tabBar = inject(TabBar, { optional: true });

  private _canvasRef = inject(Jaui, { optional: true });
  private _rafId = 0;
  private _autoPressed = signal(false);
  private _lastT = 0;
  private _pointerX: number | null = null;
  private _pointerDownX: number | null = null;
  private _dragActive = false;
  private static readonly _DragThresholdPx = 4;
  private _unbindPointer: (() => void) | null = null;
  // The lens's box is sprung here and laid out snapped, so its centre, its pill and its lift never lag one another.
  // Position and bounds take UIKit's selection springs (Jwift/Apple/Sizing.md 1), the lift the fitted MacStories one.
  private _center = new Spring(0);
  private _width = new Spring(0);
  private _height = new Spring(0);
  private _lift = new Spring(0);
  private _shapeX = new Spring(1, 2500, 60, 1);
  // Apple's lens (Jwift/Apple/Sizing.md 1, 2): the resting pill outset 8 pt all round on a tab bar
  // (`CGRectInset(itemFrame, -8, -8)`), 12 pt across and 8 pt down on a segmented control (label-only items), so it
  // is never narrower than the pill.
  private static readonly _TabOutset = '8pt 8pt 8pt 8pt';
  private static readonly _SegmentOutset = '12pt 12pt 8pt 8pt';
  private _outsetPx: [number, number] = [0, 0];
  private _pointScale = 1;
  /** The colour the lens inks what it magnifies, or null. */
  private _lensInk: string | null = null;
  private _segmented = false;
  private _firstValid = false;
  private _hidden = false;
  // The current target / parent we've subscribed to per-frame rect
  // snapshots from. With Jaui in the worker, JivHandle.X/Y/Width/Height
  // on main are zero unless WatchRect(true) has been set; the worker
  // then emits W2M_RectSnapshot every frame and the handle updates.
  // We re-subscribe whenever target() or its parent changes and tear
  // down the old subscription so we don't leak rect traffic.
  private _watchedTarget: JivCore | null = null;
  private _watchedParent: JivCore | null = null;

  constructor() {
    super('SelectionIndicator', SelectionIndicatorJss, 'Jwift_SelectionIndicator', () =>
      `${this._resolvePressed() ? 'Jwift_SelectionIndicator_Pressed' : 'Jwift_SelectionIndicator'} ${this.Class()}`.trim());
  }

  /** The effective press state: an explicit `pressed` input wins; else the parent TabBar's drag flag
   *  (the standard auto-wiring); else the legacy rect-derived flag. */
  private _resolvePressed(): boolean {
    const override = this.pressed();
    if (override !== null) return override;
    if (this._tabBar) return this._tabBar.IsPressed();
    return this._autoPressed();
  }

  ngOnInit(): void {
    this._attachOnInit();
    // Every rect this lens takes is final: its springs run here (_sync).
    this.Node.SnapLayout = true;
    // The loop and pointer tracking mean nothing under server rendering, which has no frames at all; unguarded,
    // this threw out of ngOnInit and cost the page every semantic node built after it.
    if (typeof requestAnimationFrame === 'undefined') return;
    this._running = true;
    window.addEventListener('resize', this._kick);
    this._kick();
    this._wirePointerTracking();
  }

  ngOnDestroy(): void {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
    this._unbindPointer?.();
    if (typeof window !== 'undefined') window.removeEventListener('resize', this._kick);
    this._unwatchTargets();
    this._detachOnDestroy();
  }

  private _unbindTargetRects: Array<() => void> = [];

  // The loop runs while anything can still move the pill and parks after a frame that changed nothing.
  // A rect snapshot, an input, a pointer or a resize wakes it.
  private _running = false;
  private readonly _kick = (): void => {
    if (!this._running || this._rafId !== 0) return;
    this._rafId = requestAnimationFrame(this._tick);
  };

  private readonly _tick = (): void => {
    this._rafId = 0;
    if (this._sync()) { this._kick(); return; }
    this._lastT = 0;
  };

  private readonly _wake = effect(() => {
    this.target(); this.pressed(); this.reach(); this.Class();
    const bar = this._tabBar;
    if (bar) { bar.IsPressed(); bar.AccentSelected(); bar.Accent(); for (const item of bar.Items()) item.icon(); }
    untracked(() => { if (this._running) this._kick(); });
  });

  /** Replace the target/parent rect-snapshot subscriptions when the
   *  SelectionIndicator's `target` swaps to a different TabItem (selection
   *  change). The old target/parent get `WatchRect(false)` so the worker
   *  stops emitting snapshots for them, and the new pair get `(true)`. */
  private _ensureWatched(target: JivCore | null, parent: JivCore | null): void {
    if (target === this._watchedTarget && parent === this._watchedParent) return;
    if (this._watchedTarget && this._watchedTarget !== target) this._unwatch(this._watchedTarget);
    if (this._watchedParent && this._watchedParent !== parent) this._unwatch(this._watchedParent);
    this._watchedTarget = target;
    this._watchedParent = parent;
    for (const unbind of this._unbindTargetRects) unbind();
    this._unbindTargetRects = [];
    if (target) { target.WatchRect(true); this._unbindTargetRects.push(target.OnRect(this._kick)); }
    if (parent && parent !== target) { parent.WatchRect(true); this._unbindTargetRects.push(parent.OnRect(this._kick)); }
  }

  /** No target, no lens: it fades where it was, then snaps onto the next target as it fades back in. */
  private _setHidden(hidden: boolean): void {
    if (hidden === this._hidden) return;
    this._hidden = hidden;
    if (hidden) {
      this._firstValid = false;
      this.SetStyleOverride({ Opacity: '0' });
    } else {
      this.ClearStyleOverride('Opacity');
    }
  }

  private _unwatchTargets(): void {
    for (const unbind of this._unbindTargetRects) unbind();
    this._unbindTargetRects = [];
    if (this._watchedTarget) this._unwatch(this._watchedTarget);
    if (this._watchedParent) this._unwatch(this._watchedParent);
    this._watchedTarget = null;
    this._watchedParent = null;
  }

  /** Drops a lease, except on a tab the bar leases for its own hit test. */
  private _unwatch(node: JivCore): void {
    if (this._tabBar?.Items().some((item) => item.Node === node)) return;
    node.WatchRect(false);
  }

  private _wirePointerTracking(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;
    // Pointer → node space (CSS px, canvas-origin) via the canvas's single source of truth, matching the
    // CSS-px node rects the worker emits, so the in-bounds gate is correct on HiDPI displays too.
    const toCanvasX = (clientX: number): number => this._canvasRef?.Canvas?.ClientToNodePoint(clientX, 0)[0] ?? clientX;
    const toCanvasY = (clientY: number): number => this._canvasRef?.Canvas?.ClientToNodePoint(0, clientY)[1] ?? clientY;
    // Whether the canvas point (x, y) lies inside the parent (tab strip)
    // bounds. The pointer listeners attach to the WHOLE canvas (we have
    // no per-tab DOM elements — Jaui draws everything in the worker), so
    // we gate every event on whether it intersects THIS indicator's
    // target-strip. Without this gate, any pointerdown anywhere on the
    // page activates drag tracking and the indicator chases the cursor.
    const inParentBounds = (x: number, y: number): boolean => {
      const parent = this.target()?.Parent as (JivCore | null);
      if (!parent) return false;
      // Parent rect requires WatchRect; _sync subscribes once target() is
      // set, so by the time pointer events arrive parent.X/Y/W/H are
      // populated. If they're 0 (target not yet ready), fail closed.
      if (parent.Width <= 0 || parent.Height <= 0) return false;
      return x >= parent.X && x <= parent.X + parent.Width
          && y >= parent.Y && y <= parent.Y + parent.Height;
    };
    const onDown = (e: PointerEvent) => {
      const x = toCanvasX(e.clientX);
      const y = toCanvasY(e.clientY);
      // Only initiate drag tracking when pointerdown lands inside THIS
      // indicator's target-strip. Pointerdowns elsewhere (other tab
      // strips, scrollable content, modal backdrops, anything) leave
      // _pointerDownX as null so onMove bails immediately.
      if (!inParentBounds(x, y)) return;
      this._pointerX = x;
      this._pointerDownX = x;
      this._dragActive = false;
      this._kick();
    };
    const onMove = (e: PointerEvent) => {
      if (e.buttons === 0) return;
      // Belt-and-suspenders: a pointerdown that happened OUTSIDE the
      // parent never set _pointerDownX, so any subsequent pointermove
      // (even with a button held) is irrelevant to this indicator.
      if (this._pointerDownX === null) return;
      const x = toCanvasX(e.clientX);
      this._pointerX = x;
      if (!this._dragActive
          && Math.abs(x - this._pointerDownX) > SelectionIndicator._DragThresholdPx) {
        this._dragActive = true;
      }
      this._kick();
    };
    const onClear = () => {
      this._pointerX = null;
      this._pointerDownX = null;
      this._dragActive = false;
      this._kick();
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onClear);
    el.addEventListener('pointercancel', onClear);
    this._unbindPointer = () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onClear);
      el.removeEventListener('pointercancel', onClear);
    };
  }

  /** One frame of the pill. True while it can still move without being woken: a spring settling, a drag, or a
   *  layout write whose rect has not come back yet. */
  private _sync(): boolean {
    const t = this.target();
    this._setHidden(!t);
    if (!t) {
      this._unwatchTargets();
      return false;
    }

    const parent = t.Parent as (JivCore | null);
    // Subscribe to per-frame rect snapshots from the worker — without
    // this the JivHandle's X/Y/Width/Height stay at zero on main and
    // the indicator never sizes itself correctly. Re-runs on target swap.
    this._ensureWatched(t, parent);

    let ctxNode: JivCore | null = parent;
    while (ctxNode && !ctxNode.ResolveCtx) ctxNode = ctxNode.Parent as (JivCore | null);
    if (parent && ctxNode?.ResolveCtx) {
      this._pointScale = ctxNode.ResolveCtx.PointScale || 1;
      this._reachPx = ResolveLengthTuple4(this.reach(), ctxNode.ResolveCtx, ['W', 'W', 'W', 'W'])[0];
      const segmented = this._tabBar !== null && this._tabBar.Items().every((item) => !item.icon());
      if (segmented !== this._segmented) {
        this._segmented = segmented;
        if (segmented) this.SetStyleOverride({ LensLiftedScale: '1' });
        else this.ClearStyleOverride('LensLiftedScale');
      }
      const outset = ResolveLengthTuple4(segmented ? SelectionIndicator._SegmentOutset : SelectionIndicator._TabOutset, ctxNode.ResolveCtx, ['W', 'W', 'H', 'H']);
      this._outsetPx = [outset[0], outset[2]];
    }
    if (!parent || t.Width <= 0 || t.Height <= 0 || parent.Width <= 0 || parent.Height <= 0) return false;

    const isPressed = this._resolvePressed();

    const now = performance.now();
    // Upper clamp prevents first-frame blowup (dt of billions of ms).
    const dt = this._lastT > 0 ? Math.min(0.033, Math.max(0.001, (now - this._lastT) / 1000)) : 0.016;
    this._lastT = now;

    // The items under the lens take the selection's tint, as Apple's do: the bar's accent, when it selects in it.
    const ink = this._tabBar && this._tabBar.AccentSelected() ? this._tabBar.Accent() ?? null : null;
    if (ink !== this._lensInk) {
      this._lensInk = ink;
      if (ink === null) this.ClearStyleOverride('LensInk');
      else this.SetStyleOverride({ LensInk: ink });
    }

    // Pressed, the dragging springs (position 0.85 / 0.2 s, bounds 0.85 / 0.3 s), else the release's (0.4 s, 0.6 s).
    // The lift grows on the fitted MacStories spring (7% overshoot) and lets go in about five frames, no overshoot.
    TuneSpring(this._center, 0.85, isPressed ? 0.2 : 0.4);
    TuneSpring(this._width, 0.85, isPressed ? 0.3 : 0.6);
    TuneSpring(this._height, 0.85, isPressed ? 0.3 : 0.6);
    this._lift.Stiffness = isPressed ? 409 : 2187;
    this._lift.Damping = isPressed ? 25.3 : 112;

    // The capsule bar (TabBar.jss, BorderRadius 999pt) in its layout space: its flex carries bar and lens as one body.
    const bar: LensBar = { Width: parent.Width, Height: parent.Height, Radius: parent.Height / 2 };
    const pill = {
      Bar: bar, Width: t.Width + this._reachPx * 2, Height: t.Height,
      OutsetX: this._outsetPx[0], OutsetY: this._outsetPx[1],
    };
    // Tap-and-hold stays on its tab; past the drag threshold the lens follows the finger, clamped where the lifted
    // lens clamps (Sizing.md 1: centre x = the finger, clamped inside the items' union).
    const aim = this._dragActive && this._pointerX !== null
      ? LensGeometry({ ...pill, Center: this._pointerX - parent.X, Lift: 1, Squash: 1 })
      : null;
    this._center.Set(aim ? aim.Left + aim.Width / 2 : t.X + t.Width / 2 - parent.X);
    this._width.Set(pill.Width);
    this._height.Set(pill.Height);
    this._lift.Set(isPressed ? 1 : 0);
    if (!this._firstValid) {
      this._firstValid = true;
      for (const spring of [this._center, this._width, this._height, this._lift]) spring.Snap();
    }

    // Dragged, the lens takes UIKit's loupe movement scale from its own velocity, keeping its area (FlexMovement.ts).
    // The press's growth and the release's settle move the lens but are not a drag.
    this._shapeX.Target = this._dragActive ? FlexMovementScale(this._center.Velocity / this._pointScale) : 1;

    let springing = false;
    for (const spring of [this._center, this._width, this._height, this._lift, this._shapeX]) {
      if (spring.Step(dt)) springing = true;
    }

    const lens = LensGeometry({
      ...pill, Width: this._width.Value, Height: this._height.Value,
      Center: this._center.Value, Lift: this._lift.Value, Squash: this._shapeX.Value,
    });

    // Placed: Left and Top are relative to the bar's box.
    const cl = this.Node.ChildLayout;
    const leftPx = `${lens.Left}px`;
    const topPx = `${lens.Top}px`;
    const widthPx = `${lens.Width}px`;
    const heightPx = `${lens.Height}px`;
    let dirty = false;
    if (cl.Left !== leftPx) { cl.Left = leftPx; dirty = true; }
    if (cl.Top !== topPx) { cl.Top = topPx; dirty = true; }
    if (cl.Width !== widthPx) { cl.Width = widthPx; dirty = true; }
    if (cl.Height !== heightPx) { cl.Height = heightPx; dirty = true; }
    if (dirty) this.Node.MarkLayoutDirty();

    const pressedNow = parent.Active || t.Active;
    if (pressedNow !== this._autoPressed()) this._autoPressed.set(pressedNow);
    return dirty || springing || this._dragActive;
  }
}

