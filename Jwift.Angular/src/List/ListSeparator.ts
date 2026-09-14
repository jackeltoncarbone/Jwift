import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  booleanAttribute,
  forwardRef,
  input,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import ListJss from './List.jss';

/**
 * `<list-separator>` — the hairline between two rows.
 *
 * Add `inset` when the rows carry leading icons, so the line starts where the label starts rather than
 * cutting across the symbol column.
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
  readonly inset = input(false, { transform: booleanAttribute });

  constructor() {
    super('List', ListJss, 'Jwift_ListSeparator',
      () => (this.inset() ? 'Jwift_ListSeparator_Inset' : 'Jwift_ListSeparator'));
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
