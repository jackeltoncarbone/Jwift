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
import { Jiv as JivCore } from 'jaui';
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

  /** Selected tab's underlying JivCore — drives `<selection-indicator>`. */
  readonly ActiveNode = computed<JivCore | null>(() => {
    const items = this.Items();
    return items[this.EffectiveSelected()]?.Node ?? null;
  });

  private static readonly _ExpandThreshold = 560;

  private _canvasRef = inject(Jaui, { optional: true });
  private _rafId = 0;
  private _pointerId: number | null = null;
  private _unbind: (() => void) | null = null;

  constructor() {
    super('TabBar', TabBarJss, 'Jwift_TabBar', () => 'Jwift_TabBar');
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

  private _wireDragGesture(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;

    const toCanvasPoint = (clientX: number, clientY: number): [number, number] => {
      const rect = el.getBoundingClientRect();
      return [clientX - rect.left, clientY - rect.top];
    };

    const onDown = (e: PointerEvent): void => {
      const [x, y] = toCanvasPoint(e.clientX, e.clientY);
      const idx = this._hitIndex(x, y);
      if (idx < 0) return;
      this._pointerId = e.pointerId;
      this._dragIndex.set(idx);
      // Optimistic capture so pointermove reaches us even if the pointer
      // slips outside the canvas — we re-hit-test each move and clamp.
      try { el.setPointerCapture(e.pointerId); } catch {}
    };

    const onMove = (e: PointerEvent): void => {
      if (this._pointerId !== e.pointerId) return;
      const [x, y] = toCanvasPoint(e.clientX, e.clientY);
      const idx = this._hitIndex(x, y);
      if (idx < 0 || idx === this._dragIndex()) return;
      this._dragIndex.set(idx);
    };

    const onUp = (e: PointerEvent): void => {
      if (this._pointerId !== e.pointerId) return;
      const finalIdx = this._dragIndex();
      this._pointerId = null;
      this._dragIndex.set(null);
      try { el.releasePointerCapture(e.pointerId); } catch {}
      if (finalIdx !== null && finalIdx !== this.selected()) {
        this.selectedChange.emit(finalIdx);
      }
    };

    const onCancel = (e: PointerEvent): void => {
      if (this._pointerId !== e.pointerId) return;
      this._pointerId = null;
      this._dragIndex.set(null);
      try { el.releasePointerCapture(e.pointerId); } catch {}
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    this._unbind = () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
    };
  }
}
