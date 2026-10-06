/**
 * Pure layout math for `<token-sentence>`. Modeled on Jaui's `Jinput/Jinput.Layout.ts` — no Angular, no
 * jaui imports, so it is cheap to unit test with a stub measurer and reusable anywhere a sentence needs
 * to lay itself out (a thumbnail, a print render).
 *
 * UNITS. A tappable token (Word/Value/Who/Placeholder/Mirror/Problem) and a Badge are ATOMS: one piece,
 * never split. `Text`/`Quiet` tokens split into smaller units first — a whitespace run, one unit per
 * CJK character, or a run of anything else — because word order is free per language and ja/zh/ko break
 * between characters rather than at spaces.
 *
 * BREAKS. A break is allowed after a whitespace unit, or between two units where either is CJK (unless
 * kinsoku forbids starting a line with a closing punctuation mark or ending one with an opening mark).
 * Units with no break between them are one WORD — the atomic thing the greedy wrapper places or wraps
 * as a whole. The add button is glued to the last token: no break is ever allowed before it.
 */

export type SentenceTokenKind =
  | 'Text' | 'Quiet' | 'Word' | 'Value' | 'Who' | 'Placeholder' | 'Mirror' | 'Problem' | 'Badge';

export interface SentenceToken {
  readonly Key: string;
  readonly Text: string;
  readonly Kind: SentenceTokenKind;
  readonly Group?: number;
  readonly Label?: string;
  /** A JwiftIcons vocabulary name (`Icon.Names.json`, e.g. "arrow.left.and.right") this token draws
   *  AS AN ICON instead of as text — the mirror pair's "⇄" being the first: a symbol drawn through
   *  the app's own text font risks the font's fallback chain landing on a face that lacks the glyph
   *  (CJK sans faces ahead of the generic fallback, `Jaui`'s `ComposeFontFamily`, starved it for
   *  everyone, not only CJK readers — confirmed live, "1a ⇄ 1b" drawing as two dots). `Text` is still
   *  carried (usually empty) for a token whose `Icon` lookup fails; `Label` remains the accessible
   *  name either way. See `TokenSentence.ts`'s own `_measure`/`_textPieces` for how `Icon` resolves to
   *  a glyph, a font, and a size. */
  readonly Icon?: string;
}

const TAPPABLE_KINDS: ReadonlySet<SentenceTokenKind> =
  new Set(['Word', 'Value', 'Who', 'Placeholder', 'Mirror', 'Problem']);

/** Whether a kind gets a hit rect and responds to a tap — every kind except Text, Quiet and Badge. */
export const IsTappable = (kind: SentenceTokenKind): boolean => TAPPABLE_KINDS.has(kind);

/** Han, Hiragana, Katakana, plus the CJK Symbols/Punctuation and Halfwidth/Fullwidth Forms blocks —
 *  scripts that read without spaces between words, so they break per character instead of per word. */
const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}　-〿＀-￯]/u;
export const IsCjkChar = (ch: string): boolean => CJK_RE.test(ch);

/** Kinsoku shori: characters that may never START a line (closing brackets, small kana, dashes,
 *  terminal punctuation) and characters that may never END one (opening brackets). */
const NEVER_BREAK_BEFORE = '、。，．・：；？！ー」』）】〕〉》ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ々';
const NEVER_BREAK_AFTER = '「『（【〔〈《';

export interface SentenceLayoutOptions {
  readonly WrapWidth: number;
  readonly LineHeight: number;
  readonly FontSize: number;
  /** `icon`, when a token carries one, names which glyph to measure INSTEAD of `text` — the host
   *  (`TokenSentence.ts`'s own `_measure`) owns resolving that name to an actual font/size/width; this
   *  pure layout file never imports icon data itself. */
  readonly Measure: (text: string, weight: number, icon?: string) => number;
  readonly ShowAdd: boolean;
}

export interface SentencePiece {
  readonly TokenIndex: number;
  readonly Text: string;
  readonly X: number;
  readonly Y: number;
  readonly Width: number;
  readonly Row: number;
}

/** One hit rect per tappable token — already expanded past the visible pill (see `LayoutSentence`'s doc). */
export interface SentenceHit {
  readonly TokenIndex: number;
  readonly X: number;
  readonly Y: number;
  readonly Width: number;
  readonly Height: number;
}

export interface SentenceAddBox {
  readonly X: number;
  readonly Y: number;
  readonly Width: number;
  readonly Height: number;
  readonly Row: number;
  readonly Hit: { readonly X: number; readonly Y: number; readonly Width: number; readonly Height: number };
}

export interface SentenceLayoutResult {
  readonly Pieces: readonly SentencePiece[];
  readonly Hits: readonly SentenceHit[];
  readonly Add: SentenceAddBox | null;
  readonly Height: number;
}

const WEIGHT_OF: Record<SentenceTokenKind, number> = {
  Text: 400, Quiet: 400, Word: 400, Value: 600, Who: 700,
  Placeholder: 600, Mirror: 600, Problem: 700, Badge: 600,
};

const ADD_GAP = 4;
const ADD_WIDTH = 28;
const ADD_HEIGHT = 26;
/** Sentinel token index for the synthetic add-button unit — never a real token position. */
const ADD_TOKEN_INDEX = -1;

interface Unit {
  readonly TokenIndex: number;
  readonly Text: string;
  readonly Width: number;
  readonly IsWhitespace: boolean;
  readonly IsCjk: boolean;
  readonly IsAtom: boolean;
  readonly IsAdd: boolean;
  readonly GapBefore: number;
}

/** Split a Text/Quiet token's string into whitespace runs, lone CJK characters, and runs of anything
 *  else — the three unit kinds `LayoutSentence`'s break rules read. */
const _splitTextQuiet = (text: string): { Text: string; IsWhitespace: boolean; IsCjk: boolean }[] => {
  const out: { Text: string; IsWhitespace: boolean; IsCjk: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      out.push({ Text: text.slice(i, j), IsWhitespace: true, IsCjk: false });
      i = j;
    } else if (IsCjkChar(ch)) {
      out.push({ Text: ch, IsWhitespace: false, IsCjk: true });
      i++;
    } else {
      let j = i + 1;
      while (j < text.length && !/\s/.test(text[j]) && !IsCjkChar(text[j])) j++;
      out.push({ Text: text.slice(i, j), IsWhitespace: false, IsCjk: false });
      i = j;
    }
  }
  return out;
};

/**
 * Round 11, live: "1a" (a Who atom starting a wrapped row) touched the word right after it. Round 12's
 * first two cuts both guessed at the wrong mechanism:
 *
 * - Narrowing the ATOM's own declared box broke rendering everywhere once folded (Jaui's own flow solver
 *   reads a Placed child's declared Width for more than this file assumed, confirmed live on an isolated
 *   second dev server) -- reverted.
 * - Widening the GAP after an atom (an extra `GapBefore` on whatever whitespace unit followed it) fixed
 *   "1ain" but, caught live at 200% zoom, visibly widened the space after EVERY atom past ordinary
 *   inter-word spacing ("march  forward" vs "then march") -- because the touching was never actually
 *   about the gap between pieces at all. `TokenSentence.ts`'s own `_rect(piece.X, piece.Y, piece.Width +
 *   0.5 * fontSize, lh)` pads every piece's own box by half a font size specifically so a glyph's own ink
 *   (which can run past its measured advance width, worst for a bold weight right at a row's own edge)
 *   has somewhere to overflow into WITHOUT needing to be counted in anyone's position math -- the next
 *   piece's own X was never computed off the padded width, only the measured one, so that overflow room
 *   was already free, harmless dead space between two boxes that were always allowed to "overlap" by
 *   design (every piece's box already extends 0.5em past its own content). Confirmed live (round 12):
 *   `jext`'s own engine default is `TextAlign: 'Left'` (`Jaui.ts`'s default style table, `Text.Types.ts`),
 *   so every piece's own text already draws flush at the box's own left edge, never shifted into that
 *   overflow room by centering -- `TokenSentence.ts` now states this explicitly rather than relying on an
 *   unstated default, so the invariant this whole file's own lack of a gap depends on can't silently
 *   drift. No piece here ever needs an extra GapBefore of its own; the add button alone keeps one
 *   (`ADD_GAP`, below), since it is a separate glyph glued on, not a text run whose own ink could bleed.
 */
const _buildUnits = (
  tokens: readonly SentenceToken[],
  measure: (t: string, w: number, icon?: string) => number,
  showAdd: boolean,
): Unit[] => {
  const units: Unit[] = [];
  const push = (u: { TokenIndex: number; Text: string; Width: number; IsWhitespace: boolean; IsCjk: boolean; IsAtom: boolean; IsAdd: boolean; GapBefore?: number }): void => {
    units.push({ ...u, GapBefore: u.GapBefore ?? 0 });
  };
  tokens.forEach((token, tokenIndex) => {
    const weight = WEIGHT_OF[token.Kind];
    if (token.Kind === 'Text' || token.Kind === 'Quiet') {
      for (const part of _splitTextQuiet(token.Text)) {
        push({
          TokenIndex: tokenIndex, Text: part.Text, Width: measure(part.Text, weight),
          IsWhitespace: part.IsWhitespace, IsCjk: part.IsCjk, IsAtom: false, IsAdd: false,
        });
      }
    } else {
      // Tappable kinds and Badge: one atom, carrying the token's FULL text, never split.
      push({
        TokenIndex: tokenIndex, Text: token.Text, Width: measure(token.Text, weight, token.Icon),
        IsWhitespace: false, IsCjk: false, IsAtom: true, IsAdd: false,
      });
    }
  });
  if (showAdd) {
    // The add button is its own dedicated glyph, already spaced by its own ADD_GAP -- not a text run that
    // could visually bleed into whatever came before it the way a glyph's own ink can, so it does not also
    // need padAfterAtom folded in on top.
    units.push({
      TokenIndex: ADD_TOKEN_INDEX, Text: '', Width: ADD_WIDTH,
      IsWhitespace: false, IsCjk: false, IsAtom: true, IsAdd: true, GapBefore: ADD_GAP,
    });
  }
  return units;
};

/** True when a break is allowed BETWEEN `a` and `b`, `b` immediately following `a`. */
const _breakAllowed = (a: Unit, b: Unit): boolean => {
  if (b.IsAdd) return false; // glued to the last token — never its own word.
  if (a.IsWhitespace) return true;
  if (a.IsCjk || b.IsCjk) {
    const lastCh = a.Text[a.Text.length - 1];
    const firstCh = b.Text[0];
    if (firstCh && NEVER_BREAK_BEFORE.includes(firstCh)) return false;
    if (lastCh && NEVER_BREAK_AFTER.includes(lastCh)) return false;
    return true;
  }
  return false;
};

interface Word { readonly Units: readonly Unit[]; readonly Ink: number; }

/** A word's ink width excludes ONE trailing whitespace unit, as Jinput's does — a space hanging past
 *  the wrap edge never forces a line break on its own. Its own `GapBefore` (always 0 for an ordinary
 *  unit now — `_buildUnits`'s own doc comment — but kept in the formula since a Word can still end on
 *  the synthetic add-button unit, which carries `ADD_GAP`) goes with it, the same "past the wrap edge"
 *  reasoning as excluding the unit's own Width. */
const _finishWord = (units: readonly Unit[]): Word => {
  let ink = 0;
  for (const u of units) ink += u.GapBefore + u.Width;
  const last = units[units.length - 1];
  if (last.IsWhitespace) ink -= last.Width + last.GapBefore;
  return { Units: units, Ink: ink };
};

const _groupWords = (units: readonly Unit[]): Word[] => {
  const words: Word[] = [];
  let cur: Unit[] = [];
  for (let i = 0; i < units.length; i++) {
    cur.push(units[i]);
    const next = units[i + 1];
    if (!next || _breakAllowed(units[i], next)) {
      words.push(_finishWord(cur));
      cur = [];
    }
  }
  return words;
};

interface Placed { readonly Unit: Unit; readonly X: number; readonly Y: number; readonly Row: number; }

/**
 * Lay a token sentence out, atoms unsplit, words wrapped greedily, ja/zh/ko breaking per character.
 *
 * `Measure(text, weight)` returns the text's ink width in px at the sentence's own `FontSize` — one
 * size for the whole sentence (a Badge's own smaller rendered size is the component's paint concern,
 * not this layout's; its WIDTH here is measured the same as everything else, so its hit area is never
 * smaller than its neighbours expect).
 */
export function LayoutSentence(
  tokens: readonly SentenceToken[],
  opts: SentenceLayoutOptions,
): SentenceLayoutResult {
  const { LineHeight, FontSize, Measure, ShowAdd } = opts;
  const wrapWidth = opts.WrapWidth > 0 ? opts.WrapWidth : Infinity;

  if (tokens.length === 0 && !ShowAdd) {
    return { Pieces: [], Hits: [], Add: null, Height: 0 };
  }

  const units = _buildUnits(tokens, Measure, ShowAdd);
  const words = _groupWords(units);

  const placed: Placed[] = [];
  let x = 0, y = 0, row = 0;

  for (const word of words) {
    if (x > 0 && x + word.Ink > wrapWidth) { x = 0; y += LineHeight; row++; }

    const hasSplittable = word.Units.some((u) => !u.IsAtom);
    if (x === 0 && word.Ink > wrapWidth && hasSplittable) {
      // Emergency per-grapheme split: an over-wide word that isn't purely atoms. Atoms inside it
      // (rare — a tappable token glued to overflowing text with no break) still never split.
      for (const u of word.Units) {
        if (u.IsAtom) {
          if (x > 0 && x + u.GapBefore + u.Width > wrapWidth) { x = 0; y += LineHeight; row++; }
          placed.push({ Unit: u, X: x + u.GapBefore, Y: y, Row: row });
          x += u.GapBefore + u.Width;
          continue;
        }
        const weight = WEIGHT_OF[tokens[u.TokenIndex]?.Kind ?? 'Text'];
        for (const g of Array.from(u.Text)) {
          const w = Measure(g, weight);
          if (x > 0 && x + w > wrapWidth) { x = 0; y += LineHeight; row++; }
          placed.push({ Unit: { ...u, Text: g, Width: w, GapBefore: 0 }, X: x, Y: y, Row: row });
          x += w;
        }
      }
      continue;
    }

    // Whole word on this row — may overflow if it is a single oversize atom; it then sits alone
    // (the next word's own over-wrap check fires immediately, since x is already past wrapWidth).
    for (const u of word.Units) {
      placed.push({ Unit: u, X: x + u.GapBefore, Y: y, Row: row });
      x += u.GapBefore + u.Width;
    }
  }

  // One piece per UNIT, never merged back across a whitespace/word boundary -- round 13's own second
  // bug, found the same way "1ain" was: a real-token dump (CDP, live) of "2 steps outside" showed
  // " outside" landing as ONE piece, its own leading space baked into the same string as "outside", and
  // the rendered pixels showing the space's own width reserved in the BOX but not painted -- zero visual
  // gap, "2 stepsoutside", even though the box position math was exactly right (confirmed: Jaui's own
  // text renderer, Text.Measure.ts's own word-based remeasure of a line, treats a leading run of
  // whitespace as an empty "word" and drops it, the same reason a leading space in any jext content
  // reads collapsed). This USED to merge every unit from the same original token placed contiguously
  // back into one piece ("one piece per TokenIndex x Row", the original design) -- which is exactly how
  // `_splitTextQuiet` built that one " outside" string out of a whitespace unit and a word unit in the
  // first place. Dropping the merge costs nothing real: a TAPPABLE token is never split into more than
  // one unit to begin with (`_buildUnits`'s own doc comment), so every pill/underline/hit this file
  // builds off ONE piece per tappable token (`IsTappable` gates them, below) is unaffected; only
  // Text/Quiet content (never tappable, never underlined) ever had more than one unit to merge. Every
  // piece now starts and ends exactly where `_splitTextQuiet` drew the line, the same shape the
  // "1a"/" "/"in" follow-sentence case (three separate tokens, never merged, never broken) already
  // proved safe live.
  const pieces: SentencePiece[] = [];
  let add: SentenceAddBox | null = null;
  for (const p of placed) {
    if (p.Unit.IsAdd) {
      add = {
        X: p.X, Y: p.Y, Width: ADD_WIDTH, Height: ADD_HEIGHT, Row: p.Row,
        Hit: { X: p.X - 8, Y: p.Y - 9, Width: ADD_WIDTH + 16, Height: ADD_HEIGHT + 18 },
      };
      continue;
    }
    pieces.push({ TokenIndex: p.Unit.TokenIndex, Text: p.Unit.Text, X: p.X, Y: p.Y, Width: p.Unit.Width, Row: p.Row });
  }

  // Hits: one per tappable token's piece — the visible pill (X-3, Y+(LH-(1.2FS+2))/2, W+6, 1.2FS+2),
  // expanded again by 3 horizontally and 9 vertically for the actual hit target (the concept's `.tk::after`).
  const hits: SentenceHit[] = [];
  for (const piece of pieces) {
    const kind = tokens[piece.TokenIndex]?.Kind;
    if (!kind || !IsTappable(kind)) continue;
    const pillHeight = 1.2 * FontSize + 2;
    const pillY = piece.Y + (LineHeight - pillHeight) / 2;
    const pillX = piece.X - 3;
    const pillWidth = piece.Width + 6;
    hits.push({
      TokenIndex: piece.TokenIndex,
      X: pillX - 3, Y: pillY - 9, Width: pillWidth + 6, Height: pillHeight + 18,
    });
  }

  const maxRow = placed.reduce((m, p) => Math.max(m, p.Row), 0);
  const height = placed.length === 0 ? 0 : (maxRow + 1) * LineHeight;

  return { Pieces: pieces, Hits: hits, Add: add, Height: height };
}

/**
 * One Angular `@for` track key per piece, ALIGNED to `pieces` by index — stable across a reflow that
 * only nudges a piece's own X (a sub-pixel rewrap, a `_pageFontEpoch` bump), never its WHICH-PIECE
 * identity. `TokenSentence.ts`'s own round-14 fix: a piece's X used to be baked into its key (round 13's
 * own fix for two pieces sharing a row), so ANY X move read to Angular as a brand-new piece — the old
 * `<jext>` torn down, a fresh one mounted, whose own `TextAnimator` starts at Opacity 0 and springs in
 * (the engine's own new-content fade), live as words blanking out then fading back during a phone sheet
 * drag. An ORDINAL position among the SAME token's own pieces is exactly as unique as X ever was
 * (`LayoutSentence` never emits two pieces for one token at the same ordinal on the same row) but never
 * changes just because the piece moved a few px — the key this returns names WHICH piece it is, not
 * WHERE it currently sits, so the same jext updates in place instead of being reborn.
 */
export function TextPieceKeys(
  pieces: readonly SentencePiece[], tokenKeyOf: (tokenIndex: number) => string,
): readonly string[] {
  const ordinal = new Map<number, number>();
  return pieces.map((piece) => {
    const n = ordinal.get(piece.TokenIndex) ?? 0;
    ordinal.set(piece.TokenIndex, n + 1);
    return `${tokenKeyOf(piece.TokenIndex)}:${piece.Row}#${n}`;
  });
}
