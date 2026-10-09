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
    <jiv [class]="HintClass()" [style]="HintStyle()">
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
      <jiv [class]="DropClass()" [label]="dismissLabel()" (pointerdown)="$event.stopPropagation()" (click)="dismiss.emit()">
        <icon [class]="DropGlyphClass()" Name="xmark" />
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
  /** `Capsule` (the default): a floating hint over a scene, one short line in a capsule ("Stop pinning", "Tap the spot
   *  this note is about"), its label clipped to one line. `Inline` (Drill Sentences lane R35, item 7; the owner, live:
   *  "why is the tooltip so thick and not taking up the full thickness of the panel"): Apple's TipKit inline tip, a
   *  TipView in a list. It spans its list's content width, a rounded rectangle whose corner its caller states
   *  (`Corner`, concentric with the row it stands in), its sentence the tip message's own Subheadline wrapped as it needs,
   *  and its close a small secondary glyph at the top trailing corner, its 44pt hit kept. */
  readonly Variant = input<'Capsule' | 'Inline'>('Capsule');
  /** The `Inline` tip's corner, pt: the caller's, concentric with what holds it. Unread by a capsule. */
  readonly Corner = input(0);

  readonly dismiss = output<void>();

  private readonly _inline = computed(() => this.Variant() === 'Inline');
  protected readonly HintClass = computed(() => (this._inline() ? 'Jwift_DismissibleHint Jwift_DismissibleHint_Inline' : 'Jwift_DismissibleHint'));
  protected readonly HintStyle = computed(() => (this._inline() ? { BorderRadius: `${this.Corner()}pt` } : {}));
  protected readonly LabelClass = computed(() =>
    this._inline() ? 'Jwift_DismissibleHintLabel Jwift_DismissibleHintLabel_Inline' : 'Jwift_DismissibleHintLabel');
  protected readonly DropClass = computed(() =>
    this._inline() ? 'Jwift_DismissibleHintDrop Jwift_DismissibleHintDrop_Inline' : 'Jwift_DismissibleHintDrop');
  protected readonly DropGlyphClass = computed(() =>
    this._inline() ? 'Jwift_DismissibleHintDropGlyph Jwift_DismissibleHintDropGlyph_Inline' : 'Jwift_DismissibleHintDropGlyph');
}
