import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import StepperJss from './Stepper.jss';

/**
 * `<stepper>` — minus / value / plus, UIStepper's shape. Sizes are HOUSE: Apple's UIStepper geometry is
 * not in the Sizing.md restore (see the header note in Stepper.jss), so this promotes the row the app had
 * already converged on to the standard.
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
      <jext class="Jwift_StepperValue" [text]="value() + ''" />
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

  readonly valueChange = output<number>();

  protected readonly _MinusClass = computed(() =>
    this.disabled() || this._atMin() ? 'Jwift_StepperBtn_Disabled' : 'Jwift_StepperBtn');
  protected readonly _PlusClass = computed(() =>
    this.disabled() || this._atMax() ? 'Jwift_StepperBtn_Disabled' : 'Jwift_StepperBtn');

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
