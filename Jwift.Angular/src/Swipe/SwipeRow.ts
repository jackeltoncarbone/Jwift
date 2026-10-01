import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  booleanAttribute,
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
import { LIST_COMFORT } from '../List/List.Comfort';
import ListJss from '../List/List.jss';
import { SwipeStrip } from './SwipeStrip';
import { SWIPE_GROUP, SwipeController, type SwipeControllerHost } from './SwipeController';
import { RestingOpenWidth, type SwipeAction } from './Swipe.Logic';
import SwipeJss from './Swipe.jss';

/**
 * `<swipe-row>`: a `<list-row>` that can be swiped to reveal leading/trailing actions — `ListRow`
 * itself is untouched; this is a second JivHost wearing the same `Jwift_ListRow` classes plus
 * `PanClaim: Horizontal` when it carries actions. Reuses `List.Comfort`'s uniform-padding effect so a
 * swipeable row sits at the same inset as every other row in its section.
 *
 *   <swipe-row [Trailing]="[{Key:'delete', Label:'Delete', Icon:'trash', Tone:'Danger'}]" (Action)="onAction($event)">
 *     ...row content...
 *   </swipe-row>
 *
 * Lane E must expose the same actions in the row's context menu — the non-drag alternative.
 */
@Component({
  selector: 'swipe-row',
  standalone: true,
  imports: [SwipeStrip],
  template: `
    @if (Trailing().length > 0) {
      <swipe-strip Side="Trailing" [Actions]="Trailing()" [OpenWidth]="_trailingOpenWidth()" [Armed]="_armed()" (Pick)="_fire($event)" />
    }
    @if (Leading().length > 0) {
      <swipe-strip Side="Leading" [Actions]="Leading()" [OpenWidth]="_leadingOpenWidth()" [Armed]="false" (Pick)="_fire($event)" />
    }
    <ng-content />
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: Jiv, useExisting: forwardRef(() => SwipeRow) }],
  host: { '(panclaim)': '_onPanClaim($event)', '(click)': '_onClick($event)', '(wheel)': '_onWheel($event)' },
})
export class SwipeRow extends JivHost implements OnInit, OnDestroy, SwipeControllerHost {
  readonly Trailing = input<readonly SwipeAction[]>([]);
  readonly Leading = input<readonly SwipeAction[]>([]);
  readonly FullSwipe = input(true);
  readonly static = input(false, { transform: booleanAttribute });

  readonly Action = output<string>();

  private readonly _comfort = inject(LIST_COMFORT, { optional: true });
  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _group = inject(SWIPE_GROUP, { optional: true });
  private readonly _jss = inject(JSS_REGISTRY);
  private readonly _styleLoader = inject(JwiftStyleLoader);

  private readonly _tx = signal(0);
  protected readonly _tracking = signal(false);
  protected readonly _armed = signal(false);

  protected readonly _trailingOpenWidth = computed(() => Math.max(0, -this._tx()));
  protected readonly _leadingOpenWidth = computed(() => Math.max(0, this._tx()));

  private readonly _controller = new SwipeController(this, this.Leading(), this.Trailing(), this._group);

  constructor() {
    super('List', ListJss, 'Jwift_ListRow', () => {
      const claims = this.Trailing().length > 0 || this.Leading().length > 0;
      const base = this.static() ? 'Jwift_ListRow_Static' : 'Jwift_ListRow';
      if (!claims) return base;
      // Never spring a property a finger is driving: the Tracking variant drops the
      // @Spring VisualTranslate the resting class carries, swapped back the instant the drag ends.
      return this._tracking() ? `${base} Jwift_SwipeRowClaim_Tracking` : `${base} Jwift_SwipeRowClaim`;
    });
    this._styleLoader.Ensure(this._jss, 'Swipe', SwipeJss);
    effect(() => {
      const c = this._comfort ? this._comfort() : null;
      if (c === null) { this.ClearStyleOverride('Padding'); this.ClearStyleOverride('MinHeight'); }
      else { this.SetStyleOverride({ Padding: `${c}pt`, MinHeight: `${31 + 2 * c}pt` }); }
    });
    effect(() => {
      this.SetStyleOverride({ VisualTranslate: `${this._tx()}px 0` });
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
    this.Node.WatchRect(true);
  }
  ngOnDestroy(): void {
    this._controller.Destroy();
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  // ── SwipeControllerHost ──
  Canvas() { return this._canvasRef; }
  RowWidth(): number { return this.Node.Width; }
  LeadingTotal(): number { return RestingOpenWidth(this.Leading().length); }
  TrailingTotal(): number { return RestingOpenWidth(this.Trailing().length); }
  FullSwipeEnabled(): boolean { return this.FullSwipe() && this.Trailing().length > 0; }
  SetTranslate(tx: number, tracking: boolean): void {
    this._tx.set(tx);
    this._tracking.set(tracking);
  }
  SetArmed(armed: boolean): void { this._armed.set(armed); }
  Fire(key: string): void { this.Action.emit(key); }

  protected _onPanClaim(e: Event): void {
    // JivHost re-dispatches the worker's panclaim hit as a real PointerEvent (`_clonePointerEvent`);
    // 'panclaim' just isn't a DOM event name TypeScript's lib.dom knows, so Angular's template
    // checker can only infer `Event` for it.
    this._controller.OnPanClaim(e as PointerEvent);
  }

  protected _onWheel(e: WheelEvent): void {
    if (this.Trailing().length === 0 && this.Leading().length === 0) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    this._controller.OnWheel(e.deltaX);
  }

  protected _onClick(e: MouseEvent): void {
    if (this._controller.ShouldSwallowClick) { e.stopPropagation(); e.preventDefault(); }
  }

  protected _fire(key: string): void {
    this._controller.Close();
    this.Action.emit(key);
  }
}
