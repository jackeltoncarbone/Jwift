import {
  ChangeDetectionStrategy, Component,
  input, model, output, viewChild,
} from '@angular/core';
import { Jinput, type JinputSpan, Jiv, Jext, Jyle } from 'jaui-angular';
import TextInputJss from './TextInput.jss';

export type { JinputSpan as TextInputSpan };

/**
 * `<text-input>` — Jwift's house-styled wrapper around `<jinput>`.
 *
 * Adds Apple-style typography (Inter), padding, and a soft focus ring on
 * top of the bare Jaui primitive. Pass-through API: every input and event
 * on `<jinput>` is exposed here too. For per-range styling (e.g. tokens),
 * pass `[Spans]` — each span is `{ Start, End, Color?, Background? }`.
 *
 *   <text-input [Text]="title()" (TextChanged)="title.set($event)"
 *               Placeholder="Enter a title…" />
 *
 * Single-line vs multi-line is controlled by sizing — wrap a `<text-input>`
 * in a constrained-height container for single-line, or let it grow for
 * multi-line. Wrap follows the container width.
 */
@Component({
  selector: 'text-input',
  standalone: true,
  imports: [Jiv, Jinput, Jyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    <jiv class="TextInputBox">
      <jinput
        #jinput
        [Text]="Text()"
        (TextChange)="Text.set($event)"
        [Spans]="Spans()"
        [Placeholder]="Placeholder()"
        [ReadOnly]="ReadOnly()"
        [FontFamily]="_fontFamily()"
        [FontSizePx]="_fontSizePx()"
        [FontWeight]="_fontWeight()"
        [LineHeightRatio]="_lineHeightRatio()"
        [RowGapPx]="_rowGapPx()"
        (PositionClicked)="PositionClicked.emit($event)"
        (PositionHovered)="PositionHovered.emit($event)"
        (FocusChanged)="FocusChanged.emit($event)"
        (ContextMenuRequested)="ContextMenuRequested.emit($event)" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class TextInput {
  readonly JssSource = TextInputJss;

  // ── Inputs (pass-through) ────────────────────────────────────────
  readonly Text = model('');
  readonly Spans = input<readonly JinputSpan[]>([]);
  readonly Placeholder = input('');
  readonly ReadOnly = input(false);

  /** Optional font overrides. Left at house defaults when not provided. */
  readonly FontFamily = input<string | null>(null);
  readonly FontSizePx = input<number | null>(null);
  readonly FontWeight = input<number | null>(null);
  readonly LineHeightRatio = input<number | null>(null);
  readonly RowGapPx = input<number | null>(null);

  // ── Outputs (pass-through) ───────────────────────────────────────
  readonly PositionClicked = output<{ index: number; event: PointerEvent }>();
  readonly PositionHovered = output<{ index: number | null }>();
  readonly FocusChanged = output<boolean>();
  readonly ContextMenuRequested = output<{
    event: MouseEvent;
    selStart: number;
    selEnd: number;
    value: string;
  }>();

  // ── House defaults ───────────────────────────────────────────────
  // Apple-style baseline. PointScale 1.25 → 16pt × 1.25 = 20px.
  // Wrapping consumers can override individual values via inputs.
  protected readonly _fontFamily = (): string => this.FontFamily() ?? 'Inter, system-ui, sans-serif';
  protected readonly _fontSizePx = (): number => this.FontSizePx() ?? 20;
  protected readonly _fontWeight = (): number => this.FontWeight() ?? 400;
  protected readonly _lineHeightRatio = (): number => this.LineHeightRatio() ?? 1.6;
  protected readonly _rowGapPx = (): number => this.RowGapPx() ?? 5;

  // ── Imperative API ───────────────────────────────────────────────
  private readonly _jinput = viewChild<Jinput>('jinput');

  /** Programmatically focus the input. Forwards to the underlying jinput. */
  Focus = (): void => {
    this._jinput()?.Focus();
  };
}
