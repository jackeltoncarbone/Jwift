import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EndsPress, SwallowPress } from './Popover.OutsidePress';

// Drill Sentences lane BB2, item 3 (a blind phone tester): a tap meant to close the count picker opened a
// different row's "•••" menu, the one under the finger. Like iOS, the press that closes a popover does
// nothing else: everything it sends stops at the document, from its down to the click after it lifts.

/** An event of `type` carrying `fields` (a pointer's id and type, a touch list), cancelable like the real one. */
const event = (type: string, fields: Record<string, unknown> = {}): Event => Object.assign(new Event(type, { cancelable: true }), fields);
const pointer = (type: string, pointerId: number, pointerType: string): PointerEvent =>
  event(type, { pointerId, pointerType }) as PointerEvent;

describe('SwallowPress: the press that closes a popover reaches nothing else', () => {
  let doc: Document;
  let heard: string[];
  const listen = (): void => {
    for (const kind of ['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
      doc.addEventListener(kind, (e) => heard.push(e.type), true);
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
    doc = new EventTarget() as unknown as Document;
    heard = [];
  });
  afterEach(() => vi.useRealTimers());

  it('a finger: its touches and the click a browser makes of them stop at the document, then the next press goes through', () => {
    const down = pointer('pointerdown', 7, 'touch');
    SwallowPress(doc, down);
    expect(down.defaultPrevented).toBe(true);
    listen(); // what lies under the popover (the canvas, another row's "•••") listens after it.
    const start = event('touchstart', { touches: [{}] });
    doc.dispatchEvent(start);
    doc.dispatchEvent(pointer('pointerup', 7, 'touch'));
    const end = event('touchend', { touches: [] });
    doc.dispatchEvent(end);
    doc.dispatchEvent(event('click'));
    expect(heard).toEqual([]);
    expect(start.defaultPrevented).toBe(true); // no scroll, and no click made of it.
    doc.dispatchEvent(pointer('pointerdown', 8, 'touch'));
    expect(heard).toEqual(['pointerdown']);
  });

  it('a mouse: its up and its click stop too; nothing after the click is held back', () => {
    SwallowPress(doc, pointer('pointerdown', 1, 'mouse'));
    listen();
    doc.dispatchEvent(pointer('pointerup', 1, 'mouse'));
    doc.dispatchEvent(event('click'));
    expect(heard).toEqual([]);
    doc.dispatchEvent(pointer('pointerdown', 1, 'mouse'));
    expect(heard).toEqual(['pointerdown']);
  });

  it('a press whose click never comes lets go a moment after it lifts', () => {
    SwallowPress(doc, pointer('pointerdown', 1, 'mouse'));
    listen();
    doc.dispatchEvent(pointer('pointerup', 1, 'mouse'));
    vi.advanceTimersByTime(400);
    doc.dispatchEvent(pointer('pointerdown', 1, 'mouse'));
    expect(heard).toEqual(['pointerdown']);
  });

  it('a touch ends with its last finger, not with the pointer events that run ahead of it', () => {
    const down = { pointerId: 7, pointerType: 'touch' };
    expect(EndsPress(down, pointer('pointerup', 7, 'touch'))).toBe(false);
    expect(EndsPress(down, event('touchend', { touches: [{}] }))).toBe(false);
    expect(EndsPress(down, event('touchend', { touches: [] }))).toBe(true);
    expect(EndsPress({ pointerId: 1, pointerType: 'mouse' }, pointer('pointerup', 1, 'mouse'))).toBe(true);
    expect(EndsPress({ pointerId: 1, pointerType: 'mouse' }, pointer('pointerup', 2, 'mouse'))).toBe(false);
  });
});
