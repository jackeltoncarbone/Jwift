import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { type ChildLayout } from 'jaui';
import { Icon } from '../Icon/Icon';
import { GlassActionGroup, type GlassAction } from '../GlassActionGroup/GlassActionGroup';
import { GLASS_ACTION_ACCOUNT } from '../GlassActionGroup/GlassActionAccount';
import { GlassDropdown } from '../GlassDropdown/GlassDropdown';
import { GlassDropdownItem } from '../GlassDropdown/GlassDropdownItem';
import { JwiftSpinner } from '../Spinner/JwiftSpinner';
import GlassActionBarJss from './GlassActionBar.jss';
import { HoverTip } from './HoverTip';
import { BarRoom, CELL_PT, CellWidth, PillWidth, ShowsTitle } from './GlassActionBar.Room';

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
  /** The group's dropdown opens under its pill, the bar left in view above it, rather than over the pill
   *  (`GlassDropdown.openBelow`). For a list read against the toolbar, like a page's problems. */
  OpenBelow?: boolean;
  /** The open dropdown's width in pt, for a page of sentences rather than a menu's words (`GlassDropdown.openWidth`,
   *  Drill Sentences lane KK1, item 5: a page's problems). Omit for the menu's own width. */
  PageWidth?: number;
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
          <jiv class="Jwift_GlassActionBarSlot" [childLayout]="_PillSlot(gp.Cells)">
          <!-- Drill Sentences lane NN2, item 6: a pill whose list opens below it stays in the bar while the list is open,
               its cell pressed; a press on it closes the list (GlassDropdown counts its slot as its own). -->
          @if (gp.Group.OpenBelow && gd.IsOpen()) {
            <jiv [class]="_PillClass(gp.Cells)">
              @for (a of gp.Cells; track a.Id) {
                <jiv [class]="_CellClass(a, true)" [childLayout]="_CellLayout(a)" semantics="Button" [label]="a.Label ?? null"
                     (click)="_OnOpenCell($event, gd)" (pointermove)="_Tip.Over(a.Id, $event)">
                  <icon [class]="_GlyphClass(a)" [Name]="a.Icon ?? ''" />
                  @if (_ShowsTitle(a)) {
                    <jext #cellText class="Jwift_GlassActionTitle" [text]="a.Label ?? ''" />
                  }
                  @if (a.Disclosure) {
                    <icon class="Jwift_GlassDropdownCellChevron" Name="chevron.up" />
                  }
                  @if (a.Badge && !_ShowsTitle(a)) {
                    <jiv class="Jwift_GlassActionBadge">
                      <jext #cellText class="Jwift_GlassActionBadgeText" [text]="'' + a.Badge" />
                    </jiv>
                  }
                </jiv>
              }
            </jiv>
          }
          <glass-dropdown #gd
            [defaultPage]="_GroupDefaultPage(gp.Group)"
            [canOpen]="_GroupCanOpen(gp.Group)"
            [openBelow]="!!gp.Group.OpenBelow" [openWidth]="gp.Group.PageWidth ?? null" [closedVariant]="_PillVariant(gp.Cells)">
            @if (!gd.IsOpen()) {
              @for (a of gp.Cells; track a.Id) {
                @if (a.Spinner) {
                  <jiv class="Jwift_GlassDropdownCell">
                    <jwift-spinner [size]="20" />
                  </jiv>
                } @else {
                  <jiv [class]="_CellClass(a)" [childLayout]="_CellLayout(a)" semantics="Button" [label]="a.Label ?? null"
                       (click)="_OnExpandableCell(a, $event, gd)" (pointermove)="_Tip.Over(a.Id, $event)">
                    <icon [class]="_GlyphClass(a)" [Name]="a.Icon ?? ''" />
                    @if (_ShowsTitle(a)) {
                      <jext #cellText class="Jwift_GlassActionTitle" [text]="a.Label ?? ''" />
                    }
                    @if (a.Disclosure) {
                      <icon class="Jwift_GlassDropdownCellChevron" Name="chevron.down" />
                    }
                    @if (a.Badge && !_ShowsTitle(a)) {
                      <jiv class="Jwift_GlassActionBadge">
                        <jext #cellText class="Jwift_GlassActionBadgeText" [text]="'' + a.Badge" />
                      </jiv>
                    }
                  </jiv>
                }
              }
            } @else {
              @for (item of _OpenItemsFor(gp, gd.Page()); track item.Id) {
                @if (item.Divider) {
                  <jiv class="Jwift_GlassDropdownDivider" />
                } @else if (item.Header) {
                  <jext [class]="_HasStateIn(gp, gd.Page()) ? 'Jwift_GlassDropdownSectionHeader_Indented' : 'Jwift_GlassDropdownSectionHeader'" [text]="item.Label ?? ''" />
                } @else {
                  <glass-dropdown-item
                    [disabled]="!!item.Disabled"
                    [keepOpen]="!!item.KeepOpen || !!item.Page"
                    (click)="_OnItemClick(item, gd)">
                    @if (_HasStateIn(gp, gd.Page())) {
                      <icon [class]="item.Toggle && item.Active ? 'Jwift_GlassDropdownItemCheck' : 'Jwift_GlassDropdownItemCheck_Off'" Name="checkmark" />
                    }
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
          <jiv [class]="_PillClass(gp.Cells)">
            @for (a of gp.Cells; track a.Id) {
              @if (a.Spinner) {
                <jiv class="Jwift_GlassDropdownCell">
                  <jwift-spinner [size]="20" />
                </jiv>
              } @else {
                <jiv [class]="_CellClass(a)" [childLayout]="_CellLayout(a)" semantics="Button" [label]="a.Label ?? null"
                     (click)="_OnCell(a, $event)" (pointermove)="_Tip.Over(a.Id, $event)">
                  <icon [class]="_GlyphClass(a)" [Name]="a.Icon ?? ''" />
                  @if (_ShowsTitle(a)) {
                    <jext #cellText class="Jwift_GlassActionTitle" [text]="a.Label ?? ''" />
                  }
                  @if (a.Badge && !_ShowsTitle(a)) {
                    <jiv class="Jwift_GlassActionBadge">
                      <jext #cellText class="Jwift_GlassActionBadgeText" [text]="'' + a.Badge" />
                    </jiv>
                  }
                </jiv>
              }
            }
          </jiv>
        }
      }
      <glass-action-group
        [Actions]="_NoActions"
        [Menu]="_SinkMenu()"
        [Pages]="_EffectivePages()"
        [AvatarUrl]="AvatarUrl()"
        [AvatarInitials]="AvatarInitials()"
        [AvatarFallbackIcon]="AvatarFallbackIcon()"
        [CollaboratorAvatarUrls]="CollaboratorAvatarUrls()"
        [ShowEllipsis]="false"
        (ActionClick)="ActionClick.emit($event)" />
      @if (_TipLayout(); as tip) {
        <jiv class="Jwift_GlassActionTip" [childLayout]="tip.Layout">
          <jiv class="Jwift_GlassActionTipPill">
            <jext class="Jwift_GlassActionTipText" [text]="tip.Label" />
          </jiv>
        </jiv>
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class GlassActionBar implements OnDestroy {
  /** Collapsing groups, left → right. */
  readonly Groups = input<readonly ActionGroup[]>([]);

  /** Items appended to the sink menu AFTER all consolidated overflow (e.g. the
   *  account/auth section). A leading divider is inserted automatically when
   *  there's overflow above. Left UNSET (null) the bar appends the ambient
   *  account menu from GLASS_ACTION_ACCOUNT, which is what makes the avatar a
   *  real sink on a page that states nothing; pass `[]` to append nothing. */
  readonly Menu = input<readonly GlassAction[] | null>(null);

  /** The ambient account sink, when the host app provides one. */
  private readonly _Account = inject(GLASS_ACTION_ACCOUNT, { optional: true });

  /** Explicit rows win; unset inherits the account rows. The bar resolves this
   *  ITSELF rather than leaving it to the sink group, because the rows have to
   *  land UNDER the consolidated overflow with a divider above them. */
  protected readonly _EffectiveMenu = computed<readonly GlassAction[]>(() =>
    this.Menu() ?? this._Account?.Menu() ?? []);

  /** Drill Sentences lane EE1, item 3 (a blind desktop tester read "10problems" as the warnings cell's count
   *  changed): a cell's name and its count land at once when they change in place. Jaui's per word animator
   *  slid the unchanged "problems" from where it stood after "6" while the wider "10" was already drawn, so
   *  the two ran together mid change (`SnapText`). */
  private readonly _cellTexts = viewChildren<Jext>('cellText');
  private readonly _snapCellTexts = effect(() => {
    for (const text of this._cellTexts()) text.Node.SnapText = true;
  });

  /** Sink sub-page item lists (e.g. auth providers), forwarded to the sink. */
  readonly Pages = input<Record<string, readonly GlassAction[]>>({});

  readonly AvatarUrl = input<string | null>(null);
  readonly AvatarInitials = input<string | null>(null);
  readonly AvatarFallbackIcon = input<string>('person.fill');
  readonly CollaboratorAvatarUrls = input<readonly string[]>([]);

  /** Drill Sentences lane DD2, item 5 (blind desktop testers met four bare glyphs): a cell marked `Titled`
   *  wears its name beside its glyph while the bar has room for every name (`GlassActionBar.Room.ts`). The
   *  names go first as the bar narrows, all together, before any group folds, and come back last. Off, the
   *  bar is glyphs alone, as on a phone. */
  readonly Titled = input(false);

  /** Fires the clicked action id — from a group cell or a sink menu item. */
  readonly ActionClick = output<string>();

  protected readonly JssSource = GlassActionBarJss;
  protected readonly _NoActions: readonly GlassAction[] = [];

  @ViewChild('bar', { read: Jiv }) private _Bar?: Jiv;

  /** Which cell's name a resting desktop pointer reads (Drill Sentences lane X2, item 7: a row of bare
   *  glyphs read as unlabeled to blind first-time testers). `HoverTip.ts` carries the timing. */
  protected readonly _Tip = new HoverTip();
  /** Each new value hides the tip showing and quiets its cell until a fresh rest (`HoverTip.Quiet`): the page says
   *  something under the bar, a notice, whose place the tip would cover (Drill Sentences lane JJ1, item 5). */
  readonly QuietTips = input<unknown>(null);
  private readonly _quietTipsEffect = effect(() => {
    this.QuietTips();
    untracked(() => this._Tip.Quiet());
  });
  /** The tip's own box: wide enough for any one cell's name, centred under its cell (the bar lays its
   *  pills out with the same geometry the collapse solver below already models, so a cell's centre is a
   *  sum, never a measurement), just below the bar. The pill inside sizes to its text. */
  private static readonly _TipWidthPt = 220;
  private static readonly _TipGapPt = 6;
  protected readonly _TipLayout = computed<{ Label: string; Layout: Partial<ChildLayout> } | null>(() => {
    const id = this._Tip.Shown();
    if (id === null) return null;
    const gap = GlassActionBar._GapPt, pad = GlassActionBar._PadPt;
    const titles = this._TitlesOn();
    let left = 0;
    for (const gp of this._GroupPills()) {
      const index = gp.Cells.findIndex((a) => a.Id === id);
      if (index >= 0) {
        // A tip never shows without words (Drill Sentences lane AA1, item 5), and says what the cell is when
        // its name alone would not (`GlassAction.Tip`, lane BB2, item 5). A cell already wearing its name
        // (lane DD2) has a tip only for words it does not already show.
        const target = gp.Cells[index];
        const label = (ShowsTitle(target, titles) ? target.Tip : target.Tip ?? target.Label)?.trim();
        if (!label) return null;
        let before = 0;
        for (let i = 0; i < index; i++) before += CellWidth(gp.Cells[i], titles) + gap;
        const centre = left + pad + before + CellWidth(target, titles) / 2;
        return {
          Label: label,
          Layout: {
            Position: 'Placed', Left: `${centre - GlassActionBar._TipWidthPt / 2}pt`,
            Top: `${48 + GlassActionBar._TipGapPt}pt`, Width: `${GlassActionBar._TipWidthPt}pt`,
          },
        };
      }
      left += PillWidth(gp.Cells, titles, gap, pad) + GlassActionBar._PillGapPt;
    }
    return null;
  });

  // Geometry — in sync with Jwift_GlassDropdown_Closed (40pt cells, `CELL_PT`, 4pt gap,
  // 4pt pad) and Jwift_GlassActionBar (10pt inter-pill gap).
  private static readonly _GapPt     =  4;
  private static readonly _PadPt     =  4;
  private static readonly _PillGapPt = 10;
  private static readonly _ToolbarPadPt = 10;
  private static readonly _HysteresisPt = 8;
  /** Jwift_ToolbarTrailing's own Gap, between the bar and whatever else the trailing cluster holds. */
  private static readonly _TrailingGapPt = 8;
  /** The trailing cluster's other children, each watched once so its width stays live. */
  private readonly _watchedSiblings = new WeakSet<object>();

  /** Per-group inline cell counts, aligned to `Groups()` by index. */
  private readonly _counts = signal<number[]>([]);
  /** Whether the bar has room for its cells' names right now (the solver's half of `Titled`). */
  private readonly _titlesFit = signal(true);
  protected readonly _TitlesOn = computed(() => this.Titled() && this._titlesFit());
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
      // A header titles a section of several rows; a lone row, or a row that already says it, is its own title.
      if (g.Label && shed.length > 1 && !shed.some(a => a.Label === g.Label)) out.push({ Id: `__hdr_${g.Id}`, Header: true, Label: g.Label });
      out.push(...shed);
    });
    const appended = this._EffectiveMenu();
    if (appended.length) {
      if (out.length) out.push({ Id: '__div_menu', Divider: true });
      out.push(...appended);
    }
    return out;
  });

  /** Every group's OWN `Pages`, merged, plus whatever the caller states at the bar level (which wins on a
   *  colliding key). A Page-bearing cell can fold from its own pill into the sink's flat overflow list as
   *  the bar narrows; without its page riding along here, that shed cell would open onto nothing — the
   *  sink only ever reads its own `[Pages]` input, not each group's. */
  protected readonly _EffectivePages = computed<Record<string, readonly GlassAction[]>>(() => {
    const merged: Record<string, readonly GlassAction[]> = {};
    for (const g of this.Groups()) if (g.Pages) Object.assign(merged, g.Pages);
    return { ...merged, ...this.Pages() };
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
    this._Tip.Dispose();
  }

  /** Closed-pill footprint (pt) for an expandable group's reserving slot —
   *  same geometry the solver uses (`_pillWidth`): 2·pad + n·cell + (n−1)·gap.
   *  Height is the fixed 48pt closed-pill height. Kept in flow so opening the
   *  pill's Placed dropdown never reflows the bar. */
  protected _PillSlot(cells: readonly GlassAction[]): Partial<ChildLayout> {
    const w = PillWidth(cells, this._TitlesOn(), GlassActionBar._GapPt, GlassActionBar._PadPt);
    return { Width: w + 'pt', Height: '48pt' };
  }

  /** Whether a cell wears its name beside its glyph now. */
  protected _ShowsTitle(a: GlassAction): boolean {
    return ShowsTitle(a, this._TitlesOn());
  }

  /** A titled cell's width, the same number the solver laid the bar out with (`CellWidth`). */
  protected _CellLayout(a: GlassAction): Partial<ChildLayout> | undefined {
    return this._ShowsTitle(a) ? { Width: `${CellWidth(a, true)}pt` } : undefined;
  }

  /** A menu with any row checked keeps a check column, so its rows line up (as GlassActionGroup does). */
  protected _HasStateIn(gp: { Group: ActionGroup }, page: string | null): boolean {
    return this._OpenItemsFor(gp, page).some((item) => !!item.Toggle && !!item.Active);
  }

  /** `pressed`: the cell of a pill whose list is open below it, which reads as held down while it is. */
  protected _CellClass(a: GlassAction, pressed = false): string {
    const classes = ['Jwift_GlassDropdownCell'];
    if (this._ShowsTitle(a)) classes.push('Jwift_GlassDropdownCell_Titled');
    if (a.Active || pressed) classes.push('Jwift_GlassDropdownCell_Active');
    if (a.Disabled) classes.push('Jwift_GlassDropdownCell_Disabled');
    return classes.join(' ');
  }

  /** A pill holding a warning cell (`GlassAction.Tint`) takes a warm glass, so a page's problems stand apart from the
   *  quiet glass of every other pill (Drill Sentences lane NN2, item 7: a round 18 blind desktop tester read Cast,
   *  Library, Camera and "10 problems" as four equal pills). Null for a quiet pill. */
  protected _PillVariant(cells: readonly GlassAction[]): string | null {
    return cells.some((a) => a.Tint === 'warn') ? 'Jwift_GlassDropdown_ClosedWarn' : null;
  }
  protected _PillClass(cells: readonly GlassAction[]): string {
    const variant = this._PillVariant(cells);
    return variant ? `Jwift_GlassDropdown_Closed ${variant}` : 'Jwift_GlassDropdown_Closed';
  }

  protected _GlyphClass(a: GlassAction): string {
    return a.Tint === 'warn' ? 'Jwift_GlassActionGlyph_Warn' : 'Jwift_GlassActionGlyph';
  }

  // Same two class pickers the single pill uses — the sink menu renders its rows
  // here, and Sign out arrives through it on every page that states no menu.
  protected _ItemIconClass(item: GlassAction): string {
    return item.Destructive ? 'Jwift_GlassDropdownItemIcon_Destructive' : 'Jwift_GlassDropdownItemIcon';
  }

  protected _ItemLabelClass(item: GlassAction): string {
    return item.Destructive ? 'Jwift_GlassDropdownItemLabel_Destructive' : 'Jwift_GlassDropdownItemLabel';
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
    if (a.Page) { gd.Open(a.Page); return; }
    this.ActionClick.emit(a.Id);
  }

  /** A press on the pill standing over its open list (`ActionGroup.OpenBelow`): the list closes, as a second press on
   *  any disclosure does. Drill Sentences lane NN2, item 6 (a round 18 blind desktop tester, 26-problems.png: the
   *  toolbar's "10 problems" went while its list was open below it, so nothing said what the list was, or how to put
   *  it away). The closed cells live inside the dropdown's glass, which moves down to be the list, so the slot above
   *  stood empty; this pill stands there instead, its cell pressed. */
  protected _OnOpenCell(event: MouseEvent, gd: GlassDropdown): void {
    event.stopPropagation();
    gd.Close();
  }

  protected _OnItemClick(item: GlassAction, gd: GlassDropdown): void {
    // GlassDropdownItem stops propagation + handles auto-close; dispatch only.
    if (item.Disabled) return;
    if (item.Page) { gd.PushPage(item.Page); return; }
    this.ActionClick.emit(item.Id);
  }




  // ── collapse solver ───────────────────────────────────────────────────────

  /** Total bar width (pills + gaps + sink) for a candidate count vector, the cells wearing their names or
   *  not (`titles`), in px at `ps`. */
  private _barWidth(counts: number[], titles: boolean, ps: number): number {
    const gap = GlassActionBar._GapPt, pad = GlassActionBar._PadPt;
    const sinkW = 2 * pad + CELL_PT; // avatar-only sink
    let sumPills = 0, visible = 0;
    this.Groups().forEach((g, i) => {
      const eligible = this._cellEligible(g);
      const n = Math.min(eligible.length, counts[i] ?? eligible.length);
      if (n <= 0) return;
      sumPills += PillWidth(eligible.slice(0, n), titles, gap, pad);
      visible++;
    });
    // children = visible pills + sink; gaps between them = visible (pill→…→sink).
    return (sumPills + sinkW + GlassActionBar._PillGapPt * visible) * ps;
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
    const pillGap = GlassActionBar._PillGapPt * ps;
    const tbPad   = GlassActionBar._ToolbarPadPt * ps;
    const hyst    = GlassActionBar._HysteresisPt * ps;

    const innerW   = toolbar.Width - 2 * tbPad;
    const leadingW = leading?.Width ?? 0;
    if (innerW <= 0) return; // not laid out yet
    // Whatever else rides the trailing cluster beside the bar takes its share of the row first (`BarRoom`,
    // Drill Sentences lane AA1, item 6: uncounted, it left a phone's title truncated for good).
    const siblings = trailing.Children.filter(c => c !== barNode);
    for (const c of siblings) {
      if (!this._watchedSiblings.has(c)) { this._watchedSiblings.add(c); c.WatchRect?.(true); }
    }
    const available = BarRoom({
      InnerWidth: innerW, LeadingWidth: leadingW, PillGap: pillGap,
      SiblingWidths: siblings.map(c => c.Width), TrailingGap: GlassActionBar._TrailingGapPt * ps,
    });

    const counts = [...this._counts()];
    if (counts.length !== this.Groups().length) {
      this._counts.set(this._fullCounts());
      return;
    }

    // Lane DD2, item 5: the cells' names are the first thing given up and the last thing restored.
    const named = this.Titled();
    let titles = named && this._titlesFit();
    let guard = 0;
    // Fold while the bar overflows: the names first, then group by group.
    while (this._barWidth(counts, titles, ps) > available && guard++ < 200) {
      if (titles) { titles = false; continue; }
      const i = this._nextToFold(counts);
      if (i < 0) break;
      this._foldOne(counts, i);
    }
    // Unfold while there's room to restore the next group + hysteresis margin.
    guard = 0;
    while (!titles && guard++ < 200) {
      const i = this._nextToUnfold(counts);
      if (i < 0) break;
      const trial = [...counts];
      this._unfoldOne(trial, i);
      if (this._barWidth(trial, false, ps) + hyst <= available) {
        counts[i] = trial[i];
      } else break;
    }
    // With every group back inline, the names return once they fit too.
    if (named && !titles && this._nextToUnfold(counts) < 0 && this._barWidth(counts, true, ps) + hyst <= available) titles = true;

    const cur = this._counts();
    if (counts.some((v, i) => v !== cur[i])) this._counts.set(counts);
    if (named && titles !== this._titlesFit()) this._titlesFit.set(titles);
  }
}
