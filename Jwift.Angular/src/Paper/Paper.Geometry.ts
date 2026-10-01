/**
 * Paper's concentric radius chain — pure, so it is cheap to pin in a spec without standing up the
 * engine. The house rule throughout Jwift: a child's radius is its parent's radius minus the gap
 * between them (Jaui Core/Glass.md's concentric corners).
 */

/** Paper's own radius: the app's outer screen corner, less how far in the paper sits (its `Inset`). */
export function PaperRadius(screenRadius: number, inset: number): number {
  return screenRadius - inset;
}

/** A row drawn inside paper's own padding: paper's radius, less that padding. */
export function RowRadius(paperRadius: number, padding: number): number {
  return paperRadius - padding;
}
