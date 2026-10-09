import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { IsNewPress, NextRepeatDelayMs } from './Stepper.Repeat';
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
 * Two fixes, both still live below:
 *
 *   (a) The tap itself. `(click)` cancels the moment travel since press passes 10px — Chromium's own mobile
 *       slop, `Jaui.ts`'s `TAP_SLOP`. Each segment presses its own `(pointerdown)`/`(pointerup)` pair instead
 *       (lane AI1 below carries this further: `(mousedown)`/`(mouseup)` too).
 *   (b) The sheet closing under it. A fast tap's own in-tap wobble could cross the sheet card's own vertical
 *       pan claim (`Jwift_SheetCard { PanClaim: Down }`) — reading as the start of its swipe to dismiss. Each
 *       segment claims its own press's pan the instant it lands (`Node.ClaimPan()`, taking the
 *       `PanClaim: Hold` Stepper.jss already gives it, `Scroll.PanClaim.ts`'s own "`Hold` never claims on its
 *       own; it exists only to be taken") — before the engine has measured any travel at all, so no wobble
 *       during a tap on the stepper can ever reach the card's own claim. Apple's own UIStepper never lets a
 *       tap on it double as the sheet's own swipe down; this is that rule.
 *
 * Drill Sentences lane AI1 (my own live check): desktop, holding "−" for 1.5s stepped once, with no repeat
 * at all; phone, four quick taps went 16 -> 4, three steps per tap, where 1s-spaced taps stepped once each.
 * Apple's own `UIStepper` (`Jwift/Apple/HIG.md` 14): "Press-and-hold auto-repeats and accelerates... one-
 * tap-per-step with no repeat is missing standard behavior" — desktop never repeated at all, and lane AH1's
 * own `(click)`/`_downId` dedupe between a pointer-driven tap and its own synthesized `click` (the engine
 * fires `OnClick` before the matching `OnPointerUp`, `Jaui.ts`'s own `pointerup` handler) had nothing
 * standing between ONE physical tap's `pointerdown` and the NEXT one's, so four taps fast enough for the
 * engine's own event queue to coalesce oddly could still cross-fire. Both fixed together: a press now bumps
 * ONCE, immediately, on press-DOWN (Apple's own stepper gives feedback the instant a finger lands, never
 * waiting on lift) and then repeats on a real timer (`Stepper.Repeat.ts`'s `NextRepeatDelayMs`, pinned by
 * `Stepper.Repeat.spec.ts`) until release or a limit — so a quick tap, however many of `pointerdown`,
 * the compat `mousedown` a touch can ALSO raise, and `click` the browser sends for it, is the ONE gesture
 * `_pressOpen` (below) already has open, and a hold repeats on its own schedule with nothing left to race.
 */
@Component({
  selector: 'stepper',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_Stepper">
      <jiv #minus [class]="_MinusClass()"
           (pointerdown)="_onPressStart('Minus')" (pointerup)="_onPressEnd('Minus')" (pointercancel)="_onPressEnd('Minus')"
           (mousedown)="_onPressStart('Minus')" (mouseup)="_onPressEnd('Minus')"
           (click)="_onSegClick('Minus')">
        <icon class="Jwift_StepperGlyph" Name="minus" />
      </jiv>
      <jiv class="Jwift_StepperDivider" />
      @if (!hideValue()) {
        <jext class="Jwift_StepperValue" [text]="value() + ''" />
        <jiv class="Jwift_StepperDivider" />
      }
      <jiv #plus [class]="_PlusClass()"
           (pointerdown)="_onPressStart('Plus')" (pointerup)="_onPressEnd('Plus')" (pointercancel)="_onPressEnd('Plus')"
           (mousedown)="_onPressStart('Plus')" (mouseup)="_onPressEnd('Plus')"
           (click)="_onSegClick('Plus')">
        <icon class="Jwift_StepperGlyph" Name="plus" />
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class Stepper implements OnDestroy {
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

  /** Whether a press is OPEN for this segment right now — the one gate every press-start (`pointerdown`,
   *  the compat `mousedown` a touch can ALSO raise, lane AI1) and every press-end (`pointerup`,
   *  `pointercancel`, `mouseup`) checks (`Stepper.Repeat.ts`'s `IsNewPress`), so however many of those
   *  the browser sends for ONE physical tap, only the first start opens it and only the first end closes
   *  it. `click` reads it too, to tell a keyboard's Enter/Space (no pointer events at all) apart from a
   *  pointer tap's own synthesized click (the engine fires `OnClick` before the matching `OnPointerUp`,
   *  `Jaui.ts`'s own `pointerup` handler, so this is STILL open when that click lands). */
  private readonly _pressOpen: { Minus: boolean; Plus: boolean } = { Minus: false, Plus: false };
  /** The repeat chain's own pending wait, per segment — cleared on every press-end, including the
   *  component's own teardown (`ngOnDestroy`), so a held stepper that leaves the page mid-repeat never
   *  bumps a value nothing reads any more. */
  private readonly _repeatTimer: { Minus: ReturnType<typeof setTimeout> | null; Plus: ReturnType<typeof setTimeout> | null } =
    { Minus: null, Plus: null };

  /** Part (a): a press lands — bump ONCE, at once (Apple's own `UIStepper` gives feedback the instant a
   *  finger touches down, never waiting on lift), then arm the repeat chain (`_armRepeat`). Part (b):
   *  claims this press's pan for the segment itself, the instant it lands — ahead of any travel the
   *  engine's own `PickClaimant` arbitration could ever measure, so the sheet's card (`PanClaim: Down`)
   *  can never read a tap here as the start of its own swipe to dismiss. */
  protected _onPressStart(seg: 'Minus' | 'Plus'): void {
    if (!IsNewPress(this._pressOpen[seg])) return;
    this._pressOpen[seg] = true;
    (seg === 'Minus' ? this._minus() : this._plus())?.Node.ClaimPan();
    this._bump(seg === 'Minus' ? -this.step() : this.step());
    this._armRepeat(seg, Date.now());
  }

  /** Part (a)'s other half: the press closes — stand down the repeat chain. The value this press already
   *  reached (its own immediate bump, plus whatever repeats fired) stands; nothing further bumps on release. */
  protected _onPressEnd(seg: 'Minus' | 'Plus'): void {
    if (IsNewPress(this._pressOpen[seg])) return; // already closed (a redundant `pointercancel`/`mouseup`).
    this._pressOpen[seg] = false;
    const timer = this._repeatTimer[seg];
    if (timer !== null) { clearTimeout(timer); this._repeatTimer[seg] = null; }
  }

  /** Schedules this segment's NEXT repeat bump (`Stepper.Repeat.ts`'s `NextRepeatDelayMs`, the delay then
   *  the accelerating interval), re-arming itself after each one fires, until `_onPressEnd` clears the
   *  timer or a bump reaches a limit without moving the value (`_bump`'s own min/max clamp) — Apple's
   *  "stopping at release or at min/max." `startedAt` is the press's own `Date.now()`, so every wait is
   *  measured off how long the press has ACTUALLY stood, never off a fixed per-tick interval that would
   *  drift the delay-then-accelerate schedule under a slow frame. */
  private _armRepeat(seg: 'Minus' | 'Plus', startedAt: number): void {
    const wait = NextRepeatDelayMs(Date.now() - startedAt);
    this._repeatTimer[seg] = setTimeout(() => {
      this._repeatTimer[seg] = null;
      if (!this._pressOpen[seg]) return;
      const before = this._liveValue();
      this._bump(seg === 'Minus' ? -this.step() : this.step());
      if (this._liveValue() === before) { this._pressOpen[seg] = false; return; } // a limit: stop here.
      this._armRepeat(seg, startedAt);
    }, wait);
  }

  /** Keyboard's Enter/Space on the semantic mirror fires a bare `click`, no pointer events of its own at
   *  all — `_pressOpen` stays closed for it, so it bumps here directly. A pointer tap's own `click` finds
   *  the press `_onPressStart` already opened still open (this fires before the matching `pointerup`
   *  closes it) and stands down, so the one gesture bumps once, through `_onPressStart`, never twice. */
  protected _onSegClick(seg: 'Minus' | 'Plus'): void {
    if (!IsNewPress(this._pressOpen[seg])) return;
    this._bump(seg === 'Minus' ? -this.step() : this.step());
  }

  ngOnDestroy(): void {
    for (const seg of ['Minus', 'Plus'] as const) this._onPressEnd(seg);
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
