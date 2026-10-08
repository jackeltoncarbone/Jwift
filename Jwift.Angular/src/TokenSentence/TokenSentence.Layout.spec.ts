import { describe, expect, it } from 'vitest';
import {
  FirstGlowTarget, IsTappable, LandPieces, LayoutSentence, PillRectOf, SameWords, TextPieceKeys, type SentencePiece,
  type SentenceToken,
} from './TokenSentence.Layout';

/**
 * Drill Sentences U1, item 5 (two first-time testers): "On phone, tapping the words '16 counts' did
 * nothing; only the bold digits responded." `LayoutSentence` had ZERO spec coverage before this fix, even
 * though the app's own `CountsText`/`lengthToken` (ShowStudio.App's `Render.ts`) depend on exactly the
 * property this file's own doc comment already claims: "Tappable kinds ... one atom, carrying the token's
 * FULL text, never split." These pin that claim directly — the fix for item 5 (`TokenSentence.ts`'s own
 * `KIND_STYLE.Value` now carries an underline, matching `Word`) only matters because the hit area already
 * spans the whole value; if a future change ever let a tappable token split into a bold prefix and a plain
 * suffix, these fail loudly rather than leaving that regression to another live bug report.
 */
const measure = (text: string): number => text.length * 8; // a crude fixed-width stand-in; only RELATIVE widths matter here.

describe('LayoutSentence — a tappable Value atom is never split, number and unit stay one piece', () => {
  it('a count\'s full text ("16 counts") produces exactly one piece and one hit, spanning the whole string', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'move', Text: 'march', Kind: 'Word' },
      { Key: 'sp', Text: ' ', Kind: 'Text' },
      { Key: 'value', Text: 'forward', Kind: 'Value' },
      { Key: 'sp2', Text: ' ', Kind: 'Text' },
      { Key: 'count', Text: '16 counts', Kind: 'Value' },
    ];
    const result = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const countPieces = result.Pieces.filter((p) => p.TokenIndex === 4);
    expect(countPieces).toHaveLength(1);
    expect(countPieces[0].Text).toBe('16 counts'); // the unit never breaks off into its own piece.
    const countHits = result.Hits.filter((h) => h.TokenIndex === 4);
    expect(countHits).toHaveLength(1);
    // The hit (padded past the pill, LayoutSentence's own convention) covers at least the full measured
    // text width — tapping anywhere over "counts", not only over "16", must land inside it.
    expect(countHits[0].Width).toBeGreaterThanOrEqual(measure('16 counts'));
  });

  it('even forced to wrap onto its own row, the count atom still never splits mid-string', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'move', Text: 'march', Kind: 'Word' },
      { Key: 'sp', Text: ' ', Kind: 'Text' },
      { Key: 'value', Text: 'forward', Kind: 'Value' },
      { Key: 'sp2', Text: ' ', Kind: 'Text' },
      { Key: 'count', Text: '16 counts', Kind: 'Value' },
    ];
    // A width that forces a wrap right around where "16 counts" starts.
    const result = LayoutSentence(tokens, { WrapWidth: 90, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const countPieces = result.Pieces.filter((p) => p.TokenIndex === 4);
    expect(countPieces).toHaveLength(1);
    expect(countPieces[0].Text).toBe('16 counts');
  });

  it('Value is tappable, same as Word — the kind table both "16 counts" and "forward" resolve through', () => {
    expect(IsTappable('Value')).toBe(true);
    expect(IsTappable('Word')).toBe(true);
  });
});

// Drill Sentences U1 live follow-up: the first-run hint's glow/tip targeted "Everyone" (the leading Who
// token on "Everyone · mark time 16 counts") instead of the move word it meant to teach "tap a word" with
// — a target-CHOICE bug, not a geometry one (`PillRectOf` below is the exact same box every other pill
// state already painted into). `EditorLine.ts`'s own `GlowTargetKey` now calls `FirstGlowTarget` instead
// of taking whatever tappable token happens to come first in document order.
describe('FirstGlowTarget', () => {
  const who = (key: string, s: string): SentenceToken => ({ Key: key, Text: s, Kind: 'Who' });
  const value = (key: string, s: string): SentenceToken => ({ Key: key, Text: s, Kind: 'Value' });
  const word = (key: string, s: string): SentenceToken => ({ Key: key, Text: s, Kind: 'Word' });

  it('prefers the first MOVE word over a leading Who token', () => {
    const tokens: SentenceToken[] = [who('who', 'Everyone'), word('verb', 'mark time'), value('count', '16 counts')];
    expect(FirstGlowTarget(tokens)).toBe('verb');
  });

  it('falls back to the first tappable token of any kind when there is no Word token', () => {
    const tokens: SentenceToken[] = [who('leader', '1a'), value('counts', '8 counts')];
    expect(FirstGlowTarget(tokens)).toBe('leader');
  });

  it('returns null when nothing is tappable', () => {
    expect(FirstGlowTarget([{ Key: 't', Text: 'then', Kind: 'Quiet' }])).toBeNull();
  });
});

describe('PillRectOf', () => {
  it('is exactly the piece\'s own box, padded 3px horizontally and centered in the line height', () => {
    const piece = { X: 40, Y: 0, Width: 68 };
    const fs = 16, lh = 23;
    const rect = PillRectOf(piece, fs, lh);
    const expectedHeight = 1.2 * fs + 2;
    expect(rect).toEqual({ X: 37, Y: (lh - expectedHeight) / 2, Width: 74, Height: expectedHeight });
  });

  it('horizontally, a hit with no row-neighbour is the identical box LayoutSentence pads by the same ' +
    '3px free-side default — one geometry, not two', () => {
    const fs = 16, lh = 23;
    const tokens: readonly SentenceToken[] = [{ Key: 'w', Text: 'forward', Kind: 'Word' }];
    const r = LayoutSentence(tokens, { WrapWidth: 400, LineHeight: lh, FontSize: fs, Measure: measure, ShowAdd: false });
    const piece = r.Pieces[0];
    const hit = r.Hits[0];
    const pill = PillRectOf(piece, fs, lh);
    expect(hit.X).toBeCloseTo(pill.X - 3, 5);
    expect(hit.Width).toBeCloseTo(pill.Width + 6, 5);
  });

  // Drill Sentences lane W2, item 1: a lone token on a one-line sentence has no OTHER row to split
  // against, so the vertical hit is free to reach a real touch target (44pt) centered on the line,
  // rather than the old fixed 9px pad (39.2pt) a single-row sentence never actually needed to share
  // headroom for.
  it('vertically, a hit with no neighbouring row reaches the full 44pt touch target, centered on the line', () => {
    const fs = 16, lh = 23;
    const tokens: readonly SentenceToken[] = [{ Key: 'w', Text: 'forward', Kind: 'Word' }];
    const r = LayoutSentence(tokens, { WrapWidth: 400, LineHeight: lh, FontSize: fs, Measure: measure, ShowAdd: false });
    const piece = r.Pieces[0];
    const hit = r.Hits[0];
    const centerY = piece.Y + lh / 2;
    expect(hit.Height).toBeCloseTo(44, 5);
    expect(hit.Y).toBeCloseTo(centerY - 22, 5);
  });
});

// Drill Sentences lane W2, item 1 (a blind tester aiming for "16" in "march forward 16 counts" hit
// "march"/"forward" instead, twice): two tappable tokens must never share a boundary — the hit area of
// each extends only to the MIDPOINT of the whitespace between it and its neighbour, a Voronoi split, so
// every point in that gap resolves to exactly one of the two, never both (an overlap) and never neither
// (a dead strip belonging to nobody).
describe('LayoutSentence — Hits never overlap a neighbour, a Voronoi split at the midpoint of the gap', () => {
  it('two tappable tokens separated by an ordinary word-space meet exactly at the midpoint, no overlap, no gap', () => {
    // The exact live scenario: "march forward 16 counts" — Word, space, Value, space, Value.
    const tokens: readonly SentenceToken[] = [
      { Key: 'verb', Text: 'march', Kind: 'Word' },
      { Key: 'sp1', Text: ' ', Kind: 'Text' },
      { Key: 'value', Text: 'forward', Kind: 'Value' },
      { Key: 'sp2', Text: ' ', Kind: 'Text' },
      { Key: 'count', Text: '16 counts', Kind: 'Value' },
    ];
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const valueHit = r.Hits.find((h) => h.TokenIndex === 2)!;
    const countHit = r.Hits.find((h) => h.TokenIndex === 4)!;
    // Contiguous: the two hits abut at one shared boundary, covering the whole gap between them with no
    // seam left over for neither to claim and no region claimed by both.
    expect(valueHit.X + valueHit.Width).toBeCloseTo(countHit.X, 5);
  });

  it('two tappable atoms glued with NO space between them (ja/zh verb+value) still split at the exact touching point', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'verb', Text: '行進', Kind: 'Word' },
      { Key: 'value', Text: '前へ', Kind: 'Value' },
    ];
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const verbPiece = r.Pieces.find((p) => p.TokenIndex === 0)!;
    const valuePiece = r.Pieces.find((p) => p.TokenIndex === 1)!;
    expect(valuePiece.X).toBe(verbPiece.X + verbPiece.Width); // confirms the zero-gap premise.
    const verbHit = r.Hits.find((h) => h.TokenIndex === 0)!;
    const valueHit = r.Hits.find((h) => h.TokenIndex === 1)!;
    expect(verbHit.X + verbHit.Width).toBeCloseTo(valueHit.X, 5); // meet exactly, neither crosses into the other.
    expect(verbHit.X + verbHit.Width).toBeCloseTo(verbPiece.X + verbPiece.Width, 5); // the split sits AT the touching point.
  });

  it('a tappable token never reaches past a non-tappable neighbour either (a plain word, "then")', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'value', Text: '8 counts', Kind: 'Value' },
      { Key: 'comma', Text: ', ', Kind: 'Quiet' },
      { Key: 'then', Text: 'then', Kind: 'Quiet' },
    ];
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const valuePiece = r.Pieces.find((p) => p.TokenIndex === 0)!;
    const commaPiece = r.Pieces.find((p) => p.TokenIndex === 1 && p.Text === ',')!;
    const valueHit = r.Hits.find((h) => h.TokenIndex === 0)!;
    // The hit must stop at (or before) the midpoint of the gap to the comma — it may never reach as far
    // as the comma's own start, let alone past it into "then".
    expect(valueHit.X + valueHit.Width).toBeLessThanOrEqual(commaPiece.X);
  });

  it('a hit on the free end of a row (no neighbour at all) keeps the old fixed pad, not an unbounded reach', () => {
    const tokens: readonly SentenceToken[] = [{ Key: 'w', Text: 'forward', Kind: 'Word' }];
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const piece = r.Pieces[0];
    const hit = r.Hits[0];
    expect(hit.X).toBeCloseTo(piece.X - 6, 5);
    expect(hit.X + hit.Width).toBeCloseTo(piece.X + piece.Width + 6, 5);
  });
});

describe('LayoutSentence — Hits never overlap an adjacent WRAPPED row either, split at the midpoint between rows', () => {
  it('two rows of the same sentence meet exactly at the boundary between them, never overlapping', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'a', Text: 'aaaaaaaaaa', Kind: 'Word' },
      { Key: 'sp', Text: ' ', Kind: 'Text' },
      { Key: 'b', Text: 'bbbbbbbbbb', Kind: 'Word' },
    ];
    // Narrow enough that "a" and "b" land on separate rows.
    const r = LayoutSentence(tokens, { WrapWidth: 90, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const aPiece = r.Pieces.find((p) => p.TokenIndex === 0)!;
    const bPiece = r.Pieces.find((p) => p.TokenIndex === 2)!;
    expect(bPiece.Row).toBe(aPiece.Row + 1); // confirms the two-row premise.
    const aHit = r.Hits.find((h) => h.TokenIndex === 0)!;
    const bHit = r.Hits.find((h) => h.TokenIndex === 2)!;
    expect(aHit.Y + aHit.Height).toBeCloseTo(bHit.Y, 5); // the rows' own hits meet, never overlap.
    expect(aHit.Y + aHit.Height).toBeCloseTo(bPiece.Row * 23, 5); // exactly at the row boundary.
  });
});

describe('LayoutSentence — PillPads: a hairline gap between two tappable atoms with (near) zero natural gap', () => {
  it('atoms glued with no space (ja/zh verb+value) get a shaved pad on their touching edges, never the default 3px', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'verb', Text: '行進', Kind: 'Word' },
      { Key: 'value', Text: '前へ', Kind: 'Value' },
    ];
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const verbPad = r.PillPads.find((p) => p.TokenIndex === 0)!;
    const valuePad = r.PillPads.find((p) => p.TokenIndex === 1)!;
    expect(verbPad.RightPad).toBeLessThan(3);
    expect(valuePad.LeftPad).toBeLessThan(3);
    // Their two pills never touch or cross — a visible seam always remains between them.
    const verbPiece = r.Pieces.find((p) => p.TokenIndex === 0)!;
    const valuePiece = r.Pieces.find((p) => p.TokenIndex === 1)!;
    const verbPillRight = verbPiece.X + verbPiece.Width + verbPad.RightPad;
    const valuePillLeft = valuePiece.X - valuePad.LeftPad;
    expect(verbPillRight).toBeLessThan(valuePillLeft);
  });

  it('a token with a generous gap on both sides keeps the default 3px pad', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'verb', Text: 'march', Kind: 'Word' },
      { Key: 'sp', Text: ' ', Kind: 'Text' },
      { Key: 'value', Text: 'forward', Kind: 'Value' },
    ];
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const verbPad = r.PillPads.find((p) => p.TokenIndex === 0)!;
    expect(verbPad.LeftPad).toBe(3); // free end, nothing before it.
  });
});

/** Drill Sentences lane V2, item 6 (two first-time testers): "a word briefly vanished mid-sentence during
 *  a transition." A piece's key must track WHICH piece it is (its own token, and which of that token's
 *  own pieces), never WHERE it currently renders (its row) — row 14's own fix dropped `X` for exactly
 *  this reason but still carried `Row`, which a reflow triggered by some OTHER token's text changing
 *  width can change for a piece whose own token never did. */
const piece = (o: Partial<SentencePiece> & { TokenIndex: number }): SentencePiece =>
  ({ Text: '', X: 0, Y: 0, Width: 10, Row: 0, ...o });

describe('TextPieceKeys', () => {
  it('keys a piece by its token and ordinal alone — never by which row it currently sits on', () => {
    const pieces = [piece({ TokenIndex: 0, Row: 0 })];
    const keyAtRow0 = TextPieceKeys(pieces, (i) => `tok${i}`)[0];
    const keyAtRow1 = TextPieceKeys([piece({ TokenIndex: 0, Row: 1 })], (i) => `tok${i}`)[0];
    expect(keyAtRow0).toBe(keyAtRow1);
  });

  it('a reflow that moves a LATER, unchanged token to a different row keeps that token\'s own key — it ' +
    'never refades just because something earlier on the line grew or shrank', () => {
    // Before: token 0 ("8") and token 1 ("counts") both sit on row 0.
    const before = TextPieceKeys(
      [piece({ TokenIndex: 0, Row: 0 }), piece({ TokenIndex: 1, Row: 0 })],
      (i) => `tok${i}`,
    );
    // After: token 0's own text grew ("8" -> "100"), pushing token 1 onto row 1 — token 1 itself never
    // changed at all.
    const after = TextPieceKeys(
      [piece({ TokenIndex: 0, Row: 0 }), piece({ TokenIndex: 1, Row: 1 })],
      (i) => `tok${i}`,
    );
    expect(after[1]).toBe(before[1]);
  });

  it('still gives each piece of a MULTI-PIECE token (a Text/Quiet run split into units) its own, stable, ' +
    'ordinal-keyed identity', () => {
    const pieces = [
      piece({ TokenIndex: 0, Row: 0 }), // token 0's 1st piece
      piece({ TokenIndex: 1, Row: 0 }), // token 1's 1st piece (a different token)
      piece({ TokenIndex: 0, Row: 1 }), // token 0's 2nd piece, wrapped onto the next row
    ];
    const keys = TextPieceKeys(pieces, (i) => `tok${i}`);
    expect(new Set(keys).size).toBe(3); // all three are distinct...
    expect(keys[0]).not.toBe(keys[2]); // ...in particular, token 0's two pieces never collide.
  });

  it('two different tokens never collide, even landing on the identical row and ordinal', () => {
    const keys = TextPieceKeys(
      [piece({ TokenIndex: 0, Row: 2 }), piece({ TokenIndex: 1, Row: 2 })],
      (i) => `tok${i}`,
    );
    expect(keys[0]).not.toBe(keys[1]);
  });
});

// Drill Sentences lane X3, item 4 (phone, first-time tester): tapping "then" opened the "left flank" menu
// beside it. A filler owns its own share of the row, by the same midpoint rule a tappable word gets, so a
// press on it resolves to the filler (nothing) and never to the word next door.
describe('LayoutSentence — a filler word owns its own hit area', () => {
  const thenLeftFlank: readonly SentenceToken[] = [
    { Key: 'count', Text: '8 counts', Kind: 'Value' },
    { Key: 'then', Text: ', then ', Kind: 'Quiet' },
    { Key: 'move', Text: 'left flank', Kind: 'Word' },
  ];

  it('"then" gets a filler rect that abuts the tappable word after it, never overlapping it', () => {
    const r = LayoutSentence(thenLeftFlank, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const thenPiece = r.Pieces.find((p) => p.Text === 'then')!;
    const thenRect = r.Fillers.find((f) => f.X <= thenPiece.X && f.X + f.Width >= thenPiece.X + thenPiece.Width)!;
    const moveHit = r.Hits.find((h) => h.TokenIndex === 2)!;
    expect(thenRect).toBeTruthy();
    expect(thenRect.X + thenRect.Width).toBeCloseTo(moveHit.X, 5);
    // The filler's rect covers the whole word, so no point over "then" belongs to "left flank".
    expect(moveHit.X).toBeGreaterThan(thenPiece.X + thenPiece.Width);
  });

  it('whitespace is never an owner, and every visible filler piece ("," and "then") gets one rect each', () => {
    const r = LayoutSentence(thenLeftFlank, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    expect(r.Fillers).toHaveLength(2);
    expect(r.Fillers.every((f) => f.TokenIndex === 1)).toBe(true);
  });

  it('the mirror icon (empty text, real width) is a neighbour, so "1a" never reaches over it', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'who', Text: '1a', Kind: 'Who' },
      { Key: 'sp', Text: ' ', Kind: 'Text' },
      { Key: 'mirror', Text: '', Kind: 'Mirror', Icon: 'arrow.left.and.right' },
      { Key: 'sp2', Text: ' ', Kind: 'Text' },
      { Key: 'partner', Text: '1b', Kind: 'Who' },
    ];
    const iconMeasure = (text: string, _weight: number, icon?: string): number => (icon ? 16 : measure(text));
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: iconMeasure, ShowAdd: false });
    const whoHit = r.Hits.find((h) => h.TokenIndex === 0)!;
    const mirrorHit = r.Hits.find((h) => h.TokenIndex === 2)!;
    expect(whoHit.X + whoHit.Width).toBeCloseTo(mirrorHit.X, 5);
  });

  // Drill Sentences lane UU3, item 5 (a round 24 blind desktop tester clicked the squad name "3a ⇔ 3b" and landed on the
  // mirror mark, which popped its menu): the mark is hit on its own glyph alone, and the names reach to its edges.
  it('the mirror mark is hit on its own glyph alone, and the names either side take the space around it', () => {
    const tokens: readonly SentenceToken[] = [
      { Key: 'who', Text: '3a', Kind: 'Who' },
      { Key: 'sp', Text: ' ', Kind: 'Text' },
      { Key: 'mirror', Text: '', Kind: 'Mirror', Icon: 'arrow.left.and.right' },
      { Key: 'sp2', Text: ' ', Kind: 'Text' },
      { Key: 'partner', Text: '3b', Kind: 'Who' },
    ];
    const iconMeasure = (text: string, _weight: number, icon?: string): number => (icon ? 16 : measure(text));
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: iconMeasure, ShowAdd: false });
    const glyph = r.Pieces.find((p) => p.TokenIndex === 2)!;
    const mirrorHit = r.Hits.find((h) => h.TokenIndex === 2)!;
    expect(mirrorHit.X).toBeCloseTo(glyph.X, 5);
    expect(mirrorHit.Width).toBeCloseTo(glyph.Width, 5);
    // The touch target's height, as every word on a row of its own.
    expect(mirrorHit.Height).toBe(44);
    const whoHit = r.Hits.find((h) => h.TokenIndex === 0)!;
    const partnerHit = r.Hits.find((h) => h.TokenIndex === 4)!;
    expect(whoHit.X + whoHit.Width).toBeCloseTo(glyph.X, 5);
    expect(partnerHit.X).toBeCloseTo(glyph.X + glyph.Width, 5);
  });
});

// Drill Sentences lane BB2, item 4 (blind testers, three times: "outs8 counts" after a grouping, "theright
// face" after an undo, a tangle after 16 became 12): when the words changed, the words that stayed slid to
// their new places through the words arriving there, while the words that left faded out under them.
describe('LandPieces: a change of words lands at once, no word ever drawn over another', () => {
  const layout = (words: readonly string[]) => {
    const tokens: SentenceToken[] = words.map((w, i) => ({ Key: `w${i}`, Text: w, Kind: w.trim() ? 'Word' : 'Text' }));
    const r = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const keys = TextPieceKeys(r.Pieces, (i) => tokens[i].Key);
    return { Tokens: tokens, Spots: r.Pieces.map((p, i) => ({ Key: keys[i], X: p.X, Y: p.Y })) };
  };

  it('the undo: a word that stays put keeps its node, every word that moved lands afresh where it now goes', () => {
    const before = layout(['then', ' ', 'march', ' ', 'right']);
    const after = layout(['then', ' ', 'the', ' ', 'right', ' ', 'face']);
    const was = LandPieces(new Map(), before.Spots, false);
    const now = LandPieces(was, after.Spots, !SameWords(before.Tokens, after.Tokens));
    expect(now.get('w0#0')!.Generation).toBe(0); // "then" never moved.
    expect(now.get('w2#0')!.Generation).toBe(0); // the word in that slot swapped its text in place, at once.
    expect(now.get('w4#0')!.Generation).toBe(1); // "right" moved: a new node where it now stands.
    expect(now.get('w6#0')!.Generation).toBe(0); // "face" is new.
    // No word is ever carried from one spot to another: anything that moved is a node of a new generation.
    for (const spot of after.Spots) {
      const old = was.get(spot.Key);
      if (old && (old.X !== spot.X || old.Y !== spot.Y)) expect(now.get(spot.Key)!.Generation).toBe(old.Generation + 1);
    }
  });

  it('a sheet resized with the same words still slides its words into their new rows, keeping every node', () => {
    const words = layout(['march', ' ', 'forward', ' ', '16 counts']);
    const was = LandPieces(new Map(), words.Spots, false);
    const narrow = words.Spots.map((s, i) => (i === 4 ? { ...s, X: 0, Y: 23 } : s));
    const now = LandPieces(was, narrow, false);
    expect([...now.values()].every((l) => l.Generation === 0)).toBe(true);
    expect(now.get(words.Spots[4].Key)).toMatchObject({ X: 0, Y: 23 });
  });

  it('reads the same words as the same, whatever list carries them', () => {
    const a = layout(['march', ' ', 'forward']).Tokens;
    expect(SameWords(a, a.map((t) => ({ ...t })))).toBe(true);
    expect(SameWords(a, a.map((t, i) => (i === 2 ? { ...t, Text: 'backward' } : t)))).toBe(false);
  });

  it('a word that goes vanishes at once, and the sentence lands its words rather than sliding or cross fading them', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const url = await import('node:url');
    const here = path.dirname(url.fileURLToPath(import.meta.url));
    const jss = fs.readFileSync(path.join(here, 'TokenSentence.jss'), 'utf8');
    const ts = fs.readFileSync(path.join(here, 'TokenSentence.ts'), 'utf8');
    for (const cls of ['Jwift_TokenSentenceWord', 'Jwift_TokenSentenceUnderline']) {
      const block = new RegExp(`\\n${cls}\\s*\\{([^}]*)\\}`).exec(jss)![1];
      expect(block, cls).toMatch(/Opacity:\s*Presence \* \(1 - Exiting\)/);
      expect(block, cls).toMatch(/@Transition Opacity \{ Duration: 0ms/);
    }
    expect((ts.match(/<jext class="[^"]*Jwift_TokenSentenceWord/g) ?? []).length).toBe(2);
    expect(ts).toContain('word.Node.SnapText = true');
    expect(ts).toMatch(/LandPieces\(this\._landings, spots, changed\)/);
  });
});

/**
 * Drill Sentences lane WW2, item 3 (Jack: "small touch targets"): a narrow word ("P", a mirror mark) reaches Apple's least
 * across (`MinHitWidth`, the app's 28pt for a finger and 20pt for a pointer), taking the room it lacks from the gaps beside
 * it and a free row end, never over a neighbour's own ink; and the "+" stops where it meets the word before it.
 */
describe('LayoutSentence — a narrow word reaches the least across, and no two hits overlap (lane WW2, item 3)', () => {
  const tokens: readonly SentenceToken[] = [
    { Key: 'who', Text: 'P', Kind: 'Who' },
    { Key: 'dot', Text: ' · ', Kind: 'Text' },
    { Key: 'move', Text: 'mark time', Kind: 'Word' },
  ];
  it('0, the default, leaves the split as it was; 28 widens "P" from its free end', () => {
    const plain = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false });
    const wide = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: false, MinHitWidth: 28 });
    const p = (r: typeof plain) => r.Hits.find((h) => h.TokenIndex === 0)!;
    expect(p(plain).Width).toBeLessThan(28);
    expect(p(wide).Width).toBeGreaterThanOrEqual(28);
    // It takes the gap up to the "·", and never its ink.
    const dot = wide.Pieces.find((piece) => piece.Text === '·')!;
    expect(p(wide).X + p(wide).Width).toBeGreaterThanOrEqual(p(plain).X + p(plain).Width);
    expect(p(wide).X + p(wide).Width).toBeLessThanOrEqual(dot.X + 1e-6);
  });

  it('the "+" reaches toward the last word only as far as the two meet', () => {
    const laid = LayoutSentence(tokens, { WrapWidth: 1000, LineHeight: 23, FontSize: 16, Measure: measure, ShowAdd: true });
    const last = laid.Hits.find((h) => h.TokenIndex === 2)!;
    expect(laid.Add!.Hit.X).toBeGreaterThanOrEqual(last.X + last.Width - 1e-6);
  });
});
