/**
 * THE ROOM THE ACTION BAR'S PILLS MAY TAKE, pure so the rule is spec'd rather than trusted
 * (`GlassActionBar.Room.spec.ts`). The toolbar's inner width, less the leading cluster, the gap before the
 * bar, and every other child the trailing cluster holds beside the bar (a page's own compact undo group on a
 * phone, a presence pill), each with the cluster's own gap.
 *
 * Drill Sentences lane AA1, item 6 (a blind phone tester: the show's title truncated while there was room):
 * the trailing cluster's other children were never counted, so the bar unfolded a group into width that was
 * not there. The row overflowed, the leading cluster gave way (its title truncates), and measured squeezed it
 * left the bar exactly the room the bar had taken: the fold that would have given the title back never came.
 */
export interface BarRoomInput {
  /** The toolbar's own width less its padding. */
  readonly InnerWidth: number;
  /** The leading cluster as measured now. */
  readonly LeadingWidth: number;
  /** The gap between the leading cluster and the bar. */
  readonly PillGap: number;
  /** Every other child of the trailing cluster, as measured now (zero for one not laid out yet). */
  readonly SiblingWidths: readonly number[];
  /** The trailing cluster's own gap between its children. */
  readonly TrailingGap: number;
}

export function BarRoom(o: BarRoomInput): number {
  let siblings = 0;
  for (const w of o.SiblingWidths) if (w > 0) siblings += w + o.TrailingGap;
  return Math.max(0, o.InnerWidth - o.LeadingWidth - o.PillGap - siblings);
}
