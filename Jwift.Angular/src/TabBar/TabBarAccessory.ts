import {
  ChangeDetectionStrategy,
  Component,
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
import { Jaui, Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { CanvasPress } from '../Internal/CanvasPress';
import { Icon } from '../Icon/Icon';
import { SelectionIndicator } from '../SelectionIndicator/SelectionIndicator';
import { TabBar } from './TabBar';
import TabBarJss from './TabBar.jss';

/**
 * `<tab-bar-accessory>` — the round glass button that trails a `<tab-bar>`, as iOS lifts a search tab
 * out of the bar. Place it beside the bar in the same row; it is the bar's height, wears the bar's
 * material and takes a tab's inks, lens and press. The consumer decides what it does.
 *
 *   <tab-bar [selected]="AccessoryActive() ? null : Index()" ... />
 *   <tab-bar-accessory icon="magnifyingglass" [selected]="AccessoryActive()" (activate)="Go()" />
 *
 * Selected, it shows the resting lens and the accent ink; pressed, the lens swells to glass exactly
 * as a tab's does.
 */
@Component({
  selector: 'tab-bar-accessory',
  standalone: true,
  imports: [Jiv, Icon, SelectionIndicator],
  template: `
    @if (Lensed()) {
      <selection-indicator [target]="CellJiv()?.Node ?? null" [pressed]="IsPressed()" />
    }
    <jiv class="Jwift_TabAccessoryCell" [label]="label() || null" #Cell>
      <icon [class]="IconClass()" [Name]="Glyph()" [color]="AppliedAccent()" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => TabBarAccessory) },
  ],
})
export class TabBarAccessory extends JivHost implements OnInit, OnDestroy {
  readonly icon = input<string>('');
  readonly iconFill = input<string>('');
  /** Accessible name; the circle shows no label. */
  readonly label = input<string>('');
  readonly selected = input<boolean>(false);
  /** Ink for the selected glyph. Unset keeps the class's primary ink. */
  readonly Accent = input<string | undefined>(undefined);
  /** App classes merged after the base look. */
  readonly Class = input<string>('');

  /** Fires when a press is released over the circle. */
  readonly activate = output<void>();

  private readonly _pressed = signal(false);
  readonly IsPressed = this._pressed.asReadonly();

  protected readonly CellJiv = viewChild('Cell', { read: Jiv });
  protected readonly Lensed = computed(() => this.selected() || this._pressed());
  protected readonly Glyph = computed(() => (this.selected() && this.iconFill()) || this.icon());
  protected readonly IconClass = computed(() => this.selected() ? 'Jwift_TabAccessoryIconActive' : 'Jwift_TabAccessoryIcon');
  protected readonly AppliedAccent = computed(() => this.selected() ? this.Accent() : undefined);

  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _gesture = new CanvasPress();
  private _latchTimer: ReturnType<typeof setTimeout> | null = null;
  private _over = false;

  constructor() {
    // The bar's own pressed swell, riding the same signal as the circle's lens.
    super('TabBar', TabBarJss, 'Jwift_TabAccessory', () =>
      `Jwift_TabAccessory ${this._pressed() ? 'Jwift_TabBar_Pressed' : ''} ${this.Class()}`.replace(/\s+/g, ' ').trim());
  }

  ngOnInit(): void {
    this._attachOnInit();
    // Main-side rect for the hit test.
    this.Node.WatchRect(true);
    const el = this._canvasRef?.Canvas?.Element;
    if (!el) return;
    this._gesture.Wire(el, {
      Press: (x, y) => {
        if (!this._inside(x, y)) return false;
        this._clearLatch();
        this._over = true;
        this._pressed.set(true);
        return true;
      },
      Move: (x, y) => { this._over = this._inside(x, y); },
      Release: () => {
        // A release that drifted off the circle activates nothing.
        if (!this._over) { this._pressed.set(false); return; }
        this.activate.emit();
        // Hold the glass through the lens settle so a quick tap still reads as a press.
        this._latchTimer = setTimeout(() => {
          this._latchTimer = null;
          if (!this._gesture.Tracking) this._pressed.set(false);
        }, TabBar.SlideLatchMs);
      },
      Cancel: () => this._pressed.set(false),
    });
  }

  ngOnDestroy(): void {
    this._clearLatch();
    this._gesture.Unwire();
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  private _inside(clientX: number, clientY: number): boolean {
    const [x, y] = CanvasPress.ToNode(this._canvasRef?.Canvas, clientX, clientY);
    const n = this.Node;
    return n.Width > 0 && x >= n.X && x < n.X + n.Width && y >= n.Y && y < n.Y + n.Height;
  }

  private _clearLatch(): void {
    if (this._latchTimer) clearTimeout(this._latchTimer);
    this._latchTimer = null;
  }
}
