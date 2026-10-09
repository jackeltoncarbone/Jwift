import { ChangeDetectionStrategy, Component, effect, input, output, viewChild } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { JwiftFocusable } from '../Internal/JwiftFocusable';
import type { GlassMorphRect } from '../Morph/GlassMorph';
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
  imports: [Jiv, Jext, Jyle, Icon, JwiftFocusable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv #title class="Jwift_TitleButton" JwiftFocusable semantics="Button" [label]="text()" (click)="titleClick.emit()">
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

  private readonly _title = viewChild<Jiv>('title');
  /** Its rect is read live as the menu it opens grows out of it (`Anchor`). */
  private readonly _watch = effect(() => { this._title()?.Node.WatchRect(true); });

  /** The title's own rect, canvas px, live: the menu a title opens grows out of it and collapses back into it
   *  (`Popover`, Drill Sentences lane WW1, item 3). Null before it is laid out. */
  readonly Anchor = (): GlassMorphRect | null => {
    const n = this._title()?.Node;
    return n && n.Width > 0 ? { X: n.X, Y: n.Y, Width: n.Width, Height: n.Height } : null;
  };

  /** The title itself, which its menu stands in for while it is open (`Popover.Source`). */
  readonly Control = (): Jiv | null => this._title() ?? null;
}
