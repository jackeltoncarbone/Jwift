import { signal, type Signal } from '@angular/core';
import type { JssRegistry } from 'jaui-angular';
import { JivHandle, type MainBridge } from 'jaui';
import { FocusableBoxStyle } from './FocusableBox';
import { FocusRingGeometryOf, ParsePt } from './FocusRing.Geometry';
import { IsActivationKey, IsEscapeKey } from './Keys';
import FocusRingJss from './FocusRing.jss';

/** Every live `FocusController`, by the host element it owns — lets a newly-focusable child find and
 *  re-check its nearest focusable ANCESTOR (`_resyncAncestorOf`) without either side needing a DI
 *  relationship: a cell deep inside `GlassDropdown`'s projected content has no Angular path back up to
 *  it, but both sides share a host element they can walk the real DOM from. Same shape as this
 *  codebase's own `JAUI_HOST_EL`/`JIV_OF_HOST` (Jaui.Angular's `Jiv.ts`) — a side-table keyed by the
 *  one thing every one of these has: its own real element. */
const _CONTROLLER_OF_HOST = new WeakMap<HTMLElement, FocusController>();

/** Walks up from `host` (exclusive) to the nearest registered `FocusController` and asks it to
 *  re-check its OWN focusability against the fresh DOM — called after `Sync` below so a container
 *  that was a Tab stop before this host became one stops being one, the moment it has reason to
 *  (`Sync`'s own doc comment: "the children are the stops"). A DOM walk toward the root can never
 *  cycle, so this always terminates; whatever it finds bubbles the same call further up on its own. */
const _resyncAncestorOf = (host: HTMLElement): void => {
  let el = host.parentElement;
  while (el) {
    const ancestor = _CONTROLLER_OF_HOST.get(el);
    if (ancestor) { ancestor.Resync(); return; }
    el = el.parentElement;
  }
};

/**
 * Apple's keyboard focus (HIG Full Keyboard Access) for ONE host element + its canvas Node — the one
 * implementation `JivHost` (every "IS a jiv" Jwift component) and `JwiftFocusable` (a directive for a
 * plain `<jiv>` a component template owns directly — a toolbar group's own cells, a title button) both
 * call into, so the native-focus wiring, the box fix and the ring exist in exactly one place no matter
 * which of the two shapes asks for it.
 *
 * `Sync` is the one entry point, called from whichever reactive effect owns this host's state
 * (`JivHost._apply`'s effect, or `JwiftFocusable`'s own) every time its `Interactive`/`Disabled`/
 * `BorderRadius` might have changed; everything else (the native listeners, the ring Jiv) is set up
 * once, in the constructor, and kept for the controller's own lifetime.
 */
export class FocusController {
  private readonly _focusVisible = signal(false);
  /** Read-only outward face of `_focusVisible` — a plain `Signal`, never `WritableSignal`, so a
   *  consumer (`TokenSentence`'s own roving ring, Drill Sentences lane AG2) can react to keyboard-vs-
   *  pointer focus the SAME way this controller itself already tracked it, rather than re-deriving
   *  `host.matches(':focus-visible')` a second time from scratch. */
  readonly FocusVisible: Signal<boolean> = this._focusVisible;
  private _ring: JivHandle | null = null;
  private _lastFocusable = false;
  /** Set by `SuppressRing` (Drill Sentences lane AG2): true while a composite control this host
   *  belongs to (`TokenSentence`, roving Left/Right across its own tokens) is drawing a MORE SPECIFIC
   *  ring of its own — the whole-host ring this class would otherwise show stands down rather than
   *  double-ringing the same focus underneath the token's own. */
  private _ringSuppressed = false;
  /** `Sync`'s own last three arguments — `Resync` (called FROM a descendant becoming focusable, not
   *  from this host's own reactive effect) has no fresh ones of its own to pass, and must re-run the
   *  SAME decision against the fresh DOM rather than guess at stale ones. */
  private _lastArgs: { Interactive: boolean; Disabled: boolean; ControlRadius: unknown } = { Interactive: false, Disabled: false, ControlRadius: null };

  constructor(
    private readonly _host: HTMLElement,
    private readonly _node: JivHandle,
    private readonly _registry: JssRegistry,
    private readonly _bridge: MainBridge,
  ) {
    _CONTROLLER_OF_HOST.set(this._host, this);
    const host = this._host;
    host.addEventListener('focus', () => { this._focusVisible.set(host.matches(':focus-visible')); this._applyRingVisibility(); });
    host.addEventListener('blur', () => { this._focusVisible.set(false); this._applyRingVisibility(); });
    host.addEventListener('keydown', (e: KeyboardEvent) => {
      // Only this element's own keydown — not one bubbled up from a nested REAL focusable (TextInput's
      // own `<jinput>`, say), which already answers Space/Enter/Escape its own way.
      if (e.target !== host) return;
      if (IsActivationKey(e)) {
        e.preventDefault(); // Space must not also page-scroll.
        host.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      } else if (IsEscapeKey(e)) {
        host.blur();
      }
    });
  }

  /**
   * Reconciles this host's Tab-stop-hood against the two facts that already gate a pointer press
   * (`interactive`, `disabled` — the SAME ones `JivApplyOpts.ElementProps.Interactive`/`States.Disabled`
   * carry), MINUS one more: a host that is `Interactive` only to catch a press FOR its children (a
   * toolbar group's own glass pill, `GlassDropdown` wrapping a row of cells) is never itself a Tab
   * stop once any of those children already is one — "container hosts... are not a stop when they
   * hold focusable children; the children are the stops" (coordinator, live check round 2). Checked by
   * real DOM, a plain `querySelector`, never by walking the canvas tree.
   *
   * A reactive effect's OWN dependencies (registry version, a component's `Disabled` input, …) never
   * include "did some unrelated descendant just become focusable", so this host would never otherwise
   * notice a child mounting after it — `_resyncAncestorOf`, called every time this settles, walks up
   * and re-checks whatever container sits above, which is how a late-mounting cell still turns its own
   * container's ring off.
   */
  Sync(interactive: boolean, disabled: boolean, controlRadius: unknown): void {
    this._lastArgs = { Interactive: interactive, Disabled: disabled, ControlRadius: controlRadius };
    this._recompute();
  }

  /** Re-runs `Sync`'s own last decision against the CURRENT DOM — what a descendant calls on its
   *  nearest focusable ancestor once it has just become a Tab stop itself, so that ancestor's own
   *  `hasFocusableChild` check (`_recompute`) sees it. */
  Resync(): void {
    this._recompute();
  }

  private _recompute(): void {
    const { Interactive: interactive, Disabled: disabled, ControlRadius: controlRadius } = this._lastArgs;
    const hasFocusableChild = interactive && !disabled && this._host.querySelector('[tabindex="0"]') !== null;
    const focusable = interactive && !disabled && !hasFocusableChild;
    this._lastFocusable = focusable;
    this._host.tabIndex = focusable ? 0 : -1;
    this._syncBox(focusable);
    this._syncRing(focusable, controlRadius);
    _resyncAncestorOf(this._host);
  }

  private _syncBox(focusable: boolean): void {
    const style = this._host.style;
    const box = FocusableBoxStyle(focusable);
    if (box) {
      style.display = box.display;
      style.position = box.position;
      style.width = box.width;
      style.height = box.height;
      style.overflow = box.overflow;
    } else {
      style.removeProperty('display');
      style.removeProperty('position');
      style.removeProperty('width');
      style.removeProperty('height');
      style.removeProperty('overflow');
    }
  }

  private _syncRing(focusable: boolean, controlRadius: unknown): void {
    if (!focusable) {
      this._ring?.Apply({ ElementProps: { Visible: false } });
      return;
    }
    if (!this._ring) this._ring = this._createRing(controlRadius);
    this._applyRingVisibility();
  }

  private _applyRingVisibility(): void {
    this._ring?.Apply({ ElementProps: { Visible: this._lastFocusable && this._focusVisible() && !this._ringSuppressed } });
  }

  /** Stand this host's own whole-box ring down (`suppressed: true`) while a composite control drawn
   *  from THIS host's own content (`TokenSentence`'s roving Left/Right/Up/Down across its tokens, Drill
   *  Sentences lane AG2 — blind round 31 desktop: ten Tabs never reached the list's own words) shows a
   *  more specific ring of its own; `false` hands the whole-box ring back once nothing more specific is
   *  focused. A no-op for every OTHER `FocusController` consumer, which never calls this at all and so
   *  never suppresses its own ring. */
  SuppressRing(suppressed: boolean): void {
    this._ringSuppressed = suppressed;
    this._applyRingVisibility();
  }

  /** Allocates the ring Jiv: a bordered, hit-less child that tracks this host's own rect via
   *  `Position: Attach`/`AttachMode: Fill` (Jaui's anchor-positioning) at a NEGATIVE inset, which turns
   *  the normally-inward "fill the target minus the inset" math outward instead; `FocusRingGeometryOf`
   *  works out that inset and the concentric radius together (`FocusRing.Geometry.ts`). Hidden on
   *  creation — `_syncRing` shows it the moment this host is both focusable and actually focus-visible. */
  private _createRing(controlRadius: unknown): JivHandle {
    const bridge = this._bridge;
    const ring = new JivHandle(bridge, bridge.AllocateId());
    const resolved = this._registry.Resolve('Jwift_FocusRing');
    const geometry = FocusRingGeometryOf(ParsePt(controlRadius));
    bridge.Enqueue({
      K: 'create',
      Id: ring.Id,
      Opts: {
        Style: {
          ...resolved?.Style,
          BorderRadius: `${geometry.RadiusPt}pt`,
        } as Record<string, unknown>,
        ChildLayout: {
          Position: 'Attach',
          AttachTo: this._node.Id,
          AttachMode: 'Fill',
          AttachInset: `${geometry.AttachInsetPt}pt`,
        },
        ElementProps: { Visible: false, Interactive: false, PointerEvents: 'None' },
        Classes: ['Jwift_FocusRing'],
      },
    });
    this._node.AddChild(ring);
    return ring;
  }
}

export { FocusRingJss };
