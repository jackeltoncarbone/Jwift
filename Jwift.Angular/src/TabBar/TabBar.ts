import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import { JivHandle as JivCore } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import { TabItem } from './TabItem';
import TabBarJss from './TabBar.jss';

/**
 * `<tab-bar>` — glass-pill horizontal container for `<tab-item>` children.
 *
 *   <tab-bar [selected]="Selected()" (selectedChange)="Select($event)" #tb>
 *     <selection-indicator [target]="tb.ActiveNode()" />
 *     @for (t of Tabs(); track t.Label; let i = $index) {
 *       <tab-item [icon]="t.Icon" [iconFill]="t.IconFill" [label]="t.Label" />
 *     }
 *   </tab-bar>
 *
 * Owns the tap/drag gesture — listens to pointerdown/move/up on the
 * Jaui canvas, hit-tests the pointer against the TabItem rects, and
 * emits `selectedChange` when the drag lands on a different tab. The
 * SelectionIndicator + TabItem both read `ActiveNode()` / `selected()`
 * (which reflect the drag-in-progress index), so the pill follows the
 * pointer smoothly during a press-and-drag via the existing layout
 * springs.
 */
@Component({
  selector: 'tab-bar',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => TabBar) },
  ],
})
export class TabBar extends JivHost implements OnInit, OnDestroy {
  readonly selected = input<number>(0);

  // ── Accent settings (master) ──────────────────────────────────────────────
  // The bar is the GATE: each item carries its own accent + opt-ins regardless,
  // but they only paint when the bar allows that category through. Effective per
  // item: selected-accent ⇔ bar.AccentSelected && item.accentSelected; colour ⇔
  // item.accent ?? bar.Accent.
  /** Default accent colour for items that don't set their own. */
  readonly Accent = input<string | undefined>(undefined);
  /** Master gate: allow per-item SELECTED-accent through. */
  readonly AccentSelected = input<boolean>(false);
  /** Master gate: allow per-item HOVER-accent through (hover wiring lands with
   *  the engine hover-exposure; the gate is here so settings are complete). */
  readonly AccentHover = input<boolean>(false);

  /** Extra JSS class(es) merged AFTER Jwift_TabBar — consumer-side sizing for non-nav uses (a
   *  settings segmented bar sets Width/Height here). Resolve merges left-to-right, consumer wins. */
  readonly Class = input<string>('');

  /** Fires when a tap or drag lands on a different tab. Pair with
   *  `[selected]` for controlled use. Consumers typically drive routing
   *  from this output; the input syncs back from the resulting URL. */
  readonly selectedChange = output<number>();

  /** True when the tab bar is wide enough to lay items out as a row
   *  (icon beside label). Narrow = stacked. */
  readonly Expanded = signal(false);

  /** TabItem children in projection order. */
  readonly Items = contentChildren(TabItem);

  /** Drag-in-progress index. `null` when no drag. While non-null it
   *  overrides the `selected` input so the indicator + active-state
   *  track the pointer before release. */
  private _dragIndex = signal<number | null>(null);

  /** Effective selection — drag wins over input while dragging. */
  readonly EffectiveSelected = computed(() => this._dragIndex() ?? this.selected());

  /** True while a drag gesture is in progress. Drives the
   *  `<selection-indicator>`'s pressed/glass state (worker mode no longer
   *  syncs `JivHandle.Active` to main, so the indicator can't observe
   *  press state by reading the target's Active flag — TabBar exposes its
   *  authoritative drag flag here instead). */
  readonly IsPressed = computed(() => this._dragIndex() !== null);

  /** Selected tab's underlying JivCore — drives `<selection-indicator>`. */
  readonly ActiveNode = computed<JivCore | null>(() => {
    const items = this.Items();
    return items[this.EffectiveSelected()]?.Node ?? null;
  });

  /** Which tab the indicator (pill) is PHYSICALLY over right now — its sprung
   *  position, reported each frame by <selection-indicator>. `null` until first
   *  report (consumers fall back to `selected`). Used by accent so the accent
   *  travels WITH the pill (the tab it's over), not the cursor's tab (which jumps
   *  ahead of the springing pill) nor the committed selection (which lags). */
  readonly IndicatorOverIndex = signal<number | null>(null);

  /** Called by <selection-indicator> each frame with the pill's sprung centre
   *  (canvas space). Hit-tests it to a tab index; only writes on a boundary
   *  cross so it doesn't churn the signal every frame. */
  ReportIndicatorCenter(centerX: number, centerY: number): void {
    const idx = this._hitIndex(centerX, centerY);
    const next = idx >= 0 ? idx : null;
    if (next !== null && next !== this.IndicatorOverIndex()) this.IndicatorOverIndex.set(next);
  }

  private static readonly _ExpandThreshold = 560;

  private _canvasRef = inject(Jaui, { optional: true });
  private _rafId = 0;
  /** The id of the pointer/finger currently driving the gesture — a PointerEvent `pointerId` for
   *  mouse/pen, or a Touch `identifier` for touch. `null` when idle. */
  private _activePointer: number | null = null;
  /** Whether the active gesture came in via the touch-event path (so the pointer-event handlers ignore
   *  it, and vice-versa). */
  private _activeIsTouch = false;
  private _unbind: (() => void) | null = null;
  private _pressLatchTimer: ReturnType<typeof setTimeout> | null = null;
  // Hold the press latch through the indicator's slide-to-new-tab.
  // SelectionIndicator.jss @Transition X/Y/Width/Height = 260ms; we cover
  // that plus the press-prop springs (200-280ms).
  private static readonly _SlideLatchMs = 280;

  constructor() {
    super('TabBar', TabBarJss, 'Jwift_TabBar', () => `Jwift_TabBar ${this.Class()}`.trim());
    // Keep TabItem's view of the active index in sync while dragging so
    // icon-swap (active glyph vs default glyph) follows the pointer.
    // Items re-read `selected()` via our EffectiveSelected override —
    // bounded via the computed above, not a direct signal.
    effect(() => { this._dragIndex(); this.selected(); });
  }

  ngOnInit(): void {
    this._attachOnInit();
    // Width-based expand flip.
    const tick = (): void => {
      const next = this.Node.Width > TabBar._ExpandThreshold;
      if (next !== this.Expanded()) this.Expanded.set(next);
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
    this._wireDragGesture();
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._pressLatchTimer) clearTimeout(this._pressLatchTimer);
    this._unbind?.();
    this._detachOnDestroy();
  }

  /** Hit-test against TabItem rects using their post-layout X/Y/W/H
   *  (CSS px in canvas space). Cheaper than walking ScrollManager.
   *  Returns -1 if the pointer is outside every tab's rect. */
  private _hitIndex(canvasX: number, canvasY: number): number {
    const items = this.Items();
    for (let i = 0; i < items.length; i++) {
      const n = items[i].Node;
      if (canvasX >= n.X && canvasX < n.X + n.Width
          && canvasY >= n.Y && canvasY < n.Y + n.Height) return i;
    }
    return -1;
  }

  // ── Gesture core (input-source-agnostic) ──────────────────────────
  // Pointer → node space (CSS px, canvas-origin) via the canvas's single source of truth, matching the
  // CSS-px rects the worker emits for each TabItem. See CanvasProxy.ClientToNodePoint.
  private _toNode(clientX: number, clientY: number): [number, number] {
    return this._canvasRef?.Canvas?.ClientToNodePoint(clientX, clientY) ?? [clientX, clientY];
  }

  /** Begin tracking a press at a client point. `id` is a pointerId (mouse/pen) or a touch identifier.
   *  Returns true if the point landed on a tab (so the caller can capture the pointer). */
  private _press(clientX: number, clientY: number, id: number, isTouch: boolean): boolean {
    const [x, y] = this._toNode(clientX, clientY);
    const idx = this._hitIndex(x, y);
    if (idx < 0) return false;
    // Cancel any pending press-latch release from a previous gesture so a fresh tap takes over cleanly
    // instead of being cleared mid-press.
    if (this._pressLatchTimer) {
      clearTimeout(this._pressLatchTimer);
      this._pressLatchTimer = null;
    }
    this._activePointer = id;
    this._activeIsTouch = isTouch;
    this._dragIndex.set(idx);
    return true;
  }

  /** Update the drag-in-progress index as the pointer/finger moves. */
  private _drag(clientX: number, clientY: number): void {
    const [x, y] = this._toNode(clientX, clientY);
    const idx = this._hitIndex(x, y);
    if (idx < 0 || idx === this._dragIndex()) return;
    this._dragIndex.set(idx);
  }

  /** Commit the gesture: emit if it landed on a different tab, then release with the press latch. */
  private _release(): void {
    const finalIdx = this._dragIndex();
    this._activePointer = null;
    if (finalIdx !== null && finalIdx !== this.selected()) {
      // Emit BEFORE clearing _dragIndex so the consumer's selected() update lands before
      // EffectiveSelected falls back to selected().
      this.selectedChange.emit(finalIdx);
      // Keep IsPressed latched through the slide-to-new-tab animation so the indicator glass stays
      // engaged while the pill travels, then releases at the new position. Without this latch, a tap
      // (~50ms) is too short for the press spring to reach a visible glass state and the slide reads
      // as a flat pill moving.
      this._pressLatchTimer = setTimeout(() => {
        this._pressLatchTimer = null;
        if (this._activePointer === null) this._dragIndex.set(null);
      }, TabBar._SlideLatchMs);
    } else {
      this._dragIndex.set(null);
    }
  }

  private _wireDragGesture(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;

    // ── Mouse / pen — real PointerEvents fire normally. We ignore touch-type pointers here because, in
    // Jaui's worker-mode input bridge, the canvas `touchstart` handler calls preventDefault(), which
    // suppresses the browser's synthesis of PointerEvents for touches (see Bridge.Main.ts). Touch is
    // handled via the touch-event path below — without it EVERY tab bar is dead on touch devices.
    const onDown = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') return;
      if (this._press(e.clientX, e.clientY, e.pointerId, false)) {
        // Optimistic capture so pointermove reaches us even if the pointer slips outside the canvas —
        // we re-hit-test each move and clamp.
        try { el.setPointerCapture(e.pointerId); } catch {}
      }
    };
    const onMove = (e: PointerEvent): void => {
      if (this._activeIsTouch || this._activePointer !== e.pointerId) return;
      this._drag(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent): void => {
      if (this._activeIsTouch || this._activePointer !== e.pointerId) return;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      this._release();
    };
    const onCancel = (e: PointerEvent): void => {
      if (this._activeIsTouch || this._activePointer !== e.pointerId) return;
      this._activePointer = null;
      this._dragIndex.set(null);
      try { el.releasePointerCapture(e.pointerId); } catch {}
    };

    // ── Touch — the only path that reaches us on touch devices (pointer events are suppressed; see
    // above). Mirrors Jaui's own bridge: read clientX/Y straight off the Touch. Passive (we never
    // preventDefault — Jaui's touchstart handler already does, and `touch-action: none` kills scroll).
    const activeTouch = (e: TouchEvent): Touch | undefined => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this._activePointer) return t;
      }
      return undefined;
    };
    const onTouchStart = (e: TouchEvent): void => {
      if (this._activePointer !== null) return; // already tracking a finger
      const t = e.changedTouches[0];
      if (t) this._press(t.clientX, t.clientY, t.identifier, true);
    };
    const onTouchMove = (e: TouchEvent): void => {
      const t = this._activeIsTouch ? activeTouch(e) : undefined;
      if (t) this._drag(t.clientX, t.clientY);
    };
    const onTouchEnd = (e: TouchEvent): void => {
      if (this._activeIsTouch && activeTouch(e)) this._release();
    };
    const onTouchCancel = (e: TouchEvent): void => {
      if (this._activeIsTouch && activeTouch(e)) {
        this._activePointer = null;
        this._dragIndex.set(null);
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    this._unbind = () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }
}
