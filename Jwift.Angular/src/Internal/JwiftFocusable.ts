import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { Jaui, Jiv, JSS_REGISTRY } from 'jaui-angular';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';
import { FocusController, FocusRingJss } from './FocusController';

/**
 * `[JwiftFocusable]` — Apple's keyboard focus (Tab stop, Space/Return, Esc, the concentric ring) for a
 * plain `<jiv>` a COMPONENT'S OWN TEMPLATE renders directly, rather than a standalone Jwift component
 * (`JivHost`'s own job — reused here, not duplicated, via the shared `FocusController`). Exists because
 * not every real control is its own "IS a jiv" component: a toolbar group's own cells
 * (`GlassActionBar`/`GlassActionGroup`, one group pill rendering N `<jiv semantics="Button">` cells
 * itself) and a title button's own `<jiv>` are each one piece of a LARGER component's template, so
 * there is no separate Jwift component to extend `JivHost` in the first place.
 *
 *   <jiv #cell class="..." JwiftFocusable [JwiftFocusableDisabled]="a.Disabled" semantics="Button"
 *        [label]="a.Label" (click)="...">
 *
 * The one rule this buys for free, the same as `JivHost`'s own: a container that is `Interactive` only
 * to catch a press FOR cells like this one (`GlassDropdown` wrapping a row of them) stops being its own
 * Tab stop the moment any of its cells is — `FocusController.Sync`'s own doc comment.
 */
@Directive({ selector: '[JwiftFocusable]', standalone: true })
export class JwiftFocusable {
  /** Suppresses the Tab stop and the ring — same contract as `GlassButton.disabled`, `Jiv`'s own
   *  `Disabled` state: present but unreachable, never hidden. Defaults to false: a cell that never
   *  says otherwise is always focusable while its JwiftFocusable itself is attached. */
  readonly JwiftFocusableDisabled = input(false);

  private readonly _jiv = inject(Jiv);
  private readonly _host = inject(ElementRef<HTMLElement>);
  private readonly _canvas = inject(Jaui, { optional: true });
  private readonly _registry = inject(JSS_REGISTRY);
  private readonly _loader = inject(JwiftStyleLoader);
  private readonly _focus: FocusController;

  constructor() {
    if (!this._canvas) throw new Error('[Jwift] JwiftFocusable must be inside a <jaui>');
    this._loader.Ensure(this._registry, 'FocusRing', FocusRingJss);
    this._focus = new FocusController(this._host.nativeElement, this._jiv.Node, this._registry, this._canvas.Bridge);
    // The cell's own `BorderRadius` the same way `JivHost._buildOpts` reads a Jwift component's: off
    // the registry, by class name — `Jiv.className` is the SAME `[class]` input the canvas-side
    // resolution already reads (`Jiv.ts`'s own `StampProbeHost(..., this.className())`), so this can
    // never see a different radius than the one this cell actually painted.
    effect(() => {
      const disabled = this.JwiftFocusableDisabled();
      const radius = this._registry.Resolve(this._jiv.className())?.Style?.['BorderRadius'];
      this._focus.Sync(true, disabled, radius);
    });
  }
}
