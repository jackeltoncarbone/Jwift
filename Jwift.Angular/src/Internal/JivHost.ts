import {
  ElementRef,
  effect,
  forwardRef,
  inject,
} from '@angular/core';
import {
  Jaui,
  Jiv,
  JSS_REGISTRY,
} from 'jaui-angular';
import {
  Jiv as JivCore,
  DefaultJivStyle, DefaultLayoutConfig, DefaultChildLayout,
  type JivStyle, type LayoutConfig, type ChildLayout,
} from 'jaui';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';

/**
 * Base class for Jwift Angular components that ARE a Jaui Jiv (not a
 * wrapper around one). Encapsulates the boilerplate every Jwift
 * component needs:
 *
 *   1. Register the component's JSS sheet once per canvas (via the
 *      loader) so N instances don't spam N merges.
 *   2. Create a JivCore in the constructor using resolved options from
 *      the registry — early enough that children's DI can find us.
 *   3. Reactively re-apply merged options when the registry version
 *      bumps (hot-edit support) or the subclass's className signal
 *      changes.
 *   4. Attach to the nearest ancestor Jiv / canvas Root on init;
 *      `RequestLeave` on destroy for a clean fade-out.
 *
 * Subclass usage:
 *
 *   @Component({
 *     selector: 'my-thing',
 *     template: '<ng-content></ng-content>',
 *     styles: [':host { display: contents; }'],
 *     providers: [
 *       { provide: Jiv, useExisting: forwardRef(() => MyThing) },
 *     ],
 *   })
 *   export class MyThing extends JivHost {
 *     constructor() {
 *       super('MyThing', MyThingJss, () => 'My_Thing_Class');
 *     }
 *   }
 *
 * `providers` still has to go on the @Component decorator (the Jiv DI
 * token is per-subclass), but every line after that lives here.
 */
export abstract class JivHost {
  /** Underlying Jiv — children attach here via the Jiv DI token. */
  readonly Node: JivCore;

  private _parentJiv = inject<Jiv | null>(forwardRef(() => Jiv), {
    skipSelf: true,
    optional: true,
  });
  private _canvas = inject(Jaui, { optional: true });
  private _registry = inject(JSS_REGISTRY);
  private _loader = inject(JwiftStyleLoader);
  private _host = inject(ElementRef<HTMLElement>);

  private _className: () => string;

  /**
   * @param sourceId          Unique key for the style sheet (loader dedupes).
   * @param source            The raw JSS source to register in the registry.
   * @param initialClassName  Class name used at construction — must be a
   *                          plain string because `super()` cannot touch
   *                          subclass fields (TDZ). Typical pattern: pass
   *                          the default variant.
   * @param className         Resolver for reactive class-name changes (input
   *                          signals, etc). Called LATER from effect(), by
   *                          which time `this` is fully initialized, so
   *                          closures over subclass signals are safe.
   */
  constructor(sourceId: string, source: string, initialClassName: string, className: () => string) {
    this._className = className;
    this._loader.Ensure(this._registry, sourceId, source);

    const opts = this._resolveOptionsFor(initialClassName);
    const style = (opts.Style ?? {}) as Record<string, unknown>;
    const elementProps: Record<string, unknown> = {};
    for (const key of _ELEMENT_KEYS) {
      if (key in style) {
        elementProps[key] = style[key];
        delete style[key];
      }
    }
    this.Node = new JivCore({ ...opts, ...elementProps });
    // Bridge Jaui's canvas-level pointer + click gestures to DOM events
    // on this component's host element so `(click)` and
    // `(pointerdown/move/up)` template bindings on ANY Jwift component
    // (glass-button, tab-item, etc.) fire the same way they do on
    // `<jiv>` from Jaui.Angular.
    this.Node.OnClick = () => {
      this._host.nativeElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    };
    this.Node.OnPointerDown = (e) => {
      this._host.nativeElement.dispatchEvent(_clonePointerEvent('pointerdown', e));
    };
    this.Node.OnPointerMove = (e) => {
      this._host.nativeElement.dispatchEvent(_clonePointerEvent('pointermove', e));
    };
    this.Node.OnPointerUp = (e) => {
      this._host.nativeElement.dispatchEvent(_clonePointerEvent('pointerup', e));
    };

    // React to hot-edits (registry.Version bumps) and subclass-driven
    // className changes (e.g. GlassButton's shape input).
    effect(() => {
      this._registry.Version();
      this._className();
      this._apply();
    });
  }

  /** Call from ngOnInit. Attaches this node under the nearest Jaui parent. */
  protected _attachOnInit(): void {
    this._parent().AddChild(this.Node);
    this._canvas?.Canvas.Animations.Kick();
  }

  /** Call from ngOnDestroy. Starts the leave-presence fade. */
  protected _detachOnDestroy(): void {
    this.Node.RequestLeave();
    this._canvas?.Canvas.Animations.Kick();
  }

  private _parent(): JivCore {
    if (this._parentJiv) return this._parentJiv.Node;
    if (this._canvas) return this._canvas.Root;
    throw new Error('[Jwift] component must be inside a <jaui>');
  }

  private _resolveOptions() {
    return this._resolveOptionsFor(this._className());
  }

  private _resolveOptionsFor(className: string) {
    const fromClass = this._registry.Resolve(className) ?? null;
    return {
      Style:         fromClass?.Style         ? { ...fromClass.Style }         : undefined,
      Layout:        fromClass?.Layout        ? { ...fromClass.Layout }        : undefined,
      ChildLayout:   fromClass?.ChildLayout   ? { ...fromClass.ChildLayout }   : undefined,
      TextStyle:     fromClass?.TextStyle     ? { ...fromClass.TextStyle }     : undefined,
      HoverStyle:        fromClass?.HoverStyle,
      ActiveStyle:       fromClass?.ActiveStyle,
      FocusStyle:        fromClass?.FocusStyle,
      DisabledStyle:     fromClass?.DisabledStyle,
      HoverTextStyle:    fromClass?.HoverTextStyle,
      ActiveTextStyle:   fromClass?.ActiveTextStyle,
      FocusTextStyle:    fromClass?.FocusTextStyle,
      DisabledTextStyle: fromClass?.DisabledTextStyle,
      Springs:           fromClass?.Springs,
    };
  }

  private _apply(): void {
    const opts = this._resolveOptions();
    const classStyle = (opts.Style ?? {}) as Record<string, unknown>;
    const overflow = 'Overflow' in classStyle ? classStyle['Overflow'] : undefined;
    const visible = 'Visible' in classStyle ? classStyle['Visible'] : undefined;
    const interactive = 'Interactive' in classStyle ? classStyle['Interactive'] : undefined;
    const pointerEvents = 'PointerEvents' in classStyle ? classStyle['PointerEvents'] : undefined;
    const cursor = 'Cursor' in classStyle ? classStyle['Cursor'] : undefined;
    const userSelect = 'UserSelect' in classStyle ? classStyle['UserSelect'] : undefined;
    const fitMode = 'FitMode' in classStyle ? classStyle['FitMode'] : undefined;
    for (const k of ['Overflow','Visible','Interactive','PointerEvents','Cursor','UserSelect','FitMode']) {
      delete classStyle[k];
    }
    if (overflow !== undefined)      this.Node.Overflow = overflow as 'Visible' | 'Hidden' | 'Scroll';
    // JSS values arrive as strings ('true'/'false'); inline [style] passes
    // real booleans. Coerce so 'false' doesn't end up truthy.
    if (visible !== undefined)       this.Node.Visible = visible === true || visible === 'true';
    if (interactive !== undefined)   this.Node.Interactive = interactive === true || interactive === 'true';
    if (pointerEvents !== undefined) this.Node.PointerEvents = pointerEvents as 'Auto' | 'None';
    if (cursor !== undefined)        this.Node.Cursor = cursor as 'Default' | 'Pointer' | 'Text' | 'Move' | 'None';
    if (userSelect !== undefined)    this.Node.UserSelect = userSelect as 'Auto' | 'None';
    if (fitMode !== undefined)       this.Node.FitMode = fitMode as 'Contain' | 'Cover';

    // Rebuild from defaults each time so class swaps fully reset unset fields.
    // Layout / ChildLayout follow the same pattern as Style — without the
    // default rebuild, properties set by one variant (e.g. _Open's
    // Width: 176pt) leak through to the next variant (_Closed) when the
    // new class doesn't redeclare them, and the node never shrinks back.
    const next: JivStyle = { ...DefaultJivStyle, ...(classStyle as Partial<JivStyle>) };
    Object.assign(this.Node.Style, next);

    const nextLayout: LayoutConfig = { ...DefaultLayoutConfig, ...(opts.Layout ?? {}) };
    Object.assign(this.Node.Layout, nextLayout);

    const nextChildLayout: ChildLayout = { ...DefaultChildLayout, ...(opts.ChildLayout ?? {}) };
    Object.assign(this.Node.ChildLayout, nextChildLayout);
    if (opts.TextStyle) this.Node.SetText(this.Node.Text, opts.TextStyle);
    if (opts.HoverStyle !== undefined)        this.Node.HoverStyle        = opts.HoverStyle        ?? null;
    if (opts.ActiveStyle !== undefined)       this.Node.ActiveStyle       = opts.ActiveStyle       ?? null;
    if (opts.FocusStyle !== undefined)        this.Node.FocusStyle        = opts.FocusStyle        ?? null;
    if (opts.DisabledStyle !== undefined)     this.Node.DisabledStyle     = opts.DisabledStyle     ?? null;
    if (opts.HoverTextStyle !== undefined)    this.Node.HoverTextStyle    = opts.HoverTextStyle    ?? null;
    if (opts.ActiveTextStyle !== undefined)   this.Node.ActiveTextStyle   = opts.ActiveTextStyle   ?? null;
    if (opts.FocusTextStyle !== undefined)    this.Node.FocusTextStyle    = opts.FocusTextStyle    ?? null;
    if (opts.DisabledTextStyle !== undefined) this.Node.DisabledTextStyle = opts.DisabledTextStyle ?? null;
    this.Node.MarkLayoutDirty();
  }
}

const _ELEMENT_KEYS = [
  'Overflow', 'Visible', 'Interactive', 'PointerEvents',
  'Cursor', 'UserSelect', 'PointScale', 'FitMode',
];

function _clonePointerEvent(type: string, src: PointerEvent): PointerEvent {
  const evt = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: src.clientX,
    clientY: src.clientY,
    pointerId: src.pointerId,
    pointerType: src.pointerType,
    button: src.button,
    buttons: src.buttons,
  });
  // Marker so DOM listeners on ancestor elements (e.g. page-root field
  // gesture handlers) can distinguish bridge-synthesized events — fired
  // because Jaui hit-tested a Jiv-painted child — from native pointer
  // events on the canvas, which target real field area.
  (evt as PointerEvent & { __jauiBridged?: boolean }).__jauiBridged = true;
  return evt;
}
