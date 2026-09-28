import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  forwardRef,
  input,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import GlassButtonJss from './GlassButton.jss';

export type GlassButtonShape = 'round' | 'pill' | 'square';

/**
 * How much of the screen's attention the button asks for.
 *
 * `glass` — the default, and what almost every button is. Liquid glass with no fill of its own, so
 * it takes its colour from whatever it floats over and is therefore always right.
 *
 * `prominent` — the ONE action that is the point of the screen, drawn with the app's accent on its
 * face under the glass rim, as Apple draws a prominent button. A screen gets one. Two prominent
 * buttons on one screen is neither of them being prominent.
 *
 * `danger` — a DESTRUCTIVE action, which Apple draws as a red LABEL on the ordinary control: HIG
 * Buttons lists the roles as "normal, primary (accent), cancel, destructive (system red; never
 * primary)", so destructive and primary are alternatives and a destructive action never wears the
 * accent plate; HIG Menus puts the destructive row last, "red, confirmed by an action sheet", with no
 * plate under it at all. So THIS VARIANT CHANGES NO PAINT: the plate is the same glass, and the red is
 * the label's, which the call site states (`JwiftDangerInk`, or the screen's own `X_BtnLabelDanger`).
 * What it buys is the role having one name at the call site, which is what a reviewer greps and what
 * `Design/DangerRole.Conformance.spec.ts` reads.
 *
 * `danger-prominent` — the filled red plate, and ONLY as the confirming press of a destructive ask:
 * the other half of that same HIG Menus sentence, where the red row is "confirmed by an action sheet"
 * and the confirm inside it is the button the reader came to press. Red ink says "this is the
 * destructive option among several"; a red plate says "this is the press that does it". A screen that
 * fills the first has spent the plate before asking anything. Every call site is held in a shrink-only
 * ledger with a stated reason, because "this one is a confirm step" is a fact about a flow that no
 * component and no stylesheet can check.
 *
 * The full citation, with the attribution per half, is in
 * `Jwift/Shared/Research/Apple.LiquidGlass.md`, section 3, "Destructive actions, and the one place red
 * is a fill".
 */
export type GlassButtonVariant = 'glass' | 'prominent' | 'danger' | 'danger-prominent' | 'plain';

/** The button's size: `regular` (48 pt), `small` (28 pt, Apple's small/mini height — for a control living
 *  inside a list row or a dense toolbar), or `bar`, iOS 26's 44 pt bar button (a sheet's X and checkmark). */
export type GlassButtonSize = 'regular' | 'small' | 'bar';

/** The class stem each variant resolves to. The shape suffix (`_Round` / `_Pill` / `_Square`) is
 *  appended, and every stem declares all three, so a variant change never moves the button. */
const VARIANT_STEM: Record<GlassButtonVariant, string> = {
  glass: 'Jwift_GlassBtn',
  prominent: 'Jwift_GlassBtn_Prominent',
  danger: 'Jwift_GlassBtn_Danger',
  'danger-prominent': 'Jwift_GlassBtn_DangerProminent',
  plain: 'Jwift_GlassBtn_Plain',
};

/**
 * `<glass-button>` — Jwift liquid-glass button.
 *
 * IS a jiv (via JivHost) and self-provides the Jiv DI token so projected
 * `<jext>`/`<jiv>` children walk up to the button when resolving their
 * Jaui parent (without this, Angular's declaration-position DI would
 * attach children to the grandparent — the "icon lands in page center"
 * bug).
 *
 *   <glass-button shape="round">
 *     <jext class="ToolbarAvatarGlyph" [text]="AvatarIcon" />
 *   </glass-button>
 *
 * Shapes: `round` (default, 48×48 circle), `pill` (auto + pad), `square`. Sizes: `regular`, `small`
 * (28 pt, for a control living inside a list row), `bar` (44 pt).
 * Variants: `glass` (default — today's liquid glass), `prominent` (the inverted solid), `danger` (the
 * same glass under a red label), `danger-prominent` (the filled red confirm) and `plain` (a text button:
 * label only, no plate — apply `Jwift_GlassBtnPlainLabel` to the projected `<jext>` for the accent ink).
 */
@Component({
  selector: 'glass-button',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => GlassButton) },
  ],
})
export class GlassButton extends JivHost implements OnInit, OnDestroy {
  readonly shape = input<GlassButtonShape>('round');
  /** Prominence AND role. `glass` is the default, so nothing that exists moves; `prominent` is the
   *  inverted white (or black) glass, for the one action a screen leads with; `danger` is the same
   *  glass under a red label; `danger-prominent` is the filled red confirm. See {@link GlassButtonVariant}. */
  readonly variant = input<GlassButtonVariant>('glass');
  /** `bar` draws Apple's 44 pt bar button in place of the 48 pt control; every variant and shape takes it. */
  readonly size = input<GlassButtonSize>('regular');
  /**
   * A colour of the button's own, as a fill.
   *
   * THE CAPABILITY EXISTS AND THE APP DOES NOT USE IT. A design system should not forbid what a
   * future screen might legitimately need — a brand pill on a partner surface, a per-item accent
   * derived from artwork — so the override is here, once, routed through the style channel and
   * paired with the tinted press (`JwiftPressTint` grades the button's own paint rather than laying
   * a white veil over it, which is what washes a coloured pill out). What the APP does is neutral
   * glass by default and the inverted solid for its one prominent action, and
   * `ShowStudio.App/src/Design/BrandFill.Conformance.spec.ts` is what keeps it to that: it fails a
   * brand-coloured fill in an app sheet while leaving this input alone.
   *
   * Pass any colour or theme token (`'@Gold'`, `'rgb(255, 182, 0)'`). Null paints no fill. It is the
   * per-button twin of the ambient `JWIFT_GLASS_TINT` scope (`JivHost._useGlassTint`) and writes the
   * same two override keys, so a button should take its colour from one of the two, not both. On
   * `variant="prominent"` or `"danger-prominent"` the tint sets the RESTING plate only — the hover and
   * press steps still come from that variant's own ladder, which is another reason the app leaves this
   * alone.
   */
  readonly tint = input<string | null>(null);
  /** Greys the button out and blocks every hit (no click, and no hover/active glass bloom). The pill
   *  stays in layout — for "nothing to do yet" affordances that should read as present-but-unavailable
   *  rather than disappear. */
  readonly disabled = input<boolean>(false);
  /** App classes merged after the shape class, for a consumer-sized button. */
  readonly Class = input<string>('');

  constructor() {
    super('GlassButton', GlassButtonJss, 'Jwift_GlassBtn_Round', () => {
      // Called lazily from the reactive effect — by then `this` is real.
      // One stem per variant, then the shape suffix, so promoting or de-escalating a button never
      // moves it a point: every stem carries the same three geometries.
      const stem = VARIANT_STEM[this.variant()] ?? 'Jwift_GlassBtn';
      const suffix = this.shape() === 'pill' ? '_Pill' : this.shape() === 'square' ? '_Square' : '_Round';
      const sizeClass = this.size() === 'bar' ? ` Jwift_GlassBtnBar${suffix}`
        : this.size() === 'small' ? ` Jwift_GlassBtnSmall${suffix}`
        : '';
      return `${stem}${suffix}${sizeClass} ${this.Class()}`.trim();
    });
    // The colour override, on the same style-override channel as `disabled` so it layers over
    // whichever shape and variant class is active rather than racing it.
    effect(() => {
      const tint = this.tint();
      if (tint) this.SetStyleOverride({ Background: tint, Tint: '0' });
      else { this.ClearStyleOverride('Background'); this.ClearStyleOverride('Tint'); }
    });
    // Disabled = dimmed + inert. The dim rides the style-override channel so it layers over whichever shape
    // class is active; the inert half is Jaui's Disabled state, which stops every press, click and pointer event
    // on the pill and on its glyph or label, and the cursor with them.
    effect(() => {
      const disabled = this.disabled();
      this.SetDisabled(disabled);
      if (disabled) this.SetStyleOverride({ Opacity: '0.4' }); // @JwiftDisabledOpacity
      else this.ClearStyleOverride('Opacity');
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
