import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Jext, Jiv, Jyle } from 'jaui-angular';
import { Stepper } from '../Stepper/Stepper';
import { WheelItem } from '../WheelPicker/WheelItem';
import { WheelPicker } from '../WheelPicker/WheelPicker';
import NumberFieldJss from './NumberField.jss';

export interface NumberFieldUnit {
  readonly Key: string;
  readonly Label: string;
}

export interface NumberFieldFormatted {
  readonly Main: string;
  readonly Sub?: string;
  readonly Tag?: string;
  readonly Over?: boolean;
}

export type NumberFieldFormat = (value: number, unit: string | null) => NumberFieldFormatted;
export type NumberFieldMode = 'Wheel' | 'Stepper';

/** One value on the wheel, formatted — exported so a consumer (or a spec) can compute the same rows
 *  this component does without standing up the wheel itself. */
export interface NumberFieldRow {
  readonly Value: number;
  readonly Formatted: NumberFieldFormatted;
}

const _defaultFormat: NumberFieldFormat = (v) => ({ Main: String(v) });

/**
 * `<number-field>`: the house number picker — counts, yards, tempo, whatever a sentence's number
 * control needs. A plain component meant as Popover content.
 *
 *   <popover-menu-style popover [Width]="280">
 *     <number-field [Value]="counts()" [Max]="phraseLimit()" [Units]="[{Key:'counts',Label:'counts'},{Key:'yards',Label:'yards'}]"
 *                   [Unit]="unit()" [Format]="formatCounts" (ValueChange)="setCounts($event)" (UnitChange)="setUnit($event)" />
 *   </popover>
 */
@Component({
  selector: 'number-field',
  standalone: true,
  imports: [Jiv, Jext, Jyle, WheelPicker, WheelItem, Stepper],
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_NumberField" semantics="Label" [label]="_FullLabel()">
    @if (Title()) {
      <jext class="Jwift_NumberFieldHeader" [text]="Title() ?? ''" />
    }
    @if (Units().length >= 2) {
      <jiv class="Jwift_NumberFieldSeg">
        @for (u of Units(); track u.Key) {
          <jiv [class]="u.Key === Unit() ? 'Jwift_NumberFieldSegItem Jwift_NumberFieldSegItem_On' : 'Jwift_NumberFieldSegItem'"
               semantics="Button" [label]="u.Label" (click)="_pickUnit(u.Key)">
            <jext [class]="u.Key === Unit() ? 'Jwift_NumberFieldSegLabel Jwift_NumberFieldSegLabel_On' : 'Jwift_NumberFieldSegLabel'" [text]="u.Label" />
          </jiv>
        }
      </jiv>
    }
    @if (Mode() === 'Wheel') {
      <wheel-picker class="Jwift_NumberFieldWheel" [itemHeight]="34" [selectedValue]="Value()" (valueChange)="_onWheel($event)">
        @for (row of _rows(); track row.Value) {
          <wheel-item [value]="row.Value">
            <jiv class="Jwift_NumberFieldRow">
              <jiv class="Jwift_NumberFieldTagCell">
                @if (row.Formatted.Tag) {
                  <jext class="Jwift_NumberFieldTag" [text]="row.Formatted.Tag ?? ''" />
                }
              </jiv>
              <jext class="Jwift_NumberFieldMain" [text]="row.Formatted.Main" />
              <jiv class="Jwift_NumberFieldSubCell">
                @if (row.Formatted.Sub) {
                  <jext [class]="row.Formatted.Over ? 'Jwift_NumberFieldSub Jwift_NumberFieldSub_Over' : 'Jwift_NumberFieldSub'" [text]="row.Formatted.Sub ?? ''" />
                }
              </jiv>
            </jiv>
          </wheel-item>
        }
      </wheel-picker>
    } @else {
      <stepper [value]="Value()" [min]="Min()" [max]="Max()" [step]="Step()" (valueChange)="ValueChange.emit($event)" />
    }
    @if (Foot()) {
      <jext class="Jwift_NumberFieldFoot" [text]="Foot() ?? ''" />
    }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberField {
  protected readonly Jss = NumberFieldJss;

  readonly Value = input.required<number>();
  readonly Min = input(1);
  /** Required — no default maximum; the caller always states a bound (lane E passes a
   *  phrase-relative one). */
  readonly Max = input.required<number>();
  readonly Step = input(1);
  readonly Units = input<readonly NumberFieldUnit[]>([]);
  readonly Unit = input<string | null>(null);
  readonly Format = input<NumberFieldFormat>(_defaultFormat);
  readonly Title = input<string | null>(null);
  readonly Foot = input<string | null>(null);
  readonly Mode = input<NumberFieldMode>('Wheel');
  /** The accessibility name; the frame's full label is this plus the current formatted value. */
  readonly Label = input('');

  readonly ValueChange = output<number>();
  readonly UnitChange = output<string>();

  protected readonly _rows = computed<readonly NumberFieldRow[]>(() => {
    const min = this.Min(), max = this.Max(), step = this.Step() || 1;
    const format = this.Format();
    const unit = this.Unit();
    const values: number[] = [];
    for (let v = min; v <= max; v += step) values.push(v);
    const value = this.Value();
    if (!values.includes(value)) {
      values.push(value);
      values.sort((a, b) => a - b);
    }
    return values.map((v) => ({ Value: v, Formatted: format(v, unit) }));
  });

  /** The full accessibility label: `Label`, a comma, then the current formatted value. */
  protected readonly _FullLabel = computed(() => {
    const main = this.Format()(this.Value(), this.Unit()).Main;
    return `${this.Label()}, ${main}`;
  });

  protected _onWheel(value: unknown): void {
    if (typeof value === 'number') this.ValueChange.emit(value);
  }

  protected _pickUnit(key: string): void {
    if (key !== this.Unit()) this.UnitChange.emit(key);
  }
}
