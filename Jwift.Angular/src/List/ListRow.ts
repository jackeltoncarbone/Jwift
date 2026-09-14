import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  booleanAttribute,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import ListJss from './List.jss';
import { LIST_COMFORT } from './List.Comfort';

/**
 * `<list-row>` — one row of a `<list>`. Square by design: the section clips the corners.
 *
 * Minimum height is the 44pt hit floor. A row that only reports rather than navigating takes `static`,
 * which drops the pointer states so it cannot look tappable when it is not.
 */
@Component({
  selector: 'list-row',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => ListRow) },
  ],
})
export class ListRow extends JivHost implements OnInit, OnDestroy {
  readonly static = input(false, { transform: booleanAttribute });

  private readonly _comfort = inject(LIST_COMFORT, { optional: true });

  constructor() {
    super('List', ListJss, 'Jwift_ListRow', () => (this.static() ? 'Jwift_ListRow_Static' : 'Jwift_ListRow'));
    effect(() => {
      const c = this._comfort ? this._comfort() : null;
      if (c === null) { this.ClearStyleOverride('Padding'); this.ClearStyleOverride('MinHeight'); }
      else { this.SetStyleOverride({ Padding: `${c}pt`, MinHeight: `${31 + 2 * c}pt` }); }
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
