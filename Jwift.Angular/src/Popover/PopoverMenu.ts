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
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Jaui, Jext, Jiv, Jyle, JSS_REGISTRY } from 'jaui-angular';
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
  readonly Submenu?: () => readonly PopoverMenuItem[];
  readonly SubmenuTitle?: string;
  readonly OnPick?: () => void;
}

interface _Page {
  readonly Items: readonly PopoverMenuItem[];
  readonly Title: string | null;
}

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
      @if (!_atRoot()) {
        <jiv class="Jwift_PopoverMenuBack" semantics="Button" [label]="_parentTitle() ?? ''" (click)="Back()">
          <icon class="Jwift_PopoverMenuBackGlyph" Name="chevron.left" />
          <jext class="Jwift_PopoverMenuBackLabel" [text]="_parentTitle() ?? ''" />
        </jiv>
      } @else if (Title()) {
        <jext class="Jwift_PopoverMenuHeader" [text]="Title() ?? ''" />
      }
      @for (item of _page().Items; track item.Key ?? $index) {
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

  protected readonly _ScrollLayout = computed(() => {
    const room = this._room ? this._room() : Infinity;
    return { MaxHeight: Number.isFinite(room) ? `${room}px` : 'none' };
  });

  private readonly _pushed = signal<readonly _Page[]>([]);
  protected readonly _atRoot = computed(() => this._pushed().length === 0);
  protected readonly _page = computed<_Page>(() => {
    const pushed = this._pushed();
    return pushed.length > 0 ? pushed[pushed.length - 1] : { Items: this.Items(), Title: this.Title() };
  });
  /** The title of the page a Back row returns to. */
  protected readonly _parentTitle = computed(() => {
    const pushed = this._pushed();
    if (pushed.length === 0) return null;
    const parent = pushed.length > 1 ? pushed[pushed.length - 2] : { Items: this.Items(), Title: this.Title() };
    return parent.Title;
  });

  private _unbindIndicator: (() => void) | null = null;

  RegisterRow(row: RowIndicatorRow): void { this._rowIndicator.RegisterRow(row); }
  UnregisterRow(row: RowIndicatorRow): void { this._rowIndicator.UnregisterRow(row); }

  ngOnInit(): void {
    this._styleLoader.Ensure(this._jss, 'GlassDropdown', GlassDropdownJss);
    this._unbindIndicator = this._rowIndicator.Bind(this._doc, () => true);
  }

  ngOnDestroy(): void {
    this._unbindIndicator?.();
  }

  PushPage(items: readonly PopoverMenuItem[], title: string | null): void {
    this._pushed.update((s) => [...s, { Items: items, Title: title }]);
    // Round 14, live ("a menu reopened fresh sometimes sticks on its first item"): the OLD page's rows
    // unregister as they're torn down, but `RowIndicator`'s own `_hovered`/`IndicatorLayout` never clear
    // on their own (`UnregisterRow` only clears `_hovered` for the SPECIFIC row being removed, and a
    // page swap can land the very first NEW row at the exact canvas position the pill was already
    // sitting at) -- the pill could keep reading as "on" over whatever NEW row happens to start where the
    // OLD one left off, with no real hover/press to back it. A fresh page starts with nothing highlighted.
    this._rowIndicator.Reset();
  }

  Back(): void {
    this._pushed.update((s) => s.slice(0, -1));
    this._rowIndicator.Reset(); // same reasoning as PushPage's own Reset, above.
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
      this.PushPage(item.Submenu(), item.SubmenuTitle ?? item.Label ?? null);
      return;
    }
    item.OnPick?.();
    this.Picked.emit(item);
    if (!item.Keep) this._popover?.OpenChange.emit(false);
  }
}
