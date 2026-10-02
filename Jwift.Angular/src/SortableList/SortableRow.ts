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
  output,
  signal,
} from '@angular/core';
import { Jaui, Jiv, JSS_REGISTRY } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';
import PaperJss from '../Paper/Paper.jss';
import { SwipeStrip } from '../Swipe/SwipeStrip';
import { SWIPE_GROUP, SwipeController, type SwipeControllerHost } from '../Swipe/SwipeController';
import { RestingOpenWidth, type SwipeAction } from '../Swipe/Swipe.Logic';
import { SORTABLE_LIST, type SortableEntryHandle } from './SortableList';
import { SortableSection } from './SortableSection';
import SortableListJss from './SortableList.jss';

/**
 * `<sortable-row>`: one row of a `<sortable-list>` — long-press to lift and drag (the list owns the
 * gesture; this component only registers and carries the visual states), swipeable the same way
 * `swipe-row` is (the SAME `SwipeController`).
 */
@Component({
  selector: 'sortable-row',
  standalone: true,
  imports: [SwipeStrip],
  template: `
    @if (Trailing().length > 0 && _trailingOpenWidth() > 0) {
      <swipe-strip Side="Trailing" [Actions]="Trailing()" [OpenWidth]="_trailingOpenWidth()" [Armed]="_armed()" (Pick)="_fire($event)" />
    }
    @if (Leading().length > 0 && _leadingOpenWidth() > 0) {
      <swipe-strip Side="Leading" [Actions]="Leading()" [OpenWidth]="_leadingOpenWidth()" [Armed]="false" (Pick)="_fire($event)" />
    }
    <ng-content />
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: Jiv, useExisting: forwardRef(() => SortableRow) }],
  host: { '(panclaim)': '_onPanClaim($event)', '(click)': '_onClick($event)' },
})
export class SortableRow extends JivHost implements OnInit, OnDestroy, SortableEntryHandle {
  readonly Key = input.required<string>();
  readonly Selected = input(false);
  readonly Trailing = input<readonly SwipeAction[]>([]);
  readonly Leading = input<readonly SwipeAction[]>([]);
  readonly FullSwipe = input(true);
  readonly Label = input('');

  readonly Action = output<string>();

  private readonly _list = inject(SORTABLE_LIST, { optional: true });
  private readonly _section = inject(SortableSection, { optional: true });
  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _swipeGroup = inject(SWIPE_GROUP, { optional: true });
  private readonly _jss = inject(JSS_REGISTRY);
  private readonly _styleLoader = inject(JwiftStyleLoader);

  readonly Id = computed(() => this.Key());
  readonly Kind = 'Row' as const;
  get SectionId(): string | null { return this._section?.Key() ?? null; }

  private readonly _lifted = signal(false);
  private readonly _tracking = signal(false);
  private readonly _tx = signal(0);
  private readonly _shiftY = signal<number | null>(null);
  protected readonly _armed = signal(false);

  /** `VisualTranslate` is one property, and the swipe (X) and the drag-reorder shift (Y) a sibling's
   *  drag applies are temporally exclusive but still share it — combined here so neither write ever
   *  clobbers the other's axis. */
  private readonly _translate = computed(() => `${this._tx()}px ${this._shiftY() ?? 0}px`);

  protected readonly _trailingOpenWidth = computed(() => Math.max(0, -this._tx()));
  protected readonly _leadingOpenWidth = computed(() => Math.max(0, this._tx()));

  private readonly _controller = new SwipeController(
    <SwipeControllerHost>{
      Canvas: () => this._canvasRef,
      Node: this.Node,
      RowWidth: () => this.Node.Width,
      LeadingTotal: () => RestingOpenWidth(this.Leading().length),
      TrailingTotal: () => RestingOpenWidth(this.Trailing().length),
      FullSwipeEnabled: () => this.FullSwipe() && this.Trailing().length > 0,
      SetTranslate: (tx, tracking) => {
        this._tx.set(tx);
        this._tracking.set(tracking);
      },
      SetArmed: (a) => this._armed.set(a),
      Fire: (key) => this.Action.emit(key),
    },
    this.Leading(), this.Trailing(), this._swipeGroup,
  );

  constructor() {
    super('SortableList', SortableListJss, 'Jwift_SortableRow', () => {
      const parts = ['Jwift_SortableRow'];
      if (this._section) parts.push('Jwift_SortableRow_InSection');
      if (this.Selected()) parts.push('Jwift_SortableRow_Selected');
      if (this._lifted()) parts.push('Jwift_SortableRow_Lifted', 'Jwift_PaperSurface', 'Jwift_SortableEntry_Tracking');
      else parts.push(this._tracking() ? 'Jwift_SortableEntry_Tracking' : 'Jwift_SortableEntry_Shift');
      return parts.join(' ');
    });
    this._styleLoader.Ensure(this._jss, 'Paper', PaperJss);
    effect(() => this.SetStyleOverride({ VisualTranslate: this._translate() }));
    const list = this._list;
    // Squircle, never a circular round — Jiv's own corner shape, the same convention Paper (this row's
    // own loaded material) and every other thick house surface states explicitly rather than leaves to
    // whatever a plain rounded rect defaults to. Live feedback: a selected row's own GoldWash had square
    // corners; EffectiveRadius alone was not the whole gap.
    if (list) effect(() => this.SetStyleOverride({ BorderRadius: `${list.EffectiveRadius()}pt`, CornerShape: 'Squircle' }));
  }

  ngOnInit(): void {
    this._attachOnInit();
    this.Node.WatchRect(true);
    this._list?.RegisterEntry(this);
  }
  ngOnDestroy(): void {
    this._controller.Destroy();
    this._list?.UnregisterEntry(this);
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  // ── SortableEntryHandle ── (driven by the LIST during a drag) ──
  SetShift(y: number | null, tracking: boolean): void {
    this._tracking.set(tracking);
    this._shiftY.set(y);
  }
  SetLifted(lifted: boolean): void { this._lifted.set(lifted); }

  protected _onPanClaim(e: Event): void { this._controller.OnPanClaim(e as PointerEvent); }
  protected _onClick(e: MouseEvent): void {
    if (this._controller.ShouldSwallowClick) { e.stopPropagation(); e.preventDefault(); }
  }
  protected _fire(key: string): void {
    this._controller.Close();
    this.Action.emit(key);
  }
}
