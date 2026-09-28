import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import { Jiv, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import DisclosureRowJss from './DisclosureRow.jss';

/**
 * `<disclosure-row>` — a list row that expands its own content underneath it. HOUSE geometry (the 44pt
 * row floor every list control shares); the chevron swaps glyph rather than rotating, since JSS has no
 * verified 2D rotate transform (WheelPicker's `RotateX` is a 3D projection, a different mechanism).
 *
 *   <disclosure-row [open]="IsOpen(row.Id)" (openChange)="Toggle(row.Id)">
 *     <jext disclosureHeader class="FaqQuestionText" [text]="row.Question" />
 *     <prose-block disclosureBody [markdown]="Answer(row.Id)" />
 *   </disclosure-row>
 */
@Component({
  selector: 'disclosure-row',
  standalone: true,
  imports: [Jiv, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_DisclosureRow">
      <jiv class="Jwift_DisclosureHead" (click)="openChange.emit(!open())">
        <ng-content select="[disclosureHeader]"></ng-content>
        <icon class="Jwift_DisclosureChevron" [Name]="_ChevronName()" />
      </jiv>
      @if (open()) {
        <jiv class="Jwift_DisclosureBody">
          <ng-content select="[disclosureBody]"></ng-content>
        </jiv>
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class DisclosureRow {
  protected readonly Jss = DisclosureRowJss;

  readonly open = input(false, { transform: booleanAttribute });
  readonly openChange = output<boolean>();

  protected readonly _ChevronName = computed(() => (this.open() ? 'chevron.up' : 'chevron.down'));
}
