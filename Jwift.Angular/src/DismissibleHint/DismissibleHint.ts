import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import DismissibleHintJss from './DismissibleHint.jss';

/**
 * `<dismissible-hint>` — a capsule hint with a dismiss: a glyph, one line, and the same 44pt round X
 * every "stop this mode" affordance wears. HOUSE geometry, promoted from Drill.jss's `PinHint`.
 * Positioning is the caller's own (a hint pinned under a header reads differently than one docked at a
 * pane's foot) — wrap it in a `Class` override, or a positioned parent, for placement.
 *
 *   <dismissible-hint glyph="mappin" text="Tap the spot this note is about" (dismiss)="StopPinning()" />
 */
@Component({
  selector: 'dismissible-hint',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_DismissibleHint">
      @if (glyph()) {
        <icon class="Jwift_DismissibleHintGlyph" [Name]="glyph()" />
      }
      <jext class="Jwift_DismissibleHintLabel" [text]="text()" />
      <jiv class="Jwift_DismissibleHintDrop" [label]="dismissLabel()" (click)="dismiss.emit()">
        <icon class="Jwift_DismissibleHintDropGlyph" Name="xmark" />
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class DismissibleHint {
  protected readonly Jss = DismissibleHintJss;

  readonly glyph = input('');
  readonly text = input.required<string>();
  readonly dismissLabel = input('Dismiss');

  readonly dismiss = output<void>();
}
