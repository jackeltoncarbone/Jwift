import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import SidebarRowJss from './SidebarRow.jss';

/**
 * `<sidebar-row>` — a navigation row for a rail (Surface's rail, the settings rail, Admin's nav), with
 * an on-state fill. HOUSE geometry, promoted from Admin.jss's `Adm_NavRow` ladder. `showChevron` is the
 * phone-list "this pushes" signal — a rail beside its own pane omits it.
 *
 *   <sidebar-row glyph="gearshape" label="General" [on]="s.Id === Selected()" [showChevron]="!Split()"
 *                (click)="open(s.Id)" />
 */
@Component({
  selector: 'sidebar-row',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv [class]="on() ? 'Jwift_SidebarRow_On' : 'Jwift_SidebarRow'" (click)="rowClick.emit()">
      <icon [class]="on() ? 'Jwift_SidebarRowGlyph_On' : 'Jwift_SidebarRowGlyph'" [Name]="glyph()" />
      <jext [class]="on() ? 'Jwift_SidebarRowLabel_On' : 'Jwift_SidebarRowLabel'" [text]="label()" />
      @if (showChevron()) {
        <icon class="Jwift_SidebarRowChevron" Name="chevron.right" />
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class SidebarRow {
  protected readonly Jss = SidebarRowJss;

  readonly glyph = input.required<string>();
  readonly label = input.required<string>();
  readonly on = input(false, { transform: booleanAttribute });
  readonly showChevron = input(true, { transform: booleanAttribute });

  readonly rowClick = output<void>();
}
