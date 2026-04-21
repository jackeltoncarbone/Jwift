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
import { Jiv as JivCore, ResolveLengthTuple4, Spring } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import SelectionIndicatorJss from './SelectionIndicator.jss';

/**
 * `<selection-indicator>` — a free-floating Liquid Glass pill that
 * tracks the rect of any `[target]` Jaui node. Place it as a sibling of
 * the items it selects across (tab items, segmented control segments,
 * sidebar rows, etc.) so it renders inside the same parent and at
 * Layer: -1 sits behind them.
 *
 *   <tab-bar [selected]="Selected()" #tb>
 *     <selection-indicator [target]="tb.ActiveNode()" />
 *     @for (t of Tabs(); track t.Label; let i = $index) {
 *       <tab-item ... (click)="Select(i)" />
 *     }
 *   </tab-bar>
 *
 * Motion: the indicator is a Jiv with Position: Fixed; each frame its
 * ChildLayout.Left/Top/Width/Height are synced to the target's X/Y/W/H.
 * Jaui's layout animator springs the rect between targets → viscous
 * droplet motion for free.
 */
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
  /** The Jaui node (JivCore) whose rect this indicator should track.
   *  Pass `null` to hide (pill ramps its size to 0 via the spring). */
  readonly target = input<JivCore | null>(null);

  /** Set true while the pill should look like a full Liquid Glass droplet
   *  (refraction + specular + bevel). Default behavior auto-detects a
   *  "press" by watching the target's parent Active flag — when any
   *  sibling is being pressed, the parent flips Active (CSS-like
   *  propagation). Override by passing `[pressed]` explicitly. */
  readonly pressed = input<boolean | null>(null);

  private _canvasRef = inject(Jaui, { optional: true });
  private _rafId = 0;
  private _autoPressed = signal(false);
  /** Last successfully-resolved parent padding. Caching protects against
   *  transient frames where `parent.ResolveCtx` is null (pre-layout) or
   *  the target momentarily measures to zero — without this, the pill
   *  would blink to an un-padded rect and spring back on the next frame. */
  private _lastPad: [number, number, number, number] = [0, 0, 0, 0];
  /** Water-jiggle state: last frame timestamp + rendered X/Y. Needed to
   *  compute the instantaneous velocity the Transform scale modulates
   *  against. */
  private _lastT = 0;
  private _lastX = 0;
  private _lastY = 0;
  /** Live pointer position in canvas CSS px, captured from pointerdown/move
   *  on the canvas. Non-null only during an active pointer interaction.
   *  When set AND pressed, the pill's horizontal center follows the pointer
   *  instead of snapping to the target tab's center — so the glass visibly
   *  flows under the finger during a drag, rather than hopping tab-to-tab. */
  private _pointerX: number | null = null;
  private _unbindPointer: (() => void) | null = null;
  /** Shape-mass springs for ScaleX/ScaleY. The velocity-derived stretch
   *  is the TARGET each frame; these springs LAG it, giving the pill
   *  inertia. Near-critical damping (ζ ≈ 0.6) so motion is liquid but
   *  not jittery. */
  private _shapeX = new Spring(1, 2500, 60, 1);
  private _shapeY = new Spring(1, 2500, 60, 1);

  constructor() {
    super('SelectionIndicator', SelectionIndicatorJss, 'Jwift_SelectionIndicator', () => {
      const override = this.pressed();
      const p = override ?? this._autoPressed();
      return p ? 'Jwift_SelectionIndicator_Pressed' : 'Jwift_SelectionIndicator';
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
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
    this._detachOnDestroy();
  }

  /** Capture live pointer coords from the canvas so the pill can follow
   *  the finger during a press-drag. We update _pointerX each pointermove,
   *  clear it on up/cancel. Non-null only while a pointer is actively
   *  interacting. */
  private _wirePointerTracking(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;
    const toCanvasX = (clientX: number): number => {
      const rect = el.getBoundingClientRect();
      return clientX - rect.left;
    };
    const onDown = (e: PointerEvent) => { this._pointerX = toCanvasX(e.clientX); };
    const onMove = (e: PointerEvent) => {
      // Only track while a button is down — otherwise a hovering pointer
      // would drag the pill around without the user pressing anything.
      if (e.buttons === 0) return;
      this._pointerX = toCanvasX(e.clientX);
    };
    const onClear = () => { this._pointerX = null; };
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

  /** Sync ChildLayout anchors to target's absolute rect. Skip until the
   *  target's layout has measured (Width/Height > 0) so the indicator
   *  doesn't flash at (0,0) on first mount. Also auto-detect press state
   *  by watching target's parent Active flag — CSS-style hover/active
   *  propagation means when any sibling of the target is pressed, the
   *  parent's Active flips true. */
  private _sync(): void {
    const t = this.target();
    if (!t) return;

    // Auto-inset: grow the pill outward by the target's container's
    // Padding — pill reaches to the container's INNER edge (past items
    // into the padded area). Cache the last good resolve so transient
    // pre-layout frames don't collapse the expansion. Walk up the
    // ancestor chain if the direct parent doesn't have ResolveCtx yet.
    const parent = t.Parent as (JivCore | null);
    let ctxNode: JivCore | null = parent;
    while (ctxNode && !ctxNode.ResolveCtx) ctxNode = ctxNode.Parent as (JivCore | null);
    if (parent && ctxNode?.ResolveCtx) {
      this._lastPad = ResolveLengthTuple4(
        parent.Layout.Padding, ctxNode.ResolveCtx, ['H', 'W', 'H', 'W']);
    }
    // Bail AFTER recording the latest padding, so a transient 0-sized
    // target doesn't clobber our cached padding (the rect write below
    // is what we skip). target rect comes in CSS px.
    if (t.Width <= 0 || t.Height <= 0) return;

    // Press expansion baked into layout: at rest the pill matches the
    // target rect; on press it grows outward into the parent's padded
    // edge plus a small vertical overshoot (iOS 26 long-press "bubble
    // rise"). JivAnimator springs the rect between tabs via @Transition
    // X/Y/Width/Height.
    const override = this.pressed();
    const isPressed = override !== null ? override : this._autoPressed();
    const [padT, padR, padB, padL] = isPressed ? this._lastPad : [0, 0, 0, 0];
    const pressBoostY = isPressed ? 6 : 0;
    const pressBoostX = isPressed && t.Height > 0 ? pressBoostY * (t.Width / t.Height) : 0;
    const baseWidth = t.Width + padL + padR + pressBoostX * 2;
    const baseHeight = t.Height + padT + padB + pressBoostY * 2;

    // Horizontal center: pointer while pressed+dragging, target's center
    // otherwise. Clamp to the range of tab CENTERS (not tab edges), so
    // at the endpoints the pill rests in the same position it'd naturally
    // occupy when that tab is selected — including its overhang past the
    // parent's left/right edge by pressBoostX (concentric with the top/
    // bottom overhang by pressBoostY).
    let centerX = t.X + t.Width / 2;
    let overshoot = 0;
    if (isPressed && this._pointerX !== null) {
      centerX = this._pointerX;
      if (parent) {
        const minCenter = parent.X + padL + t.Width / 2;
        const maxCenter = parent.X + parent.Width - padR - t.Width / 2;
        if (centerX < minCenter) { overshoot = centerX - minCenter; centerX = minCenter; }
        else if (centerX > maxCenter) { overshoot = centerX - maxCenter; centerX = maxCenter; }
      }
    }
    // Water jiggle — velocity-based squash/stretch baked into the pill's
    // actual width/height (not Transform scale, since the panel
    // renderer doesn't apply Transform). Velocity comes from the actual
    // rendered X/Y post-spring, so the stretch tracks the visible
    // motion curve. The asymptote caps horizontal stretch at STRETCH_MAX;
    // perpendicular compresses by stretch/1.5 to fake volume conservation.
    const now = performance.now();
    // Clamp dt to [1ms, 33ms]. Without the upper clamp, the very first
    // frame has (now - 0) → billions of ms as dt, which blows the shape
    // spring to ±1e22 (huge dt × stiff spring = Euler divergence beyond
    // the substep cap). Upper bound also handles tab-away pauses.
    const dt = Math.min(0.033, Math.max(0.001, (now - this._lastT) / 1000));
    // Skip velocity computation until we have a real prior frame — else
    // the initial Node.X - 0 gets divided by a tiny clamped dt and
    // registers as a fake 600,000 px/s "sweep" on mount.
    const haveLast = this._lastT > 0;
    const vx = haveLast ? (this.Node.X - this._lastX) / dt : 0;
    const vy = haveLast ? (this.Node.Y - this._lastY) / dt : 0;
    this._lastT = now;
    this._lastX = this.Node.X;
    this._lastY = this.Node.Y;

    const STRETCH_MAX = 0.35;
    const SPEED_HALF = 500;
    // Perpendicular-axis bulge is slightly stronger than motion-axis
    // compression (PERP_GAIN > 1) for the water-droplet asymmetry.
    const PERP_GAIN = 1.35;
    const speed = Math.hypot(vx, vy);
    const stretch = STRETCH_MAX * speed / (speed + SPEED_HALF);
    const hShare = speed > 0 ? Math.abs(vx) / speed : 0;
    const vShare = speed > 0 ? Math.abs(vy) / speed : 0;
    // Motion axis COMPRESSES (pill squeezed in the direction it's moving,
    // like pushing through thick fluid), perpendicular axis BULGES. This
    // is the inverse of the usual "trail stretches behind" motion — it's
    // what reads right for the iOS 26 tab-bar droplet getting squished
    // as it moves between tabs.
    let scaleX = 1 - stretch * hShare + stretch * vShare * PERP_GAIN;
    let scaleY = 1 - stretch * vShare + stretch * hShare * PERP_GAIN;

    // Edge squish — overshoot past the clamp compresses the pill on the
    // motion axis ("water against glass"), bulges perpendicular. Same
    // asymmetry as motion.
    if (overshoot !== 0) {
      const SQUISH_HALF = 120;
      const SQUISH_MAX = 0.22;
      const sq = SQUISH_MAX * Math.abs(overshoot) / (Math.abs(overshoot) + SQUISH_HALF);
      scaleX *= 1 - sq;
      scaleY *= 1 + sq * PERP_GAIN;
    }

    // Shape inertia — feed the velocity-derived scale into underdamped
    // springs so the rendered shape lags the "desired" shape. On a
    // sudden direction reversal the spring's still at the old stretch
    // while the target drops toward rest; it overshoots through 1.0
    // and briefly flips into the opposite shape before settling. That
    // overshoot IS the physical squish-before-expand the Apple tab bar
    // has.
    this._shapeX.Target = scaleX;
    this._shapeY.Target = scaleY;
    this._shapeX.Step(dt);
    this._shapeY.Step(dt);

    const width = baseWidth * this._shapeX.Value;
    const height = baseHeight * this._shapeY.Value;
    const left = centerX - width / 2;
    const top = t.Y + t.Height / 2 - height / 2;

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

    // Active is declared on Jiv (not base Element); target is always a
    // Jiv in practice, cast for type access.
    const pressedNow = (parent?.Active ?? false) || t.Active;
    if (pressedNow !== this._autoPressed()) this._autoPressed.set(pressedNow);
  }
}
