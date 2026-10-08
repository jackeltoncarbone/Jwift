/**
 * Pure layout math for `<token-sentence>`. Modeled on Jaui's `Jinput/Jinput.Layout.ts` — no Angular, no
 * jaui imports, so it is cheap to unit test with a stub measurer and reusable anywhere a sentence needs
 * to lay itself out (a thumbnail, a print render).
 *
 * UNITS. A tappable token (Word/Value/Who/Placeholder/Mirror/Problem/Link) and a Badge are ATOMS: one piece,
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
  | 'Text' | 'Quiet' | 'Word' | 'Value' | 'Who' | 'Placeholder' | 'Mirror' | 'Problem' | 'Link' | 'Badge';

/** A token's underline while its sentence is at rest (`TokenSentence.Emphasis` 'Rest'): faint, the same as at full
 *  strength, or none. */
export type RestUnderline = 'Faint' | 'Keep' | 'None';

/**
 * Drill Sentences lane PP2, item 5 (a round 20 blind desktop tester: nearly every word was underlined, so nothing stood
 * out). Apple's text links are quiet until they matter. A sentence at rest (`Emphasis` 'Rest': its row neither
 * selected nor hovered) underlines only what a director changes, the values, the who and the move word, and faintly
 * (`Jwift_TokenSentenceUnderline_Faint`, `@AccentInkLineFaint`); a link in quiet text, the grey filler the editor pads
 * a line with, none at all; a problem keeps its own. Hovering the row, or selecting it (`Emphasis` 'Full'), brings
 * every underline to full strength. Connector words and separators ("then", "·") never wear one, at rest or not. The
 * first-run glow is a pill of its own and keeps glowing either way.
 */
export const REST_UNDERLINE: Record<SentenceTokenKind, RestUnderline> = {
  Text: 'None', Quiet: 'None', Word: 'Faint', Value: 'Faint', Who: 'Faint', Placeholder: 'Faint',
  Mirror: 'None', Problem: 'Keep', Link: 'None', Badge: 'None',
};

/** The underline a `kind` of token wears, its full strength paint `line` (null: none at all), by the sentence's
 *  `emphasis`: the paint and the class that carries it (a faint line's paint is its class's,
 *  `Jwift_TokenSentenceUnderline_Faint`, so its row's hover brightens it), or null for none. */
export function UnderlineOf(
  kind: SentenceTokenKind, line: string | null, emphasis: 'Full' | 'Rest',
): { Paint: string | null; Class: string } | null {
  if (!line) return null;
  const rest = REST_UNDERLINE[kind];
  if (emphasis === 'Full' || rest === 'Keep') return { Paint: line, Class: 'Jwift_TokenSentenceUnderline' };
  return rest === 'Faint' ? { Paint: null, Class: 'Jwift_TokenSentenceUnderline Jwift_TokenSentenceUnderline_Faint' } : null;
}

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
  new Set(['Word', 'Value', 'Who', 'Placeholder', 'Mirror', 'Problem', 'Link']);

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
  /** The least a tappable token's hit stands wide, pt (Drill Sentences lane WW2, item 3: Apple's least for an inline
   *  control, 28pt for a finger and 20pt for a pointer). A word narrower than this takes the room it lacks from the gaps
   *  beside it, never past a neighbour's own ink. 0, the default, leaves every hit its gap split. */
  readonly MinHitWidth?: number;
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

/** A tappable token's own pill, clipped against its immediate row-neighbours — see `LayoutSentence`'s
 *  "Drill Sentences lane W2, item 1" doc comment for why this pad can shrink below the free-side default. */
export interface SentencePillPad {
  readonly TokenIndex: number;
  readonly LeftPad: number;
  readonly RightPad: number;
}

export interface SentenceLayoutResult {
  readonly Pieces: readonly SentencePiece[];
  readonly Hits: readonly SentenceHit[];
  /** One hit rect per visible FILLER piece (a plain word such as "then", a "·", a ","; a Badge): the
   *  same Voronoi share of its gaps a tappable token gets, so a press on a filler resolves to the filler
   *  itself (nothing) rather than to whichever tappable word sits nearest. See `LayoutSentence`'s doc. */
  readonly Fillers: readonly SentenceHit[];
  readonly PillPads: readonly SentencePillPad[];
  readonly Add: SentenceAddBox | null;
  readonly Height: number;
}

const WEIGHT_OF: Record<SentenceTokenKind, number> = {
  Text: 400, Quiet: 400, Word: 400, Value: 600, Who: 700,
  Placeholder: 600, Mirror: 600, Problem: 700, Link: 400, Badge: 600,
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

/**
 * ROOM BETWEEN NARROW WORDS FOR THEIR HITS (Drill Sentences lane XX2, item 3; lane WW2 named the one shortfall it left, a
 * mirrored pair's "3a ⇔ 3b" under a finger: two names and the mark between them, a word space either side, three 28pt
 * targets in about 60pt). A hit never reaches over a neighbour's ink, so a word narrower than `minHit` takes what it
 * lacks from the space beside it, half from each side (`LayoutSentence`'s `meet`), all of it from a free end of the
 * sentence. Where the space between a narrow tappable word and its neighbour is too short for both their halves, it
 * widens to just that much, and no further; a mirror mark stands evenly between its two names, so the pair still reads
 * as one name. A pointer's least (20pt) asks nothing of an ordinary word space; a finger's (28pt) widens the spaces
 * around a mirror mark from a word space to about 9pt.
 */
const _roomForHits = (units: readonly Unit[], tokens: readonly SentenceToken[], minHit: number): Unit[] => {
  if (!(minHit > 0)) return [...units];
  const out = [...units];
  const tappableAtom = (u: Unit | undefined): boolean => !!u && u.IsAtom && !u.IsAdd && IsTappable(tokens[u.TokenIndex]?.Kind ?? 'Text');
  const deficit = (u: Unit): number => (tappableAtom(u) ? Math.max(0, minHit - u.Width) : 0);
  const visible = out.map((u, i) => ({ U: u, I: i })).filter((v) => !v.U.IsWhitespace);
  // A word at a free end of the sentence takes its least from that end (`meet`), and asks nothing of the space inside.
  const first = visible[0]?.I ?? -1;
  const last = visible.length && !visible[visible.length - 1].U.IsAdd ? visible[visible.length - 1].I : -1;
  /** The whitespace run between two visible units, and how much of it their hits need. */
  const runs: { readonly Spaces: number[]; Need: number; readonly Mirror: number | null }[] = [];
  for (let v = 0; v + 1 < visible.length; v++) {
    const a = visible[v], b = visible[v + 1];
    const spaces: number[] = [];
    for (let i = a.I + 1; i < b.I; i++) spaces.push(i);
    if (!spaces.length) continue;
    const need = (a.I === first ? 0 : deficit(a.U) / 2) + (b.I === last ? 0 : deficit(b.U) / 2);
    const mirror = tokens[a.U.TokenIndex]?.Kind === 'Mirror' ? a.I : tokens[b.U.TokenIndex]?.Kind === 'Mirror' ? b.I : null;
    runs.push({ Spaces: spaces, Need: need, Mirror: mirror });
  }
  // Both sides of a mirror mark take the larger need of the two.
  for (const run of runs) {
    if (run.Mirror === null) continue;
    for (const other of runs) if (other.Mirror === run.Mirror) run.Need = Math.max(run.Need, other.Need);
  }
  for (const run of runs) {
    const width = run.Spaces.reduce((sum, i) => sum + out[i].Width, 0);
    if (run.Need <= width + 1e-9) continue;
    const at = run.Spaces[run.Spaces.length - 1];
    out[at] = { ...out[at], Width: out[at].Width + (run.Need - width) };
  }
  return out;
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
    return { Pieces: [], Hits: [], Fillers: [], PillPads: [], Add: null, Height: 0 };
  }

  const units = _roomForHits(_buildUnits(tokens, Measure, ShowAdd), tokens, opts.MinHitWidth ?? 0);
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

  const maxRow = placed.reduce((m, p) => Math.max(m, p.Row), 0);
  const height = placed.length === 0 ? 0 : (maxRow + 1) * LineHeight;

  // Hits & pill pads: Drill Sentences lane W2, item 1 (a blind tester aiming for "16" in "march forward
  // 16 counts" hit "march"/"forward" instead, twice). Before this, every tappable token's hit rect was
  // padded by the SAME fixed amount (3px past the pill, 3 more past that, 9 vertically) regardless of
  // what sat beside it — two adjacent tokens with only a thin word-space between them (or, ja/zh, NO
  // space at all between a verb and its value) got hit rects that could overlap each other, or leave a
  // dead strip belonging to neither, instead of ever meeting in the middle.
  //
  // The fix is a Voronoi split, row by row: a tappable token's hit area extends toward a neighbour only
  // as far as the MIDPOINT of the gap between them (zero gap -> the hit areas meet exactly at the
  // touching point, never past it), and only falls back to the old fixed pad on a side with no neighbour
  // at all (the free end of a row) — `rowEntries` below builds that neighbour lookup once, from every
  // placed piece that carries real, visible content (tappable or not — a hit still never reaches past a
  // plain word or "then" beside it) plus the add button, so the last token on a row never balloons into
  // "+"'s own hit either. A PURE WHITESPACE piece (the space between "march" and "forward") is NEVER its
  // own neighbour entry — it is already counted for free, as part of the gap's own width, between the
  // real content on either side of it; treating it as a neighbour in its own right would zero out the
  // gap (the whitespace piece starts exactly where the word before it ends) and strip the comfortable
  // padding an ordinary word-spaced sentence has always had.
  //
  // Vertically, the same midpoint rule applies BETWEEN WRAPPED ROWS of this one sentence (never the next
  // sentence/line — this component has no idea what sits outside it): a row with a neighbour above or
  // below is clipped at the boundary exactly halfway between the two rows' centers, which (rows being
  // LineHeight apart with no gap) is exactly `row * LineHeight` / `(row + 1) * LineHeight`. A row with
  // nothing to clip against (the common case — most cues are one line) is instead free to reach a real
  // touch target, at least 44pt tall, centered on the line.
  //
  // Drill Sentences lane UU3, item 5 (a round 24 blind desktop tester clicked the squad name "3a ⇔ 3b" and landed on its
  // mirror mark, which popped the mirror menu): the mark stands between two names, the middle of the whole name, and its
  // share of the gaps either side made it the target a click on the name found. A mirror mark is hit only on its own
  // glyph across the row (`Tight`): the names beside it reach to its edges, so the space around it is theirs, and the
  // mark takes no more than its own box and the touch target's height.
  interface _RowEntry { readonly Left: number; readonly Right: number; readonly Tight: boolean; readonly Tappable: boolean; }
  const rowEntries = new Map<number, _RowEntry[]>();
  const pushRowEntry = (row: number, left: number, right: number, tight = false, tappable = false): void => {
    const list = rowEntries.get(row);
    if (list) list.push({ Left: left, Right: right, Tight: tight, Tappable: tappable });
    else rowEntries.set(row, [{ Left: left, Right: right, Tight: tight, Tappable: tappable }]);
  };
  // An icon token (the mirror mark) carries empty text but real width: it is visible content, so it is a
  // neighbour like any word, never mistaken for the whitespace the rule above leaves out.
  const isBlank = (piece: SentencePiece): boolean => piece.Text.trim() === '' && !tokens[piece.TokenIndex]?.Icon;
  for (const piece of pieces) {
    if (isBlank(piece)) continue; // a pure-whitespace piece is never its own neighbour — see above.
    const kind = tokens[piece.TokenIndex]?.Kind;
    pushRowEntry(piece.Row, piece.X, piece.X + piece.Width, kind === 'Mirror', !!kind && IsTappable(kind));
  }
  if (add) pushRowEntry(add.Row, add.X, add.X + add.Width);
  // Lane XX2, item 3: a row's first and last entries stand at its free ends, where a narrow word takes its least.
  const freeStart = new Set<_RowEntry>();
  const freeEnd = new Set<_RowEntry>();
  for (const list of rowEntries.values()) {
    list.sort((a, b) => a.Left - b.Left);
    freeStart.add(list[0]);
    freeEnd.add(list[list.length - 1]);
  }

  const FREE_PAD_X = 3; // the hit's own extra pad past the pill, kept on a side with nothing to split against.
  const PILL_PAD_X = 3; // PillRectOf's own default horizontal pad — see below, mirrored here for the free side.
  const PILL_GAP_THRESHOLD = PILL_PAD_X * 2; // below this natural gap, two default-padded pills would already touch or cross.
  const PILL_HAIRLINE = 0.5; // shaved off EACH touching pill edge — a visible ~1px seam, never a silent overlap into a neighbour's own glyph.
  const TOUCH_HALF_HEIGHT = 22; // half of the 44pt touch-target floor.
  const minHit = opts.MinHitWidth ?? 0;

  // Drill Sentences lane WW2, item 3 (Jack: "small touch targets"; a "P" or a mirror mark's hit was its own glyph and a
  // couple of points of gap): where two neighbours meet. Each side's edge is the split above; then a tappable entry
  // narrower than `minHit` reaches toward its least about its own center, as far as the neighbour's ink and no further,
  // the neighbour giving way; where both reach, they meet halfway between their wants. One rule for both sides of a gap,
  // so two hits never overlap. Lane XX2, item 3: a word at a row's free end takes its least from that end, as `hitOf`
  // reaches it there, and so wants nothing of the gap inside, which goes to the neighbour that needs it.
  const wantRight = (e: _RowEntry): number => (e.Tappable && e.Right - e.Left < minHit ? (e.Left + e.Right) / 2 + minHit / 2 : -Infinity);
  const wantLeft = (e: _RowEntry): number => (e.Tappable && e.Right - e.Left < minHit ? (e.Left + e.Right) / 2 - minHit / 2 : Infinity);
  const meet = (a: _RowEntry, b: _RowEntry): { readonly ARight: number; readonly BLeft: number } => {
    let aRight = a.Tight ? a.Right : b.Tight ? b.Left : (a.Right + b.Left) / 2;
    let bLeft = b.Tight ? b.Left : a.Tight ? a.Right : (a.Right + b.Left) / 2;
    const aWant = freeStart.has(a) ? -Infinity : wantRight(a);
    const bWant = freeEnd.has(b) ? Infinity : wantLeft(b);
    aRight = Math.max(aRight, Math.min(aWant, b.Left));
    bLeft = Math.min(bLeft, Math.max(bWant, a.Right));
    if (aRight > bLeft) {
      if (aWant > -Infinity && bWant < Infinity) aRight = bLeft = Math.min(b.Left, Math.max(a.Right, (aWant + bWant) / 2));
      else if (aWant > -Infinity) bLeft = aRight;
      else aRight = bLeft;
    }
    return { ARight: aRight, BLeft: bLeft };
  };

  // Drill Sentences lane X3, item 4 (phone, first-time tester): a tap on the word "then" opened the
  // "left flank" menu right after it. The Voronoi split above already stops a tappable word's own hit at
  // the midpoint of its gap to "then", but nothing OWNED "then" itself: the host resolved a press there
  // by asking only "which tappable rect holds this point?", so a finger landing on the filler's own edge,
  // or rolling a few px toward its neighbour before lifting, read as the neighbour. Every visible filler
  // piece (a plain word, "then", "·", ",", a Badge) now gets its own rect by the SAME rule, so the whole
  // row is partitioned with no gap between owners, and `TokenSentence.ts` resolves a press inside a
  // filler's rect to nothing at all (the row's own tap) rather than to the nearest word.
  const hitOf = (piece: SentencePiece): { X: number; Y: number; Width: number; Height: number; Prev: _RowEntry | null; Next: _RowEntry | null } => {
    const rowList = rowEntries.get(piece.Row) ?? [];
    const selfIdx = rowList.findIndex((e) => e.Left === piece.X && e.Right === piece.X + piece.Width);
    const prev = selfIdx > 0 ? rowList[selfIdx - 1] : null;
    const next = selfIdx >= 0 && selfIdx < rowList.length - 1 ? rowList[selfIdx + 1] : null;

    const self = selfIdx >= 0 ? rowList[selfIdx] : { Left: piece.X, Right: piece.X + piece.Width, Tight: false, Tappable: false };
    // Lane UU3, item 5: a tight mark keeps to its own glyph beside a neighbour, and the neighbour reaches its edge (`meet`).
    let hitLeft = !prev ? Math.min(piece.X - FREE_PAD_X - PILL_PAD_X, wantLeft(self)) : meet(prev, self).BLeft;
    let hitRight = !next ? Math.max(piece.X + piece.Width + FREE_PAD_X + PILL_PAD_X, wantRight(self)) : meet(self, next).ARight;
    // Lane WW2, item 3: a narrow word at a row's free end ("P · mark time") takes what its neighbour could not give it from
    // that free side, where nothing else stands.
    if (self.Tappable && !prev) hitLeft = Math.min(hitLeft, hitRight - minHit);
    if (self.Tappable && !next) hitRight = Math.max(hitRight, hitLeft + minHit);

    const centerY = piece.Y + LineHeight / 2;
    const hasPrevRow = piece.Row > 0;
    const hasNextRow = piece.Row < maxRow;
    const rowBoundaryAbove = piece.Row * LineHeight;
    const rowBoundaryBelow = (piece.Row + 1) * LineHeight;
    const hitTop = hasPrevRow ? Math.max(rowBoundaryAbove, centerY - TOUCH_HALF_HEIGHT) : centerY - TOUCH_HALF_HEIGHT;
    const hitBottom = hasNextRow ? Math.min(rowBoundaryBelow, centerY + TOUCH_HALF_HEIGHT) : centerY + TOUCH_HALF_HEIGHT;
    return { X: hitLeft, Y: hitTop, Width: hitRight - hitLeft, Height: hitBottom - hitTop, Prev: prev, Next: next };
  };

  const hits: SentenceHit[] = [];
  const fillers: SentenceHit[] = [];
  const pillPads: SentencePillPad[] = [];
  for (const piece of pieces) {
    const kind = tokens[piece.TokenIndex]?.Kind;
    if (!kind) continue;
    const tappable = IsTappable(kind);
    if (!tappable && isBlank(piece)) continue; // whitespace is part of a gap, never an owner of its own.
    const rect = hitOf(piece);
    const hit: SentenceHit = { TokenIndex: piece.TokenIndex, X: rect.X, Y: rect.Y, Width: rect.Width, Height: rect.Height };
    if (!tappable) { fillers.push(hit); continue; }
    hits.push(hit);

    // Below PILL_GAP_THRESHOLD, the default 3px pad on BOTH sides would already touch or cross — shrink
    // to half the real gap, less the hairline, so the two pills always keep at least a 1px seam. At zero
    // gap (the ja/zh glued-atom case) that formula goes slightly NEGATIVE, which is deliberate: it eats
    // a hairline INTO each atom's own box rather than merely meeting with no pad at all, so two atoms
    // that touch with no space of their own still visibly read as two separate targets.
    let leftPad = PILL_PAD_X;
    if (rect.Prev) {
      const gap = piece.X - rect.Prev.Right;
      if (gap < PILL_GAP_THRESHOLD) leftPad = gap / 2 - PILL_HAIRLINE;
    }
    let rightPad = PILL_PAD_X;
    if (rect.Next) {
      const gap = rect.Next.Left - (piece.X + piece.Width);
      if (gap < PILL_GAP_THRESHOLD) rightPad = gap / 2 - PILL_HAIRLINE;
    }
    pillPads.push({ TokenIndex: piece.TokenIndex, LeftPad: leftPad, RightPad: rightPad });
  }

  // Lane WW2, item 3 (the conformance spec found the "+"'s reach over the last word's own hit, and over the line above's):
  // the "+" reaches toward the word before it only as far as the two meet (`meet`), as every neighbour's does, and no
  // higher than its own line's top where a line stands above it, as a word's.
  if (add) {
    const rowList = rowEntries.get(add.Row) ?? [];
    const at = rowList.findIndex((e) => e.Left === add!.X && e.Right === add!.X + add!.Width);
    const left = at > 0 ? Math.max(add.Hit.X, meet(rowList[at - 1], rowList[at]).BLeft) : add.Hit.X;
    const top = add.Row > 0 ? Math.max(add.Hit.Y, add.Row * LineHeight) : add.Hit.Y;
    add = { ...add, Hit: { X: left, Y: top, Width: add.Hit.X + add.Hit.Width - left, Height: add.Hit.Y + add.Hit.Height - top } };
  }

  return { Pieces: pieces, Hits: hits, Fillers: fillers, PillPads: pillPads, Add: add, Height: height };
}

/** A tappable token's own pill rect — the SAME box `TokenSentence.ts`'s own hover/press/open/glow pills
 *  all paint into (`_visiblePills`'s own `pill = PillRectOf(piece, ...)`) and the box the hit rect
 *  (`LayoutSentence`'s own `Hits`, above) further pads: `piece`'s own measured box, widened 3px either
 *  side and a little past top/bottom to sit comfortably around the ink, never the raw unpadded glyph box.
 *  Pure and exported here (not just a private helper inside the component) so the first-run glow pill —
 *  item 9's "a pill exactly covering the target token's text box" — and every other state pill are
 *  provably the ONE geometry, not two copies that could drift apart. */
export function PillRectOf(
  piece: { readonly X: number; readonly Y: number; readonly Width: number },
  fontSize: number,
  lineHeight: number,
  leftPad = 3,
  rightPad = 3,
): { readonly X: number; readonly Y: number; readonly Width: number; readonly Height: number } {
  const height = 1.2 * fontSize + 2;
  return { X: piece.X - leftPad, Y: piece.Y + (lineHeight - height) / 2, Width: piece.Width + leftPad + rightPad, Height: height };
}

/** SF Pro's own per-size tracking, pt (Drill Sentences lane YY3b, item 10; Apple's HIG Typography page,
 *  `Jwift/Apple/HIG.md` section 15): negative through the body/UI mid-range, positive again at small
 *  caption sizes and large display sizes — a single constant letter-spacing visibly mismatches at both
 *  ends. The published rungs, piecewise-linearly interpolated between the two nearest (clamped flat past
 *  either end, the usual shape for a measured curve with no stated law between its own samples): 11 +0.06,
 *  12 0, 13 −0.08, 14 −0.15, 15 −0.23, 16 −0.31, 17 −0.43, 20 −0.45, 22 −0.26, 24 +0.07, 28 +0.38, 34 +0.40. */
const SF_PRO_TRACKING: readonly (readonly [size: number, tracking: number])[] = [
  [11, 0.06], [12, 0], [13, -0.08], [14, -0.15], [15, -0.23], [16, -0.31], [17, -0.43],
  [20, -0.45], [22, -0.26], [24, 0.07], [28, 0.38], [34, 0.40],
];

export function SFProTracking(fontSizePt: number): number {
  const table = SF_PRO_TRACKING;
  if (fontSizePt <= table[0][0]) return table[0][1];
  if (fontSizePt >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i + 1 < table.length; i++) {
    const [lo, loT] = table[i], [hi, hiT] = table[i + 1];
    if (fontSizePt >= lo && fontSizePt <= hi) return loT + ((hiT - loT) * (fontSizePt - lo)) / (hi - lo);
  }
  return 0; // unreachable — the clamp guards above cover every size outside the table.
}

/**
 * Drill Sentences U1, item 9 (a gentle first-run hint), live fix: the hint used to glow/anchor the
 * sentence's first TAPPABLE token in document order, which for "Everyone · mark time 16 counts" is the
 * leading Who token ("Everyone") — a first-time director tapping it learns "this names a name," not "a
 * word opens a control." Live, this put the glow pill and its tip popover over a short, often-abbreviated
 * name at the very start of the line instead of over the move itself, reading as a small, mispositioned
 * dot rather than a wash behind "mark time."
 *
 * The first MOVE word (`Kind: 'Word'`) teaches the concept this hint exists for — "tap a word" — far
 * better than a name ever could, so it is preferred outright over every other tappable kind regardless of
 * where in the sentence it falls. The Who token (or any other tappable kind) still counts as a fallback
 * for the rare line with no Word token at all (e.g. a pure "ftl path" line), so the hint still has
 * somewhere to point rather than never showing.
 */
export function FirstGlowTarget(tokens: readonly SentenceToken[]): string | null {
  const firstMoveWord = tokens.find((t) => t.Kind === 'Word');
  if (firstMoveWord) return firstMoveWord.Key;
  const firstTappable = tokens.find((t) => IsTappable(t.Kind));
  return firstTappable?.Key ?? null;
}

/**
 * One Angular `@for` track key per piece, ALIGNED to `pieces` by index — stable across a reflow that
 * only nudges a piece's own X (a sub-pixel rewrap, a `_pageFontEpoch` bump), never its WHICH-PIECE
 * identity. `TokenSentence.ts`'s own round-14 fix: a piece's X used to be baked into its key (round 13's
 * own fix for two pieces sharing a row), so ANY X move read to Angular as a brand-new piece — the old
 * `<jext>` torn down, a fresh one mounted, whose own `TextAnimator` starts at Opacity 0 and springs in
 * (the engine's own new-content fade), live as words blanking out then fading back during a phone sheet
 * drag. An ORDINAL position among the SAME token's own pieces is exactly as unique as X ever was and
 * never changes just because the piece moved — the key this returns names WHICH piece it is, not WHERE
 * it currently sits, so the same jext updates in place instead of being reborn.
 *
 * Drill Sentences lane V2, item 6 (two first-time testers): "a word briefly vanished mid-sentence during a
 * transition." Round 14's own key was `tokenKeyOf:Row#ordinal` — `Row` was carried over from the X-based
 * scheme it replaced, on the reasoning that "ordinal, same row" was the uniqueness round 14 could point
 * to in `LayoutSentence`'s own behaviour. But the ordinal itself (a counter over `pieces` in LAYOUT order,
 * incrementing once per piece already seen for that token) is unique across EVERY row on its own — two
 * pieces of the same token never share an ordinal, row or no row — so `Row` added nothing to the key's
 * uniqueness and everything to its instability: a token elsewhere in the sentence changing WIDTH (its
 * text growing or shrinking) can shift the wrap and push a LATER, utterly unchanged token onto a
 * different row, and that token's key changed anyway, purely because `Row` was riding along in it —
 * the exact "a word I never touched vanished" live bug, one step beyond the X move round 14 already
 * fixed. Dropping `Row` from the key closes it: a piece whose own token is unchanged keeps the SAME key
 * (and so the SAME jext, never refaded) no matter which row it lands on after a reflow elsewhere.
 */
export function TextPieceKeys(
  pieces: readonly SentencePiece[], tokenKeyOf: (tokenIndex: number) => string,
): readonly string[] {
  const ordinal = new Map<number, number>();
  return pieces.map((piece) => {
    const n = ordinal.get(piece.TokenIndex) ?? 0;
    ordinal.set(piece.TokenIndex, n + 1);
    return `${tokenKeyOf(piece.TokenIndex)}#${n}`;
  });
}

/** Where a piece (`TextPieceKeys`) stood at the last layout, and how many times it has landed afresh. */
export interface PieceLanding {
  readonly X: number;
  readonly Y: number;
  readonly Generation: number;
}

/** Whether two token lists read the same words: the same keys, kinds and texts, in order. */
export function SameWords(a: readonly SentenceToken[], b: readonly SentenceToken[]): boolean {
  return a.length === b.length && a.every((t, i) => t.Key === b[i].Key && t.Kind === b[i].Kind && t.Text === b[i].Text && t.Icon === b[i].Icon);
}

/**
 * Drill Sentences lane BB2, item 4 (blind testers, three times: "outs8 counts" after a grouping,
 * "theright face" after an undo, a tangle after 16 became 12): when a sentence's words change, the words
 * that stay slid from where they stood to where they now go, through the words just arriving there, while
 * the words that left faded out where they had stood. Two words were drawn over each other until it settled.
 *
 * A change of words now lands at once. A piece that stays where it stood keeps its node (its text, if it
 * changed, swaps at once: `SnapText`); a piece that moves lands afresh where it now goes, a new node under a
 * new `Generation`, and fades in there; a piece that goes vanishes at once (`TokenSentence.jss`). Nothing
 * slides through anything. Only a change of WIDTH with the same words (a sheet resized) still slides its
 * pieces into their new rows, as before: nothing arrives or leaves then, so nothing can overlap.
 */
export function LandPieces(
  previous: ReadonlyMap<string, PieceLanding>, pieces: readonly { readonly Key: string; readonly X: number; readonly Y: number }[],
  wordsChanged: boolean,
): Map<string, PieceLanding> {
  const out = new Map<string, PieceLanding>();
  for (const piece of pieces) {
    const was = previous.get(piece.Key);
    const moved = !!was && (Math.abs(was.X - piece.X) > 0.5 || Math.abs(was.Y - piece.Y) > 0.5);
    const generation = !was ? 0 : wordsChanged && moved ? was.Generation + 1 : was.Generation;
    out.set(piece.Key, { X: piece.X, Y: piece.Y, Generation: generation });
  }
  return out;
}
