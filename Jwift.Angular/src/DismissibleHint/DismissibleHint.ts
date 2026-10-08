import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import DismissibleHintJss from './DismissibleHint.jss';

/**
 * `<dismissible-hint>` — a capsule hint with a dismiss: a glyph, one line, and the same 44pt round X
 * every "stop this mode" affordance wears. HOUSE geometry, promoted from Drill.jss's `PinHint`.
 * Positioning is the caller's own (a hint pinned under a header reads differently than one docked at a
 * pane's foot) — wrap it in a `Class` override, or a positioned parent, for placement.
 *
 *   <dismissible-hint glyph="mappin" text="Tap the spot this note is about" (dismiss)="StopPinning()" />
 */
@Component({
  selector: 'dismissible-hint',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_DismissibleHint">
      @if (glyph()) {
        <icon class="Jwift_DismissibleHintGlyph" [Name]="glyph()" />
      }
      <jext [class]="LabelClass()" [text]="text()" />
      <!-- Drill Sentences lane YY3b, item 8: tapping this X also reached whatever stood under the hint (the
           field, the player's own scrub rail — both arm themselves on pointerdown, before a click ever
           fires). click alone, with nothing stopping the press that precedes it, is exactly the gap
           EditorPlayer.ts's own OnDotDown already closes for every other small glyph drawn over a
           pointerdown-driven surface: stop the press here too, so a tap on the dismiss is only ever the
           dismiss's. -->
      <jiv class="Jwift_DismissibleHintDrop" [label]="dismissLabel()" (pointerdown)="$event.stopPropagation()" (click)="dismiss.emit()">
        <icon class="Jwift_DismissibleHintDropGlyph" Name="xmark" />
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class DismissibleHint {
  protected readonly Jss = DismissibleHintJss;

  readonly glyph = input('');
  readonly text = input.required<string>();
  readonly dismissLabel = input('Dismiss');
  /** Drill Sentences U1, item 9 live fix: every OTHER caller's own text is short BY DESIGN ("Stop
   *  pinning", "Tap the spot this note is about" — the latter already brushes one line's own width in
   *  its own dock) — `Jwift_DismissibleHintLabel`'s own `MaxLines: 1`/`Overflow: Hidden` was never wrong
   *  for THAT text, only for a caller with a genuinely longer sentence (item 9's own first-run hint, in
   *  a narrow Popover rather than a full-width dock) that needs the SAME capsule to actually wrap
   *  instead of clipping mid-word. Default `false` — every existing caller keeps today's one-line
   *  clip-if-it-must-be behaviour untouched. */
  readonly Wrap = input(false);

  readonly dismiss = output<void>();

  protected readonly LabelClass = computed(() =>
    this.Wrap() ? 'Jwift_DismissibleHintLabel Jwift_DismissibleHintLabel_Wrap' : 'Jwift_DismissibleHintLabel');
}
