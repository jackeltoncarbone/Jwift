import { describe, expect, it } from 'vitest';
import { FocusableBoxStyle } from './FocusableBox';

describe('FocusableBoxStyle', () => {
  it('a focusable host gets a real, rendered 1x1 box — never display: contents, which Chrome\'s sequential focus navigation skips even with tabIndex set', () => {
    const style = FocusableBoxStyle(true);
    expect(style).not.toBeNull();
    expect(style?.display).not.toBe('contents');
    expect(style?.position).toBe('fixed'); // out of the page's own flow; nothing else shifts.
    expect(style?.width).toBe('1px');
    expect(style?.height).toBe('1px');
    expect(style?.overflow).toBe('hidden');
  });

  it('a non-focusable host gets no override at all — null means "clear everything, fall back to the component\'s own authored display: contents"', () => {
    expect(FocusableBoxStyle(false)).toBeNull();
  });
});
