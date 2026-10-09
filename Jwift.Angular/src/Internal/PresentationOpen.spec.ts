import { describe, expect, it } from 'vitest';
import { PresentationStack } from './PresentationOpen';

/**
 * Drill Sentences lane AF1, item 1: `PresentationStack` is the one thing `Popover` and `GlassDropdown` register
 * themselves against while open, so a consumer asking "is anything presented" (`EditorStore.PopoverOpen`) reads
 * one signal instead of each menu kind wiring its own. No Angular DI needed here — the class takes nothing from
 * the injector, so a plain `new` proves the logic exactly as `SheetStack`'s own shape would.
 */
describe('PresentationStack: one signal for every popover and glass dropdown open at once', () => {
  it('starts with nothing open', () => {
    expect(new PresentationStack().HasOpen()).toBe(false);
  });

  it('one registered presentation makes HasOpen true; removing it makes it false again', () => {
    const stack = new PresentationStack();
    const token = {};
    stack.Add(token);
    expect(stack.HasOpen()).toBe(true);
    stack.Remove(token);
    expect(stack.HasOpen()).toBe(false);
  });

  it('two at once: HasOpen stays true until the LAST one is removed', () => {
    const stack = new PresentationStack();
    const a = {}, b = {};
    stack.Add(a);
    stack.Add(b);
    expect(stack.HasOpen()).toBe(true);
    stack.Remove(a);
    expect(stack.HasOpen()).toBe(true);
    stack.Remove(b);
    expect(stack.HasOpen()).toBe(false);
  });

  it('removing something never added, or removing it twice, is a no-op rather than going negative', () => {
    const stack = new PresentationStack();
    const token = {};
    stack.Remove(token);
    expect(stack.HasOpen()).toBe(false);
    stack.Add(token);
    stack.Remove(token);
    stack.Remove(token);
    expect(stack.HasOpen()).toBe(false);
  });
});
