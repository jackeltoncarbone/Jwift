import {
  Directive,
  ElementRef,
  InjectionToken,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  untracked,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import {
  DomReorderTarget,
  Jaui,
  Jiv,
  JAUI_HOST_EL,
  JSS_REGISTRY,
  StampProbeHost,
  WireTeleportInputs,
} from 'jaui-angular';
import {
  JivHandle,
  SlotFor,
  type JivApplyOpts,
  type PointerPayload,
} from 'jaui';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';
import { FocusController, FocusRingJss } from './FocusController';

/**
 * Ambient glass tint — an optional accent fill (a colour string, or null) every Jwift glass component
 * blends into its background. Provide it scoped to a subtree (e.g. a themed drill page) and every glass
 * surface under it picks up the tint; provide nothing (the default) and glass looks exactly as authored.
 * The value is a Signal so the host re-applies reactively when the tint changes.
 */
export const JWIFT_GLASS_TINT = new InjectionToken<Signal<string | null>>('JWIFT_GLASS_TINT');

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

  /** Per-instance TextStyle overrides (e.g. an Icon tinting its glyph to a
   *  runtime accent colour). Merged ON TOP of the JSS class's TextStyle inside
   *  `_buildOpts`, routed through a signal so JivHost's effect re-fires `_apply()`
   *  with the FULL class state on change — same contract as `_styleOverride`,
   *  but for the TextStyle bucket (Color / FontWeight / …) rather than Style. */
  private readonly _textStyleOverride: WritableSignal<Record<string, unknown>> = signal({});

  /** Optional ambient accent tint from a themed ancestor scope. Consumed only by components that opt in
   *  via `_useGlassTint()` — so containers (toolbars, sheets) stay neutral while glass pills/buttons tint. */
  private readonly _glassTintToken = inject(JWIFT_GLASS_TINT, { optional: true });

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

  /** `SetStyleOverride`, applied at once rather than on the host's next effect: for a style that must reach the
   *  worker in the same batch as an op made beside it (a menu's shown state with its `MorphFrom`, `Popover`). */
  protected SetStyleOverrideNow(patch: Record<string, unknown>): void {
    this.SetStyleOverride(patch);
    this._apply();
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

  /** UIKit's isEnabled, as Jaui's reserved Disabled state: the node and everything inside it take no press. */
  private readonly _disabled: WritableSignal<boolean | undefined> = signal(undefined);
  protected SetDisabled(disabled: boolean): void { this._disabled.set(disabled); }

  // ── Keyboard focus (HIG Full Keyboard Access) ───────────────────────
  /** Apple's Tab/Shift-Tab/Space/Return/Esc and ring (`FocusController.ts`) — the one implementation
   *  this base class shares with `JwiftFocusable`, the directive version for a plain `<jiv>` a
   *  component template owns directly (a toolbar group's own cells, a title button) rather than
   *  being JivHost's own host. Constructed below, once `this.Node` and the registry/bridge exist.
   *  `protected`, not `private` — a subclass that is itself a composite control (`TokenSentence`'s
   *  own roving Left/Right/Up/Down across its tokens, Drill Sentences lane AG2) reads `FocusVisible`
   *  and calls `SuppressRing` on its OWN host's controller directly, rather than this base class
   *  growing a bespoke pass-through for the one subclass that needs it. */
  protected _focus!: FocusController;

  /** Subclass setter for runtime TextStyle overrides (e.g. an accent Color on a
   *  glyph/label). Same untracked-read + re-fire contract as SetStyleOverride. */
  protected SetTextStyleOverride(patch: Record<string, unknown>): void {
    const next = { ...untracked(() => this._textStyleOverride()), ...patch };
    this._textStyleOverride.set(next);
  }

  /** Clear a single TextStyle override key (revert to the class's value). */
  protected ClearTextStyleOverride(key: string): void {
    const cur = untracked(() => this._textStyleOverride());
    if (!(key in cur)) return;
    const { [key]: _gone, ...rest } = cur;
    void _gone;
    this._textStyleOverride.set(rest);
  }

  /** Opt this glass component into the ambient accent tint. Call ONCE in the subclass constructor:
   *  a themed ancestor scope (providing JWIFT_GLASS_TINT) then blends its accent into this surface's
   *  background; no provided tint leaves the authored glass untouched. An accented control owns its colour,
   *  so the accent also zeroes the glass body's neutral Tint: the accent is never pulled to black or white.
   *  Background, GlassTint (the seed, on glass) and Tint only, so it composes with other style overrides (e.g. a disabled Opacity).
   *  Containers that should stay neutral simply don't call this. */
  protected _useGlassTint(): void {
    effect(() => {
      const tint = this._glassTintToken ? this._glassTintToken() : null;
      if (tint) { this.SetStyleOverride({ Background: tint, GlassTint: tint, Tint: '0' }); }
      else { this.ClearStyleOverride('Background'); this.ClearStyleOverride('GlassTint'); this.ClearStyleOverride('Tint'); }
    });
  }

  constructor(sourceId: string, source: string, initialClassName: string, className: () => string) {
    this._className = className;
    this._loader.Ensure(this._registry, sourceId, source);
    this._loader.Ensure(this._registry, 'FocusRing', FocusRingJss);

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
      OnPanClaim: (e) => this._host.nativeElement.dispatchEvent(_clonePointerEvent('panclaim', e)),
    });

    // Tab/Shift-Tab traversal itself needs no wiring here: `_apply` gives a focusable host a real
    // `tabIndex`, in real DOM document order (`_reorderToDomPosition` already keeps that order in sync
    // with the canvas), so the browser's own native Tab walks every Jwift control exactly like any
    // other focusable element — the gap blind round 27 found was never Tab order, only the missing
    // ring. `FocusController` owns the native `focus`/`blur`/`keydown` wiring and the ring itself.
    this._focus = new FocusController(this._host.nativeElement, this.Node, this._registry, bridge);

    effect(() => {
      this._registry.Version();
      this._className();
      this._styleOverride();
      this._textStyleOverride();
      this._disabled();
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

  /** Reorder this node within its parent's Children to match DOM document order: just after the last
   *  sibling whose host element precedes ours (`DomReorderTarget`, the one rule Jaui's own `Jiv` directive
   *  reads, so glass/host components and plain jivs order the same way in a shared parent). A no-op when
   *  already in order, the common case, so statically ordered children never post a move op.
   *
   *  Drill Sentences lane JJ2, item 1 (a round 14 blind phone tester: the drill editor's selection bar read
   *  "Add squads · Shape" in one state and "Shape · Add squads" in another). This copy counted the connected
   *  siblings ahead of ours and used the count as an index into Children, which also held siblings whose
   *  element was gone, so a glass button returning from "…" landed short of its slot. */
  /** Moves this node among its canvas siblings to where its host element now stands in the document (Drill Sentences
   *  lane PP1, item 1b). Attach orders a node once; Angular's `@for` then MOVES a kept row's element when its list
   *  reorders, and nothing told the canvas, so a dropped row kept its old slot under the new order. A list that
   *  reorders its own rows calls this on each once the move has rendered (`SortableList`). A no-op in order. */
  SyncDomPosition(): void {
    const parentNode = this.Node.Parent;
    if (parentNode) this._reorderToDomPosition(parentNode);
  }

  /** This component's own host element, the one its bridged pointer events are dispatched on. */
  get HostElement(): HTMLElement { return this._host.nativeElement; }

  private _reorderToDomPosition(parentNode: JivHandle): void {
    const siblings = parentNode.Children;
    const current = siblings.indexOf(this.Node);
    if (current === -1) return;
    const others = siblings.filter((sib) => sib !== this.Node).map((sib) => JAUI_HOST_EL.get(sib));
    const target = DomReorderTarget(this._host.nativeElement, others, current);
    if (target !== null) parentNode.MoveChildToIndex(this.Node, target);
  }

  /** `leaveWith`: style the node keeps as it leaves, applied at once (the host's own effect no longer runs once
   *  it is being destroyed), such as the height a panel was drawn at (`Popover`, Drill Sentences lane KK1, item 6). */
  protected _detachOnDestroy(leaveWith?: Record<string, unknown>): void {
    if (leaveWith) {
      this._styleOverride.set({ ...untracked(() => this._styleOverride()), ...leaveWith });
      this._apply();
    }
    // Per the Presence.md framework-binding contract — and matching the plain
    // Jaui `<jiv>` directive, which was already fixed — ngOnDestroy calls ONLY
    // RequestLeave. The engine's PresenceManager fades the node out (Presence
    // 1→0), then hard-removes it and cleans up its bridge hit handlers +
    // registry slot on the settle callback (~400ms later). Calling Destroy()
    // here too (as this did) enqueued a follow-on 'destroy' op that the worker
    // processed BEFORE the spring could fire — defeating the entire fade, so
    // every Jwift surface (modals, sheets, the camera chrome) popped away
    // instead of dissolving out the way it dissolved in.
    this.Node.RequestLeave();
  }

  private _apply(): void {
    const opts = this._buildOpts(this._className());
    this.Node.Apply(opts);
    // Full Keyboard Access floor: a host is a real Tab stop exactly when its JSS class resolved
    // `Interactive: true` and it isn't `Disabled` — the SAME two facts that already gate a pointer
    // press (`ElementProps.Interactive`, `States.Disabled`) — MINUS a container holding a focusable
    // child of its own (`FocusController.Sync`'s own doc comment: "the children are the stops").
    this._focus.Sync(opts.ElementProps?.Interactive === true, opts.States?.['Disabled'] === true, opts.Style?.['BorderRadius']);
    StampProbeHost(this._host.nativeElement, this.Node.Id, this._className());
  }

  /** Keys the LAST `_buildOpts` actually got from the resolved CLASS's own ChildLayout — read at the
   *  top of this method (below) to tell a stale class value apart from an imperative one, and replaced
   *  at the bottom with this call's own set.
   *
   *  Drill Sentences lane AI1: the field selection capsule's lead pill collapses to
   *  `Width`/`MinWidth`/`MinHeight`: 0px while hidden (`FieldSelectionBarLead_Hidden`) and never grew
   *  back once shown again (`FieldSelectionBarLead`, which states none of the three) — `Node.ChildLayout`
   *  is one proxy-mirrored bag shared by every class apply AND by a subclass's own imperative writes
   *  (`Node.ChildLayout.Left = ...`, SelectionIndicator's RAF tick, Perf.*.ts's pans), so spreading it
   *  wholesale under the new class's bag (the shape this carried since `01466ef8`, "merge live proxy
   *  ChildLayout under the class-resolved bag") could not tell "a class set this and still does" from
   *  "a class set this and no longer does" apart — only the SECOND should revert to the engine default
   *  rather than ride the mirror forward forever. */
  private _lastClassChildLayout = new Set<string>();

  private _buildOpts(className: string): JivApplyOpts {
    const fromClass = this._registry.Resolve(className) ?? null;
    // Layer the per-instance Style overrides OVER the class-resolved bag.
    // Subclasses (e.g. Card setting `Background: Url(...)` from a runtime
    // `[image]` input) call `SetStyleOverride` instead of writing through
    // the JivHandle.Style proxy — direct proxy writes trigger the bare
    // _flush path on the worker side, which only ships the override and
    // resets the rest of core.Style to engine defaults (wiping the JSS
    // class's Width/Height/Padding/etc.).
    // An override lands in the slot its property belongs to, as the JSS parser files it: the worker
    // reads Padding from Layout and Margin/Height from ChildLayout, never from Style.
    const overrides: Record<'Style' | 'Layout' | 'ChildLayout' | 'TextStyle', Record<string, unknown>> =
      { Style: {}, Layout: {}, ChildLayout: {}, TextStyle: {} };
    for (const [key, value] of Object.entries(this._styleOverride())) overrides[SlotFor(key)][key] = value;
    const hasLayout = Object.keys(overrides.Layout).length > 0;
    const hasChildLayout = Object.keys(overrides.ChildLayout).length > 0;
    // Carry forward only the proxy's keys the LAST apply did NOT itself get from a class — an
    // imperative write surviving a class-swap, the one case `01466ef8` meant to cover — never a class
    // key that this resolve simply stopped restating (the carry-everything shape's own bug, above).
    const classChildLayout = fromClass?.ChildLayout as Record<string, unknown> | undefined;
    const nodeChildLayout = this.Node.ChildLayout as unknown as Record<string, unknown>;
    const carriedChildLayout: Record<string, unknown> = {};
    for (const key of Object.keys(nodeChildLayout)) {
      if (!this._lastClassChildLayout.has(key)) carriedChildLayout[key] = nodeChildLayout[key];
    }
    this._lastClassChildLayout = new Set(Object.keys(classChildLayout ?? {}));
    const styleBag = {
      ...fromClass?.Style,
      ...overrides.Style,
    } as Record<string, unknown>;
    // Semantics is mirror-only data (Jaui.Angular SEO projection) — the
    // render engine must never see it.
    delete styleBag['Semantics'];

    // `Overscroll` sets all four edges; an edge authored alongside it wins (parity with the <jiv> directive).
    if ('Overscroll' in styleBag) {
      const v = styleBag['Overscroll'];
      for (const edge of _OVERSCROLL_EDGES) if (!(edge in styleBag)) styleBag[edge] = v;
      delete styleBag['Overscroll'];
    }

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
      Layout:        (fromClass?.Layout || hasLayout)
        ? ({ ...fromClass?.Layout, ...overrides.Layout } as Record<string, unknown>)
        : undefined,
      ChildLayout:   (classChildLayout || hasChildLayout)
        ? ({ ...carriedChildLayout, ...classChildLayout, ...overrides.ChildLayout } as Record<string, unknown>)
        : undefined,
      TextStyle:     (fromClass?.TextStyle || Object.keys(overrides.TextStyle).length > 0 || Object.keys(this._textStyleOverride()).length > 0)
        ? ({ ...fromClass?.TextStyle, ...overrides.TextStyle, ...this._textStyleOverride() } as Record<string, unknown>)
        : undefined,
      // Pseudo-selector rules — both `:Foo` and `:(expr)` from JSS —
      // ride PredicateStyles as one consolidated list. The legacy 10
      // *Style / *TextStyle slot fields were retired; the parser now
      // compiles single-state pseudos to single-atom predicates.
      PredicateStyles:   fromClass?.PredicateStyles   as ReadonlyArray<Record<string, unknown>> | undefined,
      Springs:           fromClass?.Springs           as Record<string, Record<string, unknown>> | undefined,
      ElementProps:      Object.keys(elementProps).length > 0 ? elementProps : undefined,
      Classes:           className.split(/\s+/).filter(Boolean),
      States:            this._disabled() === undefined ? undefined : { Disabled: !!this._disabled() },
    };
  }
}

const _ELEMENT_KEYS = [
  // 'Clip' MUST be here (parity with the <jiv> directive's extraction): without it a
  // JivHost class's `Clip: Hidden` stays in the style bag and never reaches the element,
  // so a rounded glass host (e.g. the drill library panel) silently never clips its content.
  'Overflow', 'Clip', 'Visible', 'Interactive', 'PointerEvents',
  'Cursor', 'UserSelect', 'PointScale', 'PanClaim',
  'Overscroll', 'OverscrollTop', 'OverscrollBottom', 'OverscrollLeft', 'OverscrollRight',
  'OverscrollResistance', 'OverscrollInput',
];
const _OVERSCROLL_EDGES = ['OverscrollTop', 'OverscrollBottom', 'OverscrollLeft', 'OverscrollRight'];

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
