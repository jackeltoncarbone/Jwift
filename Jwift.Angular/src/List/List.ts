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

/**
 * Half the switch, which is a 31pt capsule: `radius = JWIFT_CONTROL_RADIUS + comfort` = 31.5pt.
 *
 * I raised this to 22 to make the section concentric with the tallest thing its rows carry (an 87x44 row
 * button), and it was WRONG - it took the corner to 38pt, which on a one-row section is most of the box
 * and reads as a giant capsule. Jack, looking at Linked accounts: "the radius of the list is way too big
 * ... before it was actually proportioned to like Apple". Reverted.
 *
 * THE RULE THAT ACTUALLY APPLIES. Concentricity governs a shape nested AT a corner and inset uniformly -
 * a menu's full-width items, an alert's action row, a card's action pill. It does NOT govern a small
 * control sitting inside a row: a 40pt avatar 16pt from the edge of a 620pt section is not nesting in
 * that section's corner, and Apple does not size a list's corner to its switches or its avatars. The
 * list's corner is the list's own, and the switch is simply the roundest thing it has ever had to sit
 * beside - which is what this 15.5 has always meant.
 *
 * So a row control that is rounder than this is NOT a defect to chase, and the concentricity audit
 * should not report it as one. See Documentation/Design/Concentricity.Audit.md.
 */
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
 * when the section floats over content instead of sitting on a page ground. Add `translucent` when it
 * sits ON a glass surface such as a sheet: a translucent fill that carries the glass's colour, never a
 * second material.
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
  /** A section resting on glass: a translucent fill instead of the opaque grouped ground. */
  readonly translucent = input(false, { transform: booleanAttribute });
  /** Uniform row padding, in points. It decides the corner: radius = control radius + comfort, so the
   *  section stays concentric with the roundest control its rows carry. */
  readonly comfort = input(JWIFT_LIST_COMFORT, { transform: numberAttribute });
  /** Overrides the derived corner, for a section nested inside another shape. */
  readonly radius = input<number | null>(null, { transform: (v: unknown) => (v == null || v === '' ? null : numberAttribute(v)) });

  constructor() {
    super('List', ListJss, 'Jwift_List', () =>
      this.glass() ? 'Jwift_List_Glass' : this.translucent() ? 'Jwift_List_Translucent' : 'Jwift_List');
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
