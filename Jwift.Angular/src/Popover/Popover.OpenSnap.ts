/**
 * A POPOVER'S CONTENT STANDS WHERE IT OPENS (Drill Sentences lane DD2, item 1), pure so the rule is spec'd
 * (`Popover.OpenSnap.spec.ts`).
 *
 * Blind phone testers tapped the count wheel's − four times while it opened and nothing happened; the who
 * grid's cells did the same. Every Jaui node's box rides a rect spring (`JivAnimator`), and a node is born
 * snapped to wherever its first layout put it. A popover cannot be placed until its height is measured, so
 * its first layout stands at the outlet's corner, and the placement that follows set every node in it
 * gliding from there to its real place for about half a second. A press is judged against a node's box as
 * it stands that frame (`HitTopmost`), so the − was somewhere else under the finger, and a click needs its
 * down and its up on the same node.
 *
 * Lane CC1 answered the same slide for a menu's rows only (`RowIndicator.HasRowAt`, `PopoverTargetRect`).
 * This answers it for every child: the subtree snaps onto the placement the panel opens with, so from the
 * first placed frame each control is hit where it is drawn. A menu's glass still grows out of its anchor
 * (`Morph/GlassMorph.ts`): its own box springs from the anchor (`MorphFrom`, which outranks the snap) while the rows
 * inside it stand at their places.
 *
 * The flag goes back once the panel's own watched rect stands on the placement: the worker has solved that
 * frame, so content that moves later (a menu pushing a page, a row's highlight sliding) springs as before.
 * A flag cleared on a clock instead could reach the worker before the frame it was meant for
 * (`RowIndicator._hover`'s own note).
 */

/** The part of a Jaui node this needs: its own snap flag and its children (`JivHandle`). */
export interface SnapNode {
  SnapLayout: boolean;
  readonly Children: readonly SnapNode[];
}

/** A rect within this many px of the placement counts as standing on it. */
const LANDED_PX = 0.5;

export class OpenSnap {
  /** The nodes this snapped, so the release gives back only what it took. Null while nothing is held. */
  private _held: SnapNode[] | null = null;

  /** Whether the subtree is held snapped. */
  get Holding(): boolean { return this._held !== null; }

  /** Snaps `root` and every node under it, before the placement that moves them is written. A node that was
   *  already snapping on its own account is left to it. */
  Hold(root: SnapNode): void {
    const held: SnapNode[] = this._held ?? [];
    const stack: SnapNode[] = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (!node.SnapLayout) { node.SnapLayout = true; held.push(node); }
      for (const child of node.Children) stack.push(child);
    }
    this._held = held;
  }

  /** Lets the subtree spring again once the panel's box (`at`, as last reported) stands on `placed`. True
   *  when it let go. */
  ReleaseOn(at: { readonly X: number; readonly Y: number }, placed: { readonly X: number; readonly Y: number }): boolean {
    if (!this._held) return false;
    if (Math.abs(at.X - placed.X) > LANDED_PX || Math.abs(at.Y - placed.Y) > LANDED_PX) return false;
    for (const node of this._held) node.SnapLayout = false;
    this._held = null;
    return true;
  }
}
