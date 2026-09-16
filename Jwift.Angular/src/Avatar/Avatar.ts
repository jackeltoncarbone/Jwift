import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  contentChild,
  forwardRef,
  input,
} from '@angular/core';
import { Jext, Jiv } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { JivHost } from '../Internal/JivHost';
import AvatarJss from './Avatar.jss';
import { AvatarFallback } from './Avatar.Fallback';
import {
  AvatarFallbackGlyph,
  type AvatarSize,
  deriveInitials,
  providerAvatarUrl,
} from './Avatar.Name';
import { AvatarPhoto } from './Avatar.Photo';

/**
 * `<avatar>` — THE universal person mark, canvas-native. Every disc in this app that stands for a person
 * is this component, at one of five named sizes, with one fallback ladder.
 *
 *   <avatar Size="Header" [Photo]="profile.AvatarUrl" [Name]="profile.Display" />
 *   <avatar Size="Row" [Name]="org.Display" />                // → the monogram on the neutral plate
 *   <avatar Size="Fill" />                                  // → the silhouette (signed out)
 *
 *   <avatar [Photo]="row.ProviderAvatarUrl" [Name]="row.ProviderDisplayName">
 *     <ng-template avatarFallback>                           // → this, instead of the monogram, when
 *       <jiv class="Set_Mark" [jivStyle]="mark(row)" />      //   the photo is absent or FAILS
 *     </ng-template>
 *   </avatar>
 *
 * WHY IT LIVES IN JWIFT AND NOT IN THE APP. A DOM component cannot be used inside a Jaui tree — the app
 * roots at `<jaui>` and HTML mounted under it paints nothing on the canvas — so the surface's
 * `PersonBlock` had RESTATED the whole drawing in jivs, and said so in its own header comment. That
 * restatement is why the app ended up drawing an avatar five ways that disagreed about size, ink, how many
 * initials and what happens when there is no photo. A canvas primitive is the only shape that can be the
 * one answer, so this is where it belongs.
 *
 * ── THE LADDER ────────────────────────────────────────────────────────────────────────────────────────
 *
 *   photo → [what the caller projects] → monogram → silhouette
 *
 * and it is driven by **success, not by presence**. That is the whole point of the rewrite. Every consumer
 * used to render the photo whenever a URL existed, so a URL that existed and FAILED — a provider's 429, an
 * expired link, a proxy, no network — painted an EMPTY DISC: no initials, no glyph, nothing, and no way
 * for the page to find out. There was no error path on the canvas side at all. Now `Avatar.Photo` fetches
 * the bytes once and publishes a verdict, and a failure drops to the monogram exactly as an absence does.
 *
 * WHILE THE PHOTO IS IN FLIGHT the disc shows its bare plate — NOT the monogram. Apple's Contacts does
 * show the monogram under a loading photo, and we do not, deliberately: a good photo that arrives 80ms
 * later would then flash two letters on its way in on every first paint. The verdict is cached per URL for
 * the session, so this only ever applies to the very first sight of a photo; every later paint of the same
 * face resolves synchronously and never blinks.
 *
 * ── THE FALLBACK SLOT: WHEN INITIALS ARE NOT THE BEST THING THE CALLER HAS ────────────────────────────
 *
 * The monogram is the best a PERSON primitive can invent from a name, and for a person it is the right
 * answer. It is the wrong answer when the caller knows a better mark for the thing in the disc, and the
 * linked-accounts row is the case that proved it: under a throttled Google photo the disc drew a grey "G",
 * a monogram of a BRAND, two sections above the same brand's own full-color mark. One screen, one brand,
 * two treatments. Apple's answer for an account row is the service's own icon (Settings' account lists,
 * Mail's provider chooser), and every provider's brand guidelines require their mark on a control that
 * means "sign in with us" — which a linked-account row is.
 *
 * The CALL SITE CANNOT FIX THIS, and that is the whole reason this is a slot rather than a branch: only
 * the primitive knows the photo failed. A call site can only ask whether a URL is PRESENT, which is the
 * exact fault the verdict exists to end. So the caller hands over a template and the primitive decides
 * when to show it: it renders when the ladder bottoms out, INSTEAD of the monogram, and never over a
 * photo that loaded or a photo still in flight.
 *
 * It is deliberately general. Anything with a better mark than initials can say so: an organization with
 * a logo, a version disc, an integration's icon. What the slot must not become is a way to put a brand on
 * a PERSON: the plate is still the avatar's and the rule above still holds.
 *
 * The caller sizes its own content, and the disc centers it. The convention is the silhouette's 55% of the
 * diameter, which is what `Set_Mark` (22pt in a 40pt disc) already was at the row that needed this.
 *
 * ── THE ACCESSIBLE NAME ───────────────────────────────────────────────────────────────────────────────
 *
 * The photo carries `[alt]="Name()"`, which is what the semantic mirror projects. A PHOTOLESS avatar is
 * deliberately unnamed: its monogram is a decorative duplicate of a name the neighbouring row, byline or
 * header already states, and announcing "JC" beside "Jack Carbone" is what trips the WCAG 2.5.3
 * label-≠-name check on any wrapping labelled control. The DOM twin hides its initials from the
 * accessibility tree for the same reason.
 */
@Component({
  selector: 'avatar',
  standalone: true,
  imports: [Jiv, Jext, Icon, NgTemplateOutlet],
  // THE RUNGS, and only ever one of them on screen. `Loading` renders NOTHING — the bare plate — which is
  // why the slot sits inside the `!== 'Loading'` branch with the monogram rather than beside it: a caller's
  // mark must not flash in front of a photo that is about to arrive either.
  template: `
    @let photo = _Photo();
    @if (photo.Verdict === 'Ready' && photo.Src) {
      <jiv [class]="_PhotoClass" [image]="photo.Src" [alt]="Name()" />
    } @else if (photo.Verdict !== 'Loading') {
      @if (_Fallback(); as slot) {
        <ng-container [ngTemplateOutlet]="slot.Template" [ngTemplateOutletInjector]="_SlotInjection" />
      } @else if (_Initials(); as initials) {
        <jext [class]="_InitialsClass()" [text]="initials" />
      } @else {
        <icon [class]="_GlyphClass()" [Name]="Glyph()" />
      }
    }
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Avatar) },
  ],
})
export class Avatar extends JivHost implements OnInit, OnDestroy {
  /** The person's photo. Null, empty, OR A URL THAT FAILS TO LOAD falls to the monogram. */
  readonly Photo = input<string | null | undefined>(null);

  /** Display name. The monogram is derived from it, and it is the photo's alt text. */
  readonly Name = input<string>('');

  /** An explicit monogram, when the caller has one the name does not give (a version number, an
   *  organization's short mark). Overrides the derived initials; capped at two characters, as Apple's
   *  contact monogram is. */
  readonly Initials = input<string | null>(null);

  /** Which rung of the size scale. See `Avatar.Name.ts` for what each one is for and why. */
  readonly Size = input<AvatarSize>('Row');

  /** The last rung: the glyph for "nobody in particular". `person.fill` unless a caller genuinely means
   *  something else (an organization that would rather show a building than a person). */
  readonly Glyph = input<string>(AvatarFallbackGlyph);

  /** Quieter plate, for a disc with nobody in it at all rather than a person we have no picture of — the
   *  signed-out account header. The same circle, emptier. */
  readonly Empty = input(false, { transform: booleanAttribute });

  /** The URL as the CDN will actually serve it. Every avatar in the app arrives here, so the provider crop
   *  rewrite belongs on this one input rather than at each of the surfaces that bind it. */
  private readonly _Url = computed(() => providerAvatarUrl(this.Photo()));

  /** The one load, and its verdict. Cached per URL across every disc and every surface in the session. */
  protected readonly _Photo = computed(() => AvatarPhoto(this._Url())());

  /**
   * THE CALLER'S BOTTOM RUNG, or undefined when there is none — `<ng-template avatarFallback>`.
   *
   * A content query, so the caller may wrap it in its own `@if` and hand over a mark only when it has one
   * (the linked-accounts row does exactly that: a provider our catalog carries no mark for falls back to
   * the person's monogram, which is then the right answer again). Signal content queries see through a
   * control-flow block — the app's own tab bar reads `<tab-item>`s written inside an `@for` — and they are
   * reactive, so a slot that appears or leaves re-picks the rung with no wiring here.
   */
  protected readonly _Fallback = contentChild(AvatarFallback);

  /**
   * HOW A PROJECTED JIV ENDS UP INSIDE THE DISC, which is the one thing about this that is not obvious.
   *
   * A canvas node does not find its parent through the DOM. Every `<jiv>` and every Jwift component asks
   * DI for the nearest `Jiv` (`inject(Jiv, { skipSelf: true, optional: true })`) and attaches to THAT
   * node's canvas handle in `ngOnInit`. Angular resolves an embedded view's DI at the template's
   * DECLARATION SITE, so a template written in the caller's page and rendered here would attach the
   * caller's mark to whatever jiv encloses the row — a sibling of the disc, not its content. The Toolbar's
   * compact slot hit this first and answered it with a hand-built `Injector`.
   *
   * `[ngTemplateOutletInjector]="_SlotInjection"` is that answer as one word: `NgTemplateOutlet` passes its own
   * `inject(Injector)` — the node injector AT THE OUTLET, which is inside this component's view, where the
   * nearest `Jiv` is this avatar (see the `providers` above) — as the embedded view's injector. Two facts
   * in Angular's `getOrCreateInjectable` make that win, and both were read in the installed source rather
   * than remembered: an embedded view injector is consulted BEFORE the declaration-site node injector, and
   * the lookup clears `SkipSelf` first, so the caller's own `skipSelf: true` cannot skip past it.
   */
  protected readonly _SlotInjection = 'outlet' as const;

  protected readonly _Initials = computed(() => {
    const explicit = this.Initials()?.trim();
    if (explicit) return explicit.slice(0, 2).toUpperCase();
    return deriveInitials(this.Name());
  });

  protected readonly _PhotoClass = 'Jwift_AvatarPhoto';
  protected readonly _InitialsClass = computed(() => `Jwift_AvatarInitials_${this.Size()}`);
  protected readonly _GlyphClass = computed(() => `Jwift_AvatarGlyph_${this.Size()}`);

  constructor() {
    super('Avatar', AvatarJss, 'Jwift_Avatar_Row', () => {
      const size = this.Size();
      // The empty plate is a variant of the rung, not a second component: one class carries both facts so
      // JivHost still applies exactly one resolved class and the geometry can never drift between them.
      return this.Empty() ? `Jwift_Avatar_${size}Empty` : `Jwift_Avatar_${size}`;
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
