import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { Jiv as JivCore, ResolveLengthTuple4 } from 'jaui';
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

  private _rafId = 0;
  private _autoPressed = signal(false);
  /** Last successfully-resolved parent padding. Caching protects against
   *  transient frames where `parent.ResolveCtx` is null (pre-layout) or
   *  the target momentarily measures to zero — without this, the pill
   *  would blink to an un-padded rect and spring back on the next frame. */
  private _lastPad: [number, number, number, number] = [0, 0, 0, 0];

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
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._detachOnDestroy();
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

    // Padding expansion applies ONLY while pressed — at rest the pill
    // exactly matches the target rect, and on press it grows outward
    // into the container's padded edge (iOS 26 long-press morph).
    // Extra boost on press makes the droplet visibly pop past the
    // container's inner edge. X boost scales with the target's aspect
    // ratio so both dimensions grow by the same fraction — balloon-like
    // expansion, not a lopsided stretch.
    const override = this.pressed();
    const isPressed = override !== null ? override : this._autoPressed();
    const [padT, padR, padB, padL] = isPressed ? this._lastPad : [0, 0, 0, 0];
    const pressBoostY = isPressed ? 6 : 0;
    const pressBoostX = isPressed && t.Height > 0 ? pressBoostY * (t.Width / t.Height) : 0;
    const left = t.X - padL - pressBoostX;
    const top = t.Y - padT - pressBoostY;
    const width = t.Width + padL + padR + pressBoostX * 2;
    const height = t.Height + padT + padB + pressBoostY * 2;
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
