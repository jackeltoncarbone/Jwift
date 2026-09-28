import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import ReferenceChipJss from './ReferenceChip.jss';

/**
 * `<reference-chip>` — a tappable pointer at some other entity (a drill, an order, a moment inside one).
 * HOUSE geometry, promoted from Messaging.jss's `Msg_Ref` (the message thread and the assistant thread
 * had each rebuilt the same chip).
 *
 *   <reference-chip glyph="figure.run" [label]="RefLabel(reference)" (chipClick)="Follow(reference)" />
 */
@Component({
  selector: 'reference-chip',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_ReferenceChip" [label]="'Open ' + label()" (click)="chipClick.emit()">
      <icon class="Jwift_ReferenceChipGlyph" [Name]="glyph()" [color]="glyphColor()" />
      <jext class="Jwift_ReferenceChipLabel" [text]="label()" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class ReferenceChip {
  protected readonly Jss = ReferenceChipJss;

  readonly glyph = input.required<string>();
  readonly label = input.required<string>();
  /** The glyph's own accent, since a reference can point at something the app brands (an item, a show). */
  readonly glyphColor = input('@GoldInk');

  readonly chipClick = output<void>();
}
