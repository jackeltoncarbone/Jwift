import {
  Directive,
  ElementRef,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  untracked,
  type WritableSignal,
} from '@angular/core';
import {
  Jaui,
  Jiv,
  JAUI_HOST_EL,
  JSS_REGISTRY,
  WireTeleportInputs,
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
@Directive()
export abstract class JivHost {
  /** Underlying worker-side Jiv (handle). Children attach here via DI. */
  readonly Node: JivHandle;

  // ── Teleport (base capability — every Jwift component is a jiv) ──
  /** Makes this component a named OUTLET in the canvas-scoped TeleportRegistry. */
  readonly TeleportId = input<string | undefined>(undefined);
  /** Live AT the named outlet (the declaration site stops determining the
   *  canvas parent; moves between outlets fly via the engine's rect springs).
   *  `null` re-parents to the declaration-site parent. */
  readonly TeleportTo = input<string | null | undefined>(undefined);

  private _parentJiv = inject<Jiv | null>(forwardRef(() => Jiv), {
    skipSelf: true,
    optional: true,
  });
  private _canvas = inject(Jaui, { optional: true });
  private _registry = inject(JSS_REGISTRY);
  private _loader = inject(JwiftStyleLoader);
  private _host = inject(ElementRef<HTMLElement>);

  private _className: () => string;

  /** Per-instance Style overrides for subclasses (e.g. Card setting
   *  `Background: Url(...)` from a runtime `[image]` input). Merged ON TOP
   *  of the JSS class's Style inside `_buildOpts`. Routed through this
   *  signal — instead of via `this.Node.Style` proxy writes — so JivHost's
   *  effect re-fires `_apply()` with the FULL class state every time the
   *  override changes. Writing direct to `this.Node.Style` triggers
   *  JivHandle's bare-proxy flush, which ships only the override and the
   *  worker then resets the class state to defaults — wiping `Width`,
   *  `Height`, etc. and collapsing the panel to 0×0. */
  private readonly _styleOverride: WritableSignal<Record<string, unknown>> = signal({});

  /** Subclass setter for runtime Style overrides. Triggers the JivHost
   *  effect to re-fire `_apply()` with the merged class + override state.
   *  The read of `_styleOverride()` is wrapped in `untracked` so callers
   *  who run inside their own `effect()` (Card reading its `[image]`
   *  signal, then calling this) don't accidentally create a feedback
   *  loop: read → write → re-fire same effect → write → repeat → OOM. */
  protected SetStyleOverride(patch: Record<string, unknown>): void {
    const next = { ...untracked(() => this._styleOverride()), ...patch };
    this._styleOverride.set(next);
  }

  /** Clear a single Style override key (e.g. when an `[image]` input goes
   *  back to null / undefined). */
  protected ClearStyleOverride(key: string): void {
    const cur = untracked(() => this._styleOverride());
    if (!(key in cur)) return;
    const { [key]: _gone, ...rest } = cur;
    void _gone;
    this._styleOverride.set(rest);
  }

  constructor(sourceId: string, source: string, initialClassName: string, className: () => string) {
    this._className = className;
    this._loader.Ensure(this._registry, sourceId, source);

    if (!this._canvas) {
      throw new Error('[Jwift] component must be inside a <jaui>');
    }
    const bridge = this._canvas.Bridge;
    this.Node = new JivHandle(bridge, bridge.AllocateId());
    // Register this component's host element so both it and plain <jiv>
    // siblings can reconcile child order to authored DOM position (see
    // JAUI_HOST_EL + _reorderToDomPosition in Jaui's Jiv.ts). Without this
    // a glass-button that attaches after a plain <jext> sibling appends to
    // the END of the parent's Children — e.g. the toolbar back-button
    // landing AFTER the title text instead of before it.
    JAUI_HOST_EL.set(this.Node, this._host.nativeElement);

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
      this._styleOverride();
      this._apply();
    });

    WireTeleportInputs({
      Node: this.Node,
      TeleportId: this.TeleportId,
      TeleportTo: this.TeleportTo,
      NaturalParent: () => this._parentJiv ? this._parentJiv.Node : this._canvas?.Root ?? null,
    });
  }

  protected _attachOnInit(): void {
    const parentNode = this._parentJiv ? this._parentJiv.Node : this._canvas!.Root;
    parentNode.AddChild(this.Node);
    // AddChild appends. If this component attached out of authored order
    // (component ngOnInit can run after a plain <jext>/<jiv> sibling has
    // already attached), move it to its real DOM position so paint/layout
    // order matches the template instead of attach order. Mirrors the
    // Jaui <jiv> directive's own reconciliation.
    this._reorderToDomPosition(parentNode);
  }

  /** Reorder this node within its parent's Children to match DOM document order.
   *  The target index is the count of current siblings whose host element
   *  precedes ours in the DOM; a no-op when already in order (the common case),
   *  so statically-ordered children never post a move op. Mirrors the identical
   *  routine in Jaui's `Jiv` directive — kept in sync so glass/host components
   *  and plain jivs order consistently against each other in a shared parent. */
  private _reorderToDomPosition(parentNode: JivHandle): void {
    const myEl = this._host.nativeElement;
    const siblings = parentNode.Children;
    let target = 0;
    for (const sib of siblings) {
      if (sib === this.Node) continue;
      const sibEl = JAUI_HOST_EL.get(sib);
      // Only order against siblings still in the DOM; a leaving node's element
      // may be detached and would compare as disconnected.
      if (!sibEl || !sibEl.isConnected) continue;
      if (myEl.compareDocumentPosition(sibEl) & Node.DOCUMENT_POSITION_PRECEDING) {
        target++;
      }
    }
    const current = siblings.indexOf(this.Node);
    if (current !== -1 && current !== target) {
      parentNode.MoveChildToIndex(this.Node, target);
    }
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
    // Layer the per-instance Style overrides OVER the class-resolved bag.
    // Subclasses (e.g. Card setting `Background: Url(...)` from a runtime
    // `[image]` input) call `SetStyleOverride` instead of writing through
    // the JivHandle.Style proxy — direct proxy writes trigger the bare
    // _flush path on the worker side, which only ships the override and
    // resets the rest of core.Style to engine defaults (wiping the JSS
    // class's Width/Height/Padding/etc.).
    const styleBag = {
      ...fromClass?.Style,
      ...this._styleOverride(),
    } as Record<string, unknown>;
    // Semantics is mirror-only data (Jaui.Angular SEO projection) — the
    // render engine must never see it.
    delete styleBag['Semantics'];

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
      ChildLayout:   fromClass?.ChildLayout
        ? ({ ...this.Node.ChildLayout, ...fromClass.ChildLayout } as Record<string, unknown>)
        : undefined,
      TextStyle:     fromClass?.TextStyle     ? ({ ...fromClass.TextStyle }   as Record<string, unknown>) : undefined,
      // Pseudo-selector rules — both `:Foo` and `:(expr)` from JSS —
      // ride PredicateStyles as one consolidated list. The legacy 10
      // *Style / *TextStyle slot fields were retired; the parser now
      // compiles single-state pseudos to single-atom predicates.
      PredicateStyles:   fromClass?.PredicateStyles   as ReadonlyArray<Record<string, unknown>> | undefined,
      Springs:           fromClass?.Springs           as Record<string, Record<string, unknown>> | undefined,
      ElementProps:      Object.keys(elementProps).length > 0 ? elementProps : undefined,
    };
  }
}

const _ELEMENT_KEYS = [
  // 'Clip' MUST be here (parity with the <jiv> directive's extraction): without it a
  // JivHost class's `Clip: Hidden` stays in the style bag and never reaches the element,
  // so a rounded glass host (e.g. the drill library panel) silently never clips its content.
  'Overflow', 'Clip', 'Visible', 'Interactive', 'PointerEvents',
  'Cursor', 'UserSelect', 'PointScale',
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
