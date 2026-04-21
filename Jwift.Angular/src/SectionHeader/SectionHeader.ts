import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
  input,
} from '@angular/core';
import { Jiv, Jext } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import SectionHeaderJss from './SectionHeader.jss';

/**
 * `<section-header>` — row with a section title (leading) and an
 * optional "View All" glass pill (trailing).
 *
 *   <section-header [title]="s.Title" [showViewAll]="s.ShowViewAll" />
 *
 * Uses an internal template (not ng-content) — projected children aren't
 * needed for the standard case and keeping the structure private lets
 * us swap the View All pill for a real button later without churning
 * consumer templates.
 */
@Component({
  selector: 'section-header',
  standalone: true,
  imports: [Jiv, Jext],
  template: `
    <jext class="Jwift_SectionTitle" [text]="title()" />
    @if (showViewAll()) {
      <jiv class="Jwift_SectionViewAll">
        <jext class="Jwift_SectionViewAllLabel" text="View All" />
      </jiv>
    }
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => SectionHeader) },
  ],
})
export class SectionHeader extends JivHost implements OnInit, OnDestroy {
  readonly title = input<string>('');
  readonly showViewAll = input<boolean>(false);

  constructor() {
    super('SectionHeader', SectionHeaderJss, 'Jwift_SectionHeader', () => 'Jwift_SectionHeader');
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
