import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { Jiv, Jext } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { Icon } from '../Icon/Icon';
import { TabBar } from './TabBar';
import TabBarJss from './TabBar.jss';

/**
 * `<tab-item>` — one item inside a `<tab-bar>`. Takes icon + label;
 * reads its parent `<tab-bar>`'s `selected` + its own projection index
 * to compute its active state (no per-item `[active]` prop needed —
 * single source of truth lives on the TabBar).
 *
 *   <tab-bar [selected]="Selected()">
 *     @for (t of Tabs(); track t.Label; let i = $index) {
 *       <tab-item [icon]="t.Icon" [iconFill]="t.IconFill"
 *                 [label]="t.Label" (click)="Select(i)" />
 *     }
 *   </tab-bar>
 *
 * Layout swaps stacked ↔ expanded based on the TabBar's `Expanded`
 * signal — class-swap logic is private to this slice; consumers never
 * touch class names.
 */
@Component({
  selector: 'tab-item',
  standalone: true,
  imports: [Jext, Icon],
  template: `
    @if (icon()) {
      <icon [class]="IconClass()" [Name]="_active() && iconFill() ? iconFill() : icon()" [color]="AppliedAccent()" />
    }
    <jext [class]="LabelClass()" [text]="label()" [textStyle]="LabelTextStyle()" />
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => TabItem) },
  ],
})
export class TabItem extends JivHost implements OnInit, OnDestroy {
  readonly icon = input<string>('');
  readonly iconFill = input<string>('');
  readonly label = input<string>('');

  // ── Accent (per-item; gated by the bar master) ──────────────────────────
  /** This item's accent colour. Falls back to the bar's default Accent. */
  readonly accent = input<string | undefined>(undefined);
  /** This item opts into accent when it's the SELECTED tab. */
  readonly accentSelected = input<boolean>(false);
  /** This item opts into accent on HOVER (paints once the engine hover signal
   *  is wired; the opt-in is honoured now so settings are complete). */
  readonly accentHover = input<boolean>(false);

  private _parentBar = inject(TabBar);

  private _index = computed(() => this._parentBar.Items().indexOf(this));
  // Use EffectiveSelected (drag-override-aware) so the active glyph +
  // label weight track the pointer during a press-drag gesture, not
  // just after the release commits a new selection.
  readonly _active = computed(() => this._parentBar.EffectiveSelected() === this._index());
  private _expanded = computed(() => this._parentBar.Expanded());

  /** The tab the INDICATOR is physically over (its sprung position), so the accent
   *  travels WITH the pill as it slides — not the cursor's tab (EffectiveSelected,
   *  which jumps ahead of the springing pill = "follows my hover") and not the
   *  committed `selected` (which lags until release). Falls back to `selected`
   *  before the indicator first reports (or if there's no indicator). */
  private _selectedTab = computed(() => {
    const over = this._parentBar.IndicatorOverIndex();
    return (over ?? this._parentBar.selected()) === this._index();
  });

  /** Accent colour to paint on this item's icon+label right now, or undefined to
   *  use the class default. Selected-accent shows when this is the committed
   *  selected tab AND both the bar master AND the item opt into selected-accent.
   *  Colour resolves to the item's own accent, else the bar's default Accent.
   *  (Hover trigger is added once the engine exposes per-node hover.) */
  readonly AppliedAccent = computed<string | undefined>(() => {
    const showSelected = this._selectedTab() && this._parentBar.AccentSelected() && this.accentSelected();
    if (!showSelected) return undefined;
    return this.accent() ?? this._parentBar.Accent();
  });
  readonly LabelTextStyle = computed(() => {
    const c = this.AppliedAccent();
    return c ? { Color: c } : undefined;
  });

  readonly IconClass = computed(() => {
    const a = this._active();
    const e = this._expanded();
    if (e) return a ? 'Jwift_TabIconExpandedActive' : 'Jwift_TabIconExpanded';
    return a ? 'Jwift_TabIconActive' : 'Jwift_TabIcon';
  });

  readonly LabelClass = computed(() => {
    const a = this._active();
    // Label-only item (no icon): the label IS the tab — full reading size regardless of bar width.
    if (!this.icon()) return a ? 'Jwift_TabLabelSoloActive' : 'Jwift_TabLabelSolo';
    const e = this._expanded();
    if (e) return a ? 'Jwift_TabLabelExpandedActive' : 'Jwift_TabLabelExpanded';
    return a ? 'Jwift_TabLabelActive' : 'Jwift_TabLabel';
  });

  constructor() {
    super('TabBar', TabBarJss, 'Jwift_TabItem', () => {
      const a = this._active();
      const e = this._expanded();
      if (e) return a ? 'Jwift_TabItemExpandedActive' : 'Jwift_TabItemExpanded';
      return a ? 'Jwift_TabItemActive' : 'Jwift_TabItem';
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
    // Subscribe to per-frame rect snapshots from the worker so the parent
    // TabBar's drag-gesture hit-test (`_hitIndex`) can read this item's
    // canvas-local rect on main. Without this, n.X/n.Y/n.Width/n.Height
    // stay at zero on main and every hit-test reports -1, so dragging
    // the indicator across tabs never updates the selected index.
    this.Node.WatchRect(true);
  }
  ngOnDestroy(): void {
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }
}
