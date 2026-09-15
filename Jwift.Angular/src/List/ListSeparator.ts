import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import ListJss from './List.jss';
import { JWIFT_LIST_ICON_WIDTH, JWIFT_LIST_ROW_GAP, LIST_COMFORT } from './List.Comfort';
import { JWIFT_LIST_COMFORT } from './List';

/**
 * `<list-separator>` — the hairline between two rows.
 *
 * `inset` starts the line where the label starts, as the system does: after the row's comfort, the
 * leading element and the row gap. Bare `inset` clears a leading icon; `inset="48"` clears a leading
 * element that many points wide, such as a thumbnail. The trailing end stays flush with the section.
 */
@Component({
  selector: 'list-separator',
  standalone: true,
  template: '',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => ListSeparator) },
  ],
})
export class ListSeparator extends JivHost implements OnInit, OnDestroy {
  /** The leading element's width in points, or null for a full bleed line. */
  readonly inset = input<number | null, unknown>(null, { transform: _leadWidth });

  private readonly _comfort = inject(LIST_COMFORT, { optional: true });

  constructor() {
    super('List', ListJss, 'Jwift_ListSeparator',
      () => (this.inset() === null ? 'Jwift_ListSeparator' : 'Jwift_ListSeparator_Inset'));
    effect(() => {
      const lead = this.inset();
      const comfort = this._comfort ? this._comfort() : JWIFT_LIST_COMFORT;
      // One device pixel, the way the system draws it at every scale.
      const hairline = 1 / (globalThis.devicePixelRatio || 1);
      this.SetStyleOverride({
        Height: `${hairline}px`,
        Margin: lead === null ? '0pt' : `0pt 0pt 0pt ${comfort + lead + JWIFT_LIST_ROW_GAP}pt`,
      });
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}

function _leadWidth(value: unknown): number | null {
  if (value === null || value === undefined || value === false || value === 'false') return null;
  if (value === '' || value === true || value === 'true') return JWIFT_LIST_ICON_WIDTH;
  return numberAttribute(value, JWIFT_LIST_ICON_WIDTH);
}
