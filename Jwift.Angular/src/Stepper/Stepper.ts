import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import StepperJss from './Stepper.jss';

/**
 * `<stepper>` — Apple's own UIStepper shape: one two-segment capsule, minus and plus, a hairline the
 * one seam between them. `hideValue` (true for the stepper beside a wheel or under a dial, which already
 * show the number themselves) drops the value a standalone stepper otherwise reads between the segments,
 * each then a pair of dividers rather than one. `coarse` is the caller's own pointer read — Jwift carries
 * no sense of its own of which the app's `UiState.Coarse` is.
 *
 *   <stepper [value]="Count()" [min]="2" [step]="2" (valueChange)="Count.set($event)" />
 *
 * Drill Sentences lane AH1, item 1 (blind phone round 31, 21-after-minus4.png: four quick taps on "−"
 * registered only three decrements, and the sheet it sat in then closed itself on the unconfirmed value).
 * Two fixes, both below:
 *
 *   (a) The tap itself. `(click)` cancels the moment travel since press passes 10px — Chromium's own mobile
 *       slop, `Jaui.ts`'s `TAP_SLOP` — which four quick real taps can cross even while each one still lifts
 *       squarely back over its own segment; Apple's own stepper "registers every tap... however fast." Each
 *       segment now presses its own `(pointerdown)`/`(pointerup)` pair instead: the engine fires
 *       `OnPointerUp` on whichever jiv the finger actually lifted over, UNCONDITIONALLY — no intermediate
 *       travel ever cancels it the way it cancels `(click)`'s own pending press. `(click)` stays too, for a
 *       keyboard's Enter/Space on the semantic mirror (which fires no pointer events of its own at all) —
 *       `_downId` tells it a pointer-driven tap is already in flight (or just finished) so the one gesture
 *       still bumps only once.
 *   (b) The sheet closing under it. The same in-tap wobble that used to cancel the click could also cross
 *       the sheet card's own vertical pan claim (`Jwift_SheetCard { PanClaim: Down }`) — reading as the
 *       start of its swipe to dismiss. Each segment claims its own press's pan the instant it lands
 *       (`Node.ClaimPan()`, taking the `PanClaim: Hold` Stepper.jss already gives it, `Scroll.PanClaim.ts`'s
 *       own "`Hold` never claims on its own; it exists only to be taken") — before the engine has measured
 *       any travel at all, so no wobble during a tap on the stepper can ever reach the card's own claim.
 *       Apple's own UIStepper never lets a tap on it double as the sheet's own swipe down; this is that rule.
 */
@Component({
  selector: 'stepper',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_Stepper">
      <jiv #minus [class]="_MinusClass()" (pointerdown)="_onSegDown($event, 'Minus')" (pointerup)="_onSegUp($event, 'Minus')"
           (click)="_onSegClick('Minus')">
        <icon class="Jwift_StepperGlyph" Name="minus" />
      </jiv>
      <jiv class="Jwift_StepperDivider" />
      @if (!hideValue()) {
        <jext class="Jwift_StepperValue" [text]="value() + ''" />
        <jiv class="Jwift_StepperDivider" />
      }
      <jiv #plus [class]="_PlusClass()" (pointerdown)="_onSegDown($event, 'Plus')" (pointerup)="_onSegUp($event, 'Plus')"
           (click)="_onSegClick('Plus')">
        <icon class="Jwift_StepperGlyph" Name="plus" />
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class Stepper {
  protected readonly Jss = StepperJss;

  readonly value = input.required<number>();
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input<number>(1);
  readonly disabled = input<boolean>(false);
  /** True beside a wheel or under a dial (`NumberField`'s own Wheel mode, `AngleDial`): the value already
   *  shows there, so this stays a bare two-segment capsule. */
  readonly hideValue = input(false);
  /** Apple's 44pt touch floor for each segment, read from the caller (Jwift has no pointer sense of its
   *  own); the house's 30pt otherwise. */
  readonly coarse = input(false);

  readonly valueChange = output<number>();

  protected readonly _MinusClass = computed(() => this._segClass(this.disabled() || this._atMin()));
  protected readonly _PlusClass = computed(() => this._segClass(this.disabled() || this._atMax()));

  private _segClass(disabled: boolean): string {
    let cls = 'Jwift_StepperSeg';
    if (this.coarse()) cls += ' Jwift_StepperSeg_Coarse';
    if (disabled) cls += ' Jwift_StepperSeg_Disabled';
    return cls;
  }

  private readonly _minus = viewChild<Jiv>('minus');
  private readonly _plus = viewChild<Jiv>('plus');

  /** Keeps this stepper trusting its OWN most recent bump until the caller's `value` catches up to it: a
   *  burst of fast taps must never have its 2nd one read the 1st's own already-sent value back off a prop
   *  the caller has not echoed yet (item 1, part (a)'s own "every tap, however fast"). Cleared the moment
   *  the external value actually matches what was last sent, so a programmatic change (typed digits, the
   *  wheel) is trusted again at once. */
  private readonly _lastEmitted = signal<number | null>(null);
  private readonly _resetLastEmitted = effect(() => {
    if (this._lastEmitted() === this.value()) this._lastEmitted.set(null);
  });
  private readonly _liveValue = computed(() => this._lastEmitted() ?? this.value());

  private readonly _atMin = computed(() => {
    const min = this.min();
    return min !== null && this._liveValue() <= min;
  });
  private readonly _atMax = computed(() => {
    const max = this.max();
    return max !== null && this._liveValue() >= max;
  });

  /** The pointer id a segment's press is tracking, and which segment — null once it lifts (or never started). */
  private _downId: number | null = null;

  /** Part (b): claims this press's pan for the segment itself, the instant it lands — ahead of any travel
   *  the engine's own `PickClaimant` arbitration could ever measure, so the sheet's card (`PanClaim: Down`)
   *  can never read a tap here as the start of its own swipe to dismiss. */
  protected _onSegDown(e: PointerEvent, seg: 'Minus' | 'Plus'): void {
    this._downId = e.pointerId;
    (seg === 'Minus' ? this._minus() : this._plus())?.Node.ClaimPan();
  }

  /** Part (a): the tap itself, off the engine's own `OnPointerUp` hit — fired on whichever jiv the finger
   *  actually lifted over, with no intermediate-travel cancellation at all (unlike `(click)`'s own pending
   *  press, cancelled by `Jaui.ts`'s 10px `TAP_SLOP`). Only the matching pointer id counts, so a finger that
   *  slid off this segment before lifting elsewhere never fires it from here. */
  protected _onSegUp(e: PointerEvent, seg: 'Minus' | 'Plus'): void {
    if (this._downId !== e.pointerId) return;
    this._downId = null;
    this._bump(seg === 'Minus' ? -this.step() : this.step());
  }

  /** Keyboard's Enter/Space on the semantic mirror fires a bare `click`, no pointer events of its own at
   *  all — `_downId` stays null for it, so it bumps here directly. A pointer tap's own `click` (Jaui's
   *  engine dispatches it, when travel stayed under slop, BEFORE the matching `pointerup` that `_onSegUp`
   *  answers to) finds `_downId` still set and stands down, so the one gesture bumps once, through
   *  `_onSegUp`, never twice. */
  protected _onSegClick(seg: 'Minus' | 'Plus'): void {
    if (this._downId !== null) return;
    this._bump(seg === 'Minus' ? -this.step() : this.step());
  }

  protected _bump(delta: number): void {
    if (this.disabled()) return;
    if (delta < 0 && this._atMin()) return;
    if (delta > 0 && this._atMax()) return;
    let next = this._liveValue() + delta;
    const min = this.min();
    const max = this.max();
    if (min !== null) next = Math.max(min, next);
    if (max !== null) next = Math.min(max, next);
    this._lastEmitted.set(next);
    this.valueChange.emit(next);
  }
}
