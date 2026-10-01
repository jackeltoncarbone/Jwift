import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Jext, Jiv } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { ActionWidths, type SwipeAction } from './Swipe.Logic';

/**
 * `<swipe-strip>` — INTERNAL. The action buttons revealed behind a swiped row, drawn at their LAYOUT
 * position (sticking out past the row's own edge by the open amount) — the row's `VisualTranslate`
 * then carries the whole subtree, strip included, back over the row visually. Because that paint shift
 * never moves hit-testing, every action here is `PointerEvents: None`; `SwipeController` dispatches a
 * real tap by its own canvas-coordinate math (see its long comment). `(Pick)` still fires from a real
 * `(click)`, for the SEO/accessibility mirror's synthetic activation only (`TokenSentence`'s pattern).
 */
@Component({
  selector: 'swipe-strip',
  standalone: true,
  imports: [Jiv, Jext, Icon],
  template: `
    <jiv class="Jwift_SwipeStrip" [childLayout]="_layout()">
      @for (a of _visible(); track a.Key; let i = $index) {
        <jiv [class]="_actionClass(a)" [childLayout]="_actionLayout(i)" semantics="Button" [label]="a.Label" (click)="Pick.emit(a.Key)">
          @if (a.Icon) { <icon [class]="_glyphClass(a)" [Name]="a.Icon" /> }
          <jext [class]="_labelClass(a)" [text]="a.Label" />
        </jiv>
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwipeStrip {
  readonly Actions = input.required<readonly SwipeAction[]>();
  readonly Side = input.required<'Leading' | 'Trailing'>();
  /** The currently-open amount, px (`|tx|`). */
  readonly OpenWidth = input(0);
  /** `FullSwipe` armed — only the first action shows, stretched to the whole open width. */
  readonly Armed = input(false);

  readonly Pick = output<string>();

  protected readonly _visible = computed(() =>
    this.Armed() ? this.Actions().slice(0, 1) : this.Actions());
  private readonly _widths = computed(() => ActionWidths(this._visible().length, this.OpenWidth()));

  protected readonly _layout = computed(() => {
    const side = this.Side();
    const w = `${this.OpenWidth()}px`;
    return side === 'Trailing'
      ? { Position: 'Placed' as const, Left: '100%', Top: '0px', Height: '100%', Width: w }
      : { Position: 'Placed' as const, Right: '100%', Top: '0px', Height: '100%', Width: w };
  });

  protected _actionClass(a: SwipeAction): string {
    return `Jwift_SwipeAction Jwift_SwipeAction_${a.Tone}`;
  }

  protected _glyphClass(a: SwipeAction): string {
    return a.Tone === 'Danger' ? 'Jwift_SwipeActionGlyph_OnDanger'
      : a.Tone === 'Accent' ? 'Jwift_SwipeActionGlyph_OnProminent'
        : 'Jwift_SwipeActionGlyph';
  }

  protected _labelClass(a: SwipeAction): string {
    return a.Tone === 'Danger' ? 'Jwift_SwipeActionLabel_OnDanger'
      : a.Tone === 'Accent' ? 'Jwift_SwipeActionLabel_OnProminent'
        : 'Jwift_SwipeActionLabel';
  }

  protected _actionLayout(index: number) {
    const widths = this._widths();
    let left = 0;
    for (let i = 0; i < index; i++) left += widths[i];
    return { Position: 'Placed' as const, Left: `${left}px`, Top: '0px', Width: `${widths[index]}px`, Height: '100%' };
  }
}
