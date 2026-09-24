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
  untracked,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import { JivHandle as JivCore } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import { CanvasPress } from '../Internal/CanvasPress';
import { FlexLiftScale } from '../Internal/FlexLift';
import { TabItem } from './TabItem';
import TabBarJss from './TabBar.jss';

/**
 * `<tab-bar>` — glass-pill horizontal container for `<tab-item>` children.
 *
 *   <jiv class="Dock">
 *     <tab-bar [selected]="Selected()" (selectedChange)="Select($event)" #tb>
 *       <selection-indicator [target]="tb.ActiveNode()" />
 *       @for (t of Tabs(); track t.Label; let i = $index) {
 *         <tab-item [icon]="t.Icon" [iconFill]="t.IconFill" [label]="t.Label" />
 *       }
 *     </tab-bar>
 *     <tab-bar-accessory icon="magnifyingglass" [selected]="SearchActive()" (activate)="Search()" />
 *   </jiv>
 *
 * Owns the tap/drag gesture — listens to pointerdown/move/up on the
 * Jaui canvas, hit-tests the pointer against the TabItem rects, and
 * emits `selectedChange` when the drag lands on a different tab. The
 * SelectionIndicator + TabItem both read `ActiveNode()` / `selected()`
 * (which reflect the drag-in-progress index), so the pill follows the
 * pointer smoothly during a press-and-drag via the existing layout
 * springs.
 *
 * `selected` null means no tab is selected (a trailing accessory owns the selection): every item
 * takes its resting ink and the indicator hides until a tab is selected again.
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
  readonly selected = input<number | null>(0);

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

  /** The bar's pressed swell (1 at rest). The lens is drawn through its lift portal, which takes the bar's model
   *  transform but not the flex's presentation modifier, so it does not swell with the bar (SelectionIndicator). */
  readonly PressSwell = signal(1);

  /** Selected tab's underlying JivCore — drives `<selection-indicator>`. Null when nothing is selected. */
  readonly ActiveNode = computed<JivCore | null>(() => {
    const index = this.EffectiveSelected();
    return index === null ? null : this.Items()[index]?.Node ?? null;
  });

  // The HTML bar condensed (icon stacked over label) at 880px and expanded above it. Matches the
  // `@If (Width < 880)` in TabBar.jss — a bare Width predicate is the VIEWPORT, the same axis
  // window.innerWidth reports, so the two flip together.
  private static readonly _ExpandThreshold = 880;

  private _canvasRef = inject(Jaui, { optional: true });
  private _rafId = 0;
  private readonly _gesture = new CanvasPress();
  // The accessory holds its glass this long after a tap so a quick tap still reads as a press. The bar does
  // not: Apple's lens lets go the moment the finger lifts (back to the pill in about 90 ms).
  static readonly SlideLatchMs = 280;

  constructor() {
    super('TabBar', TabBarJss, 'Jwift_TabBar', () => `Jwift_TabBar ${this.Class()}`.trim());
    // The bar swells while the indicator is engaged, by UIKit's flex lift for its size (FlexLift.ts). It rides
    // IsPressed(), the signal the <selection-indicator> reads, so bar and pill engage and release as one.
    effect(() => {
      if (!this.IsPressed()) { this.ClearStyleOverride('VisualScale'); this.PressSwell.set(1); return; }
      const scale = untracked(() => FlexLiftScale(this.Node.Width, this.Node.Height));
      this.PressSwell.set(scale);
      this.SetStyleOverride({ VisualScale: scale.toFixed(4) });
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
    // Width-based expand flip.
    const tick = (): void => {
      // Expanded beside a wide viewport (the concept's top dock); stacked on a phone.
      const next = (typeof window !== 'undefined' ? window.innerWidth : this.Node.Width) >= TabBar._ExpandThreshold;
      if (next !== this.Expanded()) this.Expanded.set(next);
      // A per-frame width poll has no meaning where there are no frames. Under server rendering
      // the width is evaluated ONCE — so the bar still serializes in its correct stacked/expanded
      // form — and the loop simply never starts. Left unguarded, this threw out of ngOnInit on
      // every route and took the whole navigation's semantics down with it.
      if (typeof requestAnimationFrame === 'undefined') return;
      this._rafId = requestAnimationFrame(tick);
    };
    tick();
    const el = this._canvasRef?.Canvas?.Element;
    if (el) {
      this._gesture.Wire(el, {
        Press: (x, y) => this._press(x, y),
        Move: (x, y) => this._drag(x, y),
        Release: () => this._release(),
        Cancel: () => this._dragIndex.set(null),
      });
    }
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._gesture.Unwire();
    this._detachOnDestroy();
  }

  /** Hit-test against TabItem rects using their post-layout X/Y/W/H
   *  (CSS px in canvas space). Cheaper than walking ScrollManager.
   *  Returns -1 if the pointer is outside every tab's rect. */
  private _hitIndex(clientX: number, clientY: number): number {
    const [x, y] = CanvasPress.ToNode(this._canvasRef?.Canvas, clientX, clientY);
    const items = this.Items();
    for (let i = 0; i < items.length; i++) {
      const n = items[i].Node;
      if (x >= n.X && x < n.X + n.Width && y >= n.Y && y < n.Y + n.Height) return i;
    }
    return -1;
  }

  /** Begin tracking a press. Returns true if the point landed on a tab (the gesture is then ours). */
  private _press(clientX: number, clientY: number): boolean {
    const idx = this._hitIndex(clientX, clientY);
    if (idx < 0) return false;
    this._dragIndex.set(idx);
    return true;
  }

  /** Update the drag-in-progress index as the pointer/finger moves. */
  private _drag(clientX: number, clientY: number): void {
    const idx = this._hitIndex(clientX, clientY);
    if (idx < 0 || idx === this._dragIndex()) return;
    this._dragIndex.set(idx);
  }

  /** Commit the gesture: emit if it landed on a different tab, then let go at once, as Apple's lens does. */
  private _release(): void {
    const finalIdx = this._dragIndex();
    // Emit BEFORE clearing _dragIndex so the consumer's selected() update lands before
    // EffectiveSelected falls back to selected().
    if (finalIdx !== null && finalIdx !== this.selected()) this.selectedChange.emit(finalIdx);
    this._dragIndex.set(null);
  }
}
