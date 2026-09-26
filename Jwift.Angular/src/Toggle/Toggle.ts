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

/** Knob travel while HELD, in points, MATCHING Toggle.jss.
 *
 *  The resting thumb is 40.5 wide and travels 2.5 -> 26.5, but the sheet owns that and a drag
 *  never sees it: the thumb swells to 63.5 the moment it is held, so a drag clamps to the held
 *  pair below. Clamping a held thumb to the resting range offsets it by the difference, which
 *  reads as the thumb sitting wrong for the mode being toggled to. */
const KNOB_PRESSED_MIN = -8.5;
const KNOB_PRESSED_MAX = 14.5;

/**
 * `<toggle>` — the system switch.
 *
 * MOVEMENT BASED, like the slider: the thumb follows the pointer while held rather than
 * jumping between two positions. Releasing ALWAYS toggles, wherever the thumb happens to
 * be, so a drag is a way of feeling the control rather than a way of choosing a value.
 *
 * The press begins on any part of the switch and ends on a pointer up ANYWHERE on the
 * document, so dragging off the control and releasing still completes the interaction.
 * That is why the listeners live on the document and not on the host.
 */
@Component({
  selector: 'toggle',
  standalone: true,
  imports: [Jiv],
  template: '<jiv [class]="TrackClass()" [jivStyle]="TrackTint()"><jiv [class]="KnobClass()" [childLayout]="KnobLayout()" /></jiv>',
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

  protected readonly TrackClass = computed(() => {
    const on = this.checked();
    if (this.disabled()) return on ? 'Jwift_ToggleTrack_OnDisabled' : 'Jwift_ToggleTrack_Disabled';
    return on ? 'Jwift_ToggleTrack_On' : 'Jwift_ToggleTrack';
  });

  protected readonly TrackTint = computed(() => {
    const t = this.tint();
    return t && this.checked() ? { Background: t } : undefined;
  });

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
    super('Toggle', ToggleJss, 'Jwift_Toggle', () => (this.disabled() ? 'Jwift_Toggle_Disabled' : 'Jwift_Toggle'));
    effect(() => this.SetDisabled(this.disabled()));
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
