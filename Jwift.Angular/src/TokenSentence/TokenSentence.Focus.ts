/**
 * Pure logic for `<token-sentence>`'s own ROVING focus — no Angular, no jaui imports, same contract as
 * `TokenSentence.Layout.ts` beside it, cheap to unit test with synthetic rects.
 *
 * Drill Sentences lane AG2 (blind round 31 desktop, `54_tab10.png`): ten Tabs in a row never reached the
 * list's own editable words, the "+" or a row's own "…" — Tab already stops once PER SENTENCE (lane
 * AB2's own `Jwift_TokenSentence { Interactive: true }`), but nothing INSIDE a focused sentence was ever
 * itself a real DOM focusable, so there was nowhere further for the keyboard to go. macOS answers this
 * the way a toolbar or a segmented control does — ONE Tab stop, a ring that ROVES across its own pieces
 * on Left/Right, Return/Space activating whichever piece the ring is on. `TokenSentence.ts` owns the
 * Angular wiring (the keydown listener, the ring's own template entry); this file owns the three
 * decisions that wiring makes, each one plain arithmetic over a list of keys or rects:
 *
 *   - which of a sentence's tokens are even stops at all (`FocusableTokenKeys`);
 *   - where Left/Right moves among them, wrapping at either end (`MoveRovingIndex`);
 *   - where Up/Down lands in a NEIGHBOURING sentence — "keeping the nearest token" — once
 *     `TokenSentence.ts`'s own DOM walk has found which row that neighbour even is
 *     (`NearestIndexByCenter`, `CenterXOf`);
 *   - the ring's own rect, concentric with whatever it rings (`FocusRingRectFor`, the same
 *     "control's rect plus the gap" formula `FocusRing.Geometry.ts`'s `FocusRingGeometryOf` already
 *     states for the whole-host ring, read here as a plain rect expansion instead of an Attach inset,
 *     because every OTHER piece of this sentence is already a `Position: Placed` rect in the SAME
 *     canvas-local coordinate space — see `TokenSentence.ts`'s own `_rect()`).
 */

import { FOCUS_RING_GAP_PT } from '../Internal/FocusRing.Geometry';
import { IsTappable, type SentenceToken } from './TokenSentence.Layout';

/** A plain axis-aligned rect in the sentence's own canvas-local coordinates — the same shape every
 *  other piece of this file's sibling (`TokenSentence.Layout.ts`'s `SentenceHit`/`SentenceAddBox`)
 *  already carries, named fresh here since neither of those carries a `TokenIndex` this file has any
 *  use for. */
export interface FocusRect {
  readonly X: number;
  readonly Y: number;
  readonly Width: number;
  readonly Height: number;
}

/**
 * The roving ring's own stops, in order: every tappable token (`IsTappable`, the same gate
 * `TokenSentence.Layout.ts` already hit-tests by), then the "+" (`'+'`, `TokenSentence.ts`'s own
 * convention for it everywhere else — `AnchorOf`, `_hitAt`) when this sentence shows one. A Badge or a
 * plain Text/Quiet run is never a stop — neither one opens anything a Return/Space could activate.
 */
export function FocusableTokenKeys(tokens: readonly SentenceToken[], showAdd: boolean): readonly string[] {
  const keys = tokens.filter((t) => IsTappable(t.Kind)).map((t) => t.Key);
  return showAdd ? [...keys, '+'] : keys;
}

/**
 * Left/Right's own wrap rule: `current` null (nothing roving yet — the sentence just took focus) lands
 * on the leading stop for `'Right'` and the trailing one for `'Left'`, the same "arrow toward where you'd
 * naturally start reading from" convention a fresh toolbar or segmented control picks its first stop
 * with. Past either end it wraps rather than standing still, same as Tab/Shift-Tab across the whole
 * page already do. `null` only when `count` is zero — a sentence with nothing to rove over at all.
 */
export function MoveRovingIndex(count: number, current: number | null, direction: 'Left' | 'Right'): number | null {
  if (count <= 0) return null;
  if (current === null) return direction === 'Right' ? 0 : count - 1;
  const next = direction === 'Right' ? current + 1 : current - 1;
  if (next < 0) return count - 1;
  if (next >= count) return 0;
  return next;
}

/** A rect's own horizontal center — what Up/Down hands off between two sentences so the SECOND one can
 *  pick up "the nearest token" rather than always resetting to its own first stop. */
export function CenterXOf(rect: FocusRect): number {
  return rect.X + rect.Width / 2;
}

/**
 * Up/Down's own "keeping the nearest token" rule, once `TokenSentence.ts`'s own DOM walk has already
 * decided WHICH neighbouring sentence to land in (a real DOM question — the next/previous `<token-
 * sentence>` in document order — this file never touches a document, so that half lives there, not
 * here): of that neighbour's own stops, `centers` (each one's `CenterXOf`, in a coordinate space BOTH
 * sentences agree on — `TokenSentence.ts` adds/subtracts each one's own `Node.X` before calling this),
 * the one whose center sits closest to `x` wins; an exact tie keeps the EARLIER index, the same
 * left-biased tie-break a greedy nearest-match naturally falls into by scanning in order and only
 * replacing the best on a STRICTLY smaller distance. `null` only when the neighbour has no stops of
 * its own at all (a caption-only row with no tappable word and no "+").
 */
export function NearestIndexByCenter(centers: readonly number[], x: number): number | null {
  if (centers.length === 0) return null;
  let best = 0;
  let bestDist = Math.abs(centers[0] - x);
  for (let i = 1; i < centers.length; i++) {
    const dist = Math.abs(centers[i] - x);
    if (dist < bestDist) { best = i; bestDist = dist; }
  }
  return best;
}

/**
 * The ring's own rect: `rect` expanded by `gap` on every side — "the ring rect equals the token rect
 * plus the gap," the identical relationship `FocusRing.Geometry.ts`'s `FocusRingGeometryOf` already
 * states for the whole-host ring (`AttachInsetPt`, the gap's negative, read there through Jaui's
 * Attach/Fill math instead of plain rect arithmetic — the SAME gap, `FOCUS_RING_GAP_PT`, read the one
 * way here since a roving token's ring is one more `Position: Placed` piece among this sentence's own
 * pills and underlines, never an Attach child of a moving target the way the whole-host ring is). `gap`
 * defaults to the system one so a caller never needs to import the constant just to pass it back.
 */
export function FocusRingRectFor(rect: FocusRect, gap: number = FOCUS_RING_GAP_PT): FocusRect {
  return { X: rect.X - gap, Y: rect.Y - gap, Width: rect.Width + 2 * gap, Height: rect.Height + 2 * gap };
}
