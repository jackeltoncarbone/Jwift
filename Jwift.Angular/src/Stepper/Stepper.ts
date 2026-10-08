import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import StepperJss from './Stepper.jss';

/**
 * `<stepper>` — Apple's own UIStepper shape: one two-segment capsule, minus and plus, a hairline the
 * one seam between them. `hideValue` (true for the stepper beside a wheel or under a dial, which already
 * show the number themselves) drops the value a standalone stepper otherwise reads between the segments,
 * each then a pair of dividers rather than one. `coarse` is the caller's own pointer read — Jwift carries
 * no sense of its own of which the app's `UiState.Coarse` is.
 *
 *   <stepper [value]="Count()" [min]="2" [step]="2" (valueChange)="Count.set($event)" />
 */
@Component({
  selector: 'stepper',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_Stepper">
      <jiv [class]="_MinusClass()" (click)="_bump(-step())">
        <icon class="Jwift_StepperGlyph" Name="minus" />
      </jiv>
      <jiv class="Jwift_StepperDivider" />
      @if (!hideValue()) {
        <jext class="Jwift_StepperValue" [text]="value() + ''" />
        <jiv class="Jwift_StepperDivider" />
      }
      <jiv [class]="_PlusClass()" (click)="_bump(step())">
        <icon class="Jwift_StepperGlyph" Name="plus" />
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class Stepper {
  protected readonly Jss = StepperJss;

  readonly value = input.required<number>();
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input<number>(1);
  readonly disabled = input<boolean>(false);
  /** True beside a wheel or under a dial (`NumberField`'s own Wheel mode, `AngleDial`): the value already
   *  shows there, so this stays a bare two-segment capsule. */
  readonly hideValue = input(false);
  /** Apple's 44pt touch floor for each segment, read from the caller (Jwift has no pointer sense of its
   *  own); the house's 30pt otherwise. */
  readonly coarse = input(false);

  readonly valueChange = output<number>();

  protected readonly _MinusClass = computed(() => this._segClass(this.disabled() || this._atMin()));
  protected readonly _PlusClass = computed(() => this._segClass(this.disabled() || this._atMax()));

  private _segClass(disabled: boolean): string {
    let cls = 'Jwift_StepperSeg';
    if (this.coarse()) cls += ' Jwift_StepperSeg_Coarse';
    if (disabled) cls += ' Jwift_StepperSeg_Disabled';
    return cls;
  }

  private readonly _atMin = computed(() => {
    const min = this.min();
    return min !== null && this.value() <= min;
  });
  private readonly _atMax = computed(() => {
    const max = this.max();
    return max !== null && this.value() >= max;
  });

  protected _bump(delta: number): void {
    if (this.disabled()) return;
    if (delta < 0 && this._atMin()) return;
    if (delta > 0 && this._atMax()) return;
    let next = this.value() + delta;
    const min = this.min();
    const max = this.max();
    if (min !== null) next = Math.max(min, next);
    if (max !== null) next = Math.min(max, next);
    this.valueChange.emit(next);
  }
}
