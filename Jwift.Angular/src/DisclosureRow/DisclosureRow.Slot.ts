/**
 * SS-Support-FAQ-2: on /support's "Getting started" FAQ list, every chevron sat on its own line above its
 * question at the far left edge, the question text ran flush with no row padding, and the ANSWERS of
 * several (unopened) questions rendered stacked below the LAST question.
 *
 * Root cause: `disclosure-row` projects its header and body (`<ng-content select="[disclosureHeader]">` /
 * `[disclosureBody]`) but provided no `Jiv` token of its own. Angular resolves a PROJECTED node's ancestor
 * DI — which is how `<jiv>`'s own `_parentJiv` (`Jiv.ts`, `skipSelf`) finds its canvas parent — against the
 * DECLARATION site (wherever `<disclosure-row>` was written, e.g. inside `<list>`), never against boxes in
 * disclosure-row's OWN template. So the projected header/body attached to whatever Jiv happened to enclose
 * `<disclosure-row>` in the consumer's markup (here, the `<list>` grandparent) — rendered as the LIST's
 * direct children, outside the row's own head/body boxes and their padding, and, because that attach runs
 * once at the content's own `ngOnInit` regardless of `disclosure-row`'s `@if (open())`, independent of
 * whether the row was ever opened.
 *
 * A single `providers: [{ provide: Jiv, useExisting: ... }]` on `disclosure-row` (the pattern `Sheet`,
 * `Card`, `List`, `Toolbar`, etc. use) cannot fix this alone: ALL of a component's projected content shares
 * ONE element injector, so one provided `Jiv` cannot hand the HEADER and the BODY two different boxes.
 * `disclosure-row` instead matches its own projected content directly (`FindSlotContent`, below) and
 * EXPLICITLY (re)parents it (`SyncSlotParent`) to the right internal box whenever either side changes —
 * the box becoming/ceasing to exist (`@if (open())`), or the content first appearing. Pure and
 * Angular-free, like `Jiv.DomOrder.ts`'s `DomReorderTarget`, so SS-Support-FAQ-2 is testable without
 * mounting Angular — see `DisclosureRow.Slot.spec.ts`.
 */

/** The minimal `JivHandle` surface `SyncSlotParent` needs — a real `JivHandle` satisfies it structurally
 *  (`AddChild` always reassigns `Parent`, removing the child from wherever it was first), so the real
 *  class never has to implement this interface explicitly. */
export interface SlotNode {
  readonly Parent: SlotNode | null;
  AddChild(child: SlotNode): void;
  RemoveChild(child: SlotNode): void;
}

/**
 * Attaches `content` to `box` when a box is live; otherwise DETACHES `content` from whatever it is
 * currently parented to (the ambient — and likely wrong — ancestor `content`'s own `ngOnInit` found
 * before disclosure-row had a chance to correct it, or a body box that just closed).
 *
 * Idempotent and order-independent: safe to call every time either `content` or `box` becomes known,
 * in whichever order they arrive in, and safe to call again with the same values (a no-op once settled).
 * `box === null` is how a closed body ends up with NO parent at all — unreachable from the canvas Root,
 * so it is not laid out or painted, rather than merely hidden.
 */
export function SyncSlotParent(content: SlotNode, box: SlotNode | null): void {
  if (box) {
    box.AddChild(content);
  } else if (content.Parent) {
    content.Parent.RemoveChild(content);
  }
}

/**
 * Picks, among disclosure-row's directly-projected content (`descendants: false`), the one whose host
 * element carries `attr` (`disclosureHeader` / `disclosureBody`). Angular's content queries can only match
 * a TYPE or a template-reference string, never a raw attribute selector — but `<ng-content select=
 * "[disclosureHeader]">` already requires that exact attribute to be present for PROJECTION to work at
 * all, so re-reading it off the DOM is zero extra authoring cost for every existing `disclosure-row` call
 * site. `hostOf` resolves a candidate's rendered host element (disclosure-row passes `JAUI_HOST_EL.get`);
 * generic over the candidate's `Node` type so callers never have to cast it to call that lookup.
 */
export function FindSlotContent<T extends { readonly Node: unknown }>(
  candidates: readonly T[],
  attr: string,
  hostOf: (node: T['Node']) => Element | undefined,
): T | null {
  for (const candidate of candidates) {
    if (hostOf(candidate.Node)?.hasAttribute(attr)) return candidate;
  }
  return null;
}
