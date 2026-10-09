import { describe, expect, it } from 'vitest';
import { IsActivationKey, IsEscapeKey } from './Keys';

// Drill Sentences lane HH1, item 3 (a round 12 blind tester: Escape did not close the count wheel). The coordinator's
// Escape carried key, code and keyCode 27 and closed it; the tester's carried `key: 'Escape'`, keyCode 0 and no code,
// the shape a synthesized key event takes. Escape is read from what the key means, never from a number.

describe('IsEscapeKey: Escape however it arrives', () => {
  it('a key event with no keyCode at all (DevTools protocol: key only, windowsVirtualKeyCode 0, no text)', () => {
    expect(IsEscapeKey({ key: 'Escape', code: '' })).toBe(true);
    expect(IsEscapeKey(Object.assign({ key: 'Escape', code: '' }, { keyCode: 0, which: 0 }))).toBe(true);
  });

  it('a whole hardware key event (key, code and keyCode 27)', () => {
    expect(IsEscapeKey(Object.assign({ key: 'Escape', code: 'Escape' }, { keyCode: 27 }))).toBe(true);
  });

  it('the older "Esc" spelling, and a physical Escape whose meaning is unidentified', () => {
    expect(IsEscapeKey({ key: 'Esc' })).toBe(true);
    expect(IsEscapeKey({ key: 'Unidentified', code: 'Escape' })).toBe(true);
  });

  it('a 27 alone is not Escape, and no other key is', () => {
    expect(IsEscapeKey(Object.assign({ key: 'a', code: 'KeyA' }, { keyCode: 27 }))).toBe(false);
    expect(IsEscapeKey({ key: 'Enter', code: 'Enter' })).toBe(false);
    expect(IsEscapeKey({})).toBe(false);
  });
});

describe('IsActivationKey: Space and Return, however either arrives', () => {
  it('Space, by key or by code', () => {
    expect(IsActivationKey({ key: ' ', code: 'Space' })).toBe(true);
    expect(IsActivationKey({ key: 'Unidentified', code: 'Space' })).toBe(true);
    expect(IsActivationKey({ key: 'Spacebar' })).toBe(true); // the old IE spelling
  });

  it('Return/Enter, by key or by code', () => {
    expect(IsActivationKey({ key: 'Enter', code: 'Enter' })).toBe(true);
    expect(IsActivationKey({ key: 'Unidentified', code: 'Enter' })).toBe(true);
    expect(IsActivationKey({ key: 'Unidentified', code: 'NumpadEnter' })).toBe(true);
  });

  // Drill Sentences lane AB2c (blind round 29, desktop: the problems badge showed its ring but Return
  // never activated it, 29-return-on-badge.png). Traced to the blind-test harness itself:
  // `cdplib.mjs`'s `keyPress` sends `Input.dispatchKeyEvent` with `key: 'Return'` verbatim — CDP does
  // not translate that to the DOM spec's own `'Enter'` — the exact class of gap `IsEscapeKey`'s own
  // "Esc" already covers, now hitting the key macOS itself labels "return".
  it('"Return" activates too — the blind-test harness\'s own CDP key name for this key, never translated to the DOM spec\'s "Enter"', () => {
    expect(IsActivationKey({ key: 'Return' })).toBe(true);
  });

  it('nothing else activates, including a lookalike or a bare synthesized event with neither field set', () => {
    expect(IsActivationKey({ key: 'Escape' })).toBe(false);
    expect(IsActivationKey({ key: 'Tab' })).toBe(false);
    expect(IsActivationKey({ key: 'a', code: 'KeyA' })).toBe(false);
    expect(IsActivationKey({})).toBe(false);
  });
});
