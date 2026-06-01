import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import { type ChildLayout } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import SliderJss from './Slider.jss';

export interface SliderScrubEvent {
  value: number;
  delta: number;
  event: PointerEvent;
}

/**
 * `<slider>` — Jwift canvas slider.
 *
 *   <slider [min]="0" [max]="100" [value]="time()" (valueChange)="seek($event)" />
 *
 * Track + progress fill, no separate thumb (the fill's leading edge is
 * the thumb). Pointer drag updates `value` reactively; `(scrubStart)` /
 * `(scrubMove)` / `(scrubEnd)` are emitted for callers that need to gate
 * other behavior on drag boundaries.
 *
 * The slider lives in a canvas Jaui surface — pointer math uses the
 * canvas element's bounding rect and the Jiv's measured X/Width.
 */
@Component({
  selector: 'slider',
  standalone: true,
  imports: [Jiv],
  template: `
    <jiv class="Jwift_SliderTrack">
      <jiv class="Jwift_SliderFill" [childLayout]="FillChildLayout()" />
    </jiv>
    <jiv class="Jwift_SliderHit"
         (pointerdown)="onPointerDown($event)" />
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Slider) },
  ],
})
export class Slider extends JivHost implements OnInit, OnDestroy {
  readonly min   = input<number>(0);
  readonly max   = input<number>(100);
  readonly value = input<number>(0);
  readonly snapToClick = input<boolean>(true);

  readonly valueChange = output<number>();
  readonly scrubStart  = output<{ value: number; event: PointerEvent }>();
  readonly scrubMove   = output<SliderScrubEvent>();
  readonly scrubEnd    = output<{ value: number; event: PointerEvent }>();

  private readonly _active = signal(false);

  protected readonly FillChildLayout = computed<Partial<ChildLayout>>(() => {
    const span = this.max() - this.min();
    if (span <= 0) return { Width: '0%' };
    const pct = Math.max(0, Math.min(100,
      100 * ((this.value() - this.min()) / span)));
    return { Width: pct + '%' };
  });

  private readonly _canvasRef = inject(Jaui, { optional: true });

  constructor() {
    super('Slider', SliderJss, 'Jwift_Slider', () =>
      this._active() ? 'Jwift_Slider Jwift_Slider_Active' : 'Jwift_Slider');
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }

  protected onPointerDown = (event: PointerEvent): void => {
    const start = this._valueAtPointer(event);
    if (start == null) return;
    this._active.set(true);

    let last = this.snapToClick() ? start : this.value();
    if (this.snapToClick() && last !== this.value()) {
      this.valueChange.emit(last);
    }
    this.scrubStart.emit({ value: last, event });

    const onMove = (e: PointerEvent): void => {
      const v = this._valueAtPointer(e);
      if (v == null) return;
      const delta = v - last;
      last = v;
      this.valueChange.emit(v);
      this.scrubMove.emit({ value: v, delta, event: e });
    };
    const onUp = (e: PointerEvent): void => {
      this._active.set(false);
      this.scrubEnd.emit({ value: last, event: e });
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup',   onUp,   true);
      document.removeEventListener('pointercancel', onUp, true);
    };
    document.addEventListener('pointermove',   onMove, true);
    document.addEventListener('pointerup',     onUp,   true);
    document.addEventListener('pointercancel', onUp,   true);
    event.preventDefault();
  };

  /** Convert a pointer event's clientX into a slider value, clamped. */
  private _valueAtPointer(e: PointerEvent): number | null {
    const canvas = this._canvasRef?.Canvas?.Element;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const node = this.Node;
    if (node.Width <= 0) return null;
    const ratio = Math.max(0, Math.min(1, (px - node.X) / node.Width));
    return this.min() + ratio * (this.max() - this.min());
  }
}
