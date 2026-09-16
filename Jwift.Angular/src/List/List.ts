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
 * Half the ROUNDEST control a row can hold, which is what the section's corner has to stay concentric
 * with: `radius = JWIFT_CONTROL_RADIUS + comfort`.
 *
 * It was 15.5 - half the 31pt switch capsule - with a comment calling the switch "the roundest thing a
 * row can hold". That stopped being true and nobody noticed, because the arithmetic here stayed right
 * while its input went stale. A concentricity audit over the laid-out tree
 * (Tooling/SiteShot/concentric-audit.mjs) measured what rows ACTUALLY hold on /settings/accounts:
 *
 *     Jwift_Avatar_Row   40x40  -> a circle of 20
 *     Set_Disc           40x40  -> a circle of 20
 *     Set_RowBtnOff      87x44  -> a pill of 22
 *
 * All rounder than the switch, so every one of that surface's six nested corners broke the invariant,
 * the row button worst at 6.5pt out. 22 is the real maximum, giving 22 + 16 = 38pt.
 *
 * WHY THE LARGEST AND NOT AN AVERAGE: a container has ONE radius and its children have several, so
 * exactly one pair can be exact. The largest child wins because it is the one whose corner comes closest
 * to the container's and therefore the one whose misfit is visible; the 20pt discs sit 2pt shy, which is
 * the residual a single radius cannot remove.
 *
 * These controls SATURATE - they author `BorderRadius: 999pt` and `Jaui.ts` clamps a corner to half the
 * box - so their radii are fixed by their heights and cannot be tuned to suit. Only this number and
 * `comfort` can move. Raise this if a row ever carries something rounder than a 44pt pill.
 */
export const JWIFT_CONTROL_RADIUS = 22;
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
