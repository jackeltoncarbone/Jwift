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
 *  space before the drop lands. Entries between origin and target (exclusive of the lifted one, which
 *  the caller positions itself) shift by `liftedHeight + gap` AWAY from where the lifted entry is
 *  headed. Everything else is 0. */
export function Shifts(
  order: readonly string[],
  originIndex: number,
  targetIndex: number,
  liftedHeight: number,
  gap = 2,
): ReadonlyMap<string, number> {
  const out = new Map<string, number>();
  if (originIndex === targetIndex) return out;
  const amount = liftedHeight + gap;
  if (targetIndex > originIndex) {
    for (let i = originIndex + 1; i <= targetIndex; i++) out.set(order[i], -amount);
  } else {
    for (let i = targetIndex; i < originIndex; i++) out.set(order[i], amount);
  }
  return out;
}

/** Autoscroll speed (px/frame) once the finger is within 70px of the scroller's top or 40px of its
 *  bottom — 0 in the dead zone between. */
export function AutoscrollVelocity(fingerY: number, scrollerTop: number, scrollerBottom: number): number {
  if (fingerY < scrollerTop + 70) return -Math.min(14, (scrollerTop + 70 - fingerY) / 4);
  if (fingerY > scrollerBottom - 40) return Math.min(14, (fingerY - scrollerBottom + 40) / 4);
  return 0;
}
