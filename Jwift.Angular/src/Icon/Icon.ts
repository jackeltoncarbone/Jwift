import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  forwardRef,
  input,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { IconData } from './Icon.Data';
import IconJss from './Icon.jss';

/**
 * `<icon>` — Jwift canvas icon. Looks up an SF Symbols-style name in the
 * Jwift icon font's codepoint map and renders the glyph onto Jaui canvas.
 *
 *   <icon Name="play.fill" />
 *   <icon class="RowChevron" Name="chevron.right" />
 *
 * Name → codepoint resolution lives here and only here. Consumers pass a
 * symbolic name; never a char or a hex codepoint. A consumer-supplied
 * `class` resolves against the local JssRegistry and replaces the default
 * `Jwift_Icon` style — use it to override size / color / weight.
 */
@Component({
  selector: 'icon',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Icon) },
  ],
})
export class Icon extends JivHost implements OnInit, OnDestroy {
  readonly Name = input.required<string>();
  readonly className = input<string | undefined>(undefined, { alias: 'class' });

  constructor() {
    super('Icon', IconJss, 'Jwift_Icon', () => this.className() ?? 'Jwift_Icon');
    // Force the icon font on every text update — consumers' class can override
    // size / weight / color, but the font family is always JwiftIcons.
    effect(() => {
      const cp = IconData[this.Name().toLowerCase()];
      const glyph = cp != null ? String.fromCodePoint(cp) : '';
      this.Node.SetText(glyph, { FontFamily: 'JwiftIcons' });
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
