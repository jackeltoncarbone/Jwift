import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * `<ng-template avatarFallback>` — THE AVATAR'S BOTTOM RUNG, WRITTEN BY THE CALLER.
 *
 * The avatar's ladder is photo → monogram → silhouette, and it bottoms out at initials because initials
 * are the best thing a PERSON primitive can invent from a name. Some callers have something better than
 * initials, and only the primitive knows when to show it:
 *
 *   <avatar [Photo]="row.ProviderAvatarUrl" [Name]="row.ProviderDisplayName">
 *     <ng-template avatarFallback>
 *       <jiv class="Set_Mark" [jivStyle]="markStyle(row.MarkKey)" />
 *     </ng-template>
 *   </avatar>
 *
 * Projected content replaces the MONOGRAM, not the photo: a photo that loads still wins, `Loading` still
 * shows the bare plate, and a caller that projects nothing still falls to initials and then to the
 * silhouette. So this adds a rung, it does not reorder the ladder.
 *
 * ── WHY A TEMPLATE AND NOT `<ng-content>` ─────────────────────────────────────────────────────────────
 *
 * Because `<ng-content>` cannot be withheld. Angular instantiates projected content EAGERLY, whether or
 * not the `<ng-content>` that would receive it is rendered — a documented property of projection, and
 * `Design/Avatar.Slot.spec.ts` measures it here rather than trusting the documentation. On the canvas that
 * is not a harmless extra DOM node: a Jwift component or a `<jiv>` attaches itself to its parent's canvas
 * node in `ngOnInit`, which runs on creation and asks the DOM nothing. So `@if (bottomed) { <ng-content/> }`
 * would attach the caller's mark to the disc on EVERY avatar, including one whose photo loaded perfectly,
 * and paint a brand over a person's face. A `TemplateRef` is the one shape Angular does not instantiate
 * until something renders it.
 *
 * The primitive renders it with `[ngTemplateOutletInjector]="'outlet'"`, which is what makes the caller's
 * jivs attach INSIDE the disc instead of back at the declaration site. That mechanism, and the two Angular
 * internals it rests on, are documented on `Avatar._SlotInjection`.
 *
 * Same directive for both avatars: Jwift's canvas `<avatar>` and the DOM twin `<ss-avatar>`. It depends on
 * nothing but `@angular/core`, which is what lets a DOM page import it by its own module path without
 * dragging the Jwift barrel (and with it Jaui's worker boot) into a non-canvas page.
 */
@Directive({ selector: 'ng-template[avatarFallback]', standalone: true })
export class AvatarFallback {
  readonly Template = inject<TemplateRef<unknown>>(TemplateRef);
}
