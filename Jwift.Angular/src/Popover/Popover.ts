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
import type { JivHandle } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import { IsEscapeKey } from '../Internal/Keys';
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';
import GlassDropdownJss from '../GlassDropdown/GlassDropdown.jss';
import PopoverJss from './Popover.jss';
import {
  PlacePopover, PointInRect, PopoverTargetRect, POPOVER_PANEL_PADDING, RoomWaitStep, ShortfallBelow,
  type PopoverHold, type PopoverPlacement, type PopoverRect,
} from './Popover.Placement';
import {
  GlassCollapseOnto, GlassCollapseStyle, GlassMorphEnd, GlassMorphStart, GlassMotionFor, PrefersReducedMotion, type GlassMotion,
} from '../Morph/GlassMorph';
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
 * re-places as its anchor scrolls, and never overlaps the anchor. A `JivHost` frame that is itself the
 * panel's glass, mounted the way a `<sheet>` is — the consumer gates it with `@if` and the mount/unmount IS
 * the open/close: a menu grows out of its anchor's own glass and collapses back into it (`Morph/GlassMorph.ts`).
 * `[(Open)]` and `Closed` exist so an outside tap or Escape can tell the consumer to flip the signal that
 * gates it.
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
  template: `<ng-content />`,
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
  /** The box the panel must stay inside. `null` (the default) is the canvas, inset 8pt above and concentric with the
   *  screen's corners below and beside (`_resolveRegion`), plus the device's safe areas plus `TopInset`, and below the
   *  page's top band (`JWIFT_POPOVER_TOP_BAND`). */
  readonly Region = input<PopoverRect | null>(null);
  /** Extra clearance from the region's own top — e.g. a floating header the popover must clear. */
  readonly TopInset = input(0);
  readonly Width = input(250);
  /** How wide content that sizes itself (`ContentWidth`) may grow the panel past `Width`. */
  readonly MaxWidth = input(360);
  /** What the panel's glass grows out of and collapses back into (`Morph/GlassMorph.ts`) where that is not the anchor
   *  itself: a word whose control places against its whole sentence (a band) grows from the word's own highlight.
   *  Null (the default) is the anchor. A fixed rect, or a function read as the panel opens and closes. */
  readonly Origin = input<PopoverRect | (() => PopoverRect | null) | null>(null);
  /** The origin's corner radius in canvas px (`GlassMorphStart`): a word's highlight. Null (the default) is a
   *  capsule, the shape of every glass control and pill a menu opens from. */
  readonly OriginRadius = input<number | null>(null);
  /** The panel's own corner in canvas px, or null (the default) for the house menu's (`@JwiftDropdownRadius`). A menu
   *  grown over a control that stands in its container's corner takes the container's concentric corner there, the
   *  control's own, so its corner nests in the container's rather than overhanging it (Drill Sentences lane XX3, item 2:
   *  the selection bar's "…" menu, 18-selmore.png). */
  readonly Radius = input<number | null>(null);
  /** The glass control the menu grows out of (a glass button, a title): while the menu stands open its glass IS the
   *  control's, so the control is not drawn beside it, and it is drawn again as the menu collapses back into it
   *  (Drill Sentences lane WW1, item 3). A press where it stood closes the menu, as a press on it would. Null for an
   *  anchor that is no control (a word, a dot on a rail). */
  readonly Source = input<{ readonly Node: JivHandle } | null | undefined>(null);
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
  /**
   * Asked once, before the first placement, when the whole panel does not fit below its anchor: how many px more it
   * needs there (`ShortfallBelow`). The host makes room if it can (scrolls the anchor's list up, raises its sheet) and
   * answers true; the panel then shows at once below its anchor and rides it up while the room opens, until it fits
   * there and the anchor stands still (`RoomWaitStep`; past the host's time, wherever it fits). Asked again as
   * a held panel that opened below takes a taller page (a submenu). Drill Sentences lane UU3, item 7 (a round 24 phone
   * tester's join menu opened above its row with room for two rows, and the count wheel covered the transport); lane
   * XX2, item 4 (round 25: the wheel waited unseen for the sheet to rise and settle, about 1.5s).
   */
  readonly MakeRoom = input<((shortfall: number, anchor: PopoverRect) => boolean) | null>(null);

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

  // ── Room under the anchor (`MakeRoom`, lane UU3, item 7) ─────────────────────────────────────────────
  private _roomAsked = false;
  /** The tallest page room has been asked for, or found to fit, below a held panel. */
  private _roomHeight = 0;
  /** While the host makes room: when it was asked, and the anchor as it stood since it last moved. */
  private _roomWait: { readonly Since: number; StillSince: number; At: string } | null = null;
  /** While the room opens (`_makingRoom`, lane XX2, item 4): the anchor the panel was placed below, null otherwise. The
   *  panel keeps that placement and rides its anchor by a visual translate of itself and everything in it (`_ride`, px),
   *  so its glass and its rows move with the word as one and its growth from the word runs undisturbed. A placement
   *  moved every frame would set the glass gliding on its own 350ms ease behind rows snapped to their places. Once the
   *  room is made the panel lands on its real placement and the translate goes, in one commit (`_place`). */
  private _rideFrom: PopoverRect | null = null;
  private readonly _ride = signal<{ readonly X: number; readonly Y: number }>({ X: 0, Y: 0 });

  /** Whether the host is still making room under the anchor this frame (`RoomWaitStep`): the panel then stands below its
   *  anchor, shown and riding it up (`PopoverPlacementInput.MakingRoom`), never unseen (lane XX2, item 4). */
  private _makingRoom(anchor: PopoverRect, region: PopoverRect, h: number, over: boolean): boolean {
    const maker = this.MakeRoom();
    if (!maker) return false;
    const now = performance.now();
    const at = `${anchor.X},${anchor.Y},${anchor.Width},${anchor.Height}`;
    if (this._placement() === null && !this._roomAsked) {
      this._roomAsked = true;
      this._roomHeight = h;
      const short = ShortfallBelow(anchor, region, h, over);
      if (short > 0.5 && maker(short, anchor)) {
        this._roomWait = { Since: now, StillSince: now, At: at };
      }
    } else if (this._hold?.Down && !this._hold.Side && h > this._roomHeight + 0.5) {
      // A held panel's room is everything under its top, which rides the anchor's top.
      this._roomHeight = h;
      const short = h - (region.Y + region.Height - (anchor.Y + this._hold.TopFromAnchor));
      if (short > 0.5) maker(short, anchor);
    }
    const wait = this._roomWait;
    if (!wait) return false;
    if (wait.At !== at) { wait.At = at; wait.StillSince = now; }
    // Made only once the panel fits below the word where the word has come to rest (`RoomWaitStep`), never on a word that
    // paused before the room was made.
    const step = RoomWaitStep({ Shortfall: ShortfallBelow(anchor, region, h, over), StillFor: now - wait.StillSince, Elapsed: now - wait.Since });
    if (step === 'Rising') return true;
    this._roomWait = null;
    return false;
  }

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

  // ── The open and the close (Drill Sentences lane WW1, item 3) ────────────────────────────────────────
  // The panel is unseen until it is placed, its height measured (a room still being made under it places it below its
  // anchor at once: `MakeRoom`). The frame after its first placement it shows: a menu's glass from the anchor's own rect and corner, springing to its placement
  // (`Jwift_Popover_Morph`), a passive tip or a reduced motion reader's in place (`Jwift_Popover_Fade`).
  /** How it opened, or null while it is still unseen. */
  private readonly _shown = signal<GlassMotion | null>(null);
  /** Placed and not yet shown: the next placement frame shows it. */
  private _showPending = false;
  /** While the glass grows: where its box ends and the frames it has had, until its corner is let go. */
  private _growing: { readonly End: { readonly X: number; readonly Y: number; readonly Width: number }; Frames: number } | null = null;
  /** Set as it leaves, so the leaving apply wears the close (`Jwift_Popover_Closing`). */
  private _closing = false;
  /** The source control and everything drawn in it that this panel hid as it opened (`Source`), drawn again as it
   *  closes; null while nothing is hidden. */
  private _hiddenSource: JivHandle[] | null = null;

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
    super('Popover', PopoverJss, 'Jwift_Popover', () => {
      if (this._closing) return 'Jwift_Popover_Closing';
      const shown = this._shown();
      return shown === 'Morph' ? 'Jwift_Popover_Morph' : shown === 'Fade' ? 'Jwift_Popover_Fade' : 'Jwift_Popover';
    });
    // The panel's radius is @JwiftDropdownRadius, declared in GlassDropdown.jss (the house menu/popover chain's
    // one shared number) — ensured here rather than left to whatever content happens to be projected, since not
    // every Popover holds a PopoverMenu.
    this._styleLoader.Ensure(this._jss, 'GlassDropdown', GlassDropdownJss);
    effect(() => {
      const p = this._placement();
      // Lane XX2, item 4: the ride and the placement go out together, so the landing moves nothing on screen.
      const ride = this._ride();
      const patch: Record<string, unknown> = { Width: `${this._width()}pt`, VisualTranslate: `${ride.X}px ${ride.Y}px` };
      if (p) {
        patch['Top'] = `${p.Y}px`;
        patch['Left'] = `${p.X}px`;
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
        // Lane XX2, item 4: a panel riding its anchor up stands its ride away from its box.
        const ride = this._ride();
        const px = e.clientX - rect.left - ride.X, py = e.clientY - rect.top - ride.Y;
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
        // Lane WW1, item 3: a hidden source control takes no press, so a press where it stood is this
        // panel's own close.
        const anchor = this._resolveAnchor();
        if (anchor && PointInRect(px + ride.X, py + ride.Y, anchor) && !this._hiddenSource) return;
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
    // fading out at its own spring's pace, an empty pane for most of it. The panel and everything in it leave together:
    // a menu collapsing back into the control it grew from (lane WW1, item 3), fading as it goes, a tip fading in place.
    const drawn = this.Node.Height;
    const leave: Record<string, unknown> = { ...(drawn > 0 ? { Height: `${drawn}px` } : {}), Opacity: '0' };
    const origin = this._shown() === 'Morph' ? this._leavingOrigin() : null;
    if (origin && this.Node.Width > 0 && drawn > 0) {
      Object.assign(leave, GlassCollapseStyle(GlassCollapseOnto({ X: this.Node.X, Y: this.Node.Y, Width: this.Node.Width, Height: drawn }, origin)));
    }
    this._closing = true;
    this._showSource();
    this._detachOnDestroy(leave);
  }

  /** Hides the source control, its label and glyph with it, as the panel's glass takes its place (`Source`). Jaui's
   *  `Visible` hides one node and still draws its children, so each node of the control that is drawn is hidden, and
   *  only those are drawn again. Set before the open's `MorphFrom`, so both reach the worker in one batch and the
   *  control and the panel are never drawn side by side. */
  private _hideSource(): void {
    const root = this.Source()?.Node ?? null;
    if (!root) return;
    const hidden: JivHandle[] = [];
    const stack = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.Visible) { node.Visible = false; hidden.push(node); }
      for (const child of node.Children) stack.push(child);
    }
    this._hiddenSource = hidden;
  }

  /** Draws the source control again under the collapsing glass, unless it went first. */
  private _showSource(): void {
    const hidden = this._hiddenSource;
    this._hiddenSource = null;
    for (const node of hidden ?? []) if (node.Parent) node.Visible = true;
  }

  /** What the glass grows out of: `Origin`, else the anchor. */
  private _resolveOrigin(): PopoverRect | null {
    const o = this.Origin();
    if (o === null) return this._resolveAnchor();
    return typeof o === 'function' ? o() : o;
  }

  /** The origin as the panel leaves, or null: its owner may be going with it, and a getter reading a destroyed view
   *  then has nothing to say. */
  private _leavingOrigin(): PopoverRect | null {
    try {
      return this._resolveOrigin();
    } catch {
      return null;
    }
  }

  /** Shows the panel the frame after its first placement, and lets a grown panel's corner go once its glass has
   *  started out from the anchor. */
  private _stepOpen(p: PopoverPlacement): void {
    if (this._showPending) {
      this._showPending = false;
      const origin = this._resolveOrigin();
      this._hideSource();
      if (!origin || GlassMotionFor(this.PassThrough(), PrefersReducedMotion(this._doc)) === 'Fade') {
        this._settleRadius();
        this._shown.set('Fade');
        return;
      }
      // A panel riding its anchor up (`_ride`) grows from where the origin stands within its own placement.
      const anchor = this._rideFrom ? this._resolveAnchor() : null;
      const ride = anchor && this._rideFrom ? { X: anchor.X - this._rideFrom.X, Y: anchor.Y - this._rideFrom.Y } : { X: 0, Y: 0 };
      const start = GlassMorphStart({ ...origin, X: origin.X - ride.X, Y: origin.Y - ride.Y }, this.OriginRadius());
      const end = GlassMorphEnd({ X: p.X, Y: p.Y, Width: this._width(), Height: this._placedHeight }, p.MaxHeight,
        this.Radius() ?? this._jss.VarPoints('JwiftDropdownRadius'));
      this._growing = { End: { X: end.X, Y: end.Y, Width: end.Width }, Frames: 0 };
      // The box springs from the anchor (Jaui's `MorphFrom`), and the shown class and the anchor's corner go in the
      // same batch, so the glass is never drawn at its placement before it grows.
      this.Node.SnapLayout = false;
      this.Node.MorphFrom(start);
      this._shown.set('Morph');
      this.SetStyleOverrideNow({ BorderRadius: `${start.Radius}px` });
      return;
    }
    const growing = this._growing;
    if (!growing) return;
    growing.Frames++;
    // The worker has drawn the glass at the anchor once its box stands off the placement: the corner springs to the
    // panel's own from there. A box that never stands off it (an anchor the panel's own size) lets go after a few frames.
    const n = this.Node;
    const started = Math.abs(n.X - growing.End.X) > 0.5 || Math.abs(n.Y - growing.End.Y) > 0.5 || Math.abs(n.Width - growing.End.Width) > 0.5;
    if (!started && growing.Frames < 8) return;
    this._growing = null;
    this._settleRadius();
  }

  /** The panel's corner once it stands open: its own (`Radius`), else the house menu's from its sheet. */
  private _settleRadius(): void {
    const radius = this.Radius();
    if (radius === null) this.ClearStyleOverride('BorderRadius');
    else this.SetStyleOverride({ BorderRadius: `${radius}px` });
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

  /** A menu that is its control's own glass (`Source`) stands over the control, wherever it is, so it covers its own
   *  toolbar's band (the show's title) rather than keeping below it as a panel opened from elsewhere does.
   *
   *  CONCENTRIC WITH THE SCREEN'S CORNERS AND A SHEET'S (Drill Sentences lane XX3, item 2; a round 25 blind phone tester's
   *  March submenu ran its bottom edge along the sheet's, into the sheet's rounded corner, 11-march.png). The panel kept
   *  8pt from the screen, exactly where a bottom sheet's own edge stands (`@JwiftSheetInset`), so a panel opened low in a
   *  sheet lay flush with it. Below and beside it now keeps the house dropdown's margin (`GlassDropdown`'s `_fitToRoom`):
   *  the screen's corner less the panel's, so its corner shares the screen's centre, and a sheet's too (the sheet's
   *  corner is the screen's less its own inset). A menu grown over its control stands where the control does, inside
   *  whatever holds the control, and keeps the plain 8pt. */
  private _resolveRegion(canvasWidth: number, canvasHeight: number, over: boolean): PopoverRect {
    const custom = this.Region();
    if (custom) return custom;
    const gap = 8;
    const edge = over ? gap : this._jss.VarPoints('JwiftScreenRadius') - this._jss.VarPoints('JwiftDropdownRadius');
    const top = gap + this._envVar('SafeTop') + Math.max(this.TopInset(), over ? 0 : this._topBand?.() ?? 0);
    const bottom = edge + this._envVar('SafeBottom');
    return {
      X: edge,
      Y: top,
      Width: Math.max(0, canvasWidth - 2 * edge),
      Height: Math.max(0, canvasHeight - top - bottom),
    };
  }

  private _place(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;
    const anchor = this._resolveAnchor();
    if (!anchor) return;
    const placed = this._placement();
    if (placed) {
      this._openSnap.ReleaseOn(this.Node, placed);
      this._stepOpen(placed);
    }
    // Drill Sentences lane V2, item 3: "the phrase dropdown's row positions shift between opens, so the
    // same tap picked different phrases." Root cause, found here rather than in the menu: the frame is
    // `Height: MinContent`, so its first `Node.Height` read is 0 — this used to fall back to a guessed
    // 240 and commit an up/down decision on THAT, then re-placed moments later once the real content
    // height came in, which could FLIP the decision (`PlacePopover`'s own `PrevDown !== null` branch uses
    // a tighter 140pt threshold than the first guess's 240) and visibly reposition every row mid-open,
    // while the panel is still growing in (`Popover.jss`'s own 0.4s spring) — fast enough for a
    // second tap aimed at the FIRST layout to land on whatever the SECOND one put there instead. Waiting
    // for a real measurement before ever committing a placement means the first placement this popover
    // ever shows is already the one it settles on — nothing left to flip out from under a reader's finger.
    if (this._placement() === null && this.Node.Height <= 0) return;
    const rect = el.getBoundingClientRect();
    // Lane WW1, item 3: a menu from a glass control covers the control, growing from it (`PlacePopover`'s `Over`).
    const over = !!this.Source();
    const region = this._resolveRegion(rect.width, rect.height, over);
    const scrolls = this._scrollers.length > 0;
    const h = this._naturalHeight(scrolls);
    const w = this._width();
    const making = this._makingRoom(anchor, region, h, over);
    // Lane XX2, item 4: while the room opens the panel keeps its placement and rides its anchor (`_rideFrom`).
    if (making && this._rideFrom && placed) {
      this._ride.set({ X: anchor.X - this._rideFrom.X, Y: anchor.Y - this._rideFrom.Y });
      return;
    }
    const landing = !making && this._rideFrom !== null;
    const beside = this.Beside();
    const avoid = this.Avoid();
    const key = `${anchor.X},${anchor.Y},${anchor.Width},${anchor.Height}|${region.X},${region.Y},${region.Width},${region.Height}|${Math.round(h)}|${w}|${scrolls}|${beside}`
      + `|${avoid.map((r) => `${r.X},${r.Y},${r.Width},${r.Height}`).join(';')}|${making}`;
    if (key === this._placeKey) return;
    this._placeKey = key;
    const placement = PlacePopover({
      Anchor: anchor, Region: region, W: w, H: h, PrevDown: this._prevDown, Hold: this._hold, Scrolls: scrolls, Beside: beside, Avoid: avoid,
      Over: over, MakingRoom: making,
    });
    // The first placement moves the whole subtree off the spot its first layout put it; it lands there, unseen, and
    // shows on the next frame (`_stepOpen`).
    if (placed === null) {
      this._openSnap.Hold(this.Node);
      this._showPending = true;
    } else if (landing && (this._ride().X !== 0 || this._ride().Y !== 0)) {
      // The room is made: the panel lands on its real placement as its ride goes, snapped in the one commit that carries
      // both, so nothing moves on screen; it and its rows let go once it stands there (`OpenSnap.ReleaseOn`).
      this._openSnap.Hold(this.Node);
    }
    this._rideFrom = making ? anchor : null;
    if (landing) this._ride.set({ X: 0, Y: 0 });
    this._prevDown = placement.Down;
    this._placedHeight = h;
    // Whole while the room opens under it; capped, for content that scrolls, once it is made.
    this._capped.set(scrolls && !making);
    this._placement.set(placement);
    // Held where it lands once the room is made, never where the rising sheet carried it on the way.
    if (this.HoldOnOpen() && !making) this.HoldPlacement();
  }
}
