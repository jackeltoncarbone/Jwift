import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Jaui, Jext, Jiv, JSS_REGISTRY } from 'jaui-angular';
import { ComposeFontFamily, TabularFamilyStack } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import { Icon } from '../Icon/Icon';
import { IconData } from '../Icon/Icon.Data';
import { CanvasPress } from '../Internal/CanvasPress';
import { ClaimPress } from '../Internal/PressClaim';
import type { PopoverRect } from '../Popover/Popover.Placement';
import TokenSentenceJss from './TokenSentence.jss';
import {
  IsTappable,
  LandPieces,
  LayoutSentence,
  PillRectOf,
  ResolvesSanFrancisco,
  SameWords,
  TextPieceKeys,
  TrackingFor,
  UnderlineOf,
  type PieceLanding,
  type SentenceHit,
  type SentenceLayoutResult,
  type SentenceToken,
  type SentenceTokenKind,
} from './TokenSentence.Layout';

export type { SentenceToken, SentenceTokenKind };

/** A label's level on glass (Jwift.Glass.jss's vibrancy scale): its ink is the level's, over whatever glass it sits on. */
type _LabelLevel = 'JwiftLabelVibrancy' | 'JwiftSecondaryLabelVibrancy';

interface _KindStyle { readonly Ink: string | _LabelLevel; readonly Weight: number; readonly Underline: string | null; }

/** Every kind's ink, weight and full strength underline; at rest the underline is `UnderlineOf`'s (lane PP2, item 5).
 *  Drill Sentences lane WW1: a word's ink is Apple's label level, a quiet word's the secondary level, from the one
 *  vibrancy scale every label on glass takes, so "32 counts" reads the same on the sheet, in a menu and in a toast. A
 *  role's ink (the gold of a playing step or an open control, a problem's red) stands as a colour. */
const KIND_STYLE: Record<SentenceTokenKind, _KindStyle> = {
  Text:        { Ink: 'JwiftLabelVibrancy',     Weight: 400, Underline: null },
  Quiet:       { Ink: 'JwiftSecondaryLabelVibrancy', Weight: 400, Underline: null },
  // Drill Sentences lane W2, item 6 (a persistent, quiet editability cue): the first-run hint only ever
  // glows once; after that, a neutral `@Line` hairline was the ONLY remaining signal that a word is
  // tappable, and it reads identically to a stray rule drawn for any other reason. Every TAPPABLE kind's
  // underline is `@AccentInkLine` now — the brand accent at a quiet 60% alpha, the Apple "text link" way:
  // "tappable" equals "accent-underlined" everywhere, permanently, not just during the one-time glow.
  // `Problem` keeps its own `@Danger` underline below -- that one is a different signal (something here
  // needs fixing), not "this is editable", and must not be diluted into the same quiet accent as everything
  // else.
  Word:        { Ink: 'JwiftLabelVibrancy',     Weight: 400, Underline: '@AccentInkLine' },
  // Drill Sentences U1, item 5 (two first-time testers): "16 counts" is already ONE atom end to end — the
  // app's own `CountsText`/`lengthToken` (Render.ts) bake the number and its unit word into a single
  // token, and `TokenSentence.Layout.ts`'s own `_buildUnits` never splits a tappable kind, so the hit rect
  // already spans the full "16 counts" width. What it carried nothing of was this UNDERLINE -- Value drew
  // bold with no underline at all, so the unit half of the phrase read as plain prose next to the bold
  // digits, and a first-time tester reasonably read only the bold part as "the control." A move's own
  // Value half ("forward" in "march forward") had the identical gap. Underlined now, matching Word --
  // the whole visible run (number AND unit, or verb AND value) reads as one continuous tappable phrase,
  // never half of it looking like inert text.
  Value:       { Ink: 'JwiftLabelVibrancy',     Weight: 600, Underline: '@AccentInkLine' },
  // Who ("1a", a squad name) is exactly as tappable as a move word — it opens WhoChooser — and carried
  // the identical gap Value did before item 5: bold ink, no underline, nothing that reads as "tap me"
  // once the one-time glow has passed. Same fix, same reasoning.
  Who:         { Ink: 'JwiftLabelVibrancy',     Weight: 700, Underline: '@AccentInkLine' },
  // A word still waiting on the director's input ("along a path", no path drawn yet): the soft ink of a
  // placeholder, Apple's secondary label, bold enough to stand out, with the accent underline every tappable
  // word wears. Drill Sentences lane HH2, item 7 (a round 12 blind tester: at the end of a playback "along a
  // path" stayed gold): it used to stand in gold, the very ink the playing step's words wear (`NowGroup`), so
  // a placeholder in the last step read as the highlight left behind once the playback stopped. Gold ink on a
  // sentence word means one thing now: the step playing, or the word whose control is open.
  Placeholder: { Ink: 'JwiftSecondaryLabelVibrancy', Weight: 600, Underline: '@AccentInkLine' },
  // The mirror pair's own icon (Render.ts's `Icon: 'arrow.left.and.right'`) tints the SAME as the "who"
  // tokens either side of it, not the softer ink the bare glyph used to carry -- the pair reads as one
  // unit, "1a ⇄ 1b", not an accent between two names.
  Mirror:      { Ink: 'JwiftLabelVibrancy',     Weight: 600, Underline: null },
  Problem:     { Ink: '@Danger',  Weight: 700, Underline: '@Danger' },
  // Drill Sentences lane X3, item 6: a quiet tappable word inside otherwise quiet text (a caption's own
  // "5 problems"). It keeps the caption's soft ink and regular weight, so the caption still reads as a
  // caption, and wears the same accent underline every other tappable word does, so it reads as one.
  Link:        { Ink: 'JwiftSecondaryLabelVibrancy', Weight: 400, Underline: '@AccentInkLine' },
  Badge:       { Ink: 'JwiftSecondaryLabelVibrancy', Weight: 600, Underline: null },
};

/**
 * An icon token's own font-size, as a multiple of the sentence's `FontSizePt` — scaled so the icon's
 * drawn ink is the SAME HEIGHT as a capital letter in the surrounding sentence text ("sized to cap
 * height", the SF Symbols rule for a glyph standing in for a character), not eyeballed:
 *
 *   - Inter's own capHeight is 1490/2048 em (fontkit against `Tools/PerfHarness/fonts/Inter-latin.woff2`,
 *     the one committed real-Inter-bytes file in the repo; `Icon.Conformance.spec.ts` reads the SAME
 *     kind of metric off the generated icon font the same way).
 *   - `arrow.left.and.right`'s own ink -- the mirror pair's icon -- is 1394/2048 em tall (fontkit
 *     against the committed `Icon.Font.woff2`); every glyph this generator builds is centered
 *     vertically ON THE GLYPH ORIGIN (`Icon.Conformance.spec.ts`'s own "centered on the baseline"
 *     check), which is exactly where Jaui's text paint lands (`Text.Measure.ts`'s own
 *     `ctx.textBaseline = 'middle'`) -- so scaling the icon's OWN font-size by capHeight/inkHeight
 *     makes its drawn ink match a capital letter's height at THIS sentence's FontSizePt, no separate
 *     baseline shift needed.
 *
 * 1490/1394 ≈ 1.0689 -- coincidentally close to `Icon.jss`'s own hand-picked 17pt default against a
 * 16pt body size (17/16 = 1.0625), which was probably eyeballing the exact same thing.
 */
const ICON_TOKEN_SCALE = 1490 / 1394;

/** The sentence's own base family stack (Drill Sentences lane YY3b, item 10): San Francisco first on an
 *  Apple device, Inter everywhere else — `-apple-system`/`BlinkMacSystemFont` ahead of the web font, exactly
 *  the one shape `ComposeFontFamily`'s own `_GENERIC_FAMILIES` fix (`Text.Measure.ts`) makes possible without
 *  silently dropping `Inter`. The ONE literal both `_measure` (this thread's pre-layout wrap) and
 *  `_textPieces` (the piece the engine actually paints) compose from, so the two can never name a different
 *  stack the way the "1ain" bug's own root cause once let them (this file's own long-standing doc comment,
 *  just below). */
const SENTENCE_FONT_STACK = '-apple-system, BlinkMacSystemFont, Inter';

/**
 * Drill Sentences lane YY3b, item 10 follow-up (live, 1440x900: a gap opened before every comma and
 * between some tokens, "left face , then left flank 8 counts ,", y9-picker.png/y9-clear.png). Root cause,
 * two bugs stacked: `SFProTracking` (San Francisco's own measured optical metrics, `Jwift/Apple/HIG.md`
 * section 15) applied to every piece's `LetterSpacing` UNCONDITIONALLY -- on Windows, where `-apple-system`
 * is valid CSS syntax but names no actual font, the stack falls through to Inter same as ever, but
 * San Francisco's tracking (negative through the body range, e.g. -0.43 at 17pt) was still being asked
 * of Inter's own, different letterforms. And `_measure` (this thread's pre-layout wrap pass) never
 * applied letter-spacing to its OWN canvas context at all, so the WIDTH that decided where the next piece
 * starts never shrank by the tracking the engine then DREW with -- a piece measured wide, painted
 * narrower (negative tracking), left unused room where `_measure` thought its own ink ran, reading as a
 * gap before whatever came next.
 *
 * `_resolvesSanFrancisco`, below, answers which is true on THIS device with a canvas probe, not a
 * platform/UA sniff: the same test string's measured advance under "-apple-system" alone against "Inter"
 * alone, fed to `TokenSentence.Layout.ts`'s own pure `ResolvesSanFrancisco` (spec'd there against
 * synthetic widths, no real canvas needed). Identical widths mean the identical fallback resolved both
 * times -- no San Francisco here, and tracking must read 0, Inter's own spacing being correct exactly as
 * it always was before this lane's font-family fix. Different widths mean San Francisco drew, and
 * `SFProTracking`'s numbers are the right ones to ask for. `_measure` applies the SAME resolved tracking
 * to its OWN `ctx.letterSpacing` that `_textPieces` asks the engine to paint with (`Text.Measure.ts`'s own
 * `ApplyTextStyle`, the identical canvas API, `letterSpacing`) -- one law, read twice, never two numbers
 * that could drift the way `_measure`'s own font-family literal and the engine's used to (this file's
 * "1ain" doc comment, above).
 */
let _sfProbe: { Epoch: number; Resolves: boolean } | null = null;
const _resolvesSanFrancisco = (ctx: CanvasRenderingContext2D, epoch: number): boolean => {
  if (_sfProbe && _sfProbe.Epoch === epoch) return _sfProbe.Resolves;
  const probe = 'San Francisco probe gIl1';
  const prevFont = ctx.font;
  ctx.font = '16px -apple-system';
  const appleWidth = ctx.measureText(probe).width;
  ctx.font = '16px Inter';
  const interWidth = ctx.measureText(probe).width;
  ctx.font = prevFont;
  const resolves = ResolvesSanFrancisco(appleWidth, interWidth);
  _sfProbe = { Epoch: epoch, Resolves: resolves };
  return resolves;
};
/** Letter-spacing's own canvas API name isn't in `CanvasRenderingContext2D`'s TS type ("Chrome 94+,
 *  Safari 16.4+; fallback: ignored" -- `Text.Measure.ts`'s own `ApplyTextStyle`, the identical cast). A
 *  browser that ignores it ignores it in BOTH `_measure` and the engine's own paint alike, so there is
 *  still only ever one number read twice, never a measured-wide/painted-narrow mismatch either way. */
const _setLetterSpacing = (ctx: CanvasRenderingContext2D, px: number): void => {
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
};

/** A fresh canvas 2D context per page-font generation, mirroring Jinput's `_watchPageFonts`/`_fontGen`
 *  — moved whenever the page may have gained a face, so a word measured before its font landed is
 *  never trusted again. Module-level: every `<token-sentence>` on the page shares one watcher. */
const _pageFontEpoch = signal(0);
let _pageFontsWatched = false;
const _watchPageFonts = (): void => {
  if (_pageFontsWatched || typeof document === 'undefined') return;
  _pageFontsWatched = true;
  const bump = (): void => _pageFontEpoch.update((v) => v + 1);
  document.fonts?.addEventListener?.('loadingdone', bump);
  if (document.readyState !== 'complete') window.addEventListener('load', bump, { once: true });
  // Round 13's own tabular-twin install (Bridge.Main.ts) adds an already-`.load()`-resolved FontFace
  // straight to `document.fonts` rather than going through a CSS/`fonts.load()`-triggered load, which
  // does not reliably fire 'loadingdone' on its own -- `fonts.ready` is the browser's own backstop
  // signal that every outstanding font job (including a plain `.add()`) has settled, so a sentence
  // measured in the brief window before the twin lands still gets re-measured once it does.
  document.fonts?.ready?.then(bump).catch(() => {});
  const watchLink = (node: Node): void => {
    if (node instanceof HTMLLinkElement && node.relList.contains('stylesheet')) node.addEventListener('load', bump, { once: true });
  };
  document.querySelectorAll('link').forEach(watchLink);
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver((records) => { for (const r of records) r.addedNodes.forEach(watchLink); })
      .observe(document.head ?? document.documentElement, { childList: true });
  }
};

interface _PieceState { Hover: boolean; Press: boolean; Open: boolean; Glow: boolean; }

/** The "+"'s own key among the pieces `LandPieces` tracks (never a real token key, which is the caller's). */
const ADD_KEY = '\u0000add';

/**
 * `<token-sentence>`: a cue rendered as tappable prose — every word a token you can tap, karaoke
 * highlighting the token a playhead is over, a trailing "+" to append. A `JivHost`; every visual child
 * is `PointerEvents: None` and the host alone hit-tests, the same shape `GlassDropdown` hit-tests its
 * rows with (everything paints into one canvas, so DOM `contains()` can't tell what's under a point).
 *
 *   <token-sentence [Tokens]="tokens()" [OpenKey]="openKey()" [NowGroup]="nowGroup()"
 *                   (TokenTap)="onTap($event)" (AddTap)="onAdd($event)" />
 */
@Component({
  selector: 'token-sentence',
  standalone: true,
  imports: [Jiv, Jext, Icon],
  template: `
    @for (piece of _visiblePills(); track piece.Key) {
      <jiv [class]="piece.Class" [childLayout]="piece.Layout" />
    }
    @for (u of _underlines(); track u.Key) {
      <jiv [class]="u.Class" [style]="u.Style" [childLayout]="u.Layout" />
    }
    @for (t of _textPieces(); track t.Key) {
      @if (t.Tappable) {
        <jext [class]="t.Class + ' Jwift_TokenSentenceTextHit'" [text]="t.Text" [textStyle]="t.TextStyle" [childLayout]="t.Layout"
              semantics="Button" [label]="t.Label" (click)="_onMirrorActivate(t.TokenKey)" />
      } @else {
        <jext [class]="t.Class" [text]="t.Text" [textStyle]="t.TextStyle" [childLayout]="t.Layout" />
      }
    }
    @for (add of _add(); track add.Key) {
      <jiv [class]="add.Class" [childLayout]="add.Layout" semantics="Button" [label]="AddLabel()" (click)="_onAddClick()">
        <icon class="Jwift_TokenSentenceAddGlyph" Name="plus" />
      </jiv>
    }
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: Jiv, useExisting: forwardRef(() => TokenSentence) }],
  host: {
    '(pointerdown)': '_onHostPointerDown($event)',
    '(pointermove)': '_onHostPointerMove($event)',
    '(click)': '_onHostClick($event)',
  },
})
export class TokenSentence extends JivHost implements OnInit, OnDestroy {
  readonly Tokens = input<readonly SentenceToken[]>([]);
  readonly OpenKey = input<string | null>(null);
  /** Drill Sentences U1, item 9 (a gentle first-run hint): the one token this sentence points at as the hint's
   *  target. Drill Sentences lane AE1, item 3 (blind testers, both devices: "mark time" wore a solid gold chip
   *  while every other editable word was underlined, "same affordance, two looks") — this no longer paints a
   *  pill of its own: `_underlines` below brings the glowing token's own underline to FULL strength instead,
   *  the SAME underline every other word wears, never a second visual language for "look here." `OpenKey`'s
   *  solid gold pill is unrelated and unchanged — that one means "its control is actually open," this one
   *  means only "look here." The PULSE itself (on, off, on, off) is the CALLER's own job, not this
   *  component's — it just renders whatever `GlowKey` says RIGHT NOW; a caller wanting "pulse twice" toggles
   *  this input between the target key and `null` on a timer (`EditorLine.ts`'s own `_glowPulseKey`), the
   *  same way any other input here drives an animated style through nothing more than a changing value. */
  readonly GlowKey = input<string | null>(null);
  readonly NowGroup = input<number | null>(null);
  readonly ShowAdd = input(false);
  readonly AddLabel = input('');
  readonly AddOpen = input(false);
  /** Drill Sentences U1, item 8 (two first-time testers): separate from `ShowAdd` on purpose. `ShowAdd`
   *  reserves the "+" glyph's own space in the LAYOUT (`LayoutSentence`'s own `opts.ShowAdd` — it changes
   *  where the sentence wraps, "glued to the last token"), so toggling IT on a selection change would
   *  reflow the sentence exactly the way `EditorLine.ts`'s own "…" button already had to be fixed not to.
   *  `AddVisible` (default `true`, so every existing caller is unaffected) only fades the glyph's own
   *  PAINT — `_add`'s own `Jwift_TokenSentenceAdd_Faded` class below — while its reserved box stays put
   *  either way. A caller wanting "+" visible only on its own selected/current row passes
   *  `[AddVisible]="IsSelected()"`; the KIT's own `TokenSentence.jss` separately reveals it on an
   *  ANCESTOR hover too (`Ancestor(Jwift_HoverGroup):Hover`), the generic half of item 8 every caller
   *  gets for free by wrapping its own row in a `Jwift_HoverGroup` class. */
  readonly AddVisible = input(true);
  /** How a "+" `AddVisible` leaves out rests: `Hidden`, nothing to see (a touch screen's rows), or `Faint`, a quiet
   *  "+" that says there is one to press (Drill Sentences lane QQ2, item 5: a round 21 blind desktop tester hovered a
   *  row and found no "+"; a desktop row's "+" rests faint and shows whole on the row the mouse is over). */
  readonly AddRest = input<'Hidden' | 'Faint'>('Hidden');
  /** BCP-47; reserved for a future per-language measurement/shaping hook. */
  readonly Language = input<string | null>(null);
  readonly FontSizePt = input(16);
  readonly LineHeightPt = input(23);
  readonly Tabular = input(false);
  /** The least a tappable word's hit stands wide, pt (`SentenceLayoutOptions.MinHitWidth`; Drill Sentences lane WW2,
   *  item 3). 0 leaves every hit its share of the gaps beside it. */
  readonly MinHitWidthPt = input(0);
  /** Drill Sentences lane PP2, item 5: 'Rest' while the sentence's row is neither selected nor hovered, when only the
   *  values, the who and the move word wear an underline, faintly, until the row is hovered (`UnderlineOf`); 'Full'
   *  (the default, every caller that never asks) underlines every tappable word at full strength. */
  readonly Emphasis = input<'Full' | 'Rest'>('Full');

  readonly TokenTap = output<{ Key: string; Anchor: PopoverRect }>();
  readonly AddTap = output<{ Anchor: PopoverRect }>();
  /** Drill Sentences lane AA2, item 6: which token the pointer is over, on every move over this sentence
   *  and once more (`Key: null`) as it leaves, with the move itself so a caller can tell a resting mouse
   *  from a finger (`HoverTip`, the toolbar's own tip timing, reads both). A caller shows a word's quiet
   *  explanation from it; the sentence itself draws nothing new. */
  readonly TokenHover = output<{ Key: string | null; Event: PointerEvent }>();

  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _doc = inject(DOCUMENT);
  private readonly _jss = inject(JSS_REGISTRY);

  private readonly _hoveredKey = signal<string | null>(null);
  private readonly _pressedKey = signal<string | null>(null);
  private _lastPointer: { X: number; Y: number } | null = null;
  /** What the current gesture's own press resolved to (`_onHostPointerDown`), consumed by its click. */
  private _downKey: string | null = null;
  private _downSeen = false;
  private _docUnbind: (() => void) | null = null;
  private _rectUnwatch: (() => void) | null = null;

  private _measureCtx: CanvasRenderingContext2D | null = null;
  /** The real cause of round 12's own "1ain" ("1a" touching "in" with no space at all, even though the
   *  layout math and the TextStyle both check out correct -- live CDP read of the real rendered pieces,
   *  round 13): `Tabular` (bound `true` on every `<token-sentence>`, `EditorLine.ts`) makes the RENDERER
   *  swap EVERY piece's own font family to a "tnum" twin face (`Text.Types.ts`'s own resolution of
   *  `FontVariantNumeric: TabularNums`, regardless of whether that piece's own text has a digit in it --
   *  a plain word under a tappable atom's own tabular styling gets it too) -- monospaced figures, each
   *  digit the SAME, usually WIDER width than its own proportional glyph. Round 13's first cut
   *  approximated that width from the main thread (the twin was only ever installed in the WORKER's own
   *  font registry, `Bridge.Worker.ts`'s own `_onFontFace`) with a padded guess, which Jack caught
   *  misfiring both ways live: too narrow for a two-digit run ("16 countsoutside" still touched), too
   *  wide once the pad covered it ("16 counts , then" read with a visible gap before its own comma).
   *
   *  Fixed for real now: `Bridge.Main.ts` installs the IDENTICAL twin face (same bytes, same
   *  `TABULAR_FEATURE_SETTINGS`) on THIS thread's own `document.fonts` too, under the SAME family name
   *  `Text.Types.ts` resolves to (`TabularFamilyStack`, re-exported off the `jaui` package for exactly
   *  this). `_measure` now simply asks THAT font family for a tabular piece's own string, whole, no
   *  per-character substitution or padding -- the real tnum advance, not an estimate of it, because the
   *  canvas doing the measuring finally has the same font the worker paints with.
   *
   *  Same reasoning covers the CJK sans fallback (SS drill-sentences, live: a Japanese/Chinese/Korean
   *  sentence rendered in a serif fallback because `Inter, system-ui, sans-serif` names no CJK face).
   *  `ComposeFontFamily` -- re-exported off `jaui` right next to `TabularFamilyStack`, same package, same
   *  reason -- is the ONE place that stack gets extended, and `Text.Measure.ts`'s own `ApplyTextStyle`
   *  calls it for the worker's real measure/paint. Composing it here too, over the identical base string,
   *  keeps this thread's own pre-layout wrap decision shaped against the exact font the worker ends up
   *  painting -- the same mismatch class as the tabular twin above, just for a different face. */
  private readonly _measure = (text: string, weight: number, icon?: string): number => {
    if (!text && !icon) return 0;
    if (typeof document === 'undefined') return 0;
    if (!this._measureCtx) {
      const c = document.createElement('canvas').getContext('2d');
      if (!c) return 0;
      this._measureCtx = c;
    }
    if (icon) {
      // JwiftIcons named first: the glyph it maps `icon` to is drawn from THAT font, never the body
      // stack's own fallback chain (the whole reason this is an icon token and not a text glyph).
      const size = this.FontSizePt() * ICON_TOKEN_SCALE + _pageFontEpoch() * 1e-4;
      const cp = IconData[icon.toLowerCase()];
      const glyph = cp != null ? String.fromCodePoint(cp) : '';
      this._measureCtx.font = `${weight} ${size}px JwiftIcons`;
      return this._measureCtx.measureText(glyph).width;
    }
    const size = this.FontSizePt() + _pageFontEpoch() * 1e-4;
    const base = this.Tabular() ? TabularFamilyStack(SENTENCE_FONT_STACK) : SENTENCE_FONT_STACK;
    this._measureCtx.font = `${weight} ${size}px ${ComposeFontFamily(base)}`;
    // The same resolved tracking `_textPieces` asks the engine to paint with (see this file's own doc
    // comment on `_resolvesSanFrancisco`, above) -- so the width that decides where the NEXT piece starts
    // already accounts for however much this one's own ink will actually spread or tighten.
    const tracking = TrackingFor(this.FontSizePt(), _resolvesSanFrancisco(this._measureCtx, _pageFontEpoch()));
    _setLetterSpacing(this._measureCtx, tracking);
    const width = this._measureCtx.measureText(text).width;
    _setLetterSpacing(this._measureCtx, 0);
    return width;
  };

  /** `Node.Width`, watched live. `Infinity` before the first rect arrives, so the first layout pass
   *  (before anything can be measured against a real width) never wraps spuriously. */
  private readonly _wrapWidth = signal(Infinity);

  /**
   * Drill Sentences lane YY3b, item 4 (a round 26 blind phone tester, shot 08: the peek row read "forward16
   * counts" and "thenmarch forward" — the mirror peek's own quiet prose, never the main sentence beside it,
   * which was already spaced right in the same screenshot). Root cause: the peek's `<token-sentence>` is a
   * FRESH mount every time a tap opens it (`@if (Peek(); as peek)`, `EditorLine.ts`), so it goes through the
   * SAME first layout pass as any other instance — `_wrapWidth` still `Infinity` here, everything measured
   * onto one long unwrapped row — and only gets its real width a frame later, off `OnRectSnapshot`/`OnRect`
   * below. `SnapLayout` defaults to `false` (`Element.ts`), so an ordinary reflow SPRINGS a reused piece
   * from its old box to its new one rather than cutting over — exactly right for a real width change (a
   * sheet smoothly resizing, `LandPieces`'s own doc comment: "a sheet resized... slides its pieces"), wrong
   * for resolving a GUESS that was never meant to be seen: the piece nearest the far end of that first,
   * much-too-wide row travels hundreds of px down onto a wrapped line while its neighbour barely moves, and
   * a screenshot caught mid-spring shows them still overlapping — the exact "glued words" bug class this
   * file already fixed once for a change of WORDS (`LandPieces`, above), now hitting the one case that
   * fix never covered: a change of WIDTH on the very first layout, before anything was ever shown. The main
   * sentence never shows it because its row already stands measured by the time anyone looks at it; the
   * peek is looked at the instant it exists. `_snapFirstLayout`, set once by `_setWrapWidth` the first time
   * a real width lands, tells `_snapWords` below to snap every piece's OWN layout too, that one time, so the
   * correct wrap is what the peek shows from its very first visible frame — never a guess it then slides
   * away from under the reader.
   */
  private _wrapMeasured = false;
  private _snapFirstLayout = false;

  private _setWrapWidth(width: number): void {
    if (!this._wrapMeasured) { this._wrapMeasured = true; this._snapFirstLayout = true; }
    this._wrapWidth.set(width);
  }

  protected readonly _layout = computed<SentenceLayoutResult>(() => {
    _pageFontEpoch();
    return LayoutSentence(this.Tokens(), {
      WrapWidth: this._wrapWidth(),
      LineHeight: this.LineHeightPt(),
      FontSize: this.FontSizePt(),
      Measure: this._measure,
      ShowAdd: this.ShowAdd(),
      MinHitWidth: this.MinHitWidthPt(),
    });
  });
  /** How tall the words stand, laid out, pt: known the moment they change, ahead of the box the engine springs to it
   *  (Drill Sentences lane UU3, item 4: a row's caption under its sentence knows at once that the sentence moved it). */
  readonly Height = computed(() => this._layout().Height);

  // ── Lane BB2, item 4: a change of words lands at once (`LandPieces`) ────────────────────────────────
  /** Where every piece (and the "+", under `ADD_KEY`) stood at the last layout, and its generation. */
  private _landings: ReadonlyMap<string, PieceLanding> = new Map();
  /** The words `_landings` was last measured for; null before the first layout. */
  private _landedWords: readonly SentenceToken[] | null = null;
  /** Every piece's key (`TextPieceKeys`) under the generation it last landed at, piece for piece, and the
   *  "+"'s: a piece that moved as the words changed is a new node where it now goes, never one sliding there. */
  private readonly _landedKeys = computed<{ readonly Pieces: readonly string[]; readonly Add: string }>(() => {
    const layout = this._layout();
    const tokens = this.Tokens();
    const keys = TextPieceKeys(layout.Pieces, (i) => tokens[i]?.Key ?? '');
    const spots = layout.Pieces.map((p, i) => ({ Key: keys[i], X: p.X, Y: p.Y }));
    if (layout.Add) spots.push({ Key: ADD_KEY, X: layout.Add.X, Y: layout.Add.Y });
    const changed = this._landedWords !== null && !SameWords(this._landedWords, tokens);
    this._landings = LandPieces(this._landings, spots, changed);
    this._landedWords = tokens;
    const keyed = (key: string): string => `${key}@${this._landings.get(key)?.Generation ?? 0}`;
    return { Pieces: keys.map(keyed), Add: keyed(ADD_KEY) };
  });
  /** Every word lands at once when it changes in place, rather than cross fading over itself (`SnapText`).
   *  Also re-runs on every relayout (`_layout()`, read for that alone) so the first real width's relayout
   *  — `_snapFirstLayout`, above — can snap every piece's own POSITION too, the one time a reflow is
   *  resolving a never-shown guess rather than a real visual change worth sliding through. `SnapLayout` is
   *  a standing flag, not a one-shot command (`Element.ts`), so it goes back to its own default right after
   *  this one commit — a later, real reflow (the words changing, an actual resize) still slides as designed. */
  private readonly _words = viewChildren(Jext);
  private readonly _snapWords = effect(() => {
    this._layout();
    const snapLayout = this._snapFirstLayout;
    const words = this._words();
    for (const word of words) {
      word.Node.SnapText = true;
      if (snapLayout) word.Node.SnapLayout = true;
    }
    if (snapLayout) {
      untracked(() => { this._snapFirstLayout = false; });
      queueMicrotask(() => { for (const word of words) word.Node.SnapLayout = false; });
    }
  });

  private readonly _state = computed<ReadonlyMap<string, _PieceState>>(() => {
    const hovered = this._hoveredKey();
    const pressed = this._pressedKey();
    const openKey = this.OpenKey();
    const glowKey = this.GlowKey();
    const out = new Map<string, _PieceState>();
    for (const t of this.Tokens()) {
      out.set(t.Key, { Hover: t.Key === hovered, Press: t.Key === pressed, Open: t.Key === openKey, Glow: t.Key === glowKey });
    }
    return out;
  });

  protected readonly _visiblePills = computed(() => {
    const layout = this._layout();
    const tokens = this.Tokens();
    const state = this._state();
    const landed = this._landedKeys().Pieces;
    const out: { Key: string; Class: string; Layout: Record<string, unknown> }[] = [];
    for (const [pieceIndex, piece] of layout.Pieces.entries()) {
      const token = tokens[piece.TokenIndex];
      if (!token) continue;
      if (token.Kind === 'Badge') {
        // Item 6 (Drill Sentences lane V2): no `:Row` here any more — a Badge is an ATOM (one piece,
        // `TokenSentence.Layout.ts`'s own doc comment), so `token.Key` alone already names it uniquely,
        // and keying on its CURRENT row the same way `TextPieceKeys` used to meant a later reflow (another
        // token's text changing width) could shift this one onto a different row and remount/refade a
        // badge that never itself changed. Same fix as `TextPieceKeys`, same reasoning.
        out.push({
          Key: `${landed[pieceIndex]}:badge`,
          Class: 'Jwift_TokenSentenceBadgePill',
          Layout: _rect(piece.X - 8, piece.Y + (this.LineHeightPt() - 19) / 2, piece.Width + 16, 19),
        });
        continue;
      }
      if (!IsTappable(token.Kind)) continue;
      const s = state.get(token.Key);
      // Drill Sentences lane AE1, item 3: Glow no longer earns a pill of its own here — a REAL interaction
      // state still does (the control is open, mid-press, or merely hovered); the hint's own "look here" is
      // `_underlines`' job now, the same underline every word wears, brought to full strength.
      if (!s || !(s.Hover || s.Press || s.Open)) continue;
      // Drill Sentences lane W2, item 1: a hairline gap between two tappable atoms that sit (almost)
      // touching — ja/zh glue a move's verb straight to its value with no space token between them —
      // so this pill never visually bleeds into the neighbour's own glyph. `layout.PillPads` (pure,
      // `TokenSentence.Layout.ts`) already worked out how much of the default 3px pad this piece's own
      // left/right edge can actually keep without crossing that neighbour's own half of the gap.
      const pad = layout.PillPads.find((p) => p.TokenIndex === piece.TokenIndex);
      const pill = PillRectOf(piece, this.FontSizePt(), this.LineHeightPt(), pad?.LeftPad, pad?.RightPad);
      const cls = s.Open
        ? (token.Kind === 'Problem' ? 'Jwift_TokenSentencePill Jwift_TokenSentencePill_OpenProblem' : 'Jwift_TokenSentencePill Jwift_TokenSentencePill_Open')
        : s.Press ? 'Jwift_TokenSentencePill Jwift_TokenSentencePill_Press'
          : 'Jwift_TokenSentencePill Jwift_TokenSentencePill_Hover';
      // Item 6: no `:Row` here either — a tappable token is also an ATOM (one piece), so `token.Key` alone
      // already names it, and the same reflow-reorders-row remount this file's other two keys just lost
      // would otherwise flicker the hover/press/open/glow pill off a token nobody touched.
      out.push({ Key: landed[pieceIndex], Class: cls, Layout: _rect(pill.X, pill.Y, pill.Width, pill.Height) });
    }
    return out;
  });

  protected readonly _underlines = computed(() => {
    const layout = this._layout();
    const tokens = this.Tokens();
    const state = this._state();
    const fs = this.FontSizePt();
    const lh = this.LineHeightPt();
    const landed = this._landedKeys().Pieces;
    const emphasis = this.Emphasis();
    const out: { Key: string; Class: string; Style: Record<string, unknown>; Layout: Record<string, unknown> }[] = [];
    for (const [pieceIndex, piece] of layout.Pieces.entries()) {
      const token = tokens[piece.TokenIndex];
      if (!token) continue;
      const s = state.get(token.Key);
      // Drill Sentences lane AE1, item 3 (blind testers, both devices: "mark time" wore a solid gold chip
      // while every other editable word was underlined, "same affordance, two looks"). The first-run hint's
      // glow is no longer a pill of its own (`_visiblePills`, above) — the glowing token's own underline
      // goes to FULL strength instead, the SAME underline every other word wears, never a second look.
      const underline = UnderlineOf(token.Kind, KIND_STYLE[token.Kind].Underline, s?.Glow ? 'Full' : emphasis);
      if (!underline) continue;
      if (s?.Open) continue; // the pill says "active" instead.
      // Item 6: same fix as `_visiblePills`/`TextPieceKeys` — Underline tokens (Word/Value/Problem) are
      // also ATOMS, so `token.Key` alone is enough, and dropping `:Row` stops a reflow elsewhere in the
      // sentence from remounting (and refading) an underline whose own token never changed.
      out.push({
        // Lane PP2, item 5: a faint line is its own node, so its class's paint is never left under a full one's style.
        Key: underline.Paint ? landed[pieceIndex] : `${landed[pieceIndex]}:faint`,
        Class: underline.Class,
        Style: underline.Paint ? { Background: underline.Paint } : {},
        Layout: _rect(piece.X, piece.Y + lh / 2 + 0.36 * fs + 4, piece.Width, 1),
      });
    }
    return out;
  });

  protected readonly _textPieces = computed(() => {
    const layout = this._layout();
    const tokens = this.Tokens();
    const state = this._state();
    const nowGroup = this.NowGroup();
    const fs = this.FontSizePt();
    const lh = this.LineHeightPt();
    // The SAME resolved family `_measure` already settled this layout pass against (`_layout()`, just
    // above, runs `_measure` for every piece before this computed ever reads its result) — one probe, one
    // answer, shared by every piece of this sentence rather than asked again per piece.
    const tracking = TrackingFor(fs, !!this._measureCtx && _resolvesSanFrancisco(this._measureCtx, _pageFontEpoch()));
    const out: {
      Key: string; Class: string; Text: string; TextStyle: Record<string, unknown>; Layout: Record<string, unknown>;
      Tappable: boolean; TokenKey: string; Label: string;
    }[] = [];
    // Round 14, live (phone): words blanked out for a frame or more while dragging the sheet between
    // detents, the underline staying put while the text above it vanished then faded back in. Keying a
    // piece by `${token.Key}:${piece.Row}:${piece.X}` (round 13's own fix) meant ANY move in X -- even
    // the sub-pixel kind a mid-drag rewrap or a `_pageFontEpoch` bump produces, neither of which changes
    // WHICH piece this is -- read to Angular's `@for` as a brand new item: it destroyed the old `<jext>`
    // and mounted a fresh one, and a fresh text node's own `TextAnimator` starts every word at Opacity 0
    // and springs it to 1 (the engine's own new-content fade-in) -- blank, then back over ~300ms. The
    // underline and pill, tracked by `${token.Key}:${piece.Row}` with no X of their own, were simply
    // REUSED across that same move, never faded, which is exactly the asymmetry that was live.
    // `TextPieceKeys` (TokenSentence.Layout.ts, pure and spec'd there) keys a piece by an ORDINAL position
    // among that token's own pieces instead -- just as unique as `piece.X` ever was, but names WHICH
    // piece it is rather than WHERE it currently sits, so the existing jext updates in place.
    //
    // Item 6 (Drill Sentences lane V2, two first-time testers): "a word briefly vanished mid-sentence
    // during a transition" -- round 14's own key also carried `piece.Row`, reasoning it was needed
    // alongside the ordinal for uniqueness; it never was (the ordinal is a running count over EVERY piece
    // of that token, across every row, so it alone never repeats), and carrying it meant a token could
    // still remount for a reason that has nothing to do with it: another token's TEXT changing width
    // elsewhere in the sentence reflows the wrap, pushes THIS token onto a different row, and `Row`
    // riding in the key read that as a brand-new piece -- faded exactly like the round-14 bug, just
    // triggered by a text change instead of a drag. `TextPieceKeys` (and `_visiblePills`/`_underlines`
    // just above, the same fix) drop `Row` from the key entirely now: a piece whose own token is
    // unchanged keeps the identical key regardless of which row it lands on.
    //
    // Lane BB2, item 4: ...unless the WORDS changed and it moved, when it lands afresh where it now goes
    // (`_landedKeys`, `LandPieces`) rather than slide there through the words arriving around it.
    const keys = this._landedKeys().Pieces;
    layout.Pieces.forEach((piece, pieceIndex) => {
      const token = tokens[piece.TokenIndex];
      if (!token) return;
      const style = KIND_STYLE[token.Kind];
      const s = state.get(token.Key);
      const tappable = IsTappable(token.Kind);
      const inNowGroup = token.Group !== null && token.Group !== undefined && token.Group === nowGroup;
      let ink: string = style.Ink;
      if (tappable && (s?.Open || inNowGroup) && token.Kind !== 'Problem') ink = '@GoldInk';
      // A label level is a class whose white ink its vibrancy carries; a role's ink is a colour.
      const level = ink.startsWith('Jwift') ? ink : null;
      // An icon token (today, only the mirror pair's "⇄") draws a JwiftIcons glyph instead of the piece's
      // own text -- resolved here, at paint time, same as `<icon>` itself resolves a name
      // (`Icon.ts`'s own `IconData[name.toLowerCase()]`), so this pure-text piece list stays the single
      // place that knows how a sentence token becomes pixels.
      let pieceText = piece.Text;
      let fontFamily = SENTENCE_FONT_STACK;
      let pieceSize = fs;
      let fontVariantNumeric: 'Normal' | 'TabularNums' = this.Tabular() ? 'TabularNums' : 'Normal';
      if (token.Icon) {
        const cp = IconData[token.Icon.toLowerCase()];
        if (cp == null) console.error(`[TokenSentence] no glyph named "${token.Icon}" in Icon.Data — the token renders blank`);
        pieceText = cp != null ? String.fromCodePoint(cp) : '';
        fontFamily = 'JwiftIcons';
        pieceSize = fs * ICON_TOKEN_SCALE;
        fontVariantNumeric = 'Normal'; // no digits in an icon glyph; never let the tabular twin swap it out.
      }
      out.push({
        Key: keys[pieceIndex],
        Class: level ? `Jwift_TokenSentenceWord ${level}` : 'Jwift_TokenSentenceWord',
        Text: pieceText,
        TextStyle: {
          // Base stack only -- Jaui's own ApplyTextStyle (Text.Measure.ts) extends this with the CJK
          // sans fallback at paint/measure time (ComposeFontFamily), the same composition `_measure`
          // above applies by hand for this thread's own pre-layout wrap pass. Keep this literal in sync
          // with `_measure`'s own base string -- they must resolve the identical stack. (An icon token
          // overrides this to the bare `JwiftIcons` family, first and alone -- see above -- so it never
          // rides this fallback chain at all.)
          FontFamily: fontFamily,
          FontSize: `${pieceSize}pt`,
          FontWeight: style.Weight,
          // Drill Sentences lane X3, item 3 (phone: the mirror mark vanished after a scroll, "to" dropped
          // out of "then to the rear"): Jaui's LineHeight is a MULTIPLIER of the font size (`Text.Types.ts`
          // resolves the number alone; `Text.Measure.ts`/`Text.Cache.ts` take FontSize x LineHeight), so
          // the `${lh}pt` this used to pass rasterized every word 23 font sizes tall, 368px, about 1100
          // device px at dpr 3. The 2048px glyph atlas holds one shelf that tall, so a phone scroll ran it
          // out mid frame and rebuilt it, blanking whichever glyphs were already queued in the batch. The
          // ratio below draws the identical line box (`lh` pt, the glyph still centered in it) at a raster
          // one line tall.
          LineHeight: `${lh / pieceSize}`,
          Color: level ? 'rgb(255, 255, 255)' : ink,
          FontVariantNumeric: fontVariantNumeric,
          // Drill Sentences lane YY3b, item 10: SF Pro's own per-size tracking (`SFProTracking`,
          // `TokenSentence.Layout.ts`, Apple's HIG Typography table) -- negative through the body/UI mid
          // range, positive again at a small caption or a large display size, and ONLY where San Francisco
          // is actually what draws (`tracking`, above, computed once for the whole sentence) -- asking
          // Inter for San Francisco's own measured metrics opened a gap before every comma on a device
          // with no San Francisco to draw, the piece measured wide (`_measure`, no tracking applied) and
          // painted narrower (tracking applied regardless of the resolved face) than it was laid out for.
          // An icon glyph (`token.Icon`) carries none either way: a symbol's own advance is not kerned
          // against a reading of text the way a letter is.
          LetterSpacing: token.Icon ? '0pt' : `${tracking}pt`,
          // Jack, live (round 12): a bold atom's own ink can run past its measured advance width right
          // at a wrapped row's own edge -- the whole reason this piece's own box (below) is wider than
          // its content. That overflow room only ever stays invisible, harmless dead space (every
          // neighbouring piece's own X is computed off the UNPADDED width, never this one) if the text
          // itself draws flush at the box's own left edge. `Jext`'s own engine default already is 'Left'
          // (Jaui.ts's default style table) -- stated here explicitly so this invariant can't silently
          // drift out from under a fix with no gap of its own to fall back on.
          TextAlign: 'Left',
        },
        Layout: _rect(piece.X, piece.Y, piece.Width + 0.5 * fs, lh),
        Tappable: tappable,
        TokenKey: token.Key,
        Label: token.Label ?? token.Text,
      });
    });
    return out;
  });

  /** The "+", as a list of at most one keyed by where it last landed (`_landedKeys`), so a "+" the words
   *  pushed elsewhere lands there afresh instead of sliding over them (lane BB2, item 4). */
  protected readonly _add = computed(() => {
    const layout = this._layout();
    const add = layout.Add;
    if (!add) return [];
    const open = this.AddOpen();
    const hover = this._hoveredKey() === '+';
    // Item 8: an open popover's own anchor stays visible regardless of AddVisible — it cannot be faded
    // out from under a control the director is actively using.
    const visible = this.AddVisible() || open;
    const cls = open ? 'Jwift_TokenSentenceAdd Jwift_TokenSentenceAdd_Open'
      : !visible ? (this.AddRest() === 'Faint' ? 'Jwift_TokenSentenceAdd Jwift_TokenSentenceAdd_Faint' : 'Jwift_TokenSentenceAdd Jwift_TokenSentenceAdd_Faded')
        : hover ? 'Jwift_TokenSentenceAdd Jwift_TokenSentenceAdd_Hover'
          : 'Jwift_TokenSentenceAdd';
    return [{ Key: this._landedKeys().Add, Class: cls, Layout: _rect(add.X, add.Y, add.Width, add.Height) }];
  });

  constructor() {
    super('TokenSentence', TokenSentenceJss, 'Jwift_TokenSentence', () => 'Jwift_TokenSentence');
    // Every piece paints Position: Placed (the pills, underlines, text runs, the "+" — `_rect()`'s own
    // shape), which takes NO part in a parent's intrinsic/auto height the way a Flow child would (Placed
    // children are out of flow for sizing, same as CSS absolute positioning). Nothing else reports this
    // host's own height, so a consumer that lets it size by content (Height: Auto/MinContent, never a
    // fixed px/pt) collapsed to zero — this is that report, straight off the same LayoutSentence the
    // pieces themselves are placed from, so wrapping to two or three lines grows the row for real.
    effect(() => this.SetStyleOverride({ Height: `${this._layout().Height}pt` }));
  }

  ngOnInit(): void {
    this._attachOnInit();
    _watchPageFonts();
    this.Node.WatchRect(true);
    this.Node.SetHit({ OnRectSnapshot: (box) => { if (box.Width > 0) this._setWrapWidth(box.Width); } });
    // Jack, live: a row whose own flex sibling has a fixed size decided AFTER this one's first layout
    // pass (`DrillLineRow`'s own `#rmore` button, a sibling of the sentence, not a child it could measure
    // itself) kept wrapping at that FIRST pass's own too-wide guess forever -- `SetHit`'s own
    // `OnRectSnapshot`, above, answers once, at whatever moment this node first got hit-tested, not every
    // time its real rect changes. `WatchRect(true)` already keeps `Node.Width` itself correct and live
    // (confirmed live: reading it directly off the running page matched the flex-resolved width exactly);
    // this just keeps `_wrapWidth` tracking THAT, the same `Node.OnRect` pattern the rail's own track
    // width already uses (EditorPlayer.ts) for the identical reason.
    this._rectUnwatch = this.Node.OnRect(() => {
      if (this.Node.Width > 0) this._setWrapWidth(this.Node.Width);
      this._onMoved();
    });
  }

  ngOnDestroy(): void {
    this._docUnbind?.();
    this._pressUnbind?.();
    this._rectUnwatch?.();
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  /** The corner of the highlight `AnchorOf` gives, canvas px, or null for the "+" add button, a capsule: the corner a
   *  word's menu grows out of (`Popover.OriginRadius`). */
  PillRadiusOf(key: string): number | null {
    return key === '+' ? null : this._jss.VarPoints('JwiftTokenPillRadius');
  }

  /** The pill a Popover should anchor to — canvas px, absolute. */
  AnchorOf(key: string): PopoverRect | null {
    const layout = this._layout();
    const n = this.Node;
    if (key === '+') {
      const add = layout.Add;
      if (!add) return null;
      return { X: n.X + add.X, Y: n.Y + add.Y, Width: add.Width, Height: add.Height };
    }
    const idx = this.Tokens().findIndex((t) => t.Key === key);
    if (idx === -1) return null;
    const hit = layout.Hits.find((h) => h.TokenIndex === idx);
    if (!hit) return null;
    return { X: n.X + hit.X + 3, Y: n.Y + hit.Y + 9, Width: hit.Width - 6, Height: hit.Height - 18 };
  }

  /** A tappable token's own `(click)` — never reached by a real pointer tap (the worker hit-test
   *  excludes every child, `PointerEvents: None`, and resolves to the host instead); this exists so
   *  the SEO/accessibility mirror's synthetic activation (keyboard, assistive tech) still emits
   *  `TokenTap` for mirror activation. */
  protected _onMirrorActivate(tokenKey: string): void {
    const anchor = this.AnchorOf(tokenKey);
    if (anchor) this.TokenTap.emit({ Key: tokenKey, Anchor: anchor });
  }

  /** The add button's own mirror-activation path — see `_onMirrorActivate`. */
  protected _onAddClick(): void {
    const anchor = this.AnchorOf('+');
    if (anchor) this.AddTap.emit({ Anchor: anchor });
  }

  protected _onHostPointerDown(e: PointerEvent): void {
    this._storePoint(e);
    const key = this._hitAt(this._lastPointer);
    this._pressedKey.set(key);
    this._downKey = key;
    this._downSeen = true;
    this._pressedAt = key !== null ? { X: this.Node.X, Y: this.Node.Y } : null;
    if (key !== null) this._watchPress(e);
    // Drill Sentences lane PP1, item 1d: a press on a word is the word's, which opens its control on release; a list
    // around this sentence never lifts its row from it (`SortableList`, `LiftStart`).
    if (key !== null) ClaimPress(e);
  }

  /** Where this sentence stood when its word was pressed, while the press lasts (`_onMoved`). */
  private _pressedAt: { X: number; Y: number } | null = null;

  /**
   * The sentence moved on screen (Drill Sentences lane KK1, item 6; a round 15 blind phone tester: "forward" stayed
   * lit after the list scrolled away from under the touch). A press the list carried past the tap slop was a
   * scroll, so the word lets go and the press resolves to nothing, as one the finger dragged does
   * (`_watchPress`); and the word under a resting mouse is read again where the words now stand, so a word that
   * scrolled away from under it stops looking hovered.
   */
  private _onMoved(): void {
    const at = this._pressedAt;
    if (at && Math.hypot(this.Node.X - at.X, this.Node.Y - at.Y) >= TokenSentence.PRESS_SLOP_PX) {
      this._pressedKey.set(null);
      this._downKey = null;
      this._pressedAt = null;
      this._pressUnbind?.();
    }
    if (this._hoveredKey() !== null) this._updateHover();
  }

  /** How far a press may travel and still be a tap on its word, a finger's own tap slop: past it, the list under
   *  it is scrolling. */
  private static readonly PRESS_SLOP_PX = 10;
  private _pressUnbind: (() => void) | null = null;
  /**
   * Drill Sentences lane II2, item 6 (a round 13 blind phone tester: a word, "left flank", stayed pressed after the
   * list scrolled). A word's pressed look came off only with its click, and a press that became a scroll never
   * clicks, so it stayed lit, and the click that next landed anywhere on this sentence would have spent the
   * scroll's old key. The press is watched until it ends: once it travels past `PRESS_SLOP_PX` it was a scroll,
   * so the word lets go and the press resolves to nothing; its release or cancel clears the look either way.
   */
  private _watchPress(down: PointerEvent): void {
    this._pressUnbind?.();
    const doc = this._doc;
    // Any pointer stream: the canvas's own events and Jaui's bridged copies of them number one finger differently.
    const onMove = (e: PointerEvent): void => {
      if (!e.buttons && e.pointerType === 'mouse') return; // a mouse moving with its button up is no drag.
      if (Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) < TokenSentence.PRESS_SLOP_PX) return;
      this._pressedKey.set(null);
      this._downKey = null;
      unbind();
    };
    const onEnd = (): void => {
      this._pressedKey.set(null);
      this._pressedAt = null;
      unbind();
    };
    const unbind = (): void => {
      doc.removeEventListener('pointermove', onMove, true);
      doc.removeEventListener('pointerup', onEnd, true);
      doc.removeEventListener('pointercancel', onEnd, true);
      if (this._pressUnbind === unbind) this._pressUnbind = null;
    };
    doc.addEventListener('pointermove', onMove, true);
    doc.addEventListener('pointerup', onEnd, true);
    doc.addEventListener('pointercancel', onEnd, true);
    this._pressUnbind = unbind;
  }
  /**
   * Lane KK1, item 6 (a round 15 blind phone tester touched "forward", and it stayed lit after the finger had gone):
   * a finger's own moves lit the word under it as hovered, and nothing ends a hover a finger leaves behind (no
   * move off the sentence follows a lift). Only a mouse or a pen hovers; a finger's word shows pressed while it
   * is down (`_watchPress`), and nothing once it lifts. The move is still reported, a finger's included, for a
   * caller that tells them apart (`HoverTip`).
   */
  protected _onHostPointerMove(e: PointerEvent): void {
    this._storePoint(e);
    if (e.pointerType === 'touch') this._clearHover();
    else this._updateHover();
    this.TokenHover.emit({ Key: e.pointerType === 'touch' ? this._hitAt(this._lastPointer) : this._hoveredKey(), Event: e });
  }

  /** No word hovered, and no watch left waiting for the pointer to leave. */
  private _clearHover(): void {
    if (this._hoveredKey() === null) return;
    this._hoveredKey.set(null);
    this.SetStyleOverride({ Cursor: 'Default' });
    this._docUnbind?.();
    this._docUnbind = null;
  }
  /**
   * Drill Sentences U1 live fix (item 2, two first-time testers): a tap that lands on an actual token or
   * the "+" used to go on bubbling past this host after `TokenTap`/`AddTap` fired — a REAL DOM click
   * (this host is `display: contents`, not canvas-hit-tested the way the pieces inside it are, so
   * nothing here stopped it) — and `EditorLine.ts`'s own `DrillLineRow` wrapper listens for `(click)`
   * too, to select an otherwise-untappable patch of EMPTY row space (its own doc comment: "tapping a
   * row's own empty space... did nothing"). Before item 2 that was harmless — a token tap called the
   * SAME `SelectLine` the row's own handler calls, so the duplicate fired for nothing. Item 2 split that
   * into `MarkCurrent` (most tokens) vs `SelectLine` (the row body, the who token, a field tap) — once
   * those two calls stopped being interchangeable, the bubbled click kept forcing the FIELD-selecting
   * one regardless, undoing item 2 for every token it did not want to field-select. `stopPropagation`
   * once a real key resolves (token or "+") is the general fix: a tap that landed ON something specific
   * was never "a tap on the row's own empty space" to begin with, whatever that something turns out to
   * mean one level up.
   */
  protected _onHostClick(e: MouseEvent): void {
    // Drill Sentences lane X3, item 4: the key is the one the PRESS resolved, on this host, for this
    // gesture. Re-resolving `_lastPointer` here let a finger that rolled a few px after landing on "then"
    // (every pointermove rewrites it) read as the word beside it, and a click with no press of its own
    // on this host (nothing pressed here since the last click) reused whatever point an earlier gesture
    // left behind. A press that landed on a filler resolved to null, and stays null.
    const key = this._downSeen ? this._downKey : null;
    this._downSeen = false;
    this._downKey = null;
    this._pressedKey.set(null);
    if (key === null) return;
    e.stopPropagation();
    if (key === '+') {
      const anchor = this.AnchorOf('+');
      if (anchor) this.AddTap.emit({ Anchor: anchor });
      return;
    }
    const anchor = this.AnchorOf(key);
    if (anchor) this.TokenTap.emit({ Key: key, Anchor: anchor });
  }

  private _storePoint(e: PointerEvent): void {
    const canvas = this._canvasRef?.Canvas;
    const [x, y] = CanvasPress.ToNode(canvas, e.clientX, e.clientY);
    this._lastPointer = { X: x, Y: y };
  }

  private _updateHover(): void {
    this._hoveredKey.set(this._hitAt(this._lastPointer));
    this.SetStyleOverride({ Cursor: this._hoveredKey() !== null ? 'Pointer' : 'Default' });
    this._ensureDocWatch();
  }

  /** The pointer leaving the host doesn't fire a host pointermove (the worker simply stops reporting
   *  hits to this node once the point is off it), so a document-level fallback clears hover once the
   *  raw point falls outside the host rect — bound only while something is hovered. */
  private _ensureDocWatch(): void {
    if (this._docUnbind) return;
    const onDocMove = (e: PointerEvent): void => {
      const canvas = this._canvasRef?.Canvas;
      const [x, y] = CanvasPress.ToNode(canvas, e.clientX, e.clientY);
      const n = this.Node;
      if (x < n.X || x >= n.X + n.Width || y < n.Y || y >= n.Y + n.Height) {
        this._hoveredKey.set(null);
        this.SetStyleOverride({ Cursor: 'Default' });
        this._docUnbind?.();
        this._docUnbind = null;
        this.TokenHover.emit({ Key: null, Event: e });
      }
    };
    this._doc.addEventListener('pointermove', onDocMove, true);
    this._docUnbind = () => this._doc.removeEventListener('pointermove', onDocMove, true);
  }

  /** Nearest-center wins when the point falls inside more than one hit rect. `null` point or no hit
   *  both answer `null`, and so does a point that lands in a FILLER's own rect (`Layout.Fillers`): a
   *  plain word such as "then" owns its own share of the row and opens nothing, so the press falls
   *  through to the row instead of reaching the word beside it. */
  private _hitAt(point: { X: number; Y: number } | null): string | null {
    if (!point) return null;
    const n = this.Node;
    const localX = point.X - n.X, localY = point.Y - n.Y;
    const layout = this._layout();
    const tokens = this.Tokens();
    let bestKey: string | null = null;
    let bestDist = Infinity;
    const consider = (hit: { X: number; Y: number; Width: number; Height: number }, key: string): void => {
      if (localX < hit.X || localX >= hit.X + hit.Width || localY < hit.Y || localY >= hit.Y + hit.Height) return;
      const cx = hit.X + hit.Width / 2, cy = hit.Y + hit.Height / 2;
      const dist = (localX - cx) ** 2 + (localY - cy) ** 2;
      if (dist < bestDist) { bestDist = dist; bestKey = key; }
    };
    for (const hit of layout.Hits as readonly SentenceHit[]) {
      const token = tokens[hit.TokenIndex];
      if (token) consider(hit, token.Key);
    }
    for (const filler of layout.Fillers) consider(filler, _FILLER);
    if (layout.Add) consider(layout.Add.Hit, '+');
    return bestKey === _FILLER ? null : bestKey;
  }
}

/** `_hitAt`'s own marker for "a filler owns this point" — never a real token key (keys are the caller's
 *  own strings; this one is a symbol-like sentinel no caller would pick). */
const _FILLER = '\u0000filler';

function _rect(x: number, y: number, w: number, h: number): Record<string, unknown> {
  return { Position: 'Placed', Left: `${x}px`, Top: `${y}px`, Width: `${w}px`, Height: `${h}px` };
}
