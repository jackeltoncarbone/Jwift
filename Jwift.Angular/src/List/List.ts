import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  booleanAttribute,
  effect,
  forwardRef,
  input,
  numberAttribute,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import ListJss from './List.jss';
import { LIST_COMFORT } from './List.Comfort';

/** Half the switch, which is a 31pt capsule. The roundest thing a row can hold. */
export const JWIFT_CONTROL_RADIUS = 15.5;
/** Default comfort: the uniform padding a row sits at. */
export const JWIFT_LIST_COMFORT = 16;

/**
 * `<list>` — one section of an inset grouped list.
 *
 *   <list>
 *     <list-row><jext class="Jwift_ListLabel" text="Appearance" /></list-row>
 *     <list-separator inset />
 *     <list-row><jext class="Jwift_ListLabel" text="Language" /></list-row>
 *   </list>
 *
 * The section owns the corner and clips its rows, so rows never carry a radius and can never fall out of
 * step with it.
 *
 * `radius` overrides the derived default when a surface nests the section inside something else and needs
 * to stay concentric with THAT: pass the parent's radius minus the gap you inset the list by. Add `glass`
 * when the section floats over content instead of sitting on a page ground.
 */
@Component({
  selector: 'list',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => List) },
    { provide: LIST_COMFORT, useFactory: (l: List) => l.comfort, deps: [forwardRef(() => List)] },
  ],
})
export class List extends JivHost implements OnInit, OnDestroy {
  readonly glass = input(false, { transform: booleanAttribute });
  /** Uniform row padding, in points. It decides the corner: radius = control radius + comfort. */
  readonly comfort = input(JWIFT_LIST_COMFORT, { transform: numberAttribute });
  /** Overrides the derived corner, for a section nested inside another shape. */
  readonly radius = input<number | null>(null, { transform: (v: unknown) => (v == null || v === '' ? null : numberAttribute(v)) });

  constructor() {
    super('List', ListJss, 'Jwift_List', () => (this.glass() ? 'Jwift_List_Glass' : 'Jwift_List'));
    effect(() => {
      const override = this.radius();
      const r = (override === null || Number.isNaN(override))
        ? JWIFT_CONTROL_RADIUS + this.comfort()
        : override;
      this.SetStyleOverride({ BorderRadius: `${r}pt` });
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
