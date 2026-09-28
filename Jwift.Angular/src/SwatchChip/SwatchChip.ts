import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import SwatchChipJss from './SwatchChip.jss';

/**
 * `<swatch-chip>` — a colour dot and a label, selectable. HOUSE geometry, promoted from Item.jss's
 * `Itm_Chip`/`Itm_Swatch` pair. `selectedFill`/`selectedInk` are the selected wash and ink — a chip takes
 * its owner's accent (an item's own brand colour), never a colour Jwift assumes.
 *
 *   <swatch-chip [color]="option.Color" [label]="option.Name" [selected]="Commerce.Choice(z) === option.Color"
 *                [selectedFill]="Context.AccentWash()" [selectedInk]="Context.AccentInk()" (chipClick)="Pick(z, option)" />
 */
@Component({
  selector: 'swatch-chip',
  standalone: true,
  imports: [Jiv, Jext, Jyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_SwatchChip" [label]="label()"
         [jivStyle]="selected() ? { Background: selectedFill() } : undefined"
         (click)="chipClick.emit()">
      <jiv class="Jwift_SwatchChipDot" [jivStyle]="{ Background: color() }" />
      <jext class="Jwift_SwatchChipLabel" [text]="label()"
            [textStyle]="selected() ? { Color: selectedInk() } : undefined" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class SwatchChip {
  protected readonly Jss = SwatchChipJss;

  readonly color = input.required<string>();
  readonly label = input.required<string>();
  readonly selected = input(false);
  /** The selected wash/ink — the caller's own accent (an item's brand colour), not a Jwift default. */
  readonly selectedFill = input('@GoldWash');
  readonly selectedInk = input('@GoldInk');

  readonly chipClick = output<void>();
}
