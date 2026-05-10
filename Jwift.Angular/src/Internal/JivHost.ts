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
  JivHandle,
  type JivApplyOpts,
  type PointerPayload,
} from 'jaui';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';

/**
 * Base class for Jwift Angular components that ARE a Jaui Jiv (not a
 * wrapper around one). Encapsulates the boilerplate every Jwift
 * component needs:
 *
 *   1. Register the component's JSS sheet once per canvas.
 *   2. Allocate a worker-side Jiv via the bridge and post a `create` op
 *      with resolved options — early enough that children's DI finds us.
 *   3. Reactively re-apply merged options on registry-version /
 *      className changes — each enqueues an `apply` op.
 *   4. Attach to the nearest ancestor Jiv / canvas Root on init;
 *      `RequestLeave` + `Destroy` on detach.
 *
 * Worker-mode: `Node` is a `JivHandle`. Subclass code that does
 * `this.Node.AddChild(...)`, `this.Node.MarkLayoutDirty()`,
 * `this.Node.SetText(...)`, etc. continues to work — JivHandle
 * preserves those names and forwards them as ops.
 */
export abstract class JivHost {
  /** Underlying worker-side Jiv (handle). Children attach here via DI. */
  readonly Node: JivHandle;

  private _parentJiv = inject<Jiv | null>(forwardRef(() => Jiv), {
    skipSelf: true,
    optional: true,
  });
  private _canvas = inject(Jaui, { optional: true });
  private _registry = inject(JSS_REGISTRY);
  private _loader = inject(JwiftStyleLoader);
  private _host = inject(ElementRef<HTMLElement>);

  private _className: () => string;

  constructor(sourceId: string, source: string, initialClassName: string, className: () => string) {
    this._className = className;
    this._loader.Ensure(this._registry, sourceId, source);

    if (!this._canvas) {
      throw new Error('[Jwift] component must be inside a <jaui>');
    }
    const bridge = this._canvas.Bridge;
    this.Node = new JivHandle(bridge, bridge.AllocateId());

    bridge.Enqueue({
      K: 'create',
      Id: this.Node.Id,
      Opts: this._buildOpts(initialClassName),
    });

    this.Node.SetHit({
      OnClick: () => {
        this._host.nativeElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      },
      OnContextMenu: (src: PointerPayload) => {
        this._host.nativeElement.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true,
          clientX: src.ClientX, clientY: src.ClientY, button: src.Button,
        }));
      },
      OnPointerDown: (e) => this._host.nativeElement.dispatchEvent(_clonePointerEvent('pointerdown', e)),
      OnPointerMove: (e) => this._host.nativeElement.dispatchEvent(_clonePointerEvent('pointermove', e)),
      OnPointerUp: (e) => this._host.nativeElement.dispatchEvent(_clonePointerEvent('pointerup', e)),
    });

    effect(() => {
      this._registry.Version();
      this._className();
      this._apply();
    });
  }

  protected _attachOnInit(): void {
    const parentNode = this._parentJiv ? this._parentJiv.Node : this._canvas!.Root;
    parentNode.AddChild(this.Node);
  }

  protected _detachOnDestroy(): void {
    this.Node.RequestLeave();
    this.Node.Destroy();
  }

  private _apply(): void {
    this.Node.Apply(this._buildOpts(this._className()));
  }

  private _buildOpts(className: string): JivApplyOpts {
    const fromClass = this._registry.Resolve(className) ?? null;
    const styleBag = (fromClass?.Style ? { ...fromClass.Style } : {}) as Record<string, unknown>;

    const elementProps: JivApplyOpts['ElementProps'] = {};
    for (const key of _ELEMENT_KEYS) {
      if (key in styleBag) {
        const v = styleBag[key];
        if (key === 'Visible' || key === 'Interactive') {
          (elementProps as Record<string, unknown>)[key] = (v === true || v === 'true');
        } else {
          (elementProps as Record<string, unknown>)[key] = v;
        }
        delete styleBag[key];
      }
    }

    return {
      Style:         styleBag,
      Layout:        fromClass?.Layout        ? ({ ...fromClass.Layout }      as Record<string, unknown>) : undefined,
      ChildLayout:   fromClass?.ChildLayout   ? ({ ...fromClass.ChildLayout } as Record<string, unknown>) : undefined,
      TextStyle:     fromClass?.TextStyle     ? ({ ...fromClass.TextStyle }   as Record<string, unknown>) : undefined,
      HoverStyle:        fromClass?.HoverStyle        as Record<string, unknown> | undefined,
      ActiveStyle:       fromClass?.ActiveStyle       as Record<string, unknown> | undefined,
      FocusStyle:        fromClass?.FocusStyle        as Record<string, unknown> | undefined,
      DisabledStyle:     fromClass?.DisabledStyle     as Record<string, unknown> | undefined,
      HoverTextStyle:    fromClass?.HoverTextStyle    as Record<string, unknown> | undefined,
      ActiveTextStyle:   fromClass?.ActiveTextStyle   as Record<string, unknown> | undefined,
      FocusTextStyle:    fromClass?.FocusTextStyle    as Record<string, unknown> | undefined,
      DisabledTextStyle: fromClass?.DisabledTextStyle as Record<string, unknown> | undefined,
      Springs:           fromClass?.Springs           as Record<string, Record<string, unknown>> | undefined,
      ElementProps:      Object.keys(elementProps).length > 0 ? elementProps : undefined,
    };
  }
}

const _ELEMENT_KEYS = [
  'Overflow', 'Visible', 'Interactive', 'PointerEvents',
  'Cursor', 'UserSelect', 'PointScale', 'FitMode',
];

function _clonePointerEvent(type: string, src: PointerPayload): PointerEvent {
  const evt = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: src.ClientX,
    clientY: src.ClientY,
    pointerId: src.PointerId,
    pointerType: src.PointerType,
    button: src.Button,
    buttons: src.Buttons,
    shiftKey: src.Shift,
    ctrlKey: src.Ctrl,
    altKey: src.Alt,
    metaKey: src.Meta,
  });
  (evt as PointerEvent & { __jauiBridged?: boolean }).__jauiBridged = true;
  return evt;
}
