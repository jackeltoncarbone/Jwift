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

  private _canvasRef = inject(Jaui, { optional: true });
  private _rafId = 0;
  private _autoPressed = signal(false);
  private _lastPad: [number, number, number, number] = [0, 0, 0, 0];
  private _lastT = 0;
  private _lastX = 0;
  private _lastY = 0;
  private _pointerX: number | null = null;
  private _unbindPointer: (() => void) | null = null;
  private _shapeX = new Spring(1, 2500, 60, 1);
  private _shapeY = new Spring(1, 2500, 60, 1);
  private _firstValid = false;

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

  private _wirePointerTracking(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;
    const toCanvasX = (clientX: number): number => {
      const rect = el.getBoundingClientRect();
      return clientX - rect.left;
    };
    const onDown = (e: PointerEvent) => { this._pointerX = toCanvasX(e.clientX); };
    const onMove = (e: PointerEvent) => {
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

  private _sync(): void {
    const t = this.target();
    if (!t) return;

    const parent = t.Parent as (JivCore | null);
    let ctxNode: JivCore | null = parent;
    while (ctxNode && !ctxNode.ResolveCtx) ctxNode = ctxNode.Parent as (JivCore | null);
    if (parent && ctxNode?.ResolveCtx) {
      this._lastPad = ResolveLengthTuple4(
        parent.Layout.Padding, ctxNode.ResolveCtx, ['H', 'W', 'H', 'W']);
    }
    if (t.Width <= 0 || t.Height <= 0) return;

    const override = this.pressed();
    const isPressed = override !== null ? override : this._autoPressed();
    const [padT, padR, padB, padL] = isPressed ? this._lastPad : [0, 0, 0, 0];
    const pressBoostY = isPressed ? 6 : 0;
    const pressBoostX = isPressed && t.Height > 0 ? pressBoostY * (t.Width / t.Height) : 0;
    const baseWidth = t.Width + padL + padR + pressBoostX * 2;
    const baseHeight = t.Height + padT + padB + pressBoostY * 2;

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

    const now = performance.now();
    // Upper clamp prevents first-frame Euler blowup (dt of billions of ms).
    const dt = Math.min(0.033, Math.max(0.001, (now - this._lastT) / 1000));
    const haveLast = this._lastT > 0;
    const vx = haveLast ? (this.Node.X - this._lastX) / dt : 0;
    const vy = haveLast ? (this.Node.Y - this._lastY) / dt : 0;
    this._lastT = now;
    this._lastX = this.Node.X;
    this._lastY = this.Node.Y;

    const STRETCH_MAX = 0.35;
    const SPEED_HALF = 500;
    const PERP_GAIN = 1.35;
    const speed = Math.hypot(vx, vy);
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
