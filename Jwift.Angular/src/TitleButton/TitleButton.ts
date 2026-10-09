import { ChangeDetectionStrategy, Component, computed, effect, input, output, viewChild } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { JwiftFocusable } from '../Internal/JwiftFocusable';
import type { GlassMorphRect } from '../Morph/GlassMorph';
import { TitleChevronClass, TitleLabelClass } from './TitleButton.Classes';
import TitleButtonJss from './TitleButton.jss';

/**
 * `<title-button>` — a tappable toolbar title: a name with a chevron, so a screen's title doubles as its
 * menu (the drill page's show name, its section title, Picture's title, Animation's title). The label
 * takes Toolbar.jss's `Jwift_ToolbarTitle` (Apple's iOS 26 nav-title scrolled state, 15pt semibold), so a
 * title-button reads exactly like the plain title it replaces.
 *
 *   <title-button [text]="PageTitle()" (titleClick)="OpenShowMenu()" />
 *
 * `onScene` (Drill Sentences lane AD1, item 1): the title sits bare over a rendered SCENE a director
 * controls (a field, a picture, an animation), not the app's own themed background, so `Jwift_ToolbarTitle`'s
 * usual ink — weighted by the app's `@Dark`/`@Light`, like any label over the app's own ground — reads flat
 * black in Light even over a dark scene. Unlike a label on real glass or over a graded footer, nothing here
 * has already dimmed the backdrop, so there is no bound to sample vibrancy against — `Design/LiftInk.ts`'s
 * own doctrine, "over bare artwork with no plate under it... near-white remains the only safe answer" — and
 * the title joins Jwift.Glass.jss's flat `JwiftLabelOnScene`/`JwiftSecondaryLabelOnScene` in beside the usual
 * geometry class the same way `Sheet.ts` already layers `JwiftProminentInk` over `Jwift_SheetBarGlyph` — two
 * classes, the second's Color/TextFilter winning (Styling.md: "last one wins") — never the app scheme. False
 * (the default) is every OTHER page this component serves (Admin, Classroom, Settings and the rest), whose
 * header sits over the app's own themed ground, where the usual theme-weighted ink is correct as is.
 *
 * `LabelClass`/`ChevronClass` read `TitleButton.Classes.ts`'s own `TitleLabelClass`/`TitleChevronClass`,
 * pulled out pure (no `@angular/core`, no `jaui-angular`) so a spec can pin which class joins which base
 * with no Angular weight at all.
 */
@Component({
  selector: 'title-button',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon, JwiftFocusable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv #title class="Jwift_TitleButton" JwiftFocusable semantics="Button" [label]="text()" (click)="titleClick.emit()">
      <jext [class]="LabelClass()" [text]="text()" />
      <icon [class]="ChevronClass()" Name="chevron.down" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class TitleButton {
  protected readonly Jss = TitleButtonJss;

  readonly text = input.required<string>();
  readonly onScene = input(false);
  protected readonly LabelClass = computed(() => TitleLabelClass(this.onScene()));
  protected readonly ChevronClass = computed(() => TitleChevronClass(this.onScene()));
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
