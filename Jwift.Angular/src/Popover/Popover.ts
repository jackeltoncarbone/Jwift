import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  type Signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Jaui, Jiv, JSS_REGISTRY } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { IsEscapeKey } from '../Internal/Keys';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';
import PaperJss from '../Paper/Paper.jss';
import GlassDropdownJss from '../GlassDropdown/GlassDropdown.jss';
import PopoverJss from './Popover.jss';
import {
  ArrowShows, ArrowTop, PlacePopover, PointInRect, PopoverTargetRect, POPOVER_PANEL_PADDING, type PopoverHold, type PopoverPlacement, type PopoverRect,
} from './Popover.Placement';
import { SwallowPress } from './Popover.OutsidePress';
import { OpenSnap } from './Popover.OpenSnap';

export type { PopoverRect };

/** The room a Popover's open panel holds for its content, in canvas px: the panel's capped height less its
 *  own padding. PopoverMenu caps its scroll body with it; fixed-size content simply ignores it. `Infinity`
 *  before the first placement runs. */
export const JWIFT_POPOVER_ROOM = new InjectionToken<Signal<number>>('JWIFT_POPOVER_ROOM');

/** How far a page's own top chrome reaches below the device's safe top, in canvas px (a toolbar's row), read on every
 *  placement. Every popover under the provider keeps its panel below that band, as it keeps clear of the canvas edge,
 *  so no panel covers the toolbar's controls (Drill Sentences lane QQ2, item 3: the who chooser hid Undo). */
export const JWIFT_POPOVER_TOP_BAND = new InjectionToken<() => number>('JWIFT_POPOVER_TOP_BAND');

/** What closed the popover — the swipe-dismiss / tap-outside distinction a consumer's own "closes on
 *  the same word, doesn't reopen" guard needs (lane E's job; see LaneC.md risk 10). */
export interface PopoverClosed {
  readonly ByOutsideTap: boolean;
  readonly At: number;
}

/**
 * `<popover>`: an anchored panel that prefers below the word it points at, keeps its side across
 * re-places as its anchor scrolls, and never overlaps the anchor. A `JivHost` frame, mounted the way a
 * `<sheet>` is — the consumer gates it with `@if` and the mount/unmount IS the open/close, which is
 * what makes the frame's own `Opacity: Presence` grow/fade work. `[(Open)]` and `Closed` exist so an
 * outside tap or Escape can tell the consumer to flip the signal that gates it.
 *
 *   @if (open()) {
 *     <popover [TeleportTo]="JWIFT_SHEET_OUTLET" [Anchor]="anchorFn" [(Open)]="open" (Closed)="onClosed($event)">
 *       <popover-menu [Items]="items" />
 *     </popover>
 *   }
 *
 * The consumer MUST pass `[TeleportTo]="JWIFT_SHEET_OUTLET"` (`Popover` is a `JivHost`, so `TeleportTo`
 * is inherited) — the outlet is full-viewport at the canvas origin with PointScale 1, so popover
 * coordinates equal canvas coordinates and `Anchor`'s rect needs no further conversion.
 */
@Component({
  selector: 'popover',
  standalone: true,
  imports: [Jiv],
  template: `
    <jiv class="Jwift_PaperSurface Jwift_PopoverArrow" [style]="_ArrowStyle()" [childLayout]="_ArrowLayout()" />
    <jiv class="Jwift_PaperSurface Jwift_PopoverSurface" />
    <ng-content />
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Popover) },
    { provide: JWIFT_POPOVER_ROOM, useFactory: () => inject(Popover)._room },
  ],
})
export class Popover extends JivHost implements OnInit, OnDestroy {
  /** Uncontrolled escape hatch aside, the primary control: a consumer wraps `<popover>` in `@if` on
   *  this same signal (see the class doc), so by the time this component exists it is meant to be
   *  open. Kept as a real input/output pair (not inferred from "I am mounted") so the document
   *  listeners below have one thing to check, exactly as GlassDropdown's do. */
  readonly Open = input<boolean>(true);
  readonly OpenChange = output<boolean>();
  readonly Closed = output<PopoverClosed>();

  /** The word/control the popover points at, in canvas px — a fixed rect, or a function read every
   *  placement frame so the popover follows its anchor across a scroll. */
  readonly Anchor = input.required<PopoverRect | (() => PopoverRect | null)>();
  /** The box the panel must stay inside. `null` (the default) is the canvas, inset 8pt plus the
   *  device's safe areas plus `TopInset`, and below the page's top band (`JWIFT_POPOVER_TOP_BAND`). */
  readonly Region = input<PopoverRect | null>(null);
  /** Extra clearance from the region's own top — e.g. a floating header the popover must clear. */
  readonly TopInset = input(0);
  readonly Width = input(250);
  /** How wide content that sizes itself (`ContentWidth`) may grow the panel past `Width`. */
  readonly MaxWidth = input(360);
  readonly Arrow = input(true);
  /** The accessibility name for the panel. */
  readonly Label = input<string | null>(null);
  /** Drill Sentences lane BB2, item 2: the panel holds the placement it opens with until it closes
   *  (`HoldPlacement`), for content that reflows its own anchor: a count wheel's every tap rewrites the
   *  sentence it points at, and a panel re-placed on each one moved its − button out from under the finger. */
  readonly HoldOnOpen = input(false);
  /** A passive panel with nothing to press (a hover tip): a press outside it closes it and still reaches what
   *  it lands on. Every other popover swallows that press (`SwallowPress`, lane BB2, item 3). */
  readonly PassThrough = input(false);
  /** The right edge of the column the anchor sits in, canvas px, to open beside it rather than over the
   *  column's other rows (`PopoverPlacementInput.Beside`, Drill Sentences lane EE2, item 4), or null. */
  readonly Beside = input<number | null>(null);
  /** What a panel opened `Beside` its column keeps clear of where it can, canvas px (`PopoverPlacementInput.Avoid`,
   *  Drill Sentences lane GG2, item 4: the squads a count wheel's sentence names). */
  readonly Avoid = input<readonly PopoverRect[]>([]);

  private readonly _jss = inject(JSS_REGISTRY);
  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _doc = inject(DOCUMENT);
  private readonly _styleLoader = inject(JwiftStyleLoader);
  private readonly _topBand = inject(JWIFT_POPOVER_TOP_BAND, { optional: true });

  private readonly _placement = signal<PopoverPlacement | null>(null);
  /** Whether the last placement may cap the panel: only while content that scrolls is mounted. */
  private readonly _capped = signal(false);
  /** Published through `JWIFT_POPOVER_ROOM`. */
  readonly _room = computed(() => {
    const p = this._placement();
    return p ? Math.max(0, p.MaxHeight - 2 * POPOVER_PANEL_PADDING) : Infinity;
  });

  // ── The natural height (Drill Sentences lane AA2, items 1 and 2) ────────────────────────────────────
  // Placement used to read `Node.Height` as the panel's natural height on every frame. Once a placement
  // capped the panel, that read came back as the CAP, so the next placement measured the cap, never the
  // content, and could never learn the panel no longer fit. A fixed-height count wheel capped that way
  // (it cannot shrink) spilled out of its own frame over the very line it edits. Content that scrolls
  // registers itself (`AddScroller`), optionally reporting the height it would have uncapped; anything
  // else is never capped at all, and its own measured height is its natural one.
  private readonly _scrollers: { readonly ContentHeight: (() => number) | null }[] = [];
  /** The last height measured while the panel was not capped. */
  private _measuredNatural = 0;

  /** Content that scrolls within the panel's room calls this when it mounts (PopoverMenu, a chooser with
   *  its own scroll body) and the returned release when it goes. `contentHeight` reads the content's
   *  whole unscrolled height, px, panel padding excluded; 0 (not measured yet) falls back to the
   *  panel's own last uncapped measurement. */
  AddScroller(contentHeight: (() => number) | null = null): () => void {
    const entry = { ContentHeight: contentHeight };
    this._scrollers.push(entry);
    this._placeKey = '';
    return () => {
      const i = this._scrollers.indexOf(entry);
      if (i >= 0) this._scrollers.splice(i, 1);
      this._placeKey = '';
    };
  }

  private _naturalHeight(scrolls: boolean): number {
    const measured = this.Node.Height;
    const p = this._placement();
    const capped = scrolls && p !== null && measured >= p.MaxHeight - 0.5;
    this._measuredNatural = capped ? Math.max(this._measuredNatural, measured) : measured;
    for (const scroller of this._scrollers) {
      const content = scroller.ContentHeight?.() ?? 0;
      if (content > 0) return content + 2 * POPOVER_PANEL_PADDING;
    }
    return this._measuredNatural;
  }

  /** The width its content asks for, px, or null to keep `Width`. Drill Sentences lane Y3, item 5: a
   *  `<popover-menu>` measures its widest row and sets this, so the panel fits "Move with other squads…"
   *  instead of cutting it off at a fixed 250; past `MaxWidth` its rows wrap. */
  readonly ContentWidth = signal<number | null>(null);
  protected readonly _width = computed(() => {
    const content = this.ContentWidth();
    const min = this.Width();
    return content === null ? min : Math.min(Math.max(min, content), Math.max(min, this.MaxWidth()));
  });

  /** Set once the content starts changing in place (`HoldPlacement`), and kept for the rest of the open. */
  private _hold: PopoverHold | null = null;

  /** Drill Sentences lane Y3, item 6: a `<popover-menu>` pushing or popping a page calls this first, so
   *  the panel stays where it stands (`PopoverHold`) while its rows change, rather than jumping to wherever
   *  a fresh placement for the new page's height would put it. */
  HoldPlacement(): void {
    if (this._hold) return;
    const p = this._placement();
    const anchor = this._resolveAnchor();
    if (!p || !anchor) return;
    this._hold = { Down: p.Down, Side: p.Side, X: p.X, TopFromAnchor: p.Y - anchor.Y };
    this._placeKey = '';
  }
  /** A new anchor (the same panel handed to another word) places afresh. */
  private _heldAnchor: PopoverRect | (() => PopoverRect | null) | null = null;
  private readonly _releaseHold = effect(() => {
    const anchor = this.Anchor();
    if (anchor === this._heldAnchor) return;
    this._heldAnchor = anchor;
    this._hold = null;
    this._placeKey = '';
  });

  protected readonly _ArrowLayout = computed(() => {
    const p = this._placement();
    if (!p) return { Position: 'Placed' as const };
    // Beside its anchor's column (lane EE2, item 4), the arrow stands on the panel's left edge.
    if (p.Side) return { Position: 'Placed' as const, Left: '-8.5px', Top: `${(p.ArrowY ?? p.Y) - p.Y - 8.5}px` };
    // Lane II2, item 6: on the bottom the placement gives the panel, never its trailing watched height (`ArrowTop`).
    return { Position: 'Placed' as const, Left: `${p.ArrowX - p.X - 8.5}px`, Top: `${ArrowTop(p, this._placedHeight)}px` };
  });
  /** The panel's height as last drawn (`Node.Height`), read each placement frame: the arrow shows only once the
   *  panel stands at the height its placement gave it (`ArrowShows`). */
  private readonly _drawnHeight = signal(0);
  protected readonly _ArrowStyle = computed(() => {
    const p = this._placement();
    const hidden = !this.Arrow() || !p || !ArrowShows(p, this._placedHeight, this._drawnHeight());
    return { Opacity: hidden ? '0' : '1', PointerEvents: 'None' as const };
  });

  /** Lane DD2, item 1: the content lands on the placement it opens with rather than gliding to it
   *  (`Popover.OpenSnap.ts`), so a control is hit where it is drawn from the first placed frame. */
  private readonly _openSnap = new OpenSnap();

  private _unbindDoc: (() => void) | null = null;
  private _raf: number | null = null;
  private _prevDown: boolean | null = null;
  /** The natural height the last placement was made for (`PopoverTargetRect`). */
  private _placedHeight = 0;
  private _placeKey = '';

  constructor() {
    super('Popover', PopoverJss, 'Jwift_Popover', () => 'Jwift_Popover');
    // Popover's own surface material is Paper's (Jwift_PaperSurface); ensure that sheet is in the
    // registry too, the same way a sheet reaches across to borrow another component's classes
    // (`JwiftStyleLoader.Ensure(registry, 'GlassDropdown', GlassDropdownJss)` is the house pattern).
    this._styleLoader.Ensure(this._jss, 'Paper', PaperJss);
    // Jwift_PopoverSurface's own radius is @JwiftDropdownRadius, declared in GlassDropdown.jss (the
    // house menu/popover chain's one shared number) — ensured here rather than left to whatever
    // content happens to be projected, since not every Popover holds a PopoverMenu.
    this._styleLoader.Ensure(this._jss, 'GlassDropdown', GlassDropdownJss);
    effect(() => {
      const p = this._placement();
      const patch: Record<string, unknown> = { Width: `${this._width()}pt` };
      if (p) {
        patch['Top'] = `${p.Y}px`;
        patch['Left'] = `${p.X}px`;
        patch['VisualOrigin'] = `${p.OriginX} ${p.OriginY}`;
      }
      this.SetStyleOverride(patch);
      // Only a panel whose content scrolls is ever capped (`_naturalHeight`'s own comment above).
      if (p && this._capped()) this.SetStyleOverride({ MaxHeight: `${p.MaxHeight}px` });
      else this.ClearStyleOverride('MaxHeight');
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
    this.Node.WatchRect(true);

    const onDocDown = (e: PointerEvent): void => {
      if (!this.Open()) return;
      const el = this._canvasRef?.Canvas?.Element;
      if (el) {
        const rect = el.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        const n = this.Node;
        if (PointInRect(px, py, { X: n.X, Y: n.Y, Width: n.Width, Height: n.Height })) return;
        // Lane CC1, item 5: the watched rect trails each placement by a frame or more, so a row picked while
        // the panel grows in is judged against the box its rows are laid out in (`PopoverTargetRect`) too.
        const p = this._placement();
        if (p && PointInRect(px, py, PopoverTargetRect(p, this._width(), this._placedHeight))) return;
        // The toggle bug (LaneM.md): a press on the ANCHOR — the button that opened this popover —
        // used to read as "outside" (the anchor lives outside the panel's own Node), so this fired
        // close() on pointerdown, and the anchor's own click handler reopened it right after on the
        // same gesture: close-then-reopen read as "nothing happened" on a second press, or a visible
        // flicker. The anchor is where a press is MEANT to toggle, not dismiss — treat it as inside,
        // same as the panel itself, and leave the toggle decision to the anchor's own click handler.
        const anchor = this._resolveAnchor();
        if (anchor && PointInRect(px, py, anchor)) return;
      }
      // Lane BB2, item 3: the press that closes a popover does nothing else, like iOS. It used to reach the
      // canvas too, and a tap meant to close the count picker opened another row's "•••" menu.
      if (!this.PassThrough()) SwallowPress(this._doc, e);
      this.OpenChange.emit(false);
      this.Closed.emit({ ByOutsideTap: true, At: Date.now() });
    };
    const onKey = (e: KeyboardEvent): void => {
      if (!this.Open()) return;
      if (!IsEscapeKey(e)) return;
      this.OpenChange.emit(false);
      this.Closed.emit({ ByOutsideTap: false, At: Date.now() });
    };
    const onResize = (): void => this._place();
    this._doc.addEventListener('pointerdown', onDocDown, true);
    this._doc.addEventListener('keydown', onKey);
    this._doc.defaultView?.addEventListener('resize', onResize, { passive: true });
    this._unbindDoc = () => {
      this._doc.removeEventListener('pointerdown', onDocDown, true);
      this._doc.removeEventListener('keydown', onKey);
      this._doc.defaultView?.removeEventListener('resize', onResize);
    };

    this._startTracking();
  }

  ngOnDestroy(): void {
    this._stopTracking();
    this._unbindDoc?.();
    // Drill Sentences lane KK1, item 6 (a round 15 blind phone tester: after the count picker's Done, an empty glass
    // outline stood under the "M5-12" pill). The panel and every row in it leave together, and Jaui lays a leaving
    // child out of its parent at once (`Layout.Intrinsic.ts`), so this `Height: MinContent` panel collapsed to its
    // own padding and faded out as an empty sliver of glass. It leaves at the height it was drawn, its rows fading
    // in place inside it.
    //
    // Drill Sentences lane TT1, item 3 (a round 23 blind desktop tester picked "standfast" from a "+" menu, and an empty
    // frame of the panel stood over the field for about a second): the rows went first, and the panel's glass went on
    // fading out at its own spring's pace, an empty pane for most of it. A menu that closes goes at once, as an Apple
    // menu does on a pick: the panel and everything in it leave invisible, together, and the node goes once its
    // Presence settles.
    const drawn = this.Node.Height;
    this._detachOnDestroy({ ...(drawn > 0 ? { Height: `${drawn}px` } : {}), Opacity: '0' });
  }

  private _startTracking(): void {
    if (this._raf !== null) return;
    const step = (): void => {
      this._raf = requestAnimationFrame(step);
      this._place();
    };
    this._raf = requestAnimationFrame(step);
  }

  private _stopTracking(): void {
    if (this._raf !== null) { cancelAnimationFrame(this._raf); this._raf = null; }
  }

  private _resolveAnchor(): PopoverRect | null {
    const a = this.Anchor();
    return typeof a === 'function' ? a() : a;
  }

  /** The device's safe-area inset (or any other already-resolved-px var Jaui publishes), as
   *  GlassDropdown reads `@SafeBottom`. */
  private _envVar(name: string): number {
    const raw = this._jss.Vars.get(name);
    const v = raw ? parseFloat(raw) : 0;
    return Number.isFinite(v) ? v : 0;
  }

  private _resolveRegion(canvasWidth: number, canvasHeight: number): PopoverRect {
    const custom = this.Region();
    if (custom) return custom;
    const gap = 8;
    const top = gap + this._envVar('SafeTop') + Math.max(this.TopInset(), this._topBand?.() ?? 0);
    const bottom = gap + this._envVar('SafeBottom');
    return {
      X: gap,
      Y: top,
      Width: Math.max(0, canvasWidth - 2 * gap),
      Height: Math.max(0, canvasHeight - top - bottom),
    };
  }

  private _place(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;
    const anchor = this._resolveAnchor();
    if (!anchor) return;
    const placed = this._placement();
    if (placed) this._openSnap.ReleaseOn(this.Node, placed);
    this._drawnHeight.set(this.Node.Height);
    // Drill Sentences lane V2, item 3: "the phrase dropdown's row positions shift between opens, so the
    // same tap picked different phrases." Root cause, found here rather than in the menu: the frame is
    // `Height: MinContent`, so its first `Node.Height` read is 0 — this used to fall back to a guessed
    // 240 and commit an up/down decision on THAT, then re-placed moments later once the real content
    // height came in, which could FLIP the decision (`PlacePopover`'s own `PrevDown !== null` branch uses
    // a tighter 140pt threshold than the first guess's 240) and visibly reposition every row mid-open,
    // while the panel is still growing in (`Popover.jss`'s own 0.4s `Presence` spring) — fast enough for a
    // second tap aimed at the FIRST layout to land on whatever the SECOND one put there instead. Waiting
    // for a real measurement before ever committing a placement means the first placement this popover
    // ever shows is already the one it settles on — nothing left to flip out from under a reader's finger.
    if (this._placement() === null && this.Node.Height <= 0) return;
    const rect = el.getBoundingClientRect();
    const region = this._resolveRegion(rect.width, rect.height);
    const scrolls = this._scrollers.length > 0;
    const h = this._naturalHeight(scrolls);
    const w = this._width();
    const beside = this.Beside();
    const avoid = this.Avoid();
    const key = `${anchor.X},${anchor.Y},${anchor.Width},${anchor.Height}|${region.X},${region.Y},${region.Width},${region.Height}|${Math.round(h)}|${w}|${scrolls}|${beside}`
      + `|${avoid.map((r) => `${r.X},${r.Y},${r.Width},${r.Height}`).join(';')}`;
    if (key === this._placeKey) return;
    this._placeKey = key;
    const placement = PlacePopover({
      Anchor: anchor, Region: region, W: w, H: h, PrevDown: this._prevDown, Hold: this._hold, Scrolls: scrolls, Beside: beside, Avoid: avoid,
    });
    // The first placement moves the whole subtree off the spot its first layout put it; it lands there.
    if (placed === null) this._openSnap.Hold(this.Node);
    this._prevDown = placement.Down;
    this._placedHeight = h;
    this._capped.set(scrolls);
    this._placement.set(placement);
    if (this.HoldOnOpen()) this.HoldPlacement();
  }
}
