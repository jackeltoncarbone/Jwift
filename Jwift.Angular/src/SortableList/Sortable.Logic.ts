/** Pure math for `<sortable-list>`'s long-press drag — no Angular, no jaui. */

export type SortableEntryKind = 'Row' | 'SectionHeader';

/** One entry in the list's flat VISIBLE order — a row, or a section header. Folded sections
 *  contribute only their header (the consumer renders rows only while `Open`), so this list is
 *  already what a finger can see and target. */
export interface SortableEntry {
  readonly Id: string;
  readonly Kind: SortableEntryKind;
  /** Layout top, excluding VisualTranslate (the engine's own "ignore the paint offset" rule). */
  readonly Y: number;
  readonly Height: number;
  /** A row's section (null = top-level). A SectionHeader's OWN id. */
  readonly SectionId: string | null;
  /** SectionHeader only. */
  readonly SectionOpen?: boolean;
}

export interface SortableTarget {
  /** Index into `entries` the lifted item would land BEFORE (== entries.length = the tail). */
  readonly Index: number;
  /** Non-null when the drop goes INTO a folded section rather than between two flat slots. */
  readonly IntoSection: string | null;
}

/** Where a lifted entry (`liftedId`) would land if released with the finger at `fingerY`.
 *
 * - Over a folded section's header (not the lifted entry itself): drop INTO it.
 * - Otherwise: before the first entry whose midpoint is below the finger — the tail when none is.
 * - A lifted SECTION HEADER can only target top-level slots (between other sections, or inside the
 *   top-level row run), never a slot inside another section's open body.
 */
export function Target(entries: readonly SortableEntry[], liftedId: string, fingerY: number): SortableTarget {
  for (const e of entries) {
    if (e.Id === liftedId) continue;
    if (e.Kind === 'SectionHeader' && e.SectionOpen === false
        && fingerY >= e.Y && fingerY < e.Y + e.Height) {
      return { Index: entries.indexOf(e), IntoSection: e.SectionId };
    }
  }

  // The plain midpoint rule already lands a finger past an open section's last row at that section's
  // tail with no special case: once the finger passes the last row's own midpoint, THAT row stops
  // matching and whatever comes next (a following top-level entry, or nothing — the absolute tail)
  // is what the insertion point lands before, which IS "after the section's last row".
  const liftedIsSection = entries.find((e) => e.Id === liftedId)?.Kind === 'SectionHeader';
  for (const e of entries) {
    if (e.Id === liftedId) continue;
    if (liftedIsSection && e.Kind === 'Row' && e.SectionId !== null) continue; // inside someone else's section
    const mid = e.Y + e.Height / 2;
    if (fingerY < mid) return { Index: entries.indexOf(e), IntoSection: null };
  }
  return { Index: entries.length, IntoSection: null };
}

/** The per-entry VisualTranslate Y every entry between the drag's origin and its current target
 *  carries, so the gap the lifted entry left (and the one it is about to open) both read as real
 *  space before the drop lands. `targetIndex` is `Target`'s own: the slot BEFORE `order[targetIndex]`
 *  (`order.length`, the tail). Entries the lifted one passes (exclusive of the lifted one, which the
 *  caller positions itself) shift by `liftedHeight + gap` AWAY from where the lifted entry is headed.
 *  Everything else is 0.
 *
 *  Drill Sentences lane PP1, item 1b (a round 20 blind phone tester dropped 7a above "1-4" and the two rows
 *  were drawn over each other): moving down, the entry AT the target slot was shifted up too, though the lifted
 *  entry lands before it, so two entries were given one slot. Moving down passes `origin + 1 .. target - 1`. */
export function Shifts(
  order: readonly string[],
  originIndex: number,
  targetIndex: number,
  liftedHeight: number,
  gap = 2,
): ReadonlyMap<string, number> {
  const out = new Map<string, number>();
  if (!IsMove(originIndex, targetIndex)) return out;
  const amount = liftedHeight + gap;
  if (targetIndex > originIndex) {
    for (let i = originIndex + 1; i < Math.min(targetIndex, order.length); i++) out.set(order[i], -amount);
  } else {
    for (let i = targetIndex; i < originIndex; i++) out.set(order[i], amount);
  }
  return out;
}

/** Whether a drop at `targetIndex` (`Target`'s slot, before that entry) moves the entry lifted from
 *  `originIndex` at all: its own slot and the one just after it both leave it where it stood. */
export const IsMove = (originIndex: number, targetIndex: number): boolean =>
  targetIndex !== originIndex && targetIndex !== originIndex + 1;

/** How long a touch holds still on a row before the row lifts, ms (Drill Sentences lane PP1, item 1d: a round 20
 *  blind phone tester long pressed 5a's who word to open it and lifted a row instead). Long enough that a finger
 *  resting on a word while it reads never lifts; a press on a word never lifts at all (`LiftStart`). */
export const TOUCH_HOLD_MS = 500;

/** How long a lift stands with no move before it lets go and puts the list back, ms (lane PP1, item 1a: a lift
 *  whose release never arrived kept every other row hidden). */
export const LIFT_IDLE_MS = 2000;

/** How a press on a row starts a lift (lane PP1, item 1d): a mouse lifts once it drags (`Drag`); a finger or a pen
 *  lifts after a still hold (`Hold`, `TOUCH_HOLD_MS`), never from a press a word or control inside the row took for
 *  itself (`onControl`, a token's own press: that one opens the token's control on release). */
export function LiftStart(pointerType: string, onControl: boolean): 'Drag' | 'Hold' | 'None' {
  if (pointerType !== 'touch' && pointerType !== 'pen') return 'Drag';
  return onControl ? 'None' : 'Hold';
}

/** Whether a lift last moved at `lastMoveAt` has stood still long enough to let go (`LIFT_IDLE_MS`). */
export const LiftIdle = (lastMoveAt: number, now: number): boolean => now - lastMoveAt >= LIFT_IDLE_MS;

/** `Node.DOCUMENT_POSITION_FOLLOWING`, spelled out so this file still loads where there is no DOM. */
const DOCUMENT_POSITION_FOLLOWING = 4;

/** `items` in document order of their host elements (lane PP1, item 1b). A list reorders its rows by moving their
 *  elements (Angular's `@for` keeps each row and moves it), so registration order goes stale after the first drop;
 *  the document never does. An item with no connected host keeps its place after every connected one. */
export function DomOrdered<T>(items: readonly T[], hostOf: (item: T) => Element | null | undefined): T[] {
  const connected: { Item: T; Host: Element }[] = [];
  const rest: T[] = [];
  for (const item of items) {
    const host = hostOf(item);
    if (host?.isConnected) connected.push({ Item: item, Host: host });
    else rest.push(item);
  }
  connected.sort((a, b) => (a.Host === b.Host ? 0
    : a.Host.compareDocumentPosition(b.Host) & DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  return [...connected.map((c) => c.Item), ...rest];
}

/** The item whose host holds `target`, the innermost when hosts nest (a row inside an open section's own host), or
 *  null (lane PP1, item 1: the press is read off the element it landed on, never off rects that may be a scroll
 *  behind, which lifted 7a for a finger on 5a). */
export function ItemHolding<T>(items: readonly T[], hostOf: (item: T) => Element | null | undefined, target: Node | null): T | null {
  if (!target) return null;
  let best: { Item: T; Host: Element } | null = null;
  for (const item of items) {
    const host = hostOf(item);
    if (!host || !host.contains(target)) continue;
    if (!best || best.Host.contains(host)) best = { Item: item, Host: host };
  }
  return best?.Item ?? null;
}

/** Autoscroll speed (px/frame) once the finger is within 70px of the scroller's top or 40px of its
 *  bottom — 0 in the dead zone between. */
export function AutoscrollVelocity(fingerY: number, scrollerTop: number, scrollerBottom: number): number {
  if (fingerY < scrollerTop + 70) return -Math.min(14, (scrollerTop + 70 - fingerY) / 4);
  if (fingerY > scrollerBottom - 40) return Math.min(14, (fingerY - scrollerBottom + 40) / 4);
  return 0;
}
