import { ChangeDetectionStrategy, Component, OnDestroy, afterNextRender, computed, input, signal } from '@angular/core';
import { Jiv, Jyle } from 'jaui-angular';
import JwiftSpinnerJss from './JwiftSpinner.jss';
import {
  FrameCount, LoopSeconds, MediumSize, SpokeAngle, SpokeCount, SpokeFillAlpha, SpokeGeometryFor, SpokeStepAlpha,
} from './JwiftSpinner.Geometry';

/**
 * `<jwift-spinner>`: Apple's activity indicator, UIActivityIndicatorView as iOS 26.1 draws it.
 *
 * Eight capsule spokes that never move. The brightness travels: sixteen image frames per 0.8 s loop,
 * each spoke stepping down its alpha ramp by one frame at a time, so the bright head advances one spoke
 * clockwise every 100 ms. Discrete frames, not a fade and not a rotation (Jwift/Apple/Sizing.md section 8).
 *
 * Usage:
 *   <jwift-spinner />                     medium, 20pt
 *   <jwift-spinner [size]="37" />         large
 *   <jwift-spinner [size]="18" />         any other width takes UIKit's own custom-width table
 *   <jwift-spinner color="@Ink" />        any colour or theme token; default secondaryLabel
 */
@Component({
  selector: 'jwift-spinner',
  standalone: true,
  imports: [Jiv, Jyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    <jiv class="JwiftSpinner" [childLayout]="_BoxLayout()">
      @for (i of SpokeIndices; track i) {
        <jiv class="JwiftSpinnerSpoke" [childLayout]="_SpokeLayouts()[i]" [style]="_SpokeStyles()[i]" />
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class JwiftSpinner implements OnDestroy {
  /** The box in points: 20 is medium, 37 is large; any other width follows UIKit's custom-width table. */
  readonly size = input<number>(MediumSize);

  /** Spoke colour: a colour or a theme token. UIKit's default is secondaryLabel. */
  readonly color = input<string>('@SecondaryLabel');

  /** Loops per 0.8 s, Apple's cadence at 1. */
  readonly speed = input<number>(1);

  protected readonly JssSource = JwiftSpinnerJss;
  protected readonly SpokeIndices = Array.from({ length: SpokeCount }, (_, i) => i);

  private readonly _frame = signal(0);
  private _rafId = 0;
  private _startTime = 0;

  constructor() {
    afterNextRender(() => this._Start());
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
  }

  private _Start(): void {
    const loop = (now: number): void => {
      if (!this._startTime) this._startTime = now;
      const frameSeconds = LoopSeconds / FrameCount / Math.max(0.01, this.speed());
      const frame = Math.floor((now - this._startTime) / 1000 / frameSeconds) % FrameCount;
      if (frame !== this._frame()) this._frame.set(frame);
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  private readonly _Geometry = computed(() =>
    SpokeGeometryFor(this.size(), globalThis.devicePixelRatio || 1));

  protected readonly _BoxLayout = computed(() => {
    const box = this._Geometry().Box;
    return { Width: `${box}pt`, Height: `${box}pt` };
  });

  // A spoke is laid out upright and turned about its own centre, which sits (Radius - Length / 2) from
  // the ring's centre along the spoke's angle.
  protected readonly _SpokeLayouts = computed(() => {
    const g = this._Geometry();
    const reach = g.Radius - g.Length / 2;
    return this.SpokeIndices.map((i) => {
      const radians = (SpokeAngle(i) * Math.PI) / 180;
      const x = g.Center + reach * Math.sin(radians);
      const y = g.Center - reach * Math.cos(radians);
      return {
        Left: `${x - g.Thickness / 2}pt`,
        Top: `${y - g.Length / 2}pt`,
        Width: `${g.Thickness}pt`,
        Height: `${g.Length}pt`,
      };
    });
  });

  protected readonly _SpokeStyles = computed(() => {
    const frame = this._frame();
    const color = this.color();
    return this.SpokeIndices.map((i) => ({
      Opacity: (SpokeFillAlpha * SpokeStepAlpha(i, frame)).toFixed(4),
      Background: color,
      Transform: `rotate(${SpokeAngle(i)})`,
    }));
  });
}
