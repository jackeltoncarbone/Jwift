import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import { JivHandle as JivCore, ResolveLengthTuple4, Spring } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import { TabBar } from '../TabBar/TabBar';
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

  // A `<selection-indicator>` declared inside a `<tab-bar>` injects it and reads its authoritative
  // drag/press flag automatically — so the GLASS press state "just works" without the consumer having
  // to remember `[pressed]="tb.IsPressed()"`. (Worker mode no longer syncs JivHandle.Active to main,
  // so the old `_autoPressed` rect-flag detection is dead; this is the standard wiring in its place.)
  // An explicit `pressed` input still wins when given.
  private _tabBar = inject(TabBar, { optional: true });

  private _canvasRef = inject(Jaui, { optional: true });
  private _rafId = 0;
  private _autoPressed = signal(false);
  private _lastPad: [number, number, number, number] = [0, 0, 0, 0];
  private _lastT = 0;
  private _lastX = 0;
  private _lastY = 0;
  private _pointerX: number | null = null;
  private _pointerDownX: number | null = null;
  private _dragActive = false;
  private static readonly _DragThresholdPx = 4;
  private _unbindPointer: (() => void) | null = null;
  private _shapeX = new Spring(1, 2500, 60, 1);
  private _shapeY = new Spring(1, 2500, 60, 1);
  // Continuous press amount in [0, 1]. Drives the pad + size boost as a
  // smooth curve so the indicator's size doesn't snap-then-chase when the
  // boolean `isPressed` flips — every visual parameter (glass thickness,
  // refraction, rim, tint, size) then springs in lockstep across the
  // press/release transition. Stiffness/damping picked to roughly match
  // the JSS @Transition durations on the glass props (280ms).
  private _pressAmount = new Spring(0, 220, 26, 1);
  private _firstValid = false;
  /** Whether we're currently holding the Layer:2 override (pill above the text)
   *  through a press + its release settle. Tracked so we only set/clear the
   *  override on transitions, not every frame. */
  private _holdAbove = false;
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
      this._resolvePressed() ? 'Jwift_SelectionIndicator_Pressed' : 'Jwift_SelectionIndicator');
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
    // Subscribe to per-frame rect snapshots of our OWN Node — _sync's
    // watery-bounce stretch uses (this.Node.X - lastX)/dt to compute
    // velocity, and in worker mode JivHandle.X stays at 0 on main
    // without WatchRect(true). Without this the velocity reads as
    // zero every frame and the shape springs target 1.0 forever
    // (no stretch, no squish, no perpendicular bulge).
    this.Node.WatchRect(true);
    const tick = (): void => {
      this._sync();
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
    this._wirePointerTracking();
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._unbindPointer?.();
    this._unwatchTargets();
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  /** Replace the target/parent rect-snapshot subscriptions when the
   *  SelectionIndicator's `target` swaps to a different TabItem (selection
   *  change). The old target/parent get `WatchRect(false)` so the worker
   *  stops emitting snapshots for them, and the new pair get `(true)`. */
  private _ensureWatched(target: JivCore | null, parent: JivCore | null): void {
    if (target === this._watchedTarget && parent === this._watchedParent) return;
    if (this._watchedTarget && this._watchedTarget !== target) {
      this._watchedTarget.WatchRect(false);
    }
    if (this._watchedParent && this._watchedParent !== parent) {
      this._watchedParent.WatchRect(false);
    }
    this._watchedTarget = target;
    this._watchedParent = parent;
    if (target) target.WatchRect(true);
    if (parent && parent !== target) parent.WatchRect(true);
  }

  private _unwatchTargets(): void {
    this._watchedTarget?.WatchRect(false);
    this._watchedParent?.WatchRect(false);
    this._watchedTarget = null;
    this._watchedParent = null;
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
    };
    const onClear = () => {
      this._pointerX = null;
      this._pointerDownX = null;
      this._dragActive = false;
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

  private _sync(): void {
    const t = this.target();
    if (!t) {
      this._unwatchTargets();
      return;
    }

    const parent = t.Parent as (JivCore | null);
    // Subscribe to per-frame rect snapshots from the worker — without
    // this the JivHandle's X/Y/Width/Height stay at zero on main and
    // the indicator never sizes itself correctly. Re-runs on target swap.
    this._ensureWatched(t, parent);

    let ctxNode: JivCore | null = parent;
    while (ctxNode && !ctxNode.ResolveCtx) ctxNode = ctxNode.Parent as (JivCore | null);
    if (parent && ctxNode?.ResolveCtx) {
      this._lastPad = ResolveLengthTuple4(
        parent.Layout.Padding, ctxNode.ResolveCtx, ['H', 'W', 'H', 'W']);
    }
    if (t.Width <= 0 || t.Height <= 0) return;

    const isPressed = this._resolvePressed();

    const now = performance.now();
    // Upper clamp prevents first-frame Euler blowup (dt of billions of ms).
    const haveLast = this._lastT > 0;
    const dt = haveLast
      ? Math.min(0.033, Math.max(0.001, (now - this._lastT) / 1000))
      : 0.016;

    // Smooth the press transition over a continuous spring rather than a
    // boolean — every visual parameter (glass thickness, refraction, rim,
    // tint, pad, size boost) then springs in lockstep across the
    // press/release transition. Without this, baseWidth/baseHeight snap
    // discontinuously when isPressed flips and the @Transition Width/Height
    // springs chase the snap, producing a visible size "skip."
    this._pressAmount.Target = isPressed ? 1 : 0;
    this._pressAmount.Step(dt);
    const pressAmount = this._pressAmount.Value;

    // Keep the pill ABOVE the label for the WHOLE press gesture INCLUDING the
    // release settle. The base/pressed JSS classes flip Layer (0↔2) the instant
    // the pressed flag changes — so on release the pill would drop below the text
    // while the magnify spring is still relaxing, hiding the settle. Hold a
    // Layer:2 style override (it merges over the class) until pressAmount has
    // fully relaxed, then clear it so the resting pill sits beneath the crisp
    // label again. Only fires on the two transitions, not per frame.
    const holdAbove = isPressed || pressAmount > 0.01;
    if (holdAbove !== this._holdAbove) {
      this._holdAbove = holdAbove;
      if (holdAbove) this.SetStyleOverride({ Layer: 2 });
      else this.ClearStyleOverride('Layer');
    }

    const [padTRaw, padRRaw, padBRaw, padLRaw] = this._lastPad;
    const padT = padTRaw * pressAmount;
    const padR = padRRaw * pressAmount;
    const padB = padBRaw * pressAmount;
    const padL = padLRaw * pressAmount;
    const pressBoostY = 6 * pressAmount;
    const pressBoostX = t.Height > 0 ? pressBoostY * (t.Width / t.Height) : 0;
    const baseWidth = t.Width + padL + padR + pressBoostX * 2;
    const baseHeight = t.Height + padT + padB + pressBoostY * 2;

    let centerX = t.X + t.Width / 2;
    let overshoot = 0;
    // Dead-zone the pointer follow: only swap centerX → finger position once
    // the pointer has actually moved past the drag threshold. Tap-and-hold
    // (finger registers a few px off the visual center, as fingers do) then
    // stays centered on the tab. Only an actual drag-across-tabs engages
    // the liquid follow.
    if (this._dragActive && this._pointerX !== null) {
      centerX = this._pointerX;
      if (parent) {
        const minCenter = parent.X + padL + t.Width / 2;
        const maxCenter = parent.X + parent.Width - padR - t.Width / 2;
        if (centerX < minCenter) { overshoot = centerX - minCenter; centerX = minCenter; }
        else if (centerX > maxCenter) { overshoot = centerX - maxCenter; centerX = maxCenter; }
      }
    }

    const vx = haveLast ? (this.Node.X - this._lastX) / dt : 0;
    const vy = haveLast ? (this.Node.Y - this._lastY) / dt : 0;
    this._lastT = now;
    this._lastX = this.Node.X;
    this._lastY = this.Node.Y;

    const STRETCH_MAX = 0.35;
    const SPEED_HALF = 500;
    const PERP_GAIN = 1.35;
    // Stretch is meant to react to USER motion (drag-while-pressed across
    // tabs), not to the indicator's own animation settling. Gating by
    // _dragActive (instead of isPressed) excludes both:
    //   - press-in expansion (target X drifts left as baseWidth grows
    //     symmetrically about centerX, would otherwise feed horizontal
    //     squish on every tap)
    //   - release settle (pressAmount shrinks, Y spring chases, vy reads
    //     positive, would otherwise pile vertical compression on top of
    //     the legitimate shrink)
    // Squish now only fires during an actual drag across tabs.
    const speed = this._dragActive ? Math.hypot(vx, vy) : 0;
    const stretch = STRETCH_MAX * speed / (speed + SPEED_HALF);
    const hShare = speed > 0 ? Math.abs(vx) / speed : 0;
    const vShare = speed > 0 ? Math.abs(vy) / speed : 0;
    let scaleX = 1 - stretch * hShare + stretch * vShare * PERP_GAIN;
    let scaleY = 1 - stretch * vShare + stretch * hShare * PERP_GAIN;

    if (overshoot !== 0) {
      const SQUISH_HALF = 120;
      const SQUISH_MAX = 0.22;
      const sq = SQUISH_MAX * Math.abs(overshoot) / (Math.abs(overshoot) + SQUISH_HALF);
      scaleX *= 1 - sq;
      scaleY *= 1 + sq * PERP_GAIN;
    }

    this._shapeX.Target = scaleX;
    this._shapeY.Target = scaleY;
    this._shapeX.Step(dt);
    this._shapeY.Step(dt);

    const width = baseWidth * this._shapeX.Value;
    const height = baseHeight * this._shapeY.Value;
    // Placed: cl.Left/Top are relative to parent's box.
    const parentX = parent?.X ?? 0;
    const parentY = parent?.Y ?? 0;
    const left = centerX - width / 2 - parentX;
    const top = t.Y + t.Height / 2 - height / 2 - parentY;

    const cl = this.Node.ChildLayout;
    const leftPx = `${left}px`;
    const topPx = `${top}px`;
    const widthPx = `${width}px`;
    const heightPx = `${height}px`;
    let dirty = false;
    if (cl.Left !== leftPx) { cl.Left = leftPx; dirty = true; }
    if (cl.Top !== topPx) { cl.Top = topPx; dirty = true; }
    if (cl.Width !== widthPx) { cl.Width = widthPx; dirty = true; }
    if (cl.Height !== heightPx) { cl.Height = heightPx; dirty = true; }
    if (dirty) this.Node.MarkLayoutDirty();

    if (!this._firstValid) {
      this._firstValid = true;
      this.Node.SnapLayout = true;
      requestAnimationFrame(() => { this.Node.SnapLayout = false; });
    }

    const pressedNow = (parent?.Active ?? false) || t.Active;
    if (pressedNow !== this._autoPressed()) this._autoPressed.set(pressedNow);
  }
}
