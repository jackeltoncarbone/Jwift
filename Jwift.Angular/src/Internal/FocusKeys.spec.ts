import { describe, expect, it } from 'vitest';
import { IsActivationKey, IsEscapeKey } from './FocusKeys';

describe('IsActivationKey', () => {
  it('Space and Return both activate', () => {
    expect(IsActivationKey(' ')).toBe(true);
    expect(IsActivationKey('Enter')).toBe(true);
  });

  it('nothing else does, including a lookalike key name', () => {
    expect(IsActivationKey('Spacebar')).toBe(false);
    expect(IsActivationKey('Tab')).toBe(false);
    expect(IsActivationKey('Escape')).toBe(false);
    expect(IsActivationKey('a')).toBe(false);
  });
});

describe('IsEscapeKey', () => {
  it('Escape leaves the focused control', () => {
    expect(IsEscapeKey('Escape')).toBe(true);
  });

  it('nothing else does', () => {
    expect(IsEscapeKey('Esc')).toBe(false);
    expect(IsEscapeKey('Enter')).toBe(false);
    expect(IsEscapeKey(' ')).toBe(false);
  });
});
