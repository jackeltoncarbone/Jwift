import { describe, expect, it } from 'vitest';
import { FirstGlowTarget, IsTappable, LayoutSentence, PillRectOf, type SentenceToken } from './TokenSentence.Layout';

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

  it('is the identical box LayoutSentence\'s own Hits pad further — one geometry, not two', () => {
    const fs = 16, lh = 23;
    const tokens: readonly SentenceToken[] = [{ Key: 'w', Text: 'forward', Kind: 'Word' }];
    const r = LayoutSentence(tokens, { WrapWidth: 400, LineHeight: lh, FontSize: fs, Measure: measure, ShowAdd: false });
    const piece = r.Pieces[0];
    const hit = r.Hits[0];
    const pill = PillRectOf(piece, fs, lh);
    expect(hit.X).toBeCloseTo(pill.X - 3, 5);
    expect(hit.Y).toBeCloseTo(pill.Y - 9, 5);
    expect(hit.Width).toBeCloseTo(pill.Width + 6, 5);
    expect(hit.Height).toBeCloseTo(pill.Height + 18, 5);
  });
});
