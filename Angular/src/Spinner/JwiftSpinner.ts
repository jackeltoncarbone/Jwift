import { ChangeDetectionStrategy, Component, OnDestroy, afterNextRender, computed, input } from '@angular/core';
import { Jiv, Jyle } from 'jaui-angular';
import JwiftSpinnerJss from './JwiftSpinner.jss';

/**
 * `<jwift-spinner>` — Apple-style 12-tick activity indicator.
 *
 * 12 rounded ticks arranged radially around the spinner's center; the head
 * tick is at full opacity and each successive tick steps down toward a 25%
 * floor, matching the iOS UIActivityIndicatorView look. A per-instance rAF
 * loop bumps the stage's rotation by 360°/s; ticks themselves don't move
 * relative to the stage — the opacity gradient appears to rotate because
 * the stage does.
 *
 * Usage:
 *   <jwift-spinner />                       — 20pt (medium)
 *   <jwift-spinner [size]="24" />           — 24pt
 *   <jwift-spinner [color]="'rgb(0,0,0)'" /> — black on light glass
 *
 * Mount it as a regular Jiv inside an existing JSS class (e.g. inside a
 * `Jwift_GlassDropdownCell` to occupy a 40pt cell — the cell centers it).
 * Lives quietly while unmounted: rAF cancels on Destroy.
 */
@Component({
  selector: 'jwift-spinner',
  standalone: true,
  imports: [Jiv, Jyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    <jiv class="JwiftSpinner" [childLayout]="_HostSize()">
      <jiv class="JwiftSpinnerStage" [style]="_StageStyle()">
        @for (i of TickIndices; track i) {
          <jiv class="JwiftSpinnerTick" [childLayout]="_TickPos(i)" [style]="_TickStyle(i)" />
        }
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class JwiftSpinner implements OnDestroy {
  /** Diameter in pt. Default 20pt (UIActivityIndicatorView.medium). 24-28pt
   *  reads well inside a 40pt action cell; 14pt for inline text. */
  readonly size = input<number>(20);

  /** Tick color. Default opaque white. Pair with a JSS Style override on a
   *  glass cell; for light backgrounds pass `'rgb(0,0,0)'` etc. */
  readonly color = input<string>('rgb(255, 255, 255)');

  /** Full rotations per second. Default 1.0 matches iOS cadence. */
  readonly speed = input<number>(1.0);

  protected readonly JssSource = JwiftSpinnerJss;

  // Twelve ticks every 30°. Track-by index is stable.
  protected readonly TickIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

  // Tick geometry — % of host. 7% width × 25% height (Apple ratios).
  private static readonly _TickWPct = 7;
  private static readonly _TickHPct = 25;

  // Opacity ramp: head=1.0, tail (11) ≈ 0.25. Linear ramp reads identical
  // to Apple's reference at the sizes we use; a strict eased curve buys
  // nothing visible at 20-28pt.
  private static readonly _OpacityHead = 1.0;
  private static readonly _OpacityTail = 0.25;

  // Continuous rotation driven from rAF — 360°/speed per second.
  private _rotationDeg = 0;
  private _rafId = 0;
  private _lastT = 0;

  // Re-render trigger for tick styles. computed() reading this signal keeps
  // Angular's CD aware of the per-frame rotation without us touching DOM
  // by hand. Jiv's effect picks up the style change on the next microtask.
  private readonly _tick = (() => {
    let n = 0;
    return {
      get: () => n,
      bump: () => { n = (n + 1) & 0xffff; },
    };
  })();

  constructor() {
    afterNextRender(() => this._start());
  }

  ngOnDestroy(): void {
    this._stop();
  }

  private _start = (): void => {
    if (this._rafId) return;
    this._lastT = 0;
    const loop = (t: number): void => {
      if (!this._lastT) this._lastT = t;
      const dt = (t - this._lastT) / 1000;
      this._lastT = t;
      this._rotationDeg = (this._rotationDeg + 360 * this.speed() * dt) % 360;
      this._tick.bump();
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  };

  private _stop = (): void => {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
  };

  protected readonly _HostSize = computed(() => {
    const s = this.size();
    return { Width: `${s}pt`, Height: `${s}pt` };
  });

  protected readonly _StageStyle = computed(() => {
    // Read the per-frame ticker so Angular re-evaluates this computed each
    // frame; the rotation value itself is read off `this._rotationDeg`.
    this._tick.get();
    return { Transform: `rotate(${this._rotationDeg.toFixed(2)}deg)` };
  });

  protected _TickPos = (i: number): Record<string, string> => {
    const angle = i * 30;
    const rad = (angle * Math.PI) / 180;
    // Tick center sits on a circle of radius ~38% (so the outer edge
    // reaches ~50% — the spinner's bounding circle). Subtract tick
    // half-extents to convert center→top-left.
    const centerOffsetPct = 38;
    const halfWPct = JwiftSpinner._TickWPct / 2;
    const halfHPct = JwiftSpinner._TickHPct / 2;
    const cxPct = 50 + centerOffsetPct * Math.sin(rad);
    const cyPct = 50 - centerOffsetPct * Math.cos(rad);
    return {
      Left: `${cxPct - halfWPct}%`,
      Top: `${cyPct - halfHPct}%`,
    };
  };

  protected _TickStyle = (i: number): Record<string, string> => {
    const angle = i * 30; // degrees, 0 at top, clockwise
    const opacity = JwiftSpinner._OpacityHead
      - (JwiftSpinner._OpacityHead - JwiftSpinner._OpacityTail) * (i / 11);
    return {
      Opacity: opacity.toFixed(3),
      Background: this.color(),
      Transform: `rotate(${angle}deg)`,
    };
  };
}
