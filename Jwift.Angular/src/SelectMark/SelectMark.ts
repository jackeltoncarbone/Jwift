import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { Jiv, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import SelectMarkJss from './SelectMark.jss';

/**
 * `<select-mark>` — a canvas checkbox/radio mark: an empty 22pt ring on a 44pt tap target, filling to a
 * checkmark disc when checked. HOUSE geometry, promoted from Admin.jss's `Adm_Ring`/`Adm_RingMark` pair.
 *
 * The press stops here: a mark nested in a clickable row (a row whose OWN press opens the record) must
 * not also fire that row's click, so the mark stops propagation before it emits.
 *
 *   <select-mark [checked]="isPicked(r)" [label]="(isPicked(r) ? 'Deselect ' : 'Select ') + rowTitle(r)"
 *                (markClick)="togglePick(r)" />
 */
@Component({
  selector: 'select-mark',
  standalone: true,
  imports: [Jiv, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_SelectMarkHit" [label]="label()" (click)="_onClick($event)">
      <jiv [class]="checked() ? 'Jwift_SelectMark_On' : 'Jwift_SelectMark'">
        @if (checked()) {
          <icon class="Jwift_SelectMarkGlyph" Name="checkmark" />
        }
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class SelectMark {
  protected readonly Jss = SelectMarkJss;

  readonly checked = input(false, { transform: booleanAttribute });
  readonly label = input('Select');

  readonly markClick = output<void>();

  protected _onClick(event: Event): void {
    event.stopPropagation();
    this.markClick.emit();
  }
}
