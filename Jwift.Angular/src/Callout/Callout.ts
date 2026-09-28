import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import CalloutJss from './Callout.jss';

/**
 * `<callout>` — an inline notice card: a glyph, a title sentence, an optional detail sentence, and an
 * optional action. HOUSE geometry, promoted from Surface/Prose.jss's `HandoffCard`.
 *
 *   <callout glyph="person.2.fill" [title]="Escalation().Copy"
 *            text="Your conversation goes with it, so you do not retype anything."
 *            actionLabel="Hand this to a person" (action)="openContact()" />
 */
@Component({
  selector: 'callout',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_Callout">
      <icon class="Jwift_CalloutGlyph" [Name]="glyph()" />
      <jiv class="Jwift_CalloutBody">
        <jext class="Jwift_CalloutTitle" [text]="title()" />
        @if (text()) {
          <jext class="Jwift_CalloutText" [text]="text()" />
        }
        @if (actionLabel()) {
          <jiv class="Jwift_CalloutAction" (click)="action.emit()">
            <jext class="Jwift_CalloutActionLabel" [text]="actionLabel()" />
          </jiv>
        }
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class Callout {
  protected readonly Jss = CalloutJss;

  readonly glyph = input.required<string>();
  readonly title = input.required<string>();
  readonly text = input('');
  readonly actionLabel = input('');

  readonly action = output<void>();
}
