import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import FilterChipJss from './FilterChip.jss';

/**
 * `<filter-chip>` — a multi-select or boolean chip: a checkmark and a label, filling when chosen. HOUSE
 * geometry, promoted from Services/Commerce.jss's `Cm_Choice`/`Cm_ChoiceOn` pair. `selectedFill`/
 * `selectedInk` are the chosen wash and ink — a chip takes its owner's accent, never a colour Jwift
 * assumes.
 *
 *   <filter-chip [selected]="hasKind(k)" [label]="label(k)" (chipClick)="toggleKind(k)" />
 */
@Component({
  selector: 'filter-chip',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_FilterChip" [label]="label()"
         [jivStyle]="selected() ? { Background: selectedFill() } : undefined"
         (click)="chipClick.emit()">
      @if (selected()) {
        <icon class="Jwift_FilterChipGlyph" Name="checkmark" [color]="selectedInk()" />
      }
      <jext [class]="selected() ? 'Jwift_FilterChipLabel_On' : 'Jwift_FilterChipLabel'" [text]="label()"
            [textStyle]="selected() ? { Color: selectedInk() } : undefined" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class FilterChip {
  protected readonly Jss = FilterChipJss;

  readonly label = input.required<string>();
  readonly selected = input(false, { transform: booleanAttribute });
  /** The selected wash/ink — the caller's own accent, not a Jwift default. */
  readonly selectedFill = input('@GoldWash');
  readonly selectedInk = input('@GoldInk');

  readonly chipClick = output<void>();
}
