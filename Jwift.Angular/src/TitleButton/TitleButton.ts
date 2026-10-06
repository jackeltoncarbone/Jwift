import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import TitleButtonJss from './TitleButton.jss';

/**
 * `<title-button>` — a tappable toolbar title: a name with a chevron, so a screen's title doubles as its
 * menu (the drill page's show name, its section title, Picture's title, Animation's title). The label
 * takes Toolbar.jss's `Jwift_ToolbarTitle` (Apple's iOS 26 nav-title scrolled state, 15pt semibold), so a
 * title-button reads exactly like the plain title it replaces.
 *
 *   <title-button [text]="PageTitle()" (titleClick)="OpenShowMenu()" />
 */
@Component({
  selector: 'title-button',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_TitleButton" (click)="titleClick.emit()">
      <jext class="Jwift_ToolbarTitle Jwift_TitleButtonLabel" [text]="text()" />
      <icon class="Jwift_TitleButtonChevron" Name="chevron.down" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class TitleButton {
  protected readonly Jss = TitleButtonJss;

  readonly text = input.required<string>();
  readonly titleClick = output<void>();
}
