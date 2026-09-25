import { ChangeDetectionStrategy, Component, computed, effect, input, signal, untracked } from '@angular/core';
import { Jext, Jiv, Jyle } from 'jaui-angular';
import { JwiftSpinner } from '../Spinner/JwiftSpinner';
import JwiftProgressJss from './JwiftProgress.jss';

/**
 * `<jwift-progress>`: SwiftUI's ProgressView as iOS 26.1 lays it out (Jwift/Apple/Sizing.md section 9).
 *
 * With a value it is the linear style: the label, a 4pt UIProgressView bar, then the current value
 * label, stacked leading at 4pt. Without a value it is the circular style: the activity indicator over
 * the label. A new label crossfades over the old one in the same place.
 *
 * Usage:
 *   <jwift-progress [value]="0.4" label="Downloading" />
 *   <jwift-progress [value]="done" [total]="count" label="Importing" currentValueLabel="3 of 8" />
 *   <jwift-progress [value]="null" label="Preparing" />
 *
 * Per the HIG, a bar that shows the amount carries no percentage in its label, and a load that starts
 * as one shape stays that shape.
 */
@Component({
  selector: 'jwift-progress',
  standalone: true,
  imports: [Jiv, Jext, Jyle, JwiftSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    <jiv [class]="_Determinate() ? 'JwiftProgress' : 'JwiftProgress_Circular'">
      @if (!_Determinate()) {
        <jwift-spinner [color]="spinnerColor()" />
      }
      @if (label()) {
        <jiv class="JwiftProgressLabelSlot">
          @for (slot of _Slots; track slot) {
            <jext [class]="_LabelClass(slot)" [text]="_Labels().Texts[slot]" />
          }
        </jiv>
      }
      @if (_Determinate()) {
        <jiv class="JwiftProgressTrack" [style]="_TrackStyle()">
          <jiv class="JwiftProgressFill" [childLayout]="_FillLayout()" [style]="_FillStyle()">
            <jiv class="JwiftProgressFillShade" />
          </jiv>
        </jiv>
        @if (currentValueLabel()) {
          <jext class="JwiftProgressValue" [text]="currentValueLabel()" />
        }
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class JwiftProgress {
  /** Completed amount, out of `total`. Null means the amount is unknown: the circular style. */
  readonly value = input<number | null>(null);
  readonly total = input<number>(1);
  readonly label = input<string>('');
  /** Text under the bar, such as "3 of 8". Leave it empty when the bar alone says how far along it is. */
  readonly currentValueLabel = input<string>('');
  /** The fill: the app's tint, as UIProgressView takes the view's tintColor. */
  readonly tint = input<string>('@Gold');
  /** The track: UIKit's systemFill. */
  readonly trackTint = input<string>('@SystemFill');
  /** The circular style's spokes: UIKit's secondaryLabel. */
  readonly spinnerColor = input<string>('@SecondaryLabel');

  protected readonly JssSource = JwiftProgressJss;
  protected readonly _Slots = [0, 1] as const;

  protected readonly _Determinate = computed(() => this.value() !== null);

  private readonly _Fraction = computed(() => {
    const value = this.value();
    const total = this.total();
    if (value === null || !(total > 0)) return 0;
    return Math.min(1, Math.max(0, value / total));
  });

  // Two slots take turns: the incoming label lands in the slot that finished fading out last time.
  protected readonly _Labels = signal<{ Texts: [string, string]; Front: 0 | 1 }>({ Texts: ['', ''], Front: 0 });
  private readonly _LabelSync = effect(() => {
    const next = this.label();
    untracked(() => {
      const current = this._Labels();
      if (current.Texts[current.Front] === next) return;
      const back: 0 | 1 = current.Front === 0 ? 1 : 0;
      const texts: [string, string] = [...current.Texts];
      texts[back] = next;
      this._Labels.set({ Texts: texts, Front: back });
    });
  });

  protected _LabelClass(slot: 0 | 1): string {
    return this._Labels().Front === slot ? 'JwiftProgressLabel' : 'JwiftProgressLabel_Leaving';
  }

  protected readonly _TrackStyle = computed(() => ({ Background: this.trackTint() }));

  protected readonly _FillLayout = computed(() => ({ Width: `${(this._Fraction() * 100).toFixed(3)}%` }));

  protected readonly _FillStyle = computed(() => ({
    Background: this.tint(),
    Opacity: this._Fraction() > 0 ? '1' : '0',
  }));
}
