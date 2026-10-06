import { describe, expect, it } from 'vitest';
import { IsTappable, LayoutSentence, type SentenceToken } from './TokenSentence.Layout';

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
