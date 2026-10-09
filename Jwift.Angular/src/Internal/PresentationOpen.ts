import { Injectable, computed, signal } from '@angular/core';

/**
 * Every `<popover>` and `<glass-dropdown>` on screen, app-wide (Drill Sentences lane AF1, item 1: a round 30
 * blind desktop tester's "Shift-click to add squads" tip drew ON TOP of the selection capsule's own "…" menu,
 * 23_chip_menu.png — the capsule's menu opens through `<popover>`, exactly like every other menu in the app,
 * but nothing outside `Popover` itself ever heard that it had opened, so `EditorStore.PopoverOpen`, which gates
 * every editor tip, never counted it). `SheetStack` (`Sheet.ts`) already solves this for sheets the same way;
 * this is its twin for the OTHER two floating presentations, so "is something presented" is ONE signal
 * `Popover`/`GlassDropdown` publish themselves to, never a parallel flag a future menu kind has to remember to
 * wire up by hand the way the capsule's own never was.
 */
@Injectable({ providedIn: 'root' })
export class PresentationStack {
  private readonly _open = signal<readonly object[]>([]);
  /** A popover or glass dropdown stands open somewhere, app-wide. */
  readonly HasOpen = computed(() => this._open().length > 0);
  Add(presentation: object): void { this._open.update((open) => [...open, presentation]); }
  Remove(presentation: object): void { this._open.update((open) => open.filter((p) => p !== presentation)); }
}
