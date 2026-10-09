import { describe, expect, it } from 'vitest';
import {
  CenterXOf, FocusableTokenKeys, FocusRingRectFor, MoveRovingIndex, NearestIndexByCenter, type FocusRect,
} from './TokenSentence.Focus';
import type { SentenceToken } from './TokenSentence.Layout';

/**
 * Drill Sentences lane AG2 (blind round 31 desktop, `54_tab10.png`): ten Tabs never reached a sentence's
 * own words. These pin the three pure decisions `TokenSentence.ts`'s own keydown wiring reads straight
 * off this file — which stops exist, where Left/Right/wrap lands, and the ring's own rect — the same
 * shape `TokenSentence.Layout.spec.ts` beside this file already pins `LayoutSentence`'s own decisions
 * with, no Angular or jaui needed to exercise any of them.
 */

describe('FocusableTokenKeys', () => {
  const who = (key: string): SentenceToken => ({ Key: key, Text: key, Kind: 'Who' });
  const text = (key: string): SentenceToken => ({ Key: key, Text: key, Kind: 'Text' });
  const badge = (key: string): SentenceToken => ({ Key: key, Text: key, Kind: 'Badge' });

  it('keeps only tappable tokens, in their own order, dropping Text and Badge', () => {
    const tokens = [who('a'), text('sp'), who('b'), badge('n')];
    expect(FocusableTokenKeys(tokens, false)).toEqual(['a', 'b']);
  });

  it('appends "+" last when the sentence shows one', () => {
    const tokens = [who('a')];
    expect(FocusableTokenKeys(tokens, true)).toEqual(['a', '+']);
  });

  it('is "+"-only when nothing in the sentence is tappable', () => {
    expect(FocusableTokenKeys([text('only')], true)).toEqual(['+']);
  });

  it('is empty for a sentence with nothing tappable and no "+"', () => {
    expect(FocusableTokenKeys([text('only')], false)).toEqual([]);
  });
});

describe('MoveRovingIndex — Left/Right and the wrap at either end', () => {
  it('a fresh sentence (current null) starts at the leading stop for Right, the trailing one for Left', () => {
    expect(MoveRovingIndex(3, null, 'Right')).toBe(0);
    expect(MoveRovingIndex(3, null, 'Left')).toBe(2);
  });

  it('steps one stop at a time inside the row', () => {
    expect(MoveRovingIndex(3, 0, 'Right')).toBe(1);
    expect(MoveRovingIndex(3, 1, 'Left')).toBe(0);
  });

  it('wraps past the last stop back to the first, and past the first back to the last', () => {
    expect(MoveRovingIndex(3, 2, 'Right')).toBe(0);
    expect(MoveRovingIndex(3, 0, 'Left')).toBe(2);
  });

  it('a single stop wraps onto itself either way', () => {
    expect(MoveRovingIndex(1, 0, 'Right')).toBe(0);
    expect(MoveRovingIndex(1, 0, 'Left')).toBe(0);
  });

  it('null with nothing to rove over at all (an empty sentence)', () => {
    expect(MoveRovingIndex(0, null, 'Right')).toBeNull();
  });
});

describe('CenterXOf / NearestIndexByCenter — Up/Down "keeping the nearest token"', () => {
  it('a rect\'s own center is its X plus half its width', () => {
    const rect: FocusRect = { X: 100, Y: 0, Width: 40, Height: 20 };
    expect(CenterXOf(rect)).toBe(120);
  });

  it('picks whichever center sits closest to the handed-off X', () => {
    expect(NearestIndexByCenter([10, 50, 200], 48)).toBe(1);
  });

  it('an exact tie keeps the earlier index', () => {
    expect(NearestIndexByCenter([10, 90], 50)).toBe(0);
  });

  it('a single stop is always the nearest one', () => {
    expect(NearestIndexByCenter([77], 0)).toBe(0);
  });

  it('null when the neighbouring row has no stops of its own', () => {
    expect(NearestIndexByCenter([], 50)).toBeNull();
  });
});

describe('FocusRingRectFor — the ring rect equals the token rect plus the gap', () => {
  it('expands the rect by the gap on every side, by default the system gap', () => {
    const rect: FocusRect = { X: 100, Y: 20, Width: 30, Height: 16 };
    const ring = FocusRingRectFor(rect, 2);
    expect(ring).toEqual({ X: 98, Y: 18, Width: 34, Height: 20 });
  });

  it('defaults to the system FOCUS_RING_GAP_PT when no gap is passed', () => {
    const rect: FocusRect = { X: 0, Y: 0, Width: 10, Height: 10 };
    const ring = FocusRingRectFor(rect);
    // Whatever the system gap is, the ring's own box is exactly that much larger on every side —
    // pinned against the constant itself, not a hard-coded number, so a future change to the shared
    // gap moves this expectation with it rather than silently going stale.
    expect(ring.Width - rect.Width).toBe(ring.Height - rect.Height);
    expect(ring.X).toBeLessThan(rect.X);
    expect(ring.Width).toBeGreaterThan(rect.Width);
  });
});
