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
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Jaui, Jext, Jiv } from 'jaui-angular';
import { TabularFamilyStack } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import { Icon } from '../Icon/Icon';
import { CanvasPress } from '../Internal/CanvasPress';
import type { PopoverRect } from '../Popover/Popover.Placement';
import TokenSentenceJss from './TokenSentence.jss';
import {
  IsTappable,
  LayoutSentence,
  type SentenceHit,
  type SentenceLayoutResult,
  type SentenceToken,
  type SentenceTokenKind,
} from './TokenSentence.Layout';

export type { SentenceToken, SentenceTokenKind };

interface _KindStyle { readonly Ink: string; readonly Weight: number; readonly Underline: string | null; }

const KIND_STYLE: Record<SentenceTokenKind, _KindStyle> = {
  Text:        { Ink: '@Ink',     Weight: 400, Underline: null },
  Quiet:       { Ink: '@InkSoft', Weight: 400, Underline: null },
  Word:        { Ink: '@Ink',     Weight: 400, Underline: '@Line' },
  Value:       { Ink: '@Ink',     Weight: 600, Underline: null },
  Who:         { Ink: '@Ink',     Weight: 700, Underline: null },
  Placeholder: { Ink: '@GoldInk', Weight: 600, Underline: null },
  Mirror:      { Ink: '@InkSoft', Weight: 600, Underline: null },
  Problem:     { Ink: '@Danger',  Weight: 700, Underline: '@Danger' },
  Badge:       { Ink: '@InkSoft', Weight: 600, Underline: null },
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

interface _PieceState { Hover: boolean; Press: boolean; Open: boolean; }

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
      <jiv class="Jwift_TokenSentenceUnderline" [style]="u.Style" [childLayout]="u.Layout" />
    }
    @for (t of _textPieces(); track t.Key) {
      @if (t.Tappable) {
        <jext [text]="t.Text" [textStyle]="t.TextStyle" [childLayout]="t.Layout"
              semantics="Button" [label]="t.Label" (click)="_onMirrorActivate(t.TokenKey)" />
      } @else {
        <jext [text]="t.Text" [textStyle]="t.TextStyle" [childLayout]="t.Layout" />
      }
    }
    @if (_add(); as add) {
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
  readonly NowGroup = input<number | null>(null);
  readonly ShowAdd = input(false);
  readonly AddLabel = input('');
  readonly AddOpen = input(false);
  /** BCP-47; reserved for a future per-language measurement/shaping hook. */
  readonly Language = input<string | null>(null);
  readonly FontSizePt = input(16);
  readonly LineHeightPt = input(23);
  readonly Tabular = input(false);

  readonly TokenTap = output<{ Key: string; Anchor: PopoverRect }>();
  readonly AddTap = output<{ Anchor: PopoverRect }>();

  private readonly _canvasRef = inject(Jaui, { optional: true });
  private readonly _doc = inject(DOCUMENT);

  private readonly _hoveredKey = signal<string | null>(null);
  private readonly _pressedKey = signal<string | null>(null);
  private _lastPointer: { X: number; Y: number } | null = null;
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
   *  canvas doing the measuring finally has the same font the worker paints with. */
  private readonly _measure = (text: string, weight: number): number => {
    if (!text) return 0;
    if (typeof document === 'undefined') return 0;
    if (!this._measureCtx) {
      const c = document.createElement('canvas').getContext('2d');
      if (!c) return 0;
      this._measureCtx = c;
    }
    const size = this.FontSizePt() + _pageFontEpoch() * 1e-4;
    const family = this.Tabular() ? TabularFamilyStack('Inter, system-ui, sans-serif') : 'Inter, system-ui, sans-serif';
    this._measureCtx.font = `${weight} ${size}px ${family}`;
    return this._measureCtx.measureText(text).width;
  };

  /** `Node.Width`, watched live. `Infinity` before the first rect arrives, so the first layout pass
   *  (before anything can be measured against a real width) never wraps spuriously. */
  private readonly _wrapWidth = signal(Infinity);

  protected readonly _layout = computed<SentenceLayoutResult>(() => {
    _pageFontEpoch();
    return LayoutSentence(this.Tokens(), {
      WrapWidth: this._wrapWidth(),
      LineHeight: this.LineHeightPt(),
      FontSize: this.FontSizePt(),
      Measure: this._measure,
      ShowAdd: this.ShowAdd(),
    });
  });

  private readonly _state = computed<ReadonlyMap<string, _PieceState>>(() => {
    const hovered = this._hoveredKey();
    const pressed = this._pressedKey();
    const openKey = this.OpenKey();
    const out = new Map<string, _PieceState>();
    for (const t of this.Tokens()) {
      out.set(t.Key, { Hover: t.Key === hovered, Press: t.Key === pressed, Open: t.Key === openKey });
    }
    return out;
  });

  protected readonly _visiblePills = computed(() => {
    const layout = this._layout();
    const tokens = this.Tokens();
    const state = this._state();
    const out: { Key: string; Class: string; Layout: Record<string, unknown> }[] = [];
    for (const piece of layout.Pieces) {
      const token = tokens[piece.TokenIndex];
      if (!token) continue;
      if (token.Kind === 'Badge') {
        out.push({
          Key: `${token.Key}:${piece.Row}:badge`,
          Class: 'Jwift_TokenSentenceBadgePill',
          Layout: _rect(piece.X - 8, piece.Y + (this.LineHeightPt() - 19) / 2, piece.Width + 16, 19),
        });
        continue;
      }
      if (!IsTappable(token.Kind)) continue;
      const s = state.get(token.Key);
      if (!s || !(s.Hover || s.Press || s.Open)) continue;
      const pill = _pillRect(piece, this.FontSizePt(), this.LineHeightPt());
      const cls = s.Open
        ? (token.Kind === 'Problem' ? 'Jwift_TokenSentencePill Jwift_TokenSentencePill_OpenProblem' : 'Jwift_TokenSentencePill Jwift_TokenSentencePill_Open')
        : s.Press ? 'Jwift_TokenSentencePill Jwift_TokenSentencePill_Press'
          : 'Jwift_TokenSentencePill Jwift_TokenSentencePill_Hover';
      out.push({ Key: `${token.Key}:${piece.Row}`, Class: cls, Layout: _rect(pill.X, pill.Y, pill.Width, pill.Height) });
    }
    return out;
  });

  protected readonly _underlines = computed(() => {
    const layout = this._layout();
    const tokens = this.Tokens();
    const state = this._state();
    const fs = this.FontSizePt();
    const lh = this.LineHeightPt();
    const out: { Key: string; Style: Record<string, unknown>; Layout: Record<string, unknown> }[] = [];
    for (const piece of layout.Pieces) {
      const token = tokens[piece.TokenIndex];
      if (!token) continue;
      const underline = KIND_STYLE[token.Kind].Underline;
      if (!underline) continue;
      const s = state.get(token.Key);
      if (s?.Open) continue; // the pill says "active" instead.
      out.push({
        Key: `${token.Key}:${piece.Row}`,
        Style: { Background: underline },
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
    const out: {
      Key: string; Text: string; TextStyle: Record<string, unknown>; Layout: Record<string, unknown>;
      Tappable: boolean; TokenKey: string; Label: string;
    }[] = [];
    for (const piece of layout.Pieces) {
      const token = tokens[piece.TokenIndex];
      if (!token) continue;
      const style = KIND_STYLE[token.Kind];
      const s = state.get(token.Key);
      const tappable = IsTappable(token.Kind);
      const inNowGroup = token.Group !== null && token.Group !== undefined && token.Group === nowGroup;
      let ink = style.Ink;
      if (tappable && (s?.Open || inNowGroup) && token.Kind !== 'Problem') ink = '@GoldInk';
      out.push({
        // Round 13: `${token.Key}:${piece.Row}` alone stopped being unique the moment one token could
        // land more than one piece on the SAME row (this file's own `LayoutSentence` no longer re-merges
        // a leading-whitespace unit back onto the word after it, its own doc comment explains why) --
        // live, this read as an Angular NG0955 "duplicated track keys" warning the instant a literal
        // token split into "," / " " / "then" on one row, each with the identical old key. `piece.X` is
        // unique among pieces sharing a row by construction (`LayoutSentence` never places two pieces at
        // the same X on the same row), so appending it restores a genuinely unique key with no new state
        // to track.
        Key: `${token.Key}:${piece.Row}:${piece.X}`,
        Text: piece.Text,
        TextStyle: {
          FontFamily: 'Inter, system-ui, sans-serif',
          FontSize: `${fs}pt`,
          FontWeight: style.Weight,
          LineHeight: `${lh}pt`,
          Color: ink,
          FontVariantNumeric: this.Tabular() ? 'TabularNums' : 'Normal',
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
    }
    return out;
  });

  protected readonly _add = computed(() => {
    const layout = this._layout();
    const add = layout.Add;
    if (!add) return null;
    const open = this.AddOpen();
    const hover = this._hoveredKey() === '+';
    const cls = open ? 'Jwift_TokenSentenceAdd Jwift_TokenSentenceAdd_Open'
      : hover ? 'Jwift_TokenSentenceAdd Jwift_TokenSentenceAdd_Hover'
        : 'Jwift_TokenSentenceAdd';
    return { Class: cls, Layout: _rect(add.X, add.Y, add.Width, add.Height) };
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
    this.Node.SetHit({ OnRectSnapshot: (box) => { if (box.Width > 0) this._wrapWidth.set(box.Width); } });
    // Jack, live: a row whose own flex sibling has a fixed size decided AFTER this one's first layout
    // pass (`DrillLineRow`'s own `#rmore` button, a sibling of the sentence, not a child it could measure
    // itself) kept wrapping at that FIRST pass's own too-wide guess forever -- `SetHit`'s own
    // `OnRectSnapshot`, above, answers once, at whatever moment this node first got hit-tested, not every
    // time its real rect changes. `WatchRect(true)` already keeps `Node.Width` itself correct and live
    // (confirmed live: reading it directly off the running page matched the flex-resolved width exactly);
    // this just keeps `_wrapWidth` tracking THAT, the same `Node.OnRect` pattern the rail's own track
    // width already uses (EditorPlayer.ts) for the identical reason.
    this._rectUnwatch = this.Node.OnRect(() => { if (this.Node.Width > 0) this._wrapWidth.set(this.Node.Width); });
  }

  ngOnDestroy(): void {
    this._docUnbind?.();
    this._rectUnwatch?.();
    this.Node.WatchRect(false);
    this._detachOnDestroy();
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
    this._pressedKey.set(this._hitAt(this._lastPointer));
  }
  protected _onHostPointerMove(e: PointerEvent): void {
    this._storePoint(e);
    this._updateHover();
  }
  protected _onHostClick(_e: MouseEvent): void {
    const key = this._hitAt(this._lastPointer);
    this._pressedKey.set(null);
    if (key === null) return;
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
      }
    };
    this._doc.addEventListener('pointermove', onDocMove, true);
    this._docUnbind = () => this._doc.removeEventListener('pointermove', onDocMove, true);
  }

  /** Nearest-center wins when the point falls inside more than one hit rect. `null` point or no hit
   *  both answer `null`. */
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
    if (layout.Add) consider(layout.Add.Hit, '+');
    return bestKey;
  }
}

function _rect(x: number, y: number, w: number, h: number): Record<string, unknown> {
  return { Position: 'Placed', Left: `${x}px`, Top: `${y}px`, Width: `${w}px`, Height: `${h}px` };
}

function _pillRect(piece: { X: number; Y: number; Width: number }, fontSize: number, lineHeight: number) {
  const height = 1.2 * fontSize + 2;
  return { X: piece.X - 3, Y: piece.Y + (lineHeight - height) / 2, Width: piece.Width + 6, Height: height };
}
