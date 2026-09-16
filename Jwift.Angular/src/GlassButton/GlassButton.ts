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
 * `prominent` — the ONE action that is the point of the screen, drawn as the inverted solid: the
 * label colour as the plate and the label inverted (white-on-black in dark, black-on-white in
 * light). A screen gets one. Two prominent buttons on one screen is neither of them being prominent.
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
export type GlassButtonVariant = 'glass' | 'prominent' | 'danger' | 'danger-prominent';

/** The class stem each variant resolves to. The shape suffix (`_Round` / `_Pill` / `_Square`) is
 *  appended, and every stem declares all three, so a variant change never moves the button. */
const VARIANT_STEM: Record<GlassButtonVariant, string> = {
  glass: 'Jwift_GlassBtn',
  prominent: 'Jwift_GlassBtn_Prominent',
  danger: 'Jwift_GlassBtn_Danger',
  'danger-prominent': 'Jwift_GlassBtn_DangerProminent',
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
 * Shapes: `round` (default, 48×48 circle), `pill` (auto + pad), `square`.
 * Variants: `glass` (default — today's liquid glass), `prominent` (the inverted solid), `danger` (the
 * same glass under a red label) and `danger-prominent` (the filled red confirm).
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
   *  inverted solid, for the one action a screen leads with; `danger` is the same glass under a red
   *  label; `danger-prominent` is the filled red confirm. See {@link GlassButtonVariant}. */
  readonly variant = input<GlassButtonVariant>('glass');
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
      const shape = this.shape() === 'pill' ? `${stem}_Pill` : this.shape() === 'square' ? `${stem}_Square` : `${stem}_Round`;
      return `${shape} ${this.Class()}`.trim();
    });
    // The colour override, on the same style-override channel as `disabled` so it layers over
    // whichever shape and variant class is active rather than racing it.
    effect(() => {
      const tint = this.tint();
      if (tint) this.SetStyleOverride({ Background: tint, Tint: '0' });
      else { this.ClearStyleOverride('Background'); this.ClearStyleOverride('Tint'); }
    });
    // Disabled = dimmed + inert. Routed through the JivHost style-override channel (not a JSS pseudo) so
    // it layers over whichever shape class is active. Interactive:false is the important half — it stops
    // the engine hit-testing the pill, so neither the click nor the :Hover/:Active brightness springs
    // fire on a disabled button.
    effect(() => {
      if (this.disabled()) {
        this.SetStyleOverride({ Opacity: '0.4', Interactive: false, Cursor: 'Default' });
      } else {
        this.ClearStyleOverride('Opacity');
        this.ClearStyleOverride('Interactive');
        this.ClearStyleOverride('Cursor');
      }
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
