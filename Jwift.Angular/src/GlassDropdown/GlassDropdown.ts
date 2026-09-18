import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Jaui, Jiv, JSS_REGISTRY } from 'jaui-angular';
import type { JivHandle } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import GlassDropdownJss from './GlassDropdown.jss';

/** The gap a floating glass surface keeps from the edge of the screen. Not invented here: the design
 *  system already names it. `Jwift.Glass.jss` derives `@JwiftSheetInset` as `@JwiftScreenRadius (52pt)
 *  - @JwiftSheetRadius (38pt)` = 14pt, the inset at which a sheet's corner nests concentrically inside
 *  the screen's. A menu is a sheet by another name, so it keeps the same distance. */
const SCREEN_GAP = 14;

/** The shortest a capped menu is allowed to be: the glass's 6pt padding, three 44pt rows and the two
 *  6pt gaps between them. Below three rows a menu stops reading as a list, so a panel with less room
 *  than this overhangs rather than shrinking into a stub. */
const PANEL_FLOOR = 6 + 3 * 44 + 2 * 6 + 6;

/** A row of an open menu, as the dropdown sees it: a hit rect plus the two
 *  facts that change how the shared indicator draws over it. */
export interface GlassDropdownRow {
  readonly Node: JivHandle;
  IsDisabled(): boolean;
}

@Component({
  selector: 'glass-dropdown',
  standalone: true,
  imports: [Jiv],
  template: `
    @if (IsOpen()) {
      <jiv #indicator [class]="_IndicatorClass()" [childLayout]="_IndicatorLayout()" />
    }
    <ng-content></ng-content>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => GlassDropdown) },
  ],
  host: { '(click)': '_onHostClick($event)' },
})
export class GlassDropdown extends JivHost implements OnInit, OnDestroy {
  private readonly _open = signal(false);
  private readonly _page = signal<string | null>(null);
  readonly IsOpen = this._open.asReadonly();
  readonly Page   = this._page.asReadonly();

  // The open menu has ONE highlight, shared by every row. Rows register
  // here; the dropdown hit-tests the pointer against their rects and
  // springs the indicator onto the row under it, so moving down a menu
  // slides one pill instead of lighting rows one by one.
  private readonly _indicator = viewChild<Jiv>('indicator');
  private readonly _rows = new Set<GlassDropdownRow>();
  private readonly _hovered = signal<GlassDropdownRow | null>(null);
  private readonly _pressed = signal(false);
  protected readonly _IndicatorLayout = signal<{ Left: string; Top: string; Width: string; Height: string } | undefined>(undefined);
  protected readonly _IndicatorClass = computed(() => {
    const row = this._hovered();
    if (!row) return 'Jwift_GlassDropdownIndicator';
    return this._pressed() ? 'Jwift_GlassDropdownIndicator_Pressed' : 'Jwift_GlassDropdownIndicator_On';
  });

  RegisterRow(row: GlassDropdownRow): void { this._rows.add(row); }
  UnregisterRow(row: GlassDropdownRow): void {
    this._rows.delete(row);
    if (this._hovered() === row) this._hovered.set(null);
  }

  private _rowAt(clientX: number, clientY: number): GlassDropdownRow | null {
    const canvas = this._canvasRef?.Canvas;
    if (!canvas) return null;
    const [x, y] = canvas.ClientToNodePoint(clientX, clientY);
    for (const row of this._rows) {
      if (row.IsDisabled()) continue;
      const n = row.Node;
      if (n.Width <= 0 || n.Height <= 0) continue;
      if (x >= n.X && x < n.X + n.Width && y >= n.Y && y < n.Y + n.Height) return row;
    }
    return null;
  }

  /** The indicator's box, relative to the dropdown, from the CURRENT geometry of both. */
  private _indicatorBoxFor(row: GlassDropdownRow): { Left: string; Top: string; Width: string; Height: string } {
    return {
      Left: `${row.Node.X - this.Node.X}px`,
      Top: `${row.Node.Y - this.Node.Y}px`,
      Width: `${row.Node.Width}px`,
      Height: `${row.Node.Height}px`,
    };
  }

  /**
   * Re-place the indicator on the row it is already on.
   *
   * WHY THIS EXISTS. `Left` is `row.X - dropdown.X`, read ONCE when the pointer enters a row. The open
   * menu animates Width and Height over 280ms and is anchored `Right: 0`, so while it grows the
   * dropdown's own X is still travelling LEFT while the rows are already laid out at their final
   * places. Hover a row inside that window and a stale offset is baked in, and the highlight sits off
   * to one side for as long as it stays on that row - horizontally only, because only the width is
   * animating. Jack: "sometimes the indicator is like offset the wrong way to the left ... I'm guessing
   * it's because the menu's mid-growing. But it decides a position or something."
   *
   * So the box is recomputed while the menu is still moving rather than trusted from one frame.
   */
  private _replaceIndicator(): void {
    const row = this._hovered();
    if (!row) return;
    const next = this._indicatorBoxFor(row);
    const now = this._IndicatorLayout();
    if (now && now.Left === next.Left && now.Top === next.Top
        && now.Width === next.Width && now.Height === next.Height) return;
    this._IndicatorLayout.set(next);
  }

  private _hover(row: GlassDropdownRow | null): void {
    const was = this._hovered();
    if (row === was) return;
    this._hovered.set(row);
    if (!row) { this._pressed.set(false); return; }
    // Placed: Left/Top are relative to the dropdown's own box.
    this._IndicatorLayout.set(this._indicatorBoxFor(row));
    // Arriving from nowhere: land on the row and fade in. Between rows: slide.
    const ind = this._indicator()?.Node;
    if (ind && !was) {
      ind.SnapLayout = true;
      requestAnimationFrame(() => { ind.SnapLayout = false; });
    }
  }

  /** Guards opening via a host (glass-background) click. A glass dropdown that
   *  would open to NO content renders as a flat empty sliver, which is the bug
   *  class this prevents: the consumer binds whether the page the host would
   *  open to actually has rows. Default true preserves the always-toggles
   *  behaviour for consumers that don't wire it. Closing is never gated. */
  readonly canOpen = input<boolean>(true);

  /** Page id pushed when the dropdown is opened by a host click (vs. a specific
   *  cell, which pushes its own page). Lets a single-page pill — e.g. the
   *  warnings group — open its page when tapped ANYWHERE on the glass, instead
   *  of opening to the empty root. null (default) opens the root page. */
  readonly defaultPage = input<string | null>(null);

  private readonly _canvasRef = inject(Jaui, { optional: true });
  /** INJECTED, never the global: this dropdown mounts inside surfaces that server-render, and the
   *  document-level listeners below reached for a global that a server render does not define. On
   *  the server they bind to the render's own document and simply never fire. */
  private readonly _doc = inject(DOCUMENT);
  private _unbindDoc: (() => void) | null = null;
  /** Read for `@SafeBottom` when the panel measures its room — the same table every sheet resolves
   *  `@Name` against, so the inset here is the inset the glass is using. */
  private readonly _jss = inject(JSS_REGISTRY);

  /** Extra class ANDed onto the closed pill — how the action group marks the
   *  avatar-only sink so the avatar can fill the glass. */
  readonly closedVariant = input<string | null>(null);

  constructor() {
    super('GlassDropdown', GlassDropdownJss, 'Jwift_GlassDropdown_Closed', () => {
      if (this._open()) return 'Jwift_GlassDropdown_Open';
      const extra = this.closedVariant();
      return extra ? `Jwift_GlassDropdown_Closed ${extra}` : 'Jwift_GlassDropdown_Closed';
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
    // Subscribe the dropdown's JivHandle to per-frame rect snapshots from
    // the worker. Without this, `Node.X / Y / Width / Height` stay at their
    // default 0 — and the outside-click bounds check below resolves to
    // `px >= 0 && px < 0` (false) for every tap. That dispatches `Close()`
    // on every menu-item tap before the item's own click handler ever fires,
    // making every dropdown item read as inert ("Sign In closes the menu
    // like it isn't a button"). Idempotent — the worker emits a snapshot
    // once per frame after the first call.
    this.Node.WatchRect?.(true);
    // Everything renders into a single <canvas>, so DOM contains() can't
    // tell if a click landed inside or outside the dropdown — target is
    // always the canvas element. Check the pointer's canvas-space coords
    // against the dropdown Jiv's rect instead.
    const onDocDown = (e: PointerEvent) => {
      if (!this._open()) return;
      const el = this._canvasRef?.Canvas?.Element;
      if (el) {
        const rect = el.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const n = this.Node;
        if (px >= n.X && px < n.X + n.Width && py >= n.Y && py < n.Y + n.Height) return;
      }
      this.Close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!this._open()) return;
      if (e.key === 'Escape') {
        if (this._page() !== null) this._page.set(null);
        else this.Close();
      }
    };
    const onDocMove = (e: PointerEvent) => {
      if (!this._open()) return;
      this._hover(this._rowAt(e.clientX, e.clientY));
    };
    const onDocPress = (e: PointerEvent) => {
      if (!this._open()) return;
      const row = this._rowAt(e.clientX, e.clientY);
      this._hover(row);
      this._pressed.set(row !== null);
    };
    const onDocRelease = () => { if (this._pressed()) this._pressed.set(false); };
    const onDocLeave = () => this._hover(null);
    // A window that gets shorter while a menu is open takes room away from it, and the cap is only as
    // current as its last measurement. Re-measure rather than leave a menu sized for a window that is
    // gone. Same reason the safe inset is re-read on resize one layer down, in Jaui's own host.
    const onResize = () => { if (this._open()) this._fitToRoom(); };
    this._doc.addEventListener('pointerdown', onDocDown, true);
    this._doc.addEventListener('pointerdown', onDocPress, true);
    this._doc.addEventListener('pointermove', onDocMove, true);
    this._doc.addEventListener('pointerup', onDocRelease, true);
    this._doc.addEventListener('pointercancel', onDocRelease, true);
    this._doc.addEventListener('pointerleave', onDocLeave, true);
    this._doc.addEventListener('keydown', onKey);
    this._doc.defaultView?.addEventListener('resize', onResize, { passive: true });
    this._unbindDoc = () => {
      this._doc.defaultView?.removeEventListener('resize', onResize);
      this._doc.removeEventListener('pointerdown', onDocDown, true);
      this._doc.removeEventListener('pointerdown', onDocPress, true);
      this._doc.removeEventListener('pointermove', onDocMove, true);
      this._doc.removeEventListener('pointerup', onDocRelease, true);
      this._doc.removeEventListener('pointercancel', onDocRelease, true);
      this._doc.removeEventListener('pointerleave', onDocLeave, true);
      this._doc.removeEventListener('keydown', onKey);
    };
  }

  ngOnDestroy(): void {
    if (this._growRaf !== null) { cancelAnimationFrame(this._growRaf); this._growRaf = null; }
    this._unbindDoc?.();
    this._detachOnDestroy();
  }

  Open(): void {
    this._open.set(true);
    this._fitToRoom();
    this._trackWhileGrowing();
  }

  /**
   * CAP THE OPEN PANEL TO THE ROOM IT ACTUALLY HAS, MEASURED, NOT GUESSED.
   *
   * `Jwift_GlassDropdown_Open` is `Height: MinContent`: as tall as its rows, with nothing saying the
   * screen is only so big. Solved through the engine at a 620px window, the account menu's fourteen
   * rows come out 706px tall from a top at 20 — the last two and a half options are laid out 106px
   * below the bottom of the screen. They are painted, they are opaque, and no pointer can ever reach
   * them. A `max-height` constant would only move the number at which that happens; the panel is
   * anchored `Top: 0` on a slot whose own Y depends on the page, so the ceiling is a measurement.
   *
   * WHAT IS MEASURED. The panel's top never moves — `Top: 0` pins it to the slot, and the slot is the
   * closed pill, which is already laid out when this runs — so `Node.Y` is the panel's top in canvas
   * space both before and after the cap lands. That is what makes this safe to run repeatedly: unlike
   * a height measurement, it cannot read back its own constraint, so a re-open can never shrink the
   * menu a second time. Room is everything under that top, less the screen's own safe inset and the
   * gap a floating surface keeps from the edge.
   *
   * THE FLOOR. A trigger low enough that the room below is under three rows would be capped to a
   * stub, so the floor holds it at three rows and the panel overhangs instead. Apple would flip the
   * menu upward there; nothing in this app is anchored low enough to need that yet (every live
   * `<glass-action-bar>` and `<glass-action-group>` sits in a `Jwift_PageHeader`), and a flip needs
   * its own `Bottom`-anchored placement and its own proof. Noted, not pretended.
   */
  private _fitToRoom(): void {
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;
    const room = el.getBoundingClientRect().height - this.Node.Y - this._bottomInset() - SCREEN_GAP;
    const cap = `${Math.round(Math.max(room, PANEL_FLOOR))}px`;
    // Rounded, and written only on a CHANGE. `SetStyleOverride` re-fires `JivHost`'s effect, which
    // re-applies the whole resolved class bag; this runs on every frame of the 600ms growth track, so
    // an unguarded write would post three dozen identical `apply` ops per open and fight the height
    // spring with sub-pixel dust while it flies.
    if (this._cap === cap) return;
    this._cap = cap;
    this.SetStyleOverride({ MaxHeight: cap });
  }

  /** The last ceiling written, so a re-measure that lands on the same number costs nothing. */
  private _cap: string | null = null;

  /** The device's bottom safe inset, in px, as Jaui publishes it to every sheet (`@SafeBottom`, latched
   *  by the host from `env(safe-area-inset-bottom)`). Zero on every desktop browser; on a phone it is
   *  the home indicator, which a menu must not end underneath. */
  private _bottomInset(): number {
    const raw = this._jss.Vars.get('SafeBottom');
    const px = raw ? parseFloat(raw) : 0;
    return Number.isFinite(px) ? px : 0;
  }

  /**
   * Follow the dropdown's box until it stops growing, re-placing the indicator each frame.
   *
   * The open transition runs Width and Height for 280ms and the menu is anchored `Right: 0`, so its X
   * travels left the whole time while the rows are already at their final places. A highlight placed
   * from one frame inside that window keeps a stale horizontal offset. `WatchRect` is already on (see
   * ngOnInit), so the rects here are live; this just keeps asking until two frames agree, with a ceiling
   * so a menu that never settles cannot leave a loop running.
   */
  private _trackWhileGrowing(): void {
    if (this._growRaf !== null) return;
    const started = Date.now();
    let lastX = NaN, lastW = NaN, agreeing = 0;
    const step = (): void => {
      this._growRaf = null;
      if (!this._open()) return;
      const n = this.Node;
      agreeing = (n.X === lastX && n.Width === lastW) ? agreeing + 1 : 0;
      lastX = n.X; lastW = n.Width;
      this._replaceIndicator();
      // Re-measure alongside the indicator. `Open()` measures from the CLOSED pill's rect, which is the
      // right top edge (the slot holds the closed footprint and the panel is `Top: 0` on it) but is one
      // frame old; this settles it against the open placement. Idempotent by construction — the cap
      // moves the panel's BOTTOM and the measurement reads its TOP, so it can never read back its own
      // constraint and walk the menu shorter on every frame.
      this._fitToRoom();
      // The transition is 280ms and does not necessarily move on the first frames, so "two agreeing
      // frames" is true IMMEDIATELY after opening and would end the loop before the growth it exists to
      // follow. Hold until the transition is certainly over, then let agreement end it; 600ms is the
      // hard ceiling so a menu that never settles cannot leave a loop running.
      const elapsed = Date.now() - started;
      if ((elapsed > 320 && agreeing >= 2) || elapsed > 600) return;
      this._growRaf = requestAnimationFrame(step);
    };
    this._growRaf = requestAnimationFrame(step);
  }

  private _growRaf: number | null = null;

  Close(): void {
    if (this._growRaf !== null) { cancelAnimationFrame(this._growRaf); this._growRaf = null; }
    // BACK TO A CLEAN SLATE. The cap belongs to one open at one window size, so it is lifted with the
    // rest of the open state and the next open measures again. A cap left behind would also sit on the
    // CLOSED pill, which is 48pt and has no business carrying a 520pt ceiling.
    //
    // WRITTEN BACK TO `none`, NOT CLEARED. `JivHost._buildOpts` rebuilds ChildLayout as
    // `{ ...this.Node.ChildLayout, ...class, ...overrides }` — the node's CURRENT state spread first —
    // so simply dropping the override leaves the last cap standing, because nothing later in that
    // merge mentions MaxHeight. `none` is the engine's own default (`DefaultChildLayout.MaxHeight`,
    // which `ResolveBound` reads as Infinity), so this says no ceiling rather than hoping for one.
    this._cap = null;
    this.SetStyleOverride({ MaxHeight: 'none' });
    this._open.set(false); this._page.set(null); this._hovered.set(null); this._pressed.set(false);
  }
  Toggle(): void { if (this._open()) this.Close(); else this.Open(); }

  PushPage(id: string): void { this._page.set(id); }
  PopPage():            void { this._page.set(null); }

  protected _onHostClick(_e: MouseEvent): void {
    // Open via a host click is gated: an open with nothing to show is the flat-
    // empty-glass bug. Closing is always allowed. On open, push the consumer's
    // defaultPage so a single-page pill opens its page from any glass tap.
    if (this._open()) { this.Close(); return; }
    if (!this.canOpen()) return;
    // THROUGH `Open()`, not `_open.set(true)`. This path set the signal directly and so skipped the
    // growth tracking that keeps the hover indicator aligned while the menu expands - which is why the
    // fix for that looked inert: the tracking loop never ran on the path people actually use, because
    // tapping the glass is how this menu opens. Two ways to open must not mean two behaviours.
    this.Open();
    const dp = this.defaultPage();
    if (dp !== null) this._page.set(dp);
  }
}
