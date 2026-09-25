import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Directive,
  Injectable,
  OnDestroy,
  OnInit,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Jaui, Jext, Jiv, JSS_REGISTRY } from 'jaui-angular';
import type { JivHandle } from 'jaui';
import { GlassButton } from '../GlassButton/GlassButton';
import { Icon } from '../Icon/Icon';
import { JivHost } from '../Internal/JivHost';
import SheetJss from './Sheet.jss';
import {
  BottomRadius,
  Clamp01,
  FormSheetSizeFor,
  GrabberTarget,
  InsetFor,
  IsRegularWidth,
  LargeHeight,
  MediumHeight,
  PercentFullHeight,
  ProjectedTravel,
  RubberBand,
  SettleIndex,
  SHEET_METRICS,
  type SheetDetent,
} from './Sheet.Geometry';

/**
 * The sheet outlet: the one layer that presents sheets ABOVE the app's chrome. Layer is sibling-local, so a sheet
 * declared inside a page is sealed under chrome that is a later sibling of the page (the tab bar). The app mounts one
 * full-viewport jiv with `[TeleportId]="JWIFT_SHEET_OUTLET"` after its chrome; a page's sheet teleports there with
 * `<sheet [TeleportTo]="JWIFT_SHEET_OUTLET">`.
 */
export const JWIFT_SHEET_OUTLET = 'Jwift_Sheet';

/** The sheets on screen, oldest first. A sheet under another hides its grabber, as UIKit's does [C]. */
@Injectable({ providedIn: 'root' })
export class SheetStack {
  private readonly _open = signal<readonly object[]>([]);
  readonly Top = computed(() => {
    const open = this._open();
    return open.length > 0 ? open[open.length - 1] : null;
  });
  Add(sheet: object): void { this._open.update((open) => [...open, sheet]); }
  Remove(sheet: object): void { this._open.update((open) => open.filter((s) => s !== sheet)); }
}

/** Parents the sheet's own layer children (the dim, the card) to the sheet. Scoped to its own element, because a
 *  component's viewProviders also reach content declared inside a control-flow block, which must reach the body. */
@Directive({
  selector: '[sheetLayer]',
  standalone: true,
  providers: [{ provide: Jiv, useExisting: forwardRef(() => Sheet) }],
})
export class SheetLayer {}

/** Marks the jiv projected content lands in. It registers with its sheet while the view is created, which is before
 *  any projected child attaches, so the sheet can hand that child its parent. */
@Directive({ selector: '[sheetBody]', standalone: true })
export class SheetBody {
  constructor() {
    inject(forwardRef(() => Sheet)).RegisterBody(inject(Jiv, { self: true }));
  }
}

/**
 * The edits a person has typed into a sheet since it opened. A field inside a sheet reports each change it
 * takes from the person (never one bound in by the app), so a form sheet knows it holds work without every
 * owner tracking it by hand.
 */
@Injectable()
export class SheetEdits {
  private readonly _edited = signal(false);
  readonly Edited = this._edited.asReadonly();
  /** A person changed something in the sheet. */
  Mark(): void { this._edited.set(true); }
  /** The sheet's work was kept (saved in place): nothing is left to lose. */
  Reset(): void { this._edited.set(false); }
}

/**
 * `sheetCancel` on a Cancel or Close control inside a sheet: the press dismisses the way the X and a swipe do,
 * asking "Discard Changes" first when the sheet holds unsaved work (Apple's Cancel). The owner reacts in `(close)`.
 */
@Directive({
  selector: '[sheetCancel]',
  standalone: true,
  host: { '(click)': 'Cancel()' },
})
export class SheetCancel {
  private readonly _sheet = inject(forwardRef(() => Sheet));
  Cancel(): void { this._sheet.AttemptDismiss(); }
}

type SheetPhase = 'entering' | 'shown' | 'leaving';

interface PanSample { readonly Y: number; readonly T: number }

/**
 * `<sheet>`: Apple's iOS 26 sheet, the one presentation for every task the app raises over a page (Jwift/Apple/
 * Sheets.md). On a phone it is edge attached and rests at its detents: Liquid Glass inset 8 pt at partial heights,
 * opaque and edge to edge at the large one, its bottom corners following the display's. In regular width it is a
 * centered form sheet. It owns its dimming view, its bar (the X leading, the title, the checkmark trailing), the
 * grabber when it is resizable, the swipe down to dismiss and the drag between detents.
 *
 *   @if (Open()) {
 *     <sheet sheetTitle="Pictures" [detents]="['medium', 'large']" (close)="Open.set(false)">
 *       ...content, which scrolls under the bar...
 *     </sheet>
 *   }
 *
 * `close` fires once the sheet has left, for every dismissal a person makes (the X, a swipe, a tap on the dim, the
 * grabber of a one-detent sheet). A sheet holding unsaved work asks "Discard Changes" or "Keep Editing" before any
 * of them discards, Apple's `isModalInPresentation` pattern. By default the work is whatever a person typed into
 * the sheet's fields; `[hasUnsavedChanges]` states it exactly (a form that compares against what it opened with),
 * and `[asksBeforeDiscarding]="false"` turns the ask off for a sheet whose fields are not work (a search, a chat
 * composer that keeps its draft).
 */
@Component({
  selector: 'sheet',
  standalone: true,
  imports: [Jiv, Jext, Icon, GlassButton, SheetBody, SheetLayer],
  template: `
    <ng-container sheetLayer>
    <jiv [class]="DimClass()" [jivStyle]="DimStyle()" (click)="AttemptDismiss()" />
    <jiv #card [class]="CardClass()" [jivStyle]="CardStyle()" [childLayout]="CardLayout()" (panclaim)="OnPanClaim($event)">
      <jiv sheetBody [class]="bodyScrolls() ? 'Jwift_SheetBody' : 'Jwift_SheetBody_Fixed'" [layout]="BodyLayout()">
        <ng-content></ng-content>
      </jiv>
      <jiv class="Jwift_SheetBar">
        <glass-button size="bar" (click)="AttemptDismiss()">
          <icon class="Jwift_SheetBarGlyph" Name="xmark" />
        </glass-button>
        <jiv class="Jwift_SheetTitleBox">
          @if (sheetTitle()) {
            <jext class="Jwift_SheetTitle" [text]="sheetTitle()" />
          }
        </jiv>
        @if (confirmable()) {
          <glass-button size="bar" variant="prominent" [disabled]="confirmDisabled()" (click)="confirm.emit()">
            <icon class="Jwift_SheetBarGlyph JwiftProminentInk" Name="checkmark" />
          </glass-button>
        } @else {
          <jiv class="Jwift_SheetBarSpacer" />
        }
      </jiv>
      @if (ShowsGrabber()) {
        <jiv class="Jwift_SheetGrabberHit" (click)="OnGrabberTap()">
          <jiv [class]="Covered() ? 'Jwift_SheetGrabber_Hidden' : 'Jwift_SheetGrabber'" />
        </jiv>
      }
      @if (Asking()) {
        <jiv class="Jwift_SheetAsk">
          <jiv class="Jwift_SheetAskRow" (click)="Discard()">
            <jext class="Jwift_SheetAskLabel_Destructive" text="Discard Changes" />
          </jiv>
          <jiv class="Jwift_SheetAskRow" (click)="KeepEditing()">
            <jext class="Jwift_SheetAskLabel" text="Keep Editing" />
          </jiv>
        </jiv>
      }
    </jiv>
    </ng-container>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Projected content, in a control-flow block or not, parents to the body; the layer's own children to the sheet.
  providers: [
    { provide: Jiv, useFactory: () => inject(Sheet).ContentParent },
    { provide: SheetEdits, useFactory: () => inject(Sheet).Edits },
  ],
})
export class Sheet extends JivHost implements OnInit, AfterViewInit, OnDestroy {
  /** The inline title, centered on the bar. An untitled sheet still has its X. */
  readonly sheetTitle = input<string>('');
  /** Where the sheet can rest, Apple's `detents`. More than one makes it resizable, with a grabber. */
  readonly detents = input<readonly SheetDetent[]>(['content']);
  /** Apple's `largestUndimmedDetentIdentifier`: at this detent and below, nothing is dimmed and the page behind
   *  stays live (a nonmodal sheet). Null dims at every detent, the default. */
  readonly largestUndimmedDetent = input<SheetDetent | null>(null);
  /** Apple's `prefersGrabberVisible`. Unset shows it on a resizable sheet only. */
  readonly grabber = input<boolean | null>(null);
  /** Shows the checkmark trailing the bar; a press emits `confirm`. */
  readonly confirmable = input<boolean>(false);
  readonly confirmDisabled = input<boolean>(false);
  /** Apple's `isModalInPresentation`, per sheet: whether a dismissal with unsaved work asks before it discards. */
  readonly asksBeforeDiscarding = input<boolean>(true);
  /** The sheet's unsaved work, stated by its owner. Null (the default) means whatever was typed into its fields. */
  readonly hasUnsavedChanges = input<boolean | null>(null);
  /** False when the content scrolls its own parts (a pinned search, a pinned footer); the body then only clips. */
  readonly bodyScrolls = input<boolean>(true);
  /** App classes merged onto the presentation layer (a higher Layer over a full-screen presentation). */
  readonly Class = input<string>('');
  readonly close = output<void>();
  readonly confirm = output<void>();
  /** The sheet has finished rising: a DOM embed inside it can mount into a box that has stopped moving. */
  readonly presented = output<void>();

  private readonly _surface = inject(Jaui);
  private readonly _jss = inject(JSS_REGISTRY);
  private readonly _doc = inject(DOCUMENT);
  private readonly _stack = inject(SheetStack);
  private readonly _card = viewChild.required<Jiv>('card');

  private _body: Jiv | null = null;
  /** What the sheet's fields report typing into. */
  readonly Edits = new SheetEdits();
  /** Whether a dismissal now would lose work, and so asks first. */
  readonly Unsaved = computed(() => this.asksBeforeDiscarding() && (this.hasUnsavedChanges() ?? this.Edits.Edited()));
  /** What projected content parents to: the body, once it exists. */
  readonly ContentParent: Jiv = ((sheet: Sheet) => ({
    get Node(): JivHandle { return sheet._bodyNode(); },
    SeoEnabled: (): boolean => sheet._body?.SeoEnabled() ?? true,
    _mirrorEntry: null,
  }) as unknown as Jiv)(this);

  private readonly _container = signal({ Width: 0, Height: 0 });
  private readonly _phase = signal<SheetPhase>('entering');
  private readonly _index = signal(0);
  /** An explicit height while a pan or its settle owns it; null rests on the detent. */
  private readonly _dragHeight = signal<number | null>(null);
  /** How far the card sits below its resting place: the pan toward dismissal, the entrance, the exit. */
  private readonly _drop = signal(0);
  private readonly _motion = signal(false);
  private readonly _contentHeight = signal(0);
  private readonly _asking = signal(false);
  readonly Asking = this._asking.asReadonly();

  private _pan: { Id: number; StartY: number; StartExtent: number; Samples: PanSample[] } | null = null;
  private _unbindPan: (() => void) | null = null;
  private _unbindDoc: (() => void) | null = null;
  private readonly _timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    super('Sheet', SheetJss, 'Jwift_SheetLayer', () => {
      const layer = this.Regular() ? 'Jwift_SheetLayer_Form' : 'Jwift_SheetLayer';
      return `${layer} ${this.Class()}`.trim();
    });
  }

  RegisterBody(body: Jiv): void { this._body = body; }

  private _bodyNode(): JivHandle {
    return (this._body ?? this).Node;
  }

  // ── Environment ────────────────────────────────────────────────────

  private _var(name: string): number {
    this._jss.Version();
    const raw = this._jss.Vars.get(name);
    const value = raw ? parseFloat(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  }

  /** The concentric chain's lengths, in points, from Jwift.Glass.jss. */
  private readonly _partialInset = computed(() => this._jss.VarPoints('JwiftSheetInset'));
  private readonly _screenRadius = computed(() => this._jss.VarPoints('JwiftScreenRadius'));
  private readonly _sheetRadius = computed(() => this._jss.VarPoints('JwiftSheetRadius'));
  private readonly _barHeight = computed(() => this._jss.VarPoints('JwiftSheetBarHeight'));

  readonly Regular = computed(() => IsRegularWidth(this._container().Width, this._container().Height));
  private readonly _form = computed(() => FormSheetSizeFor(this._container().Width, this._container().Height));
  private readonly _large = computed(() => {
    const { Height } = this._container();
    if (this.Regular()) return Math.min(this._form().Height, Height - 2 * this._partialInset());
    return LargeHeight(Height - this._var('KeyboardInset'), this._var('SafeTop'));
  });
  private readonly _medium = computed(() =>
    this.Regular() ? this._large() : MediumHeight(this._large(), this._container().Height));

  private _heightOf(detent: SheetDetent): number {
    const large = this._large();
    if (detent === 'large') return large;
    if (detent === 'medium') return this._medium();
    const content = this._contentHeight();
    return content > 0 ? Math.min(content, large) : large;
  }

  /** The detents smallest first, each with its height. */
  private readonly _stops = computed(() => {
    const unique = [...new Set(this.detents().length > 0 ? this.detents() : (['content'] as const))];
    return unique
      .map((detent) => ({ Detent: detent, Height: this._heightOf(detent) }))
      .sort((a, b) => a.Height - b.Height);
  });

  // A form sheet does not resize, so it has no grabber unless one is asked for.
  readonly ShowsGrabber = computed(() => this.grabber() ?? (!this.Regular() && this._stops().length > 1));
  readonly Covered = computed(() => this._stack.Top() !== this);

  private readonly _restHeight = computed(() => {
    const stops = this._stops();
    return stops[Math.min(this._index(), stops.length - 1)].Height;
  });
  private readonly _height = computed(() => this._dragHeight() ?? this._restHeight());
  private readonly _percentFull = computed(() =>
    this.Regular() ? 1 : PercentFullHeight(this._height(), this._medium(), this._large()));
  private readonly _inset = computed(() => (this.Regular() ? 0 : InsetFor(this._percentFull(), this._partialInset())));

  // ── What the template binds ───────────────────────────────────────

  private readonly _dimLevel = computed(() => {
    const undimmed = this.largestUndimmedDetent();
    const stops = this._stops();
    let level = 1;
    if (undimmed !== null && !this.Regular()) {
      const at = stops.findIndex((s) => s.Detent === undimmed);
      if (at >= 0) {
        const next = stops[at + 1];
        const h = this._height();
        level = next ? Clamp01((h - stops[at].Height) / (next.Height - stops[at].Height)) : 0;
      }
    }
    return level;
  });

  readonly DimClass = computed(() => {
    const base = this._dimLevel() > 0 ? 'Jwift_SheetDim' : 'Jwift_SheetDim_Clear';
    return this._motion() ? `${base} Jwift_SheetDimMotion` : base;
  });

  readonly DimStyle = computed(() => {
    const dark = this._var('Dark') > 0.5;
    const dim = dark ? SHEET_METRICS.DimDark : SHEET_METRICS.DimLight;
    const shown = this._phase() === 'shown' ? 1 : 0;
    const h = Math.max(1, this._height());
    const away = 1 - Clamp01(this._drop() / h);
    return { Opacity: String(Math.round(dim * this._dimLevel() * shown * away * 1000) / 1000) };
  });

  readonly CardClass = computed(() => {
    const stops = this._stops();
    const grows = !this.Regular() && stops.length > 1 && this._index() < stops.length - 1;
    const material = this.Regular() || this._percentFull() > SHEET_METRICS.GlassBelow ? 'Jwift_SheetOpaque' : 'Jwift_SheetGlass';
    const shape = grows ? 'Jwift_SheetCard_Grows' : 'Jwift_SheetCard';
    return `${shape} ${material}${this._motion() ? ' Jwift_SheetMotion' : ''}`;
  });

  readonly CardStyle = computed(() => {
    const h = this._height();
    if (this.Regular()) {
      // The sheet's one radius on every device, so its bar buttons stay concentric (Apple's form sheet is 32 [C]).
      const r = Math.min(this._sheetRadius(), h / 2);
      return { BorderRadius: `${r}px` };
    }
    const cap = h / 2;
    const top = Math.min(this._sheetRadius(), cap);
    const bottom = Math.min(BottomRadius(this._screenRadius(), this._inset()), cap);
    return { BorderRadius: `${r1(top)}px ${r1(top)}px ${r1(bottom)}px ${r1(bottom)}px` };
  });

  readonly CardLayout = computed(() => {
    const { Width } = this._container();
    const inset = this._inset();
    const content = this._stops()[Math.min(this._index(), this._stops().length - 1)].Detent === 'content';
    const explicit = this._dragHeight() !== null || !content;
    const width = this.Regular() ? Math.min(this._form().Width, Width - 32) : Width - 2 * inset;
    const bottom = this.Regular() ? 0 : inset + this._var('KeyboardInset');
    return {
      Width: `${r1(width)}px`,
      Height: explicit ? `${r1(this._height())}px` : 'Auto',
      MaxHeight: `${r1(Math.max(this._large(), this._dragHeight() ?? 0))}px`,
      Margin: `0px 0px ${r1(bottom)}px 0px`,
      OffsetY: `${r1(this._drop())}px`,
    };
  });

  readonly BodyLayout = computed(() => {
    const scrollRoom = this.bodyScrolls() ? 16 : 0;
    const bottom = this.Regular() ? scrollRoom : Math.max(this._var('SafeBottom') - this._inset(), 0);
    return { Padding: `${this._barHeight()}px 20px ${r1(bottom)}px 20px` };
  });

  // ── Lifecycle ──────────────────────────────────────────────────────

  ngOnInit(): void {
    this._attachOnInit();
    this._stack.Add(this);
    this._measureContainer();
    this._drop.set(this._container().Height || 1000);
    this.Node.WatchRect(true);
    this.Node.SetHit({
      OnRectSnapshot: (box) => {
        if (box.Width > 0 && box.Height > 0) this._container.set({ Width: box.Width, Height: box.Height });
      },
    });
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && this._stack.Top() === this) this.AttemptDismiss();
    };
    const onResize = (): void => this._measureContainer();
    this._doc.addEventListener('keydown', onKey);
    this._doc.defaultView?.addEventListener('resize', onResize, { passive: true });
    this._unbindDoc = () => {
      this._doc.removeEventListener('keydown', onKey);
      this._doc.defaultView?.removeEventListener('resize', onResize);
    };
  }

  ngAfterViewInit(): void {
    const card = this._card().Node;
    card.WatchRect(true);
    let risen = false;
    const rise = (): void => {
      if (risen) return;
      risen = true;
      // Parked just below the screen at the card's own height, then sprung up: Apple's presentation.
      this._drop.set(this._height() + this._partialInset() + (this.Regular() ? this._container().Height / 2 : 0));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (this._phase() !== 'entering') return;
        this._motion.set(true);
        this._phase.set('shown');
        this._drop.set(0);
        this._later(() => this.presented.emit(), 360);
      }));
    };
    card.SetHit({
      OnRectSnapshot: (box) => {
        if (box.Height <= 0) return;
        // A fitted sheet's height is its content's, read only while nothing else sizes it.
        if (this._dragHeight() === null && !this._pan) this._contentHeight.set(box.Height);
        if (this._phase() === 'entering') rise();
      },
    });
    this._later(rise, 120);
  }

  ngOnDestroy(): void {
    this._stack.Remove(this);
    this._unbindPan?.();
    this._unbindDoc?.();
    for (const t of this._timers) clearTimeout(t);
    this._detachOnDestroy();
  }

  private _measureContainer(): void {
    const el = this._surface.Canvas?.Element;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (this._container().Width === 0 && rect.width > 0) this._container.set({ Width: rect.width, Height: rect.height });
  }

  private _later(fn: () => void, ms: number): void {
    const t = setTimeout(() => { this._timers.delete(t); fn(); }, ms);
    this._timers.add(t);
  }

  // ── Dismissal and detents ──────────────────────────────────────────

  /** Every dismissal a person makes comes here: with unsaved changes it asks first. */
  AttemptDismiss(): void {
    if (this._phase() !== 'shown') return;
    if (this.Unsaved()) {
      this._settle(0);
      this._asking.set(true);
      return;
    }
    this._leave();
  }

  Discard(): void {
    this._asking.set(false);
    this._leave();
  }

  KeepEditing(): void {
    this._asking.set(false);
  }

  OnGrabberTap(): void {
    if (this._phase() !== 'shown') return;
    const target = GrabberTarget(this._index(), this._stops().length);
    if (target === null) this.AttemptDismiss();
    else this._settle(target);
  }

  private _leave(): void {
    this._phase.set('leaving');
    this._motion.set(true);
    const offscreen = this.Regular()
      ? (this._container().Height + this._height()) / 2
      : this._height() + this._partialInset();
    this._drop.set(offscreen);
    this._later(() => this.close.emit(), 320);
  }

  /** Spring to a detent, then hand the height back to the detent (a fitted sheet back to its content). */
  private _settle(index: number): void {
    this._motion.set(true);
    const stops = this._stops();
    this._index.set(Math.max(0, Math.min(index, stops.length - 1)));
    this._dragHeight.set(stops[this._index()].Height);
    this._drop.set(0);
    this._later(() => { if (!this._pan) this._dragHeight.set(null); }, 600);
  }

  // ── The pan ────────────────────────────────────────────────────────

  /** The engine handed this card a vertical pan (its `PanClaim`); the event carries the press point. */
  OnPanClaim(event: Event): void {
    const e = event as PointerEvent;
    if (this._phase() !== 'shown' || this._pan) return;
    this._asking.set(false);
    const now = performance.now();
    this._pan = {
      Id: e.pointerId,
      StartY: e.clientY,
      StartExtent: this._height() - this._drop(),
      Samples: [{ Y: e.clientY, T: now }],
    };
    this._motion.set(false);
    const move = (ev: PointerEvent): void => {
      if (!this._pan || ev.pointerId !== this._pan.Id) return;
      this._track(ev.clientY);
    };
    const up = (ev: PointerEvent): void => {
      if (!this._pan || ev.pointerId !== this._pan.Id) return;
      this._track(ev.clientY);
      this._release();
    };
    this._doc.addEventListener('pointermove', move, true);
    this._doc.addEventListener('pointerup', up, true);
    this._doc.addEventListener('pointercancel', up, true);
    this._unbindPan = () => {
      this._doc.removeEventListener('pointermove', move, true);
      this._doc.removeEventListener('pointerup', up, true);
      this._doc.removeEventListener('pointercancel', up, true);
      this._unbindPan = null;
    };
  }

  private _track(clientY: number): void {
    const pan = this._pan!;
    const now = performance.now();
    pan.Samples.push({ Y: clientY, T: now });
    while (pan.Samples.length > 2 && now - pan.Samples[0].T > 100) pan.Samples.shift();
    const extent = pan.StartExtent - (clientY - pan.StartY);
    const { Height } = this._container();
    const stops = this._stops();
    const min = this.Regular() ? this._restHeight() : stops[0].Height;
    const max = this.Regular() ? this._restHeight() : stops[stops.length - 1].Height;
    const dismissable = !this.Unsaved();
    if (extent > max) {
      this._dragHeight.set(max + RubberBand(extent - max, Height));
      this._drop.set(0);
    } else if (extent >= min) {
      this._dragHeight.set(extent);
      this._drop.set(0);
    } else {
      this._dragHeight.set(min);
      this._drop.set(dismissable ? min - extent : RubberBand(min - extent, Height));
    }
  }

  private _release(): void {
    const pan = this._pan!;
    this._pan = null;
    this._unbindPan?.();
    const first = pan.Samples[0];
    const last = pan.Samples[pan.Samples.length - 1];
    const seconds = Math.max((last.T - first.T) / 1000, 1 / 120);
    const velocity = (last.Y - first.Y) / seconds;
    const extent = this._height() - this._drop();
    const projected = extent - ProjectedTravel(velocity);
    const heights = this.Regular() ? [this._restHeight()] : this._stops().map((s) => s.Height);
    const at = SettleIndex(projected, heights, true);
    if (at >= 0) { this._settle(this.Regular() ? this._index() : at); return; }
    this.AttemptDismiss();
    if (this._phase() === 'shown' && !this._asking()) this._settle(0);
  }
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}
