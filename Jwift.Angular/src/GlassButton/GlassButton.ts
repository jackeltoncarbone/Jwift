import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  Jaui,
  Jiv,
  JSS_REGISTRY,
  type JivStyle,
  type LayoutConfig,
  type ChildLayout,
  type TextStyle,
} from 'jaui-angular';
import { Jiv as JivCore, type SpringConfig } from 'jaui';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';
import GlassButtonJss from './GlassButton.jss';

export type GlassButtonShape = 'round' | 'pill' | 'square';

/**
 * `<glass-button>` — Jwift liquid-glass button.
 *
 * IS a jiv (not a wrapper). The button's JivCore is created in the
 * constructor and the component self-provides as the `Jiv` DI token, so
 * any projected `<jext>` / `<jiv>` children walk up to THIS button when
 * resolving their Jaui parent (Angular's declaration-position DI would
 * otherwise skip past a wrapper <jiv> inside the template and attach
 * children to the grandparent — the bug that made the icon land in the
 * page center instead of inside the button).
 *
 *   <glass-button shape="round">
 *     <jext class="ToolbarAvatarGlyph" [text]="AvatarIcon" />
 *   </glass-button>
 *
 * Shapes: `round` (default, 48×48 circle), `pill` (auto + pad), `square`.
 */
@Component({
  selector: 'glass-button',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // Projected <jiv>/<jext> children inject the Jiv token; we ARE their
    // Jaui parent, so hand them ourselves. forwardRef because the class
    // references itself.
    { provide: Jiv, useExisting: forwardRef(() => GlassButton) },
  ],
})
export class GlassButton implements OnInit, OnDestroy {
  readonly shape = input<GlassButtonShape>('round');

  /** Underlying Jiv — children attach here. Public so projected Jaui
   *  components can access it through the injected Jiv token. */
  readonly Node: JivCore;

  private _parentJiv = inject<Jiv | null>(forwardRef(() => Jiv), {
    skipSelf: true,
    optional: true,
  });
  private _canvas = inject(Jaui, { optional: true });
  private _registry = inject(JSS_REGISTRY);
  private _loader = inject(JwiftStyleLoader);

  private _className = computed(() => {
    switch (this.shape()) {
      case 'pill':   return 'Jwift_GlassBtn_Pill';
      case 'square': return 'Jwift_GlassBtn_Square';
      default:       return 'Jwift_GlassBtn_Round';
    }
  });

  constructor() {
    // Register library styles once per canvas — mounting N buttons
    // produces one MergeSource call, not N.
    this._loader.Ensure(this._registry, 'GlassButton', GlassButtonJss);

    const opts = this._resolveOptions();
    const style = (opts.Style ?? {}) as Record<string, unknown>;
    const elementProps: Record<string, unknown> = {};
    for (const key of ['Overflow', 'Visible', 'Interactive', 'PointerEvents', 'Cursor', 'UserSelect', 'PointScale', 'FitMode']) {
      if (key in style) {
        elementProps[key] = style[key];
        delete style[key];
      }
    }
    this.Node = new JivCore({ ...opts, ...elementProps });

    // React to shape changes + registry version bumps so hot-edits to the
    // Jwift stylesheet propagate through without remount.
    effect(() => {
      this._registry.Version();
      this._className();
      this._apply();
    });
  }

  ngOnInit(): void {
    this._parent().AddChild(this.Node);
    this._canvas?.Canvas.Animations.Kick();
  }

  ngOnDestroy(): void {
    this.Node.RequestLeave();
    this._canvas?.Canvas.Animations.Kick();
  }

  private _parent(): JivCore {
    if (this._parentJiv) return this._parentJiv.Node;
    if (this._canvas) return this._canvas.Root;
    throw new Error('[Jwift] <glass-button> must be inside a <jaui>');
  }

  private _resolveOptions(): {
    Style?: Partial<JivStyle>;
    Layout?: Partial<LayoutConfig>;
    ChildLayout?: Partial<ChildLayout>;
    TextStyle?: Partial<TextStyle>;
    HoverStyle?: Partial<JivStyle>;
    ActiveStyle?: Partial<JivStyle>;
    FocusStyle?: Partial<JivStyle>;
    DisabledStyle?: Partial<JivStyle>;
    Springs?: Record<string, Partial<SpringConfig>>;
  } {
    const fromClass = this._registry.Resolve(this._className()) ?? null;
    return {
      // Width/Height route to ChildLayout; Direction/Justify/Align route to
      // Layout; BorderRadius/Background/etc. stay on Style. Missing ANY of
      // these slots silently drops whole categories of props — e.g.
      // forgetting ChildLayout eats Width/Height and the button stops
      // being a circle.
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
    if (opts.Layout) Object.assign(this.Node.Layout, opts.Layout);
    if (opts.ChildLayout) Object.assign(this.Node.ChildLayout, opts.ChildLayout);
    if (opts.HoverStyle !== undefined)    this.Node.HoverStyle    = opts.HoverStyle    ?? null;
    if (opts.ActiveStyle !== undefined)   this.Node.ActiveStyle   = opts.ActiveStyle   ?? null;
    if (opts.FocusStyle !== undefined)    this.Node.FocusStyle    = opts.FocusStyle    ?? null;
    if (opts.DisabledStyle !== undefined) this.Node.DisabledStyle = opts.DisabledStyle ?? null;
    this.Node.MarkLayoutDirty();
  }
}
