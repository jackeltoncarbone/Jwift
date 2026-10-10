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
  untracked,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { SwipeStrip } from '../Swipe/SwipeStrip';
import { SWIPE_GROUP, SwipeController, type SwipeControllerHost } from '../Swipe/SwipeController';
import { RestingOpenWidth, type SwipeAction } from '../Swipe/Swipe.Logic';
import { SORTABLE_ENTRY, SORTABLE_LIST, type SortableEntryHandle } from './SortableList';
import { SortableSection } from './SortableSection';
import { LiftGeometry } from './Sortable.Logic';
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
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => SortableRow) },
    { provide: SORTABLE_ENTRY, useExisting: forwardRef(() => SortableRow) },
  ],
  host: { '(panclaim)': '_onPanClaim($event)', '(click)': '_onClick($event)' },
})
export class SortableRow extends JivHost implements OnInit, OnDestroy, SortableEntryHandle {
  readonly Key = input.required<string>();
  readonly Selected = input(false);
  /** This row stands in a pick that rides several rows at once, but is not itself the current row (a
   *  caller's own distinction -- see its own doc comment) -- wears the quieter `Jwift_SortableRow_Picked`
   *  (half `Selected`'s own fill) instead, never both: `Selected` wins outright when a row is both (the
   *  constructor's own class list only ever pushes one of the two). Drill Sentences lane AC3, round 28
   *  item 1: a field pick used to paint every row it rode with the SAME fill `Selected` wears, so two rows
   *  read as one competing "you are here" (a blind desktop tester named it a stuck hover). */
  readonly Picked = input(false);
  /** True for one tick right after an edit commits, to wear the quiet edit pulse (Jwift.Glass.jss, JwiftEditPulse)
   *  and fade -- the caller flips it back to `false` itself; this input only decides whether the row wears the
   *  pulse class, not how long the flash lasts (that is the class's own `@Transition` duration). */
  readonly Edited = input(false);
  readonly Trailing = input<readonly SwipeAction[]>([]);
  readonly Leading = input<readonly SwipeAction[]>([]);
  readonly FullSwipe = input(true);
  readonly Label = input('');
  /** Overrides `Jwift_SortableRow`'s own class `Padding` (11pt 12pt) for this one row — Jack, live
   *  (round 12): the drill list's own phrase-grouping row wraps a whole phrase (its header AND its own
   *  nested line list), not one row's worth of content, so the class's own content inset would apply
   *  TWICE once nested (compounding into the 44px/58px indents Jack measured) -- EditorList.ts's own
   *  phrase-grouping `<sortable-row>` passes `'0pt'` here, leaving the real content inset to whichever
   *  row actually carries visible text. Unset (the default), every row keeps the class's own padding. */
  readonly Padding = input<string | null>(null);

  readonly Action = output<string>();

  private readonly _list = inject(SORTABLE_LIST, { optional: true });
  private readonly _section = inject(SortableSection, { optional: true });
  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _swipeGroup = inject(SWIPE_GROUP, { optional: true });

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
      // Selected wins outright over Picked -- a row that is both the current one AND riding a pick wears
      // the one, stronger "you are here" fill, never both stacked (Picked's own doc comment).
      if (this.Selected()) parts.push('Jwift_SortableRow_Selected');
      else if (this.Picked()) parts.push('Jwift_SortableRow_Picked');
      // After Selected, so a line edited while selected still flashes the pulse on top of the quiet selection fill.
      if (this.Edited()) parts.push('Jwift_SortableRow_EditPulse');
      // Drill Sentences lane PP1, item 1a (a round 20 blind phone tester's lift hid every other row): the lifted row
      // wore `Jwift_PaperSurface` for its material, and that class is a backdrop panel, placed at its parent's
      // top-left at 100% of its size, so the row left the flow and covered the whole list. The lifted class carries
      // the paper material itself, in the row's own slot.
      if (this._lifted()) parts.push('Jwift_SortableRow_Lifted', 'Jwift_SortableEntry_Tracking');
      else parts.push(this._tracking() ? 'Jwift_SortableEntry_Tracking' : 'Jwift_SortableEntry_Shift');
      return parts.join(' ');
    });
    effect(() => this.SetStyleOverride({ VisualTranslate: this._translate() }));
    const list = this._list;
    // Squircle, never a circular round — Jiv's own corner shape, the same convention Paper (whose material
    // this row wears while lifted) and every other thick house surface states explicitly rather than leaves to
    // whatever a plain rounded rect defaults to. Live feedback: a selected row's own GoldWash had square
    // corners; EffectiveRadius alone was not the whole gap.
    // Drill Sentences lane SH1: lifted, the row grows a fixed 4pt a side and its corner with it (`LiftGeometry`), so it stays
    // in its column and concentric with the panel it was concentric with at rest; the width is read as the lift begins.
    if (list) effect(() => {
      const radius = list.EffectiveRadius();
      if (this._lifted()) {
        const ps = untracked(() => this.Node.ResolveCtx?.PointScale ?? 1);
        const lift = LiftGeometry(untracked(() => this.Node.Width) / ps, radius);
        this.SetStyleOverride({ BorderRadius: `${lift.Radius}pt`, CornerShape: 'Squircle', VisualScale: `${lift.Scale}` });
      } else {
        this.SetStyleOverride({ BorderRadius: `${radius}pt`, CornerShape: 'Squircle' });
        this.ClearStyleOverride('VisualScale');
      }
    });
    effect(() => {
      const padding = this.Padding();
      if (padding !== null) this.SetStyleOverride({ Padding: padding });
      else this.ClearStyleOverride('Padding');
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
    this.Node.WatchRect(true);
    this._list?.RegisterEntry(this);
  }
  /** Drill Sentences lane R35, item 1 (round 34 blind desktop: after Move together a donor row stood as an empty card
   *  holding only its "…", its words already gone): a row leaves as one unit, its card and its "…" in the frame its
   *  words go (`leaveWith`'s Opacity 0, which SortableList.jss's own 0ms states at once), and the rows below spring up
   *  into the gap (SortableList.jss's own comment on why AG1b's `Height: 0px` never moved them). */
  ngOnDestroy(): void {
    this._controller.Destroy();
    this._list?.UnregisterEntry(this);
    this.Node.WatchRect(false);
    this._detachOnDestroy({ Opacity: '0' });
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
