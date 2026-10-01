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
  viewChild,
} from '@angular/core';
import { Jaui, Jext, Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { CanvasPress } from '../Internal/CanvasPress';
import { Follow } from '../Internal/CanvasFollow';
import { Stepper } from '../Stepper/Stepper';
import { AngleAt, DialPoint, Snap as SnapAngle, Wrap180 } from './AngleDial.Logic';
import AngleDialJss from './AngleDial.jss';

const RING_RADIUS = 100;
const KNOB_RADIUS = RING_RADIUS - 14;
const DOTS = [-180, -135, -90, -45, 0, 45, 90, 135] as const;

/**
 * `<angle-dial>`: a drag-to-set compass, snapping within 7deg of the eight 45deg points. 0 is forward
 * (up), clockwise is positive. The house `<stepper>` below it is the WCAG 2.5.7 single-pointer
 * alternative to the drag.
 */
@Component({
  selector: 'angle-dial',
  standalone: true,
  imports: [Jiv, Jext, Stepper],
  template: `
    <jiv #face class="Jwift_AngleDialFace" (pointerdown)="_onPointerDown($event)">
      <jiv class="Jwift_AngleDialRing" />
      @for (dot of _dots; track dot.Angle) {
        <jiv [class]="dot.Angle === 0 ? 'Jwift_AngleDialDot Jwift_AngleDialDot_Zero' : 'Jwift_AngleDialDot'"
             [childLayout]="dot.Layout" semantics="Button" [label]="_dotLabel(dot.Angle)" (click)="_pickDot(dot.Angle)" />
      }
      <jiv [class]="_tracking() ? 'Jwift_AngleDialNeedleContainer_Tracking' : 'Jwift_AngleDialNeedleContainer'" [style]="_needleStyle()">
        <jiv class="Jwift_AngleDialNeedle" />
      </jiv>
      <jiv [class]="_tracking() ? 'Jwift_AngleDialKnob_Tracking' : 'Jwift_AngleDialKnob'" [childLayout]="_knobLayout()" />
      <jiv class="Jwift_AngleDialReadout">
        <jext class="Jwift_AngleDialValue" [text]="_valueText()" />
        @if (Caption()) { <jext class="Jwift_AngleDialCaption" [text]="Caption() ?? ''" /> }
      </jiv>
    </jiv>
    <stepper [value]="Value()" [min]="-180" [max]="180" [step]="1" (valueChange)="_onStepper($event)" />
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: Jiv, useExisting: forwardRef(() => AngleDial) }],
})
export class AngleDial extends JivHost implements OnInit, OnDestroy {
  /** Degrees in `(-180, 180]`; 0 is forward, clockwise is positive. */
  readonly Value = input.required<number>();
  readonly Caption = input<string | null>(null);
  readonly Label = input('');
  readonly StepperLabels = input<{ Minus: string; Plus: string } | null>(null);

  /** Emitted continuously (whole degrees) while dragging. */
  readonly ValueChange = output<number>();
  /** Emitted once, on release. */
  readonly ValueCommit = output<number>();

  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _face = viewChild<Jiv>('face');
  protected readonly _tracking = signal(false);
  private _unfollow: (() => void) | null = null;

  protected readonly _dots = DOTS.map((angle) => {
    const p = DialPoint(angle, RING_RADIUS);
    const size = angle === 0 ? 8 : 6;
    return {
      Angle: angle,
      Layout: { Position: 'Placed' as const, Left: `${100 + p.X - size / 2}px`, Top: `${100 + p.Y - size / 2}px` },
    };
  });

  protected readonly _needleStyle = computed(() => ({ Transform: `rotate(${Math.round(this.Value())}deg)` }));
  protected readonly _knobLayout = computed(() => {
    const p = DialPoint(this.Value(), KNOB_RADIUS);
    return { Position: 'Placed' as const, Left: `${100 + p.X - 14}px`, Top: `${100 + p.Y - 14}px` };
  });
  protected readonly _valueText = computed(() => `${Math.round(this.Value())}°`);

  constructor() {
    super('AngleDial', AngleDialJss, 'Jwift_AngleDial', () => 'Jwift_AngleDial');
  }

  ngOnInit(): void {
    this._attachOnInit();
    this._face()?.Node.WatchRect(true);
  }

  ngOnDestroy(): void {
    this._unfollow?.();
    this._detachOnDestroy();
  }

  protected _dotLabel(angle: number): string {
    return `${this.Label()}, ${angle}°`;
  }

  protected _pickDot(angle: number): void {
    this.ValueChange.emit(Wrap180(angle));
    this.ValueCommit.emit(Wrap180(angle));
  }

  protected _onStepper(value: number): void {
    const wrapped = Wrap180(value);
    this.ValueChange.emit(wrapped);
    this.ValueCommit.emit(wrapped);
  }

  protected _onPointerDown(e: PointerEvent): void {
    const canvasEl = this._canvasRef?.Canvas?.Element;
    const face = this._face()?.Node;
    if (!canvasEl || !face) return;
    this._tracking.set(true);
    let lastValue = this.Value();
    let wasInDetent = false;
    this._unfollow = Follow(canvasEl, {
      ClientX: e.clientX, ClientY: e.clientY, PointerType: e.pointerType, PointerId: e.pointerId,
    }, {
      Move: (clientX, clientY) => {
        const [x, y] = CanvasPress.ToNode(this._canvasRef?.Canvas, clientX, clientY);
        const cx = face.X + 100, cy = face.Y + 100;
        const raw = AngleAt(x - cx, y - cy);
        const snapped = SnapAngle(raw);
        const inDetent = snapped !== raw;
        if (inDetent && !wasInDetent) navigator.vibrate?.(8);
        wasInDetent = inDetent;
        lastValue = snapped;
        this.ValueChange.emit(Math.round(snapped));
      },
      End: () => { this._tracking.set(false); this._unfollow = null; this.ValueCommit.emit(Math.round(lastValue)); },
      Cancel: () => { this._tracking.set(false); this._unfollow = null; },
    });
  }
}
