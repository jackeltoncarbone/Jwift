import { describe, expect, it } from 'vitest';
import { EscapeStep } from './GlassDropdown.Escape';

// Drill Sentences lane HH1, item 2 (a round 12 blind desktop tester opened the toolbar's "9 problems" and pressed Escape:
// the button vanished and an empty glass shell stayed).

describe('EscapeStep: Escape closes a dropdown from the page it opened onto', () => {
  it('the problems pill, opened straight onto its one page: Escape closes it rather than leave it open on no rows', () => {
    expect(EscapeStep('warnings', 'warnings')).toBe('Close');
  });

  it('the account menu, opened at its root: a page pushed from the root steps back to it, then Escape closes', () => {
    expect(EscapeStep('appearance', null)).toEqual({ Page: null });
    expect(EscapeStep(null, null)).toBe('Close');
  });

  it('a page pushed past the page an open began on steps back to that page, never past it to an empty root', () => {
    expect(EscapeStep('detail', 'warnings')).toEqual({ Page: 'warnings' });
  });
});
