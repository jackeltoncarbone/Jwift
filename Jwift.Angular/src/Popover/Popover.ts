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
import { JwiftStyleLoader } from '../Jss/Jwift.Style.Loader';
import PaperJss from '../Paper/Paper.jss';
import GlassDropdownJss from '../GlassDropdown/GlassDropdown.jss';
import PopoverJss from './Popover.jss';
import { PlacePopover, type PopoverPlacement, type PopoverRect } from './Popover.Placement';

export type { PopoverRect };

/** The room a Popover's open panel has below its top edge, in canvas px. PopoverMenu caps its scroll
 *  body with it; fixed-size content simply ignores it. `Infinity` before the first placement runs. */
export const JWIFT_POPOVER_ROOM = new InjectionToken<Signal<number>>('JWIFT_POPOVER_ROOM');

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
   *  device's safe areas plus `TopInset`. */
  readonly Region = input<PopoverRect | null>(null);
  /** Extra clearance from the region's own top — e.g. a floating header the popover must clear. */
  readonly TopInset = input(0);
  readonly Width = input(250);
  readonly Arrow = input(true);
  /** The accessibility name for the panel. */
  readonly Label = input<string | null>(null);

  private readonly _jss = inject(JSS_REGISTRY);
  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _doc = inject(DOCUMENT);
  private readonly _styleLoader = inject(JwiftStyleLoader);

  private readonly _placement = signal<PopoverPlacement | null>(null);
  /** Published through `JWIFT_POPOVER_ROOM`. */
  readonly _room = computed(() => this._placement()?.MaxHeight ?? Infinity);

  protected readonly _ArrowLayout = computed(() => {
    const p = this._placement();
    if (!p) return { Position: 'Placed' as const };
    return {
      Position: 'Placed' as const,
      Left: `${p.ArrowX - p.X - 8.5}px`,
      Top: `${p.Down ? -8.5 : this.Node.Height - 8.5}px`,
    };
  });
  protected readonly _ArrowStyle = computed(() => {
    const p = this._placement();
    const hidden = !this.Arrow() || !p?.ArrowVisible;
    return { Opacity: hidden ? '0' : '1', PointerEvents: 'None' as const };
  });

  private _unbindDoc: (() => void) | null = null;
  private _raf: number | null = null;
  private _prevDown: boolean | null = null;
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
      const patch: Record<string, unknown> = { Width: `${this.Width()}pt` };
      if (p) {
        patch['Top'] = `${p.Y}px`;
        patch['Left'] = `${p.X}px`;
        patch['MaxHeight'] = `${p.MaxHeight}px`;
        patch['VisualOrigin'] = `${p.OriginX} ${p.OriginY}`;
      }
      this.SetStyleOverride(patch);
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
        if (px >= n.X && px < n.X + n.Width && py >= n.Y && py < n.Y + n.Height) return;
      }
      // Never swallowed: lane E's own field taps swallow what they need to.
      this.OpenChange.emit(false);
      this.Closed.emit({ ByOutsideTap: true, At: Date.now() });
    };
    const onKey = (e: KeyboardEvent): void => {
      if (!this.Open()) return;
      if (e.key !== 'Escape') return;
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
    this._detachOnDestroy();
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
    const top = gap + this._envVar('SafeTop') + this.TopInset();
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
    const rect = el.getBoundingClientRect();
    const region = this._resolveRegion(rect.width, rect.height);
    // The frame is `Height: MinContent`: before the first placement its natural height is whatever
    // the content measures to; fall back to something reasonable rather than collapsing the first
    // placement to the 44pt floor.
    const h = this.Node.Height > 0 ? this.Node.Height : 240;
    const key = `${anchor.X},${anchor.Y},${anchor.Width},${anchor.Height}|${region.X},${region.Y},${region.Width},${region.Height}|${Math.round(h)}`;
    if (key === this._placeKey) return;
    this._placeKey = key;
    const placement = PlacePopover({ Anchor: anchor, Region: region, W: this.Width(), H: h, PrevDown: this._prevDown });
    this._prevDown = placement.Down;
    this._placement.set(placement);
  }
}
