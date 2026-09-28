/**
 * A LIST SHOWS WHAT IS HELD, NOT WHAT EXISTS.
 *
 * Merged from Admin's `CapabilityPicker` and `PickList`, which had independently converged on the same
 * shape from two different registries (a plan/role's capability set; a set's zone-link targets): the held
 * members as removable pills, plus one Add control opening a searchable, GROUPED picker over the catalog.
 * The wall of every-member-as-a-toggle-chip never renders.
 *
 * RETIRED MEMBERS ARE STILL DRAWN. A held key the catalog no longer declares is not dropped: it is on the
 * row, it is what the row means, and this is the only control that can clear it. It renders marked, and
 * removable.
 *
 * AN EMPTY CATALOG IS NOT A CATALOG THAT KNOWS NOTHING. `judgeRetired` stays false while a catalog fetch
 * is still in flight (an empty array by default in that state), so nothing is marked retired against a
 * catalog that just has not answered yet.
 */

/** One member of the catalog, or one held value. `group` heads the picker's section. */
export interface PickOption {
  key: string;
  label: string;
  /** The picker section this belongs under. Blank groups sort first. */
  group?: string;
  /** A quiet second line in the picker — what picking this actually does. */
  hint?: string;
}

/** One held member, labelled from the catalog — or marked retired when the catalog has lost it. */
export interface HeldPill { key: string; label: string; group: string; retired: boolean }
export interface PickGroup { group: string; options: PickOption[] }

/**
 * The held keys, labelled from the catalog.
 *
 * `judgeRetired` false (the default while a catalog is still loading) never marks a held key retired,
 * whatever the catalog currently holds — see the header note.
 */
export function heldPills(held: readonly string[], catalog: readonly PickOption[], judgeRetired = catalog.length > 0): HeldPill[] {
  const byKey = new Map(catalog.map((o) => [o.key, o]));
  return held.map((key) => {
    const known = byKey.get(key);
    return { key, label: known?.label ?? key, group: known?.group ?? '', retired: judgeRetired && !known };
  });
}

/**
 * The catalog minus what is already held, narrowed by `query`, grouped in the catalog's own order.
 *
 * Order is first-appearance rather than lexical on purpose: a lexical sort is what interleaved unrelated
 * keys in the capability wall this replaced, and a piece's zones belong under that piece, in the order
 * the piece declares them.
 */
export function pickerGroups(
  held: readonly string[],
  catalog: readonly PickOption[],
  query: string,
): PickGroup[] {
  const holding = new Set(held);
  const q = query.trim().toLowerCase();
  const groups: PickGroup[] = [];
  const at = new Map<string, PickGroup>();
  for (const o of catalog) {
    if (holding.has(o.key)) continue;
    if (q && !`${o.group ?? ''} ${o.label} ${o.key}`.toLowerCase().includes(q)) continue;
    const name = o.group ?? '';
    let group = at.get(name);
    if (!group) { group = { group: name, options: [] }; at.set(name, group); groups.push(group); }
    group.options.push(o);
  }
  return groups;
}
