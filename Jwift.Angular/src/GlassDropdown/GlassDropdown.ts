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
import { Jaui, Jiv } from 'jaui-angular';
import type { JivHandle } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import GlassDropdownJss from './GlassDropdown.jss';

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
    this._doc.addEventListener('pointerdown', onDocDown, true);
    this._doc.addEventListener('pointerdown', onDocPress, true);
    this._doc.addEventListener('pointermove', onDocMove, true);
    this._doc.addEventListener('pointerup', onDocRelease, true);
    this._doc.addEventListener('pointercancel', onDocRelease, true);
    this._doc.addEventListener('pointerleave', onDocLeave, true);
    this._doc.addEventListener('keydown', onKey);
    this._unbindDoc = () => {
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
    this._trackWhileGrowing();
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
