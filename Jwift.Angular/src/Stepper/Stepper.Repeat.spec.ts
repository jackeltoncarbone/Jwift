import { describe, expect, it } from 'vitest';
import {
  IsNewPress, NextRepeatDelayMs, SimulatePressBumpOffsets,
  REPEAT_DELAY_MS, REPEAT_FAST_AFTER_MS,
} from './Stepper.Repeat';

/**
 * Drill Sentences lane AI1. My own live check: desktop, pressing and holding "−" for 1.5s stepped only
 * once (blind32-desktop/13a..13c); phone, the tester's 4 quick taps went 16 -> 4, three steps per tap
 * (blind32-phone/27-after-minus4.png), where my own 1s-spaced taps stepped once each. `Stepper.ts` had no
 * repeat at all (the desktop half) and bumped once on `pointerup` with a `click`/`pointerId` dedupe that
 * a FAST, repeated tap could outrun (the phone half). The fix moves the bump to press-DOWN (Apple's own
 * `UIStepper`: immediate feedback, never waiting on lift) and schedules the repeat chain this file models.
 */
describe('IsNewPress: a press-start opens a gesture only once', () => {
  it('opens when nothing is active yet', () => {
    expect(IsNewPress(false)).toBe(true);
  });

  it('a second start for the SAME still-open gesture never reopens it -- pointerdown then a compat mousedown', () => {
    expect(IsNewPress(true)).toBe(false);
  });
});

describe('NextRepeatDelayMs: the wait before the next repeat, given how long the press has already stood', () => {
  it('right after the press-down bump, waits out the FULL initial delay', () => {
    expect(NextRepeatDelayMs(0)).toBe(REPEAT_DELAY_MS);
  });

  it('partway through the initial delay, waits only what is left of it', () => {
    expect(NextRepeatDelayMs(150)).toBe(REPEAT_DELAY_MS - 150);
  });

  it('once the delay has fully elapsed, repeats at the plain interval', () => {
    expect(NextRepeatDelayMs(REPEAT_DELAY_MS)).toBe(100);
    expect(NextRepeatDelayMs(900)).toBe(100);
  });

  it('once the hold has stood a full second, repeats faster', () => {
    expect(NextRepeatDelayMs(REPEAT_FAST_AFTER_MS)).toBe(50);
    expect(NextRepeatDelayMs(1400)).toBe(50);
  });
});

describe('SimulatePressBumpOffsets: what a real press-and-hold actually bumps, and when', () => {
  it('a tap released before the repeat delay elapses bumps exactly once -- Apple\'s "a tap is one step"', () => {
    expect(SimulatePressBumpOffsets(100)).toEqual([0]);
    expect(SimulatePressBumpOffsets(REPEAT_DELAY_MS - 1)).toEqual([0]);
  });

  it('released between two scheduled repeats never gets the one it did not stand long enough to reach', () => {
    // Held 50ms past the first held repeat (400): the SECOND would land at 500, so release at 450 must
    // stop at exactly two bumps, never three -- "no step after release" holds mid-hold too, not only
    // at a tap's own single bump.
    expect(SimulatePressBumpOffsets(REPEAT_DELAY_MS + 50)).toEqual([0, REPEAT_DELAY_MS]);
  });

  it('a 1.5s hold steps SEVERAL times, accelerating past the one-second mark', () => {
    const offsets = SimulatePressBumpOffsets(1500);
    // 0 (down), 400 (the first held repeat), then every 100ms to 1000, then every 50ms to 1500: several,
    // not the one step the live desktop regression showed for the same 1.5s hold.
    expect(offsets).toEqual([0, 400, 500, 600, 700, 800, 900, 1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500]);
    expect(offsets.length).toBeGreaterThan(10);
    // Every bump after the first lands within a held press -- none of them is scheduled PAST the release.
    expect(offsets.every((o) => o <= 1500)).toBe(true);
  });
});

/**
 * `Stepper.ts`'s `_onPressStart`/`_onPressEnd`/`_onSegClick` wiring, reduced to the one `IsNewPress`
 * gate each actually checks, run against a REALISTIC event order for one physical touch: `pointerdown`,
 * a compat `mousedown` the SAME finger landing can also raise, the engine's own synthesized `click`
 * (which fires before the matching `pointerup`, this file's own top doc comment), then `pointerup` and
 * a trailing compat `mouseup` — the exact mix the task's own regression named. A gesture simulated this
 * way, not a live component (no `<jaui>` canvas in this harness, the same limit every other Jwift spec
 * here already works under), but the SAME boolean gate every one of `Stepper.ts`'s five handlers reads.
 */
describe('a tap collapses to exactly one step under a realistic touch event sequence', () => {
  it('pointerdown, compat mousedown, click (before pointerup), pointerup, compat mouseup -- one bump', () => {
    let open = false;
    let bumps = 0;
    const start = (): void => { if (IsNewPress(open)) { open = true; bumps++; } };
    const end = (): void => { if (!IsNewPress(open)) open = false; };
    const click = (): void => { if (IsNewPress(open)) bumps++; };

    start(); // pointerdown
    start(); // the compat mousedown the SAME tap can also raise
    click(); // the engine's own synthesized click, before the matching pointerup
    end(); // pointerup
    end(); // a trailing compat mouseup

    expect(bumps).toBe(1);
  });

  it('a bare click with no press behind it at all (keyboard Enter/Space) still bumps -- it has no OTHER way in', () => {
    const open = false;
    expect(IsNewPress(open)).toBe(true); // `_onSegClick`'s own guard: nothing open, so this one counts.
  });
});
