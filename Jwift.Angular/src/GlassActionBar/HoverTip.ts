import { signal } from '@angular/core';

/** How long a resting mouse waits on a cell before its tip shows: AppKit's own tooltip delay is about
 *  this, long enough that sweeping across the bar never flashes a tip, short enough to read as an answer. */
export const HOVER_TIP_DELAY_MS = 450;

/** How long after a real mouse move a cell has to report the pointer still over it. The cell's own
 *  `pointermove` is Jaui's bridged copy, a round trip through the render worker behind the real one, so
 *  this is a few frames of that latency, never a visible lag on its own. */
export const HOVER_TIP_LEAVE_MS = 150;

/**
 * THE TOOLBAR'S HOVER TIPS (Drill Sentences lane X2, item 7: "the top-right toolbar icons are unlabeled
 * glyphs"). Which icon cell, if any, a desktop mouse has rested on long enough to name: AppKit's tooltip
 * rule, `HOVER_TIP_DELAY_MS` of rest before the first tip, then straight from one cell's tip to the next
 * while the pointer slides along the bar, gone on a press or as soon as the pointer leaves. Touch never shows
 * a tip (a finger has no hover).
 *
 * A Jaui cell only ever hears a `pointermove` (its bridged copy, dispatched on whichever jiv the worker
 * hit); nothing tells it the pointer LEFT. So the window's own real moves (`isTrusted`, never a bridged
 * copy) are the clock: a real move after which no cell reports the pointer within `HOVER_TIP_LEAVE_MS`
 * means it is over none of them.
 *
 * A TIP THAT WENT STAYS GONE (Drill Sentences lane JJ1, item 5; a round 14 blind desktop tester: after Undo, by
 * the button and by Ctrl+Z, "Undo the last edit" stayed up over the selection pill and Clear). Ctrl+Z is no
 * press, so nothing hid the tip at all; and a click whose mouse moved a hair while the button was down let the
 * leave clock run without the cell's own reports (those wait for the button to come up), so the bar forgot
 * the pointer was there and, once it was up, armed the tip afresh. A press, a key, or the app saying something
 * (`Quiet`) hides the tip and quiets the cell under the pointer; it shows again only after the pointer has left
 * that cell and rested on one anew. A press in progress never reads as the pointer leaving.
 */
export class HoverTip {
  /** The cell id whose tip shows now, or null. */
  readonly Shown = signal<string | null>(null);

  /** The cell the pointer is over, as of its last report. */
  private _over: string | null = null;
  private _overAt = 0;
  /** The cell a press, a key or a notice quieted (`Quiet`): no tip of its own until the pointer leaves it. */
  private _quiet: string | null = null;
  private _showTimer = 0;
  private _leaveTimer = 0;
  private readonly _window: Window | null = typeof window !== 'undefined' ? window : null;

  constructor() {
    this._window?.addEventListener('pointermove', this._onRealMove, true);
    this._window?.addEventListener('pointerdown', this._onRealPress, true);
    this._window?.addEventListener('keydown', this._onRealKey, true);
    this._window?.document.documentElement.addEventListener('pointerleave', this._onLeaveWindow);
  }

  /** A cell heard the pointer over it (its own `(pointermove)`). */
  Over(id: string, e: PointerEvent): void {
    if (e.pointerType !== 'mouse' || e.buttons !== 0) return;
    this._overAt = performance.now();
    // The cell a press, a key or a notice quieted stays quiet while the pointer is still on it.
    if (this._quiet === id) { this._over = id; return; }
    this._quiet = null;
    // Still on the same cell: its tip is armed or showing already.
    if (this._over === id) return;
    this._over = id;
    this._clearShowTimer();
    // Already showing a tip: slide straight to this one, the way a menu bar's tips follow the pointer.
    if (this.Shown() !== null) { this.Shown.set(id); return; }
    this._showTimer = window.setTimeout(() => {
      this._showTimer = 0;
      if (this._over === id) this.Shown.set(id);
    }, HOVER_TIP_DELAY_MS);
  }

  /** Clears the tip and forgets the cell: the pointer left the bar, or the bar went away under it. */
  Hide(): void {
    this._over = null;
    this._quiet = null;
    this._clearShowTimer();
    if (this.Shown() !== null) this.Shown.set(null);
  }

  /** Clears the tip and quiets the cell under the pointer: a press, a key, or the app saying something over the
   *  tip's place (a notice, lane JJ1, item 5). The tip shows again only after a fresh rest on a cell. */
  Quiet(): void {
    this._quiet = this._over;
    this._clearShowTimer();
    if (this.Shown() !== null) this.Shown.set(null);
  }

  Dispose(): void {
    this.Hide();
    if (this._leaveTimer) this._window?.clearTimeout(this._leaveTimer);
    this._window?.removeEventListener('pointermove', this._onRealMove, true);
    this._window?.removeEventListener('pointerdown', this._onRealPress, true);
    this._window?.removeEventListener('keydown', this._onRealKey, true);
    this._window?.document.documentElement.removeEventListener('pointerleave', this._onLeaveWindow);
  }

  /** A real move with no button down: unless a cell reports the pointer soon after, it has left them all. A move
   *  with a button down is a press still in progress, whose cell hears nothing until it comes up. */
  private readonly _onRealMove = (e: PointerEvent): void => {
    if (!e.isTrusted || e.buttons !== 0 || this._over === null || this._leaveTimer) return;
    const at = performance.now();
    this._leaveTimer = window.setTimeout(() => {
      this._leaveTimer = 0;
      if (this._overAt < at) this.Hide();
    }, HOVER_TIP_LEAVE_MS);
  };

  private readonly _onRealPress = (e: PointerEvent): void => {
    if (e.isTrusted) this.Quiet();
  };

  /** A key (Ctrl+Z among them) acts without a press, and the tip it leaves would cover what it changed. */
  private readonly _onRealKey = (e: KeyboardEvent): void => {
    if (e.isTrusted) this.Quiet();
  };

  private readonly _onLeaveWindow = (): void => this.Hide();

  private _clearShowTimer(): void {
    if (this._showTimer) window.clearTimeout(this._showTimer);
    this._showTimer = 0;
  }
}
