import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  forwardRef,
  input,
} from '@angular/core';
import { Jext, Jiv } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { JivHost } from '../Internal/JivHost';
import AvatarJss from './Avatar.jss';
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
 * WHY IT LIVES IN JWIFT AND NOT IN THE APP. A DOM component cannot be used inside a Jaui tree — the app
 * roots at `<jaui>` and HTML mounted under it paints nothing on the canvas — so the surface's
 * `PersonBlock` had RESTATED the whole drawing in jivs, and said so in its own header comment. That
 * restatement is why the app ended up drawing an avatar five ways that disagreed about size, ink, how many
 * initials and what happens when there is no photo. A canvas primitive is the only shape that can be the
 * one answer, so this is where it belongs.
 *
 * ── THE LADDER ────────────────────────────────────────────────────────────────────────────────────────
 *
 *   photo → monogram → silhouette
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
  imports: [Jiv, Jext, Icon],
  template: `
    @let photo = _Photo();
    @if (photo.Verdict === 'Ready' && photo.Src) {
      <jiv [class]="_PhotoClass" [image]="photo.Src" [alt]="Name()" />
    } @else if (photo.Verdict !== 'Loading') {
      @if (_Initials(); as initials) {
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
