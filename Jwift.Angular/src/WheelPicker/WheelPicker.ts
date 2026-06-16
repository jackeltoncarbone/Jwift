import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { WheelItem } from './WheelItem';
import {
  ClampPosition,
  DefaultWheelGeometry,
  NearestIndex,
  type WheelGeometry,
} from './WheelPicker.Logic';
import WheelPickerJss from './WheelPicker.jss';

/**
 * `<wheel-picker>` — iOS-style drum selector, canvas-native (Jaui/Jwift).
 *
 *   <wheel-picker [selectedValue]="squad()" (valueChange)="setSquad($event)">
 *     @for (n of squads(); track n) {
 *       <wheel-item [value]="n" [label]="n + ''" />
 *     }
 *   </wheel-picker>
 *
 * Holds `<wheel-item>` rows (projected children). Owns the gesture: it
 * listens for pointer drag on the Jaui canvas, tracks the finger 1:1 into a
 * fractional `ScrollPosition`, glides on release with momentum, then eases to
 * the nearest row. Each `<wheel-item>` reads `ScrollPosition` + `Geometry`
 * and positions itself on the drum — see WheelItem / WheelPicker.Logic.
 *
 * Smoothing lives in the POSITION physics, not in JSS transitions: drag is
 * instant, momentum + snap are rAF-tweened. So the rows' VisualTranslate has
 * no @Transition and never lags the finger.
 */
@Component({
  selector: 'wheel-picker',
  standalone: true,
  imports: [Jiv],
  template: `
    <jiv class="Jwift_WheelSelectionBand" />
    <ng-content></ng-content>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => WheelPicker) },
  ],
})
export class WheelPicker extends JivHost implements OnInit, OnDestroy {
  /** Controlled selection — the `value` of the row to center on. */
  readonly selectedValue = input<unknown>(null);
  /** Row band height, px — row pitch AND the drum's tooth pitch. */
  readonly itemHeight = input<number>(DefaultWheelGeometry.ItemHeight);
  /** Drum radius, px — larger flattens the wheel (gentler bunching). */
  readonly radius = input<number>(DefaultWheelGeometry.Radius);

  readonly valueChange = output<unknown>();

  /** Rows in projection order. */
  readonly Items = contentChildren(WheelItem);
  /** Live fractional scroll position (in rows). Rows read this to place themselves. */
  readonly ScrollPosition = signal(0);

  readonly Geometry = computed<WheelGeometry>(() => ({
    ...DefaultWheelGeometry,
    ItemHeight: this.itemHeight(),
    Radius: this.radius(),
  }));

  private readonly _count = computed(() => this.Items().length);

  private _canvasRef = inject(Jaui, { optional: true });
  private _raf = 0;
  private _unbind: (() => void) | null = null;

  // ── Gesture state ──
  private _pointerId: number | null = null;
  private _dragging = false;
  private _dragStartY = 0;
  private _lastY = 0;
  private _lastT = 0;
  private _velocity = 0; // rows per ms
  private _wheelSnapTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly _ClickThresholdPx = 5;
  private static readonly _SnapMs = 280;

  constructor() {
    super('WheelPicker', WheelPickerJss, 'Jwift_WheelPicker', () => 'Jwift_WheelPicker');

    // Controlled-value sync: when the consumer drives `selectedValue` (or the
    // rows arrive), center on the matching row. Skipped while the user is
    // actively dragging so an echoed value can't fight the finger.
    effect(() => {
      const val = this.selectedValue();
      const items = this.Items();
      const idx = items.findIndex(i => i.value() === val);
      if (idx < 0) return;
      untracked(() => {
        if (this._dragging) return;
        this._stopAnimation();
        this.ScrollPosition.set(ClampPosition(idx, this._count()));
      });
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
    // Worker mode: our X/Y/Width/Height stay 0 on main without this — pointer
    // gating + click hit-testing need the live rect.
    this.Node.WatchRect(true);
    this._wireGesture();
  }

  ngOnDestroy(): void {
    this._stopAnimation();
    if (this._wheelSnapTimer !== null) clearTimeout(this._wheelSnapTimer);
    this._unbind?.();
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  // ── Pointer gesture (canvas-level, like TabBar) ──
  private _wireGesture(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;

    const toCanvasY = (clientY: number): number => clientY - el.getBoundingClientRect().top;
    const inside = (clientX: number, clientY: number): boolean => {
      const r = el.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      const n = this.Node;
      return n.Width > 0 && x >= n.X && x <= n.X + n.Width && y >= n.Y && y <= n.Y + n.Height;
    };

    const onDown = (e: PointerEvent): void => {
      if (!inside(e.clientX, e.clientY)) return;
      this._stopAnimation();
      this._pointerId = e.pointerId;
      this._dragging = false;
      this._dragStartY = e.clientY;
      this._lastY = e.clientY;
      this._lastT = performance.now();
      this._velocity = 0;
      try { el.setPointerCapture(e.pointerId); } catch {}
    };

    const onMove = (e: PointerEvent): void => {
      if (this._pointerId !== e.pointerId) return;
      if (!this._dragging && Math.abs(e.clientY - this._dragStartY) > WheelPicker._ClickThresholdPx) {
        this._dragging = true;
      }
      if (!this._dragging) return;

      const now = performance.now();
      const dy = e.clientY - this._lastY;
      const dt = now - this._lastT;
      const ih = this.itemHeight();
      if (dt > 0) this._velocity = (-dy / ih) / dt;
      this.ScrollPosition.update(p => ClampPosition(p - dy / ih, this._count()));
      this._lastY = e.clientY;
      this._lastT = now;
    };

    const onUp = (e: PointerEvent): void => {
      if (this._pointerId !== e.pointerId) return;
      const wasDragging = this._dragging;
      this._pointerId = null;
      this._dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}

      if (!wasDragging) {
        const clicked = this._clickedIndex(toCanvasY(e.clientY));
        if (clicked != null && clicked !== NearestIndex(this.ScrollPosition(), this._count())) {
          this._snapTo(clicked);
          return;
        }
      }
      this._startMomentum();
    };

    // Mouse-wheel / trackpad scroll. Normalize line/page delta modes to px,
    // advance the fractional position, and debounce a snap once scrolling stops.
    const onWheel = (e: WheelEvent): void => {
      if (!inside(e.clientX, e.clientY)) return;
      e.preventDefault();
      this._stopAnimation();
      const px = e.deltaMode === 1 ? e.deltaY * 16
               : e.deltaMode === 2 ? e.deltaY * this.Node.Height
               : e.deltaY;
      const ih = this.itemHeight();
      this.ScrollPosition.update(p => ClampPosition(p + px / (ih * 2), this._count()));
      if (this._wheelSnapTimer !== null) clearTimeout(this._wheelSnapTimer);
      this._wheelSnapTimer = setTimeout(() => {
        this._wheelSnapTimer = null;
        this._snapTo(NearestIndex(this.ScrollPosition(), this._count()));
      }, 140);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    this._unbind = () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
    };
  }

  /** Row index under a canvas-Y click — offset from the centered row by how
   *  many rows the click sits above/below the selection band. */
  private _clickedIndex(canvasY: number): number | null {
    const n = this.Node;
    if (n.Height <= 0) return null;
    const relY = canvasY - n.Y;
    const offset = (relY - n.Height / 2) / this.itemHeight();
    const idx = Math.round(this.ScrollPosition() + offset);
    return idx >= 0 && idx < this._count() ? idx : null;
  }

  // ── Momentum + snap (rAF; smoothing lives here, not in JSS) ──
  private _startMomentum(): void {
    const v0 = this._velocity * 1000; // rows/sec
    if (Math.abs(v0) < 0.5) { this._snapTo(NearestIndex(this.ScrollPosition(), this._count())); return; }

    const decel = 2000 / this.itemHeight();
    const sign = Math.sign(v0);
    const startPos = this.ScrollPosition();
    const startT = performance.now();

    const step = (): void => {
      const elapsed = (performance.now() - startT) / 1000;
      const v = v0 - sign * decel * elapsed;
      if (Math.abs(v) < 0.5 || Math.sign(v) !== sign) {
        this._snapTo(NearestIndex(this.ScrollPosition(), this._count()));
        return;
      }
      const dist = v0 * elapsed - 0.5 * sign * decel * elapsed * elapsed;
      this.ScrollPosition.set(ClampPosition(startPos + dist, this._count()));
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  /** Ease the position to `index` and emit its value. */
  private _snapTo(index: number, emit = true): void {
    this._stopAnimation();
    const target = ClampPosition(index, this._count());
    const start = this.ScrollPosition();
    const startT = performance.now();

    if (emit) this.valueChange.emit(this.Items()[target]?.value() ?? null);

    if (start === target) return;
    const step = (): void => {
      const t = Math.min(1, (performance.now() - startT) / WheelPicker._SnapMs);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      this.ScrollPosition.set(start + (target - start) * e);
      if (t < 1) this._raf = requestAnimationFrame(step);
      else this.ScrollPosition.set(target);
    };
    this._raf = requestAnimationFrame(step);
  }

  private _stopAnimation(): void {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
  }
}
