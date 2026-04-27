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
    <icon [class]="IconClass()" [Name]="_active() && iconFill() ? iconFill() : icon()" />
    <jext [class]="LabelClass()" [text]="label()" />
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

  private _parentBar = inject(TabBar);

  private _index = computed(() => this._parentBar.Items().indexOf(this));
  // Use EffectiveSelected (drag-override-aware) so the active glyph +
  // label weight track the pointer during a press-drag gesture, not
  // just after the release commits a new selection.
  readonly _active = computed(() => this._parentBar.EffectiveSelected() === this._index());
  private _expanded = computed(() => this._parentBar.Expanded());

  readonly IconClass = computed(() => {
    const a = this._active();
    const e = this._expanded();
    if (e) return a ? 'Jwift_TabIconExpandedActive' : 'Jwift_TabIconExpanded';
    return a ? 'Jwift_TabIconActive' : 'Jwift_TabIcon';
  });

  readonly LabelClass = computed(() => {
    const a = this._active();
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

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
