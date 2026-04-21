import {
  effect,
  forwardRef,
  inject,
} from '@angular/core';
import {
  Jaui,
  Jiv,
  JSS_REGISTRY,
} from 'jaui-angular';
import { Jiv as JivCore } from 'jaui';
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

  private _className: () => string;

  /**
   * @param sourceId   Unique key for the style sheet (used by the loader
   *                   to dedupe across canvas instances).
   * @param source     The raw JSS source to register in the registry.
   * @param className  Resolver for this component's class name — a
   *                   closure because subclasses typically vary the
   *                   name by input (shape, variant, etc.).
   */
  constructor(sourceId: string, source: string, className: () => string) {
    this._className = className;
    this._loader.Ensure(this._registry, sourceId, source);

    const opts = this._resolveOptions();
    const style = (opts.Style ?? {}) as Record<string, unknown>;
    const elementProps: Record<string, unknown> = {};
    for (const key of _ELEMENT_KEYS) {
      if (key in style) {
        elementProps[key] = style[key];
        delete style[key];
      }
    }
    this.Node = new JivCore({ ...opts, ...elementProps });

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
    const fromClass = this._registry.Resolve(this._className()) ?? null;
    return {
      Style:         fromClass?.Style         ? { ...fromClass.Style }         : undefined,
      Layout:        fromClass?.Layout        ? { ...fromClass.Layout }        : undefined,
      ChildLayout:   fromClass?.ChildLayout   ? { ...fromClass.ChildLayout }   : undefined,
      TextStyle:     fromClass?.TextStyle     ? { ...fromClass.TextStyle }     : undefined,
      HoverStyle:    fromClass?.HoverStyle,
      ActiveStyle:   fromClass?.ActiveStyle,
      FocusStyle:    fromClass?.FocusStyle,
      DisabledStyle: fromClass?.DisabledStyle,
      Springs:       fromClass?.Springs,
    };
  }

  private _apply(): void {
    const opts = this._resolveOptions();
    if (opts.Style) {
      const style = opts.Style as Record<string, unknown>;
      if ('Overflow' in style)      { this.Node.Overflow = style['Overflow'] as 'Visible' | 'Hidden' | 'Scroll'; delete style['Overflow']; }
      if ('Visible' in style)       { this.Node.Visible = style['Visible'] as boolean; delete style['Visible']; }
      if ('Interactive' in style)   { this.Node.Interactive = style['Interactive'] as boolean; delete style['Interactive']; }
      if ('PointerEvents' in style) { this.Node.PointerEvents = style['PointerEvents'] as 'Auto' | 'None'; delete style['PointerEvents']; }
      if ('Cursor' in style)        { this.Node.Cursor = style['Cursor'] as 'Default' | 'Pointer' | 'Text' | 'Move' | 'None'; delete style['Cursor']; }
      if ('UserSelect' in style)    { this.Node.UserSelect = style['UserSelect'] as 'Auto' | 'None'; delete style['UserSelect']; }
      if ('FitMode' in style)       { this.Node.FitMode = style['FitMode'] as 'Contain' | 'Cover'; delete style['FitMode']; }
      Object.assign(this.Node.Style, style);
    }
    if (opts.Layout)      Object.assign(this.Node.Layout, opts.Layout);
    if (opts.ChildLayout) Object.assign(this.Node.ChildLayout, opts.ChildLayout);
    if (opts.HoverStyle !== undefined)    this.Node.HoverStyle    = opts.HoverStyle    ?? null;
    if (opts.ActiveStyle !== undefined)   this.Node.ActiveStyle   = opts.ActiveStyle   ?? null;
    if (opts.FocusStyle !== undefined)    this.Node.FocusStyle    = opts.FocusStyle    ?? null;
    if (opts.DisabledStyle !== undefined) this.Node.DisabledStyle = opts.DisabledStyle ?? null;
    this.Node.MarkLayoutDirty();
  }
}

const _ELEMENT_KEYS = [
  'Overflow', 'Visible', 'Interactive', 'PointerEvents',
  'Cursor', 'UserSelect', 'PointScale', 'FitMode',
];
