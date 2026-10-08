import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Jaui, Jext, Jiv, Jyle, JSS_REGISTRY } from 'jaui-angular';
import { ComposeFontFamily } from 'jaui';
import { Icon } from '../Icon/Icon';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';
import { RowIndicator, type RowIndicatorRow } from '../Internal/RowIndicator';
import { Popover, JWIFT_POPOVER_ROOM } from './Popover';
import GlassDropdownJss from '../GlassDropdown/GlassDropdown.jss';
import PopoverMenuJss from './PopoverMenu.jss';

export type PopoverMenuItemKind = 'Item' | 'Header' | 'Separator' | 'Note';

export interface PopoverMenuItem {
  readonly Kind: PopoverMenuItemKind;
  readonly Key?: string;
  readonly Label?: string;
  readonly Caption?: string;
  readonly Detail?: string;
  readonly Checked?: boolean | null;
  readonly Disabled?: boolean;
  readonly Danger?: boolean;
  /** This pick does not close the owning popover. */
  readonly Keep?: boolean;
  /** The rows a pick pushes as a page of their own. Read live while that page shows, so a submenu whose
   *  rows read a signal (a multi-select list checking its rows as they are picked) redraws as it changes. */
  readonly Submenu?: () => readonly PopoverMenuItem[];
  readonly SubmenuTitle?: string;
  readonly OnPick?: () => void;
}

interface _Page {
  readonly Items: () => readonly PopoverMenuItem[];
  readonly Title: string | null;
}

/** A row's fixed parts, pt, as PopoverMenu.jss draws them: the side padding, the check column, the gap
 *  between a row's parts, the chevron's own width, and Popover.jss's panel padding around the rows. */
const MENU_ROW_PAD = 14;
const MENU_CHECK = 18;
const MENU_ROW_GAP = 10;
const MENU_CHEVRON = 12;
const MENU_PANEL_PAD = 10;
/** A measure taken on this thread can come in a hair short of the worker's own layout. */
const MENU_MEASURE_SLACK = 4;

let _measureCtx: CanvasRenderingContext2D | null = null;
/** One run of menu text's width, px (PointScale 1), in the face the menu draws it in (`ComposeFontFamily`,
 *  the same stack `TokenSentence` measures with, CJK fallbacks included). */
const _measure = (text: string, sizePt: number, weight: number): number => {
  if (!text || typeof document === 'undefined') return 0;
  _measureCtx ??= document.createElement('canvas').getContext('2d');
  if (!_measureCtx) return 0;
  // Drill Sentences lane YY3b, item 10: San Francisco first on an Apple device, Inter everywhere else — the
  // same stack `PopoverMenu.jss`'s own rows are styled with, and `TokenSentence`'s own `SENTENCE_FONT_STACK`.
  _measureCtx.font = `${weight} ${sizePt}px ${ComposeFontFamily('-apple-system, BlinkMacSystemFont, Inter')}`;
  return _measureCtx.measureText(text).width;
};

/**
 * One menu row's rect, registered with the menu's shared `RowIndicator` — the lightweight
 * per-element directive pattern `Sheet.ts`'s `SheetBody`/`SheetCancel` already use, here because
 * `@for`-produced rows are plain `<jiv>` elements rather than one Angular component apiece.
 */
@Directive({ selector: '[popoverMenuRow]', standalone: true })
export class PopoverMenuRow implements OnInit, OnDestroy, RowIndicatorRow {
  private readonly _menu = inject(forwardRef(() => PopoverMenu));
  private readonly _jiv = inject(Jiv, { self: true });
  readonly popoverMenuRow = input(false);

  get Node() { return this._jiv.Node; }
  IsDisabled(): boolean { return this.popoverMenuRow(); }

  ngOnInit(): void {
    this._jiv.Node.WatchRect(true);
    this._menu.RegisterRow(this);
  }
  ngOnDestroy(): void {
    this._menu.UnregisterRow(this);
    this._jiv.Node.WatchRect(false);
  }
}

/**
 * `<popover-menu>`: the house menu, meant as a Popover's content — a page of rows with an internal
 * back stack for submenus, sharing GlassDropdown's one sliding hover/press indicator so the app has a
 * single menu "feel" regardless of which chrome opened it.
 *
 *   <popover [Anchor]="anchorFn" [(Open)]="open">
 *     <popover-menu [Items]="items" [Title]="'Forward'" (Picked)="onPick($event)" />
 *   </popover>
 */
@Component({
  selector: 'popover-menu',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon, PopoverMenuRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv #scrollBody class="Jwift_PopoverMenuScroll" [childLayout]="_ScrollLayout()">
      <!-- FIRST child, matching GlassDropdown.ts's own order (its own doc comment on RowIndicator: "one
           sliding indicator", the shared pill both share). Round 14, live: with this painted LAST (as it
           used to be here), a real pointer hit-test (Scroll.Manager.ts's own _hitTopmost, which skips
           a node only for PointerEvents: None or !Visible -- never zero opacity) found the pill
           itself, not the row under it, since the pill is Position: Placed over whatever row it last
           sat on and nothing here ever gave it PointerEvents: None of its own. First in paint order
           means every real row's own (click) is topmost again, the pill purely decorative underneath
           it (GlassDropdown.jss's own fix for the indicator class itself backs this up further, not
           instead of it -- belt and suspenders, since a future row added above it here would reopen the
           same bug otherwise). -->
      <jiv #indicator [class]="_IndicatorClass()" [childLayout]="_IndicatorLayout()" />
      <!-- Drill Sentences lane CC2, item 5 (a blind tester: the Hold submenu had a back chevron and no title):
           a pushed page is titled with the name of the row that opened it, beside the chevron that goes
           back, the way an iOS menu titles its submenus. -->
      @if (!_atRoot()) {
        <jiv class="Jwift_PopoverMenuBack" semantics="Button" [label]="_page().Title ?? ''" (click)="Back()">
          <icon class="Jwift_PopoverMenuBackGlyph" Name="chevron.left" />
          <jext class="Jwift_PopoverMenuBackLabel" [text]="_page().Title ?? ''" />
        </jiv>
      } @else if (Title()) {
        <jext class="Jwift_PopoverMenuHeader" [text]="Title() ?? ''" />
      }
      @for (item of _items(); track item.Key ?? $index) {
        @switch (item.Kind) {
          @case ('Header') {
            <jext class="Jwift_PopoverMenuHeader" [text]="item.Label ?? ''" />
          }
          @case ('Separator') {
            <jiv class="Jwift_PopoverMenuSeparator" />
          }
          @case ('Note') {
            <jext class="Jwift_PopoverMenuNote" [text]="item.Label ?? ''" />
          }
          @default {
            <jiv [popoverMenuRow]="!!item.Disabled" [class]="_RowClass(item)"
                 semantics="Button" [label]="_RowLabel(item)" (click)="_pick(item)">
              <jiv class="Jwift_PopoverMenuCheck">
                @if (item.Checked) { <icon class="Jwift_PopoverMenuCheckGlyph" Name="checkmark" /> }
              </jiv>
              <jiv class="Jwift_PopoverMenuLabelCol">
                <jext class="Jwift_PopoverMenuLabel" [text]="item.Label ?? ''" />
                @if (item.Caption) { <jext class="Jwift_PopoverMenuCaption" [text]="item.Caption" /> }
              </jiv>
              @if (item.Detail) { <jext class="Jwift_PopoverMenuDetail" [text]="item.Detail" /> }
              @if (item.Submenu) { <icon class="Jwift_PopoverMenuChevron" Name="chevron.right" /> }
            </jiv>
          }
        }
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class PopoverMenu implements OnInit, OnDestroy {
  protected readonly Jss = PopoverMenuJss;

  readonly Items = input.required<readonly PopoverMenuItem[]>();
  readonly Title = input<string | null>(null);
  /** Appended to a checked row's accessible label (e.g. ", selected"). */
  readonly CheckedLabel = input(', selected');

  readonly Picked = output<PopoverMenuItem>();

  private readonly _canvas = inject(Jaui, { optional: true });
  private readonly _doc = inject(DOCUMENT);
  private readonly _jss = inject(JSS_REGISTRY);
  private readonly _styleLoader = inject(JwiftStyleLoader);
  private readonly _popover = inject(Popover, { optional: true });
  private readonly _room = inject(JWIFT_POPOVER_ROOM, { optional: true });

  private readonly _scrollBody = viewChild<Jiv>('scrollBody');
  private readonly _indicator = viewChild<Jiv>('indicator');
  private readonly _rowIndicator = new RowIndicator(
    () => this._scrollBody()?.Node,
    () => this._canvas,
    () => this._indicator()?.Node,
  );
  protected readonly _IndicatorLayout = this._rowIndicator.IndicatorLayout;
  protected readonly _IndicatorClass = this._rowIndicator.IndicatorClass;

  // The RowIndicator places each row's box RELATIVE to this owner (`row.X - owner.X`), which only
  // reports real coordinates once its rect is watched — same reason GlassDropdown's own `ngOnInit`
  // watches its own `Node`. The owner here is a view child, not the component's own Jiv, so it
  // resolves after the first view pass; an effect (not ngOnInit) is what can wait for that.
  private readonly _watchScrollBody = effect(() => { this._scrollBody()?.Node.WatchRect(true); });

  // ── Open scrolled to the checked row (Drill Sentences lane V2, item 3) ─────────────────────────────
  // "The phrase dropdown's row positions shift between opens" had a second half beyond Popover.ts's own
  // placement fix: nothing here ever scrolled a long menu to its CURRENT item at all, so a phrase near the
  // bottom of a long show opened scrolled to the TOP, out of view, every time. Every `PopoverMenuRow` this
  // template ever creates is a `[popoverMenuRow]` on the `@default` (Kind: 'Item') branch, in the SAME
  // order `_page().Items` itself lists them — `viewChildren` below collects them in that same template
  // order, so index-matching the two against the `Item`-kind subsequence is exact, never a guess.
  private readonly _rows = viewChildren(PopoverMenuRow);
  /** True from mount (or a page push/pop) until the one scroll below has run for THIS page — never
   *  re-fires on a later tick just because `Items()` itself produced a new array reference (e.g. a
   *  caller's own `computed()` recomputing while the menu stays open), which would otherwise fight a
   *  reader already scrolling the list by hand. */
  private readonly _scrollToCheckedPending = signal(true);
  private readonly _scrollToChecked = effect(() => {
    if (!this._scrollToCheckedPending()) return;
    const rows = this._rows();
    const body = this._scrollBody();
    const items = this._items().filter((i) => i.Kind === 'Item');
    if (!body || rows.length === 0 || rows.length !== items.length) return; // not fully settled yet.
    this._scrollToCheckedPending.set(false);
    const idx = items.findIndex((i) => i.Checked);
    if (idx < 0) return; // nothing checked — opens at the top, same as before.
    // `Motion: 'Instant'` — this runs before the panel's own grow-in (`Popover.jss`'s `Presence` spring)
    // ever reads as settled, so an ANIMATED scroll here would be the exact "rows move under the finger"
    // bug item 3 is fixing, just moved into the list body instead of the panel's own placement.
    body.Node.ScrollTo({ Element: rows[idx].Node, Align: 'Center', Motion: 'Instant' });
  });

  protected readonly _ScrollLayout = computed(() => {
    const room = this._room ? this._room() : Infinity;
    return { MaxHeight: Number.isFinite(room) ? `${room}px` : 'none' };
  });

  private readonly _pushed = signal<readonly _Page[]>([]);
  protected readonly _atRoot = computed(() => this._pushed().length === 0);
  protected readonly _page = computed<_Page>(() => {
    const pushed = this._pushed();
    return pushed.length > 0 ? pushed[pushed.length - 1] : { Items: () => this.Items(), Title: this.Title() };
  });
  /** The rows the page shows, read live (`PopoverMenuItem.Submenu`). */
  protected readonly _items = computed(() => this._page().Items());

  // ── Sized to its widest row (Drill Sentences lane Y3, item 5) ─────────────────────────────────────
  // A fixed 250pt panel cut "Move with other squads…" down to "Move with other". The page's own rows are
  // measured with the font they draw in (PopoverMenu.jss: 17pt labels, 15pt details, 13pt headers and
  // captions, the 17pt semibold back row), plus each row's fixed parts, and handed to the owning Popover
  // (`ContentWidth`), which grows to fit up to its `MaxWidth`; past that, the labels wrap
  // (`Jwift_PopoverMenuLabel` has no line cap). Measured per page, so a pushed submenu fits its own rows.
  private readonly _contentWidth = computed(() => {
    let widest = 0;
    for (const item of this._items()) {
      if (item.Kind === 'Header') widest = Math.max(widest, MENU_ROW_PAD * 2 + _measure(item.Label ?? '', 13, 500));
      if (item.Kind !== 'Item') continue;
      const label = Math.max(_measure(item.Label ?? '', 17, 400), _measure(item.Caption ?? '', 13, 400));
      const detail = item.Detail ? MENU_ROW_GAP + _measure(item.Detail, 15, 400) : 0;
      const chevron = item.Submenu ? MENU_ROW_GAP + MENU_CHEVRON : 0;
      widest = Math.max(widest, MENU_ROW_PAD * 2 + MENU_CHECK + MENU_ROW_GAP + label + detail + chevron);
    }
    if (!this._atRoot()) widest = Math.max(widest, MENU_ROW_PAD * 2 + MENU_CHEVRON + MENU_ROW_GAP + _measure(this._page().Title ?? '', 17, 600));
    return widest > 0 ? Math.ceil(widest + MENU_PANEL_PAD * 2 + MENU_MEASURE_SLACK) : null;
  });
  private readonly _publishWidth = effect(() => {
    const width = this._contentWidth();
    this._popover?.ContentWidth.set(width);
  });

  private _unbindIndicator: (() => void) | null = null;
  private _releaseScroller: (() => void) | null = null;

  RegisterRow(row: RowIndicatorRow): void { this._rowIndicator.RegisterRow(row); }
  UnregisterRow(row: RowIndicatorRow): void { this._rowIndicator.UnregisterRow(row); }

  ngOnInit(): void {
    this._styleLoader.Ensure(this._jss, 'GlassDropdown', GlassDropdownJss);
    this._unbindIndicator = this._rowIndicator.Bind(this._doc, () => true);
    // Drill Sentences lane AA2, item 1: the rows scroll within the panel's room, and the panel places by
    // their whole unscrolled height (the watched scroll body's own content extent), never by the height
    // an earlier placement already capped it to.
    this._releaseScroller = this._popover?.AddScroller(() => this._scrollBody()?.Node.ContentHeight ?? 0) ?? null;
  }

  ngOnDestroy(): void {
    this._releaseScroller?.();
    this._unbindIndicator?.();
    // A popover that swaps this menu for other content (a phrase's Measures page) keeps its own Width.
    this._popover?.ContentWidth.set(null);
  }

  PushPage(items: () => readonly PopoverMenuItem[], title: string | null): void {
    this._popover?.HoldPlacement(); // lane Y3, item 6: the panel stays put while the page changes.
    this._pushed.update((s) => [...s, { Items: items, Title: title }]);
    // Round 14, live ("a menu reopened fresh sometimes sticks on its first item"): the OLD page's rows
    // unregister as they're torn down, but `RowIndicator`'s own `_hovered`/`IndicatorLayout` never clear
    // on their own (`UnregisterRow` only clears `_hovered` for the SPECIFIC row being removed, and a
    // page swap can land the very first NEW row at the exact canvas position the pill was already
    // sitting at) -- the pill could keep reading as "on" over whatever NEW row happens to start where the
    // OLD one left off, with no real hover/press to back it. A fresh page starts with nothing highlighted.
    this._rowIndicator.Reset();
    this._scrollToCheckedPending.set(true); // a pushed submenu gets the SAME "open scrolled to checked" treatment.
  }

  Back(): void {
    this._popover?.HoldPlacement();
    this._pushed.update((s) => s.slice(0, -1));
    this._rowIndicator.Reset(); // same reasoning as PushPage's own Reset, above.
    this._scrollToCheckedPending.set(true); // the page returned to gets scrolled to its own checked row again.
  }

  protected _RowClass(item: PopoverMenuItem): string {
    const base = item.Disabled ? 'Jwift_PopoverMenuItem_Disabled' : 'Jwift_PopoverMenuItem';
    return base;
  }

  protected _RowLabel(item: PopoverMenuItem): string {
    const base = item.Label ?? '';
    return item.Checked ? `${base}${this.CheckedLabel()}` : base;
  }

  protected _pick(item: PopoverMenuItem): void {
    if (item.Disabled) return;
    if (item.Submenu) {
      this.PushPage(item.Submenu, item.SubmenuTitle ?? item.Label ?? null);
      return;
    }
    item.OnPick?.();
    this.Picked.emit(item);
    if (!item.Keep) this._popover?.OpenChange.emit(false);
  }
}
