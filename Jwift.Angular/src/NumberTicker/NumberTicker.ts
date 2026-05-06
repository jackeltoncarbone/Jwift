import {
  ChangeDetectionStrategy, Component, computed, effect, input, signal, untracked,
} from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import type { JivStyle, TextStyle, ChildLayout } from 'jaui';
import { type Cell, DiffCells, CellTranslatePt } from './NumberTicker.Logic';
import NumberTickerJss from './NumberTicker.jss';

/**
 * `<number-ticker>` — Jwift primitive that animates a numeric string per
 * character. When a single digit in the value changes (e.g. 0:09 → 0:10),
 * only the cells whose characters actually changed slide; unchanged
 * neighbors hold steady. The slide is a spring on `VisualTranslate`
 * declared in `NumberTicker.jss`, so the motion has Apple-counter snap
 * rather than the default `<jext>` text crossfade.
 *
 *   <number-ticker [Value]="elapsedTime()" />
 *
 * Built for surfaces that update at a steady cadence (timecodes, beat
 * counters, scores). Generic — no drill-specific assumptions baked in.
 *
 * Each cell uses a two-slot rotating buffer: the current character lives
 * in slot N, the previous character lingers in slot N^1. When the digit
 * changes, parity flips, the incoming char is written to the (formerly
 * hidden) opposite slot, and the stack's `VisualTranslate` springs to
 * expose it. Direction of slide alternates per change, which reads
 * cleanly for monotonically-incrementing readouts.
 */
@Component({
  selector: 'number-ticker',
  standalone: true,
  imports: [Jiv, Jext, Jyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    <jiv class="NumberTickerRow">
      @for (cell of _cells(); track $index) {
        <jiv class="NumberTickerCell" [childLayout]="_cellLayout()">
          <jiv class="NumberTickerStack" [style]="_stackStyle(cell)">
            <jext class="NumberTickerGlyph" [text]="cell.slots[0]" [textStyle]="_glyphTextStyle()" [childLayout]="_glyphLayout()" />
            <jext class="NumberTickerGlyph" [text]="cell.slots[1]" [textStyle]="_glyphTextStyle()" [childLayout]="_glyphLayout()" />
          </jiv>
        </jiv>
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class NumberTicker {
  readonly JssSource = NumberTickerJss;

  // ── Inputs ─────────────────────────────────────────────────────────
  /** Numeric string to display. Changes diff per character. */
  readonly Value = input('');

  /** Optional font overrides. Defaults match Jwift's house Inter style. */
  readonly FontFamily = input<string | null>(null);
  readonly FontSizePx = input<number | null>(null);
  readonly FontWeight = input<number | null>(null);
  readonly Color = input<string | null>(null);
  /** Multiplier on FontSizePx that drives both the cell height and the
   *  slide distance — keeping them coupled means the new digit always
   *  travels exactly one cell. */
  readonly LineHeightRatio = input<number | null>(null);
  /** Multiplier on FontSizePx that sets each cell's width. Uniform across
   *  every character so the row doesn't wiggle as digits change width
   *  in a proportional font (1 narrower than 4, etc.) — equivalent to
   *  tabular-nums in CSS. Default 0.62 reads well for Inter digits. */
  readonly CellWidthRatio = input<number | null>(null);

  // ── Resolved house defaults ────────────────────────────────────────
  protected readonly _fontFamily = (): string => this.FontFamily() ?? 'Inter, system-ui, sans-serif';
  protected readonly _fontSizePx = (): number => this.FontSizePx() ?? 14;
  protected readonly _fontWeight = (): number => this.FontWeight() ?? 500;
  protected readonly _color = (): string => this.Color() ?? 'rgba(255, 255, 255, 1)';
  protected readonly _lineHeightRatio = (): number => this.LineHeightRatio() ?? 1.2;
  protected readonly _cellWidthRatio = (): number => this.CellWidthRatio() ?? 0.62;

  /** Cell height in pt — same value sets the cell's Height and the slide
   *  distance so the incoming digit travels exactly one cell. */
  private readonly _cellHeight = computed(() => this._fontSizePx() * this._lineHeightRatio());

  /** Uniform cell width — kills the layout-shift you'd otherwise get when
   *  a proportional digit changes width (1 → 4, etc.). */
  private readonly _cellWidth = computed(() => this._fontSizePx() * this._cellWidthRatio());

  /** Cell sizing lives on ChildLayout, not Style. Pinning Height + Width
   *  here (not in JSS) keeps the slide distance and the cell footprint
   *  coupled to the same FontSizePx input. */
  protected readonly _cellLayout = computed<Partial<ChildLayout>>(() => ({
    Width: `${this._cellWidth()}pt`,
    Height: `${this._cellHeight()}pt`,
  }));

  /** Glyph fills the cell vertically so its baseline sits at the same
   *  Y inside both slots — without this the second slot's glyph would
   *  size to its intrinsic line and the slide could overshoot. */
  protected readonly _glyphLayout = computed<Partial<ChildLayout>>(() => ({
    Height: `${this._cellHeight()}pt`,
  }));

  protected readonly _glyphTextStyle = computed<Partial<TextStyle>>(() => ({
    FontFamily: this._fontFamily(),
    FontSize: `${this._fontSizePx()}pt`,
    FontWeight: this._fontWeight(),
    Color: this._color(),
    LineHeight: `${this._lineHeightRatio()}`,
  }));

  protected _stackStyle = (cell: Cell): Partial<JivStyle> => ({
    VisualTranslate: CellTranslatePt(cell, this._cellHeight()),
  });

  // ── Diff state ─────────────────────────────────────────────────────
  protected readonly _cells = signal<Cell[]>([]);

  constructor() {
    // Sync cells from Value. We read _cells inside _sync, but only via
    // untracked() — the effect tracks Value alone, never re-fires from
    // its own writes. Diff math is in NumberTicker.Logic so it stays
    // unit-testable independent of Angular.
    effect(() => {
      const value = this.Value();
      untracked(() => this._cells.set(DiffCells(this._cells(), value)));
    });
  }
}
