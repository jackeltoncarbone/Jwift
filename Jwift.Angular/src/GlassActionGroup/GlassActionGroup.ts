import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Directive,
  OnDestroy,
  TemplateRef,
  ViewChild,
  afterNextRender,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { GlassDropdown } from '../GlassDropdown/GlassDropdown';
import { GlassDropdownItem, type GlassDropdownItemVariant } from '../GlassDropdown/GlassDropdownItem';
import GlassActionGroupJss from './GlassActionGroup.jss';

export interface GlassAction {
  Id: string;
  Icon: string;
  Label?: string;
  Active?: boolean;
  Disabled?: boolean;
  Destructive?: boolean;
}

/** Marks a `<ng-template>` rendered inside the open-state dropdown alongside
 *  (or in place of) the auto-generated overflow items. Use it for sub-pages
 *  or custom items that don't fit the flat GlassAction schema.
 *
 *    <ng-template glassActionGroupMenu>
 *      ...custom open-state content...
 *    </ng-template>
 */
@Directive({ selector: '[glassActionGroupMenu]', standalone: true })
export class GlassActionGroupMenu {
  constructor(public readonly Template: TemplateRef<unknown>) {}
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
 * fit promote into the open dropdown as `<glass-dropdown-item>`s. Same
 * pattern as the legacy DOM `<toolbar-overflow-group>`.
 *
 *   <glass-action-group
 *     [Actions]="auth.MenuActions()"
 *     [AvatarUrl]="auth.AvatarUrl()"
 *     (ActionClick)="onAction($event)">
 *     <ng-template glassActionGroupMenu>…subpage…</ng-template>
 *   </glass-action-group>
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
    NgTemplateOutlet,
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
          <jiv [class]="_CellClass(action)" (click)="_OnInlineClick(action, $event)">
            <icon class="Jwift_GlassActionGlyph" [Name]="action.Icon" />
          </jiv>
        }
        <jiv class="Jwift_GlassDropdownCell_Ellipsis" (click)="$event.stopPropagation(); dd.Open()">
          <icon class="Jwift_GlassActionGlyph" Name="ellipsis" />
        </jiv>
        @let url = AvatarUrl();
        <jiv class="Jwift_GlassDropdownCell_Avatar" (click)="_OnAvatarClick($event)">
          @if (url) {
            <jiv class="Jwift_GlassDropdownCellAvatarImage" [image]="url" />
          } @else {
            <icon class="Jwift_GlassActionGlyph" [Name]="AvatarFallbackIcon()" />
          }
        </jiv>
      } @else {
        @if (!dd.Page()) {
          @for (action of _OverflowActions(); track action.Id) {
            <glass-dropdown-item
              [variant]="_ItemVariant(action)"
              [disabled]="!!action.Disabled"
              (click)="_OnOverflowClick(action)">
              <icon [class]="_ItemIconClass(action)" [Name]="action.Icon" />
              @if (action.Label) {
                <jext [class]="_ItemLabelClass(action)" [text]="action.Label" />
              }
            </glass-dropdown-item>
          }
        }
        @if (_MenuTpl?.Template; as tpl) {
          <ng-container *ngTemplateOutlet="tpl" />
        }
      }
    </glass-dropdown>
  `,
  styles: [':host { display: contents; }'],
})
export class GlassActionGroup implements OnDestroy {
  /** Flat action list. As many as fit the toolbar render as cells in the
   *  closed pill; the rest become items in the open dropdown. */
  readonly Actions = input<readonly GlassAction[]>([]);

  /** Avatar image URL. Falsy → falls back to `AvatarFallbackIcon`. */
  readonly AvatarUrl = input<string | null>(null);

  /** JwiftIcons glyph name shown when `AvatarUrl` is null. */
  readonly AvatarFallbackIcon = input<string>('person.fill');

  /** When true (default) clicking the avatar bubbles to the dropdown's
   *  host-click and toggles open. When false, the click is consumed and
   *  only `AvatarClick` fires — useful for chrome (e.g. Drill, Picture)
   *  where the avatar is a navigation shortcut, not a menu trigger. */
  readonly AvatarOpensMenu = input<boolean>(true);

  /** Fires when any action — inline cell or overflow menu item — is clicked.
   *  Disabled actions are filtered out before emit. */
  readonly ActionClick = output<string>();

  /** Fires when the avatar cell is clicked. Always emits regardless of
   *  `AvatarOpensMenu`; consumers can wire navigation alongside the
   *  default menu toggle, or set `AvatarOpensMenu=false` to suppress
   *  the toggle and use this output as the sole avatar handler. */
  readonly AvatarClick = output<void>();

  protected readonly JssSource = GlassActionGroupJss;

  @ContentChild(GlassActionGroupMenu) protected readonly _MenuTpl?: GlassActionGroupMenu;
  @ViewChild('dd') private _Dd?: GlassDropdown;

  // Geometry constants — kept in sync with `Jwift_GlassDropdownCell` (40pt
  // square cells) and `Jwift_GlassDropdown_Closed` (4pt padding, 4pt gap).
  // If those classes change, update here.
  private static readonly _CellPt        = 40;
  private static readonly _CellGapPt     =  4;
  private static readonly _ClosedPadPt   =  4; // each side
  private static readonly _ReservedCells =  2; // avatar + ellipsis

  /** rAF-polled "how many inline cells fit" — recomputed from the
   *  ancestor toolbar's width minus the leading wrapper minus paddings. */
  private readonly _MaxInlineFit = signal<number>(Number.MAX_SAFE_INTEGER);

  protected readonly _InlineActions = computed(() => {
    const all = this.Actions();
    const fit = this._MaxInlineFit();
    return all.slice(0, Math.min(all.length, fit));
  });

  protected readonly _OverflowActions = computed(() => {
    const all = this.Actions();
    const fit = this._MaxInlineFit();
    return all.slice(Math.min(all.length, fit));
  });

  private _rafId = 0;

  constructor() {
    // Wait for the canvas to mount + first solve so `dd.Node.Parent` and
    // ancestor `.Width` values are populated before we start polling.
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

  /** Forward the dropdown's primary toggle so consumers holding a
   *  `<glass-action-group #grp>` reference can drive open/close
   *  programmatically. */
  Open(): void { this._Dd?.Open(); }
  Close(): void { this._Dd?.Close(); }
  Toggle(): void { this._Dd?.Toggle(); }
  PushPage(id: string): void { this._Dd?.PushPage(id); }
  PopPage(): void { this._Dd?.PopPage(); }
  IsOpen(): boolean { return this._Dd?.IsOpen() ?? false; }
  Page(): string | null { return this._Dd?.Page() ?? null; }

  /** Compute how many inline cells fit alongside avatar + ellipsis.
   *
   *  Walks: dropdown.Node → trailing wrapper → toolbar. Reads toolbar's
   *  outer width, subtracts toolbar padding (`Jwift_Toolbar` Padding: 10pt
   *  each side) + the leading-wrapper width to get the trailing slack.
   *  Slack must cover the closed-pill padding + 2 reserved cells (avatar
   *  + ellipsis) + their gap before any inline cell can fit. */
  private _UpdateInlineFit(): void {
    const ddNode = this._Dd?.Node;
    if (!ddNode) return;
    const trailing = ddNode.Parent;
    if (!trailing) return;
    const toolbar = trailing.Parent;
    if (!toolbar) return;

    const leading = toolbar.Children.find(c => c !== trailing);
    const ps = toolbar.ResolveCtx?.PointScale ?? 1;

    const cellPx       = GlassActionGroup._CellPt        * ps;
    const cellGapPx    = GlassActionGroup._CellGapPt     * ps;
    const closedPadPx  = GlassActionGroup._ClosedPadPt   * ps;
    const toolbarPadPx = 10 * ps;

    // Toolbar outer width includes its own padding. Subtract both sides
    // to get the inner content width available for leading + trailing.
    const innerW   = toolbar.Width - 2 * toolbarPadPx;
    const leadingW = leading?.Width ?? 0;
    const slack    = Math.max(0, innerW - leadingW);

    // Closed pill needs: padding × 2 + reserved cells × cellPx +
    // (reserved-1) cellGap. Each ADDITIONAL inline cell costs cellPx + gap.
    const reservedCellsW =
      2 * closedPadPx
      + GlassActionGroup._ReservedCells * cellPx
      + (GlassActionGroup._ReservedCells - 1) * cellGapPx;
    const perInline = cellPx + cellGapPx;
    const fit = Math.max(0, Math.floor((slack - reservedCellsW) / perInline));

    if (fit !== this._MaxInlineFit()) this._MaxInlineFit.set(fit);
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

  protected _OnInlineClick(action: GlassAction, event: MouseEvent): void {
    event.stopPropagation();
    if (action.Disabled) return;
    this.ActionClick.emit(action.Id);
  }

  protected _OnOverflowClick(action: GlassAction): void {
    if (action.Disabled) return;
    this.ActionClick.emit(action.Id);
  }

  protected _OnAvatarClick(event: MouseEvent): void {
    this.AvatarClick.emit();
    if (!this.AvatarOpensMenu()) event.stopPropagation();
  }
}
