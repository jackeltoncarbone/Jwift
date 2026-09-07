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
import { type ChildLayout } from 'jaui';
import { Icon } from '../Icon/Icon';
import { GlassActionGroup, type GlassAction } from '../GlassActionGroup/GlassActionGroup';
import { GlassDropdown } from '../GlassDropdown/GlassDropdown';
import { GlassDropdownItem, type GlassDropdownItemVariant } from '../GlassDropdown/GlassDropdownItem';
import { JwiftSpinner } from '../Spinner/JwiftSpinner';
import GlassActionBarJss from './GlassActionBar.jss';

/**
 * One collapsing button group in the toolbar trailing cluster. Renders as its
 * own glass pill; sheds its cells (by `CollapseUnit`) into the bar's single
 * sink menu when the toolbar runs out of width, in `Priority` order across all
 * groups (lowest folds first).
 */
export interface ActionGroup {
  /** Stable identifier. */
  Id: string;
  /** Section header shown above this group's items when they fold into the
   *  sink menu. Omit for an unlabelled section. */
  Label?: string;
  /** The group's cells, left → right. Uses the same `GlassAction` shape as the
   *  single-pill primitive; only icon-bearing entries render as cells. */
  Actions: readonly GlassAction[];
  /** Lower folds FIRST. The sink is implicitly above every group. */
  Priority: number;
  /** How the group sheds: all-at-once (default) or one cell at a time. */
  CollapseUnit?: 'WholeGroup' | 'PerItem';
  /** Where shed cells go: a labelled sink-menu section (default) or nowhere. */
  CollapsePolicy?: 'ToMenu' | 'Hide';
  /** Sub-page row lists for this group's OWN expandable dropdown, keyed by the
   *  `Page` id a cell carries. A cell with `Page: 'warnings'` opens this pill's
   *  dropdown in place (same glass/animation as the sink) and shows
   *  `Pages['warnings']`. Declaring this makes the pill expandable; omit it for
   *  a plain cell-row pill that only emits `ActionClick`. */
  Pages?: Record<string, readonly GlassAction[]>;
}

/**
 * `<glass-action-bar>` — the trailing cluster as N independent glass pills (one
 * per `ActionGroup`) followed by a single **sink** pill that owns the avatar and
 * the only overflow menu. There is no ellipsis: the sink's avatar is the menu
 * trigger (the designated top-priority button).
 *
 *   [ group A ] [ group B ] … [ sink: avatar ]
 *
 * As the toolbar narrows, groups fold by `Priority` (lowest first); a
 * `WholeGroup` group jumps out at once, a `PerItem` group sheds tail cells one
 * at a time. Everything shed with `ToMenu` consolidates into the sink menu,
 * sectioned by group label; `Hide` groups vanish. Width is measured from the
 * ancestor toolbar / leading rects each rAF tick (same approach as
 * `GlassActionGroup`).
 */
@Component({
  selector: 'glass-action-bar',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon, GlassActionGroup, GlassDropdown, GlassDropdownItem, JwiftSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    <jiv class="Jwift_GlassActionBar" #bar>
      @for (gp of _GroupPills(); track gp.Id) {
        @if (gp.Expandable) {
          <!-- Expandable group pill — same <glass-dropdown> the sink/avatar uses:
               closed shows the cell row at its base footprint; a cell carrying
               a Page opens this pill's own dropdown in place. The dropdown goes
               Position:Placed when open (out of flow), so we wrap it in an
               in-flow slot sized to the closed footprint — that holds the bar's
               flow steady (no sibling reflow) and the open menu anchors to this
               slot, popping under its own pill rather than the bar's corner. -->
          <jiv class="Jwift_GlassActionBarSlot" [childLayout]="_PillSlot(gp.Cells.length)">
          <glass-dropdown #gd
            [defaultPage]="_GroupDefaultPage(gp.Group)"
            [canOpen]="_GroupCanOpen(gp.Group)">
            @if (!gd.IsOpen()) {
              @for (a of gp.Cells; track a.Id) {
                @if (a.Spinner) {
                  <jiv class="Jwift_GlassDropdownCell">
                    <jwift-spinner [size]="20" />
                  </jiv>
                } @else {
                  <jiv [class]="_CellClass(a)" (click)="_OnExpandableCell(a, $event, gd)">
                    <icon [class]="_GlyphClass(a)" [Name]="a.Icon ?? ''" />
                  </jiv>
                }
              }
            } @else {
              @for (item of _OpenItemsFor(gp, gd.Page()); track item.Id) {
                @if (item.Divider) {
                  <jiv class="Jwift_GlassDropdownDivider" />
                } @else if (item.Header) {
                  <jext class="Jwift_GlassDropdownSectionHeader" [text]="item.Label ?? ''" />
                } @else {
                  <glass-dropdown-item
                    [variant]="_ItemVariant(item)"
                    [disabled]="!!item.Disabled"
                    [keepOpen]="!!item.KeepOpen || !!item.Page"
                    (click)="_OnItemClick(item, gd)">
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
          </jiv>
        } @else {
          <jiv class="Jwift_GlassDropdown_Closed">
            @for (a of gp.Cells; track a.Id) {
              @if (a.Spinner) {
                <jiv class="Jwift_GlassDropdownCell">
                  <jwift-spinner [size]="20" />
                </jiv>
              } @else {
                <jiv [class]="_CellClass(a)" (click)="_OnCell(a, $event)">
                  <icon [class]="_GlyphClass(a)" [Name]="a.Icon ?? ''" />
                </jiv>
              }
            }
          </jiv>
        }
      }
      <glass-action-group
        [Actions]="_NoActions"
        [Menu]="_SinkMenu()"
        [Pages]="Pages()"
        [AvatarUrl]="AvatarUrl()"
        [AvatarInitials]="AvatarInitials()"
        [AvatarFallbackIcon]="AvatarFallbackIcon()"
        [CollaboratorAvatarUrls]="CollaboratorAvatarUrls()"
        [ShowEllipsis]="false"
        (ActionClick)="ActionClick.emit($event)" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class GlassActionBar implements OnDestroy {
  /** Collapsing groups, left → right. */
  readonly Groups = input<readonly ActionGroup[]>([]);

  /** Items appended to the sink menu AFTER all consolidated overflow (e.g. the
   *  account/auth section). A leading divider is inserted automatically when
   *  there's overflow above. */
  readonly Menu = input<readonly GlassAction[]>([]);

  /** Sink sub-page item lists (e.g. auth providers), forwarded to the sink. */
  readonly Pages = input<Record<string, readonly GlassAction[]>>({});

  readonly AvatarUrl = input<string | null>(null);
  readonly AvatarInitials = input<string | null>(null);
  readonly AvatarFallbackIcon = input<string>('person.fill');
  readonly CollaboratorAvatarUrls = input<readonly string[]>([]);

  /** Fires the clicked action id — from a group cell or a sink menu item. */
  readonly ActionClick = output<string>();

  protected readonly JssSource = GlassActionBarJss;
  protected readonly _NoActions: readonly GlassAction[] = [];

  @ViewChild('bar', { read: Jiv }) private _Bar?: Jiv;

  // Geometry — in sync with Jwift_GlassDropdown_Closed (40pt cells, 4pt gap,
  // 4pt pad) and Jwift_GlassActionBar (10pt inter-pill gap).
  private static readonly _CellPt    = 40;
  private static readonly _GapPt     =  4;
  private static readonly _PadPt     =  4;
  private static readonly _PillGapPt = 10;
  private static readonly _ToolbarPadPt = 10;
  private static readonly _HysteresisPt = 8;

  /** Per-group inline cell counts, aligned to `Groups()` by index. */
  private readonly _counts = signal<number[]>([]);
  private _countsKey = '';
  private _rectsWired = false;
  private _rafId = 0;

  private _cellEligible(g: ActionGroup): readonly GlassAction[] {
    return g.Actions.filter(a => !a.Divider && !a.Header && (!!a.Icon || !!a.Spinner));
  }

  protected readonly _GroupPills = computed(() => {
    const counts = this._counts();
    return this.Groups().map((g, i) => {
      const cells = this._cellEligible(g);
      const n = Math.min(cells.length, counts[i] ?? cells.length);
      const expandable = !!g.Pages && Object.keys(g.Pages).length > 0;
      return { Id: g.Id, Group: g, Expandable: expandable, Cells: cells.slice(0, n) };
    }).filter(gp => gp.Cells.length > 0);
  });

  /** Items shown when an expandable pill is open. Sub-page id → its row list;
   *  null page (root, no page pushed yet) shows nothing — expandable cells
   *  always push a page on tap. */
  protected _OpenItemsFor(gp: { Group: ActionGroup }, page: string | null): readonly GlassAction[] {
    if (page === null) return [];
    return gp.Group.Pages?.[page] ?? [];
  }

  /** The page a host (glass-background) tap should open. When a group has a
   *  single page (the common case — e.g. warnings), tapping anywhere on the
   *  pill opens it; with multiple pages there's no unambiguous default, so the
   *  host opens nothing and only the per-cell Page targets apply. */
  protected _GroupDefaultPage(g: ActionGroup): string | null {
    const keys = g.Pages ? Object.keys(g.Pages) : [];
    return keys.length === 1 ? keys[0] : null;
  }

  /** Whether a host tap should be allowed to open this pill at all — i.e. at
   *  least one of its pages has rows. Prevents the flat empty-glass open when
   *  the pill exists only for a non-expandable cell (e.g. the autosave
   *  indicator) and its page list is currently empty. */
  protected _GroupCanOpen(g: ActionGroup): boolean {
    return !!g.Pages && Object.values(g.Pages).some(rows => rows.length > 0);
  }

  /** Sink menu = consolidated `ToMenu` overflow (sectioned by group) then the
   *  appended `Menu` items. */
  protected readonly _SinkMenu = computed<readonly GlassAction[]>(() => {
    const counts = this._counts();
    const out: GlassAction[] = [];
    this.Groups().forEach((g, i) => {
      if ((g.CollapsePolicy ?? 'ToMenu') === 'Hide') return;
      const cells = this._cellEligible(g);
      // Spinner cells are transient inline indicators — never list them as menu rows.
      const shed = cells.slice(counts[i] ?? cells.length).filter(a => !a.Spinner);
      if (!shed.length) return;
      if (out.length) out.push({ Id: `__div_${g.Id}`, Divider: true });
      if (g.Label) out.push({ Id: `__hdr_${g.Id}`, Header: true, Label: g.Label });
      out.push(...shed);
    });
    const appended = this.Menu();
    if (appended.length) {
      if (out.length) out.push({ Id: '__div_menu', Divider: true });
      out.push(...appended);
    }
    return out;
  });

  constructor() {
    afterNextRender(() => {
      const tick = (): void => {
        this._UpdateFit();
        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);
    });
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  /** Closed-pill footprint (pt) for an expandable group's reserving slot —
   *  same geometry the solver uses (`_pillWidth`): 2·pad + n·cell + (n−1)·gap.
   *  Height is the fixed 48pt closed-pill height. Kept in flow so opening the
   *  pill's Placed dropdown never reflows the bar. */
  protected _PillSlot(n: number): Partial<ChildLayout> {
    const pad = GlassActionBar._PadPt;
    const cell = GlassActionBar._CellPt;
    const gap = GlassActionBar._GapPt;
    const w = n > 0 ? 2 * pad + n * cell + (n - 1) * gap : 0;
    return { Width: w + 'pt', Height: '48pt' };
  }

  protected _CellClass(a: GlassAction): string {
    const classes = ['Jwift_GlassDropdownCell'];
    if (a.Active) classes.push('Jwift_GlassDropdownCell_Active');
    if (a.Disabled) classes.push('Jwift_GlassDropdownCell_Disabled');
    return classes.join(' ');
  }

  protected _GlyphClass(a: GlassAction): string {
    return a.Tint === 'warn' ? 'Jwift_GlassActionGlyph_Warn' : 'Jwift_GlassActionGlyph';
  }

  protected _OnCell(a: GlassAction, event: MouseEvent): void {
    event.stopPropagation();
    if (a.Disabled) return;
    this.ActionClick.emit(a.Id);
  }

  /** Cell tap inside an expandable pill: a `Page` cell opens this pill's own
   *  dropdown and pushes the sub-page; everything else emits like a plain cell. */
  protected _OnExpandableCell(a: GlassAction, event: MouseEvent, gd: GlassDropdown): void {
    event.stopPropagation();
    if (a.Disabled) return;
    if (a.Page) { gd.Open(); gd.PushPage(a.Page); return; }
    this.ActionClick.emit(a.Id);
  }

  protected _OnItemClick(item: GlassAction, gd: GlassDropdown): void {
    // GlassDropdownItem stops propagation + handles auto-close; dispatch only.
    if (item.Disabled) return;
    if (item.Page) { gd.PushPage(item.Page); return; }
    this.ActionClick.emit(item.Id);
  }

  protected _ItemVariant(a: GlassAction): GlassDropdownItemVariant {
    return a.Destructive ? 'danger' : 'default';
  }

  protected _ItemIconClass(a: GlassAction): string {
    return a.Destructive ? 'Jwift_GlassDropdownItemIcon_Danger' : 'Jwift_GlassDropdownItemIcon';
  }

  protected _ItemLabelClass(a: GlassAction): string {
    return a.Destructive ? 'Jwift_GlassDropdownItemLabel_Danger' : 'Jwift_GlassDropdownItemLabel';
  }

  // ── collapse solver ───────────────────────────────────────────────────────

  private _pillWidth(n: number, cell: number, gap: number, pad: number): number {
    return n > 0 ? 2 * pad + n * cell + (n - 1) * gap : 0;
  }

  /** Total bar width (pills + gaps + sink) for a candidate count vector. */
  private _barWidth(counts: number[], cell: number, gap: number, pad: number, pillGap: number): number {
    const sinkW = 2 * pad + cell; // avatar-only sink
    let sumPills = 0, visible = 0;
    this.Groups().forEach((g, i) => {
      const eligible = this._cellEligible(g).length;
      const n = Math.min(eligible, counts[i] ?? eligible);
      if (n <= 0) return;
      sumPills += this._pillWidth(n, cell, gap, pad);
      visible++;
    });
    // children = visible pills + sink; gaps between them = visible (pill→…→sink).
    return sumPills + sinkW + pillGap * visible;
  }

  private _fullCounts(): number[] {
    return this.Groups().map(g => this._cellEligible(g).length);
  }

  /** Lowest-priority still-inline group index; -1 if none. Tie-break: later in
   *  the array (right-most) folds first. */
  private _nextToFold(counts: number[]): number {
    let pick = -1, pickPri = Infinity, pickIdx = -1;
    this.Groups().forEach((g, i) => {
      if ((counts[i] ?? 0) <= 0) return;
      if (g.Priority < pickPri || (g.Priority === pickPri && i > pickIdx)) {
        pick = i; pickPri = g.Priority; pickIdx = i;
      }
    });
    return pick;
  }

  /** Highest-priority folded group index to restore; -1 if all full. Tie-break:
   *  earlier in the array (left-most) restores first (reverse of fold order). */
  private _nextToUnfold(counts: number[]): number {
    let pick = -1, pickPri = -Infinity, pickIdx = Infinity;
    this.Groups().forEach((g, i) => {
      const full = this._cellEligible(g).length;
      if ((counts[i] ?? full) >= full) return;
      if (g.Priority > pickPri || (g.Priority === pickPri && i < pickIdx)) {
        pick = i; pickPri = g.Priority; pickIdx = i;
      }
    });
    return pick;
  }

  private _foldOne(counts: number[], i: number): void {
    const g = this.Groups()[i];
    counts[i] = (g.CollapseUnit ?? 'WholeGroup') === 'PerItem' ? Math.max(0, (counts[i] ?? 0) - 1) : 0;
  }

  private _unfoldOne(counts: number[], i: number): void {
    const g = this.Groups()[i];
    const full = this._cellEligible(g).length;
    counts[i] = (g.CollapseUnit ?? 'WholeGroup') === 'PerItem' ? Math.min(full, (counts[i] ?? 0) + 1) : full;
  }

  private _UpdateFit(): void {
    const barNode = this._Bar?.Node;
    if (!barNode) return;
    const trailing = barNode.Parent;
    const toolbar = trailing?.Parent;
    if (!trailing || !toolbar) return;
    // Apple convention: leading + trailing bar items lay out first at their
    // intrinsic widths; the centered title (principal) takes the leftover and
    // truncates. So the trailing groups size against the FIXED leading nav
    // cluster only — NOT the flexible centered-title zone, which yields. The
    // leading cluster is the first non-trailing child; a flex title zone (if
    // any) sits between it and the trailing cluster and absorbs the slack.
    const leading = toolbar.Children.find(c => c !== trailing);

    if (!this._rectsWired) {
      this._rectsWired = true;
      toolbar.WatchRect?.(true);
      leading?.WatchRect?.(true);
      barNode.WatchRect?.(true);
    }

    // Reset counts to full whenever the group set changes.
    const key = this.Groups().map(g => `${g.Id}:${this._cellEligible(g).length}`).join('|');
    if (key !== this._countsKey) {
      this._countsKey = key;
      this._counts.set(this._fullCounts());
    }

    const ps = toolbar.ResolveCtx?.PointScale ?? 1;
    const cell    = GlassActionBar._CellPt    * ps;
    const gap     = GlassActionBar._GapPt     * ps;
    const pad     = GlassActionBar._PadPt     * ps;
    const pillGap = GlassActionBar._PillGapPt * ps;
    const tbPad   = GlassActionBar._ToolbarPadPt * ps;
    const hyst    = GlassActionBar._HysteresisPt * ps;

    const innerW   = toolbar.Width - 2 * tbPad;
    const leadingW = leading?.Width ?? 0;
    if (innerW <= 0) return; // not laid out yet
    const available = Math.max(0, innerW - leadingW - pillGap);

    const counts = [...this._counts()];
    if (counts.length !== this.Groups().length) {
      this._counts.set(this._fullCounts());
      return;
    }

    let guard = 0;
    // Fold while the bar overflows.
    while (this._barWidth(counts, cell, gap, pad, pillGap) > available && guard++ < 200) {
      const i = this._nextToFold(counts);
      if (i < 0) break;
      this._foldOne(counts, i);
    }
    // Unfold while there's room to restore the next group + hysteresis margin.
    guard = 0;
    while (guard++ < 200) {
      const i = this._nextToUnfold(counts);
      if (i < 0) break;
      const trial = [...counts];
      this._unfoldOne(trial, i);
      if (this._barWidth(trial, cell, gap, pad, pillGap) + hyst <= available) {
        counts[i] = trial[i];
      } else break;
    }

    const cur = this._counts();
    if (counts.some((v, i) => v !== cur[i])) this._counts.set(counts);
  }
}
