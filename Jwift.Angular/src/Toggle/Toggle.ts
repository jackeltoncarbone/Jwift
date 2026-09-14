import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import ToggleJss from './Toggle.jss';

/** Knob travel, in points, MATCHING Toggle.jss.
 *
 *  Two ranges, because the thumb grows when held: 40.5 wide at rest travelling 2.5 -> 26.5,
 *  and 63.5 wide when held travelling -8.5 -> 14.5. A drag is always in the held state, so it
 *  clamps to the HELD pair; clamping a held thumb to the resting range offsets it by the
 *  difference, which reads as the thumb sitting wrong for the mode being toggled to. */
const KNOB_REST_MIN = 2.5;
const KNOB_REST_MAX = 26.5;
const KNOB_PRESSED_MIN = -8.5;
const KNOB_PRESSED_MAX = 14.5;

/**
 * `<toggle>` — the system switch.
 *
 * MOVEMENT BASED, like the slider: the thumb follows the pointer while held rather than
 * jumping between two positions. Releasing ALWAYS toggles, wherever the thumb happens to
 * be, so a drag is a way of feeling the control rather than a way of choosing a value.
 *
 * KNOWN INCOMPLETE: the toggle-on-release half works, and the pointer handlers fire with
 * the right coordinates, but the thumb does NOT yet follow the pointer. `_dragLeft` is
 * written on every move while `KnobLayout` only ever recomputes as null, so the signal
 * write is not reaching this instance's template binding. The position is therefore still
 * coming from the class. Do not describe the drag as working until that is fixed.
 *
 * The press begins on any part of the switch and ends on a pointer up ANYWHERE on the
 * document, so dragging off the control and releasing still completes the interaction.
 * That is why the listeners live on the document and not on the host.
 */
@Component({
  selector: 'toggle',
  standalone: true,
  imports: [Jiv],
  template: '<jiv [class]="KnobClass()" [childLayout]="KnobLayout()" />',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Toggle) },
  ],
  host: {
    '(pointerdown)': '_onDown($event)',
  },
})
export class Toggle extends JivHost implements OnInit, OnDestroy {
  readonly checked = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Track colour when on. Green is only a default; a switch takes its owner's tint. */
  readonly tint = input<string | null>(null);
  readonly checkedChange = output<boolean>();

  private readonly _pressed = signal(false);
  /** Knob Left while dragging, in points. null = not dragging, so the class decides. */
  private readonly _dragLeft = signal<number | null>(null);
  private _startX = 0;
  private _startLeft = 0;
  private _moveHandler: ((e: PointerEvent) => void) | null = null;
  private _upHandler: ((e: PointerEvent) => void) | null = null;

  protected readonly KnobClass = computed(() => {
    const on = this.checked();
    if (this._pressed() && !this.disabled()) {
      return on ? 'Jwift_ToggleKnob_OnPressed' : 'Jwift_ToggleKnob_Pressed';
    }
    return on ? 'Jwift_ToggleKnob_On' : 'Jwift_ToggleKnob';
  });

  /** Only overrides the sheet while a drag is in flight; otherwise the class positions it. */
  protected readonly KnobLayout = computed(() => {
    const d = this._dragLeft();
    return d === null ? undefined : { Left: `${d}pt` };
  });

  constructor() {
    super('Toggle', ToggleJss, 'Jwift_Toggle', () => {
      if (this.disabled()) return 'Jwift_Toggle_Disabled';
      return this.checked() ? 'Jwift_Toggle_On' : 'Jwift_Toggle';
    });
    effect(() => {
      const t = this.tint();
      if (t && this.checked()) this.SetStyleOverride({ Background: t });
      else this.ClearStyleOverride('Background');
    });
    inject(DestroyRef).onDestroy(() => this._teardown());
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }

  protected _onDown(e: PointerEvent): void {
    if (this.disabled()) return;
    this._pressed.set(true);
    this._startX = e.clientX;
    // pressed geometry from the first frame: the thumb swells the moment it is held
    this._startLeft = this.checked() ? KNOB_PRESSED_MAX : KNOB_PRESSED_MIN;
    this._dragLeft.set(this._startLeft);
    // Document level: the gesture must finish on a pointer up ANYWHERE, including well
    // off the control, so a host-level listener would strand the switch mid-drag.
    this._moveHandler = (ev: PointerEvent) => this._onMove(ev);
    this._upHandler = () => this._onUp();
    document.addEventListener('pointermove', this._moveHandler);
    document.addEventListener('pointerup', this._upHandler);
    document.addEventListener('pointercancel', this._upHandler);
  }

  private _onMove(e: PointerEvent): void {
    if (!this._pressed()) return;
    // PointScale is 1, so a CSS pixel of pointer travel is a point of knob travel.
    // PointScale is 1, so a CSS pixel of pointer travel is a point of knob travel, 1:1.
    const next = this._startLeft + (e.clientX - this._startX);
    this._dragLeft.set(Math.max(KNOB_PRESSED_MIN, Math.min(KNOB_PRESSED_MAX, next)));
  }

  private _onUp(): void {
    if (!this._pressed()) return;
    this._teardown();
    this._pressed.set(false);
    this._dragLeft.set(null);       // hand the position back to the class, which springs
    this.checkedChange.emit(!this.checked());   // release ALWAYS toggles
  }

  private _teardown(): void {
    if (this._moveHandler) document.removeEventListener('pointermove', this._moveHandler);
    if (this._upHandler) {
      document.removeEventListener('pointerup', this._upHandler);
      document.removeEventListener('pointercancel', this._upHandler);
    }
    this._moveHandler = null; this._upHandler = null;
  }
}
