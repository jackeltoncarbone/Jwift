import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewChild,
  afterNextRender,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { GlassDropdown } from '../GlassDropdown/GlassDropdown';
import { GlassDropdownItem, type GlassDropdownItemVariant } from '../GlassDropdown/GlassDropdownItem';
import GlassActionGroupJss from './GlassActionGroup.jss';

/** Single source of truth for both inline cells and dropdown items. Most
 *  fields are optional so the same shape works in both slots. */
export interface GlassAction {
  /** Stable identifier — emitted via ActionClick. */
  Id: string;
  /** JwiftIcons glyph name. Use this for inline cells; menu items can use
   *  Icon, Image, or neither (label-only). */
  Icon?: string;
  /** Image asset name — alternative to Icon for menu items (e.g. provider
   *  logos). Wins over Icon when both are set. */
  Image?: string;
  /** Optional label. Inline cells ignore it; menu items render it. */
  Label?: string;
  /** Inline cell only — highlights the cell with the active background. */
  Active?: boolean;
  /** Suppresses click and dims the cell/item. */
  Disabled?: boolean;
  /** Renders the menu item with the danger color palette. */
  Destructive?: boolean;
  /** Renders a thin divider line in the menu instead of a clickable item.
   *  Inline cells skip dividers entirely. */
  Divider?: boolean;
  /** When set, clicking the action navigates to a sub-page in the dropdown
   *  (see Pages input). Skips the ActionClick emit and keeps the dropdown
   *  open. Works from both inline and menu slots. */
  Page?: string;
  /** Menu item only — when true, click does NOT auto-close the dropdown.
   *  Useful for disabled items or items that toggle inline state. Page
   *  items get this implicitly. */
  KeepOpen?: boolean;
}

/**
 * `<glass-action-group>` — toolbar trailing-cluster pill. Closed state shows
 * a row of cells in a Jwift_GlassDropdown_Closed glass surface; open state
 * expands into a dropdown menu. Cells, left → right:
 *
 *   [inline action 0] [inline action 1] … [ellipsis] [avatar]
 *
 * Avatar and ellipsis-trigger are always present. Inline action count
 * auto-shrinks against the toolbar's available width — actions that don't
 * fit promote into the open dropdown menu before any explicit Menu items.
 *
 *   <glass-action-group
 *     [Actions]="auth.MenuActions()"
 *     [Menu]="extraMenuItems()"
 *     [Pages]="{ providers: auth.ProviderItems() }"
 *     [AvatarUrl]="auth.AvatarUrl()"
 *     (ActionClick)="onAction($event)" />
 *
 * Items render INSIDE this component's template (not consumer-supplied
 * `<ng-template>`s), so Angular DI and Jaui parent attachment Just Work.
 *
 * Auto-shrink reads the ancestor toolbar's solved width on each rAF tick,
 * subtracts the leading-wrapper width + paddings, and divides the slack by
 * 40pt cell + 4pt gap (matching `Jwift_GlassDropdownCell` / `_Closed`
 * geometry). Same approach `<tab-bar>` uses for its expand-flip threshold.
 */
@Component({
  selector: 'glass-action-group',
  standalone: true,
  imports: [
    Jiv, Jext, Jyle,
    Icon,
    GlassDropdown, GlassDropdownItem,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    <glass-dropdown #dd>
      @if (!dd.IsOpen()) {
        @for (action of _InlineActions(); track action.Id) {
          <jiv [class]="_CellClass(action)" (click)="_OnCellClick(action, $event)">
            <icon class="Jwift_GlassActionGlyph" [Name]="action.Icon ?? ''" />
          </jiv>
        }
        <jiv class="Jwift_GlassDropdownCell_Ellipsis" (click)="$event.stopPropagation(); dd.Open()">
          <icon class="Jwift_GlassActionGlyph" Name="ellipsis" />
        </jiv>
        @if (ShowAvatar()) {
          @let url = AvatarUrl();
          <jiv class="Jwift_GlassDropdownCell_Avatar" (click)="_OnAvatarClick($event)">
            @if (url) {
              <jiv class="Jwift_GlassDropdownCellAvatarImage" [image]="url" />
            } @else {
              <icon class="Jwift_GlassActionGlyph" [Name]="AvatarFallbackIcon()" />
            }
          </jiv>
        }
      } @else {
        @let pg = dd.Page();
        @for (item of _OpenItems(pg); track item.Id) {
          @if (item.Divider) {
            <jiv class="Jwift_GlassDropdownDivider" />
          } @else {
            <glass-dropdown-item
              [variant]="_ItemVariant(item)"
              [disabled]="!!item.Disabled"
              [keepOpen]="!!item.KeepOpen || !!item.Page"
              (click)="_OnItemClick(item)">
              @if (item.Image) {
                <jiv class="Jwift_GlassDropdownItemImage" [image]="item.Image" />
              } @else if (item.Icon) {
                <icon [class]="_ItemIconClass(item)" [Name]="item.Icon" />
              }
              @if (item.Label) {
                <jext [class]="_ItemLabelClass(item)" [text]="item.Label" />
              }
            </glass-dropdown-item>
          }
        }
      }
    </glass-dropdown>
  `,
  styles: [':host { display: contents; }'],
})
export class GlassActionGroup implements OnDestroy {
  /** Inline-cell candidates. As many as fit the toolbar render as cells in
   *  the closed pill; the rest promote into the open menu (rendered
   *  before any Menu items). */
  readonly Actions = input<readonly GlassAction[]>([]);

  /** Always-in-the-menu items. Rendered after any auto-promoted overflow.
   *  Use Divider items to group sections. */
  readonly Menu = input<readonly GlassAction[]>([]);

  /** Per-sub-page item lists. Reached when a click target carries Page,
   *  or when a consumer calls `grp.PushPage(id)` directly. */
  readonly Pages = input<Record<string, readonly GlassAction[]>>({});

  /** Avatar image URL. Falsy → falls back to `AvatarFallbackIcon`. */
  readonly AvatarUrl = input<string | null>(null);

  /** JwiftIcons glyph name shown when `AvatarUrl` is null. */
  readonly AvatarFallbackIcon = input<string>('person.fill');

  /** When true (default) clicking the avatar bubbles to the dropdown's
   *  host-click and toggles open. When false, the click is consumed and
   *  only `AvatarClick` fires — useful for chrome (e.g. Drill, Picture)
   *  where the avatar is a navigation shortcut, not a menu trigger.
   *  Ignored when `AvatarPage` is set. */
  readonly AvatarOpensMenu = input<boolean>(true);

  /** When set, clicking the avatar opens the dropdown and pushes this
   *  sub-page id (look it up in `Pages`). Lets the avatar be a distinct
   *  trigger from the ellipsis — e.g. ellipsis opens page actions, avatar
   *  opens an auth menu. Overrides `AvatarOpensMenu`. */
  readonly AvatarPage = input<string | null>(null);

  /** When true (default) the avatar cell renders in the closed pill.
   *  When false, the cell is omitted entirely — for pages that mount a
   *  separate `<nav-avatar />` for the auth menu and only need the action
   *  group for inline cells + ellipsis-triggered overflow menu. */
  readonly ShowAvatar = input<boolean>(true);

  /** Fires when a non-page action is clicked (inline cell or menu item).
   *  Disabled actions and Page-targeted actions are filtered out. */
  readonly ActionClick = output<string>();

  /** Fires when the avatar cell is clicked. Always emits regardless of
   *  `AvatarOpensMenu`. */
  readonly AvatarClick = output<void>();

  protected readonly JssSource = GlassActionGroupJss;

  @ViewChild('dd') private _Dd?: GlassDropdown;

  // Geometry constants — kept in sync with `Jwift_GlassDropdownCell` (40pt
  // square cells) and `Jwift_GlassDropdown_Closed` (4pt padding, 4pt gap).
  private static readonly _CellPt        = 40;
  private static readonly _CellGapPt     =  4;
  private static readonly _ClosedPadPt   =  4;

  private readonly _MaxInlineFit = signal<number>(Number.MAX_SAFE_INTEGER);

  /** One-shot wiring guard for WatchRect on the toolbar / leading / dropdown
   *  ancestor chain. Set on first `_UpdateInlineFit` after mount so the rest
   *  of the rAF loop sees live widths instead of the 0 default. */
  private _fitRectsWired = false;

  /** Cell-eligible subset of Actions — dividers and pure menu items
   *  (e.g. things flagged as Disabled with no Icon) shouldn't appear as
   *  inline cells. */
  private readonly _CellEligible = computed(() =>
    this.Actions().filter(a => !a.Divider && a.Icon)
  );

  protected readonly _InlineActions = computed(() => {
    const all = this._CellEligible();
    const fit = this._MaxInlineFit();
    return all.slice(0, Math.min(all.length, fit));
  });

  /** Actions that didn't fit as inline cells — promoted into the menu. */
  protected readonly _OverflowActions = computed(() => {
    const all = this._CellEligible();
    const fit = this._MaxInlineFit();
    return all.slice(Math.min(all.length, fit));
  });

  /** Items rendered when the dropdown is open. Root page = overflow + Menu;
   *  sub-pages = whatever Pages[id] returns. */
  protected _OpenItems(page: string | null): readonly GlassAction[] {
    if (page === null) return [...this._OverflowActions(), ...this.Menu()];
    return this.Pages()[page] ?? [];
  }

  private _rafId = 0;

  constructor() {
    afterNextRender(() => {
      const tick = (): void => {
        this._UpdateInlineFit();
        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);
    });
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  Open(): void { this._Dd?.Open(); }
  Close(): void { this._Dd?.Close(); }
  Toggle(): void { this._Dd?.Toggle(); }
  PushPage(id: string): void { this._Dd?.PushPage(id); }
  PopPage(): void { this._Dd?.PopPage(); }
  IsOpen(): boolean { return this._Dd?.IsOpen() ?? false; }
  Page(): string | null { return this._Dd?.Page() ?? null; }

  private _UpdateInlineFit(): void {
    // Skip while the dropdown is open. Trailing wrapper collapses (its
    // in-flow content goes Position:Placed) and toolbar's solved widths
    // are mid-transition every frame — the floor() boundary in the fit
    // math then flips between N and N+1 cells, making a phantom extra
    // cell briefly appear in the closed-pill state when the dropdown
    // closes. The visible cell count only matters when closed, so freeze
    // the value while the dropdown is open.
    if (this._Dd?.IsOpen()) return;
    const ddNode = this._Dd?.Node;
    if (!ddNode) return;
    const trailing = ddNode.Parent;
    if (!trailing) return;
    const toolbar = trailing.Parent;
    if (!toolbar) return;

    const leading = toolbar.Children.find(c => c !== trailing);
    // Post-worker-migration JivHandle.Width/Height only reflect live rects
    // when subscribed via WatchRect. Without these, toolbar.Width / leading.Width
    // read 0, slack = 0, and every action gets promoted to the overflow menu.
    // Idempotent; the worker sends a snapshot once per frame after the first
    // call. Wire them lazily here so we always run against the actual ancestor
    // chain after Angular mount.
    if (!this._fitRectsWired) {
      this._fitRectsWired = true;
      toolbar.WatchRect?.(true);
      if (leading) leading.WatchRect?.(true);
      ddNode.WatchRect?.(true);
    }
    const ps = toolbar.ResolveCtx?.PointScale ?? 1;

    const cellPx       = GlassActionGroup._CellPt        * ps;
    const cellGapPx    = GlassActionGroup._CellGapPt     * ps;
    const closedPadPx  = GlassActionGroup._ClosedPadPt   * ps;
    const toolbarPadPx = 10 * ps;

    const innerW   = toolbar.Width - 2 * toolbarPadPx;
    const leadingW = leading?.Width ?? 0;
    const slack    = Math.max(0, innerW - leadingW);

    const reservedCells = this.ShowAvatar() ? 2 : 1; // ellipsis (+ avatar)
    const reservedCellsW =
      2 * closedPadPx
      + reservedCells * cellPx
      + (reservedCells - 1) * cellGapPx;
    const perInline = cellPx + cellGapPx;
    const rawFit = Math.max(0, Math.floor((slack - reservedCellsW) / perInline));
    const currentFit = this._MaxInlineFit();

    // Hysteresis: require slack to clear the boundary by > 8pt before
    // flipping cell count. Without this, sub-pt fluctuations in solved
    // toolbar/leading widths (Jaui re-solves layout on every frame; tiny
    // text-metric or hit-test side effects nudge the floor() boundary)
    // make `rawFit` toggle ±1 frame to frame. The dropdown's Width
    // @Transition then animates between the two cell-count widths, which
    // visibly slides the trailing cluster left, then slowly back right.
    const HYSTERESIS_PT = 8;
    if (rawFit > currentFit) {
      const enterBoundary = (currentFit + 1) * perInline + reservedCellsW;
      if (slack < enterBoundary + HYSTERESIS_PT) return;
    } else if (rawFit < currentFit) {
      const exitBoundary = currentFit * perInline + reservedCellsW;
      if (slack > exitBoundary - HYSTERESIS_PT) return;
    } else {
      return;
    }
    this._MaxInlineFit.set(rawFit);
  }

  protected _CellClass(action: GlassAction): string {
    return action.Active ? 'Jwift_GlassDropdownCell Jwift_GlassDropdownCell_Active' : 'Jwift_GlassDropdownCell';
  }

  protected _ItemVariant(action: GlassAction): GlassDropdownItemVariant {
    return action.Destructive ? 'danger' : 'default';
  }

  protected _ItemIconClass(action: GlassAction): string {
    return action.Destructive ? 'Jwift_GlassDropdownItemIcon_Danger' : 'Jwift_GlassDropdownItemIcon';
  }

  protected _ItemLabelClass(action: GlassAction): string {
    return action.Destructive ? 'Jwift_GlassDropdownItemLabel_Danger' : 'Jwift_GlassDropdownItemLabel';
  }

  protected _OnCellClick(action: GlassAction, event: MouseEvent): void {
    event.stopPropagation();
    this._Dispatch(action);
  }

  protected _OnItemClick(action: GlassAction): void {
    // GlassDropdownItem already stops propagation and handles auto-close;
    // we just need to dispatch the action (or page navigation).
    this._Dispatch(action);
  }

  private _Dispatch(action: GlassAction): void {
    if (action.Disabled) return;
    if (action.Page) {
      this._Dd?.Open();
      this._Dd?.PushPage(action.Page);
      return;
    }
    this.ActionClick.emit(action.Id);
  }

  protected _OnAvatarClick(event: MouseEvent): void {
    this.AvatarClick.emit();
    const page = this.AvatarPage();
    if (page) {
      event.stopPropagation();
      this._Dd?.Open();
      this._Dd?.PushPage(page);
      return;
    }
    if (!this.AvatarOpensMenu()) event.stopPropagation();
  }
}
